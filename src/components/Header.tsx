/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, ShieldCheck, Lock, X, Key } from 'lucide-react';

const VALID_ADMIN_PASSCODES = ['ADMIN2026', 'ISLAMIA2026', 'ADMIN789'];

export const Header: React.FC = () => {
  const { currentRole, setCurrentRole, currentUser, opMode, setOpMode, showToast } = useApp();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleAdminClick = () => {
    const isSessionAuthorized = sessionStorage.getItem('admin_authorized') === 'true';
    if (currentUser?.role === 'admin' || isSessionAuthorized) {
      setCurrentRole('admin');
      setOpMode('admin');
    } else {
      setPasscode('');
      setError('');
      setShowAdminModal(true);
    }
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_ADMIN_PASSCODES.includes(passcode.trim().toUpperCase())) {
      sessionStorage.setItem('admin_authorized', 'true');
      setShowAdminModal(false);
      setCurrentRole('admin');
      setOpMode('admin');
      showToast({ type: 'success', message: 'Unlocked Admin Access.' });
    } else {
      setError('Invalid Admin Passcode');
    }
  };

  return (
    <>
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div>
            <span className="font-serif text-xl font-bold text-slate-850">Islamia Guest House</span>
            <span className="block text-[10px] text-teal-600 font-mono font-bold uppercase">
              Dhanmondi • {currentRole.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCurrentRole('guest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                currentRole === 'guest' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-500" />
              <span>Guest View</span>
            </button>

            {/* UI Element Hiding: Guest রোল থাকলে নিচের বাটনগুলো হাইড থাকবে */}
            {currentRole !== 'guest' && (
              <>
                <button
                  onClick={() => {
                    setCurrentRole('staff');
                    setOpMode('receptionist');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    currentRole === 'staff' && opMode !== 'admin' ? 'bg-slate-800 text-white' : 'text-slate-500'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  <span>Front Desk</span>
                </button>

                <button
                  onClick={handleAdminClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    opMode === 'admin' ? 'bg-teal-600 text-white' : 'text-slate-500'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Panel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative">
            <button onClick={() => setShowAdminModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold font-serif">
              <Lock className="w-5 h-5 text-amber-600" />
              <span>Admin Passcode Required</span>
            </div>
            {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
            <form onSubmit={handleVerifyPasscode} className="space-y-3">
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Passcode"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-mono"
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
