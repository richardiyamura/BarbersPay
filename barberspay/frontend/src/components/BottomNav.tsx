'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const path = usePathname();
  const active = (href: string) => path === href ? 'active' : '';
  return (
    <nav className="nav">
      <Link href="/dashboard" className={active('/dashboard')}>
        <span className="nav-icon">📊</span>Today
      </Link>
      <Link href="/appointments" className={active('/appointments')}>
        <span className="nav-icon">📋</span>Bookings
      </Link>
      <Link href="/new-appointment" className={active('/new-appointment')}>
        <span className="nav-icon">➕</span>New
      </Link>
    </nav>
  );
}
