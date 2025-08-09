const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all subjects
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(`
      SELECT s.id,
             s.name,
             s.code,
             s.year,
             s.semester,
             s.credits,
             s.type,
             s.max_marks,
             u.id AS professorId,
             u.name AS professorName,
             s.created_at
      FROM subjects s
      LEFT JOIN users u ON s.professor_id = u.id
      ORDER BY s.year, s.semester, s.name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Subjects fetch error:', error);
    next(error);
  }
});

// Create subject
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, code, year, semester, credits, type, maxMarks, professorId } = req.body;

    if (![1, 2].includes(Number(semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const result = await executeQuery(
      'INSERT INTO subjects (name, code, year, semester, credits, type, max_marks, professor_id) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, year, semester, credits, type, maxMarks, professorId]
    );

    const insertedId = result.recordset?.[0]?.id;
    if (insertedId != null) {
      res.status(201).json({ id: insertedId, message: 'Subject created successfully' });
    } else {
      res.status(201).json({ message: 'Subject created successfully' });
    }
  } catch (error) {
    console.error('Create subject error:', error);
    next(error);
  }
});

// Update subject
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, year, semester, credits, type, maxMarks, professorId } = req.body;

    if (![1, 2].includes(Number(semester))) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const result = await executeQuery(
      'UPDATE subjects SET name = ?, code = ?, year = ?, semester = ?, credits = ?, type = ?, max_marks = ?, professor_id = ? WHERE id = ?',
      [name, code, year, semester, credits, type, maxMarks, professorId, id]
    );
    
    if (result.rowsAffected[0] === 0) {
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
    
    const result = await executeQuery('DELETE FROM subjects WHERE id = ?', [id]);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    next(error);
  }
});

module.exports = router;
