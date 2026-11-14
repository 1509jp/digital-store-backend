
const request = require('supertest');
const app = require('../src/app');

describe('Digital Store API', () => {

  test('GET / deve retornar status 200', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: 'Digital Store API funcionando!'
    });
  });

  test('GET /rota-inexistente deve retornar status 404', async () => {
    const response = await request(app).get('/rota-inexistente');

    expect(response.status).toBe(404);
  });

});
