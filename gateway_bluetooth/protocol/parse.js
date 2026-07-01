// gateway_bluetooth/protocol/parse.js

function safeInt(value, fallback) {
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function parseIncomingData(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("|");

  // ACK|SWITCH|<id>|<state>
  if (parts[0] === "ACK" && parts[1] === "SWITCH" && parts.length >= 4) {
    return {
      type: "ack",
      device: "switch",
      id: safeInt(parts[2], 0),
      state: parts[3],
    };
  }

  // STATUS|SWITCH|<id>|<angle>|<state>|<ts>
  if (parts[0] === "STATUS" && parts[1] === "SWITCH" && parts.length >= 6) {
    return {
      type: "status",
      device: "switch",
      id: safeInt(parts[2], 0),
      angle: safeInt(parts[3], 0),
      state: parts[4],
      timestamp: safeInt(parts[5], 0),
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
      x: safeInt(parts[3], 0),
      y: safeInt(parts[4], 0),
      load: safeInt(parts[6], 0),
      battery: safeInt(parts[8], 0),
      timestamp: safeInt(parts[10], 0),
    };
  }

  return { type: "unknown", raw: trimmed };
}

module.exports = { parseIncomingData };