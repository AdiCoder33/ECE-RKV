const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all subjects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*, u.name as professor_name 
      FROM subjects s 
      LEFT JOIN users u ON s.professor_id = u.id 
      ORDER BY s.year, s.semester, s.name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subject
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, year, semester, credits, professorId, type, maxMarks } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO subjects (name, code, year, semester, credits, professor_id, type, max_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, year, semester, credits, professorId, type, maxMarks]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Subject created successfully' });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;