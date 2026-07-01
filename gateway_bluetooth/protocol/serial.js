// gateway_bluetooth/protocol/serial.js

function encodeSwitchCommand(switchId, action, value) {
  if (action === "ANGLE") {
    const angle = parseInt(value, 10);
    if (isNaN(angle) || angle < 0 || angle > 180) return null;
    return `CMD|SWITCH|${switchId}|ANGLE|${angle}`;
  }
  if (action === "SET" && value !== undefined && value !== null) {
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
  // Comandos simples (legado)
  const simpleActions = ["F", "B", "S", "L", "R", "C", "U", "D", "X"];
  if (simpleActions.includes(action)) {
    return action;
  }

  // Comandos compostos (motor + direção)
  const compoundActions = ["FL", "FR", "BL", "BR"];
  if (compoundActions.includes(action)) {
    return action;
  }

  // Comandos de LED
  const ledActions = ["HH", "TI", "TO", "TX"];
  if (ledActions.includes(action)) {
    return action;
  }

  return null;
}

module.exports = { encodeSwitchCommand, encodeTruckCommand };