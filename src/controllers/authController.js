
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Autenticar usuário e gerar token JWT
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Verificar campos obrigatórios
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email e senha sao obrigatorios.',
      });
    }

    // Buscar usuário pelo email
    const user = await User.findOne({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Email ou senha invalidos.',
      });
    }

    // Comparar senha com o hash do banco
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Email ou senha invalidos.',
      });
    }

    // Verificar configuração da chave JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET nao configurado.');
    }

    // Gerar token com validade de 1 hora
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      token,
    });
  } catch (error) {
    console.error('Erro na autenticacao:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

module.exports = {
  login,
};
