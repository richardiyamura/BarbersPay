'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

const SERVICES = ['Haircut', 'Shave', 'Haircut + Shave', 'Beard Trim', 'Fade', 'Kids Cut'];

export default function NewAppointmentPage() {
  useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: '',
    service: '',
    amount: '',
    is_walkin: true,
    scheduled_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: any) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit() {
    setError('');
    if (!form.customer_name || !form.service || !form.amount) {
      setError('Fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const appt = await api.post('/appointments', {
        ...form,
        amount: parseInt(form.amount),
        scheduled_at: form.is_walkin ? null : form.scheduled_at || null,
      });
      router.push(`/payment?appointment_id=${appt.id}&amount=${appt.amount}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="stack">
        <h1>New Appointment</h1>

        <div className="stack">
          <label className="label">Customer Name</label>
          <input className="input" placeholder="e.g. Emeka" value={form.customer_name}
            onChange={e => set('customer_name', e.target.value)} />
        </div>

        <div className="stack">
          <label className="label">Service</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SERVICES.map(s => (
              <button key={s}
                className={`btn ${form.service === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '12px', fontSize: '0.9rem' }}
                onClick={() => set('service', s)}>
                {s}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Or type custom service…" value={form.service}
            onChange={e => set('service', e.target.value)} />
        </div>

        <div className="stack">
          <label className="label">Amount (₦)</label>
          <input className="input" type="number" placeholder="2000" value={form.amount}
            onChange={e => set('amount', e.target.value)} style={{ fontSize: '1.3rem' }} />
        </div>

        <div className="card">
          <div className="row">
            <span>Walk-in (no appointment)</span>
            <button
              onClick={() => set('is_walkin', !form.is_walkin)}
              style={{
                width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: form.is_walkin ? 'var(--green)' : 'var(--border)',
                transition: 'background 0.2s',
              }}
            >
              <span style={{
                display: 'block', width: 22, height: 22, borderRadius: '50%', background: '#fff',
                margin: form.is_walkin ? '3px 3px 3px auto' : '3px auto 3px 3px',
                transition: 'margin 0.2s',
              }} />
            </button>
          </div>
          {!form.is_walkin && (
            <div style={{ marginTop: 12 }}>
              <input className="input" type="datetime-local" value={form.scheduled_at}
                onChange={e => set('scheduled_at', e.target.value)} />
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Saving…' : 'Book & Collect Payment →'}
        </button>
        <button className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
      <BottomNav />
    </div>
  );
}
