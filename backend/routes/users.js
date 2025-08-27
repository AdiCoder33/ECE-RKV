const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery, connectDB, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { resolveProfileImage } = require('../utils/images');
const sanitizePhone = require('../utils/phone');
const router = express.Router();

// Get all users or search users
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { role, search, limit, year, section } = req.query;

    // If search query is provided, return basic user info matching the search
    if (search) {
      let query =
        'SELECT id, name, role, designation, profile_image AS profileImage FROM users';
      const params = [];
      const conditions = ['id <> ?'];
      params.push(req.user.id);

      conditions.push('name LIKE ?');
      params.push(`%${search}%`);

      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }
      if (year) {
        conditions.push('year = ?');
        params.push(Number(year));
      }
      if (section) {
        conditions.push('section = ?');
        params.push(section);
      }

      query += ` WHERE ${conditions.join(' AND ')} ORDER BY name ASC`;

      if (limit) {
        query += ' OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY';
        params.push(Number(limit));
      }

      const result = await executeQuery(query, params);
      const records = result.recordset || [];
      const formatted = await Promise.all(
        records.map(async ({ id, name, role, designation, profileImage }) => ({
          id,
          name,
          role,
          designation,
          profileImage: await resolveProfileImage(profileImage),
        }))
      );
      return res.json(formatted);
    }

    // Default behaviour: return full user records
    let query =
      'SELECT id, name, email, role, department, year, semester, section, roll_number, phone, designation, profile_image, created_at FROM users';
    const params = [];
    const conditions = [];
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (year) {
      conditions.push('year = ?');
      params.push(Number(year));
    }
    if (section) {
      conditions.push('section = ?');
      params.push(section);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY created_at DESC';
    if (limit) {
      query += ' OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY';
      params.push(Number(limit));
    }
    const result = await executeQuery(query, params);
    const records = result.recordset || [];
    const formatted = await Promise.all(
      records.map(async ({ profile_image, ...rest }) => ({
        ...rest,
        profileImage: await resolveProfileImage(profile_image),
      }))
    );
    res.json(formatted);
  } catch (error) {
    console.error('Users fetch error:', error);
    next(error);
  }
});

// Create user
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      year,
      semester,
      section,
      rollNumber,
      designation,
    } = req.body;
    const phone = sanitizePhone(req.body.phone);
    const sem = semester === undefined ? undefined : Number(semester);

    if (role === 'student') {
      if (
        year === undefined ||
        sem === undefined ||
        section === undefined ||
        rollNumber === undefined
      ) {
        return res
          .status(400)
          .json({ error: 'year, semester, section, and rollNumber are required for students' });
      }
      if (![1, 2].includes(sem)) {
        return res.status(400).json({ error: 'Semester must be 1 or 2' });
      }
    } else if (['professor', 'hod'].includes(role) && !designation) {
      return res.status(400).json({ error: 'Designation is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await executeQuery(
      'INSERT INTO users (name, email, password, role, department, year, semester, section, roll_number, phone, designation) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.department, INSERTED.year, INSERTED.semester, INSERTED.section, INSERTED.roll_number, INSERTED.phone, INSERTED.designation, INSERTED.created_at VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        designation === undefined ? null : designation,
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
      designation: created.designation,
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
  const batchSize = 50;

  for (let start = 0; start < users.length; start += batchSize) {
    const batch = users.slice(start, start + batchSize);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      for (let j = 0; j < batch.length; j++) {
        const i = start + j;
        const u = batch[j];
        const year = Number(u.year);
        const sem = Number(u.semester);
        const section = typeof u.section === 'string' ? u.section.trim() : u.section;
        const rollNumber = typeof u.rollNumber === 'string' ? u.rollNumber.trim() : u.rollNumber;
        const phone = sanitizePhone(u.phone);
        const designation =
          typeof u.designation === 'string' ? u.designation.trim() : u.designation;
        const errs = [];
        if (!allowedRoles.includes(u.role)) {
          errs.push('invalid role');
        }
        if (!phone) {
          errs.push('phone is required');
        }
        if (u.role === 'student') {
          if (!Number.isInteger(year) || year <= 0) {
            errs.push('year must be a positive integer');
          }
          if (!Number.isInteger(sem) || sem <= 0) {
            errs.push('semester must be a positive integer');
          }
          if (Number.isInteger(sem) && sem !== 1 && sem !== 2) {
            errs.push('semester must be 1 or 2');
          }
          if (!section) {
            errs.push('section is required');
          }
          if (!rollNumber) {
            errs.push('rollNumber is required');
          }
        } else if (['professor', 'hod'].includes(u.role) && !designation) {
          errs.push('designation is required');
        }
        if (errs.length) {
          results.push({ index: i, error: errs.join(', ') });
          continue;
        }
        const savepoint = `sp${i}`;
        const saveReq = new sql.Request(transaction);
        saveReq.requestTimeout = 600000;
        await saveReq.query(`SAVE TRANSACTION ${savepoint}`);
        try {
          const existingReq = new sql.Request(transaction);
          existingReq.requestTimeout = 600000;
          const existing = await existingReq
            .input('email', u.email)
            .input('rollNumber', rollNumber)
            .input('section', section)
            .input('year', year)
            .query(
              'SELECT id, name, role, department, year, semester, section, roll_number, phone, password, designation FROM users WHERE email = @email OR (roll_number = @rollNumber AND section = @section AND year = @year)'
            );

          let userId;
          if (existing.recordset.length) {
            const ex = existing.recordset[0];
            const req = new sql.Request(transaction);
            req.requestTimeout = 600000;
            req.input('email', u.email);
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
            const yr = Number.isNaN(year) ? null : year;
            if (ex.year !== yr) {
              updates.push('year = @year');
              req.input('year', yr);
            }
            const sm = Number.isNaN(sem) ? null : sem;
            if (ex.semester !== sm) {
              updates.push('semester = @semester');
              req.input('semester', sm);
            }
            const sec = section === undefined ? null : section;
            if (ex.section !== sec) {
              updates.push('section = @section');
              req.input('section', sec);
            }
            const roll = rollNumber === undefined ? null : rollNumber;
            if (ex.roll_number !== roll) {
              updates.push('roll_number = @rollNumber');
              req.input('rollNumber', roll);
            }
            const ph = phone === undefined ? null : phone;
            if (ex.phone !== ph) {
              updates.push('phone = @phone');
              req.input('phone', ph);
            }
            const des = designation === undefined ? null : designation;
            if (ex.designation !== des) {
              updates.push('designation = @designation');
              req.input('designation', des);
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
            request.requestTimeout = 600000;
            const result = await request
              .input('name', u.name)
              .input('email', u.email)
              .input('password', hashedPassword)
              .input('role', u.role)
              .input('department', u.department === undefined ? null : u.department)
              .input('year', Number.isNaN(year) ? null : year)
              .input('semester', Number.isNaN(sem) ? null : sem)
              .input('section', section)
              .input('rollNumber', rollNumber)
              .input('phone', phone)
              .input('designation', designation === undefined ? null : designation)
              .query(
                'INSERT INTO users (name, email, password, role, department, year, semester, section, roll_number, phone, designation) VALUES (@name, @email, @password, @role, @department, @year, @semester, @section, @rollNumber, @phone, @designation); SELECT SCOPE_IDENTITY() AS id;'
              );
            const insertedId = result.recordset[0].id;
            results.push({ index: i, id: insertedId, action: 'inserted' });
            userId = insertedId;
          }

          if (u.role === 'student') {
            const classReq = new sql.Request(transaction);
            classReq.requestTimeout = 600000;
            const classRes = await classReq
              .input('year', year)
              .input('semester', sem)
              .input('section', section)
              .query('SELECT id FROM classes WHERE year = @year AND semester = @semester AND section = @section');
            if (classRes.recordset.length) {
              const classId = classRes.recordset[0].id;
              const linkReq = new sql.Request(transaction);
              linkReq.requestTimeout = 600000;
              await linkReq
                .input('classId', classId)
                .input('studentId', userId)
                .query(
                  'IF NOT EXISTS (SELECT 1 FROM student_classes WHERE class_id = @classId AND student_id = @studentId) INSERT INTO student_classes (class_id, student_id) VALUES (@classId, @studentId)'
                );
            }
          }
        } catch (err) {
          const rollbackReq = new sql.Request(transaction);
          rollbackReq.requestTimeout = 600000;
          await rollbackReq.query(`ROLLBACK TRANSACTION ${savepoint}`);
          results.push({ index: i, error: err.message });
        }
      }
      await transaction.commit();
    } catch (error) {
      if (transaction._state === 'started') {
        await transaction.rollback();
      }
      for (let j = 0; j < batch.length; j++) {
        const index = start + j;
        if (!results.some((r) => r.index === index)) {
          results.push({ index, error: error.message });
        }
      }
    }
  }
  res.status(201).json({ results });
});

// Update user
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      department,
      year,
      semester,
      section,
      rollNumber,
      designation,
    } = req.body;
    const sem = semester === undefined ? undefined : Number(semester);
    if (role === 'student') {
      if (
        year === undefined ||
        sem === undefined ||
        section === undefined ||
        rollNumber === undefined
      ) {
        return res
          .status(400)
          .json({ error: 'year, semester, section, and rollNumber are required for students' });
      }
      if (![1, 2].includes(sem)) {
        return res.status(400).json({ error: 'Semester must be 1 or 2' });
      }
    } else if (['professor', 'hod'].includes(role) && !designation) {
      return res.status(400).json({ error: 'Designation is required' });
    }
    const prevRes = await executeQuery(
      'SELECT role, year, semester, section FROM users WHERE id = ?',
      [id]
    );
    const prev = prevRes.recordset[0];

    const result = await executeQuery(
      'UPDATE users SET name = ?, email = ?, role = ?, department = ?, year = ?, semester = ?, section = ?, roll_number = ?, designation = ? OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.department, INSERTED.year, INSERTED.semester, INSERTED.section, INSERTED.roll_number, INSERTED.phone, INSERTED.designation, INSERTED.created_at WHERE id = ?',
      [
        name,
        email,
        role,
        department === undefined ? null : department,
        year === undefined ? null : year,
        sem === undefined ? null : sem,
        section === undefined ? null : section,
        rollNumber === undefined ? null : rollNumber,
        designation === undefined ? null : designation,
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
      designation: updated.designation,
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
