/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, Clock, ShieldCheck, Lock, X, Key, AlertCircle, LogOut } from 'lucide-react';

const VALID_ADMIN_PASSCODES = ['ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', '123456', 'ISLAMIA2026', 'STAFF789'];

export const Header: React.FC = () => {
  const { currentRole, toggleRole, currentUser, opMode, setOpMode, showToast, logout } = useApp();
  const [time, setTime] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  
  // Admin Passcode Modal
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState<boolean>(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState<string>('');
  const [adminPasscodeError, setAdminPasscodeError] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminAccessClick = () => {
    const isAlreadyAdminUser = currentUser?.role === 'admin';
    const isSessionUnlocked = sessionStorage.getItem('admin_authorized') === 'true';

    if (isAlreadyAdminUser || isSessionUnlocked) {
      if (currentRole === 'guest') toggleRole();
      setOpMode('admin');
    } else {
      setAdminPasscodeInput('');
      setAdminPasscodeError('');
      setShowAdminPasscodeModal(true);
    }
  };

  const handleVerifyAdminPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasscodeError('');
    const cleanCode = adminPasscodeInput.trim().toUpperCase();

    if (VALID_ADMIN_PASSCODES.includes(cleanCode)) {
      sessionStorage.setItem('admin_authorized', 'true');
      setShowAdminPasscodeModal(false);
      if (currentRole === 'guest') toggleRole();
      setOpMode('admin');
      showToast({
        type: 'success',
        message: '🔓 Admin Control Center unlocked successfully.'
      });
    } else {
      setAdminPasscodeError('Access Denied: Invalid Admin Passcode. Guest, regular Staff, and HR accounts cannot access Admin controls without authorization.');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err: any) {
      console.error("Signout error in Header:", err);
      showToast({
        type: 'error',
        message: `Sign out failed: ${err?.message || 'Error logging out.'}`
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo Brand / Identity */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm shadow-teal-600/30">
                  I
                </div>
                <span className="font-serif text-xl tracking-tight font-semibold text-slate-850">
                  Islamia Guest House
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-teal-600 font-mono font-bold mt-1">
                Dhanmondi
                {currentRole === 'guest' 
                  ? ' • Guest View' 
                  : opMode === 'admin'
                    ? ' • Admin Control Center'
                    : opMode === 'hr' 
                      ? ' • HR Manager' 
                      : ' • Front Desk'
                }
              </span>
            </div>

            {/* Time Indicator */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>{time}</span>
              </div>
            </div>

            {/* Role & Operational Mode Switcher & User Profile Logout */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="flex items-center gap-2 bg-slate-50/90 p-1.5 pl-2.5 pr-2 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {currentUser.name ? currentUser.name.slice(0, 1) : 'U'}
                  </div>
                  <div className="text-left hidden lg:block pr-1">
                    <span className="text-[11px] font-semibold text-slate-800 block leading-tight">
                      {currentUser.name || 'Islamia Executive'}
                    </span>
                    <span className="text-[9px] text-teal-700 font-mono font-bold block leading-none mt-0.5">
                      {opMode === 'admin' ? 'Islamia Admin Executive' : opMode === 'hr' ? 'HR Manager' : 'Front Desk Staff'}
                    </span>
                  </div>
                  <button
                    id="header-logout-btn"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    title="Sign Out / Return to Login"
                    className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-600 hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}

              <div className="flex items-center bg-slate-100/85 p-1 rounded-xl border border-slate-200/50">
                <button
                  id="role-switch-guest-btn"
                  onClick={() => {
                    if (currentRole !== 'guest') toggleRole();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                    currentRole === 'guest'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-teal-500" />
                  <span className="hidden sm:inline">Guest</span>
                </button>

                <button
                  id="role-switch-staff-btn"
                  onClick={() => {
                    if (currentRole === 'guest') toggleRole();
                    setOpMode('receptionist');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                    currentRole === 'staff' && opMode !== 'admin'
                      ? 'bg-slate-850 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  <span>Front Desk / Staff</span>
                </button>

                <button
                  id="role-switch-admin-btn"
                  onClick={handleAdminAccessClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    currentRole === 'staff' && opMode === 'admin'
                      ? 'bg-teal-600 text-white shadow-sm font-bold'
                      : 'text-slate-500 hover:text-teal-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Panel</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Admin Passcode Gate Modal */}
      {showAdminPasscodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAdminPasscodeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-800">
                  Admin Panel Security Gate
                </h3>
                <p className="text-xs text-slate-500">
                  Restricted Access • Admin Credentials Required
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              The Admin Panel is secured from Guests, regular Staff, and HR accounts. Enter the <strong>Admin Executive Passcode</strong> to proceed.
            </p>

            {adminPasscodeError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{adminPasscodeError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAdminPasscode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Admin Master Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminPasscodeInput}
                    onChange={(e) => setAdminPasscodeInput(e.target.value)}
                    placeholder="Enter Admin Passcode"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs font-mono font-bold transition focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPasscodeModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Unlock Admin Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
