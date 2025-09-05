const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: '1' };
    next();
  })
}));

jest.mock('../config/database', () => ({
  executeQuery: jest.fn(),
  connectDB: jest.fn()
}));

const { executeQuery } = require('../config/database');
const marksRouter = require('./marks');

describe('GET /marks/student/:id/summary', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/marks', marksRouter);
    executeQuery.mockReset();
  });

  it('computes internal using default max marks of 20 when absent', async () => {
    executeQuery.mockResolvedValueOnce([
      [
        {
          id: 1,
          subject_id: 1,
          type: 'mid1',
          marks: 15,
          max_marks: null,
          date: '2024-01-01',
          subject_name: 'Math'
        },
        {
          id: 2,
          subject_id: 1,
          type: 'mid2',
          marks: 10,
          max_marks: null,
          date: '2024-02-01',
          subject_name: 'Math'
        }
      ]
    ]);

    const res = await request(app).get('/marks/student/1/summary');
    expect(res.status).toBe(200);
    expect(res.body.subjectStats[0]).toMatchObject({
      obtained: 25,
      total: 40,
      internal: { obtained: 25, total: 40 }
    });
  });

  it('returns performance label and mid trend averages', async () => {
    executeQuery.mockResolvedValueOnce([
      [
        { id: 1, subject_id: 1, type: 'mid1', marks: 15, max_marks: 20, date: '2024-01-10', subject_name: 'Math' },
        { id: 2, subject_id: 1, type: 'mid2', marks: 10, max_marks: 20, date: '2024-02-10', subject_name: 'Math' },
        { id: 3, subject_id: 1, type: 'mid3', marks: 5, max_marks: 20, date: '2024-03-10', subject_name: 'Math' },
        { id: 4, subject_id: 2, type: 'mid1', marks: 16, max_marks: 20, date: '2024-01-12', subject_name: 'Science' },
        { id: 5, subject_id: 2, type: 'mid2', marks: 14, max_marks: 20, date: '2024-02-15', subject_name: 'Science' },
        { id: 6, subject_id: 2, type: 'mid3', marks: 10, max_marks: 20, date: '2024-03-15', subject_name: 'Science' }
      ]
    ]);

    const res = await request(app).get('/marks/student/1/summary');
    expect(res.status).toBe(200);
    expect(res.body.performanceLabel).toBe('Average');
    expect(res.body.trend.mid1).toBeCloseTo(77.5);
    expect(res.body.trend.mid2).toBeCloseTo(60);
    expect(res.body.trend.mid3).toBeCloseTo(37.5);
    expect(res.body.trend.change).toBeCloseTo(-22.5);
  });
});
