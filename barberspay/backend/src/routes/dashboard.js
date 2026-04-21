const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

// GET /dashboard?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE status='success'), 0) AS total,
       COALESCE(SUM(amount) FILTER (WHERE status='success' AND method='cash'), 0) AS cash,
       COALESCE(SUM(amount) FILTER (WHERE status='success' AND method != 'cash'), 0) AS digital,
       COUNT(*) FILTER (WHERE status='success') AS tx_count
     FROM payments
     WHERE barber_id=$1
       AND DATE(COALESCE(paid_at, created_at) AT TIME ZONE 'Africa/Lagos') = $2`,
    [req.barber.id, date]
  );

  const { rows: appts } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE status='done') AS done,
            COUNT(*) FILTER (WHERE status='pending' OR status='in_progress') AS pending
     FROM appointments
     WHERE barber_id=$1 AND DATE(created_at AT TIME ZONE 'Africa/Lagos') = $2`,
    [req.barber.id, date]
  );

  res.json({
    date,
    earnings: {
      total: parseInt(rows[0].total),
      cash: parseInt(rows[0].cash),
      digital: parseInt(rows[0].digital),
      tx_count: parseInt(rows[0].tx_count),
    },
    appointments: {
      done: parseInt(appts[0].done),
      pending: parseInt(appts[0].pending),
    },
  });
});

module.exports = router;
