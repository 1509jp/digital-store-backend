
# Digital Store — Back-end

API REST desenvolvida como projeto final do curso de Desenvolvimento Web Full Stack do Geração Tech.

## Tecnologias

- Node.js
- Express
- MySQL
- Sequelize
- JWT (JSON Web Token)
- Bcrypt
- Jest e Supertest

## Funcionalidades

- Cadastro, consulta, atualização e exclusão de usuários
- Autenticação com JWT
- Cadastro, consulta, atualização e exclusão de categorias
- Cadastro, consulta, atualização e exclusão de produtos
- Associação de produtos a categorias
- Gerenciamento de imagens e opções de produtos
- Pesquisa de produtos com filtros e paginação

## Requisitos

- Node.js
- MySQL
- npm

## Instalação

Clone o repositório e entre na pasta do projeto.

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no `.env.example` e configure as variáveis de ambiente.

Crie o banco de dados MySQL e execute as migrations:

```bash
npx sequelize-cli db:migrate
```

## Executar o projeto

Modo de desenvolvimento:

```bash
npm run dev
```

## Testes

Execute:

```bash
npm test
```

## Endpoints principais

### Usuários
- `GET /v1/user/:id`
- `POST /v1/user`
- `PUT /v1/user/:id`
- `DELETE /v1/user/:id`
- `POST /v1/user/token`

### Categorias
- `GET /v1/category/search`
- `GET /v1/category/:id`
- `POST /v1/category`
- `PUT /v1/category/:id`
- `DELETE /v1/category/:id`

### Produtos
- `GET /v1/product/search`
- `GET /v1/product/:id`
- `POST /v1/product`
- `PUT /v1/product/:id`
- `DELETE /v1/product/:id`

## Autenticação

As rotas protegidas utilizam JWT.

Envie o token no cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

## Estrutura do projeto

- `src/controllers` — Controladores
- `src/routes` — Rotas
- `src/models` — Modelos
- `src/middlewares` — Middlewares
- `migrations` — Migrações do banco de dados
- `tests` — Testes automatizados
- `public/uploads` — Imagens dos produtos

## Projeto acadêmico

Desenvolvido para fins educacionais no curso Geração Tech — Desenvolvimento Web Full Stack.
