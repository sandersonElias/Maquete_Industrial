#!/usr/bin/env node
// Diagnostico de portas Bluetooth COM para HC-05
// Uso: node scripts/diagnose-bt.js

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const BAUD_RATE = parseInt(process.env.SERIAL_BAUD, 10) || 9600;
const PROBE_TIMEOUT = 2000;

async function main() {
  console.log("=== Diagnostico Bluetooth HC-05 ===\n");

  const ports = await SerialPort.list();

  // USB-Serial patterns to exclude
  const usbSerialPatterns = ["ch340", "cp210", "ftdi", "usb-serial"];

  const allPorts = ports.filter((p) => p.path.startsWith("COM"));
  const btPorts = allPorts.filter((p) => {
    const desc = ((p.manufacturer || "") + (p.pnpId || "")).toLowerCase();
    return !usbSerialPatterns.some((pat) => desc.includes(pat));
  });
  const usbPorts = allPorts.filter((p) => {
    const desc = ((p.manufacturer || "") + (p.pnpId || "")).toLowerCase();
    return usbSerialPatterns.some((pat) => desc.includes(pat));
  });

  console.log(`Portas COM encontradas: ${allPorts.length}`);
  console.log(`  Bluetooth: ${btPorts.length}`);
  console.log(`  USB-Serial: ${usbPorts.length}\n`);

  if (btPorts.length === 0) {
    console.log("Nenhuma porta Bluetooth encontrada!");
    console.log("\nVerifique:");
    console.log("  1. O HC-05 esta pareado no Windows?");
    console.log("  2. O adaptador Bluetooth esta conectado?");
    console.log("  3. Abra Configuracoes > Bluetooth > Dispositivos");
    return;
  }

  console.log("--- Portas Bluetooth ---");
  for (const port of btPorts) {
    console.log(`  ${port.path}:`);
    console.log(`    Manufacturer: ${port.manufacturer || "N/A"}`);
    console.log(`    PNP ID: ${port.pnpId || "N/A"}`);
    console.log(`    Serial: ${port.serialNumber || "N/A"}`);
  }

  if (usbPorts.length > 0) {
    console.log("\n--- Portas USB-Serial (ignoradas) ---");
    for (const port of usbPorts) {
      console.log(`  ${port.path}: ${port.manufacturer || port.pnpId || "N/A"}`);
    }
  }

  console.log("\n--- Testando portas Bluetooth ---\n");

  for (const portInfo of btPorts) {
    process.stdout.write(`Testando ${portInfo.path}... `);
    const result = await probePort(portInfo.path);
    if (result === "arduino") {
      console.log("ARDUINO DETECTADO!");
    } else if (result === "open") {
      console.log("porta abre mas sem resposta do Arduino");
    } else {
      console.log(`falhou (${result})`);
    }
  }

  console.log("\n=== Fim do diagnostico ===");
}

function probePort(portPath) {
  return new Promise((resolve) => {
    try {
      const port = new SerialPort({
        path: portPath,
        baudRate: BAUD_RATE,
        autoOpen: false,
      });

      const timeout = setTimeout(() => {
        try { port.close(); } catch (_) {}
        resolve("timeout ao abrir");
      }, PROBE_TIMEOUT);

      port.open((err) => {
        if (err) {
          clearTimeout(timeout);
          resolve(`erro: ${err.message}`);
          return;
        }

        clearTimeout(timeout);
        const openTimeout = setTimeout(() => {
          try { port.close(); } catch (_) {}
          resolve("open");
        }, PROBE_TIMEOUT);

        port.write("CMD|SWITCH|1|STATUS\n", (writeErr) => {
          if (writeErr) {
            clearTimeout(openTimeout);
            try { port.close(); } catch (_) {}
            resolve(`write error: ${writeErr.message}`);
            return;
          }

          const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
          parser.on("data", (data) => {
            clearTimeout(openTimeout);
            try { port.close(); } catch (_) {}
            if (data.includes("STATUS|SWITCH") || data.includes("ACK|SWITCH")) {
              resolve("arduino");
            } else {
              resolve("open");
            }
          });

          setTimeout(() => {
            clearTimeout(openTimeout);
            try { port.close(); } catch (_) {}
            resolve("open");
          }, 1500);
        });
      });
    } catch (e) {
      resolve(`excecao: ${e.message}`);
    }
  });
}

main().catch(console.error);
