const request = require('supertest');
const express = require('express');

const mockExecuteQuery = jest.fn();

jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
  sql: {}
}));

jest.mock('../utils/otp', () => ({
  generateOTP: () => '123456',
  sendOTPEmail: jest.fn().mockResolvedValue()
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-otp')
}));

describe('OTP expiry minutes', () => {
  const setup = () => {
    jest.resetModules();
    const authRouter = require('./auth');
    const app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    return app;
  };

  beforeEach(() => {
    mockExecuteQuery.mockReset();
    mockExecuteQuery.mockResolvedValue({ recordset: [{ id: 1 }] });
    process.env.JWT_SECRET = 'secret';
  });

  it('defaults to 10 when OTP_EXPIRY_MINUTES is missing', async () => {
    delete process.env.OTP_EXPIRY_MINUTES;
    const app = setup();
    await request(app)
      .post('/auth/request-reset')
      .send({ email: 'test@example.com' })
      .expect(200);
    expect(mockExecuteQuery.mock.calls[1][1][1]).toBe(10);
  });

  it('defaults to 10 when OTP_EXPIRY_MINUTES is non-positive', async () => {
    process.env.OTP_EXPIRY_MINUTES = '-5';
    const app = setup();
    await request(app)
      .post('/auth/request-reset')
      .send({ email: 'test@example.com' })
      .expect(200);
    expect(mockExecuteQuery.mock.calls[1][1][1]).toBe(10);
  });

  it('uses provided OTP_EXPIRY_MINUTES when positive', async () => {
    process.env.OTP_EXPIRY_MINUTES = '15';
    const app = setup();
    await request(app)
      .post('/auth/request-reset')
      .send({ email: 'test@example.com' })
      .expect(200);
    expect(mockExecuteQuery.mock.calls[1][1][1]).toBe(15);
  });
});
