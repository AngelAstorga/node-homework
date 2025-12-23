const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (val) => {
  console.log("Time received: " + val);
});

const timer = setInterval(() => {
  const currentTime = new Date();
  emitter.emit("time", currentTime);
}, 5000);

timer.unref();
module.exports = emitter;
