
const express = require('express');

const {
  getCategoryById,
  createCategory,
  searchCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Pesquisar e listar categorias
router.get('/search', searchCategories);

// Buscar categoria pelo ID
router.get('/:id', getCategoryById);

// Cadastrar categoria (requer autenticacao JWT)
router.post('/', authMiddleware, createCategory);

// Atualizar categoria (requer autenticacao JWT)
router.put('/:id', authMiddleware, updateCategory);

// Excluir categoria (requer autenticacao JWT)
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;
