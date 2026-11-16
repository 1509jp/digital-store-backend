
const { User } = require('../models');
const bcrypt = require('bcrypt');

// Buscar usuário pelo ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuario nao encontrado.',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar usuario:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

// Cadastrar novo usuário
async function createUser(req, res) {
  try {
    const {
      firstname,
      surname,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Verificar campos obrigatórios
    if (!firstname || !surname || !email ||
        !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Todos os campos sao obrigatorios.',
      });
    }

    // Verificar confirmação da senha
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'As senhas nao coincidem.',
      });
    }

    // Verificar se o email já está cadastrado
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email ja cadastrado.',
      });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salvar usuário no MySQL
    const user = await User.create({
      firstname,
      surname,
      email,
      password: hashedPassword,
    });

    // Retornar dados sem a senha
    return res.status(201).json({
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuario:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      firstname,
      surname,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Verificar se o usuário existe
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario nao encontrado.',
      });
    }

    // Verificar confirmação de senha
    if (password !== undefined) {
      if (!password || password !== confirmPassword) {
        return res.status(400).json({
          message: 'As senhas nao coincidem ou estao vazias.',
        });
      }
    } else if (confirmPassword !== undefined) {
      return res.status(400).json({
        message: 'Informe a senha para confirma-la.',
      });
    }

    // Atualizar somente os campos enviados
    if (firstname !== undefined) {
      if (typeof firstname !== 'string' || !firstname.trim()) {
        return res.status(400).json({
          message: 'Nome invalido.',
        });
      }
      user.firstname = firstname.trim();
    }

    if (surname !== undefined) {
      if (typeof surname !== 'string' || !surname.trim()) {
        return res.status(400).json({
          message: 'Sobrenome invalido.',
        });
      }
      user.surname = surname.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          message: 'Email invalido.',
        });
      }

      const existingUser = await User.findOne({
        where: { email: email.trim() },
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({
          message: 'Email ja cadastrado.',
        });
      }

      user.email = email.trim();
    }

    // Criptografar nova senha, caso seja enviada
    if (password !== undefined) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Salvar alterações no MySQL
    await user.save();

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao atualizar usuario:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Buscar usuário pelo ID
    const user = await User.findByPk(id);

    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        message: 'Usuario nao encontrado.',
      });
    }

    // Excluir usuário do banco de dados
    await user.destroy();

    return res.status(200).json({
      message: 'Usuario excluido com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir usuario:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};


