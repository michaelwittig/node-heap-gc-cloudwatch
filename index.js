var v8 = require("v8");
var EventEmitter =  require("events");

var AWS = require("aws-sdk");
var async = require("neo-async");
var merge = require("merge");
var gc = require("gc-stats")();

var COLLECT_INTERVAL = 1000;
var WRITE_INTERVAL = 60000;
var HEAP_STATISTICS = ["total_heap_size", "total_heap_size_executable", "total_physical_size", "total_available_size", "used_heap_size", "heap_size_limit"];
var HEAP_SPACE_STATISTICS = ["space_size", "space_used_size", "space_available_size", "physical_space_size"];
var NAMESPACE = "node";

function chunk(arr, n) {
  "use strict";
  var i, j, temparray = [], chunk = n;
  for (i = 0, j = arr.length; i < j; i += chunk) {
    temparray.push(arr.slice(i, i + chunk));
  }
  return temparray;
}

module.exports = function(config, cb) {
  "use strict";
  config = config || {};
  var collectInterval = config.collectInterval || COLLECT_INTERVAL;
  var writeInterval = config.writeInterval || WRITE_INTERVAL;
  var heapStatistics = config.heapStatistics || HEAP_STATISTICS;
  var heapSpaceStatistics = config.heapSpaceStatistics || HEAP_SPACE_STATISTICS;
  var cloudwatch = config.cloudwatch || new AWS.CloudWatch();
  var namespace = config.namespace || NAMESPACE;
  var customDimensions = merge({}, config.dimensions) || {};

  var emitter = new EventEmitter();
  var collectIntervalObject;
  var writeIntervalObject;
  var data = {};

  function write(cb) {
    emitter.emit("write");
    var metricData = [];
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var d = data[key];
        var dimensions = merge({}, customDimensions, d.additionalDimensions);
        var metricDimensions = [];
        for (var name in dimensions) {
          if (dimensions.hasOwnProperty(name)) {
            var value = dimensions[name];
            metricDimensions.push({Name: name, Value: value});
          }
        }
        metricData.push({
          MetricName: d.metric,
          Dimensions: metricDimensions,
          StatisticValues: {
            Maximum: d.maximum,
            Minimum: d.minimum,
            SampleCount: d.count,
            Sum: d.sum
          },
          Timestamp: d.timestamp,
          Unit: d.unit
        });
      }
    }
    data = {};
    async.eachLimit(chunk(metricData, 10), 2, function(metricDataJunk, cb) {
      var params = {
        MetricData: metricDataJunk,
        Namespace: namespace
      };
      cloudwatch.putMetricData(params, cb);
    }, cb);
  }

  function wrappedWrite() {
    write(function(err) {
      if (err) {
        emitter.emit("error", err);
      }
    });
  }

  function dataKey(additionalDimensions, metric) {
    var arr = [];
    for (var name in additionalDimensions) {
      if (additionalDimensions.hasOwnProperty(name)) {
        var value = additionalDimensions[name];
        arr.push(name + ":" + value);
      }
    }
    arr.sort();
    return metric + "-" + arr.join("-");
  }

  function report(additionalDimensions, metric, value, unit) {
    var key = dataKey(additionalDimensions, metric);
    var d = data[key];
    if (d === undefined) {
      d = {
        additionalDimensions: additionalDimensions,
        metric: metric,
        timestamp: new Date(),
        maximum: Number.NEGATIVE_INFINITY,
        minimum: Number.POSITIVE_INFINITY,
        count: 0,
        sum: 0,
        unit: unit
      };
    }
    if (value > d.maximum) {
      d.maximum = value;
    }
    if (value < d.minimum) {
      d.minimum = value;
    }
    d.count += 1;
    d.sum += value;
    data[key] = d;
  }

  function collect() {
    emitter.emit("collect");
    var hs = v8.getHeapStatistics();
    heapStatistics.forEach(function(s) {
      report({}, s, hs[s], "Bytes");
    });
    var hss = v8.getHeapSpaceStatistics();
    hss.forEach(function(hs) {
      heapSpaceStatistics.forEach(function(s) {
        report({"SpaceName": hs.space_name}, s, hs[s], "Bytes");
      });
    });
  }

  function gcType2String(gctype) {
    if (gctype === 1) {
      return "minor";
    } else if (gctype === 2) {
      return "major";
    } else if (gctype === 4) {
      return "incremental";
    } else if (gctype === 8) {
      return "weakcallbacks";
    } else {
      emitter.emit("error", new Error("unsupported gctype: " + gctype));
      return "unknown";
    }
  }

  function collectGC(stats) {
    emitter.emit("collectGC");
    if (heapStatistics.indexOf("total_heap_size") !== -1) {
      report({}, "total_heap_size", stats.before.totalHeapSize, "Bytes");
    }
    if (heapStatistics.indexOf("total_heap_size_executable") !== -1) {
      report({}, "total_heap_size_executable", stats.before.totalHeapExecutableSize, "Bytes");
    }
    if (heapStatistics.indexOf("used_heap_size") !== -1) {
      report({}, "used_heap_size", stats.before.usedHeapSize, "Bytes");
    }
    if (heapStatistics.indexOf("heap_size_limit") !== -1) {
      report({}, "heap_size_limit", stats.before.heapSizeLimit, "Bytes");
    }
    report({"Type": gcType2String(stats.gctype)}, "gc_pause", stats.pause / 1000, "Microseconds");
    if (heapStatistics.indexOf("total_heap_size") !== -1) {
      report({}, "total_heap_size", stats.after.totalHeapSize, "Bytes");
    }
    if (heapStatistics.indexOf("total_heap_size_executable") !== -1) {
      report({}, "total_heap_size_executable", stats.after.totalHeapExecutableSize, "Bytes");
    }
    // only available in node 0.11+
    if (heapStatistics.indexOf("total_physical_size") !== -1 && stats.after.hasOwnProperty("totalPhysicalSize")) {
      report({}, "total_physical_size", stats.after.totalPhysicalSize, "Bytes");
    }
    // only available in node 4+
    if (heapStatistics.indexOf("total_available_size") !== -1 && stats.after.hasOwnProperty("totalAvailableSize")) {
      report({}, "total_available_size", stats.after.totalAvailableSize, "Bytes");
    }
    if (heapStatistics.indexOf("used_heap_size") !== -1) {
      report({}, "used_heap_size", stats.after.usedHeapSize, "Bytes");
    }
    if (heapStatistics.indexOf("heap_size_limit") !== -1) {
      report({}, "heap_size_limit", stats.after.heapSizeLimit, "Bytes");
    }
  }

  function setup() {
    emitter.start = function(cb) {
      var collectIntervalObject = setInterval(collect, collectInterval);
      var writeIntervalObject = setInterval(wrappedWrite, writeInterval);
      gc.on("stats", collectGC);
      cb();
    };
    emitter.stop = function(cb) {
      clearInterval(collectIntervalObject);
      clearInterval(writeIntervalObject);
      gc.removeListener("stats", collectGC);
      write(cb);
    };
    cb(null, emitter);
  }

  if (config.addProcessIdDimension === true) {
    customDimensions.ProcessId = process.pid;
  }
  if (config.addInstanceIdDimension === true) {
    var metadata = new AWS.MetadataService();
    metadata.request("/latest/meta-data/instance-id", function(err, id) {
      if (err) {
        cb(err);
      } else {
        customDimensions.InstanceId = id;
        setup();
      }
    });
  } else {
    setup();
  }
};
