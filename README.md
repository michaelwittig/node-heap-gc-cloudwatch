[![Build Status](https://secure.travis-ci.org/michaelwittig/node-heap-gc-cloudwatch.png)](http://travis-ci.org/michaelwittig/node-heap-gc-cloudwatch)
[![NPM version](https://badge.fury.io/js/node-heap-gc-cloudwatch.png)](http://badge.fury.io/js/node-heap-gc-cloudwatch)
[![NPM dependencies](https://david-dm.org/michaelwittig/node-heap-gc-cloudwatch.png)](https://david-dm.org/michaelwittig/node-heap-gc-cloudwatch)

# node-heap-gc-cloudwatch

Send v8 heap statistics and garbage collection statistics to CloudWatch.

## Getting started

Install the module:

```
npm install node-heap-gc-cloudwatch
```

In your app, create and start an agent:

```javascript
var config = {};
require("node-heap-gc-cloudwatch")(config, function(err, agent) {
  if (err) {
    throw err;
  } else {
    agent.on("error", function(err) {
      console.log("error", err);
    });
    agent.start(function(err) {
      if (err) {
        throw err;
      } else {
        console.log("started");
      }
    });
  }
});
```

After ~1 minute you will see the first metrics in CloudWatch under the `node` name space.

## Configuration

* `collectInterval`: Number - Collect new heap statistics every `collectInterval` ms (default `1000`)
* `writeInterval`: Number - Send metric to CloudWatch every `writeInterval` ms (default `60000`)
* `heapStatistics`: Array[String] - Values to report to CloudWatch from [v8.getHeapStatistics()](https://nodejs.org/api/v8.html#v8_getheapstatistics) (default `["total_heap_size", "total_heap_size_executable", "total_physical_size", "total_available_size", "used_heap_size", "heap_size_limit"]`)
* `heapSpaceStatistics`: Array[String] - Values to report to CloudWatch from [v8.getHeapSpaceStatistics()](https://nodejs.org/api/v8.html#v8_getheapspacestatistics) (default `["space_size", "space_used_size", "space_available_size", "physical_space_size"]`)
* `cloudwatch`: [AWS.CloudWatch](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#constructor-property) - CloudWatch service object (default `new AWS.CloudWatch()`)
* `namespace`: String - The namespace for the metric data (default `node`)
* `dimensions`: Object[String, String] - Add additional dimensions like `{Application: "webshop", Environment: "production"}`. (default `{}`)
* `addProcessIdDimension`: Boolean - If true, adds the `ProcessId` dimension with the value of `process.pid` (default `false`)
* `addInstanceIdDimension`: Boolean -  If true, adds the `InstanceId` dimension with the value of the EC2 instance id (default `false`)

**Important**

[CloudWatch treats each unique combination of dimensions as a separate metric](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_concepts.html#Dimension). For information on how this affects pricing, see the Amazon CloudWatch product information page.
