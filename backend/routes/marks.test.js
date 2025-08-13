const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: '42' };
    next();
  }),
}));

const { authenticateToken } = require('../middleware/auth');

jest.mock('../config/database', () => ({
  executeQuery: jest.fn(),
  sql: {},
}));

const { executeQuery } = require('../config/database');

const marksRouter = require('./marks');

describe('marks bulk entry', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/marks', marksRouter);
    executeQuery.mockReset();
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: '42' };
      next();
    });
  });

  it('uses numeric entered_by from req.user.id', async () => {
    executeQuery
      .mockResolvedValueOnce({ recordset: [{ id: 1 }] }) // student lookup
      .mockResolvedValueOnce({ recordset: [{ id: 2 }] }) // subject lookup
      .mockResolvedValueOnce({}); // insert

    const payload = {
      type: 'internal',
      date: '2024-01-01',
      marksData: [
        { rollNumber: 'R1', subject: 'Math', maxMarks: 100, marks: 95 }
      ]
    };

    await request(app).post('/marks/bulk').send(payload).expect(200);

    expect(executeQuery).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO InternalMarks'),
      [1, 2, 'internal', 95, 100, '2024-01-01', 42]
    );
  });

  it('returns 400 for invalid user ID', async () => {
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'abc' };
      next();
    });

    const payload = {
      type: 'internal',
      date: '2024-01-01',
      marksData: []
    };

    await request(app).post('/marks/bulk').send(payload).expect(400);
    expect(executeQuery).not.toHaveBeenCalled();
  });
});
