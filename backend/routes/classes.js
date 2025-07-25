const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all classes with student counts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        h.name as hod_name,
        COUNT(sc.student_id) as total_students
      FROM classes c
      LEFT JOIN users h ON c.hod_id = h.id
      LEFT JOIN student_classes sc ON c.id = sc.class_id
      GROUP BY c.id
      ORDER BY c.year, c.section
    `;
    
    const [classes] = await db.execute(query);
    
    res.json(classes.map(cls => ({
      id: cls.id.toString(),
      year: cls.year,
      semester: cls.semester,
      section: cls.section,
      hodId: cls.hod_id?.toString(),
      hodName: cls.hod_name,
      totalStrength: cls.total_students,
      subjects: [], // Will be populated separately if needed
      students: []  // Will be populated separately if needed
    })));
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new class
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { year, semester, section, hodId } = req.body;
    
    if (!year || !semester || !section) {
      return res.status(400).json({ error: 'Year, semester, and section are required' });
    }
    
    // Check if class already exists
    const [existing] = await db.execute(
      'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
      [year, semester, section]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Class already exists' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO classes (year, semester, section, hod_id) VALUES (?, ?, ?, ?)',
      [year, semester, section, hodId || null]
    );
    
    // Fetch the created class
    const [newClass] = await db.execute(`
      SELECT 
        c.*,
        h.name as hod_name,
        COUNT(sc.student_id) as total_students
      FROM classes c
      LEFT JOIN users h ON c.hod_id = h.id
      LEFT JOIN student_classes sc ON c.id = sc.class_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [result.insertId]);
    
    res.status(201).json({
      id: newClass[0].id.toString(),
      year: newClass[0].year,
      semester: newClass[0].semester,
      section: newClass[0].section,
      hodId: newClass[0].hod_id?.toString(),
      hodName: newClass[0].hod_name,
      totalStrength: newClass[0].total_students,
      subjects: [],
      students: []
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students in a specific class
router.get('/:classId/students', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    const query = `
      SELECT 
        u.*,
        sc.enrollment_date,
        AVG(a.present) * 100 as attendance_percentage,
        ar.cgpa
      FROM users u
      JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE sc.class_id = ? AND u.role = 'student'
      GROUP BY u.id
      ORDER BY u.roll_number
    `;
    
    const [students] = await db.execute(query, [classId]);
    
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
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { year, semester, section, hodId } = req.body;
    
    const [result] = await db.execute(
      'UPDATE classes SET year = ?, semester = ?, section = ?, hod_id = ? WHERE id = ?',
      [year, semester, section, hodId, classId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists and has no students
    const [students] = await db.execute(
      'SELECT COUNT(*) as count FROM student_classes WHERE class_id = ?',
      [classId]
    );
    
    if (students[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete class with enrolled students' });
    }
    
    await db.execute('DELETE FROM classes WHERE id = ?', [classId]);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Promote students to next year
router.post('/promote', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get all students in years 1-3
      const [studentsToPromote] = await connection.execute(`
        SELECT u.*, c.id as class_id, c.year, c.section
        FROM users u
        JOIN student_classes sc ON u.id = sc.student_id
        JOIN classes c ON sc.class_id = c.id
        WHERE u.role = 'student' AND u.year IN (1, 2, 3)
        ORDER BY u.year, u.section, u.roll_number
      `);
      
      // Get final year students (year 4) for graduation
      const [graduatingStudents] = await connection.execute(`
        SELECT u.*, c.id as class_id
        FROM users u
        JOIN student_classes sc ON u.id = sc.student_id
        JOIN classes c ON sc.class_id = c.id
        WHERE u.role = 'student' AND u.year = 4
      `);
      
      // Update students' years (promote 1->2, 2->3, 3->4)
      for (const student of studentsToPromote) {
        await connection.execute(
          'UPDATE users SET year = ? WHERE id = ?',
          [student.year + 1, student.id]
        );
      }
      
      // Graduate final year students (convert to alumni)
      for (const student of graduatingStudents) {
        await connection.execute(`
          UPDATE users 
          SET role = 'alumni', graduation_year = YEAR(CURDATE()), year = NULL, section = NULL 
          WHERE id = ?
        `, [student.id]);
        
        // Remove from student_classes
        await connection.execute(
          'DELETE FROM student_classes WHERE student_id = ?',
          [student.id]
        );
      }
      
      await connection.commit();
      
      res.json({
        message: 'Students promoted successfully',
        promoted: studentsToPromote.length,
        graduated: graduatingStudents.length
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Promote students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize default classes (4 years, 5 sections each)
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const classes = [];
    
    // Create classes for 4 years (1-4) and 5 sections (A-E)
    for (let year = 1; year <= 4; year++) {
      for (let sectionIndex = 0; sectionIndex < 5; sectionIndex++) {
        const section = String.fromCharCode(65 + sectionIndex); // A, B, C, D, E
        
        // Check if class already exists
        const [existing] = await db.execute(
          'SELECT id FROM classes WHERE year = ? AND section = ?',
          [year, section]
        );
        
        if (existing.length === 0) {
          const [result] = await db.execute(
            'INSERT INTO classes (year, semester, section) VALUES (?, ?, ?)',
            [year, year * 2 - 1, section] // Semester is calculated as year*2-1 for odd semester
          );
          
          classes.push({
            id: result.insertId,
            year,
            semester: year * 2 - 1,
            section,
            totalStrength: 0
          });
        }
      }
    }
    
    res.json({
      message: 'Default classes initialized successfully',
      createdClasses: classes.length
    });
  } catch (error) {
    console.error('Initialize classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;