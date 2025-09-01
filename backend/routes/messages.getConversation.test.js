const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
}));

const mockExecuteQuery = jest.fn().mockResolvedValue([[]]);

jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
}));

const messagesRouter = require('./messages');

describe('GET /conversation/:contactId', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/messages', messagesRouter);
    mockExecuteQuery.mockClear();
  });

  it('builds parameters correctly when before is absent', async () => {
    await request(app).get('/messages/conversation/2').expect(200);
    const [query, params] = mockExecuteQuery.mock.calls[0];
    const placeholders = (query.match(/\?/g) || []).length;
    expect(params).toHaveLength(placeholders);
  });

  it('builds parameters correctly when before is empty', async () => {
    await request(app).get('/messages/conversation/2').query({ before: '' }).expect(200);
    const [query, params] = mockExecuteQuery.mock.calls[0];
    const placeholders = (query.match(/\?/g) || []).length;
    expect(params).toHaveLength(placeholders);
  });

  it('builds parameters correctly when before is provided', async () => {
    await request(app)
      .get('/messages/conversation/2')
      .query({ before: '2024-01-01T00:00:00Z', limit: '10' })
      .expect(200);
    const [query, params] = mockExecuteQuery.mock.calls[0];
    const placeholders = (query.match(/\?/g) || []).length;
    expect(params).toHaveLength(placeholders);
    // ensure limit parsed and incremented
    expect(params[params.length - 1]).toBe(11);
  });
});
