export const CMD = {
  FWD: "F",
  BACK: "B",
  STOP: "S",
  LEFT: "L",
  RIGHT: "R",
  CENTER: "C",
  STOP_CANCEL: "SC",
  BUCKET_UP: "U",
  BUCKET_DOWN: "D",
  BUCKET_STOP: "X",
  HEADLIGHT: "HH",
  TURN_LEFT: "TI",
  TURN_RIGHT: "TO",
  TURN_OFF: "TX",
  HAZARD: "HA",
};

export function encodeGestureToCommand(dx, dy, threshold) {
  let motor = "";
  let steer = "";
  let label = "PARADO";

  if (dy < -threshold) {
    motor = "F";
    if (dx < -threshold) {
      steer = "L";
      label = "FRENTE+ESQ";
    } else if (dx > threshold) {
      steer = "R";
      label = "FRENTE+DIR";
    } else {
      label = "FRENTE";
    }
  } else if (dy > threshold) {
    motor = "B";
    if (dx < -threshold) {
      steer = "L";
      label = "RÉ+ESQ";
    } else if (dx > threshold) {
      steer = "R";
      label = "RÉ+DIR";
    } else {
      label = "RÉ";
    }
  } else {
    if (dx < -threshold) {
      steer = "L";
      label = "ESQ";
    } else if (dx > threshold) {
      steer = "R";
      label = "DIR";
    }
  }

  return { cmd: motor + steer, label };
}
