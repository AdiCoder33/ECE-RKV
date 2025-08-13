const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get timetable
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    let { year, semester, section, facultyId, day, faculty } = req.query;

    if (!facultyId && faculty) {
      const lookup = await executeQuery('SELECT id FROM users WHERE name = ?', [faculty]);
      facultyId = lookup.recordset[0]?.id;
    }

    let query = `SELECT t.id, t.day, t.time, t.subject, u.name AS faculty, t.room, t.year, t.semester, t.section
                 FROM timetable t JOIN users u ON t.faculty = u.id WHERE 1=1`;
    const params = [];

    if (year) {
      query += ' AND t.year = ?';
      params.push(year);
    }

    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }

    if (section) {
      query += ' AND t.section = ?';
      params.push(section);
    }

    if (facultyId) {
      query += ' AND t.faculty = ?';
      params.push(facultyId);
    }

    if (day) {
      query += ' AND t.day = ?';
      params.push(day);
    }

    query += ' ORDER BY t.day, t.time';

    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Timetable fetch error:', error);
    next(error);
  }
});

// Create timetable slot
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { day, time, subject, facultyId, faculty, room, year, semester, section } = req.body;
    let facId = facultyId;

    if (!facId && faculty) {
      if (/^\d+$/.test(String(faculty))) {
        facId = faculty;
      } else {
        const lookup = await executeQuery('SELECT id FROM users WHERE name = ?', [faculty]);
        facId = lookup.recordset[0]?.id;
      }
    }

    if (!facId) {
      return res.status(400).json({ message: 'facultyId is required' });
    }

    const clash = await executeQuery(
      'SELECT COUNT(*) AS cnt FROM timetable WHERE day = ? AND time = ? AND faculty = ?',
      [day, time, facId]
    );
    if (clash.recordset[0].cnt > 0) {
      return res
        .status(409)
        .json({ message: 'Faculty already assigned to another slot at this time' });
    }

    const result = await executeQuery(
      'INSERT INTO timetable (day, time, subject, faculty, room, year, semester, section) OUTPUT INSERTED.id AS id VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [day, time, subject, facId, room, year, semester, section]
    );

    const newId = result.recordset?.[0]?.id;
    res.status(201).json({ id: newId, message: 'Timetable slot created successfully' });
  } catch (error) {
    console.error('Create timetable slot error:', error);
    next(error);
  }
});

// Update timetable slot
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { day, time, subject, facultyId, faculty, room, year, semester, section } = req.body;
    let facId = facultyId;

    if (!facId && faculty) {
      if (/^\d+$/.test(String(faculty))) {
        facId = faculty;
      } else {
        const lookup = await executeQuery('SELECT id FROM users WHERE name = ?', [faculty]);
        facId = lookup.recordset[0]?.id;
      }
    }

    if (!facId) {
      return res.status(400).json({ message: 'facultyId is required' });
    }

    const clash = await executeQuery(
      'SELECT COUNT(*) AS cnt FROM timetable WHERE day = ? AND time = ? AND faculty = ? AND id <> ?',
      [day, time, facId, id]
    );
    if (clash.recordset[0].cnt > 0) {
      return res
        .status(409)
        .json({ message: 'Faculty already assigned to another slot at this time' });
    }

    await executeQuery(
      'UPDATE timetable SET day = ?, time = ?, subject = ?, faculty = ?, room = ?, year = ?, semester = ?, section = ? WHERE id = ?',
      [day, time, subject, facId, room, year, semester, section, id]
    );

    res.json({ message: 'Timetable slot updated successfully' });
  } catch (error) {
    console.error('Update timetable slot error:', error);
    next(error);
  }
});

// Delete timetable slot
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM timetable WHERE id = ?', [id]);
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error) {
    console.error('Delete timetable slot error:', error);
    next(error);
  }
});

module.exports = router;
