// gateway_bluetooth/protocol/parse.js

function parseIncomingData(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("|");

  // ACK|SWITCH|<id>|<state>
  if (parts[0] === "ACK" && parts[1] === "SWITCH" && parts.length >= 4) {
    return {
      type: "ack",
      device: "switch",
      id: parseInt(parts[2]),
      state: parts[3],
    };
  }

  // STATUS|SWITCH|<id>|<angle>|<state>|<ts>
  if (parts[0] === "STATUS" && parts[1] === "SWITCH" && parts.length >= 6) {
    return {
      type: "status",
      device: "switch",
      id: parseInt(parts[2]),
      angle: parseInt(parts[3]),
      state: parts[4],
      timestamp: parseInt(parts[5]),
    };
  }

  // ACK|TRUCK|<action>|OK
  if (parts[0] === "ACK" && parts[1] === "TRUCK" && parts.length >= 4) {
    return {
      type: "ack",
      device: "truck",
      action: parts[2],
      ok: parts[3] === "OK",
    };
  }

  // STATUS|TRUCK|POS|x|y|LOAD|load|BAT|bat|TS|ts
  if (parts[0] === "STATUS" && parts[1] === "TRUCK" && parts[2] === "POS") {
    return {
      type: "status",
      device: "truck",
      x: parseInt(parts[3]),
      y: parseInt(parts[4]),
      load: parseInt(parts[6]),
      battery: parseInt(parts[8]),
      timestamp: parseInt(parts[10]),
    };
  }

  return { type: "unknown", raw: trimmed };
}

module.exports = { parseIncomingData };