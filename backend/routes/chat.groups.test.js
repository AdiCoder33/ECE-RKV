const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
}));

const mockExecuteQuery = jest.fn();

jest.mock('../config/database', () => ({
  executeQuery: mockExecuteQuery,
  connectDB: jest.fn(),
}));

jest.mock('../utils/conversations', () => ({
  emitConversationUpdate: jest.fn(),
}));

jest.mock('../services/pushService', () => ({
  sendToUsers: jest.fn().mockResolvedValue(),
}));

const chatRouter = require('./chat');

describe('POST /chat/groups/:groupId/messages', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/chat', chatRouter);
    mockExecuteQuery.mockReset();
  });

  it('allows sending attachments without content', async () => {
    const now = new Date();
    mockExecuteQuery
      .mockResolvedValueOnce([[{ id: 1 }]]) // membership check
      .mockResolvedValueOnce([{ insertId: 123 }]) // insert result
      .mockResolvedValueOnce([[
        {
          id: 123,
          group_id: 10,
          sender_id: 1,
          content: '',
          timestamp: now,
          attachments: JSON.stringify([{ name: 'file.png' }]),
          sender_name: 'User One',
          sender_role: 'student',
          sender_profileImage: 'img.png',
        },
      ]])
      .mockResolvedValueOnce([[{ user_id: 1, group_name: 'Test Group' }]]) // members
      .mockResolvedValueOnce([[]]); // conversation update

    const res = await request(app)
      .post('/chat/groups/10/messages')
      .send({ attachments: [{ name: 'file.png' }] })
      .expect(201);

    expect(res.body.attachments).toEqual([{ name: 'file.png' }]);
    expect(mockExecuteQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
      '10',
      1,
      '',
      JSON.stringify([{ name: 'file.png' }]),
    ]);
  });
});
