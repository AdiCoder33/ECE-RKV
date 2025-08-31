const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get analytics overview
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const [userStats] = await executeQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role');

    const [subjectStats] = await executeQuery('SELECT COUNT(*) as total_subjects FROM subjects');

    const [attendanceStats] = await executeQuery(`
      SELECT
        AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) as avg_attendance
      FROM attendance
      WHERE date >= DATE_ADD(DAY, -30, NOW())
    `);
    
    const [classesRows] = await executeQuery('SELECT COUNT(*) AS total_classes FROM classes');
    const totalClasses = classesRows[0].total_classes;

    const [studentsRows] = await executeQuery("SELECT COUNT(*) AS total_users FROM users WHERE role='student'");
    const totalUsers = studentsRows[0].total_users;

    const [professorsRows] = await executeQuery("SELECT COUNT(*) AS total_professors FROM users WHERE role='professor'");
    const totalProfessors = professorsRows[0].total_professors;

    res.json({
      userStats,
      totalSubjects: subjectStats[0].total_subjects,
      avgAttendance: Math.round(attendanceStats[0].avg_attendance * 100) / 100,
      totalClasses,
      totalUsers,
      totalProfessors
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    next(error);
  }
});

// Get year-wise student enrollment stats
router.get('/enrollment', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await executeQuery(
      "SELECT year, COUNT(*) AS students FROM users WHERE role='student' GROUP BY year ORDER BY year"
    );
    res.json(rows);
  } catch (error) {
    console.error('Enrollment analytics error:', error);
    next(error);
  }
});


// Get recent activities
router.get('/activities', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await executeQuery(
      'SELECT id, title AS action, created_at FROM notifications ORDER BY created_at DESC LIMIT 10'
    );
    res.json(rows);
  } catch (error) {
    console.error('Activities analytics error:', error);
    next(error);
  }
});

module.exports = router;
