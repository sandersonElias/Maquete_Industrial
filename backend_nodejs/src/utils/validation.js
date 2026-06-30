function isValidSwitchAction(action) {
  return ["LEFT", "RIGHT", "CENTER"].includes(action);
}

function isValidTruckCommand(command) {
  const valid = [
    // Comandos simples (legado)
    "F", "B", "S", "L", "R", "C", "U", "D", "X",
    // Parada total
    "SC",
    // Comandos compostos (motor + direção)
    "FL", "FR", "BL", "BR",
    // Comandos de LED
    "HH", "TI", "TO", "TX"
  ];
  return valid.includes(command);
}

module.exports = {
  isValidSwitchAction,
  isValidTruckCommand,
};
