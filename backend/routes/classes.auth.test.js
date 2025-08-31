const request = require('supertest');
const express = require('express');

const mockExecuteQuery = jest.fn().mockResolvedValue([[]]);

jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role) {
      req.user = { role };
    }
    next();
  },
}));

const classesRouter = require('./classes');

describe('classes routes authorization', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/classes', classesRouter);
    mockExecuteQuery.mockClear();
  });

  it('rejects unauthorized role for creating class', async () => {
    await request(app)
      .post('/classes')
      .set('x-user-role', 'student')
      .send({ year: 1, semester: 1, section: 'A' })
      .expect(403);
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('allows admin to hit validation for creating class', async () => {
    await request(app)
      .post('/classes')
      .set('x-user-role', 'admin')
      .send({})
      .expect(400);
  });

  it('rejects unauthorized role for updating class', async () => {
    await request(app)
      .put('/classes/1')
      .set('x-user-role', 'student')
      .send({})
      .expect(403);
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('rejects unauthorized role for deleting class', async () => {
    await request(app)
      .delete('/classes/1')
      .set('x-user-role', 'student')
      .expect(403);
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('rejects unauthorized role for promoting classes', async () => {
    await request(app)
      .post('/classes/promote')
      .set('x-user-role', 'student')
      .send({ currentSemester: 1 })
      .expect(403);
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });
});
