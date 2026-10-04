'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const steps = ['PENDING', 'PROCESSING', 'COMPLETED'];

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>();
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/orders/${id}`)
      .then(setOrder)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  useEffect(() => {
    if (
      !order ||
      ['COMPLETED', 'FAILED', 'CANCELLED'].includes(order.status)
    ) {
      return;
    }

    const timer = setInterval(() => {
      api(`/orders/${id}`)
        .then(setOrder)
        .catch(() => {});
    }, 2000);

    return () => clearInterval(timer);
  }, [order, id]);

  async function cancel() {
    try {
      const updated = await api(`/orders/${id}/cancel`, {
        method: 'POST'
      });
      setOrder(updated);
    } catch (requestError: any) {
      setError(requestError.message);
    }
  }

  if (error && !order) {
    return (
      <p className="rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </p>
    );
  }

  if (!order) {
    return <p className="text-slate-500">Loading order...</p>;
  }

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-500"
      >
        ← Back
      </button>

      <div className="mt-4 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-slate-500">Order</p>
            <h1 className="text-2xl font-bold">{order._id}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
            {order.status}
          </span>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Product</p>
            <p className="font-semibold">{order.productName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Type</p>
            <p className="font-semibold">{order.type}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Quantity</p>
            <p className="font-semibold">{order.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Amount</p>
            <p className="font-semibold">
              ₹{order.amount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {order.status !== 'CANCELLED' && (
          <div className="mt-10 space-y-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3"
              >
                <div
                  className={`h-8 w-8 rounded-full text-center leading-8 ${
                    index <= currentStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span
                  className={
                    index <= currentStep ? 'font-medium' : ''
                  }
                >
                  {step}
                </span>
              </div>
            ))}

            {order.status === 'FAILED' && (
              <p className="mt-4 text-sm text-red-600">
                {order.failureReason || 'Order processing failed'}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-5 text-sm text-red-600">{error}</p>
        )}

        {['PENDING', 'PROCESSING'].includes(order.status) && (
          <button
            onClick={cancel}
            className="mt-8 rounded-lg border border-red-200 px-4 py-2 text-red-600"
          >
            Cancel order
          </button>
        )}
      </div>
    </div>
  );
}
