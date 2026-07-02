FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN mkdir -p /app/reports && chown -R appuser:appgroup /app
COPY --from=builder --chown=appuser:appgroup /app .
USER appuser
EXPOSE 4000
CMD ["node", "src/server.js"]
