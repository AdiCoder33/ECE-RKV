const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { fetchTimetable } = require('./timetable');
const router = express.Router();

// Get timetable for a professor
router.get('/:id/timetable', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }
    const data = await fetchTimetable({ ...req.query, facultyId: professorId });
    res.json(data);
  } catch (error) {
    console.error('Professor timetable fetch error:', error);
    next(error);
  }
});

// Get professor dashboard metrics
router.get('/:id/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    // Fetch distinct classes and subjects taught by the professor
    const classResult = await executeQuery(
      'SELECT DISTINCT year, semester, section, subject FROM timetable WHERE faculty = ?',
      [professorId]
    );
    const classes = classResult.recordset || [];
    const activeClasses = classes.length;

    // Total students across all classes
    const studentResult = await executeQuery(
      `SELECT COUNT(DISTINCT u.id) AS total_students
       FROM users u
       JOIN (
         SELECT DISTINCT year, semester, section
         FROM timetable
         WHERE faculty = ?
       ) t ON u.year = t.year AND u.semester = t.semester AND u.section = t.section
       WHERE u.role = 'student'`,
      [professorId]
    );
    const totalStudents = studentResult.recordset[0]?.total_students || 0;

    // Average attendance for professor's subjects
    const attendanceResult = await executeQuery(
      `SELECT AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) AS avg_attendance
       FROM attendance
       WHERE subject_id IN (
         SELECT DISTINCT subject FROM timetable WHERE faculty = ?
       )`,
      [professorId]
    );
    const avgAttendance = Math.round((attendanceResult.recordset[0]?.avg_attendance || 0) * 100) / 100;

    // Pending grading calculation
    const expectedResult = await executeQuery(
      `SELECT SUM(cnt) AS expected
       FROM (
         SELECT t.subject, COUNT(DISTINCT u.id) AS cnt
         FROM (
           SELECT DISTINCT year, semester, section, subject
           FROM timetable
           WHERE faculty = ?
         ) t
         JOIN users u ON u.year = t.year AND u.semester = t.semester AND u.section = t.section
         WHERE u.role = 'student'
         GROUP BY t.subject
       ) x`,
      [professorId]
    );
    const expectedMarks = expectedResult.recordset[0]?.expected || 0;

    const gradedResult = await executeQuery(
      `SELECT COUNT(*) AS graded
       FROM InternalMarks
       WHERE subject_id IN (
         SELECT DISTINCT subject FROM timetable WHERE faculty = ?
       )`,
      [professorId]
    );
    const graded = gradedResult.recordset[0]?.graded || 0;
    const pendingGrading = Math.max(expectedMarks - graded, 0);

    res.json({
      totalStudents,
      activeClasses,
      avgAttendance,
      pendingGrading
    });
  } catch (error) {
    console.error('Professor dashboard error:', error);
    next(error);
  }
});

// Get class metrics for a professor
router.get('/:id/classes', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    // Find distinct classes (year/semester/section) taught by the professor
    const classesResult = await executeQuery(
      'SELECT DISTINCT year, semester, section FROM timetable WHERE faculty = ?',
      [professorId]
    );

    const classes = classesResult.recordset || [];
    const response = [];

    for (const cls of classes) {
      const { year, semester, section } = cls;

      // Student count for this class
      const studentsResult = await executeQuery(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role = 'student' AND year = ? AND semester = ? AND section = ?`,
        [year, semester, section]
      );
      const studentCount = studentsResult.recordset[0]?.count || 0;

      // Subjects taught by this professor for the class
      const subjectsResult = await executeQuery(
        `SELECT DISTINCT s.id
         FROM timetable t
         JOIN subjects s ON s.name = t.subject OR CAST(s.id AS NVARCHAR) = t.subject
         WHERE t.faculty = ? AND t.year = ? AND t.semester = ? AND t.section = ?`,
        [professorId, year, semester, section]
      );

      const subjectIds = subjectsResult.recordset.map(r => r.id);

      let avgScore = 0;
      let attendance = 0;

      if (subjectIds.length > 0) {
        const placeholders = subjectIds.map(() => '?').join(',');

        // Average score from InternalMarks
        const marksResult = await executeQuery(
          `SELECT AVG(marks * 100.0 / NULLIF(max_marks, 0)) AS avg_score
           FROM InternalMarks
           WHERE subject_id IN (${placeholders})
             AND student_id IN (
               SELECT id FROM users WHERE role = 'student' AND year = ? AND semester = ? AND section = ?
             )`,
          [...subjectIds, year, semester, section]
        );
        avgScore = Math.round((marksResult.recordset[0]?.avg_score || 0) * 100) / 100;

        // Attendance percentage
        const attendanceResult = await executeQuery(
          `SELECT AVG(CASE WHEN status = 'present' THEN 1.0 ELSE 0 END) * 100 AS attendance
           FROM attendance
           WHERE subject_id IN (${placeholders})
             AND student_id IN (
               SELECT id FROM users WHERE role = 'student' AND year = ? AND semester = ? AND section = ?
             )`,
          [...subjectIds, year, semester, section]
        );
        attendance = Math.round((attendanceResult.recordset[0]?.attendance || 0) * 100) / 100;
      }

      response.push({
        name: `${year}-${section}`,
        year,
        semester,
        section,
        students: studentCount,
        avgScore,
        attendance
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Professor classes error:', error);
    next(error);
  }
});

// Get weekly attendance trend for a professor's subjects
router.get('/:id/attendance-trend', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }
    const weeks = parseInt(req.query.weeks, 10) || 5;

    // Determine subject IDs taught by the professor
    const subjectsResult = await executeQuery(
      `SELECT DISTINCT s.id
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR CAST(s.id AS NVARCHAR) = t.subject
       WHERE t.faculty = ?`,
      [professorId]
    );
    const subjectIds = subjectsResult.recordset.map(r => r.id);
    if (subjectIds.length === 0) {
      return res.json([]);
    }

    const placeholders = subjectIds.map(() => '?').join(',');
    const params = [...subjectIds, -(weeks - 1)];

    const attendanceQuery = `
      SELECT 
        DATEADD(WEEK, DATEDIFF(WEEK, 0, date), 0) AS week_start,
        AVG(CASE WHEN present = 1 THEN 1.0 ELSE 0 END) * 100 AS attendance
      FROM attendance
      WHERE subject_id IN (${placeholders})
        AND date >= DATEADD(WEEK, ?, CAST(GETDATE() AS DATE))
      GROUP BY DATEADD(WEEK, DATEDIFF(WEEK, 0, date), 0)
      ORDER BY week_start`;

    const result = await executeQuery(attendanceQuery, params);
    const trend = result.recordset.map((row, idx) => ({
      week: `Week ${idx + 1}`,
      attendance: Math.round((row.attendance || 0) * 100) / 100
    }));

    res.json(trend);
  } catch (error) {
    console.error('Professor attendance trend error:', error);
    next(error);
  }
});

// Get grading distribution for a professor's subjects
router.get('/:id/grading-distribution', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    // Determine subject IDs taught by the professor
    const subjectsResult = await executeQuery(
      `SELECT DISTINCT s.id
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR CAST(s.id AS NVARCHAR) = t.subject
       WHERE t.faculty = ?`,
      [professorId]
    );
    const subjectIds = subjectsResult.recordset.map(r => r.id);
    if (subjectIds.length === 0) {
      return res.json([]);
    }

    const placeholders = subjectIds.map(() => '?').join(',');

    const distributionQuery = `
      SELECT grade, COUNT(*) AS count FROM (
        SELECT CASE
          WHEN marks * 100.0 / NULLIF(max_marks, 0) >= 90 THEN 'A+'
          WHEN marks * 100.0 / NULLIF(max_marks, 0) >= 80 THEN 'A'
          WHEN marks * 100.0 / NULLIF(max_marks, 0) >= 70 THEN 'B+'
          WHEN marks * 100.0 / NULLIF(max_marks, 0) >= 60 THEN 'B'
          WHEN marks * 100.0 / NULLIF(max_marks, 0) >= 50 THEN 'C+'
          ELSE 'F'
        END AS grade
        FROM InternalMarks
        WHERE subject_id IN (${placeholders})
      ) g
      GROUP BY grade`;

    const result = await executeQuery(distributionQuery, subjectIds);
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Professor grading distribution error:', error);
    next(error);
  }
});

// Get recent activity feed for a professor based on notifications
router.get('/:id/activity-feed', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    // Fetch recent notifications for the professor
    const { recordset } = await executeQuery(
      `SELECT TOP 10 id, title, message, type, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [professorId]
    );

    const activities = recordset.map(row => ({
      id: row.id,
      action: row.title,
      details: row.message,
      time: row.created_at,
      type: row.type
    }));

    res.json(activities);
  } catch (error) {
    console.error('Professor activity feed error:', error);
    next(error);
  }
});

module.exports = router;
