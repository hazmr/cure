'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth, useTheme } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Activity,
  LogOut,
  Sun,
  Moon,
  Loader2,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface SidebarMenuProps {
  user: {
    role: 'admin' | 'nurse' | 'patient';
  };
}

function SidebarMenu({ user }: SidebarMenuProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || '';

  const getLinkClass = (tabName: string) => {
    const isTabActive = currentTab === tabName;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
      isTabActive
        ? 'bg-primary/10 text-primary'
        : 'text-text/70 hover:bg-text/5 hover:text-text'
    }`;
  };

  return (
    <nav className="flex-1 p-4 flex flex-col gap-1.5">
      <span className="text-[10px] text-text/40 font-bold uppercase tracking-wider px-3 mb-1.5">Console Menu</span>
      
      <Link
        href={`/dashboard/${user.role}`}
        className={getLinkClass('')}
      >
        <LayoutDashboard className="h-4.5 w-4.5" /> Primary Dashboard
      </Link>

      {user.role === 'patient' && (
        <>
          <Link
            href="/dashboard/patient?tab=bookings"
            className={getLinkClass('bookings')}
          >
            <Calendar className="h-4.5 w-4.5" /> Bookings Engine
          </Link>
          <Link
            href="/dashboard/patient?tab=records"
            className={getLinkClass('records')}
          >
            <ClipboardList className="h-4.5 w-4.5" /> Clinical Files
          </Link>
        </>
      )}

      {user.role === 'nurse' && (
        <>
          <Link
            href="/dashboard/nurse?tab=patients"
            className={getLinkClass('patients')}
          >
            <UserCheck className="h-4.5 w-4.5" /> Patient Lookups
          </Link>
          <Link
            href="/dashboard/nurse?tab=records"
            className={getLinkClass('records')}
          >
            <ClipboardList className="h-4.5 w-4.5" /> Clinical Notes
          </Link>
        </>
      )}

      {user.role === 'admin' && (
        <>
          <Link
            href="/dashboard/admin?tab=patients"
            className={getLinkClass('patients')}
          >
            <UserCheck className="h-4.5 w-4.5" /> Patient Profiles
          </Link>
          <Link
            href="/dashboard/admin?tab=scheduling"
            className={getLinkClass('scheduling')}
          >
            <Calendar className="h-4.5 w-4.5" /> Network Scheduler
          </Link>
          <Link
            href="/dashboard/admin?tab=audit"
            className={getLinkClass('audit')}
          >
            <ShieldAlert className="h-4.5 w-4.5" /> System Auditing
          </Link>
        </>
      )}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
    } catch (e) {
      toast.error('Error signing out.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-10 w-10 text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 text-primary/60 animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase text-text/50">Establishing Secure Sync...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirects handled inside AuthProvider
  }

  const roleLabel = {
    admin: 'Operational Admin',
    nurse: 'Assigned Clinical Nurse',
    patient: 'Medical Patient',
  }[user.role];

  const roleColor = {
    admin: 'bg-red-500/10 text-red-500 border border-red-500/20',
    nurse: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    patient: 'bg-primary/10 text-primary border border-primary/20',
  }[user.role];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-text transition-colors duration-200">
      {/* Dashboard Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-text/5 flex flex-col glass z-20">
        {/* Brand */}
        <div className="p-6 border-b border-text/5 flex items-center gap-2">
          <div className="bg-primary flex items-center justify-center p-2 rounded-lg text-bg shadow-md shadow-primary/25">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight uppercase">CURE</span>
          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full uppercase">Ops</span>
        </div>

        {/* User context card */}
        <div className="p-6 border-b border-text/5 flex flex-col gap-2 bg-text/[0.01]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase border border-primary/15">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm truncate leading-tight">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-text/50 truncate mt-0.5">{user.email}</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg w-fit mt-1 text-center ${roleColor}`}>
            {roleLabel}
          </span>
        </div>

        {/* Navigation Sidebar Options */}
        <Suspense fallback={
          <div className="flex-1 p-6 flex justify-center items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
          </div>
        }>
          <SidebarMenu user={user} />
        </Suspense>

        {/* Settings Footer in Sidebar */}
        <div className="p-4 border-t border-text/5 flex flex-col gap-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-text/5 text-text/80 hover:text-text cursor-pointer transition-all"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-300" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
              <span>Theme Preference</span>
            </span>
            <span className="text-[10px] text-text/40 bg-text/5 px-2 py-0.5 rounded uppercase font-bold">
              {theme}
            </span>
          </button>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/5 cursor-pointer transition-all"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
