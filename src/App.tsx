/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { GuestView } from './components/GuestView';
import { StaffView } from './components/StaffView';
import { AdminPanel } from './components/AdminPanel';
import { SecureGateway } from './components/SecureGateway';
import { Loader2, LogOut, X, Mail, CheckCircle, ExternalLink } from 'lucide-react';

const ToastNotification: React.FC = () => {
  const { activeToast, dismissToast } = useApp();

  React.useEffect(() => {
    if (activeToast && activeToast.type !== 'email') {
      const timer = setTimeout(() => dismissToast(), activeToast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl shrink-0">
          {activeToast.type === 'email' ? <Mail className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold font-mono text-slate-400 uppercase">
            {activeToast.type === 'email' ? 'System Notification' : 'Success'}
          </p>
          <p className="text-xs text-slate-200 mt-0.5">{activeToast.message}</p>
        </div>
        <button onClick={dismissToast} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeToast.emailAction && (
        <a
          href={activeToast.emailAction.mailtoUrl}
          className="py-2 px-4 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Email Draft
        </a>
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentRole, isLoading, currentUser, logout, opMode } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#af8a52]" />
      </div>
    );
  }

  // HARD ROUTE GUARD: Guest view ONLY if role is guest
  if (currentRole === 'guest') {
    return (
      <div className="min-h-screen bg-[#f8f4ec] w-full flex flex-col">
        <Header />
        <GuestView />
        <ToastNotification />
      </div>
    );
  }

  // Login Gate for Staff/Admin
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <SecureGateway />
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-serif font-semibold text-slate-800">
              {opMode === 'admin' ? 'Executive Admin Panel' : 'Front Desk & Guest Management'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">{currentUser.name}</span>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {opMode === 'admin' ? <AdminPanel /> : <StaffView />}
      </main>
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
