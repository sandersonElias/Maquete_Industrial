FROM node:20-alpine AS builder

WORKDIR /app

# Build args para variaveis de ambiente do React (build time)
ARG REACT_APP_API_URL=http://localhost:4000
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar codigo fonte
COPY . .

# Build de producao (CRA usa REACT_APP_* no build time)
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