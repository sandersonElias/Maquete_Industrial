FROM node:20-alpine

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Usuário não-root
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

CMD ["node", "index.js"]