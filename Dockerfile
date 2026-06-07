# Estágio 1: Gerar package-lock.json (sem instalar dependências)
FROM node:18-alpine AS lockfile
WORKDIR /app
COPY package.json .
RUN npm install --package-lock-only

# Estágio 2: Builder - instala dependências de produção com npm ci
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=lockfile /app/package*.json ./
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm

# Estágio 3: Produção - imagem final enxuta
FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app

# Adiciona usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copia node_modules do builder e código fonte
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs ./src ./src

USER nodejs
EXPOSE 3000
CMD ["node", "src/index.js"]
