import React from "react";
import { Text, StyleSheet } from "react-native";
import { C } from "../constants/theme";

export default function CommandMonitor({ lastCmd }) {
  return (
    <Text style={styles.cmdMonitor}>
      CMD: <Text style={{ color: C.glow }}>{lastCmd}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  cmdMonitor: { fontSize: 10, color: C.textDim, textAlign: "center" },
});
