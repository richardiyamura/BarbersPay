'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

const SERVICES = [
  { label: 'Haircut', emoji: '💈' },
  { label: 'Shave', emoji: '🪒' },
  { label: 'Haircut + Shave', emoji: '✂️' },
  { label: 'Beard Trim', emoji: '🧔' },
  { label: 'Fade', emoji: '💇' },
  { label: 'Kids Cut', emoji: '👦' },
];

export default function NewAppointmentPage() {
  useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ customer_name: '', service: '', amount: '', is_walkin: true, scheduled_at: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setError('');
    if (!form.customer_name || !form.service || !form.amount) { setError('Fill in all fields'); return; }
    setLoading(true);
    try {
      const appt = await api.post('/appointments', {
        ...form, amount: parseInt(form.amount),
        scheduled_at: form.is_walkin ? null : form.scheduled_at || null,
      });
      router.push(`/payment?appointment_id=${appt.id}&amount=${appt.amount}`);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--light)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: 12, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ color: 'var(--white)' }}>New Appointment</h1>
        <p className="subtitle">Fill in the details below</p>
      </div>

      <div className="page-body">
        {/* Customer name */}
        <div className="stack" style={{ gap: 8 }}>
          <label className="label">Customer Name</label>
          <input className="input" placeholder="e.g. Emeka" value={form.customer_name}
            onChange={e => set('customer_name', e.target.value)} autoFocus />
        </div>

        {/* Service */}
        <div className="stack" style={{ gap: 8 }}>
          <label className="label">Service</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SERVICES.map(s => (
              <button key={s.label}
                className={`service-btn${form.service === s.label ? ' selected' : ''}`}
                onClick={() => set('service', s.label)}>
                <span style={{ display: 'block', fontSize: '1.3rem', marginBottom: 4 }}>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Or type custom…" value={form.service}
            onChange={e => set('service', e.target.value)} />
        </div>

        {/* Amount */}
        <div className="stack" style={{ gap: 8 }}>
          <label className="label">Amount (₦)</label>
          <input className="input" type="number" inputMode="numeric" placeholder="2000"
            value={form.amount} onChange={e => set('amount', e.target.value)}
            style={{ fontSize: '1.6rem', fontWeight: 700 }} />
        </div>

        {/* Walk-in toggle */}
        <div className="card">
          <div className="row">
            <div>
              <p style={{ fontWeight: 600 }}>Walk-in</p>
              <p style={{ color: 'var(--mid)', fontSize: '0.8rem', marginTop: 2 }}>Customer is here now</p>
            </div>
            <button
              className="toggle"
              style={{ background: form.is_walkin ? 'var(--gold)' : 'var(--border)' }}
              onClick={() => set('is_walkin', !form.is_walkin)}
            >
              <span className="toggle-thumb" style={{ left: form.is_walkin ? 25 : 3 }} />
            </button>
          </div>
          {!form.is_walkin && (
            <div style={{ marginTop: 14 }}>
              <label className="label" style={{ marginBottom: 6, display: 'block' }}>Scheduled Time</label>
              <input className="input" type="datetime-local" value={form.scheduled_at}
                onChange={e => set('scheduled_at', e.target.value)} />
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Saving…' : 'Book & Collect Payment →'}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
