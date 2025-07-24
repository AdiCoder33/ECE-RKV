const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { classId, year, section } = req.query;
    
    let query = `
      SELECT 
        u.*,
        c.year as class_year,
        c.section as class_section,
        AVG(a.present) * 100 as attendance_percentage,
        ar.cgpa
      FROM users u
      LEFT JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN classes c ON sc.class_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE u.role = 'student'
    `;
    
    const params = [];
    
    if (classId) {
      query += ' AND sc.class_id = ?';
      params.push(classId);
    }
    
    if (year) {
      query += ' AND u.year = ?';
      params.push(year);
    }
    
    if (section) {
      query += ' AND u.section = ?';
      params.push(section);
    }
    
    query += ' GROUP BY u.id ORDER BY u.year, u.section, u.roll_number';
    
    const [students] = await db.execute(query, params);
    
    res.json(students.map(student => ({
      id: student.id.toString(),
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      year: student.year,
      section: student.section,
      rollNumber: student.roll_number,
      phone: student.phone,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      parentContact: student.parent_contact,
      bloodGroup: student.blood_group,
      admissionYear: student.admission_year,
      profileImage: student.profile_image,
      attendancePercentage: Math.round(student.attendance_percentage || 0),
      cgpa: student.cgpa || 0
    })));
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name, email, password = 'password', department, year, section,
      rollNumber, phone, dateOfBirth, address, parentContact, bloodGroup, admissionYear
    } = req.body;
    
    if (!name || !email || !rollNumber || !year || !section) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    // Check if email or roll number already exists
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR roll_number = ?',
      [email, rollNumber]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email or roll number already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert student
      const [result] = await connection.execute(`
        INSERT INTO users (
          name, email, password, role, department, year, section, roll_number,
          phone, date_of_birth, address, parent_contact, blood_group, admission_year
        ) VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, email, hashedPassword, department, year, section, rollNumber,
        phone, dateOfBirth, address, parentContact, bloodGroup, admissionYear
      ]);
      
      const studentId = result.insertId;
      
      // Find the appropriate class
      const [classes] = await connection.execute(
        'SELECT id FROM classes WHERE year = ? AND section = ?',
        [year, section]
      );
      
      if (classes.length > 0) {
        // Enroll student in class
        await connection.execute(
          'INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)',
          [studentId, classes[0].id]
        );
      }
      
      await connection.commit();
      
      // Fetch the created student
      const [newStudent] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [studentId]
      );
      
      res.status(201).json({
        id: newStudent[0].id.toString(),
        name: newStudent[0].name,
        email: newStudent[0].email,
        role: newStudent[0].role,
        department: newStudent[0].department,
        year: newStudent[0].year,
        section: newStudent[0].section,
        rollNumber: newStudent[0].roll_number,
        phone: newStudent[0].phone,
        dateOfBirth: newStudent[0].date_of_birth,
        address: newStudent[0].address,
        parentContact: newStudent[0].parent_contact,
        bloodGroup: newStudent[0].blood_group,
        admissionYear: newStudent[0].admission_year,
        profileImage: newStudent[0].profile_image
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student
router.put('/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      name, email, department, year, section, rollNumber,
      phone, dateOfBirth, address, parentContact, bloodGroup
    } = req.body;
    
    // Check if student exists
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check for duplicate email or roll number (excluding current student)
    if (email || rollNumber) {
      const [duplicates] = await db.execute(
        'SELECT id FROM users WHERE (email = ? OR roll_number = ?) AND id != ?',
        [email || existing[0].email, rollNumber || existing[0].roll_number, studentId]
      );
      
      if (duplicates.length > 0) {
        return res.status(400).json({ error: 'Email or roll number already exists' });
      }
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update student details
      await connection.execute(`
        UPDATE users SET 
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          year = COALESCE(?, year),
          section = COALESCE(?, section),
          roll_number = COALESCE(?, roll_number),
          phone = COALESCE(?, phone),
          date_of_birth = COALESCE(?, date_of_birth),
          address = COALESCE(?, address),
          parent_contact = COALESCE(?, parent_contact),
          blood_group = COALESCE(?, blood_group),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name, email, department, year, section, rollNumber,
        phone, dateOfBirth, address, parentContact, bloodGroup, studentId
      ]);
      
      // Update class enrollment if year/section changed
      if (year && section) {
        // Remove from current class
        await connection.execute(
          'DELETE FROM student_classes WHERE student_id = ?',
          [studentId]
        );
        
        // Find new class
        const [newClass] = await connection.execute(
          'SELECT id FROM classes WHERE year = ? AND section = ?',
          [year, section]
        );
        
        if (newClass.length > 0) {
          // Enroll in new class
          await connection.execute(
            'INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)',
            [studentId, newClass[0].id]
          );
        }
      }
      
      await connection.commit();
      
      // Fetch updated student
      const [updatedStudent] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [studentId]
      );
      
      res.json({
        id: updatedStudent[0].id.toString(),
        name: updatedStudent[0].name,
        email: updatedStudent[0].email,
        role: updatedStudent[0].role,
        department: updatedStudent[0].department,
        year: updatedStudent[0].year,
        section: updatedStudent[0].section,
        rollNumber: updatedStudent[0].roll_number,
        phone: updatedStudent[0].phone,
        dateOfBirth: updatedStudent[0].date_of_birth,
        address: updatedStudent[0].address,
        parentContact: updatedStudent[0].parent_contact,
        bloodGroup: updatedStudent[0].blood_group,
        admissionYear: updatedStudent[0].admission_year,
        profileImage: updatedStudent[0].profile_image
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
router.delete('/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student exists
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Delete student (cascading deletes will handle related records)
    await db.execute('DELETE FROM users WHERE id = ?', [studentId]);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
router.get('/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const [students] = await db.execute(`
      SELECT 
        u.*,
        c.year as class_year,
        c.section as class_section,
        AVG(a.present) * 100 as attendance_percentage,
        ar.cgpa
      FROM users u
      LEFT JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN classes c ON sc.class_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE u.id = ? AND u.role = 'student'
      GROUP BY u.id
    `, [studentId]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    res.json({
      id: student.id.toString(),
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      year: student.year,
      section: student.section,
      rollNumber: student.roll_number,
      phone: student.phone,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      parentContact: student.parent_contact,
      bloodGroup: student.blood_group,
      admissionYear: student.admission_year,
      profileImage: student.profile_image,
      attendancePercentage: Math.round(student.attendance_percentage || 0),
      cgpa: student.cgpa || 0
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;