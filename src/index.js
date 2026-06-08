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

// Middleware para status do banco
app.use(async (req, res, next) => {
  try {
    await sequelize.authenticate();
    res.locals.dbStatus = 'online';
  } catch (err) {
    res.locals.dbStatus = 'offline';
  }
  next();
});

// Rota principal
app.get('/', async (req, res) => {
  let nomes = [];
  let dbStatus = res.locals.dbStatus;
  let error = null;

  if (dbStatus === 'online') {
    try {
      nomes = await Nome.findAll({ order: [['createdAt', 'DESC']] });
    } catch (err) {
      error = 'Erro ao carregar nomes.';
    }
  } else {
    error = 'Banco de dados indisponível no momento.';
  }

  // Gera a lista de nomes com checkbox e botão de excluir
  let listaHtml = '';
  if (nomes.length > 0) {
    listaHtml = '<ul>';
    for (const n of nomes) {
      listaHtml += `
        <li>
          <input type="checkbox" name="ids" value="${n.id}">
          <span>${escapeHtml(n.nome)}</span>
          <form action="/excluir/${n.id}" method="post" style="display: inline;">
            <button type="submit" class="delete-single">🗑️ Excluir</button>
          </form>
        </li>
      `;
    }
    listaHtml += '</ul>';
  } else {
    listaHtml = '<p>Nenhum nome cadastrado ainda.</p>';
  }

  const errorHtml = error ? `<div class="error">⚠️ ${escapeHtml(error)}</div>` : '';
  const statusClass = dbStatus === 'online' ? 'online' : 'offline';
  const statusText = dbStatus === 'online' ? 'ONLINE' : 'OFFLINE';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Theed - Cadastro de Nomes</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
        .online { background: #c6f7d0; color: #0e5e2e; }
        .offline { background: #fed7d7; color: #9b2c2c; }
        input[type="text"] { width: 100%; padding: 10px; margin: 8px 0; border-radius: 8px; border: 1px solid #ccc; }
        button { background: #2c7da0; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; }
        button.danger { background: #c53030; }
        button.delete-single { background: #e53e3e; padding: 5px 10px; font-size: 12px; margin-left: 10px; }
        ul { list-style: none; padding: 0; }
        li { background: #f0f2f5; margin: 8px 0; padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 12px; }
        li input[type="checkbox"] { width: 20px; height: 20px; margin: 0; }
        li span { flex: 1; }
        .error { background: #fed7d7; color: #9b2c2c; padding: 10px; border-radius: 8px; margin-top: 16px; }
        footer { text-align: center; margin-top: 24px; font-size: 12px; color: #777; }
        .button-group { margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📝 Theed - Cadastro de Nomes</h1>
        <div class="status ${statusClass}">💾 Banco ${statusText}</div>

        <form action="/cadastrar" method="post">
          <input type="text" name="nome" placeholder="Digite um nome" required>
          <button type="submit">Cadastrar</button>
        </form>

        <h2>📋 Últimos nomes cadastrados</h2>
        ${errorHtml}
        <form action="/excluir" method="post">
          ${listaHtml}
          <div class="button-group">
            <button type="submit" class="danger" ${nomes.length === 0 ? 'disabled' : ''}>🗑️ Excluir selecionados</button>
          </div>
        </form>
        <footer>Theed - Node.js + PostgreSQL + Docker</footer>
      </div>
    </body>
    </html>
  `);
});

// Cadastrar
app.post('/cadastrar', async (req, res) => {
  const nome = req.body.nome;
  if (!nome || nome.trim() === '') return res.redirect('/');
  try {
    await Nome.create({ nome: nome.trim() });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Erro ao cadastrar.');
  }
});

// Excluir individual
app.post('/excluir/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await Nome.destroy({ where: { id } });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Erro ao excluir.');
  }
});

// Excluir múltiplos
app.post('/excluir', async (req, res) => {
  let ids = req.body.ids;
  if (!ids) return res.redirect('/');
  if (!Array.isArray(ids)) ids = [ids];
  try {
    await Nome.destroy({ where: { id: ids } });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Erro ao excluir.');
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Inicialização com retry
(async function connect() {
  let attempts = 0;
  while (true) {
    attempts++;
    console.log(`Tentativa ${attempts} de conexão...`);
    try {
      await sequelize.authenticate();
      console.log('✅ Conectado ao PostgreSQL');
      await sequelize.sync();
      console.log('✅ Tabelas sincronizadas');
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor em http://localhost:${PORT}`);
      });
      break;
    } catch (err) {
      console.log(`Aguardando banco... (${err.message})`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
})();
