// gateway_bluetooth/simulation/ferrovia.js

function createFerroviaMock(device) {
  return {
    start() {
      device.onStartSimulation();
    },
    stop() {
      if (device.simTimer) clearInterval(device.simTimer);
    },
  };
}

module.exports = { createFerroviaMock };
