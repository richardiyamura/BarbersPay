'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get('reference') || params.get('tx_ref');
  const [status, setStatus] = useState('Verifying payment…');

  useEffect(() => {
    if (!reference) { router.replace('/dashboard'); return; }
    api.get(`/payments/status/${reference}`)
      .then(p => {
        if (p.status === 'success') {
          setStatus('✅ Payment confirmed!');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('⏳ Payment pending — check dashboard shortly');
          setTimeout(() => router.push('/dashboard'), 3000);
        }
      })
      .catch(() => {
        setStatus('Could not verify — check dashboard');
        setTimeout(() => router.push('/dashboard'), 3000);
      });
  }, [reference, router]);

  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
      <div style={{ fontSize: '3rem' }}>💳</div>
      <h2 style={{ marginTop: 16 }}>{status}</h2>
      <p style={{ color: 'var(--gray)', marginTop: 8 }}>Redirecting…</p>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return <Suspense><ConfirmContent /></Suspense>;
}
