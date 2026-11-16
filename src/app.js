
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Configuracoes gerais
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Disponibilizar as imagens dos produtos
app.use('/uploads', express.static(
  path.join(__dirname, '../public/uploads')
));

// Rota inicial
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Digital Store API funcionando!',
  });
});

// Rotas da API
app.use('/v1/user', userRoutes);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);

module.exports = app;
