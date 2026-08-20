# Docker - Maquete Industrial

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

## Início Rápido

### 1. Clonar o repositório

```bash
git clone <repo-url>
cd maquete_industrial
```

### 2. Criar arquivo .env

```bash
cp .env.example .env
```

Edite o arquivo `.env` se necessário (as configurações padrão funcionam para desenvolvimento).

### 3. Subir todos os serviços

```bash
docker-compose up -d
```

> **Banco de dados:** por padrão sobe um PostgreSQL local (porta 5433 no host) com o `schema.sql` aplicado automaticamente no primeiro boot. Se quiser usar o PostgreSQL do Render, basta definir `DATABASE_URL` no `.env` da raiz — o compose prioriza o valor do `.env`.

### 4. Verificar status

```bash
docker-compose ps
```

### 5. Acessar os serviços

| Serviço | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

## Comandos Úteis

### Gerenciar serviços

```bash
# Subir todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart backend

# Ver logs de um serviço
docker-compose logs -f backend

# Ver logs de todos
docker-compose logs -f
```

### Acessar containers

```bash
# Acessar backend
docker-compose exec backend sh

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d maquete_industrial

# Acessar Redis
docker-compose exec redis redis-cli
```

### Banco de dados

```bash
# Rodar migrações
docker-compose exec backend npm run migrate

# Resetar banco (CUIDADO: apaga todos os dados)
docker-compose down -v
docker-compose up -d
```

## Desenvolvimento

### Rodar sem Docker

Se preferir rodar localmente:

```bash
# Backend
cd backend_nodejs
npm install
npm run dev

# Gateway
cd gateway_bluetooth
npm install
npm start

# Dashboard
cd dashboard_react
npm install
npm start
```

## Produção

### Variáveis de ambiente

Em produção, use variáveis de ambiente seguras:

```bash
export DB_PASSWORD=sua_senha_forte
export JWT_SECRET=sua_chave_secreta
export GATEWAY_API_KEY=sua_chave_api

docker-compose -f docker-compose.yml up -d
```

### Build de imagens

```bash
# Build todas as imagens
docker-compose build

# Build uma imagem específica
docker-compose build backend
```

### Push para registry

```bash
# Docker Hub
docker tag maquete-backend:latest seu-usuario/maquete-backend:latest
docker push seu-usuario/maquete-backend:latest

# GitHub Container Registry
docker tag maquete-backend:latest ghcr.io/seu-usuario/maquete-backend:latest
docker push ghcr.io/seu-usuario/maquete-backend:latest
```

## Troubleshooting

### Erro: "Cannot connect to PostgreSQL"

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Erro: "Cannot connect to Redis"

```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Testar conexão
docker-compose exec redis redis-cli ping
```

### Erro: "Port already in use"

```bash
# Verificar o que está usando a porta
netstat -ano | findstr :4000

# Matar o processo ou mudar a porta no docker-compose.yml
```

### Limpar tudo

```bash
# Parar e remover containers
docker-compose down

# Parar, remover containers e volumes
docker-compose down -v

# Remover imagens não utilizadas
docker system prune -a
```

## Arquitetura

```
┌─────────────────┐
│   Dashboard     │ :3000
│   (React)       │
└────────┬────────┘
         │
┌────────▼────────┐
│    Backend      │ :4000
│  (Express)      │
└───┬─────────┬───┘
    │         │
┌───▼───┐ ┌───▼───┐
│ Post- │ │ Redis │
│ gres  │ │       │
│ :5433 │ │ :6379 │
└───────┘ └───────┘
```

## Runbook - Dia da Feira

### Arquitetura recomendada

```
MÁQUINA PRINCIPAL (Windows)
├── Docker:  postgres (:5433) + redis + backend (:4000) + dashboard (:3000)
└── Host:    gateway_bluetooth (npm start) ← Bluetooth real via COM (HC-05)
```

> **Importante:** o gateway dentro do Docker só funciona em **modo simulação**
> (portas COM não passam ao container no Windows). Para Bluetooth real,
> rode o gateway nativo no host.

### Passo a passo

1. **Pré-requisitos (antes da feira)**
   - Docker Desktop rodando
   - HC-05 pareado no Windows (Bluetooth)
   - Celular pareado no app Expo

2. **Subir a stack**

   ```bash
   docker-compose up -d
   docker-compose ps        # tudo deve estar "healthy"/"running"
   ```

3. **Gateway - Plano A (Bluetooth real)** — rodar no host:

   ```bash
   cd gateway_bluetooth
   cp .env.exemplo .env     # SIMULATION_MODE=false, BACKEND_WS_URL=ws://localhost:4000
   npm start
   ```

4. **Gateway - Plano B (fallback, sem hardware)** — se o BT falhar:

   ```bash
   # Mesmo processo, só muda a variável:
   SIMULATION_MODE=true npm start
   # ou use o container: docker-compose up -d gateway
   ```

5. **Dashboard:** abrir `http://localhost:3000` na mesma máquina.

6. **Trocar para o banco Render** (se o local falhar): pôr `DATABASE_URL` no `.env` da raiz e reiniciar:

   ```bash
   docker-compose up -d --force-recreate backend
   ```

### Checklist do ensaio (1-2 dias antes)

- [ ] `docker-compose up -d` sobe tudo sem erros
- [ ] `docker-compose ps` mostra postgres "healthy"
- [ ] `curl http://localhost:4000/api/health` retorna `postgres: true`
- [ ] Plano A: gateway conecta no HC-05 (log "Conectado a FERROVIA_SW")
- [ ] Plano B: `SIMULATION_MODE=true` gera telemetria no dashboard
- [ ] Dashboard em `http://localhost:3000` mostra dados em tempo real