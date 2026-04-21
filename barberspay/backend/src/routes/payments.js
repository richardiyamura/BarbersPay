const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');
const axios = require('axios');
const QRCode = require('qrcode');
const crypto = require('crypto');

// POST /payments/initiate  — creates Paystack payment link + QR
router.post('/initiate', auth, async (req, res) => {
  const { appointment_id, method = 'paystack' } = req.body;

  const { rows: appts } = await pool.query(
    'SELECT * FROM appointments WHERE id=$1 AND barber_id=$2',
    [appointment_id, req.barber.id]
  );
  if (!appts.length) return res.status(404).json({ error: 'Appointment not found' });
  const appt = appts[0];

  const reference = `BP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  let payment_link = null;
  let qr_code = null;

  if (method === 'paystack') {
    const resp = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: appt.amount * 100, // kobo
        email: `${req.barber.phone.replace('+', '')}@barberspay.app`,
        reference,
        metadata: { appointment_id, barber_id: req.barber.id },
        callback_url: `${process.env.FRONTEND_URL}/payment/confirm`,
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );
    payment_link = resp.data.data.authorization_url;
  } else if (method === 'flutterwave') {
    const resp = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: reference,
        amount: appt.amount,
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/confirm`,
        customer: { email: `${req.barber.phone.replace('+', '')}@barberspay.app`, phone_number: req.barber.phone },
        meta: { appointment_id, barber_id: req.barber.id },
      },
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}` } }
    );
    payment_link = resp.data.data.link;
  }

  if (payment_link) {
    qr_code = await QRCode.toDataURL(payment_link);
  }

  const { rows } = await pool.query(
    `INSERT INTO payments (appointment_id, barber_id, method, amount, reference, payment_link, qr_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [appointment_id, req.barber.id, method, appt.amount, reference, payment_link, qr_code]
  );

  res.json(rows[0]);
});

// POST /payments/cash  — manual cash entry (works offline, syncs on reconnect)
router.post('/cash', auth, async (req, res) => {
  const { appointment_id, amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount required' });

  const reference = `CASH-${Date.now()}`;
  const { rows } = await pool.query(
    `INSERT INTO payments (appointment_id, barber_id, method, amount, status, reference, paid_at)
     VALUES ($1,$2,'cash',$3,'success',$4,NOW()) RETURNING *`,
    [appointment_id || null, req.barber.id, amount, reference]
  );

  if (appointment_id) {
    await pool.query(
      "UPDATE appointments SET status='done' WHERE id=$1 AND barber_id=$2",
      [appointment_id, req.barber.id]
    );
  }

  res.status(201).json(rows[0]);
});

// POST /payments/webhook/paystack
router.post('/webhook/paystack', async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send('Invalid signature');
  }

  const { event, data } = req.body;
  if (event === 'charge.success') {
    await pool.query(
      `UPDATE payments SET status='success', paid_at=NOW() WHERE reference=$1`,
      [data.reference]
    );
    // Mark appointment done
    const { rows } = await pool.query(
      'SELECT appointment_id FROM payments WHERE reference=$1',
      [data.reference]
    );
    if (rows[0]?.appointment_id) {
      await pool.query(
        "UPDATE appointments SET status='done' WHERE id=$1",
        [rows[0].appointment_id]
      );
    }
  }
  res.sendStatus(200);
});

// POST /payments/webhook/flutterwave
router.post('/webhook/flutterwave', async (req, res) => {
  const sig = req.headers['verif-hash'];
  if (sig !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return res.status(400).send('Invalid signature');
  }

  const { event, data } = req.body;
  if (event === 'charge.completed' && data.status === 'successful') {
    await pool.query(
      `UPDATE payments SET status='success', paid_at=NOW() WHERE reference=$1`,
      [data.tx_ref]
    );
    const { rows } = await pool.query(
      'SELECT appointment_id FROM payments WHERE reference=$1',
      [data.tx_ref]
    );
    if (rows[0]?.appointment_id) {
      await pool.query(
        "UPDATE appointments SET status='done' WHERE id=$1",
        [rows[0].appointment_id]
      );
    }
  }
  res.sendStatus(200);
});

// GET /payments/status/:reference
router.get('/status/:reference', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM payments WHERE reference=$1 AND barber_id=$2',
    [req.params.reference, req.barber.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

module.exports = router;
