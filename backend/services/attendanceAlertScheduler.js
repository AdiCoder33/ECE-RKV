const { executeQuery } = require('../config/database');
const { sendToUsers } = require('./pushService');
const { shouldSendAttendanceReminder } = require('../routes/attendance');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = process.env.TZ || 'Asia/Kolkata';

const alertLog = new Set();
let currentDate = null;
let isRunning = false;

async function runCheck() {
  if (isRunning) return;
  isRunning = true;
  try {
    const now = dayjs().tz(TIMEZONE);
    const today = now.format('YYYY-MM-DD');
    if (currentDate !== today) {
      alertLog.clear();
      currentDate = today;
    }
    const dayName = now.format('dddd');
    const currentTime = now.format('HH:mm');

    const { recordset: slots } = await executeQuery(
      `SELECT s.id AS subject_id, t.year, t.semester, t.section
       FROM timetable t
       JOIN subjects s ON s.name = t.subject OR CAST(s.id AS VARCHAR) = t.subject
       WHERE t.day = ? AND LEFT(t.time,5) = ?`,
      [dayName, currentTime]
    );

    for (const slot of slots) {
      const { recordset: students } = await executeQuery(
        "SELECT id FROM users WHERE role='student' AND year = ? AND semester = ? AND section = ?",
        [slot.year, slot.semester, slot.section]
      );
      if (!students.length) continue;
      const studentIds = students.map(s => s.id);
      const placeholders = studentIds.map(() => '?').join(',');
      const params = [slot.subject_id, ...studentIds];
      const { recordset: attendance } = await executeQuery(
        `SELECT student_id, ROUND(SUM(CASE WHEN present=1 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS pct FROM attendance WHERE subject_id=? AND student_id IN (${placeholders}) GROUP BY student_id`,
        params
      );
      const pctMap = new Map(attendance.map(r => [r.student_id, r.pct]));

      for (const studentId of studentIds) {
        const pct = pctMap.get(studentId) || 0;
        if (pct < 75) {
          const key = `${studentId}-${slot.subject_id}-${today}`;
          if (alertLog.has(key)) continue;
          alertLog.add(key);
          if (!(await shouldSendAttendanceReminder(studentId))) continue;
          const data = { url: '/dashboard/student-attendance', subjectId: slot.subject_id };
          const message = `Your attendance is ${pct}%. Please attend classes regularly.`;
          await executeQuery(
            'INSERT INTO notifications (title, message, type, user_id, data) VALUES (?, ?, ?, ?, ?)',
            ['Attendance Alert', message, 'attendance_alert', studentId, JSON.stringify(data)]
          );
          sendToUsers([studentId], {
            title: 'Attendance Alert',
            body: message,
            data
          }).catch(err => console.error('Push notification error:', err));
        }
      }
    }
  } catch (err) {
    console.error('Attendance alert scheduler error:', err);
  } finally {
    isRunning = false;
  }
}

function startAttendanceAlertScheduler() {
  runCheck();
  setInterval(runCheck, 60 * 1000);
}

module.exports = { startAttendanceAlertScheduler };
