const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery, connectDB, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name FROM users';
    const params = [];
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';
    const result = await executeQuery(query, params);
    res.json(result.recordset || []);
  } catch (error) {
    console.error('Users fetch error:', error);
    next(error);
  }
});

// Create user
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, email, password, role, department, year, semester, section, rollNumber, phone } = req.body;
    const sem = semester === undefined ? undefined : Number(semester);

    if (role === 'student' && ![1, 2].includes(sem)) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await executeQuery(
      'INSERT INTO users (name, email, password, role, department, year, semester, section, roll_number, phone) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.department, INSERTED.year, INSERTED.semester, INSERTED.section, INSERTED.roll_number, INSERTED.phone, INSERTED.created_at VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        email,
        hashedPassword,
        role,
        department === undefined ? null : department,
        year === undefined ? null : year,
        sem === undefined ? null : sem,
        section === undefined ? null : section,
        rollNumber === undefined ? null : rollNumber,
        phone === undefined ? null : phone,
      ]
    );

    const created = result.recordset[0];

    // Link student to class if applicable
    if (role === 'student' && year !== undefined && sem !== undefined && section !== undefined) {
      const classRes = await executeQuery(
        'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
        [year, sem, section]
      );
      if (classRes.recordset.length > 0) {
        const classId = classRes.recordset[0].id;
        await executeQuery(
          'IF NOT EXISTS (SELECT 1 FROM student_classes WHERE class_id = ? AND student_id = ?) INSERT INTO student_classes (class_id, student_id) VALUES (?, ?)',
          [classId, created.id, classId, created.id]
        );
      }
    }

    res.status(201).json({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      department: created.department,
      year: created.year,
      semester: created.semester,
      section: created.section,
      rollNumber: created.roll_number,
      phone: created.phone,
      createdAt: created.created_at,
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      error.status = 400;
    }
    next(error);
  }
});

/**
 * Bulk create users.
 * Expects payload: { users: [{ name, email, password, role, department?, year?, semester?, section?, rollNumber?, phone? }] }
 * Returns array with created record IDs or per-row error messages.
 */
router.post('/bulk', authenticateToken, async (req, res, next) => {
  const users = req.body?.users;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Users array is required' });
  }
  const results = [];
  const allowedRoles = ['admin', 'hod', 'professor', 'student', 'alumni'];
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const errs = [];
      if (!Number.isInteger(u.year) || u.year <= 0) {
        errs.push('year must be a positive integer');
      }
      if (!Number.isInteger(u.semester) || u.semester <= 0) {
        errs.push('semester must be a positive integer');
      }
      if (u.role === 'student' && u.semester !== undefined && u.semester !== 1 && u.semester !== 2) {
        errs.push('semester must be 1 or 2');
      }
      if (!u.section || !u.section.trim()) {
        errs.push('section is required');
      }
      if (!u.rollNumber || !u.rollNumber.trim()) {
        errs.push('rollNumber is required');
      }
      if (!u.phone || !u.phone.trim()) {
        errs.push('phone is required');
      }
      if (!allowedRoles.includes(u.role)) {
        errs.push('invalid role');
      }
      if (errs.length) {
        results.push({ index: i, error: errs.join(', ') });
        continue;
      }
      const savepoint = `sp${i}`;
      await new sql.Request(transaction).query(`SAVE TRANSACTION ${savepoint}`);
      try {
        const existing = await new sql.Request(transaction)
          .input('email', u.email)
          .query(
            'SELECT id, name, role, department, year, semester, section, roll_number, phone, password FROM users WHERE email = @email'
          );

        let userId;
        if (existing.recordset.length) {
          const ex = existing.recordset[0];
          const req = new sql.Request(transaction).input('email', u.email);
          const updates = [];
          if (ex.name !== u.name) {
            updates.push('name = @name');
            req.input('name', u.name);
          }
          if (ex.role !== u.role) {
            updates.push('role = @role');
            req.input('role', u.role);
          }
          const dept = u.department === undefined ? null : u.department;
          if (ex.department !== dept) {
            updates.push('department = @department');
            req.input('department', dept);
          }
          const yr = u.year === undefined ? null : u.year;
          if (ex.year !== yr) {
            updates.push('year = @year');
            req.input('year', yr);
          }
          const sem = u.semester === undefined ? null : u.semester;
          if (ex.semester !== sem) {
            updates.push('semester = @semester');
            req.input('semester', sem);
          }
          const sec = u.section === undefined ? null : u.section;
          if (ex.section !== sec) {
            updates.push('section = @section');
            req.input('section', sec);
          }
          const roll = u.rollNumber === undefined ? null : u.rollNumber;
          if (ex.roll_number !== roll) {
            updates.push('roll_number = @rollNumber');
            req.input('rollNumber', roll);
          }
          const ph = u.phone === undefined ? null : u.phone;
          if (ex.phone !== ph) {
            updates.push('phone = @phone');
            req.input('phone', ph);
          }
          if (u.password) {
            const same = await bcrypt.compare(u.password, ex.password);
            if (!same) {
              const hashed = await bcrypt.hash(u.password, 10);
              updates.push('password = @password');
              req.input('password', hashed);
            }
          }
          if (updates.length) {
            await req.query(`UPDATE users SET ${updates.join(', ')} WHERE email = @email`);
          }
          results.push({ index: i, id: ex.id, action: 'updated' });
          userId = ex.id;
        } else {
          const hashedPassword = await bcrypt.hash(u.password, 10);
            const request = new sql.Request(transaction);
            const result = await request
              .input('name', u.name)
              .input('email', u.email)
              .input('password', hashedPassword)
              .input('role', u.role)
              .input('department', u.department === undefined ? null : u.department)
              .input('year', u.year === undefined ? null : u.year)
              .input('semester', u.semester === undefined ? null : u.semester)
              .input('section', u.section)
              .input('rollNumber', u.rollNumber)
              .input('phone', u.phone)
              .query(
              'INSERT INTO users (name, email, password, role, department, year, semester, section, roll_number, phone) VALUES (@name, @email, @password, @role, @department, @year, @semester, @section, @rollNumber, @phone); SELECT SCOPE_IDENTITY() AS id;'
              );
          const insertedId = result.recordset[0].id;
          results.push({ index: i, id: insertedId, action: 'inserted' });
          userId = insertedId;
        }

        if (u.role === 'student') {
          const classRes = await new sql.Request(transaction)
            .input('year', u.year)
            .input('semester', u.semester)
            .input('section', u.section)
            .query('SELECT id FROM classes WHERE year = @year AND semester = @semester AND section = @section');
          if (classRes.recordset.length) {
            const classId = classRes.recordset[0].id;
            await new sql.Request(transaction)
              .input('classId', classId)
              .input('studentId', userId)
              .query(
                'IF NOT EXISTS (SELECT 1 FROM student_classes WHERE class_id = @classId AND student_id = @studentId) INSERT INTO student_classes (class_id, student_id) VALUES (@classId, @studentId)'
              );
          }
        }
      } catch (err) {
        await transaction.rollback(savepoint);
        results.push({ index: i, error: err.message });
      }
    }
    await transaction.commit();
    res.status(201).json({ results });
  } catch (error) {
    if (transaction._state === 'started') {
      await transaction.rollback();
    }
    console.error('Bulk user creation error:', error);
    next(error);
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, year, semester, section, rollNumber } = req.body;
    const sem = semester === undefined ? undefined : Number(semester);
    if (role === 'student' && ![1, 2].includes(sem)) {
      return res.status(400).json({ error: 'Semester must be 1 or 2' });
    }
    const prevRes = await executeQuery(
      'SELECT role, year, semester, section FROM users WHERE id = ?',
      [id]
    );
    const prev = prevRes.recordset[0];

    const result = await executeQuery(
      'UPDATE users SET name = ?, email = ?, role = ?, department = ?, year = ?, semester = ?, section = ?, roll_number = ? OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.department, INSERTED.year, INSERTED.semester, INSERTED.section, INSERTED.roll_number, INSERTED.phone, INSERTED.created_at WHERE id = ?',
      [
        name,
        email,
        role,
        department === undefined ? null : department,
        year === undefined ? null : year,
        sem === undefined ? null : sem,
        section === undefined ? null : section,
        rollNumber === undefined ? null : rollNumber,
        id,
      ]
    );

    const updated = result.recordset[0];

    if (updated.role === 'student' && updated.year !== null && updated.semester !== null && updated.section !== null) {
      const classRes = await executeQuery(
        'SELECT id FROM classes WHERE year = ? AND semester = ? AND section = ?',
        [updated.year, updated.semester, updated.section]
      );
      if (classRes.recordset.length > 0) {
        const classId = classRes.recordset[0].id;
        await executeQuery(
          'IF EXISTS (SELECT 1 FROM student_classes WHERE student_id = ?) UPDATE student_classes SET class_id = ? WHERE student_id = ? ELSE INSERT INTO student_classes (class_id, student_id) VALUES (?, ?)',
          [id, classId, id, classId, id]
        );
      }
    }

    if (
      prev &&
      prev.role === 'student' &&
      (updated.role !== 'student' || updated.year === null || updated.semester === null || updated.section === null)
    ) {
      await executeQuery('DELETE FROM student_classes WHERE student_id = ?', [id]);
    }

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      year: updated.year,
      semester: updated.semester,
      section: updated.section,
      rollNumber: updated.roll_number,
      phone: updated.phone,
      createdAt: updated.created_at,
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM student_classes WHERE student_id = ?', [id]);
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
});

// Transfer HOD role
router.put('/:id/transfer-hod', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentHodId } = req.body;
    
    // Check if user exists and can be HOD
    const userResult = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)', 
      [id, 'professor', 'hod']
    );
    
    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot be assigned as HOD' });
    }
    
    // Update current HOD to professor if exists
    if (currentHodId) {
      await executeQuery(
        'UPDATE users SET role = ? WHERE id = ? AND role = ?',
        ['professor', currentHodId, 'hod']
      );
    }
    
    // Update new user to HOD
    await executeQuery(
      'UPDATE users SET role = ? WHERE id = ?',
      ['hod', id]
    );
    
    res.json({ message: 'HOD role transferred successfully' });
  } catch (error) {
    console.error('Transfer HOD role error:', error);
    next(error);
  }
});

module.exports = router;
