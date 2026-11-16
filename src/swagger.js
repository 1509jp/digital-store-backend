const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Store API',
      version: '1.0.0',
      description: 'API REST do projeto Digital Store - Geração Tech'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Usuários', description: 'Gerenciamento de usuários' },
      { name: 'Autenticação', description: 'Autenticação JWT' },
      { name: 'Categorias', description: 'Gerenciamento de categorias' },
      { name: 'Produtos', description: 'Gerenciamento de produtos' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;