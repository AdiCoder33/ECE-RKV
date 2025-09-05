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
  connectDB: jest.fn(),
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
      .mockResolvedValueOnce([[{ id: 1 }]]) // student lookup
      .mockResolvedValueOnce([[{ id: 2 }]]) // subject lookup
      .mockResolvedValueOnce([{}]); // insert

    const payload = {
      type: 'internal',
      date: '2024-01-01',
      marksData: [
        {
          rollNumber: 'R1',
          section: 'A',
          year: 1,
          semester: 1,
          subject: 'Math',
          maxMarks: 100,
          marks: 95,
        },
      ],
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

  it('returns 400 for invalid marks', async () => {
    const payload = {
      type: 'internal',
      date: '2024-01-01',
      marksData: [
        {
          rollNumber: 'R1',
          section: 'A',
          subject: 'Math',
          maxMarks: 100,
          marks: 'NaN',
        },
      ],
    };

    await request(app).post('/marks/bulk').send(payload).expect(400);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('updates existing record when same mark imported twice', async () => {
    const marksDb = [];
    executeQuery.mockImplementation((sql, params) => {
      if (sql.startsWith('SELECT id FROM users')) {
        return Promise.resolve([[{ id: 1 }]]);
      }
      if (sql.startsWith('SELECT id FROM subjects')) {
        return Promise.resolve([[{ id: 2 }]]);
      }
      if (sql.startsWith('INSERT INTO InternalMarks')) {
        const [studentId, subjectId, type, marks] = params;
        const existing = marksDb.find(
          m => m.student_id === studentId && m.subject_id === subjectId && m.type === type
        );
        if (existing) {
          existing.marks = marks;
        } else {
          marksDb.push({ student_id: studentId, subject_id: subjectId, type, marks });
        }
        return Promise.resolve([{}]);
      }
      return Promise.resolve([[]]);
    });

    const payload = {
      type: 'internal',
      date: '2024-01-01',
      marksData: [
        {
          rollNumber: 'R1',
          section: 'A',
          year: 1,
          subject: 'Math',
          maxMarks: 100,
          marks: 90,
        },
      ],
    };

    await request(app).post('/marks/bulk').send(payload).expect(200);
    expect(marksDb).toHaveLength(1);
    expect(marksDb[0].marks).toBe(90);

    const payload2 = {
      ...payload,
      marksData: [
        {
          rollNumber: 'R1',
          section: 'A',
          year: 1,
          subject: 'Math',
          maxMarks: 100,
          marks: 95,
        },
      ],
    };

    await request(app).post('/marks/bulk').send(payload2).expect(200);
    expect(marksDb).toHaveLength(1);
    expect(marksDb[0].marks).toBe(95);

    const insertCalls = executeQuery.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO InternalMarks')
    );
    insertCalls.forEach(([sql]) => {
      expect(sql).toContain('ON DUPLICATE KEY UPDATE');
    });
  });
});
