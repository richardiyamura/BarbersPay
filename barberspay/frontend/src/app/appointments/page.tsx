'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

export default function AppointmentsPage() {
  useAuth();
  const router = useRouter();
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments')
      .then(setAppts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      const updated = await api.patch(`/appointments/${id}/status`, { status });
      setAppts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    } catch {}
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div className="page">
      <div className="stack">
        <div className="row">
          <h1>Bookings</h1>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem' }}
            onClick={() => router.push('/new-appointment')}>+ New</button>
        </div>

        {appts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--gray)', padding: 40 }}>
            No appointments today
          </div>
        )}

        {appts.map(a => (
          <div key={a.id} className="card stack" style={{ gap: 8 }}>
            <div className="row">
              <div>
                <strong>{a.customer_name}</strong>
                {a.is_walkin && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--gray)' }}>walk-in</span>}
              </div>
              <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
            </div>
            <div className="row">
              <span style={{ color: 'var(--gray)' }}>{a.service}</span>
              <strong>₦{Number(a.amount).toLocaleString()}</strong>
            </div>

            {a.status !== 'done' && a.status !== 'cancelled' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {a.status === 'pending' && (
                  <button className="btn btn-secondary" style={{ padding: '10px', fontSize: '0.85rem' }}
                    onClick={() => updateStatus(a.id, 'in_progress')}>Start</button>
                )}
                <button className="btn btn-primary" style={{ padding: '10px', fontSize: '0.85rem' }}
                  onClick={() => router.push(`/payment?appointment_id=${a.id}&amount=${a.amount}`)}>
                  Collect Payment
                </button>
                <button className="btn btn-danger" style={{ padding: '10px', fontSize: '0.85rem', width: 'auto', flex: '0 0 auto' }}
                  onClick={() => updateStatus(a.id, 'cancelled')}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
