'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetUrl('');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid, existing email address.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      setSuccess(data.message || 'Password reset link generated!');
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-card rounded-2xl border-slate-800 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-2xl flex items-center justify-center mx-auto mb-3">
          🔑
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Forgot Password?</h1>
        <p className="text-xs text-slate-400">
          Enter your registered email address to generate a secure password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="developer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span>✅</span>
              <span>{success}</span>
            </div>
            {resetUrl && (
              <div className="mt-2 pt-2 border-t border-emerald-900/60">
                <p className="text-[11px] text-emerald-400 mb-2">Click below to reset your password now:</p>
                <Link
                  href={resetUrl}
                  className="block text-center py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  Proceed to Reset Password &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="gradient-button text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2 transition-all"
        >
          {loading ? 'Generating Link...' : 'Generate Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Remembered your password?{' '}
        <Link href="/login" className="text-blue-400 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
