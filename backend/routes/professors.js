const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { fetchTimetable } = require('./timetable');
const { resolveProfileImage } = require('../utils/images');
const sanitizePhone = require('../utils/phone');
const router = express.Router();

// Get professor profile
router.get('/:id/profile', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    const [rows] = await executeQuery(
      "SELECT id, name, email, department, phone, profile_image, address, blood_group, date_of_birth FROM users WHERE id = ? AND role = 'professor'",
      [professorId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Professor not found' });
    }
    const prof = rows[0];

    const [achRows] = await executeQuery(
      'SELECT id, title, description, date, category FROM professor_achievements WHERE professor_id = ?',
      [professorId]
    );
    const achievements = achRows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category
    }));

    res.json({
      id: prof.id,
      name: prof.name,
      email: prof.email,
      department: prof.department,
      phone: prof.phone,
      profileImage: await resolveProfileImage(prof.profile_image),
      address: prof.address,
      bloodGroup: prof.blood_group,
      dateOfBirth: prof.date_of_birth,
      achievements
    });
  } catch (error) {
    console.error('Professor profile fetch error:', error);
    next(error);
  }
});

// Update professor profile
router.put('/:id/profile', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    if (req.user.role !== 'admin' && req.user.id !== professorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      phone: rawPhone,
      profileImage,
      name,
      email,
      address,
      bloodGroup,
      dateOfBirth
    } = req.body;
    const phone = sanitizePhone(rawPhone);
    let dob;
    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        if (Number.isNaN(Date.parse(dateOfBirth))) {
          return res.status(400).json({ error: 'Invalid dateOfBirth' });
        }
        dob = new Date(dateOfBirth).toISOString().slice(0, 10);
      } else {
        dob = null;
      }
    }
    const fields = [];
    const params = [];
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone);
    }
    if (profileImage !== undefined) {
      fields.push('profile_image = ?');
      params.push(profileImage);
    }
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }
    if (bloodGroup !== undefined) {
      fields.push('blood_group = ?');
      params.push(bloodGroup);
    }
    if (dateOfBirth !== undefined) {
      fields.push('date_of_birth = ?');
      params.push(dob);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(professorId);
    const updateQuery = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND role = 'professor'`;
    const [updateResult] = await executeQuery(updateQuery, params);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Professor not found' });
    }

    const [rows] = await executeQuery(
      "SELECT id, name, email, department, phone, profile_image, address, blood_group, date_of_birth FROM users WHERE id = ? AND role = 'professor'",
      [professorId]
    );
    const prof = rows[0];
    res.json({
      id: prof.id,
      name: prof.name,
      email: prof.email,
      department: prof.department,
      phone: prof.phone,
      profileImage: await resolveProfileImage(prof.profile_image),
      address: prof.address,
      bloodGroup: prof.blood_group,
      dateOfBirth: prof.date_of_birth
    });
  } catch (error) {
    console.error('Professor profile update error:', error);
    next(error);
  }
});

// List professor achievements
router.get('/:id/achievements', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    const [rows] = await executeQuery(
      'SELECT id, title, description, date, category FROM professor_achievements WHERE professor_id = ?',
      [professorId]
    );
    const achievements = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category
    }));
    res.json(achievements);
  } catch (error) {
    console.error('Professor achievements fetch error:', error);
    next(error);
  }
});

// Add a professor achievement
router.post('/:id/achievements', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'hod' && req.user.id !== professorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, date, category } = req.body;
    const [result] = await executeQuery(
      'INSERT INTO professor_achievements (professor_id, title, description, date, category) VALUES (?, ?, ?, ?, ?)',
      [professorId, title, description, date, category]
    );
    res.status(201).json({ id: result.insertId, title, description, date, category });
  } catch (error) {
    console.error('Add professor achievement error:', error);
    next(error);
  }
});

// Update a professor achievement
router.put('/:id/achievements/:achievementId', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    const achievementId = parseInt(req.params.achievementId, 10);
    if (Number.isNaN(professorId) || Number.isNaN(achievementId)) {
      console.warn('Invalid professor or achievement id:', req.params.id, req.params.achievementId);
      return res.status(400).json({ error: 'Invalid id' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'hod' && req.user.id !== professorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, date, category } = req.body;
    const [result] = await executeQuery(
      'UPDATE professor_achievements SET title = ?, description = ?, date = ?, category = ? WHERE id = ? AND professor_id = ?',
      [title, description, date, category, achievementId, professorId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const [rows] = await executeQuery(
      'SELECT id, title, description, date, category FROM professor_achievements WHERE id = ? AND professor_id = ?',
      [achievementId, professorId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const updated = rows[0];
    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      date: updated.date,
      category: updated.category
    });
  } catch (error) {
    console.error('Update professor achievement error:', error);
    next(error);
  }
});

// Delete a professor achievement
router.delete('/:id/achievements/:achievementId', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    const achievementId = parseInt(req.params.achievementId, 10);
    if (Number.isNaN(professorId) || Number.isNaN(achievementId)) {
      console.warn('Invalid professor or achievement id:', req.params.id, req.params.achievementId);
      return res.status(400).json({ error: 'Invalid id' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'hod' && req.user.id !== professorId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [result] = await executeQuery(
      'DELETE FROM professor_achievements WHERE id = ? AND professor_id = ?',
      [achievementId, professorId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Delete professor achievement error:', error);
    next(error);
  }
});

// Get timetable for a professor
router.get('/:id/timetable', authenticateToken, async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id, 10);
    if (Number.isNaN(professorId)) {
      console.warn('Invalid professor id:', req.params.id);
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
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    const facultyIdStr = String(professorId);

    // Fetch distinct classes and subjects taught by the professor
    const [classes] = await executeQuery(
      'SELECT DISTINCT year, semester, section, subject FROM timetable WHERE faculty = ?',
      [facultyIdStr]
    );
    const activeClasses = classes.length;

    // Total students across all classes
    const [studentRows] = await executeQuery(
      `SELECT COUNT(DISTINCT u.id) AS total_students
       FROM users u
       JOIN (
         SELECT DISTINCT year, semester, section
         FROM timetable
         WHERE faculty = ?
       ) t ON u.year = t.year AND u.semester = t.semester AND u.section = t.section
       WHERE u.role = 'student'`,
      [facultyIdStr]
    );
    const totalStudents = studentRows[0]?.total_students || 0;
    const [subjectsRows] = await executeQuery(
      `SELECT DISTINCT s.id
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR s.id = t.subject
       WHERE t.faculty = ?`,
      [facultyIdStr]
    );
    const subjectIds = subjectsRows.map(r => r.id);

    let avgAttendance = 0;
    let pendingGrading = 0;

    if (subjectIds.length > 0) {
      const placeholders = subjectIds.map(() => '?').join(',');

      // Average attendance for professor's subjects
      const [attendanceRows] = await executeQuery(
        `SELECT AVG(CASE WHEN present = 1 THEN 100 ELSE 0 END) AS avg_attendance
         FROM attendance
         WHERE subject_id IN (${placeholders})`,
        subjectIds
      );
      avgAttendance = Math.round((attendanceRows[0]?.avg_attendance || 0) * 100) / 100;

      // Pending grading calculation
      const [expectedRows] = await executeQuery(
        `SELECT SUM(cnt) AS expected
         FROM (
           SELECT s.id AS subject_id, COUNT(DISTINCT u.id) AS cnt
           FROM timetable t
           JOIN subjects s ON s.name = t.subject OR s.id = t.subject
           JOIN users u ON u.year = t.year AND u.semester = t.semester AND u.section = t.section
           WHERE t.faculty = ?
             AND u.role = 'student'
             AND s.id IN (${placeholders})
          GROUP BY s.id
        ) x`,
        [facultyIdStr, ...subjectIds]
      );
      const expectedMarks = expectedRows[0]?.expected || 0;

      const [gradedRows] = await executeQuery(
        `SELECT COUNT(*) AS graded
         FROM InternalMarks
         WHERE subject_id IN (${placeholders})`,
        subjectIds
      );
      const graded = gradedRows[0]?.graded || 0;
      pendingGrading = Math.max(expectedMarks - graded, 0);
    }

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
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    const facultyIdStr = String(professorId);

    // Find distinct classes (year/semester/section) taught by the professor
    const [classes] = await executeQuery(
      'SELECT DISTINCT year, semester, section FROM timetable WHERE faculty = ?',
      [facultyIdStr]
    );
    const response = [];

    for (const cls of classes) {
      const { year, semester, section } = cls;

      // Student count for this class
      const [studentsRows] = await executeQuery(
        `SELECT COUNT(*) AS count
         FROM users
         WHERE role = 'student' AND year = ? AND semester = ? AND section = ?`,
        [year, semester, section]
      );
      const studentCount = studentsRows[0]?.count || 0;

      // Subjects taught by this professor for the class
      const [subjectsRows] = await executeQuery(
        `SELECT DISTINCT s.id
         FROM timetable t
         JOIN subjects s ON s.name = t.subject OR s.id = t.subject
         WHERE t.faculty = ? AND t.year = ? AND t.semester = ? AND t.section = ?`,
        [facultyIdStr, year, semester, section]
      );
      const subjectIds = subjectsRows.map(r => r.id);

      let avgScore = 0;
      let attendance = 0;

      if (subjectIds.length > 0) {
        const placeholders = subjectIds.map(() => '?').join(',');

        // Average score from InternalMarks
        const [marksRows] = await executeQuery(
          `SELECT AVG(marks * 100.0 / NULLIF(max_marks, 0)) AS avg_score
           FROM InternalMarks
           WHERE subject_id IN (${placeholders})
             AND student_id IN (
               SELECT id FROM users WHERE role = 'student' AND year = ? AND semester = ? AND section = ?
             )`,
          [...subjectIds, year, semester, section]
        );
        avgScore = Math.round((marksRows[0]?.avg_score || 0) * 100) / 100;

        // Attendance percentage
        const [attendanceRows] = await executeQuery(
          `SELECT AVG(CASE WHEN present = 1 THEN 1.0 ELSE 0 END) * 100 AS attendance
           FROM attendance
           WHERE subject_id IN (${placeholders})
             AND student_id IN (
               SELECT id FROM users WHERE role = 'student' AND year = ? AND semester = ? AND section = ?
             )`,
          [...subjectIds, year, semester, section]
        );
        attendance = Math.round((attendanceRows[0]?.attendance || 0) * 100) / 100;
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
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }
    const facultyIdStr = String(professorId);
    const weeks = parseInt(req.query.weeks, 10) || 5;

    // Determine subject IDs taught by the professor
    const [subjectsRows] = await executeQuery(
      `SELECT DISTINCT s.id
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR s.id = t.subject
       WHERE t.faculty = ?`,
      [facultyIdStr]
    );
    const subjectIds = subjectsRows.map(r => r.id);
    if (subjectIds.length === 0) {
      return res.json([]);
    }

    const placeholders = subjectIds.map(() => '?').join(',');
    const params = [...subjectIds, -(weeks - 1)];

    const attendanceQuery = `
      SELECT
        DATE_SUB(date, INTERVAL WEEKDAY(date) DAY) AS week_start,
        AVG(CASE WHEN present = 1 THEN 1.0 ELSE 0 END) * 100 AS attendance
      FROM attendance
      WHERE subject_id IN (${placeholders})
        AND date >= DATE_ADD(CURDATE(), INTERVAL ? WEEK)
      GROUP BY DATE_SUB(date, INTERVAL WEEKDAY(date) DAY)
      ORDER BY week_start`;

    const [rows] = await executeQuery(attendanceQuery, params);
    const trend = rows.map((row, idx) => ({
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
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    const facultyIdStr = String(professorId);

    // Determine subject IDs taught by the professor
    const [subjectsRows] = await executeQuery(
      `SELECT DISTINCT s.id
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR s.id = t.subject
       WHERE t.faculty = ?`,
      [facultyIdStr]
    );
    const subjectIds = subjectsRows.map(r => r.id);
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

    const [rows] = await executeQuery(distributionQuery, subjectIds);
    res.json(rows || []);
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
      console.warn('Invalid professor id:', req.params.id);
      return res.status(400).json({ error: 'Invalid professor id' });
    }

    // Fetch recent notifications for the professor
    const [rows] = await executeQuery(
      `SELECT id, title, message, type, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10;`,
      [professorId]
    );
    const activities = rows.map(row => ({
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
