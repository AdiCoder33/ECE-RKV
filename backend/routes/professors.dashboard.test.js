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

describe('GET /professors/:id/dashboard', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/professors', professorsRouter);

    mockExecuteQuery.mockReset();
    mockExecuteQuery
      .mockResolvedValueOnce([[{ year: 1, semester: 1, section: 'A', subject: 'Sub1' }]])
      .mockResolvedValueOnce([[{ total_students: 10 }]])
      .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]])
      .mockResolvedValueOnce([[{ avg_attendance: 80 }]])
      .mockResolvedValueOnce([[{ expected: 20 }]])
      .mockResolvedValueOnce([[{ graded: 5 }]]);
  });

  it('returns dashboard metrics using numeric subject IDs', async () => {
    const res = await request(app).get('/professors/1/dashboard').expect(200);

    expect(res.body).toEqual({
      totalStudents: 10,
      activeClasses: 1,
      avgAttendance: 80,
      pendingGrading: 15,
    });

    const attendanceCall = mockExecuteQuery.mock.calls[3];
    expect(attendanceCall[0]).toMatch(/subject_id IN \(\?,\?\)/);
    expect(attendanceCall[1]).toEqual([1, 2]);

    const gradedCall = mockExecuteQuery.mock.calls[5];
    expect(gradedCall[0]).toMatch(/subject_id IN \(\?,\?\)/);
    expect(gradedCall[1]).toEqual([1, 2]);
  });
});
