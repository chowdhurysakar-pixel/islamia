/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, KeyRound, Mail, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';

export const SecureGateway: React.FC = () => {
  const { loginStaff } = useApp();

  // ডিফল্টভাবে Staff Login থাকবে
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>('staff');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcodeKey, setPasscodeKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const success = loginStaff(email, password);
    if (!success) {
      setErrorMsg('Invalid credentials or passcode key. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ec] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0e2b33]/5 border border-[#0e2b33]/10 rounded-full text-[11px] font-bold font-mono text-[#0e2b33] tracking-widest uppercase">
            <span>DHANMONDI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0e2b33]">
            Islamia Guest House
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Welcome to Islamia Reception &amp; Security Gateway. Select your role below to proceed.
          </p>
        </div>

        {/* Card Gateway Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 animate-fadeIn">
          
          {/* Navigation Tabs (শুধুমাত্র Staff Login এবং HR / Admin) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
              className={`py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'staff'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Staff Login</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
              className={`py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>HR / Admin</span>
            </button>
          </div>

          {/* Form Header Title */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-base font-bold text-slate-800">
              {activeTab === 'admin' ? 'Executive Admin Authentication' : 'Staff Portal Sign In'}
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access management controls.
            </p>

            {/* Toggle SignIn / Register Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl mt-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-8 py-1.5 rounded-lg transition ${
                  authMode === 'signin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-8 py-1.5 rounded-lg transition ${
                  authMode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {/* Staff / Admin Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Corporate Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Corporate Email <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@islamiaguesthouse.com"
                  className="w-full text-xs font-medium pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 block">
                  Password <span className="text-emerald-600">*</span>
                </label>
                <button
                  type="button"
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-medium pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Staff Passcode Key */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Staff Passcode Key <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={passcodeKey}
                  onChange={(e) => setPasscodeKey(e.target.value)}
                  placeholder="E.G. STAFF123"
                  className="w-full text-xs font-medium pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition uppercase"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 mt-2"
            >
              <span>{authMode === 'register' ? 'Register Account' : 'Sign In To Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
