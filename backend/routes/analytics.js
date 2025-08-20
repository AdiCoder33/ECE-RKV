const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const routeLogger = require('../middleware/routeLogger');
const router = express.Router();
router.use(routeLogger());

// Get analytics overview
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const userResult = await executeQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const userStats = userResult.recordset;
    const subjectResult = await executeQuery('SELECT COUNT(*) as total_subjects FROM subjects');
    const subjectStats = subjectResult.recordset;
    const attendanceResult = await executeQuery(`
      SELECT
        AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) as avg_attendance
      FROM attendance
      WHERE date >= DATEADD(DAY, -30, GETDATE())
    `);
    const attendanceStats = attendanceResult.recordset;
    
    res.json({
      userStats,
      totalSubjects: subjectStats[0].total_subjects,
      avgAttendance: Math.round(attendanceStats[0].avg_attendance * 100) / 100
    });
  } catch (error) {
    logger.error(`Analytics overview error: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

module.exports = router;
