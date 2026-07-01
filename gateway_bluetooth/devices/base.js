// gateway_bluetooth/devices/base.js

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { CONFIG, logger } = require("../config");
const { parseIncomingData } = require("../protocol");

class BluetoothDeviceBase {
  constructor(name, macAddress, type) {
    this.name = name;
    this.macAddress = macAddress;
    this.type = type;
    this.port = null;
    this.parser = null;
    this.connected = false;
    this.reconnectTimer = null;
    this.lastSeen = null;
  }

  async connect() {
    try {
      const portPath = await this.findSerialPort();

      if (!portPath) {
        if (CONFIG.simulationMode) {
          this.connected = true;
          this.lastSeen = Date.now();
          logger.info(`[SIM] ${this.name} conectado virtualmente`);
          this.onStartSimulation();
          return true;
        }
        logger.warn(`${this.name} nao encontrado. Reconectando...`);
        this.scheduleReconnect();
        return false;
      }

      this.port = new SerialPort({
        path: portPath,
        baudRate: CONFIG.serialBaud,
        autoOpen: false,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

      this.port.open((err) => {
        if (err) {
          logger.error(`Erro ao abrir ${portPath}: ${err.message}`);
          this.scheduleReconnect();
          return;
        }

        this.connected = true;
        this.lastSeen = Date.now();
        logger.info(`Conectado a ${this.name} em ${portPath}`);

        this.onDeviceConnected(portPath);

        this.parser.on("data", (data) => this.handleIncomingData(data));
        this.port.on("close", () => {
          logger.warn(`Conexao fechada: ${this.name}`);
          this.connected = false;
          this.scheduleReconnect();
        });
        this.port.on("error", (err) =>
          logger.error(`Erro na porta ${this.name}: ${err.message}`),
        );
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao conectar ${this.name}: ${error.message}`);
      this.scheduleReconnect();
      return false;
    }
  }

  handleIncomingData(data) {
    const trimmed = data.trim();
    if (!trimmed) return;

    this.lastSeen = Date.now();
    logger.debug(`[${this.name}] RX: ${trimmed}`);

    const parsed = parseIncomingData(trimmed);
    if (parsed) {
      this.onDataParsed(parsed);
    }
  }

  onDataParsed(parsed) {
    // Override in subclass
  }

  onDeviceConnected(portPath) {
    // Override in subclass
  }

  onStartSimulation() {
    // Override in subclass
  }

  sendCommand(encoded) {
    if (!this.connected) {
      logger.error(`Offline: ${this.name}`);
      return false;
    }

    if (CONFIG.simulationMode && !this.port) {
      logger.info(`[SIM] ${this.name} TX: ${encoded}`);
      this.onSimCommand(encoded);
      return true;
    }

    const cmd = encoded.endsWith("\n") ? encoded : encoded + "\n";
    this.port.write(cmd, (err) => {
      if (err) logger.error(`Erro TX ${this.name}: ${err.message}`);
      else logger.info(`[${this.name}] TX: ${encoded}`);
    });
    return true;
  }

  onSimCommand(encoded) {
    // Override in subclass
  }

  async findSerialPort() {
    try {
      const ports = await SerialPort.list();
      const rfcommPorts = ports.filter((p) => p.path.includes("rfcomm"));

      if (rfcommPorts.length === 0) return null;
      if (rfcommPorts.length === 1) return rfcommPorts[0].path;

      // Try to match by MAC address in pnpId or serialNumber
      if (this.macAddress) {
        const macNormalized = this.macAddress.replace(/:/g, "").toLowerCase();
        const match = rfcommPorts.find((p) => {
          const pnpId = (p.pnpId || "").toLowerCase().replace(/:/g, "");
          const serial = (p.serialNumber || "").toLowerCase().replace(/:/g, "");
          return pnpId.includes(macNormalized) || serial.includes(macNormalized);
        });
        if (match) return match.path;
      }

      // Fallback: return first available
      return rfcommPorts[0].path;
    } catch (e) {
      return null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.connected) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      logger.info(`Reconectando ${this.name}...`);
      this.connect();
    }, CONFIG.reconnectInterval);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.port) this.port.close();
    this.connected = false;
  }
}

module.exports = { BluetoothDeviceBase };
