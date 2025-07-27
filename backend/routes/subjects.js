const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all subjects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT s.id, s.name, s.code, s.year, s.semester, s.credits, s.type, s.max_marks, s.created_at
      FROM subjects s 
      ORDER BY s.year, s.semester, s.name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subject
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, year, semester, credits, type, maxMarks } = req.body;
    
    const result = await executeQuery(
      'INSERT INTO subjects (name, code, year, semester, credits, type, max_marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, code, year, semester, credits, type, maxMarks]
    );
    
    res.status(201).json({ id: result.recordset[0]?.id, message: 'Subject created successfully' });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subject
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, year, semester, credits, type, maxMarks } = req.body;
    
    const result = await executeQuery(
      'UPDATE subjects SET name = ?, code = ?, year = ?, semester = ?, credits = ?, type = ?, max_marks = ? WHERE id = ?',
      [name, code, year, semester, credits, type, maxMarks, id]
    );
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subject
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery('DELETE FROM subjects WHERE id = ?', [id]);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;