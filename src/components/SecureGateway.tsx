/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';
import { 
  Mail, Key, User, Users, Hotel, 
  ArrowRight, Loader2, CheckCircle2, 
  AlertCircle, ShieldCheck, Phone, KeyRound,
  Eye, EyeOff, X
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const VALID_STAFF_PASSCODES = [
  'ISLAMIA-STAFF-2026', 'STAFF789', 'ISLAMIA-DESK-55', 'ISLAMIA2026', '123456', 
  'STAFF-SECRET', 'STAFF123', 'STAFF', 'ISLAMIA', 'ISLAMIAGUESTHOUSE@GMAIL.COM'
];
const VALID_ADMIN_PASSCODES = [
  'ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', '123456', 'ISLAMIA2026', 
  'ADMIN', 'ISLAMIA', 'ADMIN123', 'ISLAMIA-GUESTHOUSE', 'ISLAMIAGUESTHOUSE@GMAIL.COM'
];

export const SecureGateway: React.FC = () => {
  const { isFirebaseActive, localLogin, showToast, setOpMode, sendPasswordResetLink } = useApp();
  
  // Role tabs: 'staff' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<'staff' | 'admin'>('staff');
  
  // Nested form mode for staff & admin
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Staff Fields
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffSecretPasscode, setStaffSecretPasscode] = useState('');
  
  // Admin / HR Fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMasterKey, setAdminMasterKey] = useState('');

  // Forgot Password / Reset Account Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetMethod, setResetMethod] = useState<'master_key' | 'email'>('master_key');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMasterKey, setForgotMasterKey] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotError, setForgotError] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear notices and states when switching tabs
  const handleTabChange = (role: 'staff' | 'admin') => {
    setActiveRoleTab(role);
    setError('');
    setSuccess('');
    setAuthMode('signin');
    setShowPassword(false);
  };

  // Open Forgot Password Dialog
  const handleOpenForgotPassword = (defaultEmail?: string) => {
    setForgotEmail(defaultEmail || (activeRoleTab === 'admin' ? adminEmail : staffEmail) || '');
    setForgotMasterKey(activeRoleTab === 'admin' ? adminMasterKey : staffSecretPasscode);
    setResetMethod('master_key');
    setForgotStatus('');
    setForgotError('');
    setShowForgotPasswordModal(true);
  };

  // Submit Password Reset Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotStatus('');

    const emailToReset = forgotEmail.trim().toLowerCase();
    if (!emailToReset || !emailToReset.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    if (resetMethod === 'master_key') {
      const cleanKey = forgotMasterKey.trim().toUpperCase();
      const isAdminKey = VALID_ADMIN_PASSCODES.includes(cleanKey);
      const isStaffKey = VALID_STAFF_PASSCODES.includes(cleanKey);

      if (!isAdminKey && !isStaffKey) {
        setForgotError('Invalid Admin Master Key or Staff Passcode. Try ISLAMIA2026, ADMIN2026, or STAFF789.');
        setForgotLoading(false);
        return;
      }

      const roleToUse: UserRole = isAdminKey ? 'admin' : 'staff';
      const defaultName = isAdminKey ? 'Islamia Admin Executive' : 'Front Desk Staff';

      sessionStorage.setItem('admin_authorized', 'true');
      localLogin(roleToUse, emailToReset, defaultName);
      if (roleToUse === 'admin') setOpMode('admin');

      setShowForgotPasswordModal(false);
      showToast({
        type: 'success',
        message: `🔓 Account Unlocked via Master Key Verification! Welcome back (${emailToReset}).`
      });
      setForgotLoading(false);
      return;
    }

    // Email Reset Method
    try {
      const result = await sendPasswordResetLink(emailToReset);
      if (result.success) {
        setForgotStatus(`পাসওয়ার্ড রিসেট ইমেইল রিফ্লেক্ট করা হয়েছে: ${emailToReset}। আপনার জিমেইল ইনবক্স এবং স্প্যাম/জাঙ্ক ফোল্ডারটি চেক করুন।`);
      } else {
        setForgotError(`${result.error || 'পাসওয়ার্ড রিসেট লিংক পাঠাতে ব্যর্থ হয়েছে।'} টিপস: আপনি চাইলে উপরের "Instant Master Access" অপশন ব্যবহার করে মাস্টির কি দিয়ে সরাসরি লগইন করতে পারেন।`);
      }
    } catch (err: any) {
      setForgotError(`${err.message || 'Failed to dispatch password reset request.'}`);
    } finally {
      setForgotLoading(false);
    }
  };

  // Staff / Admin Submit handler
  const handleSecureAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const isAdmin = activeRoleTab === 'admin';
    const email = isAdmin ? adminEmail.trim() : staffEmail.trim();
    const phone = isAdmin ? adminPhone.trim() : staffPhone.trim();
    const password = isAdmin ? adminPassword : staffPassword;
    const name = isAdmin ? adminName.trim() : staffName.trim();
    const role: UserRole = isAdmin ? 'admin' : 'staff';

    if (authMode === 'signup' && !name) {
      setError('Please enter your Full Name.');
      return;
    }
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (authMode === 'signup' && !phone) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const emailLower = email.toLowerCase();

    // Security Verification:
    if (isAdmin) {
      const cleanAdminKey = adminMasterKey.trim().toUpperCase();
      const isKeyValid = VALID_ADMIN_PASSCODES.includes(cleanAdminKey);

      if (authMode === 'signup' && !isKeyValid) {
        setError('Access Denied: Creating an Admin account requires a valid Admin Master Key.');
        return;
      }

      if (authMode === 'signin' && !isKeyValid) {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'admin');

        if (!existing && !isKeyValid) {
          setError('Access Denied: Please enter a valid Admin Master Passcode to log in as Admin.');
          return;
        }
      }
    } else {
      const cleanSecretPasscode = staffSecretPasscode.trim().toUpperCase();
      const isSecretValid = VALID_STAFF_PASSCODES.includes(cleanSecretPasscode);
      
      if (authMode === 'signup' && !isSecretValid) {
        setError('Access Denied: Staff registration requires a valid Staff Secret Passcode.');
        return;
      }

      if (authMode === 'signin' && !isSecretValid) {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'staff');
        
        if (!existing || (!existing.hrApproved && existing.staffSecretKey !== cleanSecretPasscode)) {
          setError('Access Denied: Staff members must enter a valid Staff Passcode or be approved by HR.');
          return;
        }
      }
    }

    setIsLoading(true);

    if (isFirebaseActive && auth && db) {
      try {
        if (authMode === 'signup') {
          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name });
            
            const newUser: UserProfile = {
              uid: userCredential.user.uid,
              email: emailLower,
              name: name,
              role: role,
              phone: phone,
              hrApproved: true
            };
            
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            
            sessionStorage.setItem('admin_authorized', 'true');
            localLogin(role, emailLower, name);
            if (role === 'admin') setOpMode('admin');

            showToast({
              type: 'success',
              message: `🔑 ${role === 'admin' ? 'Admin' : 'Staff'} account created successfully! Logged in as ${name}.`
            });
          }
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          if (userCredential.user) {
            const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
            let loggedInName = userCredential.user.displayName || (isAdmin ? 'Admin Executive' : 'Front Desk Staff');
            let loggedInRole: UserRole = role;

            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              loggedInName = data.name;
              loggedInRole = data.role;
            } else {
              const newUser: UserProfile = {
                uid: userCredential.user.uid,
                email: emailLower,
                name: loggedInName,
                role: loggedInRole,
                hrApproved: true
              };
              await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            }

            sessionStorage.setItem('admin_authorized', 'true');
            localLogin(loggedInRole, emailLower, loggedInName);
            if (loggedInRole === 'admin') setOpMode('admin');

            showToast({
              type: 'success',
              message: `👋 Welcome back, ${loggedInName}!`
            });
          }
        }
      } catch (err: any) {
        // Master Key Override Check on Sign In Failure
        const cleanKey = (isAdmin ? adminMasterKey : staffSecretPasscode).trim().toUpperCase();
        const isMasterKeyValid = isAdmin
          ? VALID_ADMIN_PASSCODES.includes(cleanKey)
          : VALID_STAFF_PASSCODES.includes(cleanKey);

        if (authMode === 'signin' && isMasterKeyValid) {
          let loggedInName = name || (isAdmin ? 'Islamia Admin Executive' : 'Front Desk Staff');
          let loggedInRole: UserRole = role;

          sessionStorage.setItem('admin_authorized', 'true');
          localLogin(loggedInRole, emailLower, loggedInName);
          if (loggedInRole === 'admin') setOpMode('admin');

          showToast({
            type: 'success',
            message: `🔑 Master Key Passcode Verified! Logged in as ${loggedInName}.`
          });
          setIsLoading(false);
          return;
        }

        let msg = err.message || 'Authentication failed.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email is already registered. Try signing in instead!';
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Incorrect password. Enter your Admin Master Key or Staff Passcode (e.g. ISLAMIA2026) to sign in immediately.';
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          msg = 'No user account found with this email. Please check your details or register first.';
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Sandbox Mode
      try {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];

        if (authMode === 'signup') {
          const exists = usersList.some(u => u.email === emailLower);
          if (exists) {
            setError('This email address is already registered. Please sign in instead.');
            setIsLoading(false);
            return;
          }

          const newUser: UserProfile = {
            uid: `local-${role}-${Date.now().toString().slice(-4)}`,
            email: emailLower,
            name: name,
            role: role,
            hrApproved: true
          };

          usersList.push(newUser);
          localStorage.setItem('hotel_registered_users', JSON.stringify(usersList));
          
          sessionStorage.setItem('admin_authorized', 'true');
          localLogin(role, emailLower, name);
          if (role === 'admin') setOpMode('admin');

          showToast({
            type: 'success',
            message: `🔑 ${role === 'admin' ? 'Admin' : 'Staff'} account created! Welcome, ${name}.`
          });
        } else {
          const found = usersList.find(u => u.email === emailLower);
          const resolvedName = found ? found.name : (isAdmin ? 'Admin Administrator' : 'Front Desk Specialist');
          
          sessionStorage.setItem('admin_authorized', 'true');
          localLogin(role, emailLower, resolvedName);
          if (role === 'admin') setOpMode('admin');

          showToast({
            type: 'success',
            message: `👋 Welcome back, ${resolvedName}!`
          });
        }
      } catch (err: any) {
        setError('Authentication failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-teal-50/80 via-slate-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-12 left-1/3 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-24 right-1/4 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header Title */}
      <div className="relative z-10 w-full max-w-xl text-center mb-6 px-4">
        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 bg-white border border-slate-200 rounded-full shadow-xs mb-3">
          <Hotel className="w-4 h-4 text-teal-600" />
          <span className="text-[11px] font-mono tracking-wider text-slate-700 uppercase font-bold">Dhanmondi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          Islamia Guest House
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium max-w-md mx-auto leading-relaxed">
          Welcome to Islamia Reception & Security Gateway. Select your role below to proceed.
        </p>
      </div>

      {/* Central Login Card Modal */}
      <div className="relative z-10 bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-xl shadow-slate-200/80 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Tabbed Navigation - 2 Tabs (Staff & Admin) */}
        <div className="bg-slate-100 p-1.5 flex border-b border-slate-200 gap-1">
          {/* Staff Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
              activeRoleTab === 'staff'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className={`w-4 h-4 ${activeRoleTab === 'staff' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>Staff Login</span>
          </button>

          {/* Admin / HR Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
              activeRoleTab === 'admin'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeRoleTab === 'admin' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>HR / Admin</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-5 bg-white">
          
          {/* Error and Success Notices */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed font-medium flex-1 space-y-2">
                <p>{error}</p>
                {error.includes('already registered') && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setError('');
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>Switch to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenForgotPassword(activeRoleTab === 'admin' ? adminEmail : staffEmail)}
                      className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Instant Master Key Access
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed font-medium">{success}</span>
            </div>
          )}

          {/* Title Header */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              {activeRoleTab === 'admin'
                ? (authMode === 'signin' ? 'Executive Admin Authentication' : 'Register Admin Account')
                : (authMode === 'signin' ? 'Staff Portal Sign In' : 'Register New Staff Profile')}
            </h3>
            <p className="text-xs text-slate-500">
              {activeRoleTab === 'admin'
                ? 'Enter your credentials and Admin Master Key to access executive controls.'
                : 'Access Front Desk room allocation, booking checkout, and bill printing.'}
            </p>

            {/* Mode Selector */}
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
                onClick={() => setAuthMode('signup')}
                className={`px-8 py-1.5 rounded-lg transition ${
                  authMode === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSecureAuth} className="space-y-3.5">
            {/* Full Name (Registration only) */}
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={activeRoleTab === 'admin' ? adminName : staffName}
                    onChange={(e) => activeRoleTab === 'admin' ? setAdminName(e.target.value) : setStaffName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Corporate Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={activeRoleTab === 'admin' ? adminEmail : staffEmail}
                  onChange={(e) => activeRoleTab === 'admin' ? setAdminEmail(e.target.value) : setStaffEmail(e.target.value)}
                  placeholder="user@islamiaguesthouse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none"
                />
              </div>
            </div>

            {/* Phone Number (Registration only) */}
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={activeRoleTab === 'admin' ? adminPhone : staffPhone}
                    onChange={(e) => activeRoleTab === 'admin' ? setAdminPhone(e.target.value) : setStaffPhone(e.target.value)}
                    placeholder="01800-000000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">Password *</label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleOpenForgotPassword(activeRoleTab === 'admin' ? adminEmail : staffEmail)}
                    className="text-[11px] font-bold text-teal-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={activeRoleTab === 'admin' ? adminPassword : staffPassword}
                  onChange={(e) => activeRoleTab === 'admin' ? setAdminPassword(e.target.value) : setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Passcode / Master Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {activeRoleTab === 'admin' ? 'Admin Master Key *' : 'Staff Passcode Key *'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={activeRoleTab === 'admin' ? adminMasterKey : staffSecretPasscode}
                  onChange={(e) => activeRoleTab === 'admin' ? setAdminMasterKey(e.target.value) : setStaffSecretPasscode(e.target.value)}
                  placeholder={activeRoleTab === 'admin' ? 'E.G. ADMIN2026' : 'E.G. STAFF123'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none uppercase font-mono"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Register Account' : 'Sign In To Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* Forgot Password / Account Recovery Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Account Recovery & Reset</h3>
                <p className="text-[11px] text-slate-500">Access gateway without waiting for email delivery</p>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Method Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  setResetMethod('master_key');
                  setForgotError('');
                  setForgotStatus('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  resetMethod === 'master_key' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Instant Master Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetMethod('email');
                  setForgotError('');
                  setForgotStatus('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  resetMethod === 'email' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Send Gmail Link
              </button>
            </div>

            {forgotStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium leading-relaxed">
                {forgotStatus}
              </div>
            )}

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium leading-relaxed">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="islamiaguesthouse@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600 font-medium"
                />
              </div>

              {resetMethod === 'master_key' ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Master Key / Passcode *</label>
                    <span className="text-[10px] text-teal-600 font-mono font-bold">E.G. ISLAMIA2026</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={forgotMasterKey}
                    onChange={(e) => setForgotMasterKey(e.target.value)}
                    placeholder="Enter ISLAMIA2026 or ADMIN2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600 font-mono uppercase"
                  />
                  <p className="text-[10px] text-slate-400">
                    Bypasses email delivery delays and unlocks your portal access immediately.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                  Notice: Firebase email dispatch sends password reset links from Google services. Please check your Gmail Inbox & Spam folder.
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-teal-700/10 active:scale-[0.98]"
                >
                  {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{resetMethod === 'master_key' ? 'Unlock & Access Portal' : 'Send Reset Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
