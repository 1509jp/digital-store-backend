
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Obter o cabeçalho Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({
      message: 'Token nao fornecido.',
    });
  }

  // Verificar formato: Bearer TOKEN
  const parts = authHeader.split(' ');

  if (
    parts.length !== 2 ||
    parts[0] !== 'Bearer' ||
    !parts[1]
  ) {
    return res.status(400).json({
      message: 'Formato de token invalido.',
    });
  }

  const token = parts[1];

  try {
    // Verificar assinatura e validade do JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    // Disponibilizar o ID do usuário autenticado
    req.userId = decoded.id;

    // Permitir que a requisição continue
    return next();
  } catch (error) {
    return res.status(400).json({
      message: 'Token invalido ou expirado.',
    });
  }
}

module.exports = authMiddleware;
