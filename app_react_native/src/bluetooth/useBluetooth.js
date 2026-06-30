import { useContext } from "react";
import { BluetoothContext } from "./BluetoothProvider";

export default function useBluetooth() {
  const ctx = useContext(BluetoothContext);
  if (!ctx) throw new Error("useBluetooth must be used within BluetoothProvider");
  return ctx;
}
