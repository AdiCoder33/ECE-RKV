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

const messagesRouter = require('./messages');

describe('GET /messages/conversations', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/messages', messagesRouter);
    mockExecuteQuery.mockClear();
  });

  it('queries conversations using single userId parameter', async () => {
    await request(app).get('/messages/conversations').expect(200);
    expect(mockExecuteQuery).toHaveBeenCalledWith(expect.any(String), [1]);
    const query = mockExecuteQuery.mock.calls[0][0];
    const placeholders = (query.match(/\?/g) || []).length;
    expect(placeholders).toBe(1);
  });
});
