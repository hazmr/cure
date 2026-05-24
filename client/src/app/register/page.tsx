'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Activity, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.warning('Please fill in all registration fields.');
      return;
    }

    if (password.length < 10) {
      toast.error('Security Rule: Password must contain at least 10 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password);
      toast.success('Patient account registered successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-bg text-text px-4 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity mb-4">
            <div className="bg-primary flex items-center justify-center p-2 rounded-xl text-bg shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight uppercase">CURE</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight">Create your account</h2>
          <p className="text-sm text-text/60 mt-1">Register a patient profile to schedule visits and view records</p>
        </div>

        {/* Register Card */}
        <div className="glass p-8 rounded-3xl shadow-xl flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text/80 uppercase tracking-wider">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text/40">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text/80 uppercase tracking-wider">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text/40">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

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
                  placeholder="john.doe@example.com"
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
                  placeholder="Minimum 10 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  disabled={isLoading}
                  minLength={10}
                  required
                />
              </div>
              <p className="text-[10px] text-text/50">For security reasons, your password must be at least 10 characters.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-bg font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Registering...
                </>
              ) : (
                <>
                  Register <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-text/50 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
