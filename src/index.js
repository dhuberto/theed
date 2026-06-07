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
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rota principal com listagem
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

// Função de retry para conexão com o banco
const connectWithRetry = async () => {
  const maxRetries = 0; // 0 = infinito (tenta para sempre)
  let attempts = 0;

  while (true) {
    attempts++;
    console.log(`Tentativa ${attempts} de conexão com o banco...`);

    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso!');
      await sequelize.sync(); // Cria a tabela se não existir
      console.log('✅ Banco de dados sincronizado.');

      // Inicia o servidor apenas após a conexão bem-sucedida
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor Theed rodando em http://localhost:${PORT}`);
      });
      return; // Sai do loop quando conectar
    } catch (error) {
      console.error(`❌ Falha na conexão (tentativa ${attempts}): ${error.message}`);
      if (maxRetries > 0 && attempts >= maxRetries) {
        console.error('Número máximo de tentativas atingido. Encerrando a aplicação.');
        process.exit(1);
      }
      console.log('Aguardando 5 segundos antes da próxima tentativa...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectWithRetry();
