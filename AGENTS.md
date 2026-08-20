# AGENTS.md

Multi-module industrial model monitoring system. No monorepo tooling — each module is independent.

## Modules

| Directory | Stack | Entry |
|---|---|---|
| `backend_nodejs/` | Express, Socket.IO, PostgreSQL, Redis | `src/server.js` |
| `dashboard_react/` | React (CRA), Tailwind, Socket.IO client | `src/index.js` |
| `gateway_bluetooth/` | Node.js, SerialPort, Socket.IO client | `index.js` |
| `app_react_native/` | Expo (React Native), Bluetooth fallback | `App.js` |
| `firmware_arduino_ferrovia/` | Arduino sketch (4 servos + HC-05) | `ferrovia_firmware.ino` |
| `firmware_arduino_caminhao_basculante/` | Arduino sketch (dump truck, DC motor + L298M) | `caminhao_basculante_firmware.ino` |

## Startup Order

1. PostgreSQL (`psql -U postgres -f backend_nodejs/schema.sql`)
2. Backend: `cd backend_nodejs && npm run dev`
3. Gateway: `cd gateway_bluetooth && npm start` (needs `SIMULATION_MODE=true` for dev without hardware)
4. Dashboard: `cd dashboard_react && npm start`
5. App: `cd app_react_native && npx expo start`

## Environment Files

Each module has `.env.exemplo` — copy to `.env` and fill values. Key vars:
- Backend: `DATABASE_URL` (Render PostgreSQL), `REDIS_URL`, `JWT_SECRET`, `GATEWAY_API_KEY`
- Gateway: `BACKEND_WS_URL`, `BACKEND_API_URL`, `GATEWAY_API_KEY`, `BT_DEVICE_FERROVIA` (MAC), `SIMULATION_MODE`
- Dashboard: `REACT_APP_API_URL=http://localhost:4000`

## No Tests / No Lint

There are no test suites, linting, or typecheck configured in any module. If you add testing, the dashboard uses `react-scripts test` (Jest). Backend has no test script.

## Serial Protocol (Gateway ↔ Arduino)

```
CMD|SWITCH|<id>|SET|LEFT     → move switch
CMD|SWITCH|<id>|ANGLE|90     → set angle
CMD|SWITCH|<id>|STATUS       → request status
ACK|SWITCH|<id>|<state>      ← response
STATUS|SWITCH|<id>|<angle>|<state>|<ts>  ← status push
```

## Architecture Notes

- All API routes are under `/api/` prefix (auth, ferrovia, trucks, locomotive, port, reports, gateway)
- Real-time: Socket.IO events (`device:data`, `command`, `gateway:register`, `gateway:status`)
- Auth: JWT for dashboard/app, API key (`x-api-key` header) for gateway
- Gateway runs in `SIMULATION_MODE=true` by default — no physical Bluetooth needed for dev
- Backend uses `nodemon` for dev (`npm run dev`), `node` for prod (`npm start`)
- Dashboard is CRA (react-scripts) — no Vite, no custom webpack
- App uses Expo SDK 49, React Native 0.72 — not the latest
- Database: PostgreSQL with PostGIS extension (optional), UUID primary keys
- Color palette shared between dashboard and app: `#00FFB2` (glow), `#0D0F14` (dark bg), `#1C2333` (card)

## Gotchas

- Backend `server.js` calls `setupSockets(io)` and `setupJobs(io)` — Socket.IO instance is shared across routes
- Routes that need Socket.IO receive `io` as a factory: `require("./routes/ferroviaRoutes")(io)`
- Gateway looks for serial ports matching `rfcomm*` pattern (Linux/Raspberry Pi only)
- Dashboard `.env` must use `REACT_APP_` prefix (CRA requirement)
- App has hardcoded `API_BASE_URL` and `WS_URL` in `App.js:43-44` — change for different server IP
- `server.log` and `gateway.log` are runtime logs committed to repo (ignore or add to .gitignore)
