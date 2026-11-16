
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

/**
 * @swagger
 * /v1/category/search:
 *   get:
 *     tags: [Categorias]
 *     summary: Pesquisar e listar categorias
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Quantidade por página. Use -1 para listar todas.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         example: name,slug
 *       - in: query
 *         name: use_in_menu
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de categorias com paginação
 *       400:
 *         description: Parâmetros inválidos
 *
 * /v1/category/{id}:
 *   get:
 *     tags: [Categorias]
 *     summary: Buscar categoria pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 *   put:
 *     tags: [Categorias]
 *     summary: Atualizar categoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               use_in_menu:
 *                 type: boolean
 *     responses:
 *       204:
 *         description: Categoria atualizada
 *       400:
 *         description: Dados inválidos ou token ausente/inválido
 *       404:
 *         description: Categoria não encontrada
 *   delete:
 *     tags: [Categorias]
 *     summary: Excluir categoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Categoria excluída
 *       400:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Categoria não encontrada
 *
 * /v1/category:
 *   post:
 *     tags: [Categorias]
 *     summary: Cadastrar categoria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Calçados
 *               slug:
 *                 type: string
 *                 example: calcados
 *               use_in_menu:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Categoria cadastrada
 *       400:
 *         description: Dados inválidos ou token ausente/inválido
 */

module.exports = router;
