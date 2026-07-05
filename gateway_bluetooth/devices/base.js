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
      this.onDataParsed(parsed, trimmed);
    }
  }

  onDataParsed(parsed, rawData) {
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
      // Manual override: skip auto-detection
      if (CONFIG.serialPort) {
        logger.info(`Usando porta serial manual: ${CONFIG.serialPort}`);
        return CONFIG.serialPort;
      }

      const ports = await SerialPort.list();

      // Linux: rfcomm ports
      const rfcommPorts = ports.filter((p) => p.path.includes("rfcomm"));
      if (rfcommPorts.length > 0) {
        if (rfcommPorts.length === 1) return rfcommPorts[0].path;
        return this._matchByMac(rfcommPorts) || rfcommPorts[0].path;
      }

      // Windows: filter Bluetooth COM ports (exclude known USB-Serial adapters)
      const usbSerialPatterns = ["ch340", "cp210", "ftdi", "usb-serial"];
      const btPorts = ports.filter((p) => {
        if (!p.path.startsWith("COM")) return false;
        const desc = ((p.manufacturer || "") + (p.pnpId || "")).toLowerCase();
        return !usbSerialPatterns.some((pat) => desc.includes(pat));
      });

      if (btPorts.length === 0) return null;

      // If only one Bluetooth COM, use it
      if (btPorts.length === 1) {
        logger.info(`Porta Bluetooth unica encontrada: ${btPorts[0].path}`);
        return btPorts[0].path;
      }

      // Multiple Bluetooth COMs: try MAC match first
      const macMatch = this._matchByMac(btPorts);
      if (macMatch) {
        logger.info(`Porta Bluetooth identificada por MAC: ${macMatch}`);
        return macMatch;
      }

      // Try description match
      const descMatch = this._matchByDescription(btPorts);
      if (descMatch) {
        logger.info(`Porta Bluetooth identificada por descricao: ${descMatch}`);
        return descMatch;
      }

      // Probe each port to find which responds to Arduino protocol
      logger.info(`${btPorts.length} portas Bluetooth encontradas, testando...`);
      const portsInfo = btPorts.map((p) => p.path).join(", ");
      logger.info(`Portas disponiveis: ${portsInfo}`);

      for (const portInfo of btPorts) {
        const alive = await this._probePort(portInfo.path);
        if (alive) {
          logger.info(`Porta ativa encontrada: ${portInfo.path}`);
          return portInfo.path;
        }
      }

      // Fallback: use first port
      logger.warn(`Nenhuma porta respondeu ao probe. Usando primeira: ${btPorts[0].path}`);
      return btPorts[0].path;
    } catch (e) {
      logger.error(`Erro na deteccao de portas: ${e.message}`);
      return null;
    }
  }

  _matchByMac(candidates) {
    if (!this.macAddress) return null;
    const macNormalized = this.macAddress.replace(/:/g, "").toLowerCase();
    const match = candidates.find((p) => {
      const pnpId = (p.pnpId || "").toLowerCase().replace(/:/g, "");
      const serial = (p.serialNumber || "").toLowerCase().replace(/:/g, "");
      return pnpId.includes(macNormalized) || serial.includes(macNormalized);
    });
    return match ? match.path : null;
  }

  _matchByDescription(candidates) {
    const match = candidates.find((p) => {
      const desc = ((p.manufacturer || "") + (p.pnpId || "")).toLowerCase();
      return desc.includes("hc-05") || desc.includes("bluetooth");
    });
    return match ? match.path : null;
  }

  _probePort(portPath) {
    return new Promise((resolve) => {
      try {
        const probePort = new SerialPort({
          path: portPath,
          baudRate: CONFIG.serialBaud,
          autoOpen: false,
        });
        const timeout = setTimeout(() => {
          try { probePort.close(); } catch (_) {}
          resolve(false);
        }, 2000);

        probePort.open((err) => {
          if (err) {
            clearTimeout(timeout);
            resolve(false);
            return;
          }
          // Send STATUS request for switch 1
          probePort.write("CMD|SWITCH|1|STATUS\n", (writeErr) => {
            if (writeErr) {
              clearTimeout(timeout);
              try { probePort.close(); } catch (_) {}
              resolve(false);
              return;
            }
            // Wait for response
            const onData = (data) => {
              clearTimeout(timeout);
              probePort.removeListener("data", onData);
              try { probePort.close(); } catch (_) {}
              resolve(data.includes("STATUS|SWITCH") || data.includes("ACK|SWITCH"));
            };
            probePort.on("data", onData);
            // Timeout if no response
            setTimeout(() => {
              probePort.removeListener("data", onData);
              try { probePort.close(); } catch (_) {}
              resolve(false);
            }, 1500);
          });
        });
      } catch (e) {
        resolve(false);
      }
    });
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
