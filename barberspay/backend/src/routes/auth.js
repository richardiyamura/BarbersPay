const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// In production use Twilio; for dev, log OTP to console
async function sendOTP(phone, code) {
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    await twilio.messages.create({
      body: `Your BarbersPay code: ${code}`,
      from: process.env.TWILIO_FROM,
      to: phone,
    });
  } else {
    console.log(`[DEV OTP] ${phone}: ${code}`);
  }
}

// POST /auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await pool.query(
    'INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, $3)',
    [phone, code, expires]
  );

  await sendOTP(phone, code);
  res.json({ message: 'OTP sent' });
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

  const { rows } = await pool.query(
    `SELECT * FROM otps WHERE phone=$1 AND code=$2 AND used=FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, code]
  );

  if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

  await pool.query('UPDATE otps SET used=TRUE WHERE id=$1', [rows[0].id]);

  // Upsert barber
  const { rows: barbers } = await pool.query(
    `INSERT INTO barbers (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone=EXCLUDED.phone
     RETURNING *`,
    [phone]
  );

  const token = jwt.sign(
    { id: barbers[0].id, phone },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, barber: barbers[0] });
});

// PATCH /auth/profile
router.patch('/profile', require('../middleware/auth'), async (req, res) => {
  const { name } = req.body;
  const { rows } = await pool.query(
    'UPDATE barbers SET name=$1 WHERE id=$2 RETURNING *',
    [name, req.barber.id]
  );
  res.json(rows[0]);
});

module.exports = router;
