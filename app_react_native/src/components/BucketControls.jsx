import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../constants/theme";

export default function BucketControls({ connected, bucketState, onUp, onDown, onStop }) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>CAÇAMBA</Text>
      <View style={styles.bucketRow}>
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: C.bucket }]}
          onPressIn={onUp}
          onPressOut={onStop}
          disabled={!connected}
        >
          <Text style={styles.btnActionText}>▲ SUBIR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: C.bucket }]}
          onPressIn={onDown}
          onPressOut={onStop}
          disabled={!connected}
        >
          <Text style={styles.btnActionText}>▼ DESCER</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stateText}>{bucketState}</Text>
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
  bucketRow: { flexDirection: "row", gap: 10 },
  btnAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnActionText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
  stateText: { color: C.text, fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 6 },
});
