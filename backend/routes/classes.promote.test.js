const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { role: req.headers['x-user-role'] || 'admin' };
    next();
  },
}));

const mockDbState = {
  users: [],
  classes: [],
  studentClasses: [],
  nextClassId: 100,
};

function mockHandleQuery(state, q) {
  q = q.trim();
  if (q.startsWith('UPDATE users') && q.includes("SET role = 'alumni'")) {
    let count = 0;
    state.users.forEach(u => {
      if (u.role === 'student' && u.year === 5) {
        u.role = 'alumni';
        u.year = null;
        u.semester = null;
        u.section = null;
        count++;
      }
    });
    return [{ affectedRows: count }];
  } else if (q.startsWith('DELETE FROM student_classes') && q.includes('class_id IN (SELECT id FROM classes WHERE year = 5)')) {
    const year5Ids = state.classes.filter(c => c.year === 5).map(c => c.id);
    const before = state.studentClasses.length;
    state.studentClasses = state.studentClasses.filter(sc => !year5Ids.includes(sc.class_id));
    return [{ affectedRows: before - state.studentClasses.length }];
  } else if (q.startsWith('DELETE FROM classes WHERE year = 5')) {
    const before = state.classes.length;
    state.classes = state.classes.filter(c => c.year !== 5);
    return [{ affectedRows: before - state.classes.length }];
  } else if (q.startsWith('UPDATE classes') && q.includes('WHERE semester = 2 AND year < 4')) {
    let count = 0;
    state.classes.forEach(c => {
      if (c.semester === 2 && c.year < 4) {
        c.year += 1;
        c.semester = 1;
        count++;
      }
    });
    return [{ affectedRows: count }];
  } else if (q.startsWith("SELECT id FROM users WHERE role = 'student' AND year = 4 AND semester = 2")) {
    const recs = state.users
      .filter(u => u.role === 'student' && u.year === 4 && u.semester === 2)
      .map(u => ({ id: u.id }));
    return [recs];
  } else if (
    q.startsWith('INSERT INTO classes (year, semester, section, hod_id)') &&
    q.includes("VALUES (5, 1, 'GRADUATED', NULL)")
  ) {
    const id = state.nextClassId++;
    state.classes.push({ id, year: 5, semester: 1, section: 'GRADUATED', hod_id: null });
    return [{ insertId: id, affectedRows: 1 }];
  } else if (q.startsWith('UPDATE users') && q.includes("section = 'GRADUATED'")) {
    let count = 0;
    state.users.forEach(u => {
      if (u.role === 'student' && u.year === 4 && u.semester === 2) {
        u.year = 5;
        u.semester = 1;
        u.section = 'GRADUATED';
        u.graduation_year = new Date().getFullYear();
        count++;
      }
    });
    return [{ affectedRows: count }];
  } else if (q.startsWith('DELETE sc') && q.includes('FROM student_classes')) {
    const before = state.studentClasses.length;
    state.studentClasses = state.studentClasses.filter(sc => {
      const u = state.users.find(us => us.id === sc.student_id);
      return !(u && u.role === 'student' && u.year === 5 && u.semester === 1 && u.section === 'GRADUATED');
    });
    return [{ affectedRows: before - state.studentClasses.length }];
  } else if (q.startsWith('INSERT INTO student_classes') && q.includes('SELECT')) {
    const match = q.match(/SELECT\s+(\d+)\s+AS class_id/);
    const classId = match ? parseInt(match[1], 10) : null;
    const students = state.users.filter(
      u => u.role === 'student' && u.year === 5 && u.semester === 1 && u.section === 'GRADUATED'
    );
    students.forEach(u => state.studentClasses.push({ class_id: classId, student_id: u.id }));
    return [{ affectedRows: students.length }];
  } else if (q.startsWith('DELETE FROM classes WHERE year = 4 AND semester = 2')) {
    const before = state.classes.length;
    state.classes = state.classes.filter(c => !(c.year === 4 && c.semester === 2));
    return [{ affectedRows: before - state.classes.length }];
  } else if (q.startsWith('UPDATE users') && q.includes('SET year = year + 1')) {
    let count = 0;
    state.users.forEach(u => {
      if (u.role === 'student' && u.semester === 2) {
        u.year += 1;
        u.semester = 1;
        count++;
      }
    });
    return [{ affectedRows: count }];
  } else if (
    q.startsWith('INSERT INTO classes (year, semester, section, hod_id)') &&
    q.includes('SELECT 1, 1, s.section, NULL')
  ) {
    const sections = Array.from(
      new Set(
        state.classes
          .filter(c => c.section !== 'GRADUATED' && c.year <= 4)
          .map(c => c.section)
      )
    );
    let count = 0;
    sections.forEach(section => {
      if (!state.classes.some(c => c.year === 1 && c.semester === 1 && c.section === section)) {
        const id = state.nextClassId++;
        state.classes.push({ id, year: 1, semester: 1, section, hod_id: null });
        count++;
      }
    });
    return [{ affectedRows: count }];
  }
  return [{ affectedRows: 0 }];
}

const mockBegin = jest.fn().mockResolvedValue();
const mockCommit = jest.fn().mockResolvedValue();
const mockRollback = jest.fn().mockResolvedValue();
const mockRelease = jest.fn().mockResolvedValue();

const mockQuery = jest.fn(q => mockHandleQuery(mockDbState, q));

const mockConnection = {
  beginTransaction: mockBegin,
  commit: mockCommit,
  rollback: mockRollback,
  query: mockQuery,
  release: mockRelease,
};

const mockGetConnection = jest.fn().mockResolvedValue(mockConnection);

jest.mock('../config/database', () => {
  return {
    connectDB: jest.fn().mockResolvedValue({ getConnection: mockGetConnection }),
    executeQuery: jest.fn().mockResolvedValue([[]]),
  };
});

const classesRouter = require('./classes');

describe('class promotion', () => {
  let app;
  beforeEach(() => {
    mockDbState.users = [
      { id: 1, role: 'student', year: 1, semester: 2, section: 'A' },
      { id: 2, role: 'student', year: 4, semester: 2, section: 'A' },
    ];
    mockDbState.classes = [
      { id: 10, year: 1, semester: 2, section: 'A', hod_id: null },
      { id: 20, year: 4, semester: 2, section: 'A', hod_id: null },
    ];
    mockDbState.studentClasses = [
      { class_id: 10, student_id: 1 },
      { class_id: 20, student_id: 2 },
    ];
    mockDbState.nextClassId = 30;

    app = express();
    app.use(express.json());
    app.use('/classes', classesRouter);
    mockBegin.mockClear();
    mockCommit.mockClear();
    mockRollback.mockClear();
    mockRelease.mockClear();
    mockQuery.mockClear();
    mockGetConnection.mockClear();
  });

  it('promotes students and graduates final years', async () => {
    await request(app)
      .post('/classes/promote')
      .set('x-user-role', 'admin')
      .send({ currentSemester: 2 })
      .expect(200);

    expect(mockDbState.classes.filter(c => c.year === 5).length).toBe(1);
    expect(
      mockDbState.classes.some(
        c => c.year === 1 && c.semester === 1 && c.section === 'GRADUATED'
      )
    ).toBe(false);

    await request(app)
      .post('/classes/promote')
      .set('x-user-role', 'admin')
      .send({ currentSemester: 2 })
      .expect(200);

    expect(mockDbState.classes.some(c => c.year >= 6)).toBe(false);
    expect(mockDbState.classes.filter(c => c.year === 5).length).toBe(0);
    expect(
      mockDbState.classes.some(
        c => c.year === 1 && c.semester === 1 && c.section === 'GRADUATED'
      )
    ).toBe(false);
  });
});

