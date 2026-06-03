/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { GuestView } from './components/GuestView';
import { StaffView } from './components/StaffView';
import { Loader2, Hotel, Sparkles, LogOut, LogIn, AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentRole, isLoading, currentUser, isFirebaseActive, loginWithGoogle, logout } = useApp();

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
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Auth</span>
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
            <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
              Islamia Guest House Dhanmondi, Dhaka. Secure Front Desk & billing manager.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono text-center sm:text-right">
            <span>Built with React + Vite + Tailwind CSS</span>
          </div>
        </div>
      </footer>
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
