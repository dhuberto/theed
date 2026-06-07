# Estágio 1: Gerar package-lock.json (esta etapa é a novidade)
FROM node:18-alpine AS lockfile
WORKDIR /app
COPY package.json .
# Apenas gera o lockfile, não instala as dependências
RUN npm install --package-lock-only

# Estágio 2: Builder - Responsável por instalar as dependências
FROM node:18-alpine AS builder
WORKDIR /app
# Copia o package.json e o package-lock.json gerado no estágio anterior
COPY --from=lockfile /app/package*.json ./
# Instala as dependências de produção com npm ci (exige o lockfile)
RUN npm ci --only=production --no-audit --no-fund
# Remove o cache do npm e o próprio npm para reduzir o tamanho da camada
RUN npm cache clean --force && rm -rf /usr/local/lib/node_modules/npm

# Estágio 3: Produção - Imagem final e mais enxuta
FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app
# Cria um usuário não-root para maior segurança (boa prática)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# Copia o node_modules otimizado do builder e o código fonte
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs ./src ./src
# Troca para o usuário não-root
USER nodejs
EXPOSE 3000
CMD ["node", "src/index.js"]
