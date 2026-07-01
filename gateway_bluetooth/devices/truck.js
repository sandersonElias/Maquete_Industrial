// gateway_bluetooth/devices/truck.js

const { BluetoothDeviceBase } = require("./base");
const { encodeTruckCommand } = require("../protocol");
const { CONFIG, logger } = require("../config");

class TruckDevice extends BluetoothDeviceBase {
  constructor(name, macAddress) {
    super(name, macAddress, "truck");
    this.position = { x: 50, y: 50 };
    this.load = 0;
    this.battery = 100;
    this.simTimer = null;
  }

  onDataParsed(parsed) {
    if (parsed.type === "ack" && parsed.device === "truck") {
      logger.info(`[TRUCK] ACK ${parsed.action}: ${parsed.ok ? "OK" : "FAIL"}`);
    }

    if (parsed.type === "status" && parsed.device === "truck") {
      this.position = { x: parsed.x, y: parsed.y };
      this.load = parsed.load;
      this.battery = parsed.battery;
    }
  }

  sendTruckCommand(action) {
    const encoded = encodeTruckCommand(action);
    if (!encoded) {
      logger.warn(`[TRUCK] Comando invalido: ${action}`);
      return false;
    }
    return this.sendCommand(encoded);
  }

  onSimCommand(encoded) {
    const action = encoded;
    setTimeout(() => {
      this.handleIncomingData(`ACK|TRUCK|${action}|OK`);
    }, 300);
  }

  onStartSimulation() {
    this.simTimer = setInterval(() => {
      this.position.x += Math.floor(Math.random() * 5) - 2;
      this.position.y += Math.floor(Math.random() * 5) - 2;
      this.position.x = Math.max(0, Math.min(100, this.position.x));
      this.position.y = Math.max(0, Math.min(100, this.position.y));

      this.load = Math.max(0, Math.min(100, this.load + Math.floor(Math.random() * 10) - 5));

      // Battery: drain randomly, recharge slowly
      if (Math.random() > 0.3) {
        this.battery = Math.max(0, this.battery - 1);
      } else if (this.battery < 100) {
        this.battery = Math.min(100, this.battery + 2);
      }

      const mockData = `STATUS|TRUCK|POS|${this.position.x}|${this.position.y}|LOAD|${this.load}|BAT|${this.battery}|TS|${Date.now()}`;
      this.handleIncomingData(mockData);
    }, CONFIG.simulation.truckInterval);
  }

  disconnect() {
    if (this.simTimer) clearInterval(this.simTimer);
    super.disconnect();
  }
}

module.exports = { TruckDevice };
