const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all subjects
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester } = req.query;

    let query = `
      SELECT s.id,
             s.name,
             s.code,
             s.year,
             s.semester,
             s.credits,
             s.type,
             s.created_at
      FROM subjects s
    `;

    if (year && semester) {
      const [rows] = await executeQuery(
        query + ' WHERE s.year = ? AND s.semester = ? ORDER BY s.year, s.semester, s.name',
        [Number(year), Number(semester)]
      );
      res.json(rows);
    } else {
      const [rows] = await executeQuery(query + ' ORDER BY s.year, s.semester, s.name');
      res.json(rows);
    }
  } catch (error) {
    console.error('Subjects fetch error:', error);
    next(error);
  }
});

// Create subject
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, code, year, semester, credits, type } = req.body;

    if (![1, 2].includes(Number(semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const [result] = await executeQuery(
      'INSERT INTO subjects (name, code, year, semester, credits, type) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, year, semester, credits, type]
    );

    res.status(201).json({ id: result.insertId, message: 'Subject created successfully' });
  } catch (error) {
    console.error('Create subject error:', error);
    next(error);
  }
});

// Update subject
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, year, semester, credits, type } = req.body;

    if (![1, 2].includes(Number(semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const [result] = await executeQuery(
      'UPDATE subjects SET name = ?, code = ?, year = ?, semester = ?, credits = ?, type = ? WHERE id = ?',
      [name, code, year, semester, credits, type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Update subject error:', error);
    next(error);
  }
});

// Delete subject
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [result] = await executeQuery('DELETE FROM subjects WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    next(error);
  }
});

module.exports = router;
