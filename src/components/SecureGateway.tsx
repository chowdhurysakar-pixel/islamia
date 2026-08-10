/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';
import { 
  Mail, Key, User, Shield, Users, Hotel, 
  ArrowRight, Loader2, Lock, CheckCircle2, 
  Sparkles, AlertCircle, LogIn, Bell, Compass, 
  UserCheck, Send, Eye, EyeOff, ShieldCheck, Phone,
  UserPlus, KeyRound
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const VALID_STAFF_PASSCODES = ['ISLAMIA-STAFF-2026', 'STAFF789', 'ISLAMIA-DESK-55', 'ISLAMIA2026', '123456', 'STAFF-SECRET', 'STAFF123'];
const VALID_ADMIN_PASSCODES = ['ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', '123456', 'ISLAMIA2026'];

export const SecureGateway: React.FC = () => {
  const { isFirebaseActive, localLogin, createServiceRequest, showToast, setOpMode } = useApp();
  
  // Tab control: 'guest' | 'staff' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<'guest' | 'staff' | 'admin'>('guest');
  
  // Nested forms mode (for staff & admin)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Guest Fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('Lodging & Stay');
  
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

  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotError, setForgotError] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receptionistAlerted, setReceptionistAlerted] = useState(false);

  // Clear notices and states when switching tabs
  const handleTabChange = (role: 'guest' | 'staff' | 'admin') => {
    setActiveRoleTab(role);
    setError('');
    setSuccess('');
    setAuthMode('signin');
    setShowPassword(false);
  };

  // Guest Primary action: Proceed as Guest
  const handleGuestProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = guestName.trim();
    const trimmedEmail = guestEmail.trim().toLowerCase();

    if (!trimmedName) {
      setError('Please provide your Full Name to proceed.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter your Email Address.');
      return;
    }
    if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      localLogin('guest', trimmedEmail, trimmedName);
      showToast({
        type: 'success',
        message: `🛎️ Welcome, ${trimmedName}! Proceeded to Guest view.`
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during guest registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest Secondary action: Call Staff / Receptionist
  const handleCallReceptionist = async () => {
    setError('');
    setSuccess('');
    
    const displayName = guestName.trim() || 'Anonymous Walk-in Guest';
    const displayEmail = guestEmail.trim() || 'no-email@guest.com';

    try {
      await createServiceRequest({
        roomId: 'Front Desk Lobby',
        type: 'concierge',
        description: `[URGENT ALARM] Walk-In Guest "${displayName}" (${displayEmail}) requested immediate service from Lobby Gate. Purpose: "${purposeOfVisit}".`,
        status: 'pending'
      });

      setReceptionistAlerted(true);
      showToast({
        type: 'success',
        message: '🔔 Front Desk Staff and Receptionist have been alerted! Someone will assist you shortly.'
      });
      setSuccess('🛎️ Desk bell rung! Lobby staff alerted successfully.');
      
      setTimeout(() => {
        setReceptionistAlerted(false);
      }, 5000);
    } catch (err: any) {
      setError('Failed to transmit alarm to receptionist. Please proceed as guest or try again.');
    }
  };

  // Open Forgot Password Dialog
  const handleOpenForgotPassword = (defaultEmail?: string) => {
    setForgotEmail(defaultEmail || '');
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
    try {
      if (isFirebaseActive && auth) {
        await sendPasswordResetEmail(auth, emailToReset);
        setForgotStatus(`A password reset link has been dispatched to ${emailToReset}. Please check your inbox.`);
        showToast({
          type: 'success',
          message: `📧 Password reset email dispatched to ${emailToReset}!`
        });
      } else {
        setForgotStatus(`Verification OTP & Password reset instructions dispatched to ${emailToReset}.`);
        showToast({
          type: 'info',
          message: `📧 Password reset instructions sent to ${emailToReset} (Sandbox Mode)`
        });
      }
    } catch (err: any) {
      let msg = err.message || 'Failed to dispatch password reset request.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No registered user account found with this email.';
      }
      setForgotError(msg);
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
      // Creating or logging into an Admin account requires the Admin Master Key (e.g. ADMIN2026)
      const cleanAdminKey = adminMasterKey.trim().toUpperCase();
      const isKeyValid = VALID_ADMIN_PASSCODES.includes(cleanAdminKey);

      if (authMode === 'signup' && !isKeyValid) {
        setError('Access Denied: Creating an Admin account requires a valid Admin Master Key.');
        return;
      }

      if (authMode === 'signin' && !isKeyValid) {
        // Also check if existing stored admin user
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'admin');

        if (!existing && !isKeyValid) {
          setError('Access Denied: Please enter a valid Admin Master Passcode to log in as Admin.');
          return;
        }
      }
    } else {
      // Staff Security Gate
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
        let msg = err.message || 'Authentication failed.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email is already registered. Try signing in instead!';
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Incorrect email address or password. Please try again.';
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
      
      {/* 1. Subtle Background Accent - Clean White Theme */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-teal-50/80 via-slate-50/50 to-slate-50 pointer-events-none" />
      <div className="absolute top-12 left-1/3 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-24 right-1/4 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Brand Header Title */}
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

      {/* 3. Central Login Card Modal - Crisp White Background */}
      <div className="relative z-10 bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-xl shadow-slate-200/80 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Tabbed Navigation - Clean Light Segmented Control */}
        <div className="bg-slate-100 p-1.5 flex border-b border-slate-200 gap-1">
          {/* Guest Tab */}
          <button
            onClick={() => handleTabChange('guest')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer ${
              activeRoleTab === 'guest'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeRoleTab === 'guest' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>Guest Desk</span>
          </button>

          {/* Staff Tab */}
          <button
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

        {/* Modal Interactive Form Content Area */}
        <div className="p-6 md:p-8 space-y-5 bg-white">
          
          {/* Error and Success Notices */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed font-medium">{success}</span>
            </div>
          )}

          {/* ----------------- TAB A: GUEST DESK FORM ----------------- */}
          {activeRoleTab === 'guest' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Proceed as Guest</h3>
                <p className="text-xs text-slate-500">
                  Explore available rooms, book stays, and view amenities at Islamia Guest House.
                </p>
              </div>

              <form onSubmit={handleGuestProceed} className="space-y-4">
                {/* Guest Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Sakar Chowdhury"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Guest Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="guest@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="e.g. 01832-841818"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Purpose of Visit */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Purpose of Visit
                  </label>
                  <select
                    value={purposeOfVisit}
                    onChange={(e) => setPurposeOfVisit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none cursor-pointer"
                  >
                    <option value="Lodging & Stay">Lodging &amp; Stay (Room Reservation)</option>
                    <option value="Business Meeting">Business Meeting &amp; Boardrooms</option>
                    <option value="Visiting Guest">Visiting Guest (Resident Call)</option>
                    <option value="Delivery/Courier">Delivery / Courier Dropoff</option>
                  </select>
                </div>

                {/* Guest Action Buttons */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCallReceptionist}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition border cursor-pointer relative ${
                      receptionistAlerted
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bell className={`w-4 h-4 ${receptionistAlerted ? 'animate-bounce text-amber-600' : 'text-teal-600'}`} />
                    <span>{receptionistAlerted ? 'Receptionist Summoned!' : 'Call Staff / Desk'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-white" />
                        <span>Proceed to Guest Portal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB B: STAFF LOGIN / SIGNUP FORM ----------------- */}
          {activeRoleTab === 'staff' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {authMode === 'signin' ? 'Staff Portal Sign In' : 'Register New Staff Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {authMode === 'signin' 
                    ? 'Access Front Desk room allocation, booking checkout, and bill printing.'
                    : 'Create a staff profile. Authorized staff passcode key required.'}
                </p>
              </div>

              <form onSubmit={handleSecureAuth} className="space-y-3.5">
                {/* Staff Full Name (Signup Only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Frontdesk Staff Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Email and Phone */}
                {authMode === 'signup' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Corporate Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          placeholder="staff@islamiaguesthouse.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          placeholder="01909-806960"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Staff Corporate Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@islamiaguesthouse.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenForgotPassword(staffEmail)}
                      className="text-[11px] text-teal-600 hover:text-teal-700 transition underline decoration-teal-300 cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Staff ID Secret Passcode */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Staff Passcode Key *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                    </div>
                    <input
                      type="password"
                      required
                      value={staffSecretPasscode}
                      onChange={(e) => setStaffSecretPasscode(e.target.value)}
                      placeholder="Enter Staff Passcode Key"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    * Authorized Staff Passcode Key required for registration &amp; sign in.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 cursor-pointer pt-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-white" />
                      <span>{authMode === 'signin' ? 'Sign In as Staff' : 'Register New Staff Profile'}</span>
                    </>
                  )}
                </button>

                {/* Toggle Mode */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-[11px] text-slate-600 hover:text-teal-700 transition underline cursor-pointer"
                  >
                    {authMode === 'signin' 
                      ? 'Need a staff profile? Register account here' 
                      : 'Already registered? Sign In here'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB C: ADMIN / HR PORTAL ----------------- */}
          {activeRoleTab === 'admin' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold font-mono">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>EXECUTIVE LEVEL</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {authMode === 'signin' ? 'Sign In as Executive Admin / HR' : 'Create Admin Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  {authMode === 'signin' 
                    ? 'Access revenue reports, tariff manager, staff approval, and system settings.'
                    : 'Create a new Admin Administrator account. Executive Admin Master Key required.'}
                </p>
              </div>

              <form onSubmit={handleSecureAuth} className="space-y-3.5">
                {/* Admin Full Name (Signup Only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Sakar Chowdhury (Admin)"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Admin Email & Phone */}
                {authMode === 'signup' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Admin Corporate Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@islamiaguesthouse.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="01832-841818"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Admin Corporate Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@islamiaguesthouse.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* Admin Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenForgotPassword(adminEmail)}
                      className="text-[11px] text-amber-700 hover:text-amber-800 transition underline decoration-amber-300 cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Admin Master Passcode Key */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-700">
                      Admin Master Passcode *
                    </label>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">Admin Security Gate</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                    </div>
                    <input
                      type="password"
                      required
                      value={adminMasterKey}
                      onChange={(e) => setAdminMasterKey(e.target.value)}
                      placeholder="Enter Admin Master Passcode"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 rounded-xl text-xs font-mono font-bold transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    * Admin creation and login requires executive master security passcode.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>{authMode === 'signin' ? 'Sign In as Admin' : 'Create Admin Account'}</span>
                    </>
                  )}
                </button>

                {/* Toggle Mode */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-[11px] text-slate-600 hover:text-amber-700 transition underline cursor-pointer"
                  >
                    {authMode === 'signin' 
                      ? 'Want to create a new Admin account? Register here' 
                      : 'Already have an Admin account? Sign In here'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-1">
          <span>Islamia Reception Security Gateway v4.8</span>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Dhanmondi</span>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer text-xs font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reset Password</h3>
                <p className="text-xs text-slate-500">Receive a password reset link by email.</p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStatus ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password Reset Link Sent</span>
                </div>
                <p className="leading-relaxed">{forgotStatus}</p>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Return to Gateway
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. user@islamiaguesthouse.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
