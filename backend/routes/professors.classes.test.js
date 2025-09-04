const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 1, role: 'professor' };
    next();
  },
}));

const mockExecuteQuery = jest.fn();
jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
}));

const professorsRouter = require('./professors');

describe('GET /professors/:id/classes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/professors', professorsRouter);

    mockExecuteQuery.mockReset();
    mockExecuteQuery
      .mockResolvedValueOnce([[{ year: 1, semester: 1, section: 'A' }]])
      .mockResolvedValueOnce([[{ count: 2 }]])
      .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]])
      .mockResolvedValueOnce([[{ avg_score: 75 }]])
      .mockResolvedValueOnce([[{ attendance: 80 }]]);
  });

  it('returns class metrics using present column', async () => {
    const res = await request(app).get('/professors/1/classes').expect(200);

    expect(res.body).toEqual([
      {
        name: '1-A',
        year: 1,
        semester: 1,
        section: 'A',
        students: 2,
        avgScore: 75,
        attendance: 80,
      },
    ]);

    const attendanceCall = mockExecuteQuery.mock.calls[4];
    expect(attendanceCall[0]).toMatch(/present = 1/);
    expect(attendanceCall[0]).not.toMatch(/status/);
  });
});

