const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: '1' };
    next();
  })
}));

jest.mock('../config/database', () => ({
  executeQuery: jest.fn(),
  connectDB: jest.fn()
}));

const { executeQuery } = require('../config/database');
const studentsRouter = require('./students');

describe('GET /students/:id/subjects', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/students', studentsRouter);
    executeQuery.mockReset();
  });

  it('scales best two mid marks to 40', async () => {
    executeQuery.mockResolvedValueOnce([
      [
        {
          id: 1,
          name: 'Math',
          code: 'M1',
          credits: 3,
          type: 'core',
          mid1: 25,
          mid2: 30,
          mid3: 20,
          mid1Max: 30,
          mid2Max: 30,
          mid3Max: 30,
          total_classes: 0,
          attended_classes: 0
        }
      ]
    ]);

    const res = await request(app).get('/students/1/subjects');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      mid1: 25,
      mid2: 30,
      mid3: 20,
      internal: 37,
      internalTotal: 40
    });
  });
});
