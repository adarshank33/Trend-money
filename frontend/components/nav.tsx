'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function Nav() {
  const router = useRouter();

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-xl font-bold">
          Trend Money
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/products">Products</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/portfolio">Portfolio</Link>
          <button
            onClick={logout}
            className="rounded-lg border px-3 py-1.5"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
