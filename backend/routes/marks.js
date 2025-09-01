const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get marks for a student
router.get('/student/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { subjectId, type, year, semester } = req.query;

    let query = `
      SELECT im.*, s.name as subject_name, s.code as subject_code
      FROM InternalMarks im
      INNER JOIN subjects s ON im.subject_id = s.id
      INNER JOIN users u ON im.student_id = u.id
      WHERE im.student_id = ?
    `;
    const params = [studentId];

    if (year) {
      query += ' AND s.year = ?';
      params.push(year);
    } else {
      query += ' AND s.year = u.year';
    }

    if (semester) {
      query += ' AND s.semester = ?';
      params.push(semester);
    } else {
      query += ' AND s.semester = u.semester';
    }

    if (subjectId) {
      query += ' AND im.subject_id = ?';
      params.push(subjectId);
    }

    if (type) {
      query += ' AND im.type = ?';
      params.push(type);
    }

    query += ' ORDER BY im.date DESC';

    const [rows] = await executeQuery(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get student marks error:', error);
    next(error);
  }
});

// Get mark summary for a student
router.get('/student/:id/summary', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, semester } = req.query;

    let query = `
      SELECT im.id, im.subject_id, im.type, im.marks, im.max_marks, im.date,
             s.name AS subject_name
      FROM InternalMarks im
      INNER JOIN subjects s ON im.subject_id = s.id
      INNER JOIN users u ON im.student_id = u.id
      WHERE im.student_id = ?
    `;
    const params = [id];

    if (year) {
      query += ' AND s.year = ?';
      params.push(year);
    } else {
      query += ' AND s.year = u.year';
    }

    if (semester) {
      query += ' AND s.semester = ?';
      params.push(semester);
    } else {
      query += ' AND s.semester = u.semester';
    }

    query += ' ORDER BY im.date DESC';

    const [rows] = await executeQuery(query, params);
    const rawRecords = rows || [];

    const groupedMids = {};

    for (const r of rawRecords) {
      const type = (r.type || '').toLowerCase();
      const isMid = type.startsWith('mid');
      if (!isMid) continue;
      const key = `${r.subject_id}-${type}`;
      if (!groupedMids[key]) {
        groupedMids[key] = {
          id: r.id,
          subject_id: r.subject_id,
          subject_name: r.subject_name,
          type: r.type,
          marks: 0,
          max_marks: 0,
          date: r.date,
        };
      }
      groupedMids[key].marks += r.marks;
      groupedMids[key].max_marks += r.max_marks;
      if (new Date(r.date) > new Date(groupedMids[key].date)) {
        groupedMids[key].date = r.date;
      }
    }

    const subjectStatsMap = {};
    const monthlyTrendMap = {};

    for (const mid of Object.values(groupedMids)) {
      const subjId = mid.subject_id;
      if (!subjectStatsMap[subjId]) {
        subjectStatsMap[subjId] = {
          subjectId: subjId,
          subjectName: mid.subject_name,
          mids: [],
        };
      }
      subjectStatsMap[subjId].mids.push({
        id: mid.id,
        type: mid.type,
        marks: mid.marks,
        maxMarks: mid.max_marks,
        date: mid.date,
      });

      const monthKey = new Date(mid.date).toISOString().slice(0, 7);
      if (!monthlyTrendMap[monthKey]) {
        monthlyTrendMap[monthKey] = { month: monthKey, obtained: 0, total: 0 };
      }
      monthlyTrendMap[monthKey].obtained += mid.marks;
      monthlyTrendMap[monthKey].total += mid.max_marks;
    }

    const subjectStats = Object.values(subjectStatsMap).map((s) => {
      const sortedMids = s.mids.sort((a, b) => b.marks - a.marks);
      const bestTwo = sortedMids.slice(0, 2);
      const internalObtained = bestTwo.reduce((sum, m) => sum + m.marks, 0);
      const internalTotal = bestTwo.reduce((sum, m) => sum + m.maxMarks, 0);
      return {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        obtained: internalObtained,
        total: internalTotal,
        percentage: internalTotal ? (internalObtained / internalTotal) * 100 : 0,
        mids: sortedMids,
        internal: {
          obtained: internalObtained,
          total: internalTotal,
        },
      };
    });

    const records = subjectStats.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      mids: s.mids,
      internal: s.internal,
    }));

    let overallObtained = 0;
    let overallTotal = 0;
    for (const s of subjectStats) {
      overallObtained += s.internal.obtained;
      overallTotal += s.internal.total;
    }
    const overall = {
      obtained: overallObtained,
      total: overallTotal,
      percentage: overallTotal ? (overallObtained / overallTotal) * 100 : 0,
    };

    const monthlyTrend = Object.values(monthlyTrendMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        month: new Date(m.month + '-01').toLocaleString('default', { month: 'short' }),
        percentage: m.total ? (m.obtained / m.total) * 100 : 0,
      }));

    res.json({ subjectStats, monthlyTrend, records, overall });
  } catch (error) {
    console.error('Get student marks summary error:', error);
    next(error);
  }
});

// Get all marks (for faculty)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester, section, subjectId } = req.query;
    let query = `
      SELECT u.name AS student_name, u.email, u.roll_number, s.name AS subject, im.marks
      FROM InternalMarks im
      LEFT JOIN users u ON im.student_id = u.id
      LEFT JOIN subjects s ON im.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += ' AND u.year = ?';
      params.push(year);
    }

    if (semester) {
      query += ' AND u.semester = ?';
      params.push(semester);
    }

    if (section) {
      query += ' AND u.section = ?';
      params.push(section);
    }

    if (subjectId) {
      query += ' AND im.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY CAST(u.roll_number AS UNSIGNED)';

    const [rows] = await executeQuery(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get marks error:', error);
    next(error);
  }
});

// Get marks overview for a class and subject
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester, section, subjectId, type } = req.query;
    if (!year || !semester || !section || !subjectId || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      SELECT u.id as student_id, u.name as student_name, u.roll_number,
             im.marks, im.max_marks
      FROM classes c
      JOIN student_classes sc ON c.id = sc.class_id
      JOIN users u ON sc.student_id = u.id
      LEFT JOIN InternalMarks im ON im.student_id = u.id AND im.subject_id = ? AND im.type = ?
      WHERE c.year = ? AND c.semester = ? AND c.section = ?
      ORDER BY CAST(u.roll_number AS UNSIGNED)
    `;
    const params = [subjectId, type, year, semester, section];
    const [rows] = await executeQuery(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Marks overview error:', error);
    next(error);
  }
});

// Bulk enter marks
router.post('/bulk', authenticateToken, async (req, res, next) => {
  try {
    const { type, date, marksData } = req.body;
    const enteredBy = Number(req.user.id);
    if (Number.isNaN(enteredBy)) {
      const message = 'Invalid user ID';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }

    if (!date) {
      const message = 'date is required';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      const message = 'Invalid date';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }
    const examDate = parsedDate.toISOString().slice(0, 10); // e.g., '2025-09-01'
    // If time-of-day is needed, change the database column to DATETIME and supply a full timestamp

    if (!Array.isArray(marksData)) {
      const message = 'marksData must be an array';
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }

    const errors = [];
    const prepared = [];

    // Resolve student and subject IDs for each record
    for (const record of marksData) {
      const { rollNumber, section, year, semester, subject, maxMarks, marks } = record;

      if (marks == null || isNaN(Number(marks))) {
        errors.push(`Invalid marks for ${rollNumber}`);
        continue;
      }

      if (!rollNumber || !section || year == null) {
        errors.push('rollNumber, section and year are required');
        continue;
      }

      const params = [rollNumber, section, year];
      let query = 'SELECT id FROM users WHERE roll_number = ? AND section = ? AND year = ?';
      if (semester != null) {
        query += ' AND semester = ?';
        params.push(semester);
      }

      const [studentRows] = await executeQuery(query, params);
      const students = studentRows || [];
      if (students.length !== 1) {
        errors.push(`Student lookup error for ${rollNumber}`);
        continue;
      }

      const [subjRows] = await executeQuery(
        'SELECT id FROM subjects WHERE name = ? OR code = ?',
        [subject, subject]
      );
      if (!subjRows.length) {
        errors.push(`Subject not found: ${subject}`);
        continue;
      }

      prepared.push({
        studentId: students[0].id,
        subjectId: subjRows[0].id,
        maxMarks,
        marks,
      });
    }

    if (errors.length) {
      const message = errors.join('; ');
      console.warn('bulk marks validation:', message);
      return res.status(400).json({ error: message });
    }

    // Insert marks
    for (const p of prepared) {
      await executeQuery(
        `INSERT INTO InternalMarks (student_id, subject_id, type, marks, max_marks, date, entered_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [p.studentId, p.subjectId, type, p.marks, p.maxMarks, examDate, enteredBy]
      );
    }

    res.json({ message: 'Marks entered successfully' });
  } catch (error) {
    console.error('Enter marks error:', error);
    next(error);
  }
});

module.exports = router;
