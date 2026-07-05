# Conexao Arduino - USB vs Bluetooth

## Visao Geral

O Arduino da ferrovia pode se comunicar com o PC/Raspberry Pi de duas formas:
1. **USB** (adaptador CH340) — para desenvolvimento no PC
2. **Bluetooth** (modulo HC-05) — para producao (Raspberry Pi)

## Pinagem Serial

Ambos os metodos usam os **mesmos pinos** do Arduino (D0/D1 - HardwareSerial):

```
Arduino D0 (RX) ←→ HC-05 TX
Arduino D1 (TX) ←→ HC-05 RX
Arduino D0 (RX) ←→ CH340 TX (USB)
Arduino D1 (TX) ←→ CH340 RX (USB)
```

### Conflito Eletrico

Se HC-05 e CH340 estiverem conectados ao mesmo tempo,会发生 conflito nas linhas TX/RX. **Nao use ambos simultaneamente.**

## Configuracoes

### USB (Desenvolvimento)

**Conexao:** Arduino via cabo USB (CH340 → COM6 no Windows)

**Gateway .env:**
```
SIMULATION_MODE=false
SERIAL_PORT=COM6
```

**Vantagens:**
- Mais estavel
- Sem pareamento Bluetooth
- Funciona sem adaptador Bluetooth no PC

**Desvantagens:**
- Fisico (cabo USB)
- Nao funciona em producao (Raspberry Pi)

### Bluetooth (Producao)

**Conexao:** HC-05 pareado via Bluetooth (porta COM virtual)

**Gateway .env:**
```
SIMULATION_MODE=false
# SERIAL_PORT=  (deixe vazio para auto-deteccao)
```

**Vantagens:**
- Sem fio
- Funciona com Raspberry Pi
- Compativel com a arquitetura original do gateway

**Desvantagens:**
- Instavel no Windows (desconexoes frequentes)
- Requer pareamento Bluetooth
- Multiple portas COM virtuais (confusa auto-deteccao)

## Arquitetura de Comunicacao

```
[Dashboard] ←HTTP/WS→ [Backend :4000] ←WS→ [Gateway :3001] ←Serial→ [Arduino]
```

### Fluxo de Comando

1. Dashboard envia POST `/api/ferrovia/switch` para o Backend
2. Backend grava no PostgreSQL e emite evento `command` via Socket.IO
3. Gateway recebe o comando e envia pela serial para o Arduino
4. Arduino move o servo e responde `ACK|SWITCH|<id>|<state>`
5. Gateway encaminha a resposta ao Backend via `device:data`
6. Backend atualiza o banco e emite `switch:update` para o Dashboard

### Protocolo Serial (9600 baud)

**Comandos (PC → Arduino):**
```
CMD|SWITCH|<id>|SET|LEFT      # Mover para esquerda (0 graus)
CMD|SWITCH|<id>|SET|RIGHT     # Mover para direita (180 graus)
CMD|SWITCH|<id>|SET|CENTER    # Mover para centro (90 graus)
CMD|SWITCH|<id>|ANGLE|<0-180> # Mover para angulo especifico
CMD|SWITCH|<id>|STATUS        # Solicitar status
CMD|SWITCH|<id>|RESET         # Resetar para centro
```

**Respostas (Arduino → PC):**
```
ACK|SWITCH|<id>|<state>                    # Confirmacao de comando
STATUS|SWITCH|<id>|<angle>|<state>|<ts>    # Status periodico (5s)
```

## Simulacao

Para testar sem hardware:

```
SIMULATION_MODE=true
```

O gateway gera dados simulados:
- Ferrovia: ajustes aleatorios a cada 10s
- Caminhao: posicao/carga/bateria a cada 2s

## Troubleshooting

### Erro "Access denied" na porta COM

Outro programa esta usando a porta. Feche o Arduino IDE, PuTTY, ou outro serial monitor.

### Erro "File not found" na porta COM

A porta COM nao existe ou o dispositivo foi desconectado. Verifique no Gerenciador de Dispositivos.

### HC-05 desconecta no Windows

Problema comum do gerenciamento de energia Bluetooth. Solucoes:
1. Desabilitar "Allow the computer to turn off this device" no Device Manager
2. Usar adaptador Bluetooth USB de qualidade
3. Preferir USB para desenvolvimento

### Backend: "Erro comando switch: command is not defined"

Bug corrigido: variavel `command` era block-scoped dentro do `try`. Agora e declarada antes do bloco.

### Dashboard: 404 nas chamadas API

O axios nao estava usando `REACT_APP_API_URL`. Corrigido com `axios.defaults.baseURL`.
