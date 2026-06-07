// ... (outras declarações require e app.use)

const sequelize = new Sequelize(/* ... */);
const Nome = sequelize.define(/* ... */);

// Função para tentar a conexão com o banco repetidas vezes
const connectWithRetry = async () => {
  const maxRetries = 10;
  const retryInterval = 5000; // 5 segundos
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    console.log(`Tentativa ${attempts} de conexão com o banco de dados...`);
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso!');
      await sequelize.sync({ alter: true });
      console.log('✅ Banco de dados sincronizado.');
      
      // Inicia o servidor apenas após a conexão bem-sucedida
      app.listen(3000, () => {
        console.log('🚀 Servidor Theed rodando em http://localhost:3000');
      });
      return; // Sai do loop se a conexão for bem-sucedida
    } catch (error) {
      console.error(`❌ Falha na conexão (tentativa ${attempts}/${maxRetries}): ${error.message}`);
      if (attempts === maxRetries) {
        console.error('Número máximo de tentativas atingido. Encerrando a aplicação.');
        process.exit(1);
      }
      console.log(`Aguardando ${retryInterval/1000} segundos antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
};

// Inicia o processo de conexão
connectWithRetry();
