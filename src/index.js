const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexão com o PostgreSQL (usando variáveis do .env)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

// Modelo da tabela 'nomes'
const Nome = sequelize.define('Nome', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'nomes', timestamps: true });

// Sincroniza o banco (cria a tabela se não existir)
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Banco PostgreSQL sincronizado (tabela "nomes" pronta)');
});

// Rota principal – exibe o formulário e a lista de nomes
app.get('/', async (req, res) => {
  try {
    const nomes = await Nome.findAll({ order: [['createdAt', 'DESC']] });
    let listaHtml = '';
    nomes.forEach(n => {
      listaHtml += `<li>${n.nome} (cadastrado em ${n.createdAt.toLocaleString()})</li>`;
    });
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Theed - Cadastro de Nomes</title>
        <style>
          body { font-family: Arial; margin: 40px; background: #f4f4f9; }
          .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          input, button { padding: 10px; margin: 5px; font-size: 16px; }
          button { background-color: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px; }
          button:hover { background-color: #218838; }
          ul { margin-top: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🌆 Theed - Cadastro de Nomes</h1>
          <form action="/cadastrar" method="POST">
            <input type="text" name="nome" placeholder="Digite um nome" required autofocus />
            <button type="submit">Cadastrar</button>
          </form>
          <h2>Nomes já cadastrados:</h2>
          <ul>
            ${listaHtml || '<li>Nenhum nome ainda. Cadastre o primeiro!</li>'}
          </ul>
          <hr>
          <small>✅ Banco PostgreSQL está funcionando.</small>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send('Erro ao carregar página: ' + err.message);
  }
});

// Rota para cadastrar um nome (via POST)
app.post('/cadastrar', async (req, res) => {
  const { nome } = req.body;
  if (!nome || nome.trim() === '') {
    return res.redirect('/?erro=Nome+não+pode+ser+vazio');
  }
  try {
    await Nome.create({ nome: nome.trim() });
    res.redirect('/');
  } catch (err) {
    res.redirect('/?erro=' + encodeURIComponent(err.message));
  }
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('🚀 Servidor Theed rodando em http://localhost:3000');
});
