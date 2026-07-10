/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  Mail, Key, User, Shield, Users, Hotel, 
  ArrowRight, Loader2, Lock, CheckCircle2, 
  Sparkles, AlertCircle, RefreshCw, LogIn, Clipboard
} from 'lucide-react';

export const SecureGateway: React.FC = () => {
  const { sendOtp, verifyOtp, isFirebaseActive } = useApp();
  
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('guest');
  const [otp, setOtp] = useState('');
  
  // State flags
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Simulated OTP box for pristine testing experience
  const [lastOtpReceived, setLastOtpReceived] = useState('');

  // Countdown handler
  useEffect(() => {
    let interval: any;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // Clear errors when changing tabs
  const handleTabChange = (tab: 'signup' | 'signin') => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setOtp('');
    setOtpSent(false);
    setTimer(0);
    setLastOtpReceived('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your Gmail address.');
      return;
    }
    
    if (!trimmedEmail.toLowerCase().includes('@gmail.com') && !trimmedEmail.toLowerCase().endsWith('@gmail.com')) {
      setError('Only @gmail.com addresses are supported for secure verification.');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSending(true);
    try {
      const res = await sendOtp(trimmedEmail, name, role, activeTab === 'signup');
      if (res.success) {
        setOtpSent(true);
        setTimer(60);
        if (res.otpCode) {
          setLastOtpReceived(res.otpCode);
        }
        setSuccess(`A 6-digit verification OTP has been generated for ${trimmedEmail}.`);
      } else {
        setError(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending OTP.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyOtp(email, trimmedOtp, activeTab === 'signup', name, role);
      if (res.success) {
        setSuccess(activeTab === 'signup' ? 'Sign up successful!' : 'Sign in successful!');
      } else {
        setError(res.error || 'OTP Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center shadow-xl shadow-teal-500/20 ring-4 ring-teal-500/10 mb-4 animate-pulse">
            <Hotel className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
            Islamia Guest House
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono tracking-wider uppercase">
            Dhaka Dhanmondi • Secure Gateway Portal
          </p>
        </div>

        {/* Card Content */}
        <div className="mt-8 bg-slate-950/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          
          {/* Top Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'signup'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Sign Up (Register)
            </button>
            <button
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'signin'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Secure Sign In
            </button>
          </div>

          <div className="p-8 space-y-6">
            
            {/* Context/Instruction Text */}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              {activeTab === 'signup'
                ? 'Create a unified secure profile with your name, role, and Gmail OTP verification. Everybody needs to register first to access system databases.'
                : 'Enter your registered Gmail address to request a secure 6-digit login OTP code.'}
            </p>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* OTP Verification Simulated Code Tray (In-app Helper Box) */}
            {otpSent && lastOtpReceived && (
              <div className="p-4 bg-slate-900 border border-teal-500/20 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-teal-400 tracking-wider uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Simulated Gmail Server
                  </span>
                  <button
                    onClick={() => copyToClipboard(lastOtpReceived)}
                    className="text-[9px] text-slate-400 hover:text-teal-400 font-mono flex items-center gap-1 transition"
                    title="Copy OTP Code"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>Copy Code</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    Your verification OTP code is:
                  </p>
                  <span className="text-lg font-mono font-bold text-white tracking-widest px-3 py-1 bg-teal-500/10 rounded-lg border border-teal-500/20">
                    {lastOtpReceived}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono">
                  * Note: In a live environment, this was dispatched to your inbox. You can also click the mailto link in the system toast!
                </p>
              </div>
            )}

            {/* MAIN FORMS */}
            {!otpSent ? (
              // STEP 1: Enter details and trigger OTP
              <form onSubmit={handleSendOtp} className="space-y-4">
                {activeTab === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 focus:border-teal-500 text-white rounded-xl text-xs transition placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Gmail Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 focus:border-teal-500 text-white rounded-xl text-xs transition placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    * Authenticated secure Gmail validation required.
                  </p>
                </div>

                {activeTab === 'signup' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      System Access Role
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Guest Role */}
                      <button
                        type="button"
                        onClick={() => setRole('guest')}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-center ${
                          role === 'guest'
                            ? 'border-teal-500 bg-teal-500/5 text-teal-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Guest</span>
                      </button>

                      {/* Staff Role */}
                      <button
                        type="button"
                        onClick={() => setRole('staff')}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-center ${
                          role === 'staff'
                            ? 'border-teal-500 bg-teal-500/5 text-teal-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Staff</span>
                      </button>

                      {/* Admin/HR Role */}
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-center ${
                          role === 'admin'
                            ? 'border-teal-500 bg-teal-500/5 text-teal-400'
                            : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] font-bold">HR Manager</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>Send Gmail Verification OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // STEP 2: Enter OTP and finalize
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300">
                      Enter 6-Digit Verification Code
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Sent to {email}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 focus:border-teal-500 text-white rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none"
                    />
                  </div>
                </div>

                {/* Verify Code button */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-slate-950" />
                      <span>Verify & Complete {activeTab === 'signup' ? 'Registration' : 'Sign In'}</span>
                    </>
                  )}
                </button>

                {/* Resend and go back option */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="text-[10px] font-semibold text-slate-400 hover:text-white transition"
                  >
                    ← Edit Gmail or Details
                  </button>

                  <button
                    type="button"
                    disabled={timer > 0 || isSending}
                    onClick={handleSendOtp}
                    className="text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition flex items-center gap-1 disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
                    <span>
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                    </span>
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Card Footer Info */}
          <div className="bg-slate-950 px-8 py-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>Security Server v4.5</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isFirebaseActive ? 'Firestore Security Live' : 'Sandbox Emulator'}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
