# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

School science-fair project: a physical HO-scale industrial railway model (Arduino-controlled)
plus the software that monitors and controls it. Four modules: **Ferrovia, Mineradora, Porto
Logístico, Química**.

Written in Portuguese — code comments, commit messages, and UI copy are all in pt-BR. Match that.

## No monorepo tooling

Each module has its own `package.json` and is installed/run independently. There is no workspace
root, no shared lockfile, no orchestrator script. `cd` into the module first.

| Module | Stack | Install & run |
|---|---|---|
| `backend_nodejs/` | Express, Socket.IO, PostgreSQL, Redis | `npm install && npm run dev` (port 4000) |
| `dashboard_react/` | React CRA, Tailwind | `npm install && npm start` (port 3000) |
| `gateway_bluetooth/` | Node, SerialPort | `npm install && npm start` |
| `site-ferrorama-3d/react-app/` | React 19 + Vite + TypeScript + Three.js | `npm install && npm run dev` (port 5173) |
| `app_kotlin/` | Android (Kotlin, Compose) | Android Studio / Gradle |
| `firmware_arduino_*/` | Arduino sketches | Arduino IDE |

### Verification commands

```bash
# site-ferrorama-3d/react-app — the only module with typecheck + lint
npx tsc --noEmit     # must pass clean
npx oxlint src       # 1 pre-existing warning in geometria.ts:129 (unused var) — don't add more
npm run build        # must pass

# backend_nodejs — Jest, 52 tests across src/__tests__/{auth,crypto,validation}.test.js
npm install                                   # jest is a devDependency; local installs go stale
npm test                                      # runs with --forceExit --detectOpenHandles
npx jest src/__tests__/crypto.test.js         # single file
npx jest -t "nome do teste"                   # single test by name

# dashboard_react
npm test                                      # react-scripts test (Jest, watch mode)
```

`gateway_bluetooth` and the firmware have no tests or lint.

## The `.env` lives at the repo root — not per module

This is the most common footgun. There is a single `.env` at the repository root
(gitignored; copy from `.env.example`). Modules reach up to it with an explicit path:

- `backend_nodejs/src/config/index.js` → `path.resolve(__dirname, "../../../.env")`
- `backend_nodejs/scripts/migrate.js` → `path.resolve(__dirname, "../../.env")`

If you add a new entry point that needs env vars, resolve the path explicitly. A bare
`require("dotenv").config()` resolves relative to `process.cwd()`, silently finds nothing when run
from inside a module directory, and leaves `DATABASE_URL` undefined with no useful error.

Database is **Supabase PostgreSQL**. Use the *Session pooler* connection string, not the direct
one — the direct host resolves to IPv6 only and fails on many networks.

```bash
cd backend_nodejs && npm run migrate   # applies schema.sql + migrations/, idempotent
```

## Data flow

```
Arduino (servos, sensors, HC-05)
   ↕ Serial / Bluetooth  ·  CMD|SWITCH|<id>|SET|LEFT  /  STATUS|SWITCH|<id>|<angle>|<state>|<ts>
gateway_bluetooth  (SIMULATION_MODE=true runs without hardware)
   ↕ Socket.IO       ·  device:data, command, gateway:register, gateway:status
backend_nodejs     (Express + Socket.IO, all REST under /api/)
   ↕ Socket.IO / REST · switch:update, switch:status, truck:telemetry
dashboard_react  ·  app_kotlin (BT direct to HC-05)
```

Auth is split: **JWT** for dashboard/app, **API key** (`x-api-key` header) for the gateway.

Socket.IO is threaded through routes as a factory — `require("./routes/ferroviaRoutes")(io)` — so
routes that emit events receive `io` at construction, not via import.

## site-ferrorama-3d — the public site

Vite + React 19 + TypeScript. This is where most active work happens.

**Two entry paths from one bundle.** `App.tsx` checks `window.location.pathname`: `/maquete`
renders `MaquetePage` (fullscreen 3D, for a QR code at the fair booth); anything else renders the
full scrolling site. There is no router library.

**The 3D scene is code-split.** `maquete3d/Maquete3D.tsx` is `React.lazy`-imported from both
`MaqueteSection` (embedded in the home page) and `MaquetePage`. Three.js and the model stay out of
the initial bundle — keep it that way.

**Performance budget** (from `npm run build`, gzip):

| | Current | Ceiling |
|---|---|---|
| Initial bundle | ~119 KB | 165 KB |
| `Maquete3D` chunk | ~304 KB | 330 KB |
| `public/models/maquete-blender.glb` | **4.48 MiB** (4,700,820 bytes, Draco) | 4.5 MiB |

The `.glb` is the real bottleneck — it is served to phones over fair-ground 4G. Measure it in
bytes (`stat -c %s`), not with a rounded `ls -lh`: the ceiling has under 20 KB of headroom, so a
rounded figure hides an overrun. It sits at 357k vertices across 518 meshes.

**Polygon budget is set in `primitives.py`, not per piece.** `bevel()` picks its segment count
from the chamfer width (3 above 0.02, 2 above 0.008, else 1) and `cyl()` drops its 16-side floor
to 8 below radius 0.015. A cube chamfered with 3 segments costs ~150 vertices against ~36 with
one, and most of the catalogue asks for chamfers of 1–6 mm where the difference is invisible.
Passing `segments=` explicitly overrides this — do it only where the silhouette earns it.
The other trap is repetition inside an asset: a drainage channel emitting one grate every 80 cm
over a 4.2-unit run cost 8,574 vertices, more than the locomotive. Check the cost of a new asset
with `node scripts/pesar_glb.mjs` before assuming it is cheap.

### Building the `.glb` without installing Blender

The model is a build artifact; the source of truth is `scripts/maquete_bpy/`. Blender the
application is not needed — `bpy` ships as a PyPI wheel. A virtualenv with **bpy 4.5 LTS** (the
version this project targets; 5.x removed `Action.fcurves` and breaks `curves.py`) lives at
`~/.claude/bpy-env`:

```bash
# one-off setup
python -m venv ~/.claude/bpy-env
~/.claude/bpy-env/Scripts/python.exe -m pip install "bpy==4.5.*"

# every rebuild, from site-ferrorama-3d/react-app
~/.claude/bpy-env/Scripts/python.exe scripts/build_maquete_blender.py -- public/models/maquete-blender.glb
```

Watch the tail of the output for `SUJEIRA_OK` (vertex-colour grime), `OVERLAP_REPORT` (should be
near zero; pairs with an elongated bounding box are filtered out because a fence's AABB is mostly
empty) and `EXPORT_OK`. **Regenerate after any change under `scripts/maquete_bpy/`** — the site
serves the committed `.glb`, so script changes are invisible until it is rebuilt.

### The asset catalogue — build pieces there, not inline

`scripts/maquete_bpy/assets/` holds 106 reusable pieces, each a pure function that builds in
**local** coordinates `(avanço, lateral, altura)` and gets placed by a `Sitio` frame. Every asset
has the same signature and is addressed by a stable slug:

```python
from .assets import plantar
plantar("galpao-industrial", "GalpaoOficina", -12.4, 3.8, m, yaw=0.6, comp=4.2)
```

The older modules (`process.py`, `structures.py`, `logistics.py`, …) still write world coordinates
inline. That is what made the model impossible to improve piece by piece — a silo could not be
repeated, rotated, or judged on its own. **New geometry goes in `assets/`**, and existing modules
migrate to `plantar()` as each part of the board is reworked. Scale there is 1 unit = 10 m via
`metros()`; the rail gauge in `assets/ferrovia.py` is pinned to `0.18` to match `curves.lay_track`.

Every asset declares the reference photo it came from (`design/referencias/`). To look at pieces
in isolation — the only way to judge quality — build the contact sheet:

```bash
~/.claude/bpy-env/Scripts/python.exe scripts/gerar_folha_assets.py -- public/models/assets-catalogo.glb
... -- saida.glb extracao porto      # one or more families
... -- saida.glb slug:silo-conico    # a single asset, for fast iteration
```

Full documentation in `scripts/maquete_bpy/assets/README.md`.

**Scene composition.** `MaqueteBlender.tsx` loads the Blender `.glb` and drives the train along a
curve from `geometria.ts`/`tracado.ts`. Everything else in `maquete3d/` is procedural Three.js
layered on top (terrain, vehicles, holographic telemetry panels, POV cameras, camera tour).

**Inspecting the `.glb` without a 3D viewer** — a `.glb` is a JSON chunk followed by binary, so
node names and animations are readable directly. This has already found real bugs (a leftover
regex hiding `TerminalCarvao`):

```js
const b = fs.readFileSync('public/models/maquete-blender.glb');
const json = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString('utf8'));
json.nodes.map(n => n.name);      // 301 nodes
json.animations.map(a => a.name); // 6 animations
```

**Section numbering is manual.** Each `*Section.tsx` hardcodes its own number in
`.section-number`, and `App.tsx` has matching comments. Inserting a section means renumbering every
one after it, in both places, plus adding it to `NAV_ITEMS` in `Navigation.tsx`.

## The browser preview pane does not composite frames

In this environment `requestAnimationFrame`, `IntersectionObserver`, and `ResizeObserver` never
fire in the preview tab. Consequences that look like bugs but are not:

- The WebGL canvas stays at 300×150 and never draws — screenshots time out
- `loading="lazy"` images report `naturalWidth: 0` and never load
- Anything gated on scroll-into-view never triggers

Do not "fix" working code because of this. Verify instead with: `tsc`/`oxlint`/`build`, headless
Node scripts (importing `three` from inside `react-app/` for geometry math), DOM inspection via
`javascript_tool`, and network request logs. **Say plainly in your report what you could not
visually confirm.**

## Repository conventions

- Branches: `feat/dev-<Nome>` per person (Caio, Marco, Sanderson, Davi), merged into each other
  rather than through `master`. Expect conflicts in `App.css` and shared section components.
- Commits and code comments in Portuguese. Comments explain *why*, not *what*.
- `app_react_native/` and `firmware_arduino_caminho_basculante/` (note the typo) exist on disk but
  are **not tracked** — leftovers from a cleanup. Do not add them back.
- `AGENTS.md` predates the 3D site and the Kotlin app; where it disagrees with this file, this file
  is current.
