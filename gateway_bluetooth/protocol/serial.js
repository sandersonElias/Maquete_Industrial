// gateway_bluetooth/protocol/serial.js

function encodeSwitchCommand(switchId, action, value) {
  if (action === "ANGLE" && value !== undefined) {
    return `CMD|SWITCH|${switchId}|ANGLE|${value}`;
  }
  if (action === "SET" && value) {
    return `CMD|SWITCH|${switchId}|SET|${value}`;
  }
  if (action === "STATUS") {
    return `CMD|SWITCH|${switchId}|STATUS`;
  }
  if (action === "RESET") {
    return `CMD|SWITCH|${switchId}|RESET`;
  }
  return `CMD|SWITCH|${switchId}|SET|${action}`;
}

function encodeTruckCommand(action) {
  const validActions = ["F", "B", "S", "L", "R", "C", "U", "D", "X"];
  if (!validActions.includes(action)) {
    return null;
  }
  return action;
}

module.exports = { encodeSwitchCommand, encodeTruckCommand };