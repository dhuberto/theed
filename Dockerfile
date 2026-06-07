FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./

# Troque npm ci por npm install (sem lockfile)
RUN npm install --only=production --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm

COPY src ./src

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "src/index.js"]# Usa a imagem base oficial do Node.js na versão LTS (Alpine para tamanho reduzido)
FROM node:18-alpine

# Define o ambiente como produção
ENV NODE_ENV=production

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de manifesto do projeto
COPY package*.json ./

# Instala as dependências de produção de forma limpa e determinística.
# O '--no-audit --no-fund' acelera o processo e reduz logs desnecessários.
RUN npm ci --only=production --no-audit --no-fund

# Limpa o cache do npm para reduzir o tamanho da imagem
RUN npm cache clean --force

# Copia o código-fonte da aplicação
COPY src ./src

# Cria um grupo e um usuário sem privilégios ('nodejs') e dá a ele a propriedade da pasta /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Troca para o usuário não-root para executar a aplicação
USER nodejs

# Documenta a porta que a aplicação usará
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
