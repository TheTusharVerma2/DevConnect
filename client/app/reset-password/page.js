'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      setSuccess(data.message || 'Password reset successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 p-8 glass-card rounded-2xl border-slate-800 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-2xl flex items-center justify-center mx-auto mb-3">
          🔒
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Set New Password</h1>
        <p className="text-xs text-slate-400">
          Enter a strong new password to regain access to your account.
        </p>
      </div>

      {!token && (
        <div className="p-4 bg-amber-950/50 border border-amber-800/60 rounded-xl text-amber-300 text-xs text-center mb-4">
          ⚠️ No reset token found in URL. Please use the reset link sent from the{' '}
          <Link href="/forgot-password" className="underline font-semibold">
            Forgot Password
          </Link>{' '}
          page.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            <p className="text-[11px] text-emerald-400">Redirecting to login page...</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="gradient-button text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2 transition-all"
        >
          {loading ? 'Updating Password...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Back to{' '}
        <Link href="/login" className="text-blue-400 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
