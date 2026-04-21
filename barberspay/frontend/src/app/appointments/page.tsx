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
    api.get('/appointments').then(setAppts).catch(() => {}).finally(() => setLoading(false));
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
      <div className="page-header">
        <div className="row">
          <h1 style={{ color: 'var(--white)' }}>Bookings</h1>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto' }}
            onClick={() => router.push('/new-appointment')}>+ New</button>
        </div>
        <p className="subtitle">{appts.length} appointment{appts.length !== 1 ? 's' : ''} today</p>
      </div>

      <div className="page-body">
        {appts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📋</p>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No appointments yet</p>
            <p style={{ color: 'var(--mid)', fontSize: '0.875rem' }}>Tap + New to add one</p>
          </div>
        )}

        {appts.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row">
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{a.customer_name}</p>
                <p style={{ color: 'var(--mid)', fontSize: '0.85rem', marginTop: 2 }}>
                  {a.service}
                  {a.is_walkin && <span style={{ marginLeft: 6 }} className="chip">walk-in</span>}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>₦{Number(a.amount).toLocaleString()}</p>
                <span className={`badge badge-${a.status}`} style={{ marginTop: 4 }}>
                  {a.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {a.status !== 'done' && a.status !== 'cancelled' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {a.status === 'pending' && (
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                    onClick={() => updateStatus(a.id, 'in_progress')}>▶ Start</button>
                )}
                <button className="btn btn-primary btn-sm" style={{ flex: 2 }}
                  onClick={() => router.push(`/payment?appointment_id=${a.id}&amount=${a.amount}`)}>
                  Collect ₦{Number(a.amount).toLocaleString()}
                </button>
                <button className="btn btn-danger btn-sm" style={{ width: 44, padding: '10px 0', flex: '0 0 44px' }}
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
