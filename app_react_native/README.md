# App React Native

Aplicativo mobile para telemetria e controle remoto do caminhão basculante.

## Stack

- Expo SDK 49
- React Native 0.72
- Axios (HTTP)
- Socket.IO Client (tempo real)
- AsyncStorage (persistência local)
- NetInfo (detecção de rede)
- Bluetooth Classic (fallback local)

## Estrutura

```
app_react_native/
├── App.js           # Código completo (tudo em um arquivo, ~817 linhas)
├── app.json         # Configuração Expo
├── package.json
└── .expo/
```

## Comandos

```bash
npm install              # Instalar dependências
npx expo start           # Iniciar Expo
npx expo start --android # Rodar no Android
npx expo start --ios     # Rodar no iOS
```

## Configuração

Edite as constantes em `App.js` (linhas 43-44):

```javascript
const API_BASE_URL = "http://192.168.1.100:3000/api"; // IP do backend
const WS_URL = "http://192.168.1.100:3000";            // IP do backend
const TRUCK_ID = "T01";                                 // ID do caminhão
```

## Funcionalidades

### Autenticação
- Login com usuário/senha via `POST /api/auth/login`
- JWT armazenado em `AsyncStorage`
- Sessão persistente (verifica token ao abrir o app)
- Logout limpa token e desconecta Socket

### Telemetria
- Envia dados a cada 1 segundo via `POST /api/trucks/:id/telemetry`
- Dados enviados: posição (delta X/Y), velocidade, carga, bateria, heading
- Posição acumulada localmente (delta → posição absoluta)
- Toggle para ligar/desligar telemetria

### Controle RC

| Botão | Comando | Ação |
|-------|---------|------|
| ▲ | `F` | Frente |
| ▼ | `B` | Ré |
| STOP | `S` | Parar motor |
| ◀ | `L` | Virar esquerda |
| ▶ | `R` | Virar direita |
| SUBIR | `U` | Levantar caçamba |
| DESCER | `D` | Abaixar caçamba |

- Botões são `onPressIn`/`onPressOut` (press-and-hold)
- Comando enviado via `POST /api/trucks/:id/command`
- Fallback para Bluetooth local se API falhar

### Buffer Offline
- Quando sem conexão, telemetria é armazenada em buffer (máximo 100 itens)
- Ao reconectar, envia buffer em lote via `flushOfflineBuffer()`
- Se envio falhar, recoloca no buffer

### Bluetooth Fallback
- Conexão direta com HC-05 quando não há Wi-Fi/4G
- Usa `react-native-bluetooth-classic`
- Procura dispositivos pareados com nome "TRUCK" ou "HC-05"
- Permissões Android 12+: `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`
- Comandos enviados como caracteres únicos (F/B/S/L/R/C/U/D/X)

### Socket.IO
- Conecta ao backend para receber comandos remotos do operador
- Evento `command`: executa comando recebido do dashboard
- Status de conexão exibido na header (API Online/Offline)

## Tela de Login

- Card centralizado com tema escuro
- Campos: Usuário, Senha
- Botão "ENTRAR"
- Exibe IP do servidor como hint

## Tela Principal

### Header
- ID do truck (T01)
- Status de conexão: API Online/Offline + BT Online/Offline
- Botão "SAIR"

### Painel de Telemetria
- Grid de 6 valores: POS X, POS Y, VELOCIDADE, BATERIA, CARGA, BUFFER
- Toggle ON/OFF da telemetria

### Controles
- **Tração**: Botões ▲ (frente) e ▼ (ré) com estado "FRENTE"/"RÉ"/"STOP"
- **Centro**: Controle da caçamba (SUBIR/DESCER), botão STOP, monitor de último comando
- **Direção**: Botões ◀ (esquerda) e ▶ (direita) com estado "ESQ"/"DIR"/"CENTRO"

### Painel Bluetooth
- Botão CONECTAR/DESCONECTAR BT
- Indicador de estado
- Texto explicativo: "Use quando sem conexão Wi-Fi/4G"

## Paleta de Cores

| Variável | Cor | Uso |
|----------|-----|-----|
| `C.bg` | `#0D0F14` | Fundo |
| `C.surface` | `#161B26` | Superfícies |
| `C.card` | `#1C2333` | Cards |
| `C.glow` | `#00FFB2` | Destaques |
| `C.fwd` | `#00FFB2` | Botão frente |
| `C.rev` | `#FF4560` | Botão ré |
| `C.left` | `#FFB800` | Botão esquerda |
| `C.right` | `#3D9EFF` | Botão direita |
| `C.stop` | `#FF2D55` | Botão stop |
| `C.bucket` | `#A855F7` | Controle caçamba |

## APIs Chamadas

| Método | Endpoint | Quando |
|--------|----------|--------|
| POST | `/api/auth/login` | Login |
| POST | `/api/trucks/:id/telemetry` | A cada 1s |
| POST | `/api/trucks/:id/command` | Ao pressionar botão |

## Requisitos

- Android 6.0+ (Bluetooth permissões)
- iOS 13+ (Expo)
- Rede local com acesso ao backend (mesmo Wi-Fi)
