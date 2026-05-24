'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Activity, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@cure.local');
    setPassword('ChangeMe123!');
    toast.info('Filled default admin credentials. Click "Sign In" to proceed.');
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-bg text-text px-4 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity mb-4">
            <div className="bg-primary flex items-center justify-center p-2 rounded-xl text-bg shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight uppercase">CURE</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-text/60 mt-1">Access the secure clinical data & booking portal</p>
        </div>

        {/* Login Card */}
        <div className="glass p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text/80 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text/40">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cure.local"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text/80 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text/40">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-bg font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill section */}
          <div className="pt-4 border-t border-text/5 flex flex-col gap-3">
            <span className="text-[11px] text-text/50 font-bold uppercase tracking-wider text-center">Testing Sandbox Credentials</span>
            <button
              onClick={fillAdminCredentials}
              className="py-2.5 px-4 rounded-xl border border-dashed border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-all text-center cursor-pointer"
              disabled={isLoading}
            >
              🔑 Quick-Fill Seed Admin Account
            </button>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-text/50 mt-6">
          New patient?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Register patient account
          </Link>
        </p>
      </div>
    </div>
  );
}
