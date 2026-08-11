/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Lock, User, KeyRound, ArrowRight, Hotel } from 'lucide-react';

export const SecureGateway: React.FC = () => {
  const { loginStaff } = useApp();
  
  // ডিফল্টভাবে Staff Login ট্যাব সিলেক্ট থাকবে
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>('staff');

  // স্টাফ এবং এডমিন লগইন স্টেট
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleStaffAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    const success = loginStaff(email, password);
    if (!success) {
      setErrorMsg('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0e2b33] text-white px-3 py-1 rounded-full text-xs font-semibold">
            <Hotel className="w-3.5 h-3.5 text-[#af8a52]" />
            <span>Islamia Guest House</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">
            System Access Gateway
          </h1>
          <p className="text-xs text-slate-500">
            Select your portal to log in to the management system.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Tab Selection (শুধুমাত্র Staff এবং Admin) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'staff' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>Staff Login</span>
            </button>
            <button
              onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'admin' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>HR / Admin</span>
            </button>
          </div>

          {/* Login Form Body */}
          <div className="p-6">
            <form onSubmit={handleStaffAdminLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-sm font-bold text-slate-800">
                  {activeTab === 'admin' ? 'Administrator Authentication' : 'Reception & Staff Portal'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter your credentials to access the system
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'admin@islamiaguesthouse.com' : 'staff@islamiaguesthouse.com'}
                    className="w-full text-xs font-medium pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e2b33] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-medium pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e2b33] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0e2b33] hover:bg-[#1a404b] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md mt-2"
              >
                <span>Authorize Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
