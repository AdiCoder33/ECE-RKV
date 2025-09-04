const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '1' };
    next();
  },
}));

const mockBegin = jest.fn().mockResolvedValue();
const mockCommit = jest.fn().mockResolvedValue();
const mockRollback = jest.fn().mockResolvedValue();
const mockRelease = jest.fn().mockResolvedValue();

const defaultQueryImpl = async (q, params) => {
  if (q.startsWith('SAVEPOINT') || q.startsWith('ROLLBACK TO SAVEPOINT')) return [{}];
  if (q.startsWith('SELECT id, name')) return [[]];
  if (q.startsWith('INSERT INTO users')) {
    if (params[1] === 'fail@example.com') {
      throw new Error('duplicate email');
    }
    return [{ insertId: 1, affectedRows: 1 }];
  }
  if (q.startsWith('SELECT id FROM classes')) return [[]];
  if (q.startsWith('INSERT INTO student_classes')) return [{ affectedRows: 1 }];
  return [[]];
};

const mockQuery = jest.fn(defaultQueryImpl);

const mockConnection = {
  beginTransaction: mockBegin,
  commit: mockCommit,
  rollback: mockRollback,
  query: mockQuery,
  release: mockRelease,
};

const mockGetConnection = jest.fn().mockResolvedValue(mockConnection);

jest.mock('../config/database', () => {
  const connectDB = jest.fn().mockResolvedValue({ getConnection: mockGetConnection });
  const executeQuery = jest.fn().mockResolvedValue([[]]);
  return {
    executeQuery,
    connectDB,
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(false),
}));

const usersRouter = require('./users');
const analyticsRouter = require('./analytics');

describe('bulk user creation', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
    app.use('/analytics', analyticsRouter);
    mockBegin.mockClear();
    mockCommit.mockClear();
    mockRollback.mockClear();
    mockRelease.mockClear();
    mockQuery.mockClear();
    mockQuery.mockImplementation(defaultQueryImpl);
    mockGetConnection.mockClear();
  });

  it('processes valid users even when some entries fail', async () => {
    const payload = {
      users: [
        {
          name: 'Good',
          email: 'good@example.com',
          password: 'secret',
          role: 'student',
          department: 'ECE',
          year: 1,
          semester: 1,
          section: 'A',
          rollNumber: '1',
          phone: '123',
        },
        {
          name: 'Prof Good',
          email: 'prof@example.com',
          password: 'secret',
          role: 'professor',
          department: 'ECE',
          phone: '789',
          designation: 'Lecturer',
        },
        {
          name: 'Prof Bad',
          email: 'nodeg@example.com',
          password: 'secret',
          role: 'professor',
          department: 'ECE',
          phone: '012',
        },
      ],
    };

    const res = await request(app).post('/users/bulk').send(payload).expect(201);
    expect(res.body.results).toHaveLength(3);
    expect(res.body.results[0].action).toBe('inserted');
    expect(res.body.results[1].action).toBe('inserted');
    expect(res.body.results[2].error).toBe('designation is required');
  });

  it('uses separate transactions for each batch of 50 users', async () => {
    const users = [];
    for (let i = 0; i < 51; i++) {
      users.push({
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: 'secret',
        role: 'student',
        department: 'ECE',
        year: 1,
        semester: 1,
        section: 'A',
        rollNumber: String(i),
        phone: String(i),
      });
    }

    const res = await request(app).post('/users/bulk').send({ users }).expect(201);
    expect(res.body.results).toHaveLength(51);
    expect(mockBegin).toHaveBeenCalledTimes(2);
    expect(mockCommit).toHaveBeenCalledTimes(2);

    // analytics requests should still respond
    await request(app).get('/analytics/enrollment').expect(200);
  });

  it('imports professor without year/section without NaN error', async () => {
    mockQuery.mockImplementation((q, params) => {
      if (
        q.startsWith(
          'SELECT id, name, role, department, year, semester, section, roll_number, phone, password, designation FROM users'
        )
      ) {
        if (params.some(p => typeof p === 'number' && Number.isNaN(p))) {
          throw new Error("Unknown column 'NaN'");
        }
        return [[]];
      }
      return defaultQueryImpl(q, params);
    });

    const payload = {
      users: [
        {
          name: 'Prof Test',
          email: 'prof.test@example.com',
          password: 'secret',
          role: 'professor',
          department: 'ECE',
          phone: '555',
          designation: 'Lecturer',
        },
      ],
    };

    const res = await request(app).post('/users/bulk').send(payload).expect(201);
    expect(res.body.results).toEqual([{ index: 0, id: 1, action: 'inserted' }]);
  });
});
