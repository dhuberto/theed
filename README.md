# Theed – Cadastro de Nomes com Node.js + PostgreSQL (Docker)

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

#Se não tiver, instale:

sudo apt update

sudo apt install docker.io docker-compose-v2

sudo usermod -aG docker $USER

# reinicie o terminal ou faça logout/login

- Docker e Docker Compose (v2+)
- Git


# Como executar (qualquer Linux)

```bash
git clone https://github.com/dhuberto/theed.git
cd theed
cp .env.example .env
# (opcional) edite .env com senhas fortes
docker compose up -d
