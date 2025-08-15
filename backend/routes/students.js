const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all students with filtering
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { classId, year, semester, section, subjectId } = req.query;

    let filterYear = year;
    let filterSemester = semester;

    if (subjectId && (!filterYear || !filterSemester)) {
      const subjectRes = await executeQuery(
        'SELECT year, semester FROM subjects WHERE id = ?',
        [subjectId]
      );
      const subj = subjectRes.recordset[0];
      if (subj) {
        if (!filterYear) filterYear = subj.year;
        if (!filterSemester) filterSemester = subj.semester;
      }
    }

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.department,
        u.year,
        u.semester,
        u.section,
        u.roll_number,
        u.phone,
        u.date_of_birth,
        u.address,
        u.parent_contact,
        u.blood_group,
        u.admission_year,
        u.profile_image,
        c.year as class_year,
        c.semester as class_semester,
        c.section as class_section,
        AVG(CAST(a.present AS float)) * 100 as attendance_percentage,
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

    if (filterYear) {
      query += ' AND u.year = ?';
      params.push(filterYear);
    }

    if (filterSemester) {
      query += ' AND u.semester = ?';
      params.push(filterSemester);
    }

    if (section) {
      query += ' AND u.section = ?';
      params.push(section);
    }

    query += ` GROUP BY
      u.id,
      u.name,
      u.email,
      u.role,
      u.department,
      u.year,
      u.semester,
      u.section,
      u.roll_number,
      u.phone,
      u.date_of_birth,
      u.address,
      u.parent_contact,
      u.blood_group,
      u.admission_year,
      u.profile_image,
      c.year,
      c.semester,
      c.section,
      ar.cgpa
      ORDER BY u.year, u.semester, u.section, u.roll_number`;

    const result = await executeQuery(query, params);
    const students = result.recordset || [];

    res.json(
      students.map(student => ({
        id: student.id.toString(),
        name: student.name,
        email: student.email,
        roll_number: student.roll_number,
        rollNumber: student.roll_number,
        role: student.role,
        department: student.department,
        year: student.year,
        semester: student.semester,
        section: student.section,
        phone: student.phone,
        dateOfBirth: student.date_of_birth,
        address: student.address,
        parentContact: student.parent_contact,
        bloodGroup: student.blood_group,
        admissionYear: student.admission_year,
        profileImage: student.profile_image,
        attendancePercentage: Math.round(student.attendance_percentage || 0),
        cgpa: student.cgpa || 0,
      }))
    );
  } catch (error) {
    console.error('Students fetch error:', error);
    next(error);
  }
});

// Get a single student by ID
router.get('/:id(\\d+)', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT u.*,
             ISNULL(att.attendance_percentage, 0) AS attendance_percentage,
             ar.cgpa
      FROM users u
      LEFT JOIN (
        SELECT student_id, AVG(CAST(present AS float)) * 100 AS attendance_percentage
        FROM attendance
        GROUP BY student_id
      ) att ON u.id = att.student_id
      LEFT JOIN academic_records ar ON u.id = ar.student_id AND ar.year = u.year
      WHERE u.id = ? AND u.role = 'student'
    `;

    const result = await executeQuery(query, [id]);
    const student = result.recordset[0];

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      id: student.id.toString(),
      name: student.name,
      email: student.email,
      rollNumber: student.roll_number,
      phone: student.phone,
      year: student.year,
      semester: student.semester,
      section: student.section,
      profileImage: student.profile_image,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      parentContact: student.parent_contact,
      bloodGroup: student.blood_group,
      admissionYear: student.admission_year,
      attendancePercentage: Math.round(student.attendance_percentage || 0),
      cgpa: student.cgpa || 0,
    });
  } catch (error) {
    console.error('Student fetch error:', error);
    next(error);
  }
});

router.put('/:id(\\d+)/profile', authenticateToken, async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      phone,
      profileImage,
      name,
      email,
      dateOfBirth,
      address,
      bloodGroup,
      rollNumber,
      year,
      semester,
      section,
    } = req.body;

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
    if (dateOfBirth !== undefined) {
      fields.push('date_of_birth = ?');
      params.push(dateOfBirth);
    }
    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }
    if (bloodGroup !== undefined) {
      fields.push('blood_group = ?');
      params.push(bloodGroup);
    }
    if (rollNumber !== undefined) {
      fields.push('roll_number = ?');
      params.push(rollNumber);
    }
    if (year !== undefined) {
      fields.push('year = ?');
      params.push(year);
    }
    if (semester !== undefined) {
      fields.push('semester = ?');
      params.push(semester);
    }
    if (section !== undefined) {
      fields.push('section = ?');
      params.push(section);
    }
    if (!fields.length)
      return res.status(400).json({ error: 'No fields to update' });
    params.push(studentId);
    await executeQuery(
      `UPDATE users SET ${fields.join(', ')}, updated_at = GETDATE() WHERE id = ? AND role = 'student'`,
      params
    );
    const { recordset } = await executeQuery(
      `SELECT id,name,email,phone,profile_image,date_of_birth,address,blood_group,roll_number,year,semester,section
       FROM users WHERE id = ? AND role = 'student'`,
      [studentId]
    );
    const s = recordset[0];
    res.json({
      id: s.id.toString(),
      name: s.name,
      email: s.email,
      phone: s.phone,
      profileImage: s.profile_image,
      dateOfBirth: s.date_of_birth,
      address: s.address,
      bloodGroup: s.blood_group,
      rollNumber: s.roll_number,
      year: s.year,
      semester: s.semester,
      section: s.section,
    });
  } catch (error) {
    console.error('Student profile update error:', error);
    next(error);
  }
});

router.get('/:id(\\d+)/profile', authenticateToken, async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { recordset } = await executeQuery(
      `SELECT id,name,email,phone,profile_image,date_of_birth,address,blood_group,roll_number,year,semester,section
       FROM users WHERE id = ? AND role = 'student'`,
      [studentId]
    );
    const s = recordset[0];
    if (!s) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({
      id: s.id.toString(),
      name: s.name,
      email: s.email,
      phone: s.phone,
      profileImage: s.profile_image,
      dateOfBirth: s.date_of_birth,
      address: s.address,
      bloodGroup: s.blood_group,
      rollNumber: s.roll_number,
      year: s.year,
      semester: s.semester,
      section: s.section,
    });
  } catch (error) {
    console.error('Student profile fetch error:', error);
    next(error);
  }
});

// Get student's subjects
router.get('/:studentId(\\d+)/subjects', authenticateToken, async (req, res, next) => {
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
        SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as attended_classes
      FROM subjects s
      INNER JOIN users u ON s.year = u.year AND s.semester = u.semester
      LEFT JOIN marks m ON s.id = m.subject_id AND m.student_id = u.id
      LEFT JOIN attendance a ON a.student_id = u.id AND a.subject_id = s.id
      WHERE u.id = ?
      GROUP BY s.id, s.name, s.code, s.credits, s.type
    `, [studentId]);
    
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
    console.error('Student subjects fetch error:', error);
    next(error);
  }
});

// Get classmates
router.get('/classmates', authenticateToken, async (req, res, next) => {
  try {
    const { year, semester, section } = req.query;

    if (!year || !semester || !section) {
      return res.status(400).json({ error: 'Year, semester, and section are required' });
    }

    const result = await executeQuery(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.roll_number,
        u.phone,
        u.profile_image,
        AVG(CASE WHEN a.present = 1 THEN 1.0 ELSE 0.0 END) * 100 as attendance_percentage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.student_id
      WHERE u.role = ? AND u.year = ? AND u.semester = ? AND u.section = ?
      GROUP BY u.id, u.name, u.email, u.roll_number, u.phone, u.profile_image
      ORDER BY u.roll_number
    `, ['student', year, semester, section]);
    
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
    console.error('Classmates fetch error:', error);
    next(error);
  }
});

// Get alumni
router.get('/alumni', authenticateToken, async (req, res, next) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, email, department, graduation_year, phone, linkedin_profile, current_company, current_position FROM users WHERE role = ? ORDER BY graduation_year DESC',
      ['alumni']
    );
    
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Alumni fetch error:', error);
    next(error);
  }
});

module.exports = router;
