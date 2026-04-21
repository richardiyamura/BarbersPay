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
    if (!phone.match(/^\+?[0-9]{10,15}$/)) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/verify-otp', { phone, code });
      localStorage.setItem('bp_token', data.token);
      localStorage.setItem('bp_barber', JSON.stringify(data.barber));
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ paddingTop: 60 }}>
      <div className="stack" style={{ gap: 24 }}>
        <div>
          <h1>✂️ BarbersPay</h1>
          <p style={{ color: 'var(--gray)', marginTop: 4 }}>Book. Collect. Track.</p>
        </div>

        {step === 'phone' ? (
          <>
            <div className="stack">
              <label className="label">Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="+2348012345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" onClick={sendOTP} disabled={loading}>
              {loading ? 'Sending…' : 'Get OTP'}
            </button>
          </>
        ) : (
          <>
            <div className="stack">
              <label className="label">Enter 6-digit code sent to {phone}</label>
              <input
                className="input"
                type="number"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                autoFocus
                style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" onClick={verifyOTP} disabled={loading}>
              {loading ? 'Verifying…' : 'Login'}
            </button>
            <button className="btn btn-secondary" onClick={() => setStep('phone')}>
              Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
