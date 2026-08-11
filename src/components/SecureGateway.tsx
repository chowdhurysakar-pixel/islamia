/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';
import { 
  Mail, Key, User, Users, Hotel, 
  Loader2, CheckCircle2, 
  AlertCircle, Bell, Compass, 
  UserCheck, Eye, EyeOff, ShieldCheck, Phone,
  X
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
      // Staff Security Gate
      const cleanSecretPasscode = staffSecretPasscode.trim().toUpperCase();
      const isSecretValid = VALID_STAFF_PASSCODES.includes(cleanSecretPasscode);
      
      if (authMode === 'signup' && !isSecretValid) {
        setError('Access Denied: Staff registration requires a valid Staff Secret Passcode.');
        return;
      }

      if (authMode === 'signin') {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'staff');
        
        if (!existing && !isSecretValid && !isFirebaseActive) {
          setError('Access Denied: Please enter a valid Staff Passcode or register an account.');
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      if (isFirebaseActive && auth && db) {
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
      } else {
        // Local Sandbox Mode
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];

        if (authMode === 'signup') {
          const exists = usersList.some(u => u.email === emailLower);
          if (exists) {
            setError('This email address is already registered. Please sign in instead.');
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* 1. Subtle Background Accent */}
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

      {/* 3. Central Login Card Modal */}
      <div className="relative z-10 bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-xl shadow-slate-200/80 flex flex-col overflow-hidden">
        
        {/* Tabbed Navigation */}
        <div className="bg-slate-100 p-1.5 flex border-b border-slate-200 gap-1">
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
                {authMode === 'signup' && (
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
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Frontdesk Staff Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password *
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => handleOpenForgotPassword(staffEmail)}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
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
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Staff Passcode Key {authMode === 'signin' ? '(Optional for registered accounts)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={staffSecretPasscode}
                      onChange={(e) => setStaffSecretPasscode(e.target.value)}
                      placeholder="ISLAMIA-STAFF-2026 or 123456"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In as Staff' : 'Create Staff Account'}</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                      setError('');
                    }}
                    className="text-xs text-slate-600 hover:text-teal-700 font-semibold cursor-pointer"
                  >
                    {authMode === 'signin' 
                      ? "Don't have a staff account? Register here" 
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB C: ADMIN / HR FORM ----------------- */}
          {activeRoleTab === 'admin' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {authMode === 'signin' ? 'HR & Management Console' : 'Register Admin Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  Full administrative control over staff permissions, finance reports, and room settings.
                </p>
              </div>

              <form onSubmit={handleSecureAuth} className="space-y-3.5">
                {authMode === 'signup' && (
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
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Administrator Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Admin Email *
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password *
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => handleOpenForgotPassword(adminEmail)}
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Admin Master Passcode {authMode === 'signin' ? '(Optional for registered admins)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                    </div>
                    <input
                      type="password"
                      value={adminMasterKey}
                      onChange={(e) => setAdminMasterKey(e.target.value)}
                      placeholder="ADMIN2026 or 123456"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-600 text-slate-900 rounded-xl text-xs transition focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In as Administrator' : 'Create Admin Account'}</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                      setError('');
                    }}
                    className="text-xs text-slate-600 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    {authMode === 'signin' 
                      ? "Don't have an admin account? Register here" 
                      : 'Already registered as admin? Sign in'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ----------------- FORGOT PASSWORD MODAL ----------------- */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your account email address and we will dispatch password recovery instructions to you.
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotStatus}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Account Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@islamiaguesthouse.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Reset Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SecureGateway;
