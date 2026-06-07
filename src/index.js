// src/index.js
require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false, // Desabilita logs do SQL em produção
});

const Nome = sequelize.define('Nome', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const nomes = await Nome.findAll({ order: [['createdAt', 'DESC']] });
    const lista = nomes.map(n => `<li>${n.nome}</li>`).join('');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Theed - Cadastro de Nomes</title><meta charset="utf-8"></head>
      <body>
        <h1>Theed - Cadastro de Nomes</h1>
        <form action="/cadastrar" method="post">
          <input type="text" name="nome" placeholder="Digite um nome" required>
          <button type="submit">Cadastrar</button>
        </form>
        <h2>Nomes cadastrados:</h2>
        <ul>${lista || '<li>Nenhum nome ainda</li>'}</ul>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Erro ao listar nomes');
  }
});

app.post('/cadastrar', async (req, res) => {
  try {
    await Nome.create({ nome: req.body.nome });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Erro ao cadastrar nome');
  }
});

// Inicialização: Conecta ao banco e inicia o servidor
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso!');
    await sequelize.sync(); // Use sync() sem { alter: true } em produção
    console.log('✅ Banco de dados sincronizado.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor Theed rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha na conexão com o banco:', error.message);
    process.exit(1);
  }
})();
