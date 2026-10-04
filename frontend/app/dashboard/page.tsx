'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/stat-card';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>();
  const [portfolio, setPortfolio] = useState<any>();
  const [orders, setOrders] = useState<any>();
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/auth/me'),
      api('/portfolio'),
      api('/orders?limit=5')
    ])
      .then(([currentUser, currentPortfolio, currentOrders]) => {
        setUser(currentUser);
        setPortfolio(currentPortfolio);
        setOrders(currentOrders);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-5 text-red-700">
        {error}.{' '}
        <Link className="underline" href="/login">
          Login again
        </Link>
      </div>
    );
  }

  if (!user || !portfolio || !orders) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name}
        </h1>
        <p className="mt-1 text-slate-500">
          Here is your investment overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Invested"
          value={money(portfolio.totalInvested)}
        />
        <StatCard
          title="Current Value"
          value={money(portfolio.currentValue)}
        />
        <StatCard
          title="Profit / Loss"
          value={money(portfolio.profitLoss)}
          positive={portfolio.profitLoss >= 0}
        />
        <StatCard
          title="Total Holdings"
          value={String(portfolio.holdings.length)}
        />
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-blue-600">
            View all
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Order</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.items.length ? (
                orders.items.map((order: any) => (
                  <tr
                    key={order._id}
                    className="border-b last:border-0"
                  >
                    <td className="py-3">
                      <Link
                        className="text-blue-600"
                        href={`/orders/${order._id}`}
                      >
                        {order._id.slice(-8)}
                      </Link>
                    </td>
                    <td>{order.productName}</td>
                    <td>{money(order.amount)}</td>
                    <td>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-slate-500"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
