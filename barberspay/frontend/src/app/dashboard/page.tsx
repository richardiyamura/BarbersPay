'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { syncQueue, getQueue } from '@/lib/offlineQueue';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG');
}

export default function DashboardPage() {
  useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [synced, setSynced] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync offline queue on load
    const q = getQueue();
    if (q.length) {
      syncQueue().then(n => { if (n) setSynced(n); });
    }
    api.get('/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading…</div>;

  const e = data?.earnings;
  const a = data?.appointments;

  return (
    <div className="page">
      <div className="stack">
        <div className="row">
          <h1>Today</h1>
          <button
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            title="Logout"
          >⚙️</button>
        </div>

        {synced && (
          <div className="card" style={{ background: 'var(--green-light)', border: 'none' }}>
            ✅ Synced {synced} offline cash payment{synced > 1 ? 's' : ''}
          </div>
        )}

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p className="label">Total Earnings</p>
          <p className="amount">{fmt(e?.total ?? 0)}</p>
          <p style={{ color: 'var(--gray)', marginTop: 4, fontSize: '0.9rem' }}>
            {e?.tx_count ?? 0} payment{e?.tx_count !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">💵 Cash</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>{fmt(e?.cash ?? 0)}</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="label">📱 Digital</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>{fmt(e?.digital ?? 0)}</p>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <span>✅ Done</span><strong>{a?.done ?? 0}</strong>
          </div>
          <div className="divider" />
          <div className="row">
            <span>⏳ Pending</span><strong>{a?.pending ?? 0}</strong>
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
