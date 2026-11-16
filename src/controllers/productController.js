const { Op } = require('sequelize');

const {
  Product,
  ProductImage,
  ProductOption,
  Category,
} = require('../models');


const sequelize = require('../config/database');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

    const productData = product.toJSON();

const response = {
  id: productData.id,
  enabled: productData.enabled,
  name: productData.name,
  slug: productData.slug,
  stock: productData.stock,
  description: productData.description,
  price: productData.price,
  price_with_discount: productData.price_with_discount,
  category_ids: productData.categories.map((category) => category.id),
  images: productData.images.map((image) => ({
    id: image.id,
    content: image.path,
  })),
  options: productData.options.map((option) => ({
    id: option.id,
    title: option.title,
    shape: option.shape,
    radius: option.radius,
    type: option.type,
    values: option.values.split(','),
  })),
};

return res.status(200).json(response);
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
  fields,
  match,
  category_ids,
  enabled,
} = req.query;

    const price_range = req.query['price-range'];

    // Identificar filtros de opcoes: option[ID]
const optionFilters = Object.entries(req.query).filter(
  ([key]) => /^option\[\d+\]$/.test(key)
);

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

    const offset =
      parsedLimit === -1 ? 0 : (parsedPage - 1) * parsedLimit;

    // Configurar filtros
    const where = {};

    // Validar os campos solicitados
let selectedFields = null;

if (fields !== undefined) {
  if (typeof fields !== 'string' || !fields.trim()) {
    return res.status(400).json({
      message: 'Parametro fields invalido.',
    });
  }

  selectedFields = fields.split(',').map((field) => field.trim());

  const allowedFields = [
    'id',
    'enabled',
    'name',
    'slug',
    'stock',
    'description',
    'price',
    'price_with_discount',
    'category_ids',
    'images',
    'options',
  ];

  if (
    selectedFields.some(
      (field) => !allowedFields.includes(field)
    )
  ) {
    return res.status(400).json({
      message: 'Um ou mais campos solicitados sao invalidos.',
    });
  }
}

    // Pesquisar pelo nome ou descricao
    if (match !== undefined) {
      if (typeof match !== 'string') {
        return res.status(400).json({
          message: 'Parametro match invalido.',
        });
      }

      if (match.trim()) {
        where[Op.or] = [
          { name: { [Op.like]: `%${match.trim()}%` } },
          { description: { [Op.like]: `%${match.trim()}%` } },
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
          message: 'Use price-range no formato minimo-maximo.',
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

// Validar os filtros de opcoes
const parsedOptionFilters = [];

for (const [key, value] of optionFilters) {
  const optionId = Number(key.match(/\d+/)[0]);

  if (
    !Number.isSafeInteger(optionId) ||
    optionId < 1 ||
    typeof value !== 'string'
  ) {
    return res.status(400).json({
      message: 'Filtro de opcao invalido.',
    });
  }

  const values = value.split(',').map((item) => item.trim());

  if (values.some((item) => !item)) {
    return res.status(400).json({
      message: 'Valores do filtro de opcao invalidos.',
    });
  }

  parsedOptionFilters.push({
    id: optionId,
    values,
  });
}

// Filtrar produtos pelas opcoes solicitadas
if (parsedOptionFilters.length > 0) {
  const matchingIds = [];

  for (const filter of parsedOptionFilters) {
    const option = await ProductOption.findByPk(filter.id);

    const optionValues = option
      ? option.values.split(',').map((value) => value.trim())
      : [];

    const matches = filter.values.some((value) =>
      optionValues.includes(value)
    );

    if (!option || !matches) {
      where.id = { [Op.in]: [] };
      break;
    }

    matchingIds.push(option.product_id);
  }

  if (!where.id) {
    where.id = {
      [Op.in]: matchingIds.every((id) => id === matchingIds[0])
        ? [matchingIds[0]]
        : [],
    };
  }
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
      ...(parsedLimit === -1
        ? {}
        : { limit: parsedLimit, offset }),
      order: [['id', 'ASC']],
    });

    // Formatar resposta conforme o enunciado
    const data = rows.map((product) => {
      const item = product.toJSON();

      const response = {
        id: item.id,
        enabled: item.enabled,
        name: item.name,
        slug: item.slug,
        stock: item.stock,
        description: item.description,
        price: item.price,
        price_with_discount: item.price_with_discount,
        category_ids: item.categories.map(
          (category) => category.id
        ),
        images: item.images.map((image) => ({
          id: image.id,
          content: image.path,
        })),
                options: item.options.map((option) => ({
          id: option.id,
          title: option.title,
          shape: option.shape,
          radius: option.radius,
          type: option.type,
          values: option.values.split(','),
        })),
      };

      if (selectedFields === null) {
        return response;
      }

      return Object.fromEntries(
        Object.entries(response).filter(([key]) =>
          key === 'id' || selectedFields.includes(key)
        )
      );
    });

    return res.status(200).json({
      data,
      total: count,
      limit: parsedLimit,
      page: parsedLimit === -1 ? 1 : parsedPage,
    });
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}
function saveProductImage(image) {
  if (
    !image ||
    typeof image.content !== 'string' ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(image.type)
  ) {
    throw new Error('Imagem invalida.');
  }

  const base64 = image.content.replace(
    /^data:image\/(png|jpeg|webp);base64,/,
    ''
  );

  if (
    !base64 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
  ) {
    throw new Error('Conteudo Base64 invalido.');
  }

  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    throw new Error('Imagem vazia ou maior que 5 MB.');
  }

  const extensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };

  const filename = `${crypto.randomUUID()}.${extensions[image.type]}`;

  const uploadDir = path.join(__dirname, '../../public/uploads');

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

function normalizeRadius(radius) {
  if (radius === undefined) return 0;

  if (typeof radius === 'string') {
    if (!/^\d+px$/.test(radius)) return NaN;
    radius = Number(radius.slice(0, -2));
  }

  return Number.isSafeInteger(radius) && radius >= 0
    ? radius
    : NaN;
}

function getOptionValues(option) {
  return option.values ?? option.value;
}

async function createProduct(req, res) {

  let transaction;
  const savedImagePaths = [];

  try {
    
const {
  enabled = false,
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
      typeof image.type === 'string' &&
['image/png', 'image/jpeg', 'image/webp'].includes(image.type) &&
typeof image.content === 'string' &&
image.content.trim().length > 0 &&
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
      ['square', 'circle'].includes(option.shape ?? 'square') &&
      Number.isSafeInteger(normalizeRadius(option.radius)) &&
      ['text', 'color'].includes(option.type ?? 'text') &&
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
  const imageRecords = images.map((image) => {
    const imagePath = saveProductImage(image);

    savedImagePaths.push(imagePath);

    return {
      product_id: product.id,
      enabled: image.enabled ?? false,
      path: imagePath,
    };
  });

  await ProductImage.bulkCreate(imageRecords, { transaction });
}

if (options.length > 0) {
  await ProductOption.bulkCreate(
    options.map((option) => ({
      product_id: product.id,
      title: option.title.trim(),
      shape: option.shape ?? 'square',
      radius: normalizeRadius(option.radius),
      type: option.type ?? 'text',
      values: getOptionValues(option).join(',')
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
// Remover imagens salvas se o cadastro falhar
for (const imagePath of transaction?.finished === 'commit' ? [] : savedImagePaths) {
  try {
    const filename = path.basename(imagePath);
    const filePath = path.join(
      __dirname,
      '../../public/uploads',
      filename
    );

    fs.unlinkSync(filePath);
  } catch (fileError) {
    console.error(
      'Erro ao remover imagem:',
      fileError.message
    );
  }
}

    console.error('Erro ao cadastrar produto:', error.message);

    return res.status(500).json({
      message: 'Erro interno do servidor.',
    });
  }
}


async function updateProduct(req, res) {
  let transaction;
  const savedImagePaths = [];

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
  const invalidImage = req.body.images.some((image) => {
    if (
      !image ||
      typeof image !== 'object' ||
      Array.isArray(image)
    ) {
      return true;
    }

    // Validar o ID, quando informado
    if (
      image.id !== undefined &&
      (!Number.isSafeInteger(image.id) || image.id < 1)
    ) {
      return true;
    }

    // Validar exclusao
    if (
      image.deleted !== undefined &&
      typeof image.deleted !== 'boolean'
    ) {
      return true;
    }

    // Imagem marcada para exclusao
    if (image.deleted === true) {
      return image.id === undefined;
    }

    // Validar enabled, quando informado
    if (
      image.enabled !== undefined &&
      typeof image.enabled !== 'boolean'
    ) {
      return true;
    }

    // Imagem existente sem novo conteudo
    if (
      image.id !== undefined &&
      image.content === undefined &&
      image.type === undefined
    ) {
      return false;
    }

    // Nova imagem ou substituicao de conteudo
    return (
      !['image/png', 'image/jpeg', 'image/webp'].includes(image.type) ||
      typeof image.content !== 'string' ||
      !image.content.trim()
    );
  });

  if (invalidImage) {
    return res.status(400).json({
      message: 'Uma ou mais imagens possuem dados invalidos.'
    });
  }
}

if (hasOptions) {
  const invalidOption = req.body.options.some((option) => {
    if (
      !option ||
      typeof option !== 'object' ||
      Array.isArray(option)
    ) {
      return true;
    }

    // Validar ID, quando informado
    if (
      option.id !== undefined &&
      (!Number.isSafeInteger(option.id) || option.id < 1)
    ) {
      return true;
    }

    // Validar exclusao
    if (
      option.deleted !== undefined &&
      typeof option.deleted !== 'boolean'
    ) {
      return true;
    }

    if (option.deleted === true) {
      return option.id === undefined;
    }

    // Novas opcoes precisam de titulo e valores
if (
  option.id === undefined &&
  (option.title === undefined ||
   getOptionValues(option) === undefined)
) {
  return true;
}

    // Validar titulo, quando informado
    if (
      option.title !== undefined &&
      (typeof option.title !== 'string' ||
       !option.title.trim() ||
       option.title.length > 255)
    ) {
      return true;
    }

    // Validar formato
    if (
      option.shape !== undefined &&
      !['square', 'circle'].includes(option.shape)
    ) {
      return true;
    }

    // Validar raio
    // Validar raio
if (
  option.radius !== undefined &&
  !Number.isSafeInteger(normalizeRadius(option.radius))
) {
  return true;
}

    // Validar tipo
    if (
      option.type !== undefined &&
      !['text', 'color'].includes(option.type)
    ) {
      return true;
    }

    // Validar valores, quando informados
    // Validar valores, quando informados
if (
  getOptionValues(option) !== undefined &&
  (!Array.isArray(getOptionValues(option)) ||
   getOptionValues(option).length === 0 ||
   getOptionValues(option).some(
     (value) =>
       typeof value !== 'string' ||
       !value.trim()
   ))
) {
  return true;
}

    return false;
  });

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
  for (const image of req.body.images) {
    if (image.id !== undefined) {
      const existingImage = await ProductImage.findOne({
        where: {
          id: image.id,
          product_id: product.id
        },
        transaction
      });

      if (!existingImage) {
        await transaction.rollback();

        return res.status(400).json({
          message: 'Imagem nao encontrada neste produto.'
        });
      }

      if (image.deleted === true) {
        await existingImage.destroy({ transaction });
        continue;
      }

      const imageUpdates = {};

      if (image.enabled !== undefined) {
        imageUpdates.enabled = image.enabled;
      }

      if (image.content !== undefined) {
        const imagePath = saveProductImage(image);

        savedImagePaths.push(imagePath);
        imageUpdates.path = imagePath;
      }

      await existingImage.update(imageUpdates, { transaction });
    } else {
      const imagePath = saveProductImage(image);

      savedImagePaths.push(imagePath);

      await ProductImage.create(
        {
          product_id: product.id,
          enabled: image.enabled ?? false,
          path: imagePath
        },
        { transaction }
      );
    }
  }
}


if (hasOptions) {
  for (const option of req.body.options) {

    // Atualizar ou excluir uma opcao existente
    if (option.id !== undefined) {
      const existingOption = await ProductOption.findOne({
        where: {
          id: option.id,
          product_id: product.id
        },
        transaction
      });

      if (!existingOption) {
        await transaction.rollback();

        return res.status(400).json({
          message: 'Opcao nao encontrada neste produto.'
        });
      }

      if (option.deleted === true) {
        await existingOption.destroy({ transaction });
        continue;
      }

      const optionUpdates = {};

      for (const field of [
        'title',
        'shape',
        'radius',
        'type'
      ]) {
        if (option[field] !== undefined) {
  optionUpdates[field] =
    field === 'radius'
      ? normalizeRadius(option[field])
      : option[field];
}
      }

      if (getOptionValues(option) !== undefined) {
  optionUpdates.values = getOptionValues(option).join(',');
}

await existingOption.update(optionUpdates, {
  transaction
});

} else {

      // Adicionar uma nova opcao
      await ProductOption.create(
        {
          product_id: product.id,
          title: option.title.trim(),
          shape: option.shape ?? 'square',
          radius: normalizeRadius(option.radius),
          type: option.type ?? 'text',
          values: getOptionValues(option).join(',')
        },
        { transaction }
      );
    }
  }
}

await transaction.commit();

return res.status(204).send();

  
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    // Remover imagens novas caso a atualizacao falhe
if (transaction?.finished !== 'commit') {
  for (const imagePath of savedImagePaths) {
    try {
      const filename = path.basename(imagePath);
      const filePath = path.join(
        __dirname,
        '../../public/uploads',
        filename
      );

      fs.unlinkSync(filePath);
    } catch (fileError) {
      console.error(
        'Erro ao remover imagem:',
        fileError.message
      );
    }
  }
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



