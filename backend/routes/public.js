const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

router.get('/announcements', async (req, res, next) => {
  try {
    const { scope } = req.query;
    const scopeFilter = scope === 'landing' ? "AND a.target_role = 'landing'" : '';
    const result = await executeQuery(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_active = 1 ${scopeFilter}
      ORDER BY a.created_at DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Public announcements fetch error:', error);
    next(error);
  }
});

module.exports = router;
