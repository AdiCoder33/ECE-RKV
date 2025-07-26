const express = require('express');
const { executeQuery } = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all students with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { classId, year, section } = req.query;
    
    let query = `
      SELECT 
        u.*,
        c.year as class_year,
        c.section as class_section,
        AVG(CAST(a.status AS int)) * 100 as attendance_percentage,
        ar.cgpa
      FROM users u
      LEFT JOIN student_classes sc ON u.id = sc.student_id
      LEFT JOIN classes c ON sc.class_id = c.id
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE u.role = ?
    `;
    
    const params = ['student'];
    
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
    
    query += ' GROUP BY u.id, u.name, u.email, u.role, u.department, u.year, u.section, u.roll_number, u.phone, u.date_of_birth, u.address, u.parent_contact, u.blood_group, u.admission_year, u.profile_image, c.year, c.section, ar.cgpa ORDER BY u.year, u.section, u.roll_number';
    
    const result = await executeQuery(query, params);
    const students = result.recordset || [];
    
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

// Get student's subjects
router.get('/:studentId/subjects', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await executeQuery(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.credits,
        s.type,
        ISNULL(AVG(m.marks), 0) as marks,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as attended_classes
      FROM subjects s
      LEFT JOIN marks m ON s.id = m.subject_id AND m.student_id = ?
      LEFT JOIN attendance a ON a.student_id = ? AND a.subject_id = s.id
      INNER JOIN users u ON u.id = ? AND s.year = u.year
      GROUP BY s.id, s.name, s.code, s.credits, s.type
    `, [studentId, studentId, studentId]);
    
    const subjects = result.recordset || [];
    const formattedSubjects = subjects.map(subject => ({
      id: subject.id.toString(),
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      type: subject.type,
      marks: Math.round(subject.marks || 0),
      attendance: subject.total_classes > 0 ? Math.round((subject.attended_classes / subject.total_classes) * 100) : 0
    }));
    
    res.json(formattedSubjects);
  } catch (error) {
    console.error('Get student subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get classmates
router.get('/classmates', auth, async (req, res) => {
  try {
    const { year, section } = req.query;
    
    if (!year || !section) {
      return res.status(400).json({ error: 'Year and section are required' });
    }
    
    const result = await executeQuery(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.roll_number,
        u.phone,
        u.profile_image,
        AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as attendance_percentage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.student_id
      WHERE u.role = ? AND u.year = ? AND u.section = ?
      GROUP BY u.id, u.name, u.email, u.roll_number, u.phone, u.profile_image
      ORDER BY u.roll_number
    `, ['student', year, section]);
    
    const classmates = result.recordset || [];
    res.json(classmates.map(student => ({
      id: student.id.toString(),
      name: student.name,
      email: student.email,
      rollNumber: student.roll_number,
      phone: student.phone,
      profileImage: student.profile_image,
      attendancePercentage: Math.round(student.attendance_percentage || 0)
    })));
  } catch (error) {
    console.error('Get classmates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alumni
router.get('/alumni', auth, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, email, department, graduation_year, phone, linkedin_profile, current_company, current_position FROM users WHERE role = ? ORDER BY graduation_year DESC',
      ['alumni']
    );
    
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;