'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;
}

export default function OrdersPage() {
  const [data, setData] = useState<any>();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    setData(undefined);
    setError('');

    const statusParam = status ? `&status=${status}` : '';

    api(`/orders?page=${page}&limit=10${statusParam}`)
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [page, status]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedOrder(null);
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="mt-1 text-slate-500">
            Track your investment orders.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-lg border bg-white px-3 py-2"
        >
          <option value="">All statuses</option>
          {[
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED',
            'CANCELLED'
          ].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-8 text-slate-500">Loading orders...</p>
      )}

      {data && (
        <div className="mt-7 overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-4">Order ID</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((order: any) => (
                <tr
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-slate-50 ${selectedOrder?._id === order._id ? 'bg-slate-50' : ''
                    }`}
                >
                  <td className="p-4 text-blue-600 font-medium">
                    {order._id.slice(-8)}
                  </td>
                  <td>{order.productName}</td>
                  <td>{order.type}</td>
                  <td>{order.quantity}</td>
                  <td>{money(order.amount)}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {!data.items?.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="mt-5 flex justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {data.page} of {Math.max(data.pages, 1)}
          </span>
          <button
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {selectedOrder && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-2xl border bg-white p-6 shadow-xl">

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Order Details
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-900 break-all">
                ID: {selectedOrder._id}
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-slate-50/50 p-4 text-sm">
              <div>
                <p className="text-slate-400">Product</p>
                <p className="mt-1 font-semibold text-slate-800">{selectedOrder.productName}</p>
              </div>
              <div>
                <p className="text-slate-400">Transaction Type</p>
                <p className="mt-1 font-semibold text-slate-800">{selectedOrder.type}</p>
              </div>
              <div>
                <p className="text-slate-400">Quantity Ordered</p>
                <p className="mt-1 font-semibold text-slate-800">{selectedOrder.quantity}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Amount</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{money(selectedOrder.amount)}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Order Status:</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${selectedOrder.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    selectedOrder.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                      selectedOrder.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' :
                        'bg-rose-50 text-red-700'
                  }`}>
                  {selectedOrder.status}
                </span>
              </div>

              {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PROCESSING') && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api(`/orders/${selectedOrder._id}/cancel`, { method: 'POST' });
                      setSelectedOrder({ ...selectedOrder, status: 'CANCELLED' });
                    } catch (err: any) {
                      alert(err.message || 'Could not cancel order');
                    }
                  }}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Cancel Order
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
