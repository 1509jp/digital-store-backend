
const express = require('express');

const {
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Pesquisar produtos
router.get('/search', searchProducts);

// Buscar produto pelo ID
router.get('/:id', getProductById);

// Cadastrar produto (requer JWT)
router.post('/', authMiddleware, createProduct);

// Atualizar produto (requer JWT)
router.put('/:id', authMiddleware, updateProduct);

// Excluir produto (requer JWT)
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
