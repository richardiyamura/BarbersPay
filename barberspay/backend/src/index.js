require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Webhooks need raw body for signature verification
app.use('/payments/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use('/auth', require('./routes/auth'));
app.use('/appointments', require('./routes/appointments'));
app.use('/payments', require('./routes/payments'));
app.use('/dashboard', require('./routes/dashboard'));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
