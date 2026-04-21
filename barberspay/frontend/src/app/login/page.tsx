'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOTP() {
    setError('');
    if (!phone.match(/^\+?[0-9]{10,15}$/)) { setError('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setStep('otp');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function verifyOTP() {
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/verify-otp', { phone, code });
      localStorage.setItem('bp_token', data.token);
      localStorage.setItem('bp_barber', JSON.stringify(data.barber));
      router.push('/dashboard');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ padding: '60px 28px 40px', flex: 1 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', marginBottom: 24,
        }}>✂️</div>
        <h1 style={{ color: 'var(--white)', fontSize: '2rem', lineHeight: 1.2 }}>
          BarbersPay
        </h1>
        <p style={{ color: 'var(--light)', marginTop: 8, fontSize: '1rem' }}>
          Book. Collect. Track.
        </p>
      </div>

      {/* Form card */}
      <div style={{
        background: 'var(--white)', borderRadius: '28px 28px 0 0',
        padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {step === 'phone' ? (
          <>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Enter your number</h2>
              <p style={{ color: 'var(--mid)', fontSize: '0.875rem', marginTop: 4 }}>
                We'll send a one-time code
              </p>
            </div>
            <input
              className="input"
              type="tel"
              placeholder="+234 800 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              style={{ fontSize: '1.1rem' }}
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-dark" onClick={sendOTP} disabled={loading}>
              {loading ? 'Sending…' : 'Get OTP →'}
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Enter OTP</h2>
              <p style={{ color: 'var(--mid)', fontSize: '0.875rem', marginTop: 4 }}>
                Sent to {phone}
              </p>
            </div>
            <input
              className="input"
              type="number"
              placeholder="• • • • • •"
              value={code}
              onChange={e => {
                setCode(e.target.value);
                if (e.target.value.length === 6) {
                  // auto-submit when 6 digits entered
                  setTimeout(() => verifyOTP(), 100);
                }
              }}
              autoFocus
              style={{ fontSize: '2rem', letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700 }}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-dark" onClick={verifyOTP} disabled={loading}>
              {loading ? 'Verifying…' : 'Login →'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setStep('phone'); setCode(''); setError(''); }}>
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
