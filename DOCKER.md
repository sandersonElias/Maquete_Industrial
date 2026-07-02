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

### 4. Verificar status

```bash
docker-compose ps
```

### 5. Acessar os serviços

| Serviço | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |
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

### Modo com auto-reload

Para desenvolvimento com hot-reload, use os volumes mapeados:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

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
│ :5432 │ │ :6379 │
└───────┘ └───────┘
```