require("./index.js")({
  heapStatistics: ["total_heap_size"],
  heapSpaceStatistics: ["space_size"]
}, function(err, agent) {
  "use strict";
  if (err) {
    throw err;
  } else {
    agent.on("write", function() {
      console.log("write");
    });
    agent.on("collectGC", function() {
      console.log("collectGC");
    });
    //agent.on("collect", function() {
    //  console.log("collect");
    //});
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
