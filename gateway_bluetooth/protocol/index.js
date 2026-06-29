// gateway_bluetooth/protocol/index.js

const { encodeSwitchCommand, encodeTruckCommand } = require("./serial");
const { parseIncomingData } = require("./parse");

module.exports = { encodeSwitchCommand, encodeTruckCommand, parseIncomingData };