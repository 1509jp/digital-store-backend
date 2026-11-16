
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

/**
 * @swagger
 * /v1/product/search:
 *   get:
 *     tags: [Produtos]
 *     summary: Pesquisar e listar produtos
 *     description: Permite pesquisar produtos utilizando filtros e paginação.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Quantidade por página. Use -1 para listar todos.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         example: name,images,price
 *       - in: query
 *         name: match
 *         schema:
 *           type: string
 *         example: Tênis
 *       - in: query
 *         name: category_ids
 *         schema:
 *           type: string
 *         example: "15,24"
 *       - in: query
 *         name: price-range
 *         schema:
 *           type: string
 *         example: "100-200"
 *       - in: query
 *         name: option[45]
 *         schema:
 *           type: string
 *         description: Exemplo de filtro por ID da opção e valores.
 *         example: GG,PP
 *     responses:
 *       200:
 *         description: Lista de produtos com paginação
 *       400:
 *         description: Parâmetros inválidos
 *
 * /v1/product/{id}:
 *   get:
 *     tags: [Produtos]
 *     summary: Buscar produto pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 *   put:
 *     tags: [Produtos]
 *     summary: Atualizar produto
 *     description: Permite atualizar dados, imagens, categorias e opções do produto.
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
 *               enabled:
 *                 type: boolean
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               use_in_menu:
 *                 type: boolean
 *               stock:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               price_with_discount:
 *                 type: number
 *               category_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted:
 *                       type: boolean
 *                     enabled:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                       example: image/png
 *                     content:
 *                       type: string
 *                       description: Conteúdo da imagem em Base64
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     deleted:
 *                       type: boolean
 *                     title:
 *                       type: string
 *                     shape:
 *                       type: string
 *                       enum: [square, circle]
 *                     radius:
 *                       type: string
 *                       example: 4px
 *                     type:
 *                       type: string
 *                       enum: [text, color]
 *                     value:
 *                       type: array
 *                       items:
 *                         type: string
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       204:
 *         description: Produto atualizado
 *       400:
 *         description: Dados inválidos ou token ausente/inválido
 *       404:
 *         description: Produto não encontrado
 *   delete:
 *     tags: [Produtos]
 *     summary: Excluir produto
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
 *         description: Produto excluído
 *       400:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Produto não encontrado
 *
 * /v1/product:
 *   post:
 *     tags: [Produtos]
 *     summary: Cadastrar produto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, price, price_with_discount]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: true
 *               name:
 *                 type: string
 *                 example: Tênis Esportivo
 *               slug:
 *                 type: string
 *                 example: tenis-esportivo
 *               use_in_menu:
 *                 type: boolean
 *                 example: false
 *               stock:
 *                 type: integer
 *                 example: 10
 *               description:
 *                 type: string
 *                 example: Tênis confortável para atividades físicas
 *               price:
 *                 type: number
 *                 example: 200
 *               price_with_discount:
 *                 type: number
 *                 example: 150
 *               category_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, content]
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                       example: image/png
 *                     content:
 *                       type: string
 *                       description: Conteúdo da imagem em Base64
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [title]
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Tamanho
 *                     shape:
 *                       type: string
 *                       enum: [square, circle]
 *                     radius:
 *                       type: string
 *                       example: 4px
 *                     type:
 *                       type: string
 *                       enum: [text, color]
 *                     value:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [PP, M, GG]
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Produto cadastrado
 *       400:
 *         description: Dados inválidos ou token ausente/inválido
 */

module.exports = router;
