const express = require('express');
const { executeQuery, connectDB, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all classes with student counts
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT c.id, c.year, c.semester, c.section, c.hod_id,
             h.name AS hod_name,
             ISNULL(s.total_strength, 0) AS total_strength
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
    
    const result = await executeQuery(query);
    const classes = result.recordset || [];
    
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

    const result = await executeQuery(query);
    const summary = result.recordset || [];

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

// Create new class
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester, section, hodId } = req.body;

    if (!year || !semester || !section) {
      return res.status(400).json({ error: 'Year, semester, and section are required' });
    }

    const sem = Number(semester);
    if (![1, 2].includes(sem)) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    // Check if class already exists
    const existingResult = await executeQuery(
      'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
      [year, sem, section]
    );

    if (existingResult.recordset.length > 0) {
      return res.status(400).json({ error: 'Class already exists' });
    }

    const insertResult = await executeQuery(
      'INSERT INTO classes (year, semester, section, hod_id) OUTPUT INSERTED.id VALUES (?, ?, ?, ?)',
      [year, sem, section, hodId || null]
    );

    const newId = insertResult.recordset[0].id;

    // Link existing students of the same year, semester, and section to this class
    await executeQuery(
      "INSERT INTO student_classes (class_id, student_id) SELECT ?, id FROM users WHERE role='student' AND year=? AND semester=? AND section=?",
      [newId, year, sem, section]
    );

    // Fetch the created class
    const createdResult = await executeQuery(
      `
      SELECT c.id, c.year, c.semester, c.section, c.hod_id,
             h.name AS hod_name,
             ISNULL(s.total_strength, 0) AS total_strength
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

    const newClass = createdResult.recordset[0];

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
             ISNULL(s.total_strength, 0) AS total_strength
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

    const result = await executeQuery(query, [classId]);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const cls = result.recordset[0];

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
    
    const query = `
      SELECT u.*, sc.enrollment_date,
             ISNULL(att.attendance_percentage, 0) AS attendance_percentage,
             ar.cgpa
      FROM users u
      JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN (
        SELECT student_id, AVG(CAST(present AS float)) * 100 AS attendance_percentage
        FROM attendance
        GROUP BY student_id
      ) att ON u.id = att.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE sc.class_id = ? AND u.role = 'student'
      ORDER BY u.roll_number
    `;
    
    const result = await executeQuery(query, [classId]);
    const students = result.recordset || [];

    res.json(students.map(student => ({
      id: student.id.toString(),
      name: student.name,
      email: student.email,
      rollNumber: student.roll_number,
      phone: student.phone,
      department: student.department,
      year: student.year,
      section: student.section,
      profileImage: student.profile_image,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      parentContact: student.parent_contact,
      bloodGroup: student.blood_group,
      admissionYear: student.admission_year,
      attendancePercentage: Math.round(student.attendance_percentage || 0),
      cgpa: student.cgpa || 0
    })));
  } catch (error) {
    console.error('Class students fetch error:', error);
    next(error);
  }
});

// Update class
router.put('/:classId', authenticateToken, async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { year, semester, section, hodId } = req.body;

    const sem = Number(semester);
    if (![1, 2].includes(sem)) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const result = await executeQuery(
      'UPDATE classes SET year = ?, semester = ?, section = ?, hod_id = ? WHERE id = ?',
      [year, sem, section, hodId, classId]
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Update class error:', error);
    next(error);
  }
});

// Delete class
router.delete('/:classId', authenticateToken, async (req, res, next) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists and has no students
    const studentsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM student_classes WHERE class_id = ?',
      [classId]
    );

    if (studentsResult.recordset[0].count > 0) {
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
router.post('/promote', authenticateToken, async (req, res, next) => {
  try {
    const semester = parseInt(req.body.currentSemester, 10);
    if (![1, 2].includes(semester)) {
      return res.status(400).json({ error: 'currentSemester must be 1 or 2' });
    }

    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Convert any existing fifth-year students to alumni before promotion
      await new sql.Request(transaction).query(`
        UPDATE users
        SET role = 'alumni',
            year = NULL,
            semester = NULL,
            section = NULL
        WHERE role = 'student' AND year = 5;
      `);

      await new sql.Request(transaction).query(`
        DELETE sc
        FROM student_classes sc
        JOIN users u ON sc.student_id = u.id
        WHERE u.role = 'alumni';
      `);

      if (semester === 1) {
        // Move all semester 1 classes and students to semester 2
        await new sql.Request(transaction).query(`
          UPDATE classes
          SET semester = 2
          WHERE semester = 1;
        `);

        const promotedResult = await new sql.Request(transaction).query(`
          UPDATE users
          SET semester = 2
          WHERE role = 'student' AND semester = 1;
        `);

        await transaction.commit();

        return res.json({
          message: 'Students moved to semester 2',
          promoted: promotedResult.rowsAffected[0],
          graduated: 0
        });
      }

      // Move final year semester 2 classes to graduated year 5 semester 1
      await new sql.Request(transaction).query(`
        UPDATE classes
        SET year = 5,
            semester = 1
        WHERE year = 4 AND semester = 2;
      `);

      // Move remaining semester 2 classes to next year semester 1
      await new sql.Request(transaction).query(`
        UPDATE classes
        SET year = year + 1,
            semester = 1
        WHERE semester = 2;
      `);

      // Mark final year students as graduated but keep as students
      const graduatedResult = await new sql.Request(transaction).query(`
        UPDATE users
        SET year = 5,
            semester = 1,
            graduation_year = YEAR(GETDATE())
        WHERE role = 'student' AND year = 4 AND semester = 2;
      `);

      // Promote remaining students to next year, semester 1
      const promotedResult = await new sql.Request(transaction).query(`
        UPDATE users
        SET year = year + 1,
            semester = 1
        WHERE role = 'student' AND semester = 2;
      `);

      // Create new first year classes for next intake if not present
      await new sql.Request(transaction).query(`
        INSERT INTO classes (year, semester, section, hod_id)
        SELECT 1, 1, s.section, NULL
        FROM (SELECT DISTINCT section FROM classes) s
        WHERE NOT EXISTS (
          SELECT 1 FROM classes c2
          WHERE c2.year = 1 AND c2.semester = 1 AND c2.section = s.section
        );
      `);

      await transaction.commit();

      res.json({
        message: 'Students promoted successfully',
        promoted: promotedResult.rowsAffected[0],
        graduated: graduatedResult.rowsAffected[0]
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      console.error('Promotion transaction error:', error);
      throw error;
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
            const existingResult = await executeQuery(
              'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
              [year, semester, section]
            );

            if (existingResult.recordset.length === 0) {
              const insertResult = await executeQuery(
                'INSERT INTO classes (year, semester, section) OUTPUT INSERTED.id VALUES (?, ?, ?)',
                [year, semester, section]
              );

              classes.push({
                id: insertResult.recordset[0].id,
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
