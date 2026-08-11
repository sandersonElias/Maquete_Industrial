const { CONFIG, logger } = require("../config");
const { FerroviaDevice } = require("./ferrovia");
const { TruckDevice } = require("./truck");

class DeviceManager {
  constructor(onDataCallback) {
    this.devices = new Map();
    this.onDataCallback = onDataCallback;
  }

  init() {
    for (const def of CONFIG.devices) {
      let device;
      if (def.type === "ferrovia") {
        device = new FerroviaDevice(def.name, def.mac);
      } else if (def.type === "truck") {
        device = new TruckDevice(def.name, def.mac);
      } else {
        logger.warn(`Tipo desconhecido: ${def.type}`);
        continue;
      }

      const key = def.name.toLowerCase().replace(/_/g, "");
      this.devices.set(key, device);

      device.onDataParsed = (parsed, rawData) => {
        this.onDataCallback("device:parsed", {
          deviceName: def.name,
          deviceType: def.type,
          parsed,
          rawData,
        });
      };

      device.onDeviceConnected = (portPath) => {
        this.onDataCallback("device:connected", {
          deviceName: def.name,
          macAddress: def.mac,
          type: def.type,
          port: portPath,
        });
      };

      logger.info(`Device registrado: ${def.name} (${def.type})`);
      device.connect();
    }
  }

  getAll() {
    return Array.from(this.devices.values());
  }

  getByName(name) {
    const key = name.toLowerCase().replace(/_/g, "");
    return this.devices.get(key) || null;
  }

  getByType(type) {
    return this.getAll().filter((d) => d.type === type);
  }

  resolveTarget(target) {
    if (!target) return null;
    if (target === "ferrovia" || target === "FERROVIA_SW") {
      return this.getByType("ferrovia")[0] || null;
    }
    if (target.startsWith("TRUCK")) {
      return this.getByType("truck")[0] || null;
    }
    return this.getByName(target);
  }

  disconnectAll() {
    this.devices.forEach((d) => d.disconnect());
  }
}

module.exports = { DeviceManager };
