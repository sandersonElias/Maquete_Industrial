import React from "react";
import { StatusBar } from "react-native";
import { BluetoothProvider } from "./src/bluetooth/BluetoothProvider";
import ControlScreen from "./src/screens/ControlScreen";

export default function App() {
  return (
    <BluetoothProvider>
      <StatusBar hidden />
      <ControlScreen />
    </BluetoothProvider>
  );
}
