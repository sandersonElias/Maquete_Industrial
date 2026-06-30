import React from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, StyleSheet } from "react-native";
import { C } from "../constants/theme";

export default function DevicePickerModal({ visible, pairedDevices, onSelect, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Bluetooth</Text>
          <Text style={styles.modalHint}>Selecione o HC-05 pareado</Text>
          <FlatList
            data={pairedDevices}
            keyExtractor={(d) => d.address}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.devItem} onPress={() => onSelect(item)}>
                <Text style={styles.devName}>{item.name || "HC-05"}</Text>
                <Text style={styles.devAddr}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "#000A", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: C.card, borderRadius: 20, padding: 25, width: "70%", maxHeight: "60%" },
  modalTitle: { fontSize: 20, fontWeight: "900", color: C.text, marginBottom: 5 },
  modalHint: { fontSize: 12, color: C.textDim, marginBottom: 15 },
  devItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  devName: { fontSize: 14, color: C.text, fontWeight: "700" },
  devAddr: { fontSize: 11, color: C.textDim },
  modalCancel: { marginTop: 15, alignItems: "center" },
  modalCancelText: { color: C.disconn, fontWeight: "700" },
});
