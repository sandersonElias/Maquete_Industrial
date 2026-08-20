FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar codigo fonte
COPY . .

# Build de producao (Vite gera a pasta dist/)
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar build do Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Configurar nginx (SPA fallback cobre a rota /maquete)
RUN echo 'server { \
    listen 5173; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]