const request = require('supertest');
const express = require('express');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 1, role: 'professor' };
    next();
  },
}));

// Mock database helper
const mockExecuteQuery = jest.fn();
jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
  sql: {},
}));

const professorsRouter = require('./professors');

describe('PUT /professors/:id/profile', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/professors', professorsRouter);

    mockExecuteQuery.mockReset();
    mockExecuteQuery.mockImplementation((query, params) => {
      if (query.startsWith('UPDATE')) {
        return { rowsAffected: [1] };
      }
      return {
        recordset: [
          {
            id: 1,
            name: 'Prof',
            email: 'prof@example.com',
            department: null,
            phone: '123',
            profile_image: 'img.jpg',
          },
        ],
        rowsAffected: [1],
      };
    });
  });

  it('updates allowed fields without SQL errors', async () => {
    const payload = {
      phone: '123',
      profileImage: 'img.jpg',
      bio: 'ignored',
      officeHours: 'ignored',
    };

    const res = await request(app)
      .put('/professors/1/profile')
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({
      id: 1,
      name: 'Prof',
      email: 'prof@example.com',
      department: null,
      phone: '123',
      profileImage: 'img.jpg',
    });

    const updateCall = mockExecuteQuery.mock.calls[0];
    expect(updateCall[0]).toMatch(/UPDATE users SET/);
    expect(updateCall[0]).not.toMatch(/office_hours|bio/);
    expect(updateCall[1]).toEqual(['123', 'img.jpg', 1]);
  });
});

