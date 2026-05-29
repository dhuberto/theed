# Theed – Cadastro de Nomes com Node.js + PostgreSQL (Docker)

 Sobre o Projeto

**Theed** é uma aplicação web de exemplo, criada para demonstrar como construir e containerizar uma aplicação com o Dockerfile e o compose.yaml com o Node.js e banco de dados PostgreSQL utilizando Docker.

Ela permite que os usuários:
*   Cadastrem nomes via um formulário web simples.
*   Visualizem em tempo real a lista de nomes salvos no banco de dados.

## Tecnologias e Boas Práticas

*   **Node.js & Express:** Backend da aplicação.
*   **Sequelize (ORM):** Interação com o banco de dados de forma segura e eficiente.
*   **PostgreSQL:** Banco de dados relacional robusto.
*   **Docker:**
    *   **Dockerfile Multi-stage:** Gera uma imagem de produção pequena e eficiente.
    *   **Docker Compose:** Orquestra os serviços da aplicação (app e banco).
    *   **.dockerignore:** Otimiza o build ao ignorar arquivos desnecessários.
*   **Segurança:**
    *   **Variáveis de Ambiente (.env):** Arquivo não versionado para credenciais.
    *   **.env.example:** Modelo de configuração para novos desenvolvedores.

Aplicação web simples que permite adicionar nomes em um banco PostgreSQL e visualizar a lista atualizada.  
Projetada com **melhores práticas de DevOps**:

- Multi‑stage build (imagem Docker final pequena)
- Credenciais via `.env` (não versionado)
- `.env.example` como modelo
- `compose.yml` moderno
- Pronto para produção

theed/	

├── .env.example          # modelo de variáveis	

├── .gitignore	

├── Dockerfile            # multi‑stage	

├── compose.yml	

├── package.json	

├── README.md	

└── src/

	└── index.js          # frontend + backend (formulário e API)	

	
## Pré‑requisitos

1. Pré‑requisitos no seu Linux (Ubuntu)


# Verifique se tem Docker e Docker Compose
docker --version

docker compose version

#Se não tiver, instale e adicione seu usuario ao grupo docker:

sudo apt update

sudo apt install docker.io docker-compose-v2

sudo usermod -aG docker $USER


# Como executar (qualquer Linux)

```bash
git clone https://github.com/dhuberto/theed.git
cd theed
cp .env.example .env
# (opcional) edite .env com senhas fortes
docker compose up -d
