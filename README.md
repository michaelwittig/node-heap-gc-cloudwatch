[![Build Status](https://secure.travis-ci.org/michaelwittig/node-heap-gc-cloudwatch.png)](http://travis-ci.org/michaelwittig/node-heap-gc-cloudwatch)
[![NPM version](https://badge.fury.io/js/node-heap-gc-cloudwatch.png)](http://badge.fury.io/js/node-heap-gc-cloudwatch)
[![NPM dependencies](https://david-dm.org/michaelwittig/node-heap-gc-cloudwatch.png)](https://david-dm.org/michaelwittig/node-heap-gc-cloudwatch)

# node-heap-gc-cloudwatch

Send v8 heap statistics and garbage collection statistice to CloudWatch.

## Getting started

Install the module:

```
npm install node-heap-gc-cloudwatch
```

In your app, create and start an agent:

```javascript
var config = {};
require("node-heap-gc-cloudwatch")(config, function(err, agent) {
  "use strict";
  if (err) {
    throw err;
  } else {
    agent.on("error", function(err) {
      console.log("error", err);
    });
    agent.start(function(err) {
      console.log("started");
    });
  }
});
```

after ~1 minute you will see the first metrics in CloudWatch under the `node` namespace.

## Configuration

* `collectInterval`: Number - Collect new heap statistics every `collectInterval` ms (default `1000`)
* `writeInterval`: Number - Send metric to CloudWatch every `writeInterval` ms (default `60000`)
* `heapStatistics`: Array[String] - Values to report to CloudWatch from [v8.getHeapStatistics()](https://nodejs.org/api/v8.html#v8_getheapstatistics) (default `["total_heap_size", "total_heap_size_executable", "total_physical_size", "total_available_size", "used_heap_size", "heap_size_limit"]`)
* `heapSpaceStatistics`: Array[String] - Values to report to CloudWatch from [v8.getHeapSpaceStatistics()](https://nodejs.org/api/v8.html#v8_getheapspacestatistics) (default `["space_size", "space_used_size", "space_available_size", "physical_space_size"]`)
* `cloudwatch`: 
* `namespace`: String - The namespace for the metric data (default `node`)
* `dimensions`: Object[String, String] - TODO (default `{}`)
* `addProcessIdDimension`: Boolean - TODO (default `false`)
* `addInstanceIdDimension`: Boolean -  TODO (default `false`)
