const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

// GET /appointments?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `SELECT a.*, p.status as payment_status, p.method as payment_method, p.amount as paid_amount
     FROM appointments a
     LEFT JOIN payments p ON p.appointment_id = a.id
     WHERE a.barber_id=$1 AND DATE(a.created_at AT TIME ZONE 'Africa/Lagos') = $2
     ORDER BY a.created_at DESC`,
    [req.barber.id, date]
  );
  res.json(rows);
});

// POST /appointments
router.post('/', auth, async (req, res) => {
  const { customer_name, service, amount, scheduled_at, is_walkin } = req.body;
  if (!customer_name || !service || !amount) {
    return res.status(400).json({ error: 'customer_name, service, amount required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO appointments (barber_id, customer_name, service, amount, scheduled_at, is_walkin)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.barber.id, customer_name, service, amount, scheduled_at || null, !!is_walkin]
  );
  res.status(201).json(rows[0]);
});

// PATCH /appointments/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'in_progress', 'done', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { rows } = await pool.query(
    `UPDATE appointments SET status=$1 WHERE id=$2 AND barber_id=$3 RETURNING *`,
    [status, req.params.id, req.barber.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

module.exports = router;
