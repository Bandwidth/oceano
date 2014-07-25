"use strict";
let sinon = require("sinon");



module.exports = {
  createRunner: function() {
    let stop = false;
    let context = {};
    let timeout = setTimeout;
    let idle = function() {
      return function(callback) {
          timeout(callback, 0);
      };
    };
    let clock = sinon.useFakeTimers();
    let tickTime = function * (tickInterval) {
      while (!stop) {
        yield idle(); //to switch context to another parallel tasks
        clock.tick(tickInterval);
      }
    };
    context.free = function() {
        clock.restore();
    };

    context.runJob = function * (tickInterval, job) {
      let jobAction = function * () {
        try {
          yield job();
        }finally {
          stop = true;
        }
      };
      return yield[tickTime(tickInterval), jobAction()];
    };
    return context;
  }
};
