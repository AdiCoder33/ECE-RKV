const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendToUsers } = require('../services/pushService');
const router = express.Router();

async function shouldSendAttendanceReminder(userId) {
  try {
    const [rows] = await executeQuery(
      'SELECT attendance_reminders FROM user_settings WHERE user_id = ?',
      [userId]
    );
    if (!rows.length) return true;
    return rows[0].attendance_reminders !== 0;
  } catch (err) {
    return true;
  }
}

// Get attendance records
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      subjectId,
      date,
      studentId,
      classId,
      startDate,
      endDate,
      year,
      semester
    } = req.query;
    let query = `
      SELECT 
        a.*,
        u.name as student_name, 
        u.roll_number, 
        s.name as subject_name,
        s.code as subject_code,
        mb.name as marked_by_name
      FROM attendance a 
      LEFT JOIN users u ON a.student_id = u.id 
      LEFT JOIN subjects s ON a.subject_id = s.id 
      LEFT JOIN users mb ON a.marked_by = mb.id
      WHERE 1=1
    `;
    const params = [];
    
    if (subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(subjectId);
    }
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (studentId) {
      query += ' AND a.student_id = ? AND s.year = u.year AND s.semester = u.semester';
      params.push(studentId);
    }

    if (year) {
      query += ' AND s.year = ?';
      params.push(year);
    }

    if (semester) {
      query += ' AND s.semester = ?';
      params.push(semester);
    }
    
    if (classId) {
      query += ` AND a.student_id IN (
        SELECT sc.student_id FROM student_classes sc WHERE sc.class_id = ?
      )`;
      params.push(classId);
    }
    
    // Ensure roll numbers sort numerically rather than lexicographically
    query += ' ORDER BY a.date DESC, a.period, TRY_CAST(u.roll_number AS INT)';
    
    const [rows] = await executeQuery(query, params);
    
    res.json(rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      date: row.date,
      present: row.present,
      period: row.period,
      markedBy: row.marked_by,
      markedByName: row.marked_by_name,
      createdAt: row.created_at,
      extraClassId: row.extra_class_id
    })));
  } catch (error) {
    console.error('Attendance fetch error:', error);
    next(error);
  }
});

// Get attendance summary
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const { subjectId, classId, startDate, endDate } = req.query;
    
    let query = `
      SELECT
        u.id as student_id,
        u.name as student_name,
        u.roll_number,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as present_count,
        ROUND((SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.student_id
      LEFT JOIN extra_classes ec ON a.extra_class_id = ec.id
    `;
    
    const params = [];
    let whereConditions = ["u.role = 'student'"];
    
    if (subjectId) {
      whereConditions.push('a.subject_id = ?');
      params.push(subjectId);
    }
    
    if (classId) {
      whereConditions.push(`u.id IN (
        SELECT sc.student_id FROM student_classes sc WHERE sc.class_id = ?
      )`);
      params.push(classId);
    }
    
    if (startDate && endDate) {
      whereConditions.push('a.date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    query += ' WHERE ' + whereConditions.join(' AND ');
    // Group and order by numeric roll numbers for predictable sorting
    // Ensure all selected non-aggregated fields are included in the GROUP BY clause
    query += ' GROUP BY u.id, u.name, u.roll_number ORDER BY TRY_CAST(u.roll_number AS INT)';
    
    const [rows] = await executeQuery(query, params);
    
    res.json(rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      totalClasses: row.total_classes || 0,
      presentCount: row.present_count || 0,
      attendancePercentage: row.attendance_percentage || 0
    })));
  } catch (error) {
    console.error('Attendance summary error:', error);
    next(error);
  }
});

// Get attendance details for a student
router.get('/student/:id', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.params.id;
    let dateFilter = '';
    const params = [studentId];

    if (startDate && endDate) {
      dateFilter = ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Fetch individual records
    const recordsQuery = `
      SELECT
        a.id,
        a.subject_id,
        s.name as subject_name,
        a.date,
        a.present,
        a.period,
        a.marked_by,
        mb.name as marked_by_name,
        a.extra_class_id
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN users mb ON a.marked_by = mb.id
      WHERE a.student_id = ?${dateFilter} AND s.year = u.year AND s.semester = u.semester
      ORDER BY a.date DESC, a.period
    `;
    const [recordsRows] = await executeQuery(recordsQuery, params);
    const records = recordsRows.map(row => ({
      id: row.id,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      date: row.date,
      present: row.present,
      period: row.period,
      markedBy: row.marked_by,
      markedByName: row.marked_by_name,
      extraClassId: row.extra_class_id
    }));

    // Subject-wise statistics
    const subjectStatsQuery = `
      SELECT
        a.subject_id,
        s.name as subject_name,
        SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as attended,
        COUNT(*) as total,
        ROUND(
          (CAST(SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0)) * 100,
          2
        ) as percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN extra_classes ec ON a.extra_class_id = ec.id
      WHERE a.student_id = ?${dateFilter} AND s.year = u.year AND s.semester = u.semester
      GROUP BY a.subject_id, s.name
      ORDER BY s.name
    `;
    const [subjectStatsRows] = await executeQuery(subjectStatsQuery, params);
    const subjectStats = subjectStatsRows.map(row => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      attended: row.attended,
      total: row.total,
      percentage: row.percentage
    }));

    // Monthly attendance trend
    const monthlyTrendQuery = `
      SELECT
        FORMAT(MIN(a.date), 'MMM') as month,
        ROUND(
          (CAST(SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0)) * 100,
          2
        ) as percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN extra_classes ec ON a.extra_class_id = ec.id
      WHERE a.student_id = ?${dateFilter} AND s.year = u.year AND s.semester = u.semester
      GROUP BY YEAR(a.date), MONTH(a.date)
      ORDER BY YEAR(a.date), MONTH(a.date)
    `;
    const [monthlyTrendRows] = await executeQuery(monthlyTrendQuery, params);
    const monthlyTrend = monthlyTrendRows.map(row => ({
      month: row.month,
      percentage: row.percentage
    }));

    // Overall attendance
    const overallQuery = `
      SELECT
        SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN a.present = 0 THEN 1 ELSE 0 END) as missed,
        ROUND(
          (CAST(SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0)) * 100,
          2
        ) as percentage
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.student_id = u.id
      LEFT JOIN extra_classes ec ON a.extra_class_id = ec.id
      WHERE a.student_id = ?${dateFilter} AND s.year = u.year AND s.semester = u.semester
    `;
    const [overallRows] = await executeQuery(overallQuery, params);
    const overallRow = overallRows[0] || {};
    const overall = {
      attended: overallRow.attended || 0,
      missed: overallRow.missed || 0,
      percentage: overallRow.percentage || 0
    };

    res.json({ subjectStats, monthlyTrend, overall, records });
  } catch (error) {
    console.error('Student attendance fetch error:', error);
    next(error);
  }
});

// Bulk mark attendance
router.post('/bulk', authenticateToken, async (req, res, next) => {
  try {
    const { subjectId, date, period, attendanceData, markedBy, extraClassId, isExtra } = req.body;

    // Timetable validation is performed only for regular classes. Extra classes
    // bypass this check so that attendance can be marked without a timetable entry.
    if (!extraClassId && !isExtra) {
      // Placeholder for timetable validation if required in the future.
    }

    // Delete existing attendance for the same subject, date, period and extra class
    let deleteQuery = 'DELETE FROM attendance WHERE subject_id = ? AND date = ? AND period = ?';
    const deleteParams = [subjectId, date, period];
    if (extraClassId) {
      deleteQuery += ' AND extra_class_id = ?';
      deleteParams.push(extraClassId);
    } else {
      deleteQuery += ' AND extra_class_id IS NULL';
    }
    await executeQuery(deleteQuery, deleteParams);

    // Insert new attendance records
    const insertPromises = attendanceData.map(record => {
      return executeQuery(
        'INSERT INTO attendance (student_id, subject_id, date, present, period, marked_by, extra_class_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.studentId, subjectId, date, record.present, period, markedBy, extraClassId || null]
      );
    });
    
    await Promise.all(insertPromises);
    const studentIds = [...new Set(attendanceData.map(r => r.studentId))];
    if (studentIds.length) {
      const placeholders = studentIds.map(() => '?').join(',');
      const [rows] = await executeQuery(
        `SELECT student_id,
                ROUND(SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS percentage
           FROM attendance
          WHERE student_id IN (${placeholders})
          GROUP BY student_id`,
        studentIds
      );
      const lowAttendance = rows.filter(r => r.percentage !== null && r.percentage < 75);
      for (const student of lowAttendance) {
        if (await shouldSendAttendanceReminder(student.student_id)) {
          const message = `Your attendance is ${student.percentage}%. Please attend classes regularly.`;
          await executeQuery(
            'INSERT INTO notifications (title, message, type, user_id, data) VALUES (?, ?, ?, ?, ?)',
            [
              'Attendance Alert',
              message,
              'attendance_alert',
              student.student_id,
              JSON.stringify({ url: '/dashboard/student-attendance' })
            ]
          );
          sendToUsers([student.student_id], {
            title: 'Attendance Alert',
            body: message,
            data: { url: '/dashboard/student-attendance' }
          }).catch(err => console.error('Push notification error:', err));
        }
      }
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    next(error);
  }
});

module.exports = router;
module.exports.shouldSendAttendanceReminder = shouldSendAttendanceReminder;
