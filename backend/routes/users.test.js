const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '1' };
    next();
  },
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
        semester: null,
        section: null,
        roll_number: null,
        phone: null,
        designation: 'Professor',
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

describe('users routes handle values correctly', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', usersRouter);
    executeQuery.mockClear();
  });

  it('creates user with valid semester and falsy values intact', async () => {
    const payload = {
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
      role: 'student',
      department: '',
      year: 0,
      semester: 1,
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
        1,
        '',
        '0',
        '',
        null,
      ]
    );
  });

  it('updates user with valid semester and falsy values intact', async () => {
    const payload = {
      name: 'Jane',
      email: 'jane@example.com',
      role: 'student',
      department: '',
      year: 0,
      semester: 2,
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
        2,
        '',
        '0',
        null,
        '1',
      ]
    );
  });

  it('rejects student creation with invalid semester', async () => {
    const payload = {
      name: 'Bad',
      email: 'bad@example.com',
      password: 'secret',
      role: 'student',
      semester: 3,
    };

    await request(app).post('/users').send(payload).expect(400);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('rejects professor creation without designation', async () => {
    const payload = {
      name: 'Prof',
      email: 'prof@example.com',
      password: 'secret',
      role: 'professor',
      phone: '123',
    };

    await request(app).post('/users').send(payload).expect(400);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('allows professor creation with designation and no student fields', async () => {
    const payload = {
      name: 'Prof',
      email: 'prof@example.com',
      password: 'secret',
      role: 'professor',
      designation: 'Lecturer',
      phone: '123',
    };

    await request(app).post('/users').send(payload).expect(201);
    expect(executeQuery).toHaveBeenCalledWith(
      expect.any(String),
      [
        payload.name,
        payload.email,
        'hashed',
        payload.role,
        null,
        null,
        null,
        null,
        null,
        '123',
        payload.designation,
      ]
    );
  });

  it('rejects student update with invalid semester', async () => {
    const payload = {
      name: 'Bad',
      email: 'bad@example.com',
      role: 'student',
      semester: 0,
    };

    await request(app).put('/users/1').send(payload).expect(400);
    expect(executeQuery).not.toHaveBeenCalled();
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

  it('includes designation in user listing', async () => {
    const res = await request(app).get('/users').expect(200);
    expect(res.body[0]).toHaveProperty('designation');
  });

  it('includes designation in search results', async () => {
    const res = await request(app)
      .get('/users')
      .query({ search: 'Jane' })
      .expect(200);
    expect(res.body[0]).toHaveProperty('designation');
  });

  it('filters users by year and section in search', async () => {
    await request(app)
      .get('/users')
      .query({ search: 'Jane', year: '2', section: 'B' })
      .expect(200);

    expect(executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('year = ? AND section = ?'),
      ['1', '%Jane%', 2, 'B']
    );
  });

  it('filters users by year and section without search', async () => {
    await request(app)
      .get('/users')
      .query({ year: '3', section: 'C' })
      .expect(200);

    expect(executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE year = ? AND section = ?'),
      [3, 'C']
    );
  });
});
