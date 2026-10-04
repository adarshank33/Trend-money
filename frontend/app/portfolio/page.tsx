'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/stat-card';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>();
  const [error, setError] = useState('');

  useEffect(() => {
    api('/portfolio')
      .then(setPortfolio)
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </p>
    );
  }

  if (!portfolio) {
    return <p className="text-slate-500">Loading portfolio...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Portfolio</h1>
      <p className="mt-1 text-slate-500">
        Your current holdings and performance.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
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
      </div>

      <div className="mt-7 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Holdings</h2>

        <div className="mt-5 space-y-3">
          {portfolio.holdings.length ? (
            portfolio.holdings.map((holding: any) => (
              <div
                key={holding.productId}
                className="grid gap-4 rounded-xl border p-4 md:grid-cols-5 md:items-center"
              >
                <div>
                  <p className="font-semibold">
                    {holding.productName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {holding.productId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Units</p>
                  <p>{holding.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Invested</p>
                  <p>{money(holding.investedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    Current value
                  </p>
                  <p>{money(holding.currentValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">P/L</p>
                  <p
                    className={
                      holding.currentValue >= holding.investedAmount
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }
                  >
                    {money(
                      holding.currentValue - holding.investedAmount
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              No holdings yet. Buy a product to start your portfolio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
