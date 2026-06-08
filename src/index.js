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
  logging: false,
});

const Nome = sequelize.define('Nome', {
  nome: { type: DataTypes.STRING, allowNull: false },
});

app.use(express.urlencoded({ extended: true }));

// Rota principal com indicador de status do banco
app.get('/', async (req, res) => {
  let nomes = [];
  let dbStatus = 'offline';
  let error = null;

  try {
    await sequelize.authenticate();
    dbStatus = 'online';
    nomes = await Nome.findAll({ order: [['createdAt', 'DESC']] });
  } catch (err) {
    dbStatus = 'offline';
    error = 'Banco de dados indisponível no momento.';
  }

  const listaHtml = nomes.map(n => `<li>${escapeHtml(n.nome)}</li>`).join('');
  const errorHtml = error ? `<div class="error">⚠️ ${escapeHtml(error)}</div>` : '';

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Theed - Cadastro de Nomes</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .header {
          background: #2d3748;
          color: white;
          padding: 24px 32px;
          text-align: center;
        }
        .header h1 { font-size: 1.8rem; }
        .status {
          display: inline-block;
          background: ${dbStatus === 'online' ? '#48bb78' : '#f56565'};
          padding: 4px 12px;
          border-radius: 40px;
          font-size: 0.75rem;
          font-weight: bold;
          margin-top: 12px;
        }
        .content { padding: 32px; }
        input[type="text"] {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          outline: none;
        }
        input[type="text"]:focus { border-color: #667eea; }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          font-weight: bold;
          border-radius: 40px;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
        }
        button:hover { background: #5a67d8; }
        .nomes-list { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
        .nomes-list h2 { font-size: 1.4rem; margin-bottom: 16px; color: #2d3748; }
        ul { list-style: none; padding: 0; }
        li {
          background: #f7fafc;
          margin: 8px 0;
          padding: 12px 16px;
          border-radius: 16px;
        }
        .empty { color: #a0aec0; text-align: center; padding: 20px; font-style: italic; }
        .error {
          background: #fed7d7;
          color: #c53030;
          padding: 12px;
          border-radius: 12px;
          margin-top: 16px;
          text-align: center;
        }
        footer {
          text-align: center;
          padding: 16px;
          background: #edf2f7;
          font-size: 0.75rem;
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Theed</h1>
          <div class="status">💾 Banco ${dbStatus === 'online' ? 'ONLINE' : 'OFFLINE'}</div>
        </div>
        <div class="content">
          <form action="/cadastrar" method="post">
            <input type="text" name="nome" placeholder="Digite um nome" required>
            <button type="submit">✅ Cadastrar</button>
          </form>
          <div class="nomes-list">
            <h2>📋 Últimos nomes cadastrados</h2>
            ${errorHtml}
            ${nomes.length === 0 && !error ? '<div class="empty">Nenhum nome cadastrado ainda.</div>' : `<ul>${listaHtml}</ul>`}
          </div>
        </div>
        <footer>Theed - Cadastro de Nomes com Node.js, PostgreSQL e Docker</footer>
      </div>
    </body>
    </html>
  `);
});

app.post('/cadastrar', async (req, res) => {
  const nome = req.body.nome;
  if (!nome || nome.trim() === '') {
    return res.redirect('/');
  }
  try {
    await Nome.create({ nome: nome.trim() });
    res.redirect('/');
  } catch (err) {
    console.error('Erro ao cadastrar:', err.message);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;margin-top:50px;">
        <h1>❌ Erro ao cadastrar</h1>
        <p>Não foi possível salvar o nome. Tente novamente mais tarde.</p>
        <a href="/">Voltar</a>
      </body></html>
    `);
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Função de retry para conexão com o banco (tenta infinitamente)
const connectWithRetry = async () => {
  let attempts = 0;
  while (true) {
    attempts++;
    console.log(`Tentativa ${attempts} de conexão com o banco...`);
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso!');
      await sequelize.sync();
      console.log('✅ Banco de dados sincronizado.');
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor Theed rodando em http://localhost:${PORT}`);
      });
      return;
    } catch (error) {
      console.error(`❌ Falha na conexão (tentativa ${attempts}): ${error.message}`);
      console.log('Aguardando 5 segundos antes da próxima tentativa...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectWithRetry();
