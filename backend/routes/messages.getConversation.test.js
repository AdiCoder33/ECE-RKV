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

  it('uses default limit when none is provided', async () => {
    await request(app).get('/messages/conversation/2').expect(200);
    const [query, params] = mockExecuteQuery.mock.calls[0];
    expect(query.match(/\?/g)).toHaveLength(5);
    expect(params).toEqual([1, 2, 2, 1, 51]);
  });

  it('ignores empty before parameter', async () => {
    await request(app).get('/messages/conversation/2').query({ before: '' }).expect(200);
    const [, params] = mockExecuteQuery.mock.calls[0];
    expect(params).toEqual([1, 2, 2, 1, 51]);
  });

  it('parses limit correctly when provided alongside before', async () => {
    await request(app)
      .get('/messages/conversation/2')
      .query({ before: '2024-01-01T00:00:00Z', limit: '10' })
      .expect(200);
    const [, params] = mockExecuteQuery.mock.calls[0];
    expect(params).toEqual([1, 2, 2, 1, 11]);
  });
});
