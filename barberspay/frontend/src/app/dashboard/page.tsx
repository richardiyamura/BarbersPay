'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { syncQueue, getQueue } from '@/lib/offlineQueue';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG');

export default function DashboardPage() {
  useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [synced, setSynced] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getQueue().length) syncQueue().then(n => { if (n) setSynced(n); });
    api.get('/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading…</div>;

  const e = data?.earnings;
  const a = data?.appointments;
  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="row" style={{ marginBottom: 20 }}>
          <div>
            <p style={{ color: 'var(--light)', fontSize: '0.8rem', fontWeight: 500 }}>{today}</p>
            <h1 style={{ color: 'var(--white)' }}>Today's Summary</h1>
          </div>
          <button
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            style={{ background: 'var(--dark3)', border: 'none', color: 'var(--light)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
          >Logout</button>
        </div>

        {/* Hero earnings */}
        <div style={{ background: 'var(--dark2)', borderRadius: 18, padding: '20px 20px 16px' }}>
          <p className="label" style={{ color: 'var(--mid)' }}>Total Earned</p>
          <p className="amount-hero" style={{ marginTop: 6 }}>{fmt(e?.total ?? 0)}</p>
          <p style={{ color: 'var(--mid)', fontSize: '0.8rem', marginTop: 6 }}>
            {e?.tx_count ?? 0} payment{e?.tx_count !== 1 ? 's' : ''} today
          </p>
        </div>
      </div>

      <div className="page-body">
        {synced && (
          <div style={{ background: 'var(--green-bg)', borderRadius: 12, padding: '12px 16px', color: '#065f46', fontSize: '0.875rem', fontWeight: 500 }}>
            ✅ Synced {synced} offline cash payment{synced > 1 ? 's' : ''}
          </div>
        )}

        {/* Cash vs Digital */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">💵 Cash</p>
            <p className="amount-sub" style={{ marginTop: 8 }}>{fmt(e?.cash ?? 0)}</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">📱 Digital</p>
            <p className="amount-sub" style={{ marginTop: 8 }}>{fmt(e?.digital ?? 0)}</p>
          </div>
        </div>

        {/* Appointments summary */}
        <div className="card">
          <p className="label" style={{ marginBottom: 12 }}>Appointments</p>
          <div className="row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <span style={{ fontWeight: 500 }}>Completed</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{a?.done ?? 0}</span>
          </div>
          <div className="divider" style={{ margin: '12px 0' }} />
          <div className="row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>⏳</span>
              <span style={{ fontWeight: 500 }}>Pending</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{a?.pending ?? 0}</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => router.push('/new-appointment')}>
          + New Appointment
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
