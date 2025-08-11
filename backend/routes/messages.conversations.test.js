const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
}));

const mockExecuteQuery = jest.fn().mockResolvedValue({
  recordset: [],
  rowsAffected: [],
});

jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
  sql: {},
}));

const conversationsRouter = require('./conversations');

describe('GET /conversations', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/conversations', conversationsRouter);
    mockExecuteQuery.mockClear();
  });

  it('queries conversations using single userId parameter for each query', async () => {
    mockExecuteQuery.mockResolvedValueOnce({ recordset: [] });
    mockExecuteQuery.mockResolvedValueOnce({ recordset: [] });
    await request(app).get('/conversations').expect(200);
    expect(mockExecuteQuery).toHaveBeenNthCalledWith(1, expect.any(String), [1]);
    expect(mockExecuteQuery).toHaveBeenNthCalledWith(2, expect.any(String), [1]);
  });
});
