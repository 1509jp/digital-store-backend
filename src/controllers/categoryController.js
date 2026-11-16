
const { Category } = require('../models');
const { Op } = require('sequelize');

// Buscar categoria pelo ID
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: 'Categoria nao encontrada.',
      });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


async function createCategory(req, res) {
  try {
    const { name, slug, use_in_menu } = req.body;

    // Validar campos obrigatórios
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof slug !== 'string' ||
      !slug.trim()
    ) {
      return res.status(400).json({
        message: 'Nome e slug sao obrigatorios.',
      });
    }

    // Validar campo opcional
    if (
      use_in_menu !== undefined &&
      typeof use_in_menu !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'use_in_menu deve ser true ou false.',
      });
    }

    // Verificar se o slug ja existe
    const existingCategory = await Category.findOne({
      where: { slug: slug.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: 'Slug ja cadastrado.',
      });
    }

    // Criar categoria no MySQL
    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
      use_in_menu: use_in_menu ?? false,
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Erro ao cadastrar categoria:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function searchCategories(req, res) {
  try {
    const { limit, page, fields, use_in_menu, keyword } = req.query;

    // Configurar paginacao
    const parsedLimit = Number(limit ?? 12);
    const parsedPage = Number(page ?? 1);

    if (
      !Number.isInteger(parsedLimit) ||
      !Number.isInteger(parsedPage) ||
      (parsedLimit !== -1 && (parsedLimit < 1 || parsedLimit > 100)) ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        message: 'Parametros de paginacao invalidos.',
      });
    }

    const offset = parsedLimit === -1 ? 0 : (parsedPage - 1) * parsedLimit;

    // Configurar filtros
    const where = {};

    if (keyword !== undefined) {
      if (typeof keyword !== 'string') {
        return res.status(400).json({
          message: 'Parametro keyword invalido.',
        });
      }

      if (keyword.trim()) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword.trim()}%` } },
          { slug: { [Op.like]: `%${keyword.trim()}%` } },
        ];
      }
    }

    if (use_in_menu !== undefined) {
      if (use_in_menu !== 'true' && use_in_menu !== 'false') {
        return res.status(400).json({
          message: 'use_in_menu deve ser true ou false.',
        });
      }

      where.use_in_menu = use_in_menu === 'true';
    }

    // Selecionar campos permitidos
    const allowedFields = ['id', 'name', 'slug', 'use_in_menu'];

    let attributes = allowedFields;

    if (fields !== undefined) {
      if (typeof fields !== 'string') {
        return res.status(400).json({
          message: 'Parametro fields invalido.',
        });
      }

      const selectedFields = fields
        .split(',')
        .map((field) => field.trim());

      if (
        selectedFields.some(
          (field) => !allowedFields.includes(field)
        )
      ) {
        return res.status(400).json({
          message: 'Um ou mais campos solicitados sao invalidos.',
        });
      }

      attributes = [...new Set(selectedFields)];
    }

    // Consultar categorias no MySQL
    const { count, rows } = await Category.findAndCountAll({
      where,
      attributes,
      ...(parsedLimit === -1 ? {} : { limit: parsedLimit, offset }),
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      data: rows,
      total: count,
      limit: parsedLimit,
      page: parsedLimit === -1 ? 1 : parsedPage,
    });
  } catch (error) {
    console.error('Erro ao pesquisar categorias:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, slug, use_in_menu } = req.body;

    // Verificar se a categoria existe
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: 'Categoria nao encontrada.',
      });
    }

    // Validar o nome, caso seja informado
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          message: 'Nome invalido.',
        });
      }
    }

    // Validar o slug, caso seja informado
    if (slug !== undefined) {
      if (typeof slug !== 'string' || !slug.trim()) {
        return res.status(400).json({
          message: 'Slug invalido.',
        });
      }

      // Verificar se o slug pertence a outra categoria
      const existingCategory = await Category.findOne({
        where: {
          slug: slug.trim(),
          id: { [Op.ne]: id },
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          message: 'Slug ja cadastrado.',
        });
      }
    }

    // Validar a configuracao do menu
    if (
      use_in_menu !== undefined &&
      typeof use_in_menu !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'use_in_menu deve ser true ou false.',
      });
    }

    // Atualizar somente os campos informados
    await category.update({
      name: name !== undefined ? name.trim() : category.name,
      slug: slug !== undefined ? slug.trim() : category.slug,
      use_in_menu:
        use_in_menu !== undefined
          ? use_in_menu
          : category.use_in_menu,
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o ID e valido
    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        message: 'ID da categoria invalido.',
      });
    }

    // Buscar a categoria no banco de dados
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        message: 'Categoria nao encontrada.',
      });
    }

    // Excluir a categoria
    await category.destroy();

    // Confirmar a exclusao
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir categoria:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


module.exports = {
  getCategoryById,
  createCategory,
  searchCategories,
  updateCategory,
  deleteCategory,
};




