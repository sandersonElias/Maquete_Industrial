import React, { useRef } from "react";
import { View, Text, PanResponder, StyleSheet } from "react-native";
import { C, DPAD_SIZE, GESTURE_THRESHOLD } from "../constants/theme";
import { encodeGestureToCommand } from "../protocol/commands";

const THROTTLE_MS = 100;

export default function DPad({ onSend, directionLabel }) {
  const lastSentRef = useRef({ time: 0, cmd: "" });

  const throttledSend = (cmd, label) => {
    const now = Date.now();
    const elapsed = now - lastSentRef.current.time;
    if (elapsed < THROTTLE_MS && lastSentRef.current.cmd === cmd) return;
    lastSentRef.current = { time: now, cmd };
    onSend(cmd, label);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const { cmd, label } = encodeGestureToCommand(dx, dy, GESTURE_THRESHOLD);
        throttledSend(cmd, label);
      },
      onPanResponderRelease: () => {
        lastSentRef.current = { time: 0, cmd: "" };
        onSend("SC", "PARADO");
      },
    }),
  ).current;

  return (
    <View style={styles.dpadSection}>
      <Text style={styles.sectionTitle}>MOVIMENTO</Text>
      <View style={styles.dpadWrap}>
        <View
          style={[styles.dpad, { width: DPAD_SIZE, height: DPAD_SIZE }]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.dpadCell, styles.dpadUp]}>
            <Text style={styles.dpadArrow}>▲</Text>
          </View>
          <View style={styles.dpadRow}>
            <View style={[styles.dpadCell, styles.dpadLeft]}>
              <Text style={styles.dpadArrow}>◀</Text>
            </View>
            <View style={[styles.dpadCell, styles.dpadCenter]}>
              <View style={styles.dpadDot} />
            </View>
            <View style={[styles.dpadCell, styles.dpadRight]}>
              <Text style={styles.dpadArrow}>▶</Text>
            </View>
          </View>
          <View style={[styles.dpadCell, styles.dpadDown]}>
            <Text style={styles.dpadArrow}>▼</Text>
          </View>
        </View>
      </View>
      <Text style={styles.dpadStatus}>{directionLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dpadSection: { width: 200, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: C.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  dpadWrap: { alignItems: "center", justifyContent: "center" },
  dpad: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.border,
    overflow: "hidden",
  },
  dpadRow: { flexDirection: "row", flex: 1 },
  dpadCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  dpadUp: { flex: 1, backgroundColor: C.fwd + "25" },
  dpadDown: { flex: 1, backgroundColor: C.rev + "25" },
  dpadLeft: { flex: 1, backgroundColor: C.left + "25" },
  dpadRight: { flex: 1, backgroundColor: C.right + "25" },
  dpadCenter: { width: 40, backgroundColor: C.card },
  dpadDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  dpadArrow: { fontSize: 22, color: C.text },
  dpadStatus: { color: C.glow, fontSize: 12, fontWeight: "900", marginTop: 10 },
});
