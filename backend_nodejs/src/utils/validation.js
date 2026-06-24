function isValidSwitchAction(action) {
  return ["LEFT", "RIGHT", "CENTER"].includes(action);
}

function isValidTruckCommand(command) {
  return ["F", "B", "S", "L", "R", "C", "U", "D", "X"].includes(command);
}

module.exports = {
  isValidSwitchAction,
  isValidTruckCommand,
};
