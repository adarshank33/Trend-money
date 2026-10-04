'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api(`/products/${id}`)
      .then(setProduct)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  async function buy() {
    setLoading(true);
    setError('');

    try {
      const order = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          productId: id,
          type: 'BUY',
          quantity
        })
      });

      router.push(`/orders/${order._id}`);
    } catch (requestError: any) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (error && !product) {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </p>
    );
  }

  if (!product) {
    return <p className="text-slate-500">Loading product...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-500"
      >
        ← Back
      </button>

      <div className="mt-4 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
              {product.type}
            </span>
            <h1 className="mt-4 text-3xl font-bold">
              {product.name}
            </h1>
            <p className="mt-1 text-slate-500">
              {product.symbol}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
            {product.status ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Current Price</p>
            <p className="mt-1 text-2xl font-bold">
              ₹{product.currentPrice.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Risk</p>
            <p className="mt-1 text-2xl font-bold">
              {product.riskLevel}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">
              Estimated Amount
            </p>
            <p className="mt-1 text-2xl font-bold">
              ₹{(product.currentPrice * quantity).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-11 w-11 rounded-lg border"
          >
            −
          </button>
          <span className="w-12 text-center font-semibold">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="h-11 w-11 rounded-lg border"
          >
            +
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <button
          disabled={loading || !product.status}
          onClick={buy}
          className="mt-6 w-full rounded-xl bg-slate-900 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Creating order...' : 'BUY NOW'}
        </button>
      </div>
    </div>
  );
}
