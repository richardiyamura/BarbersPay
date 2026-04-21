'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', icon: '📊', label: 'Today' },
  { href: '/appointments', icon: '📋', label: 'Bookings' },
  { href: '/new-appointment', icon: '➕', label: 'New' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {links.map(l => (
        <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
          <span className="nav-icon">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
