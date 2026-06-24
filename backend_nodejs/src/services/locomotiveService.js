const pool = require("../config/db");

async function recordLocomotivePosition(x, y, speed, heading, trackSegment) {
  await pool.query(
    `INSERT INTO locomotive_position (x, y, speed, heading, track_segment) VALUES ($1, $2, $3, $4, $5)`,
    [x, y, speed, heading, trackSegment],
  );
  return { x, y, speed, heading, trackSegment };
}

module.exports = {
  recordLocomotivePosition,
};
