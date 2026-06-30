import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../constants/theme";
import { CMD } from "../protocol/commands";
import useBluetooth from "../bluetooth/useBluetooth";
import Header from "../components/Header";
import DPad from "../components/DPad";
import BucketControls from "../components/BucketControls";
import LightingControls from "../components/LightingControls";
import CommandMonitor from "../components/CommandMonitor";
import DevicePickerModal from "../components/DevicePickerModal";

export default function ControlScreen() {
  const {
    connected,
    device,
    paired,
    showModal,
    setShowModal,
    connecting,
    lastCmd,
    listPaired,
    connectTo,
    disconnect,
    send,
  } = useBluetooth();

  const [dpadDir, setDpadDir] = useState("PARADO");
  const [bucketState, setBucketState] = useState("PARADO");
  const [headlightsOn, setHeadlightsOn] = useState(false);
  const [turnSignal, setTurnSignal] = useState("X");

  const handleConnectPress = () => {
    if (connected) {
      disconnect();
    } else {
      listPaired();
    }
  };

  const handleDpadSend = (cmd, label) => {
    send(cmd);
    setDpadDir(label);
  };

  const handleBucketUp = () => {
    send(CMD.BUCKET_UP);
    setBucketState("SUBINDO");
  };

  const handleBucketDown = () => {
    send(CMD.BUCKET_DOWN);
    setBucketState("DESCENDO");
  };

  const handleBucketStop = () => {
    send(CMD.BUCKET_STOP);
    setBucketState("PARADO");
  };

  const handleToggleHeadlights = () => {
    setHeadlightsOn(!headlightsOn);
    send(CMD.HEADLIGHT);
  };

  const handleTurnLeft = () => {
    setTurnSignal("I");
    send(CMD.TURN_LEFT);
  };

  const handleTurnOff = () => {
    setTurnSignal("X");
    send(CMD.TURN_OFF);
  };

  const handleTurnRight = () => {
    setTurnSignal("O");
    send(CMD.TURN_RIGHT);
  };

  return (
    <View style={styles.root}>
      <Header
        connected={connected}
        deviceName={device?.name}
        connecting={connecting}
        onConnectPress={handleConnectPress}
      />

      <View style={styles.content}>
        <DPad onSend={handleDpadSend} directionLabel={dpadDir} />

        <View style={styles.centerSection}>
          <BucketControls
            connected={connected}
            bucketState={bucketState}
            onUp={handleBucketUp}
            onDown={handleBucketDown}
            onStop={handleBucketStop}
          />

          <LightingControls
            connected={connected}
            headlightsOn={headlightsOn}
            turnSignal={turnSignal}
            onToggleHeadlights={handleToggleHeadlights}
            onTurnLeft={handleTurnLeft}
            onTurnOff={handleTurnOff}
            onTurnRight={handleTurnRight}
          />

          <CommandMonitor lastCmd={lastCmd} />
        </View>
      </View>

      <DevicePickerModal
        visible={showModal}
        pairedDevices={paired}
        onSelect={connectTo}
        onCancel={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, flexDirection: "row", padding: 15, gap: 15 },
  centerSection: { flex: 1, justifyContent: "center", gap: 12 },
});
