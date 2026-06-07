FROM node:18-alpine

# Define ambiente de produção (desabilita logs de dev, otimiza)
ENV NODE_ENV=production

WORKDIR /app

# Copia APENAS os arquivos de manifesto (aproveita cache do Docker)
COPY package*.json ./

# Instala dependências de produção de forma exata, rápida e sem cache desnecessário
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copia o restante do código (somente o necessário)
COPY src ./src

# Cria um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["node", "src/index.js"]
