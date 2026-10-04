'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProductsPage() {
  const [data, setData] = useState<any>();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    setData(undefined);
    setError('');

    api(
      `/products?page=${page}&limit=8&search=${encodeURIComponent(
        search
      )}&type=${type}&status=${status}`
    )
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [page, search, type, status]);

  const openBuyPanel = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderError('');
    setOrderSuccess('');
  };

  const closeBuyModal = () => {
    setSelectedProduct(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeBuyModal();
    }
  };

  async function handleConfirmBuy(e: React.FormEvent) {
    e.preventDefault();
    setOrderError('');
    setOrderSuccess('');
    setOrderLoading(true);

    try {
      await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct._id,
          type: 'BUY',
          quantity: quantity
        })
      });
      setOrderSuccess('Order placed successfully!');
      setTimeout(() => {
        setSelectedProduct(null);
      }, 1500);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order.');
    } finally {
      setOrderLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">Investment Products</h1>
          <p className="mt-1 text-slate-500">Browse available funds, stocks, bonds and ETFs.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search..."
            className="rounded-lg border bg-white px-3 py-2"
          />
          <select
            value={type}
            onChange={(e) => { setPage(1); setType(e.target.value); }}
            className="rounded-lg border bg-white px-3 py-2"
          >
            <option value="">All types</option>
            <option value="MUTUAL_FUND">MUTUAL_FUND</option>
            <option value="STOCK">STOCK</option>
            <option value="BOND">BOND</option>
            <option value="ETF">ETF</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="rounded-lg border bg-white px-3 py-2"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
      {!data && !error && <p className="mt-8 text-slate-500">Loading products...</p>}
      {data && !data.items?.length && <div className="mt-8 rounded-2xl border bg-white p-12 text-center text-slate-500">No products found.</div>}

      {data && data.items?.length > 0 && (
        <>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.items.map((product: any) => (
              <div
                onClick={() => openBuyPanel(product)}
                key={product._id}
                className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  selectedProduct?._id === product._id ? 'border-slate-900 bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{product.type}</span>
                  <span className={`text-xs ${product.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-500'}`}>{product.status}</span>
                </div>
                <h2 className="mt-5 font-semibold">{product.name}</h2>
                <p className="text-sm text-slate-500">{product.symbol}</p>
                <p className="mt-5 text-xl font-bold">₹{product.currentPrice?.toLocaleString('en-IN')}</p>
                <p className="mt-1 text-sm text-slate-500">Risk: {product.riskLevel}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-500">Page {data.page} of {Math.max(data.pages, 1)}</span>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Next</button>
          </div>
        </>
      )}

      {selectedProduct && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={closeBuyModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {selectedProduct.type}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {selectedProduct.name}
              </h2>
              <p className="text-sm text-slate-500">{selectedProduct.symbol}</p>
            </div>

            <form onSubmit={handleConfirmBuy} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-slate-50/50 p-4 text-sm">
                <div>
                  <p className="text-slate-400">Current Price</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    ₹{selectedProduct.currentPrice?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Risk Level</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {selectedProduct.riskLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-b py-4">
                <span className="text-sm font-medium text-slate-700">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white font-bold transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white font-bold transition hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-slate-500">Estimated Amount</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{(selectedProduct.currentPrice * quantity).toLocaleString('en-IN')}
                </span>
              </div>

              {orderError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {orderError}
                </p>
              )}

              {orderSuccess && (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
                  {orderSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={orderLoading || !!orderSuccess}
                className="w-full rounded-xl bg-slate-900 p-3.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {orderLoading ? 'Processing Order...' : orderSuccess ? 'Success!' : 'BUY NOW'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
