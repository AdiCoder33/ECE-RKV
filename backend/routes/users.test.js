const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => next(),
}));

jest.mock('../config/database', () => ({
  executeQuery: jest.fn().mockResolvedValue({
    recordset: [
      {
        id: 1,
        name: '',
        email: '',
        role: '',
        department: null,
        year: null,
        section: null,
        roll_number: null,
        phone: null,
        created_at: null,
      },
    ],
    rowsAffected: [1],
  }),
  connectDB: jest.fn(),
  sql: {},
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

const usersRouter = require('./users');
const { executeQuery } = require('../config/database');

describe('users routes handle falsy-but-valid values', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
    executeQuery.mockClear();
  });

  it('creates user with falsy values intact', async () => {
    const payload = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      role: 'student',
      department: '',
      year: 0,
      section: '',
      rollNumber: '0',
      phone: '',
    };

    await request(app).post('/users').send(payload).expect(201);
    expect(executeQuery).toHaveBeenCalledWith(
      expect.any(String),
      [
        payload.name,
        payload.email,
        'hashed',
        payload.role,
        '',
        0,
        '',
        '0',
        '',
      ]
    );
  });

  it('updates user with falsy values intact', async () => {
    const payload = {
      name: 'Jane',
      email: 'jane@example.com',
      role: 'student',
      department: '',
      year: 0,
      section: '',
      rollNumber: '0',
    };

    await request(app).put('/users/1').send(payload).expect(200);
    expect(executeQuery).toHaveBeenCalledWith(
      expect.any(String),
      [
        payload.name,
        payload.email,
        payload.role,
        '',
        0,
        '',
        '0',
        '1',
      ]
    );
  });

  it('deletes user and cleans up student classes', async () => {
    await request(app).delete('/users/1').expect(200);
    expect(executeQuery).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM student_classes WHERE student_id = ?',
      ['1']
    );
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM users WHERE id = ?',
      ['1']
    );
  });
});
