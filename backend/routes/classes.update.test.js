const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { role: 'admin' };
    next();
  },
}));

const mockExecuteQuery = jest.fn();
jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
}));

const classesRouter = require('./classes');

describe('PUT /classes/:classId', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/classes', classesRouter);
    mockExecuteQuery.mockReset();
  });

  it('replaces missing values with null when updating class', async () => {
    mockExecuteQuery.mockResolvedValue([{ affectedRows: 1 }]);

    await request(app).put('/classes/1').send({ year: 2 }).expect(200);

    expect(mockExecuteQuery).toHaveBeenCalledWith(
      'UPDATE classes SET year=?, semester=?, section=?, department=?, hod_id=? WHERE id=?',
      [2, null, null, null, null, '1']
    );
  });

  it('rejects invalid semester values', async () => {
    await request(app)
      .put('/classes/1')
      .send({ year: 2, semester: 3 })
      .expect(400);

    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });
});
