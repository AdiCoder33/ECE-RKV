const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get professor dashboard metrics
router.get('/:id/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch distinct classes and subjects taught by the professor
    const classResult = await executeQuery(
      'SELECT DISTINCT year, semester, section, subject FROM timetable WHERE faculty = ?',
      [id]
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
      [id]
    );
    const totalStudents = studentResult.recordset[0]?.total_students || 0;

    // Average attendance for professor's subjects
    const attendanceResult = await executeQuery(
      `SELECT AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) AS avg_attendance
       FROM attendance
       WHERE subject_id IN (
         SELECT DISTINCT subject FROM timetable WHERE faculty = ?
       )`,
      [id]
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
      [id]
    );
    const expectedMarks = expectedResult.recordset[0]?.expected || 0;

    const gradedResult = await executeQuery(
      `SELECT COUNT(*) AS graded
       FROM InternalMarks
       WHERE subject_id IN (
         SELECT DISTINCT subject FROM timetable WHERE faculty = ?
       )`,
      [id]
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
    const { id } = req.params;

    // Find distinct classes (year/semester/section) taught by the professor
    const classesResult = await executeQuery(
      'SELECT DISTINCT year, semester, section FROM timetable WHERE faculty = ?',
      [id]
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
        [id, year, semester, section]
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

module.exports = router;
