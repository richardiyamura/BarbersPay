'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { queueCash } from '@/lib/offlineQueue';
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
  const [done, setDone] = useState(false);
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
    setError(''); setLoading(method);
    try {
      const p = await api.post('/payments/initiate', { appointment_id: Number(appointment_id), method });
      setPayment(p);
      if (p.payment_link) window.open(p.payment_link, '_blank');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(''); }
  }

  async function recordCash() {
    setError('');
    const amt = parseInt(cashAmount);
    if (!amt) { setError('Enter an amount'); return; }
    setLoading('cash');
    const entry = { appointment_id: appointment_id ? Number(appointment_id) : undefined, amount: amt };
    if (!isOnline) { queueCash(entry); setDone(true); setLoading(''); return; }
    try {
      await api.post('/payments/cash', entry);
      setDone(true);
    } catch { queueCash(entry); setDone(true); }
    finally { setLoading(''); }
  }

  if (done) {
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <h2 style={{ fontSize: '1.4rem' }}>Payment Recorded!</h2>
        {!isOnline && <p style={{ color: 'var(--mid)', fontSize: '0.875rem' }}>Saved offline — syncs when connected</p>}
        <div className="stack" style={{ width: '100%', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => router.push('/new-appointment')}>+ New Appointment</button>
          <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>View Dashboard</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--light)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: 12, padding: 0 }}>
          ← Back
        </button>
        <div className="row">
          <h1 style={{ color: 'var(--white)' }}>Collect Payment</h1>
          {!isOnline && (
            <span style={{ fontSize: '0.75rem', background: 'var(--red)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
              Offline
            </span>
          )}
        </div>
        {amount && (
          <p className="amount-hero" style={{ marginTop: 12 }}>₦{Number(amount).toLocaleString()}</p>
        )}
      </div>

      <div className="page-body">
        {/* Digital payments */}
        {isOnline && !payment && (
          <div className="card stack" style={{ gap: 10 }}>
            <p className="label">Digital Payment</p>
            <button className="btn btn-dark" onClick={() => initiate('paystack')} disabled={!!loading}>
              {loading === 'paystack' ? 'Loading…' : '📱 Pay with Paystack'}
            </button>
            <button className="btn btn-ghost" onClick={() => initiate('flutterwave')} disabled={!!loading}>
              {loading === 'flutterwave' ? 'Loading…' : '💳 Pay with Flutterwave'}
            </button>
          </div>
        )}

        {/* QR code */}
        {payment?.qr_code && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: 14 }}>Scan to Pay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.qr_code} alt="QR" style={{ width: 200, height: 200, margin: '0 auto', display: 'block', borderRadius: 12 }} />
            <a href={payment.payment_link} target="_blank" rel="noreferrer"
              className="btn btn-primary" style={{ marginTop: 14, display: 'block' }}>
              Open Payment Link
            </a>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setPayment(null)}>
              Try Another Method
            </button>
          </div>
        )}

        {/* Cash */}
        <div className="card stack" style={{ gap: 10 }}>
          <p className="label">💵 Cash Payment</p>
          <input className="input" type="number" inputMode="numeric" placeholder="Amount in ₦"
            value={cashAmount} onChange={e => setCashAmount(e.target.value)}
            style={{ fontSize: '1.5rem', fontWeight: 700 }} />
          <button className="btn btn-primary" onClick={recordCash} disabled={!!loading}>
            {loading === 'cash' ? 'Saving…' : isOnline ? '✓ Record Cash' : '💾 Save Offline'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
      <BottomNav />
    </div>
  );
}

export default function PaymentPage() {
  return <Suspense><PaymentContent /></Suspense>;
}
