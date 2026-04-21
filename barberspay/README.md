# BarbersPay

BarbersPay is a mobile-first payment and appointment platform designed for barbers and small salons in Nigeria.

## Stack
- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Payments**: Paystack (primary), Flutterwave (fallback)
- **SMS OTP**: Twilio (optional; logs to console in dev)

## Quick Start (Docker)

```bash
cp backend/.env.example backend/.env   # fill in your API keys
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

## Local Dev (without Docker)

**Backend**
```bash
cd backend
cp .env.example .env        # edit with real values
npm install
npm run migrate             # creates tables
npm run dev
```

**Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## API Keys Required

| Key | Where to get |
|-----|-------------|
| `PAYSTACK_SECRET` | https://dashboard.paystack.com → Settings → API |
| `FLUTTERWAVE_SECRET` | https://dashboard.flutterwave.com → Settings → API |
| `FLUTTERWAVE_WEBHOOK_HASH` | Set in Flutterwave dashboard → Webhooks |
| `TWILIO_SID/TOKEN/FROM` | https://console.twilio.com (optional) |

## Webhook Setup

Register these URLs in your payment dashboards:

- **Paystack**: `https://yourdomain.com/payments/webhook/paystack`
- **Flutterwave**: `https://yourdomain.com/payments/webhook/flutterwave`

For local testing use [ngrok](https://ngrok.com): `ngrok http 4000`

## Features

- 📱 Phone + OTP login
- 📋 Appointments (walk-ins + scheduled)
- 💳 Paystack payment links + QR codes
- 💳 Flutterwave fallback
- 💵 Cash manual entry with offline queue (syncs on reconnect)
- 📊 Daily dashboard: total, cash vs digital breakdown
- 🔔 Automatic payment confirmation via webhooks

## Offline Behavior

Cash payments made while offline are saved to `localStorage` and automatically synced to the server when the device reconnects (on next dashboard load).
