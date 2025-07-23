const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get analytics overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const [userStats] = await db.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const [subjectStats] = await db.execute('SELECT COUNT(*) as total_subjects FROM subjects');
    const [attendanceStats] = await db.execute(`
      SELECT 
        AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) as avg_attendance 
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    
    res.json({
      userStats,
      totalSubjects: subjectStats[0].total_subjects,
      avgAttendance: Math.round(attendanceStats[0].avg_attendance * 100) / 100
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;