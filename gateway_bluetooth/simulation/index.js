// gateway_bluetooth/simulation/index.js

const { logger } = require("../config");
const { createFerroviaMock } = require("./ferrovia");
const { createTruckMock } = require("./truck");

class SimulationManager {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
    this.mocks = [];
  }

  startAll() {
    const devices = this.deviceManager.getAll();
    for (const device of devices) {
      let mock;
      if (device.type === "ferrovia") {
        mock = createFerroviaMock(device);
      } else if (device.type === "truck") {
        mock = createTruckMock(device);
      }

      if (mock) {
        mock.start();
        this.mocks.push(mock);
        logger.info(`Simulacao iniciada: ${device.name}`);
      }
    }
  }

  stopAll() {
    this.mocks.forEach((m) => m.stop());
    this.mocks = [];
  }
}

module.exports = { SimulationManager };
