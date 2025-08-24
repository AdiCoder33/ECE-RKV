const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '1' };
    next();
  },
}));

const mockBegin = jest.fn(function () {
  this._state = 'started';
  return Promise.resolve();
});
const mockCommit = jest.fn(function () {
  this._state = 'committed';
  return Promise.resolve();
});
const mockRollback = jest.fn(function () {
  this._state = 'rolledback';
  return Promise.resolve();
});

class MockTransaction {
  constructor() {
    this._state = 'pending';
    this.begin = mockBegin;
    this.commit = mockCommit;
    this.rollback = mockRollback;
  }
}

class MockRequest {
  constructor(transaction) {
    this.transaction = transaction;
    this.params = {};
  }
  input(name, value) {
    this.params[name] = value;
    return this;
  }
  async query(q) {
    if (q.startsWith('SAVE TRANSACTION')) return {};
    if (q.startsWith('ROLLBACK TRANSACTION')) return {};
    if (q.startsWith('SELECT id FROM users WHERE email')) {
      return { recordset: [] };
    }
    if (q.startsWith('INSERT INTO users')) {
      if (this.params.email === 'fail@example.com') {
        throw new Error('duplicate email');
      }
      return { recordset: [{ id: 1 }] };
    }
    if (q.startsWith('SELECT id FROM classes')) {
      return { recordset: [] };
    }
    return { recordset: [] };
  }
}

jest.mock('../config/database', () => {
  const connectDB = jest.fn().mockResolvedValue({});
  return {
    executeQuery: jest.fn(),
    connectDB,
    sql: { Transaction: MockTransaction, Request: MockRequest },
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(false),
}));

const usersRouter = require('./users');

describe('bulk user creation', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
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
          name: 'Bad',
          email: 'fail@example.com',
          password: 'secret',
          role: 'student',
          department: 'ECE',
          year: 1,
          semester: 1,
          section: 'A',
          rollNumber: '2',
          phone: '456',
        },
      ],
    };

    const res = await request(app).post('/users/bulk').send(payload).expect(201);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].action).toBe('inserted');
    expect(res.body.results[1].error).toBe('duplicate email');
  });
});
