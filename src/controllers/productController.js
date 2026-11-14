const { Op } = require('sequelize');

const {
  Product,
  ProductImage,
  ProductOption,
  Category,
} = require('../models');


const sequelize = require('../config/database');


async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        message: 'ID do produto invalido.',
      });
    }

    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          as: 'images',
        },
        {
          model: ProductOption,
          as: 'options',
        },
        {
          model: Category,
          as: 'categories',
          through: {
            attributes: [],
          },
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produto nao encontrado.',
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function searchProducts(req, res) {
  try {
    const {
      limit,
      page,
      keyword,
      category_ids,
      price_range,
      enabled,
    } = req.query;

    // Configurar paginacao
    const parsedLimit = Number(limit ?? 12);
    const parsedPage = Number(page ?? 1);

    if (
      !Number.isInteger(parsedLimit) ||
      !Number.isInteger(parsedPage) ||
      parsedLimit < 1 ||
      parsedLimit > 100 ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        message: 'Parametros de paginacao invalidos.',
      });
    }

    const offset = (parsedPage - 1) * parsedLimit;

    // Configurar filtros
    const where = {};

    // Pesquisar pelo nome ou descricao
    if (keyword !== undefined) {
      if (typeof keyword !== 'string') {
        return res.status(400).json({
          message: 'Parametro keyword invalido.',
        });
      }

      if (keyword.trim()) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword.trim()}%` } },
          { description: { [Op.like]: `%${keyword.trim()}%` } },
        ];
      }
    }

    // Filtrar produtos habilitados
    if (enabled !== undefined) {
      if (enabled !== 'true' && enabled !== 'false') {
        return res.status(400).json({
          message: 'enabled deve ser true ou false.',
        });
      }

      where.enabled = enabled === 'true';
    }

    // Filtrar por faixa de preco
    if (price_range !== undefined) {
      if (typeof price_range !== 'string') {
        return res.status(400).json({
          message: 'Faixa de preco invalida.',
        });
      }

      const parts = price_range.split('-');

      if (parts.length !== 2) {
        return res.status(400).json({
          message: 'Use price_range no formato minimo-maximo.',
        });
      }

      const min = Number(parts[0]);
      const max = Number(parts[1]);

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min < 0 ||
        max < min
      ) {
        return res.status(400).json({
          message: 'Faixa de preco invalida.',
        });
      }

      where.price = {
        [Op.between]: [min, max],
      };
    }

    // Filtrar por categorias
    const categoryInclude = {
      model: Category,
      as: 'categories',
      through: {
        attributes: [],
      },
    };

    if (category_ids !== undefined) {
      if (typeof category_ids !== 'string') {
        return res.status(400).json({
          message: 'IDs de categorias invalidos.',
        });
      }

      const ids = category_ids.split(',').map(Number);

      if (
        ids.length === 0 ||
        ids.some((id) => !Number.isSafeInteger(id) || id < 1)
      ) {
        return res.status(400).json({
          message: 'IDs de categorias invalidos.',
        });
      }

      categoryInclude.where = {
        id: {
          [Op.in]: ids,
        },
      };

      categoryInclude.required = true;
    }

    // Consultar produtos
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductImage,
          as: 'images',
        },
        {
          model: ProductOption,
          as: 'options',
        },
        categoryInclude,
      ],
      distinct: true,
      limit: parsedLimit,
      offset,
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      data: rows,
      total: count,
      limit: parsedLimit,
      page: parsedPage,
    });
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}

async function createProduct(req, res) {

let transaction;

  try {
    
const {
  enabled = true,
  name,
  slug,
  use_in_menu = false,
  stock = 0,
  description,
  price,
  price_with_discount,
  images = [],
  options = [],
  category_ids = [],
} = req.body;


    // Validar os campos obrigatorios
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof slug !== 'string' ||
      !slug.trim() ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price < 0 ||
      typeof price_with_discount !== 'number' ||
      !Number.isFinite(price_with_discount) ||
      price_with_discount < 0
    ) {
      return res.status(400).json({
        message: 'Dados obrigatorios do produto invalidos.',
      });
    }

    // Validar os demais campos
    if (
      typeof enabled !== 'boolean' ||
      typeof use_in_menu !== 'boolean' ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      (description !== undefined &&
        description !== null &&
        typeof description !== 'string')
    ) {
      return res.status(400).json({
        message: 'Dados adicionais do produto invalidos.',
      });
    }

    if (price_with_discount > price) {
      return res.status(400).json({
        message: 'O preco com desconto nao pode superar o preco original.',
      });
    }


if (
  !Array.isArray(images) ||
  !Array.isArray(options) ||
  !Array.isArray(category_ids)
) {
  return res.status(400).json({
    message: 'Imagens, opcoes e categorias devem ser arrays.',
  });
}


if (
  !category_ids.every(
    (id) => Number.isSafeInteger(id) && id > 0
  )
) {
  return res.status(400).json({
    message: 'Os IDs das categorias devem ser numeros inteiros positivos.',
  });
}


if (
  !images.every(
    (image) =>
      image !== null &&
      typeof image === 'object' &&
      !Array.isArray(image) &&
      typeof image.path === 'string' &&
      image.path.trim().length > 0 &&
      image.path.length <= 255 &&
      (image.enabled === undefined ||
        typeof image.enabled === 'boolean')
  )
) {
  return res.status(400).json({
    message: 'Dados das imagens do produto invalidos.',
  });
}


if (
  !options.every(
    (option) =>
      option !== null &&
      typeof option === 'object' &&
      !Array.isArray(option) &&
      typeof option.title === 'string' &&
      option.title.trim().length > 0 &&
      option.title.length <= 255 &&
      ['square', 'circle'].includes(option.shape) &&
      Number.isSafeInteger(option.radius) &&
      option.radius >= 0 &&
      ['text', 'color'].includes(option.type) &&
      Array.isArray(option.values) &&
      option.values.length > 0 &&
      option.values.every(
        (value) =>
          typeof value === 'string' &&
          value.trim().length > 0
      )
  )
) {
  return res.status(400).json({
    message: 'Dados das opcoes do produto invalidos.',
  });
}


    // Evitar slugs duplicados
    const existingProduct = await Product.findOne({
      where: { slug: slug.trim() },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: 'Ja existe um produto com este slug.',
      });
    }



transaction = await sequelize.transaction();


const product = await Product.create(
  {
    enabled,
    name: name.trim(),
    slug: slug.trim(),
    use_in_menu,
    stock,
    description: description ?? null,
    price,
    price_with_discount,
  },
  {
    transaction,
  }
);

if (images.length > 0) {
  await ProductImage.bulkCreate(
    images.map((image) => ({
      product_id: product.id,
      enabled: image.enabled ?? true,
      path: image.path.trim(),
    })),
    { transaction }
  );
}

if (options.length > 0) {
  await ProductOption.bulkCreate(
    options.map((option) => ({
      product_id: product.id,
      title: option.title.trim(),
      shape: option.shape,
      radius: option.radius,
      type: option.type,
      values: JSON.stringify(option.values),
    })),
    { transaction }
  );
}

if (category_ids.length > 0) {
  const categories = await Category.findAll({
    where: {
      id: category_ids,
    },
    transaction,
  });

  
if (categories.length !== new Set(category_ids).size) {
  await transaction.rollback();

  return res.status(400).json({
    message: 'Uma ou mais categorias informadas nao existem.',
  });
}


  await product.addCategories(categories, { transaction });
}


await transaction.commit();

    return res.status(201).json(product);
  } catch (error) {

if (transaction && !transaction.finished) {
  await transaction.rollback();
}

    console.error('Erro ao cadastrar produto:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


async function updateProduct(req, res) {
  let transaction;

  try {

    const { id } = req.params;

    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        message: 'ID do produto invalido.'
      });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: 'Produto nao encontrado.'
      });
    }

    const allowedFields = [
      'enabled',
      'name',
      'slug',
      'use_in_menu',
      'stock',
      'description',
      'price',
      'price_with_discount'
    ];


const hasImages = Object.prototype.hasOwnProperty.call(req.body, 'images');
const hasOptions = Object.prototype.hasOwnProperty.call(req.body, 'options');
const hasCategories = Object.prototype.hasOwnProperty.call(req.body, 'category_ids');


    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

if (
  Object.keys(updates).length === 0 &&
  !hasImages &&
  !hasOptions &&
  !hasCategories
) {
  return res.status(400).json({
    message: 'Nenhum campo valido para atualizar.'
  });
}

if (hasImages && !Array.isArray(req.body.images)) {
  return res.status(400).json({
    message: 'O campo images deve ser um array.'
  });
}

if (hasOptions && !Array.isArray(req.body.options)) {
  return res.status(400).json({
    message: 'O campo options deve ser um array.'
  });
}

if (hasCategories && !Array.isArray(req.body.category_ids)) {
  return res.status(400).json({
    message: 'O campo category_ids deve ser um array.'
  });
}

if (hasCategories) {
  const invalidCategory = req.body.category_ids.some(
    (categoryId) =>
      !Number.isSafeInteger(categoryId) || categoryId < 1
  );

  if (invalidCategory) {
    return res.status(400).json({
      message: 'Um ou mais IDs de categorias sao invalidos.'
    });
  }
}

if (hasImages) {
  const invalidImage = req.body.images.some((image) =>
    !image ||
    typeof image !== 'object' ||
    Array.isArray(image) ||
    typeof image.path !== 'string' ||
    !image.path.trim() ||
    image.path.length > 255 ||
    (image.enabled !== undefined &&
      typeof image.enabled !== 'boolean')
  );

  if (invalidImage) {
    return res.status(400).json({
      message: 'Uma ou mais imagens possuem dados invalidos.'
    });
  }
}

if (hasOptions) {
  const invalidOption = req.body.options.some((option) =>
    !option ||
    typeof option !== 'object' ||
    Array.isArray(option) ||
    typeof option.title !== 'string' ||
    !option.title.trim() ||
    option.title.length > 255 ||
    !['square', 'circle'].includes(option.shape) ||
    !Number.isSafeInteger(option.radius) ||
    option.radius < 0 ||
    !['text', 'color'].includes(option.type) ||
    !Array.isArray(option.values) ||
    option.values.length === 0 ||
    option.values.some(
      (value) =>
        typeof value !== 'string' ||
        !value.trim()
    )
  );

  if (invalidOption) {
    return res.status(400).json({
      message: 'Uma ou mais opcoes possuem dados invalidos.'
    });
  }
}


    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || !updates.name.trim()) {
        return res.status(400).json({
          message: 'Nome do produto invalido.'
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== 'string' || !updates.slug.trim()) {
        return res.status(400).json({
          message: 'Slug do produto invalido.'
        });
      }

      updates.slug = updates.slug.trim();

      const existingProduct = await Product.findOne({
        where: {
          slug: updates.slug,
          id: { [Op.ne]: id }
        }
      });

      if (existingProduct) {
        return res.status(400).json({
          message: 'Ja existe um produto com este slug.'
        });
      }
    }

    for (const field of ['enabled', 'use_in_menu']) {
      if (updates[field] !== undefined &&
          typeof updates[field] !== 'boolean') {
        return res.status(400).json({
          message: `Campo ${field} invalido.`
        });
      }
    }

    if (updates.stock !== undefined &&
        (!Number.isSafeInteger(updates.stock) || updates.stock < 0)) {
      return res.status(400).json({
        message: 'Estoque invalido.'
      });
    }

    if (updates.description !== undefined &&
        updates.description !== null &&
        typeof updates.description !== 'string') {
      return res.status(400).json({
        message: 'Descricao invalida.'
      });
    }

    for (const field of ['price', 'price_with_discount']) {
      if (updates[field] !== undefined &&
          (typeof updates[field] !== 'number' ||
           !Number.isFinite(updates[field]) ||
           updates[field] < 0)) {
        return res.status(400).json({
          message: `Campo ${field} invalido.`
        });
      }
    }

    const finalPrice = updates.price ?? product.price;
    const finalDiscount =
      updates.price_with_discount ?? product.price_with_discount;

    if (finalDiscount > finalPrice) {
      return res.status(400).json({
        message: 'O preco com desconto nao pode superar o preco original.'
      });
    }

    
transaction = await sequelize.transaction();

await product.update(updates, { transaction });

if (hasCategories) {
  const categoryIds = [...new Set(req.body.category_ids)];

  const categories = await Category.findAll({
    where: {
      id: categoryIds
    },
    transaction
  });

  if (categories.length !== categoryIds.length) {
    await transaction.rollback();

    return res.status(400).json({
      message: 'Uma ou mais categorias informadas nao existem.'
    });
  }

await product.setCategories(categories, { transaction });
}


if (hasImages) {
  await ProductImage.destroy({
    where: {
      product_id: product.id
    },
    transaction
  });

  if (req.body.images.length > 0) {
    await ProductImage.bulkCreate(
      req.body.images.map((image) => ({
        product_id: product.id,
        enabled: image.enabled ?? true,
        path: image.path.trim()
      })),
      { transaction }
    );
  }
}


if (hasOptions) {
  await ProductOption.destroy({
    where: {
      product_id: product.id
    },
    transaction
  });

  if (req.body.options.length > 0) {
    await ProductOption.bulkCreate(
      req.body.options.map((option) => ({
        product_id: product.id,
        title: option.title.trim(),
        shape: option.shape,
        radius: option.radius,
        type: option.type,
        values: JSON.stringify(option.values)
      })),
      { transaction }
    );
  }
}

await transaction.commit();

return res.status(200).json(product);

  
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error('Erro ao atualizar produto:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.'
    });
  }
}


async function deleteProduct(req, res) {
  let transaction;

  try {
    const { id } = req.params;

    // Validar o ID informado
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({
        message: 'ID do produto invalido.'
      });
    }

    // Procurar o produto no banco
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: 'Produto nao encontrado.'
      });
    }

    // Iniciar transacao
    transaction = await sequelize.transaction();

    // Remover relacionamentos com categorias
    await product.setCategories([], { transaction });

    // Excluir imagens relacionadas
    await ProductImage.destroy({
      where: { product_id: product.id },
      transaction
    });

    // Excluir opcoes relacionadas
    await ProductOption.destroy({
      where: { product_id: product.id },
      transaction
    });

    // Excluir o produto
    await product.destroy({ transaction });

    // Confirmar todas as exclusoes
    await transaction.commit();

    return res.status(204).send();

  } catch (error) {

    // Desfazer alteracoes se ocorrer algum erro
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error('Erro ao excluir produto:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.'
    });
  }
}


module.exports = {
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
};



