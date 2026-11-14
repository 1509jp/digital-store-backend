
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

module.exports = router;
