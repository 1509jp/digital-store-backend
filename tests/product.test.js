
const request = require('supertest');
const app = require('../src/app');

describe('Digital Store API - Produtos', () => {

test('GET /v1/product/search deve filtrar por palavra-chave', async () => {
  const response = await request(app)
    .get('/v1/product/search?keyword=Tenis');

  expect(response.status).toBe(200);

  expect(Array.isArray(response.body.data)).toBe(true);

  response.body.data.forEach((product) => {
    const name = product.name.toLowerCase();
    const description = (product.description || '').toLowerCase();

    expect(
      name.includes('tenis') || description.includes('tenis')
    ).toBe(true);
  });
});


test('GET /v1/product/search deve respeitar a paginacao', async () => {
  const response = await request(app)
    .get('/v1/product/search?limit=1&page=2');

  expect(response.status).toBe(200);

  expect(response.body.limit).toBe(1);
  expect(response.body.page).toBe(2);

  expect(Array.isArray(response.body.data)).toBe(true);
  expect(response.body.data.length).toBeLessThanOrEqual(1);
});


test('GET /v1/product/search deve retornar produtos paginados', async () => {
  const response = await request(app).get('/v1/product/search');

  expect(response.status).toBe(200);

  expect(Array.isArray(response.body.data)).toBe(true);

  expect(typeof response.body.total).toBe('number');
  expect(typeof response.body.limit).toBe('number');
  expect(typeof response.body.page).toBe('number');
});


test('DELETE /v1/product/3 sem token deve retornar status 400', async () => {
  const response = await request(app)
    .delete('/v1/product/3');

  expect(response.status).toBe(400);
});

test('PUT /v1/product/3 sem token deve retornar status 400', async () => {
  const response = await request(app)
    .put('/v1/product/3')
    .send({
      stock: 999
    });

  expect(response.status).toBe(400);
});

test('POST /v1/product sem token deve retornar status 400', async () => {
  const response = await request(app)
    .post('/v1/product')
    .send({
      name: 'Produto Sem Autenticacao',
      slug: 'produto-sem-autenticacao',
      stock: 10,
      price: 100,
      price_with_discount: 90
    });

  expect(response.status).toBe(400);
});


test('GET /v1/product/999999 deve retornar status 404', async () => {
  const response = await request(app).get('/v1/product/999999');

  expect(response.status).toBe(404);

  expect(response.body).toEqual({
    message: 'Produto nao encontrado.'
  });
});


  test('GET /v1/product/abc deve retornar status 400', async () => {
    const response = await request(app).get('/v1/product/abc');

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: 'ID do produto invalido.'
    });
  });

});

const sequelize = require('../src/config/database');

afterAll(async () => {
  await sequelize.close();
});

