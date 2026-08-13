/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { GuestView } from './components/GuestView';
import { StaffView } from './components/StaffView';
import { AdminPanel } from './components/AdminPanel';
import { SecureGateway } from './components/SecureGateway';
import { Loader2, Hotel, Sparkles, LogOut, LogIn, AlertCircle, Shield, Users, User, X, Mail, CheckCircle, ExternalLink } from 'lucide-react';
import { UserRole } from './types';

const ToastNotification: React.FC = () => {
  const { activeToast, dismissToast } = useApp();

  React.useEffect(() => {
    if (activeToast && activeToast.type !== 'email') {
      const timer = setTimeout(() => {
        dismissToast();
      }, activeToast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl flex flex-col gap-3 animate-scaleUp">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl shrink-0">
          {activeToast.type === 'email' ? (
            <Mail className="w-5 h-5 text-teal-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-teal-400" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold font-mono text-slate-400 tracking-wider uppercase">
            {activeToast.type === 'email' ? 'System Notification' : 'Success'}
          </p>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {activeToast.message}
          </p>
        </div>
        <button
          onClick={dismissToast}
          className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeToast.emailAction && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <a
            href={activeToast.emailAction.mailtoUrl}
            className="flex-1 text-center py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
            <span>Open Email Draft</span>
          </a>
          <button
            onClick={dismissToast}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentRole, isLoading, currentUser, logout, opMode, activeGuestsCount } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#af8a52] mx-auto" />
          <p className="text-xs font-mono font-bold tracking-wider text-[#0e2b33] uppercase">
            Opening Islamia Guest House Registry...
          </p>
        </div>
      </div>
    );
  }

  // Staff or Admin View
  if (currentRole === 'staff' || currentRole === 'admin') {
    if (!currentUser) {
      return (
        <>
          <SecureGateway />
          <ToastNotification />
        </>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header with Role Simulation Switcher */}
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
          {/* Dynamic Context Header Tag */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200/50">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${opMode === 'admin' ? 'bg-amber-500' : 'bg-slate-800'}`} />
                <h2 className="text-xl font-serif font-semibold text-slate-800">
                  {opMode === 'admin' 
                    ? 'Executive Admin Control Center' 
                    : opMode === 'hr' 
                      ? 'HR Historical Guest Archives & Registries' 
                      : 'Receptionist & Front Desk (Islamia Guest House)'
                  }
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {opMode === 'admin'
                  ? 'Manage revenue analytics, approve staff access, configure room tariffs, and oversee guest bookings.'
                  : 'Book rooms via Front Desk, manage guest invoices, and review local booking records in Dhanmondi.'
                }
              </p>
            </div>

            {/* User Sign-In/Out Quick Interface */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="flex items-center gap-3 bg-white p-1.5 pr-3 rounded-full border border-slate-200 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {currentUser.name.slice(0, 1)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-[11px] font-semibold text-slate-800 block leading-none">{currentUser.name}</span>
                    <span className="text-[9px] text-teal-700 font-mono font-bold block leading-none mt-0.5">
                      {currentRole === 'guest' ? 'Guest' : opMode === 'admin' ? 'Admin Panel' : opMode === 'hr' ? 'HR Manager' : 'Staff / Front Desk'}
                    </span>
                  </div>
                  <button
                    id="auth-logout-btn"
                    onClick={logout}
                    title="Sign out of system"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-full text-xs font-semibold transition-all cursor-pointer ml-1.5 active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {opMode === 'admin' ? <AdminPanel /> : <StaffView />}
        </main>

        <footer className="border-t border-slate-200/80 bg-white/80 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              &copy; 2026 Islamia Guest House Dhanmondi. Secure Front Desk &amp; billing manager.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              <span>Dedicated to Islamia Guest House</span>
            </div>
          </div>
        </footer>
        <ToastNotification />
      </div>
    );
  }

  // Guest View: Render full luxury hotel website directly
  return (
    <div className="min-h-screen bg-[#f8f4ec] w-full">
      <GuestView />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
