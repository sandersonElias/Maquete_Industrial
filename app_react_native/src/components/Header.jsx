import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../constants/theme";

export default function Header({ connected, deviceName, connecting, onConnectPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.appTitle}>
        MAQUETE<Text style={styles.appTitleAccent}> RC</Text>
      </Text>
      <TouchableOpacity
        style={[styles.btnConn, connected && styles.btnConnActive]}
        onPress={onConnectPress}
        disabled={connecting}
      >
        <Text style={styles.btnConnText}>
          {connected ? `● ${deviceName}` : "⚡ CONECTAR"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  appTitle: { fontSize: 18, fontWeight: "900", color: C.text },
  appTitleAccent: { color: C.glow },
  btnConn: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnConnActive: { borderColor: C.conn },
  btnConnText: { color: C.text, fontSize: 10, fontWeight: "700" },
});
