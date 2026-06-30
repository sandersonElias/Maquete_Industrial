import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../constants/theme";

export default function LightingControls({
  connected,
  headlightsOn,
  turnSignal,
  onToggleHeadlights,
  onTurnLeft,
  onTurnOff,
  onTurnRight,
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>ILUMINAÇÃO</Text>
      <TouchableOpacity
        style={[styles.btnAction, headlightsOn && styles.btnLedOn]}
        onPress={onToggleHeadlights}
        disabled={!connected}
      >
        <Text style={styles.btnActionText}>
          💡 FARÓIS {headlightsOn ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>
      <View style={styles.turnRow}>
        <TouchableOpacity
          style={[styles.btnSmall, turnSignal === "I" && styles.btnTurnOn]}
          onPress={onTurnLeft}
          disabled={!connected}
        >
          <Text style={styles.btnSmallText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSmall, styles.btnStop]}
          onPress={onTurnOff}
          disabled={!connected}
        >
          <Text style={styles.btnSmallText}>■</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSmall, turnSignal === "O" && styles.btnTurnOn]}
          onPress={onTurnRight}
          disabled={!connected}
        >
          <Text style={styles.btnSmallText}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  boxLabel: { color: C.textDim, fontSize: 10, fontWeight: "800", marginBottom: 8 },
  btnAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnActionText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
  btnLedOn: { backgroundColor: C.headlight + "40", borderWidth: 1, borderColor: C.headlight },
  turnRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  btnSmall: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  btnTurnOn: { backgroundColor: C.turnSignal + "40", borderColor: C.turnSignal },
  btnStop: { backgroundColor: C.stop + "30", borderColor: C.stop },
  btnSmallText: { color: C.text, fontSize: 12, fontWeight: "700" },
});
