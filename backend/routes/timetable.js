const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get timetable
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { year, section, faculty } = req.query;
    let query = 'SELECT * FROM timetable WHERE 1=1';
    let params = [];
    
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    
    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }
    
    if (faculty) {
      query += ' AND faculty = ?';
      params.push(faculty);
    }
    
    query += ' ORDER BY day, time';
    
    const result = await executeQuery(query, params);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create timetable slot
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { day, time, subject, faculty, room, year, section } = req.body;
    
    const result = await executeQuery(
      'INSERT INTO timetable (day, time, subject, faculty, room, year, section) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [day, time, subject, faculty, room, year, section]
    );
    
    res.status(201).json({ id: result.recordset[0].id, message: 'Timetable slot created successfully' });
  } catch (error) {
    console.error('Create timetable slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update timetable slot
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { day, time, subject, faculty, room, year, section } = req.body;
    
    await executeQuery(
      'UPDATE timetable SET day = ?, time = ?, subject = ?, faculty = ?, room = ?, year = ?, section = ? WHERE id = ?',
      [day, time, subject, faculty, room, year, section, id]
    );
    
    res.json({ message: 'Timetable slot updated successfully' });
  } catch (error) {
    console.error('Update timetable slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timetable slot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM timetable WHERE id = ?', [id]);
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error) {
    console.error('Delete timetable slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;