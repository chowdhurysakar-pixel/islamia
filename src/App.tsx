/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { GuestView } from './components/GuestView';
import { StaffView } from './components/StaffView';
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
  const { currentRole, isLoading, currentUser, isFirebaseActive, loginWithGoogle, logout } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">
            Opening Islamia Guest House Registry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* 1. Header with simulation trigger */}
      <Header />

      {/* 2. Primary Portal Sandbox Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        
        {/* Dynamic Context Header Tag */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200/50">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentRole === 'staff' ? 'bg-slate-800' : 'bg-teal-500'}`} />
              <h2 className="text-xl font-serif font-semibold text-slate-800">
                {currentRole === 'staff' ? 'Receptionist & Front Desk (Islamia Guest House)' : 'Guest Reservation Lobby'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentRole === 'staff' 
                ? 'Book rooms via Front Desk, manage guest invoices, and review local booking records in Dhaka Dhanmondi.' 
                : 'Browse room inventory, check real-time pricing, and arrange stays at Islamia Guest House.'}
            </p>
          </div>

          {/* User Sign-In/Out Quick Interface */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-white p-1.5 pr-3 rounded-full border border-slate-100 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[11px] font-semibold text-slate-800 block leading-none">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono block leading-none mt-0.5 capitalize">{currentUser.role}</span>
                </div>
                <button
                  id="auth-logout-btn"
                  onClick={logout}
                  title="Sign out of system"
                  className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600 ml-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="auth-login-btn"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Sign In with Gmail</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Switcher Content */}
        {currentRole === 'staff' ? (
          <StaffView />
        ) : (
          <GuestView />
        )}
      </main>

      {/* 4. Elegant Brand Footer */}
      <footer className="border-t border-slate-150 bg-white/70 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">
              &copy; 2026 Islamia Guest House, Dhaka. All rights reserved.
            </p>
            {currentRole === 'guest' ? (
              <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                বাড়ি নং ৫৫/সি/১, রোড নং ৯/এ, ধানমন্ডি, ঢাকা - ১২০৯ (House No: 55/C/1, Road No: 9/A, Dhanmondi, Dhaka - 1209)
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                Islamia Guest House Dhanmondi, Dhaka. Secure Front Desk & billing manager.
              </p>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono text-center sm:text-right">
            <span>Built with React + Vite + Tailwind CSS</span>
          </div>
        </div>
      </footer>
      {/* Gmail Login Portal Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-150/80 flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                id="close-login-modal-btn"
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-900 font-bold text-lg font-mono">
                  G
                </div>
                <h3 className="font-serif text-lg font-semibold tracking-tight">Gmail Secure Auth Portal</h3>
              </div>
              <p className="text-xs text-slate-300">
                Islamia Guest House • Dhanmondi, Dhaka
              </p>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed text-center mb-2">
                Select your designated role to authorize access and synchronize online booking records with your Google account.
              </p>
              
              {/* Option 1: HR Manager */}
              <button
                id="login-as-hr-btn"
                onClick={async () => {
                  await loginWithGoogle('admin');
                  setShowLoginModal(false);
                }}
                className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50/50 text-left transition group"
              >
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Sign In as HR Manager</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase font-sans tracking-wide shrink-0">HR</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Access human resources database, custom rate sheets, and full historical guest audit files.
                  </p>
                </div>
              </button>

              {/* Option 2: Front Desk Staff */}
              <button
                id="login-as-staff-btn"
                onClick={async () => {
                  await loginWithGoogle('staff');
                  setShowLoginModal(false);
                }}
                className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50/50 text-left transition group"
              >
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-100 transition shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Sign In as Front Desk Staff</span>
                    <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase font-sans tracking-wide shrink-0">Staff</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Manage real-time check-ins/outs, register walk-in guests, dispatch room service, and print invoices.
                  </p>
                </div>
              </button>

              {/* Option 3: Online Booking Guest */}
              <button
                id="login-as-guest-btn"
                onClick={async () => {
                  await loginWithGoogle('guest');
                  setShowLoginModal(false);
                }}
                className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50/50 text-left transition group"
              >
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-100 transition shrink-0 mt-0.5">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Sign In as Booking Guest</span>
                    <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full font-extrabold uppercase font-sans tracking-wide shrink-0">Guest</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                    Create online reservations, check room pricing, request custom services, and retrieve digital checkout tickets.
                  </p>
                </div>
              </button>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isFirebaseActive ? 'Verified OAuth Stream' : 'Offline OAuth Simulator'}</span>
              </div>
              <span className="font-semibold text-slate-500">Google Accounts</span>
            </div>
          </div>
        </div>
      )}

      {/* Elegant System Toast Notifications */}
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
