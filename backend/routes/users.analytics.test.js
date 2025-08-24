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
      return { recordset: [{ id: 1 }] };
    }
    if (q.startsWith('SELECT id FROM classes')) {
      return { recordset: [] };
    }
    return { recordset: [] };
  }
}

const mockExecuteQuery = jest.fn((query) => {
  if (query.includes('GROUP BY role')) return Promise.resolve({ recordset: [] });
  if (query.includes('FROM subjects')) return Promise.resolve({ recordset: [{ total_subjects: 0 }] });
  if (query.includes('AVG(')) return Promise.resolve({ recordset: [{ avg_attendance: 1 }] });
  if (query.includes('FROM classes')) return Promise.resolve({ recordset: [{ total_classes: 0 }] });
  if (query.includes("WHERE role='student'")) return Promise.resolve({ recordset: [{ total_users: 0 }] });
  if (query.includes("WHERE role='professor'")) return Promise.resolve({ recordset: [{ total_professors: 0 }] });
  if (query.includes('FROM notifications')) return Promise.resolve({ recordset: [] });
  return Promise.resolve({ recordset: [] });
});

jest.mock('../config/database', () => {
  const connectDB = jest.fn().mockResolvedValue({});
  return {
    executeQuery: mockExecuteQuery,
    connectDB,
    sql: { Transaction: MockTransaction, Request: MockRequest },
  };
});

const usersRouter = require('./users');
const analyticsRouter = require('./analytics');

describe('analytics after bulk import', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
    app.use('/analytics', analyticsRouter);
  });

  it('responds to analytics after large import', async () => {
    const users = Array.from({ length: 120 }).map((_, i) => ({
      name: `User${i}`,
      email: `user${i}@example.com`,
      password: 'secret',
      role: 'student',
      department: 'ECE',
      year: 1,
      semester: 1,
      section: 'A',
      rollNumber: `${i}`,
      phone: '123',
    }));

    await request(app).post('/users/bulk').send({ users }).expect(201);
    await request(app).get('/analytics/overview').expect(200);
  }, 20000);
});
