// gateway_bluetooth/devices/ferrovia.js

const { BluetoothDeviceBase } = require("./base");
const { encodeSwitchCommand } = require("../protocol");
const { CONFIG, logger } = require("../config");

class FerroviaDevice extends BluetoothDeviceBase {
  constructor(name, macAddress) {
    super(name, macAddress, "ferrovia");
    this.switches = {};
    for (let i = 1; i <= 4; i++) {
      this.switches[i] = { angle: 90, state: "CENTER" };
    }
    this.simTimer = null;
  }

  onDataParsed(parsed) {
    if (parsed.type === "ack" && parsed.device === "switch") {
      logger.info(`[FERROVIA] ACK switch ${parsed.id}: ${parsed.state}`);
      if (this.switches[parsed.id]) {
        this.switches[parsed.id].state = parsed.state;
      }
    }

    if (parsed.type === "status" && parsed.device === "switch") {
      if (this.switches[parsed.id]) {
        this.switches[parsed.id].angle = parsed.angle;
        this.switches[parsed.id].state = parsed.state;
      }
    }
  }

  sendSwitchCommand(switchId, action, value) {
    const encoded = encodeSwitchCommand(switchId, action, value);
    return this.sendCommand(encoded);
  }

  onSimCommand(encoded) {
    const parts = encoded.split("|");
    const switchId = parts[2];
    const action = parts[3];
    const value = parts[4];

    setTimeout(() => {
      let ackState;
      if (action === "SET") ackState = value;
      else if (action === "ANGLE") ackState = `ANGLE_${value}`;
      else if (action === "RESET") ackState = "RESET";
      else if (action === "STATUS") ackState = "STATUS";
      else ackState = "UNKNOWN";

      this.handleIncomingData(`ACK|SWITCH|${switchId}|${ackState}`);
    }, 500);
  }

  onStartSimulation() {
    this.simTimer = setInterval(() => {
      const id = Math.floor(Math.random() * 4) + 1;
      const currentAngle = this.switches[id]?.angle || 90;
      const targetAngle = Math.random() > 0.5 ? 0 : 180;
      const newAngle = currentAngle + (targetAngle > currentAngle ? 10 : -10);
      const clampedAngle = Math.max(0, Math.min(180, newAngle));

      let state = "TRANSITION";
      if (clampedAngle <= 10) state = "LEFT";
      else if (clampedAngle >= 170) state = "RIGHT";
      else if (clampedAngle >= 85 && clampedAngle <= 95) state = "CENTER";

      this.switches[id] = { angle: clampedAngle, state };

      const mockData = `STATUS|SWITCH|${id}|${clampedAngle}|${state}|${Date.now()}`;
      this.handleIncomingData(mockData);
    }, CONFIG.simulation.ferroviaInterval);
  }

  disconnect() {
    if (this.simTimer) clearInterval(this.simTimer);
    super.disconnect();
  }
}

module.exports = { FerroviaDevice };
