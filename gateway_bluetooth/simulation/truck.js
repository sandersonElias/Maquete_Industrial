// gateway_bluetooth/simulation/truck.js

function createTruckMock(device) {
  return {
    start() {
      device.onStartSimulation();
    },
    stop() {
      if (device.simTimer) clearInterval(device.simTimer);
    },
  };
}

module.exports = { createTruckMock };
