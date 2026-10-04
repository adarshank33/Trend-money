'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = register
      ? form
      : { email: form.email, password: form.password };

    try {
      await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">
        {register ? 'Create account' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {register
          ? 'Start managing your investments.'
          : 'Sign in to your portfolio.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {register && (
          <input
            required
            placeholder="Full name"
            className="w-full rounded-lg border p-3"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
          />
        )}

        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border p-3"
          value={form.email}
          onChange={(event) =>
            setForm({ ...form, email: event.target.value })
          }
        />

        {register && (
          <input
            placeholder="Phone"
            className="w-full rounded-lg border p-3"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
        )}

        <div className="relative w-full">
          <input
            required
            minLength={6}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="w-full rounded-lg border p-3 pr-10"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
          >
            {showPassword ? (
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 p-3 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? 'Please wait...'
            : register
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      <button
        onClick={() => {
          setRegister(!register);
          setError('');
        }}
        className="mt-5 text-sm text-blue-600"
      >
        {register
          ? 'Already have an account? Sign in'
          : 'New here? Create an account'}
      </button>
    </div>
  );
}
