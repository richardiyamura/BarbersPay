const { pool } = require('../src/db');

const schema = `
CREATE TABLE IF NOT EXISTS barbers (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  service VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  is_walkin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash','paystack','flutterwave')),
  amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  reference VARCHAR(100) UNIQUE,
  payment_link TEXT,
  qr_code TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_barber_date ON payments(barber_id, paid_at);
`;

pool.query(schema)
  .then(() => { console.log('Migration complete'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
