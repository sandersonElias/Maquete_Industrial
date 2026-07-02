FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Build de produção
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar build do React
COPY --from=builder /app/build /usr/share/nginx/html

# Configurar nginx
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]