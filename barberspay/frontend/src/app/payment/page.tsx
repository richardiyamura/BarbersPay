'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { queueCash, syncQueue } from '@/lib/offlineQueue';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

function PaymentContent() {
  useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const appointment_id = params.get('appointment_id');
  const amount = params.get('amount') || '';

  const [cashAmount, setCashAmount] = useState(amount);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [cashDone, setCashDone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  async function initiate(method: 'paystack' | 'flutterwave') {
    setError('');
    setLoading(method);
    try {
      const p = await api.post('/payments/initiate', { appointment_id: Number(appointment_id), method });
      setPayment(p);
      if (p.payment_link) window.open(p.payment_link, '_blank');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading('');
    }
  }

  async function recordCash() {
    setError('');
    const amt = parseInt(cashAmount);
    if (!amt) { setError('Enter amount'); return; }
    setLoading('cash');

    const entry = { appointment_id: appointment_id ? Number(appointment_id) : undefined, amount: amt };

    if (!isOnline) {
      queueCash(entry);
      setCashDone(true);
      setLoading('');
      return;
    }

    try {
      await api.post('/payments/cash', entry);
      setCashDone(true);
    } catch {
      queueCash(entry);
      setCashDone(true);
    } finally {
      setLoading('');
    }
  }

  if (cashDone) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h2 style={{ marginTop: 16 }}>Cash Recorded!</h2>
        {!isOnline && <p style={{ color: 'var(--gray)', marginTop: 8 }}>Saved offline — will sync when connected</p>}
        <div className="stack" style={{ marginTop: 32 }}>
          <button className="btn btn-primary" onClick={() => router.push('/new-appointment')}>New Appointment</button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="stack">
        <div className="row">
          <h1>Collect Payment</h1>
          {!isOnline && <span style={{ fontSize: '0.8rem', color: 'var(--red)' }}>● Offline</span>}
        </div>

        {amount && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">Amount</p>
            <p className="amount">₦{Number(amount).toLocaleString()}</p>
          </div>
        )}

        {/* Digital payments — only when online */}
        {isOnline && !payment && (
          <>
            <button className="btn btn-primary" onClick={() => initiate('paystack')} disabled={!!loading}>
              {loading === 'paystack' ? 'Loading…' : '📱 Pay with Paystack'}
            </button>
            <button className="btn btn-secondary" onClick={() => initiate('flutterwave')} disabled={!!loading}>
              {loading === 'flutterwave' ? 'Loading…' : '💳 Pay with Flutterwave'}
            </button>
          </>
        )}

        {/* QR code display */}
        {payment?.qr_code && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: 12 }}>Scan to Pay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.qr_code} alt="Payment QR" style={{ width: 200, height: 200, margin: '0 auto', display: 'block' }} />
            <a href={payment.payment_link} target="_blank" rel="noreferrer"
              className="btn btn-primary" style={{ marginTop: 12, display: 'block' }}>
              Open Payment Link
            </a>
            <button className="btn btn-secondary" style={{ marginTop: 8 }}
              onClick={() => setPayment(null)}>Try Another Method</button>
          </div>
        )}

        <div className="divider" />

        {/* Cash entry — always available */}
        <div className="stack">
          <label className="label">💵 Record Cash Payment</label>
          <input className="input" type="number" placeholder="Amount in ₦"
            value={cashAmount} onChange={e => setCashAmount(e.target.value)}
            style={{ fontSize: '1.3rem' }} />
          <button className="btn btn-secondary" onClick={recordCash} disabled={!!loading}>
            {loading === 'cash' ? 'Saving…' : isOnline ? 'Record Cash' : '💾 Save Offline'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-secondary" onClick={() => router.back()}>← Back</button>
      </div>
      <BottomNav />
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense><PaymentContent /></Suspense>;
}
