'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, useTheme } from '@/components/AuthProvider';
import { Sun, Moon, Shield, Calendar, Activity, ClipboardList, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-bg text-text">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[150px] pointer-events-none" />

      {/* Premium Navbar */}
      <header className="sticky top-0 z-50 glass w-full px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-primary flex items-center justify-center p-2 rounded-lg text-bg shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">Cure</span>
            <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">v1.0</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-text/5 hover:bg-text/10 transition-all text-text cursor-pointer"
              title="Toggle theme"
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            {user ? (
              <Link
                href={`/dashboard/${user.role}`}
                className="bg-primary text-bg font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
              >
                Dashboard <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="font-medium text-text/80 hover:text-text px-4 py-2.5 rounded-xl hover:bg-text/5 transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-bg font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 md:py-24 flex flex-col justify-center items-center text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in border border-primary/20">
          <Shield className="h-4 w-4" /> SECURE HEALTHCARE INFRASTRUCTURE
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-8 bg-gradient-to-br from-text via-text to-primary/80 bg-clip-text text-transparent">
          The Clinical Operations Platform for Modern Healthcare.
        </h1>

        <p className="text-lg md:text-xl text-text/70 max-w-2xl mb-10 leading-relaxed">
          Streamline scheduling transactions, encrypt medical notes, manage patient clinical histories, and trace operations with an immutable security audit logging ledger.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16">
          {user ? (
            <Link
              href={`/dashboard/${user.role}`}
              className="w-full sm:w-auto bg-primary text-bg font-medium px-8 py-4 rounded-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              Go to Dashboard <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto bg-primary text-bg font-medium px-8 py-4 rounded-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                Get Started <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto bg-text/5 border border-text/10 text-text font-medium px-8 py-4 rounded-xl hover:bg-text/10 transition-all flex items-center justify-center"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-5xl">
          {[
            { label: 'System Uptime', val: '99.99%' },
            { label: 'Booking Isolation', val: '100%' },
            { label: 'Transactional Speed', val: '< 50ms' },
            { label: 'Immutable Ledger', val: 'Enabled' },
          ].map((stat, idx) => (
            <div key={idx} className="glass p-6 rounded-2xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl md:text-3xl font-extrabold text-primary mb-1">{stat.val}</span>
              <span className="text-xs md:text-sm text-text/60 font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-text/[0.02] border-t border-text/5 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Engineered for absolute reliability</h2>
            <p className="text-text/70">CURE implements critical operation workflows built for defensive security and data integrity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Core 1 */}
            <div className="glass p-8 rounded-2xl flex flex-col shadow-sm">
              <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Booking Engine</h3>
              <p className="text-text/70 mb-4 text-sm leading-relaxed">
                Conflict-preventing real-time clinical scheduler. Employs database pessimistic locking (`FOR UPDATE`) and active unique indexes to prevent double bookings.
              </p>
              <ul className="space-y-2 mt-auto text-xs text-text/80 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Pessimistic Write Locking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> State Machine Enforcement</li>
              </ul>
            </div>

            {/* Core 2 */}
            <div className="glass p-8 rounded-2xl flex flex-col shadow-sm">
              <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-6">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Clinical Records</h3>
              <p className="text-text/70 mb-4 text-sm leading-relaxed">
                Comprehensive patient dashboards, historical diagnostic records, and secure clinical logs. Fully encrypted, sanitized, and filterable.
              </p>
              <ul className="space-y-2 mt-auto text-xs text-text/80 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Full Medical History Log</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Categorized Clinical Notes</li>
              </ul>
            </div>

            {/* Core 3 */}
            <div className="glass p-8 rounded-2xl flex flex-col shadow-sm">
              <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Audit Logs Ledger</h3>
              <p className="text-text/70 mb-4 text-sm leading-relaxed">
                Immutable, administrative log tracking all critical database records alterations (User, Patient, Medical History, Bookings) to capture operational history.
              </p>
              <ul className="space-y-2 mt-auto text-xs text-text/80 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Zero UPDATE/DELETE Exposure</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Strict Delta (Old/New) Recording</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-text/5 py-8 px-6 text-center text-sm text-text/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold uppercase tracking-wider text-xs">CURE healthcare</span>
          </div>
          <div>© 2026 CURE. All rights reserved. Secure Health Operations.</div>
        </div>
      </footer>
    </div>
  );
}
