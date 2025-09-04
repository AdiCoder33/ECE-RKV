const express = require('express');
const { executeQuery, connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { resolveProfileImage } = require('../utils/images');
const router = express.Router();

// Authorization helper to ensure the user has one of the required roles
const requireRole = roles => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Get all classes with student counts
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT c.id, c.year, c.semester, c.section, c.hod_id,
             h.name AS hod_name,
             IFNULL(s.total_strength, 0) AS total_strength
      FROM classes c
      LEFT JOIN users h ON c.hod_id = h.id
      LEFT JOIN (
        SELECT year, semester, section, COUNT(*) AS total_strength
        FROM users
        WHERE role = 'student'
        GROUP BY year, semester, section
      ) s ON c.year = s.year AND c.semester = s.semester AND c.section = s.section
      ORDER BY c.year, c.semester, c.section
    `;
    
    const [rows] = await executeQuery(query);
    const classes = rows || [];
    
    res.json(classes.map(cls => ({
      id: cls.id.toString(),
      year: cls.year,
      semester: cls.semester,
      section: cls.section,
      hodId: cls.hod_id?.toString(),
      hodName: cls.hod_name,
      totalStrength: cls.total_strength,
      subjects: [], // Will be populated separately if needed
      students: []  // Will be populated separately if needed
    })));
  } catch (error) {
    console.error('Classes fetch error:', error);
    next(error);
  }
});

// Get promotion summary by year
router.get('/promotion-summary', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT year,
             COUNT(*) AS student_count,
             COUNT(DISTINCT section) AS section_count
      FROM users
      WHERE role = 'student'
      GROUP BY year
      ORDER BY year
    `;

    const [rows] = await executeQuery(query);
    const summary = rows || [];

    res.json(
      summary.map(row => ({
        year: row.year,
        students: row.student_count,
        sections: row.section_count
      }))
    );
  } catch (error) {
    console.error('Promotion summary fetch error:', error);
    next(error);
  }
});

// Get distinct sections for a given year (and optional semester)
router.get('/sections', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    let query = 'SELECT DISTINCT section FROM classes WHERE year = ?';
    const params = [year];

    if (semester) {
      query += ' AND semester = ?';
      params.push(Number(semester));
    }

    const [rows] = await executeQuery(query, params);
    const sections = (rows || []).map(row => row.section);

    res.json(sections);
  } catch (error) {
    console.error('Sections fetch error:', error);
    next(error);
  }
});

// Create new class
router.post('/', authenticateToken, requireRole(['admin', 'hod']), async (req, res, next) => {
  try {
    const { year, semester, section, hodId, department } = req.body;

    if (!year || !semester || !section) {
      return res.status(400).json({ error: 'Year, semester, and section are required' });
    }

    const sem = Number(semester);
    if (![1, 2].includes(sem)) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const dept = department || 'ECE';

    // Check if class already exists
      const [existingResult] = await executeQuery(
        'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ? AND department = ?',
        [year, sem, section, dept]
      );

      if (existingResult.length > 0) {
        return res.status(400).json({ error: 'Class already exists' });
      }

      const [insertResult] = await executeQuery(
        'INSERT INTO classes (year, semester, section, department, hod_id) VALUES (?, ?, ?, ?, ?)',
        [year, sem, section, dept, hodId || null]
      );

      const newId = insertResult.insertId;

    // Link existing students of the same year, semester, and section to this class
    await executeQuery(
      "INSERT INTO student_classes (class_id, student_id) SELECT ?, id FROM users WHERE role='student' AND year=? AND semester=? AND section=?",
      [newId, year, sem, section]
    );

      // Fetch the created class
      const [createdResult] = await executeQuery(
        `
        SELECT c.id, c.year, c.semester, c.section, c.hod_id,
               h.name AS hod_name,
               IFNULL(s.total_strength, 0) AS total_strength
        FROM classes c
        LEFT JOIN users h ON c.hod_id = h.id
        LEFT JOIN (
          SELECT year, semester, section, COUNT(*) AS total_strength
          FROM users
          WHERE role = 'student'
          GROUP BY year, semester, section
        ) s ON c.year = s.year AND c.semester = s.semester AND c.section = s.section
        WHERE c.id = ?
      `,
        [newId]
      );

      const newClass = createdResult[0];

      res.status(201).json({
        id: newClass.id.toString(),
        year: newClass.year,
        semester: newClass.semester,
        section: newClass.section,
        hodId: newClass.hod_id?.toString(),
        hodName: newClass.hod_name,
        totalStrength: newClass.total_strength,
        subjects: [],
        students: []
      });
  } catch (error) {
    console.error('Create class error:', error);
    next(error);
  }
});

// Get a specific class with student count
router.get('/:classId', authenticateToken, async (req, res, next) => {
  try {
    const { classId } = req.params;

    const query = `
      SELECT c.id, c.year, c.semester, c.section, c.hod_id,
             h.name AS hod_name,
             IFNULL(s.total_strength, 0) AS total_strength
      FROM classes c
      LEFT JOIN users h ON c.hod_id = h.id
      LEFT JOIN (
        SELECT year, semester, section, COUNT(*) AS total_strength
        FROM users
        WHERE role = 'student'
        GROUP BY year, semester, section
      ) s ON c.year = s.year AND c.semester = s.semester AND c.section = s.section
      WHERE c.id = ?
    `;

    const [rows] = await executeQuery(query, [classId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const cls = rows[0];

    res.json({
      id: cls.id.toString(),
      year: cls.year,
      semester: cls.semester,
      section: cls.section,
      hodId: cls.hod_id?.toString(),
      hodName: cls.hod_name,
      totalStrength: cls.total_strength,
      subjects: [],
      students: []
    });
  } catch (error) {
    console.error('Class fetch error:', error);
    next(error);
  }
});

// Get students in a specific class
router.get('/:classId/students', authenticateToken, async (req, res, next) => {
  try {
    const { classId } = req.params;
    
    // Retrieve students ordered by numeric roll numbers
    const query = `
      SELECT u.*, sc.enrollment_date,
             IFNULL(att.attendance_percentage, 0) AS attendance_percentage,
             ar.cgpa
      FROM users u
      JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN (
        SELECT student_id, AVG(present) * 100 AS attendance_percentage
        FROM attendance
        GROUP BY student_id
      ) att ON u.id = att.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE sc.class_id = ? AND u.role = 'student'
      ORDER BY CAST(u.roll_number AS UNSIGNED)
    `;
    
    const [rows] = await executeQuery(query, [classId]);
    const students = rows || [];

    const formatted = await Promise.all(
      students.map(async student => ({
        id: student.id.toString(),
        name: student.name,
        email: student.email,
        rollNumber: student.roll_number,
        phone: student.phone,
        department: student.department,
        year: student.year,
        section: student.section,
        profileImage: await resolveProfileImage(student.profile_image),
        dateOfBirth: student.date_of_birth,
        address: student.address,
        parentContact: student.parent_contact,
        bloodGroup: student.blood_group,
        admissionYear: student.admission_year,
        attendancePercentage: Math.round(student.attendance_percentage || 0),
        cgpa: student.cgpa || 0
      }))
    );
    res.json(formatted);
  } catch (error) {
    console.error('Class students fetch error:', error);
    next(error);
  }
});

// Update class
router.put('/:classId', authenticateToken, requireRole(['admin', 'hod']), async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { year, semester, section, department, hodId } = req.body;

    let sem = null;
    if (semester !== undefined && semester !== null) {
      sem = Number(semester);
      if (![1, 2].includes(sem)) {
        return res.status(400).json({ error: 'Semester must be 1 or 2' });
      }
    }

    const params = [
      year ?? null,
      sem,
      section ?? null,
      department ?? null,
      hodId ?? null,
      classId,
    ];

    const [result] = await executeQuery(
      'UPDATE classes SET year=?, semester=?, section=?, department=?, hod_id=? WHERE id=?',
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Update class error:', error);
    next(error);
  }
});

// Delete class
router.delete('/:classId', authenticateToken, requireRole(['admin', 'hod']), async (req, res, next) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists and has no students
    const [studentsResult] = await executeQuery(
      'SELECT COUNT(*) as count FROM student_classes WHERE class_id = ?',
      [classId]
    );

    if (studentsResult[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete class with enrolled students' });
    }

    await executeQuery('DELETE FROM classes WHERE id = ?', [classId]);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    next(error);
  }
});

// Promote students to next year
router.post('/promote', authenticateToken, requireRole(['admin', 'hod']), async (req, res, next) => {
  try {
    const semester = parseInt(req.body.currentSemester, 10);
    if (![1, 2].includes(semester)) {
      return res.status(400).json({ error: 'currentSemester must be 1 or 2' });
    }

    const pool = await connectDB();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Convert any existing fifth-year students to alumni before promotion
      await connection.query(`
        UPDATE users
        SET role = 'alumni',
            year = NULL,
            semester = NULL,
            section = NULL
        WHERE role = 'student' AND year = 5;
      `);

      // Clean up any remaining links and classes from previous fifth years
      await connection.query(`
        DELETE FROM student_classes
        WHERE class_id IN (SELECT id FROM classes WHERE year = 5);
      `);

      await connection.query(`
        DELETE FROM classes WHERE year = 5;
      `);

      if (semester === 1) {
        // Move all semester 1 classes and students to semester 2
        await connection.query(`
          UPDATE classes
          SET semester = 2
          WHERE semester = 1;
        `);

        const [promotedResult] = await connection.query(`
          UPDATE users
          SET semester = 2
          WHERE role = 'student' AND semester = 1;
        `);

        await connection.commit();

        return res.json({
          message: 'Students moved to semester 2',
          promoted: promotedResult.affectedRows,
          graduated: 0
        });
      }

      // Update non-final-year semester 2 classes to next year semester 1
      await connection.query(`
        UPDATE classes
        SET year = year + 1,
            semester = 1
        WHERE semester = 2 AND year < 4;
      `);

      // Handle final year students
      let graduatedResult = { affectedRows: 0 };
      const [finalYearStudents] = await connection.query(`
        SELECT id FROM users WHERE role = 'student' AND year = 4 AND semester = 2;
      `);

      if (finalYearStudents.length > 0) {
        // Create a single class to hold all graduating students
        const [graduatedClassResult] = await connection.query(`
          INSERT INTO classes (year, semester, section, hod_id)
          VALUES (5, 1, 'GRADUATED', NULL);
        `);
        const graduatedClassId = graduatedClassResult.insertId;

        // Move final year students into the graduated class
        const [gradRes] = await connection.query(`
          UPDATE users
          SET year = 5,
              semester = 1,
              section = 'GRADUATED',
              graduation_year = YEAR(CURDATE())
          WHERE role = 'student' AND year = 4 AND semester = 2;
        `);
        graduatedResult = gradRes;

        // Rebuild student_classes for graduated students
        await connection.query(`
          DELETE sc
          FROM student_classes sc
          JOIN users u ON sc.student_id = u.id
          WHERE u.role = 'student' AND u.year = 5 AND u.semester = 1 AND u.section = 'GRADUATED';
        `);

        await connection.query(`
          INSERT INTO student_classes (class_id, student_id)
          SELECT ${graduatedClassId} AS class_id, u.id
          FROM users u
          WHERE u.role = 'student' AND u.year = 5 AND u.semester = 1 AND u.section = 'GRADUATED';
        `);

        // Remove old fourth-year semester 2 classes
        await connection.query(`
          DELETE FROM classes WHERE year = 4 AND semester = 2;
        `);
      }

      // Promote remaining students to next year, semester 1
      const [promotedResult] = await connection.query(`
        UPDATE users
        SET year = year + 1,
            semester = 1
        WHERE role = 'student' AND semester = 2;
      `);

      // Create new first year classes for next intake if not present
      await connection.query(`
        INSERT INTO classes (year, semester, section, department, hod_id)
        SELECT 1, 1, s.section, s.department, NULL
        FROM (
          SELECT DISTINCT section, COALESCE(department, 'ECE') AS department
          FROM classes
          WHERE section <> 'GRADUATED' AND year <= 4
        ) s
        WHERE NOT EXISTS (
          SELECT 1 FROM classes c2
          WHERE c2.year = 1 AND c2.semester = 1 AND c2.section = s.section
        );
      `);

      await connection.commit();

      res.json({
        message: 'Students promoted successfully',
        promoted: promotedResult.affectedRows,
        graduated: graduatedResult.affectedRows
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      console.error('Promotion transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Promote students error:', error);
    return res.status(500).json({ error: error.message });
  }
});

  // Initialize default classes (4 years, 5 sections, 2 semesters each)
  router.post('/initialize', authenticateToken, async (req, res, next) => {
    try {
      const classes = [];

      // Create classes for years 1-4, sections A-E, semesters 1 and 2
      for (let year = 1; year <= 4; year++) {
        for (let sectionIndex = 0; sectionIndex < 5; sectionIndex++) {
          const section = String.fromCharCode(65 + sectionIndex); // A, B, C, D, E

          for (let semester = 1; semester <= 2; semester++) {
            // Check if class already exists
            const [existingResult] = await executeQuery(
              'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
              [year, semester, section]
            );

            if (existingResult.length === 0) {
              const [insertResult] = await executeQuery(
                'INSERT INTO classes (year, semester, section) VALUES (?, ?, ?)',
                [year, semester, section]
              );

              classes.push({
                id: insertResult.insertId,
                year,
                semester,
                section,
                totalStrength: 0
              });
            }
          }
        }
      }

      res.json({
        message: 'Default classes initialized successfully',
        createdClasses: classes.length
      });
    } catch (error) {
      console.error('Initialize classes error:', error);
      next(error);
    }
  });

module.exports = router;
