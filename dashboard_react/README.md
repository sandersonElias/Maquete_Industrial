# Dashboard React

Painel de controle web para monitoramento e operação da maquete industrial.

## Stack

- React 18 (Create React App)
- Tailwind CSS 3.3
- Socket.IO Client 4.7
- React Router DOM 6
- Axios
- Recharts
- Lucide React (ícones)
- react-hot-toast (notificações)
- date-fns (formatação de datas)

## Estrutura

```
src/
├── index.js                  # Entry point (BrowserRouter + App)
├── index.css                 # Tailwind directives + scrollbar customizada
├── App.js                    # Rotas + AuthProvider + SocketProvider
├── pages/
│   ├── Login.js              # Tela de login
│   ├── Overview.js           # Visão geral (4 módulos)
│   ├── Ferrovia.js           # Controle de switches (mapa SVG + botões)
│   ├── Mina.js               # Mapa de caminhões + telemetria
│   ├── Porto.js              # Cards de navios
│   ├── Quimica.js            # Monitoramento de equipamentos químicos
│   └── Relatorios.js         # Formulário de exportação
├── components/
│   ├── Sidebar.js            # Menu lateral com navegação (6 itens)
│   └── Header.js             # Barra superior (status conexão + alertas)
└── contexts/
    ├── AuthContext.js         # Login/logout, JWT no localStorage
    └── SocketContext.js       # Conexão Socket.IO com auto-auth
```

## Comandos

```bash
npm install    # Instalar dependências
npm start      # Desenvolvimento (porta 3000)
npm run build  # Build de produção
npm test       # Testes (Jest via react-scripts)
```

## Variáveis de Ambiente

```env
REACT_APP_API_URL=http://localhost:4000
```

**Importante**: Variáveis de ambiente no CRA devem ter o prefixo `REACT_APP_`. O arquivo `.env` deve estar na raiz do módulo (não dentro de `src/`).

## Rotas

| Path | Componente | Descrição |
|------|------------|-----------|
| `/` | Overview | Status geral dos 5 módulos |
| `/ferrovia` | Ferrovia | Controle dos 3 switches |
| `/mina` | Mina | Mapa + telemetria dos caminhões |
| `/porto` | Porto | Lista de navios |
| `/quimica` | Quimica | Monitoramento de equipamentos químicos |
| `/relatorios` | Relatorios | Geração de relatórios |
| `*` | Redirect → `/` | Catch-all |

## Páginas

### Login
- Formulário de usuário/senha
- Chama `POST /api/auth/login`
- Armazena JWT e dados do usuário no `localStorage`
- Redireciona para Overview ao autenticar

### Overview (`/`)
- 4 StatusCards: Ferrovia, Mina, Porto, Química
- Polling a cada 5s em 4 endpoints simultâneos
- Relógio em tempo real
- Quick Stats com contadores
- Painel de Alertas e Atividade Recente

### Ferrovia (`/ferrovia`)
- Mapa SVG esquemático da ferrovia com 3 switches coloridos por estado
- 3 cards de controle (SwitchControl) com:
  - Badge de estado (LEFT/RIGHT/CENTER/TRANSITION)
  - Barra de progresso do ângulo (0-180°)
  - 3 botões: Esquerda, Centro, Direita
- Botão de PARADA DE EMERGÊNCIA (reseta todos para CENTER)
- Escuta Socket.IO: `switch:update`, `switch:status`
- Envia comandos via `POST /api/ferrovia/switch`

### Mina (`/mina`)
- Mapa cartesiano com grid de fundo e markers de caminhões (CSS absolute positioning)
- Cards de status por caminhão: posição (X,Y), carga (barra), bateria (barra colorida)
- Escuta Socket.IO: `truck:telemetry`
- Atualiza posição em tempo real

### Porto (`/porto`)
- Grid 2 colunas de cards de navios
- Cada card: nome, status (colorido), tipo de carga, peso, ETA relativo (`date-fns` + locale `ptBR`), doca
- Polling a cada 30s

### Química (`/quimica`)
- Grid de cards de equipamentos químicos
- Cada card: nome, status (online/warning/offline), temperatura, umidade, nível
- Status bar com contagem de alertas
- Polling a cada 30s
- Dados de exemplo quando API não existe

### Relatórios (`/relatorios`)
- Seleção de tipo: Ferrovia, Mina, Porto, Completo
- Seleção de formato: CSV, Excel (XLSX), PDF
- Filtro por período (data início/fim)
- Gera via `POST /api/reports/export`

## Componentes

### Sidebar
- Largura animada (w-64 aberto, w-0 fechado)
- Logo "MAQUETEIND"
- 7 links de navegação com `NavLink` (ativo em azul)
- Nome do usuário + role
- Botão de logout

### Header
- Hamburger toggle (abre/fecha sidebar)
- Título "Dashboard"
- Badge de status: Online/Offline (verde/vermelho, baseado no Socket.IO connected)
- sino de alertas com dot vermelho

## Socket.IO

Conexão automática quando o usuário está logado. Events:

| Evento | Direção | Ação no Dashboard |
|--------|---------|-------------------|
| `connect` | Inbound | Emite `authenticate` com JWT |
| `authenticated` | Inbound | Toast "Conectado em tempo real" |
| `switch:update` | Inbound | Toast + atualiza estado no Ferrovia |
| `switch:status` | Inbound | Atualiza ângulo e estado no Ferrovia |
| `truck:telemetry` | Inbound | Atualiza posição no Mina |
| `gateway:status` | Inbound | Toast de erro se gateway desconectado |
| `disconnect` | Inbound | Toast "Desconectado do servidor" |
| `teste` | Inbound | Console.log (debug) |

## Paleta Tailwind

Classes customizadas definidas em `tailwind.config.js`:

| Classe | Cor | Uso |
|--------|-----|-----|
| `maquete-dark` | `#0D0F14` | Fundo principal |
| `maquete-surface` | `#161B26` | Superfícies elevadas |
| `maquete-card` | `#1C2333` | Cards |
| `maquete-border` | `#252D40` | Bordas |
| `maquete-glow` | `#00FFB2` | Destaques positivos |
| `maquete-accent` | `#3D9EFF` | Links, botões, switch LEFT |
| `maquete-warning` | `#FFB800` | Alertas |
| `maquete-danger` | `#FF4560` | Erros, stop |
| `maquete-purple` | `#A855F7` | Switch RIGHT, caçamba |

## APIs Chamadas

| Método | Endpoint | Chamado De | Intervalo |
|--------|----------|------------|-----------|
| POST | `/api/auth/login` | AuthContext | - |
| GET | `/api/ferrovia/status` | Overview, Ferrovia | 5s (Overview) |
| GET | `/api/trucks` | Overview, Mina | 5s (Overview) |
| GET | `/api/port/ships` | Overview, Porto | 30s |
| POST | `/api/ferrovia/switch` | Ferrovia | Sob demanda |
| POST | `/api/reports/export` | Relatorios | Sob demanda |
