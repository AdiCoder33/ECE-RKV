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

jest.mock('../utils/images', () => ({
  resolveProfileImage: jest.fn().mockResolvedValue('resolved.png'),
}));

jest.mock('../services/pushService', () => ({
  sendToUsers: jest.fn().mockResolvedValue(),
}));

const messagesRouter = require('./messages');

describe('POST /messages/send', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/messages', messagesRouter);
    mockExecuteQuery.mockReset();
  });

  it('allows sending attachments without content', async () => {
    const now = new Date();
    mockExecuteQuery
      .mockResolvedValueOnce([{ insertId: 123 }])
      .mockResolvedValueOnce([
        [
          {
            id: 123,
            sender_id: 1,
            receiver_id: 2,
            content: '',
            message_type: 'attachment',
            attachments: JSON.stringify([{ name: 'file.png' }]),
            created_at: now,
            delivered_at: null,
            edited_at: null,
            sender_name: 'User One',
            sender_profileImage: 'img.png',
          },
        ],
      ])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/messages/send')
      .send({ receiverId: 2, content: '', attachments: [{ name: 'file.png' }] })
      .expect(201);

    expect(res.body.attachments).toEqual([{ name: 'file.png' }]);
    expect(mockExecuteQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
      1,
      2,
      '',
      'attachment',
      JSON.stringify([{ name: 'file.png' }]),
    ]);
  });
});

