/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentRole, toggleRole, currentUser, isFirebaseActive, opMode } = useApp();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
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
              Dhanmondi, Dhaka
              {currentRole === 'guest' 
                ? ' • Guest View' 
                : opMode === 'hr' 
                  ? ' • HR Manager' 
                  : ' • Front Desk'
              }
            </span>
          </div>

          {/* Time & Server Status Indicator */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>{time}</span>
            </div>
            {currentRole !== 'guest' && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${isFirebaseActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-slate-500">
                  {isFirebaseActive ? 'Google Cloud Active' : 'Offline Local Sandbox'}
                </span>
              </div>
            )}
          </div>

          {/* Role simulation Toggle bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100/85 p-1 rounded-xl border border-slate-200/50">
              <button
                id="role-switch-guest-btn"
                onClick={() => currentRole !== 'guest' && toggleRole()}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  currentRole === 'guest'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-teal-500" />
                <span>Guest</span>
              </button>
              <button
                id="role-switch-staff-btn"
                onClick={() => currentRole !== 'staff' && toggleRole()}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  currentRole === 'staff'
                    ? 'bg-slate-850 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Receptionist / Staff</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
};
