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
    const updated = {
      name: 'Prof',
      email: 'prof@example.com',
      phone: '123',
      profile_image: 'img.jpg',
    };
    mockExecuteQuery.mockImplementation((query, params) => {
      if (query.startsWith('UPDATE')) {
        [updated.phone, updated.profile_image, updated.name, updated.email] = params;
        return { rowsAffected: [1] };
      }
      return {
        recordset: [
          {
            id: 1,
            name: updated.name,
            email: updated.email,
            department: null,
            phone: updated.phone,
            profile_image: updated.profile_image,
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
      name: 'New Prof',
      email: 'new@example.com',
      bio: 'ignored',
      officeHours: 'ignored',
    };

    const res = await request(app)
      .put('/professors/1/profile')
      .send(payload)
      .expect(200);

    expect(res.body).toEqual({
      id: 1,
      name: 'New Prof',
      email: 'new@example.com',
      department: null,
      phone: '123',
      profileImage: 'img.jpg',
    });

    const updateCall = mockExecuteQuery.mock.calls[0];
    expect(updateCall[0]).toMatch(/UPDATE users SET/);
    expect(updateCall[0]).not.toMatch(/office_hours|bio/);
    expect(updateCall[0]).toMatch(/name = \?|email = \?/);
    expect(updateCall[1]).toEqual(['123', 'img.jpg', 'New Prof', 'new@example.com', 1]);
  });
});

