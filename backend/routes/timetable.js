const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Helper to fetch timetable with optional filters
async function fetchTimetable({ year, semester, section, facultyId, day }) {
  let query =
    `SELECT t.id, t.day, t.time, t.subject, t.room, t.year, t.semester, t.section,
            u.name AS faculty, u.id AS faculty_id, s.id AS subject_id
       FROM timetable t
       LEFT JOIN users u ON u.id = TRY_CAST(t.faculty AS INT)
       LEFT JOIN subjects s ON s.name = t.subject OR CAST(s.id AS NVARCHAR) = t.subject
      WHERE 1=1`;
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
    query += ' AND u.id = ?';
    params.push(facultyId);
  }

  if (day) {
    query += ' AND t.day = ?';
    params.push(day);
  }

  query += ' ORDER BY t.day, t.time';
  const result = await executeQuery(query, params);
  return result.recordset;
}

// Get timetable
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const data = await fetchTimetable(req.query);
    res.json(data);
  } catch (error) {
    console.error('Timetable fetch error:', error);
    next(error);
  }
});

// Create timetable slot
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { day, time, subject, faculty, room, year, semester, section } = req.body;

    const clash = await executeQuery(
      'SELECT COUNT(*) AS cnt FROM timetable WHERE day = ? AND time = ? AND faculty = ?',
      [day, time, faculty]
    );
    if (clash.recordset[0].cnt > 0) {
      return res
        .status(409)
        .json({ message: 'Faculty already assigned to another slot at this time' });
    }

    const result = await executeQuery(
      'INSERT INTO timetable (day, time, subject, faculty, room, year, semester, section) OUTPUT INSERTED.id AS id VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [day, time, subject, faculty, room, year, semester, section]
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
    const { day, time, subject, faculty, room, year, semester, section } = req.body;

    const clash = await executeQuery(
      'SELECT COUNT(*) AS cnt FROM timetable WHERE day = ? AND time = ? AND faculty = ? AND id <> ?',
      [day, time, faculty, id]
    );
    if (clash.recordset[0].cnt > 0) {
      return res
        .status(409)
        .json({ message: 'Faculty already assigned to another slot at this time' });
    }

    await executeQuery(
      'UPDATE timetable SET day = ?, time = ?, subject = ?, faculty = ?, room = ?, year = ?, semester = ?, section = ? WHERE id = ?',
      [day, time, subject, faculty, room, year, semester, section, id]
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
module.exports.fetchTimetable = fetchTimetable;
