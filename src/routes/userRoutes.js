
const express = require('express');

const {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { login } = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Autenticar usuário e gerar token JWT
router.post('/token', login);

// Buscar usuário pelo ID
router.get('/:id', getUserById);

// Cadastrar novo usuário
router.post('/', createUser);

// Atualizar usuário (requer autenticação)
router.put('/:id', authMiddleware, (req, res, next) => {
  if (Number(req.params.id) !== Number(req.userId)) {
    return res.status(403).json({
      message: 'Voce nao tem permissao para alterar este usuario.',
    });
  }

  return next();
}, updateUser);

// Excluir usuário (requer autenticação)

router.delete('/:id', authMiddleware, (req, res, next) => {
  if (Number(req.params.id) !== Number(req.userId)) {
    return res.status(403).json({
      message: 'Voce nao tem permissao para excluir este usuario.',
    });
  }

  return next();
}, deleteUser);

/**
 * @swagger
 * /v1/user/token:
 *   post:
 *     tags: [Autenticação]
 *     summary: Autenticar usuário
 *     description: Recebe email e senha e retorna um token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Autenticação realizada com sucesso
 *       400:
 *         description: Dados inválidos ou credenciais incorretas
 *
 * /v1/user/{id}:
 *   get:
 *     tags: [Usuários]
 *     summary: Buscar usuário pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *   put:
 *     tags: [Usuários]
 *     summary: Atualizar usuário
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
 *               firstname:
 *                 type: string
 *               surname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       204:
 *         description: Usuário atualizado
 *       400:
 *         description: Dados inválidos ou token ausente/inválido
 *       403:
 *         description: Sem permissão para atualizar este usuário
 *       404:
 *         description: Usuário não encontrado
 *   delete:
 *     tags: [Usuários]
 *     summary: Excluir usuário
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
 *         description: Usuário excluído
 *       400:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão para excluir este usuário
 *       404:
 *         description: Usuário não encontrado
 *
 * /v1/user:
 *   post:
 *     tags: [Usuários]
 *     summary: Cadastrar usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstname, surname, email, password]
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: João
 *               surname:
 *                 type: string
 *                 example: Silva
 *               email:
 *                 type: string
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário cadastrado
 *       400:
 *         description: Dados inválidos
 */

module.exports = router;
