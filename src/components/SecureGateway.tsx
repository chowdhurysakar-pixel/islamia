/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';
import { 
  Mail, Key, User, Users, Hotel, 
  ArrowRight, Loader2, CheckCircle2, 
  AlertCircle, ShieldCheck, Phone, KeyRound,
  Eye, EyeOff, X, RefreshCw, Sparkles, Inbox, Lock, ArrowLeft
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const VALID_STAFF_PASSCODES = [
  'ISLAMIA-STAFF-2026', 'STAFF789', 'ISLAMIA-DESK-55', 'STAFF2026'
];
const VALID_ADMIN_PASSCODES = [
  'ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', 'ADMIN-IGH-2026'
];

// Allowed corporate email domains for Staff & Admin registration
const ALLOWED_STAFF_DOMAINS = [
  'islamiaguesthouse.com',
  'islamiahotel.com',
  'gmail.com',
  'googlemail.com'
];

const isAllowedEmailDomain = (email: string): boolean => {
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return ALLOWED_STAFF_DOMAINS.includes(domain);
};

export const SecureGateway: React.FC = () => {
  const { 
    isFirebaseActive, 
    localLogin, 
    showToast, 
    setOpMode, 
    sendPasswordResetLink, 
    sendOtp, 
    verifyOtp,
    masterStaffPasscode,
    recordStaffSignIn,
    registeredUsers,
    createLoginRequest
  } = useApp();
  
  // Role tabs: 'staff' | 'admin'
  const [activeRoleTab, setActiveRoleTab] = useState<'staff' | 'admin'>('staff');
  
  // Nested form mode for staff & admin
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Real-Time Staff Login Authorization Gate (Live Approval State)
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [approvalRequestId, setApprovalRequestId] = useState<string | null>(null);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [approvalName, setApprovalName] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'WAITING_FOR_ADMIN_APPROVAL' | 'APPROVED' | 'REJECTED'>('WAITING_FOR_ADMIN_APPROVAL');

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

  // Email Verification Screen & Resend State
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [pendingVerifyPassword, setPendingVerifyPassword] = useState('');
  const [pendingVerifyRole, setPendingVerifyRole] = useState<UserRole>('staff');
  const [pendingVerifyName, setPendingVerifyName] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [unverifiedNoticeEmail, setUnverifiedNoticeEmail] = useState<string | null>(null);

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

  // Real-time Firestore onSnapshot listener on the pending login request
  useEffect(() => {
    if (!waitingApproval || !approvalRequestId) return;

    let unsubscribe: (() => void) | null = null;

    if (isFirebaseActive && db) {
      try {
        const docRef = doc(db, 'login_requests', approvalRequestId);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'approved') {
              setApprovalStatus('APPROVED');
              sessionStorage.setItem('staff_authorized', 'true');
              setOpMode('receptionist');
              localLogin('staff', approvalEmail, approvalName || 'Front Desk Staff');
              showToast({
                type: 'success',
                message: `🎉 Login Request Approved by Admin! Welcome to Front Desk Console.`
              });
              setWaitingApproval(false);
              setApprovalRequestId(null);
            } else if (data.status === 'rejected') {
              setApprovalStatus('REJECTED');
              setError('Access Denied: The Executive Administrator has declined your login request. Please contact hotel management.');
              setWaitingApproval(false);
              setApprovalRequestId(null);
            }
          }
        }, (err) => {
          console.warn("Approval onSnapshot notice:", err);
        });
      } catch (e) {
        console.warn("Could not subscribe to login request status:", e);
      }
    }

    // Local cross-tab / storage fallback listener
    const handleLocalApproval = () => {
      try {
        const stored = localStorage.getItem('hotel_login_requests');
        if (stored) {
          const reqs = JSON.parse(stored);
          const current = reqs.find((r: any) => r.id === approvalRequestId);
          if (current?.status === 'approved') {
            setApprovalStatus('APPROVED');
            sessionStorage.setItem('staff_authorized', 'true');
            setOpMode('receptionist');
            localLogin('staff', approvalEmail, approvalName || 'Front Desk Staff');
            showToast({
              type: 'success',
              message: `🎉 Login Request Approved by Admin! Welcome to Front Desk Console.`
            });
            setWaitingApproval(false);
            setApprovalRequestId(null);
          } else if (current?.status === 'rejected') {
            setApprovalStatus('REJECTED');
            setError('Access Denied: The Executive Administrator has declined your login request.');
            setWaitingApproval(false);
            setApprovalRequestId(null);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleLocalApproval);
    window.addEventListener('hotel_presence_updated', handleLocalApproval);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleLocalApproval);
      window.removeEventListener('hotel_presence_updated', handleLocalApproval);
    };
  }, [waitingApproval, approvalRequestId, approvalEmail, approvalName, isFirebaseActive]);

  // Resend cooldown timer effect
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Clear notices and states when switching tabs
  const handleTabChange = (role: 'staff' | 'admin') => {
    setActiveRoleTab(role);
    setError('');
    setSuccess('');
    setAuthMode('signin');
    setShowPassword(false);
    setUnverifiedNoticeEmail(null);
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

  // Handle Resending Verification Email
  const handleResendVerificationEmail = async (targetEmail?: string, targetPassword?: string) => {
    const emailToSend = (targetEmail || pendingVerifyEmail || (activeRoleTab === 'admin' ? adminEmail : staffEmail)).trim().toLowerCase();
    const pwd = targetPassword || pendingVerifyPassword || (activeRoleTab === 'admin' ? adminPassword : staffPassword);
    
    if (!emailToSend) {
      showToast({ type: 'error', message: 'No email address found to resend verification link.' });
      return;
    }

    if (resendCooldown > 0) {
      showToast({ type: 'info', message: `Please wait ${resendCooldown}s before requesting another verification email.` });
      return;
    }

    setIsResendingEmail(true);
    setError('');

    try {
      if (isFirebaseActive && auth) {
        if (pwd) {
          // Temporarily sign in to get the User object, dispatch email, then sign out immediately
          const userCred = await signInWithEmailAndPassword(auth, emailToSend, pwd);
          if (userCred.user) {
            await sendEmailVerification(userCred.user);
            await signOut(auth);
          }
        } else if (auth.currentUser && auth.currentUser.email === emailToSend) {
          await sendEmailVerification(auth.currentUser);
          await signOut(auth);
        } else {
          // Trigger OTP backup email
          await sendOtp(emailToSend, pendingVerifyName || 'Staff Member', pendingVerifyRole, false);
        }
      } else {
        // Local sandbox fallback
        await sendOtp(emailToSend, pendingVerifyName || 'Staff Member', pendingVerifyRole, false);
      }

      setResendCooldown(60);
      showToast({
        type: 'success',
        message: `✉️ Verification link re-sent to ${emailToSend}! Please check your Inbox and Spam folder.`
      });
    } catch (err: any) {
      console.warn("Resend email verification notice:", err);
      // Fallback: send simulated OTP
      await sendOtp(emailToSend, pendingVerifyName || 'Staff Member', pendingVerifyRole, false);
      setResendCooldown(60);
      showToast({
        type: 'info',
        message: `✉️ Verification code re-sent to ${emailToSend}.`
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Verify OTP alternative on verification screen
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpCodeInput.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyOtp(pendingVerifyEmail, otpCodeInput.trim(), true, pendingVerifyName, pendingVerifyRole);
      if (res.success) {
        setShowVerificationScreen(false);
        showToast({
          type: 'success',
          message: `🎉 Email verified successfully! You can now log in with your credentials.`
        });
        setAuthMode('signin');
        if (pendingVerifyRole === 'admin') {
          setActiveRoleTab('admin');
          setAdminEmail(pendingVerifyEmail);
        } else {
          setActiveRoleTab('staff');
          setStaffEmail(pendingVerifyEmail);
        }
      } else {
        setOtpError(res.error || 'Invalid or expired verification code. Please check and try again.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Check if user has clicked link and is verified
  const handleCheckEmailVerified = async () => {
    setIsLoading(true);
    setError('');
    const emailLower = pendingVerifyEmail.toLowerCase();
    const pwd = pendingVerifyPassword;

    try {
      if (isFirebaseActive && auth && pwd) {
        const userCred = await signInWithEmailAndPassword(auth, emailLower, pwd);
        await userCred.user.reload();
        
        if (userCred.user.emailVerified) {
          // Success! User is verified
          let loggedInName = userCred.user.displayName || pendingVerifyName || 'Team Member';
          let loggedInRole: UserRole = pendingVerifyRole;

          try {
            const docSnap = await getDoc(doc(db, 'users', userCred.user.uid));
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              loggedInName = data.name || loggedInName;
              loggedInRole = data.role || loggedInRole;
            }
          } catch (docErr) {
            console.warn("Could not fetch user document online, using fallback:", docErr);
          }

          if (loggedInRole === 'admin') {
            sessionStorage.setItem('admin_authorized', 'true');
            setOpMode('admin');
          } else {
            sessionStorage.removeItem('admin_authorized');
            setOpMode('receptionist');
          }
          localLogin(loggedInRole, emailLower, loggedInName);
          setShowVerificationScreen(false);
          showToast({
            type: 'success',
            message: `🎉 Email confirmed! Welcome to Islamia Guest House, ${loggedInName}.`
          });
          return;
        } else {
          await signOut(auth);
          setError('Email is not verified yet. Please check your email inbox and click the verification link, then click this button again.');
        }
      } else {
        // Sandbox fallback
        setShowVerificationScreen(false);
        setAuthMode('signin');
        showToast({
          type: 'info',
          message: 'Please sign in with your credentials to verify.'
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not confirm email verification yet. Please ensure you clicked the link in your email.');
    } finally {
      setIsLoading(false);
    }
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
        setForgotError('Invalid Admin Master Key or Staff Passcode. Please enter your authorized credentials.');
        setForgotLoading(false);
        return;
      }

      const roleToUse: UserRole = isAdminKey ? 'admin' : 'staff';
      const defaultName = isAdminKey ? 'Islamia Admin Executive' : 'Front Desk Staff';

      if (roleToUse === 'admin') {
        sessionStorage.setItem('admin_authorized', 'true');
        setOpMode('admin');
        localLogin(roleToUse, emailToReset, defaultName);
        setShowForgotPasswordModal(false);
        showToast({
          type: 'success',
          message: `🔓 Account Unlocked via Admin Master Key! Welcome back (${emailToReset}).`
        });
      } else {
        // Staff must go through Authorization Gate
        const reqId = await createLoginRequest({
          email: emailToReset,
          name: defaultName,
          role: 'staff',
          passcodeUsed: cleanKey,
          deviceInfo: navigator.userAgent
        });
        setShowForgotPasswordModal(false);
        setApprovalRequestId(reqId);
        setApprovalEmail(emailToReset);
        setApprovalName(defaultName);
        setApprovalStatus('WAITING_FOR_ADMIN_APPROVAL');
        setWaitingApproval(true);
        showToast({
          type: 'info',
          message: '⚡ Recovery Request Sent: Waiting for Executive Admin approval...',
          duration: 8000
        });
      }
      setForgotLoading(false);
      return;
    }

    // Email Reset Method
    try {
      const result = await sendPasswordResetLink(emailToReset);
      if (result.success) {
        setForgotStatus(`Password reset email sent to: ${emailToReset}. Please check your Gmail inbox and spam/junk folder.`);
      } else {
        setForgotError(`${result.error || 'Failed to send password reset email.'} Tip: You can also use the "Instant Master Access" option above to log in directly with the master key.`);
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
    setUnverifiedNoticeEmail(null);

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
      setError('Please enter your corporate email address.');
      return;
    }
    if (authMode === 'signup' && !phone) {
      setError('Please enter your contact phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const emailLower = email.toLowerCase();

    // 1. Restricted Domain Check on Registration
    if (authMode === 'signup') {
      if (!isAllowedEmailDomain(emailLower)) {
        setError('Registration Restricted: Staff and Admin accounts must use an official corporate email (@islamiaguesthouse.com) or a valid Google/Gmail account (@gmail.com).');
        return;
      }
    }

    // 2. Security Passcode Verification:
    const cleanAdminKey = adminMasterKey.trim().toUpperCase();
    const cleanSecretPasscode = staffSecretPasscode.trim().toUpperCase();
    const isMasterPasscodeMatch = masterStaffPasscode && cleanSecretPasscode === masterStaffPasscode.toUpperCase();
    const isStaffSecretValid = VALID_STAFF_PASSCODES.includes(cleanSecretPasscode) || isMasterPasscodeMatch;
    const isAdminKeyValid = VALID_ADMIN_PASSCODES.includes(cleanAdminKey);

    if (isAdmin) {
      if (authMode === 'signup' && !isAdminKeyValid) {
        setError('Access Denied: Creating an Admin account requires an authorized Admin Master Key.');
        return;
      }

      if (authMode === 'signin' && !isAdminKeyValid) {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'admin');

        if (!existing && !isAdminKeyValid) {
          setError('Access Denied: Please enter a valid authorized Admin Master Passcode.');
          return;
        }
      }
    } else {
      if (authMode === 'signup' && !isStaffSecretValid) {
        setError('Access Denied: Staff registration requires a valid authorized Staff Passcode.');
        return;
      }

      if (authMode === 'signin' && !isStaffSecretValid) {
        const storedUsers = localStorage.getItem('hotel_registered_users');
        const usersList: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
        const existing = usersList.find(u => u.email.toLowerCase() === emailLower && u.role === 'staff');
        
        if (!existing || (!existing.hrApproved && existing.staffSecretKey !== cleanSecretPasscode)) {
          setError('Access Denied: Please enter an authorized Staff Passcode or await HR authorization.');
          return;
        }
      }
    }

    setIsLoading(true);

    if (isFirebaseActive && auth && db) {
      try {
        if (authMode === 'signup') {
          // --- SIGN UP FLOW: CREATE ACCOUNT & DISPATCH EMAIL VERIFICATION ---
          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name });
            
            // Send verification email link via Firebase Auth
            await sendEmailVerification(userCredential.user);

            const newUser: UserProfile = {
              uid: userCredential.user.uid,
              email: emailLower,
              name: name,
              role: role,
              phone: phone,
              emailVerified: false,
              hrApproved: isAdmin,
              staffSecretKey: cleanSecretPasscode || masterStaffPasscode || '',
              registeredAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

            // CRITICAL: DO NOT automatically log in unverified user! Sign out immediately!
            await signOut(auth);
            sessionStorage.removeItem('admin_authorized');

            // Dispatch secondary OTP code as fallback
            await sendOtp(emailLower, name, role, true);

            // Transition to dedicated Email Verification Notification Screen
            setPendingVerifyEmail(emailLower);
            setPendingVerifyPassword(password);
            setPendingVerifyRole(role);
            setPendingVerifyName(name);
            setResendCooldown(60);
            setShowVerificationScreen(true);

            showToast({
              type: 'info',
              message: `✉️ Verification link sent to ${emailLower}! Please check your email inbox and click the verification link before logging in.`,
              duration: 12000
            });
          }
        } else {
          // --- SIGN IN FLOW: STRICT AUTHENTICATION & AUTHORIZATION GATE ---
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          
          if (userCredential.user) {
            await userCredential.user.reload();

            // STRICT PROTECTION: If email is NOT verified, block sign-in immediately!
            if (!userCredential.user.emailVerified) {
              await signOut(auth);
              sessionStorage.removeItem('admin_authorized');
              
              setUnverifiedNoticeEmail(emailLower);
              setPendingVerifyEmail(emailLower);
              setPendingVerifyPassword(password);
              setPendingVerifyRole(role);
              setPendingVerifyName(userCredential.user.displayName || name || 'Team Member');

              setError(`⚠️ Email Verification Required: Your email address (${emailLower}) has not been verified yet. Please check your inbox and verify your email before logging in.`);
              
              showToast({
                type: 'warning',
                message: `⚠️ Access Blocked: Please verify your email (${emailLower}) before logging in.`,
                duration: 10000
              });
              setIsLoading(false);
              return;
            }

            // User is verified! Fetch or update profile
            let loggedInName = userCredential.user.displayName || (isAdmin ? 'Mr. Sajjad (Admin)' : 'Front Desk Staff');
            let loggedInRole: UserRole = role;

            try {
              const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                loggedInName = data.name || loggedInName;
                loggedInRole = data.role || loggedInRole;
              } else {
                const newUser: UserProfile = {
                  uid: userCredential.user.uid,
                  email: emailLower,
                  name: loggedInName,
                  role: loggedInRole,
                  emailVerified: true,
                  hrApproved: isAdmin,
                  staffSecretKey: cleanSecretPasscode || masterStaffPasscode || '',
                  isOnline: true,
                  lastLoginAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
              }
            } catch (docErr) {
              console.warn("Could not sync user profile online:", docErr);
            }

            if (loggedInRole === 'admin') {
              sessionStorage.setItem('admin_authorized', 'true');
              setOpMode('admin');
              localLogin(loggedInRole, emailLower, loggedInName);
              await recordStaffSignIn(emailLower, loggedInName, loggedInRole, 'passcode', cleanSecretPasscode || masterStaffPasscode);

              showToast({
                type: 'success',
                message: `👋 Welcome back Executive Administrator, ${loggedInName}!`
              });
            } else {
              // STRICT AUTHORIZATION GATE FOR STAFF:
              // Generate live Firestore login_requests doc and lock into Authorization Gate
              const reqId = await createLoginRequest({
                email: emailLower,
                name: loggedInName,
                role: 'staff',
                phone: phone || '',
                passcodeUsed: cleanSecretPasscode,
                deviceInfo: navigator.userAgent
              });

              setApprovalRequestId(reqId);
              setApprovalEmail(emailLower);
              setApprovalName(loggedInName);
              setApprovalStatus('WAITING_FOR_ADMIN_APPROVAL');
              setWaitingApproval(true);

              showToast({
                type: 'info',
                message: '⚡ Live Login Request Sent: Awaiting Executive Admin authorization...',
                duration: 8000
              });
            }
          }
        }
      } catch (err: any) {
        console.warn("Auth notice:", err);
        let msg = err.message || 'Authentication failed.';
        
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email is already registered. Try signing in instead!';
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Incorrect email or password. Please verify your credentials.';
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          msg = 'No account found with this email. Please register your profile first.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please wait a moment and try again.';
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Sandbox Fallback Mode (Offline)
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
            emailVerified: true,
            hrApproved: isAdmin,
            staffSecretKey: cleanSecretPasscode || masterStaffPasscode || '',
            isOnline: true,
            lastLoginAt: new Date().toISOString()
          };

          usersList.push(newUser);
          localStorage.setItem('hotel_registered_users', JSON.stringify(usersList));
          
          setPendingVerifyEmail(emailLower);
          setPendingVerifyRole(role);
          setPendingVerifyName(name);
          setShowVerificationScreen(true);

          await sendOtp(emailLower, name, role, true);
        } else {
          const found = usersList.find(u => u.email === emailLower);
          const resolvedName = found ? found.name : (isAdmin ? 'Mr. Sajjad (Admin)' : 'Front Desk Staff');
          const resolvedRole: UserRole = found ? found.role : role;
          
          if (resolvedRole === 'admin') {
            sessionStorage.setItem('admin_authorized', 'true');
            setOpMode('admin');
            localLogin(resolvedRole, emailLower, resolvedName);
            await recordStaffSignIn(emailLower, resolvedName, resolvedRole, 'passcode', cleanSecretPasscode || masterStaffPasscode);

            showToast({
              type: 'success',
              message: `👋 Welcome back Executive Administrator, ${resolvedName}!`
            });
          } else {
            // STRICT AUTHORIZATION GATE FOR STAFF IN FALLBACK MODE
            const reqId = await createLoginRequest({
              email: emailLower,
              name: resolvedName,
              role: 'staff',
              phone: phone || '',
              passcodeUsed: cleanSecretPasscode,
              deviceInfo: navigator.userAgent
            });

            setApprovalRequestId(reqId);
            setApprovalEmail(emailLower);
            setApprovalName(resolvedName);
            setApprovalStatus('WAITING_FOR_ADMIN_APPROVAL');
            setWaitingApproval(true);

            showToast({
              type: 'info',
              message: '⚡ Live Login Request Sent: Awaiting Executive Admin authorization...',
              duration: 8000
            });
          }
        }
      } catch (err: any) {
        setError('Authentication failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- REAL-TIME AUTHORIZATION GATE WAITING SCREEN ---
  if (waitingApproval) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans animate-fadeIn">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-amber-50/80 via-slate-50/50 to-slate-50 pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-amber-200 text-center space-y-6">
            
            {/* Pulsing Radar Beacon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-amber-400/30 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Authorization Gate Active</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Waiting for Admin Approval
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your staff login request has been dispatched in real time to the Executive Admin at <span className="font-semibold text-slate-800">islamiaguesthouse.com</span>.
              </p>
            </div>

            {/* Request Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">Request ID:</span>
                <span className="font-mono font-bold text-slate-800">{approvalRequestId}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">Staff Account:</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]">{approvalEmail}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">Terminal Role:</span>
                <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Front Desk Receptionist</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Live Status:</span>
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Pending Admin Authorization...</span>
                </span>
              </div>
            </div>

            {/* Live Firestore Sync Notice */}
            <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200/60 text-[11px] text-teal-800 flex items-start gap-2 text-left">
              <RefreshCw className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-spin" />
              <span>
                <strong>Live Firestore Stream:</strong> Keep this window open. As soon as the Administrator authorizes your session in the Admin Panel, this page will automatically redirect to the Front Desk Console.
              </span>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                setWaitingApproval(false);
                setApprovalRequestId(null);
                setError('');
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel Login Request
            </button>

          </div>
        </div>
      </div>
    );
  }

  // --- DEDICATED EMAIL VERIFICATION NOTIFICATION SCREEN ---
  if (showVerificationScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans animate-fadeIn">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-teal-50/80 via-slate-50/50 to-slate-50 pointer-events-none" />
        
        <div className="relative z-10 bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg shadow-2xl p-8 sm:p-10 text-center space-y-6">
          
          {/* Animated Email Icon Badge */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping pointer-events-none" />
            <div className="w-20 h-20 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center text-teal-600 shadow-sm relative z-10">
              <Mail className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-bold font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>Email Verification Required</span>
            </span>
            <h2 className="text-2xl font-serif font-black text-slate-900">
              Check Your Email Inbox
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              We sent a secure verification link to activate your account to:
            </p>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl inline-block text-xs font-mono font-bold text-teal-800">
              {pendingVerifyEmail}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Instructions */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-left text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-teal-600" />
              <span>Instructions:</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Open your email provider (check <strong>Inbox</strong> & <strong>Spam/Junk</strong>).</li>
              <li>Click the verification link from <strong>Google Firebase / Islamia Guest House</strong>.</li>
              <li>Return to this page and click <strong>"I Have Verified My Email"</strong>.</li>
            </ol>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckEmailVerified}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>I Have Verified My Email — Complete Sign In</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResendVerificationEmail(pendingVerifyEmail, pendingVerifyPassword)}
                disabled={isResendingEmail || resendCooldown > 0}
                className="flex-1 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResendingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                )}
                <span>
                  {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Verification Email'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVerificationScreen(false);
                  setAuthMode('signin');
                  setError('');
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>

          {/* OTP Code Alternative Option */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-[11px] text-slate-400">
              Or enter the 6-digit verification code sent to your inbox:
            </p>
            {otpError && (
              <p className="text-[11px] text-rose-600 font-medium">{otpError}</p>
            )}
            <form onSubmit={handleVerifyOtpSubmit} className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                maxLength={6}
                value={otpCodeInput}
                onChange={(e) => setOtpCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6-Digit OTP"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:outline-none"
              />
              <button
                type="submit"
                disabled={otpLoading || otpCodeInput.length < 6}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {otpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

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
          
          {/* Unverified Email Warning Banner with Instant Resend Button */}
          {unverifiedNoticeEmail && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-amber-900">Email Verification Required</p>
                  <p className="text-amber-800 leading-relaxed">
                    You cannot sign in until your email address (<span className="font-mono font-bold">{unverifiedNoticeEmail}</span>) has been verified.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 pl-7">
                <button
                  type="button"
                  onClick={() => handleResendVerificationEmail(unverifiedNoticeEmail)}
                  disabled={isResendingEmail || resendCooldown > 0}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isResendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {resendCooldown > 0 ? `Resend Verification Email (${resendCooldown}s)` : 'Resend Verification Email'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerifyEmail(unverifiedNoticeEmail);
                    setShowVerificationScreen(true);
                  }}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Enter Verification Code
                </button>
              </div>
            </div>
          )}

          {/* Standard Error Notice */}
          {error && !unverifiedNoticeEmail && (
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
                ? 'Enter your verified corporate credentials and Admin Master Key to access executive controls.'
                : 'Access Front Desk room allocation, booking checkout, and bill printing.'}
            </p>

            {/* Mode Selector */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl mt-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError('');
                  setUnverifiedNoticeEmail(null);
                }}
                className={`px-8 py-1.5 rounded-lg transition ${
                  authMode === 'signin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError('');
                  setUnverifiedNoticeEmail(null);
                }}
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

            {/* Email Address with Domain Recommendation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">Corporate Email *</label>
                {authMode === 'signup' && (
                  <span className="text-[10px] text-teal-600 font-medium">
                    @islamiaguesthouse.com or @gmail.com
                  </span>
                )}
              </div>
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
                <label className="block text-xs font-semibold text-slate-700">Contact Phone Number *</label>
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
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Passcode / Master Key */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">
                  {activeRoleTab === 'admin' ? 'Admin Master Key *' : 'Staff Passcode Key *'}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {activeRoleTab === 'admin' ? 'Authorized Key Required' : 'Authorized Passcode Required'}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={activeRoleTab === 'admin' ? adminMasterKey : staffSecretPasscode}
                  onChange={(e) => activeRoleTab === 'admin' ? setAdminMasterKey(e.target.value) : setStaffSecretPasscode(e.target.value)}
                  placeholder={activeRoleTab === 'admin' ? 'Enter authorized Admin Master Key' : 'Enter your authorized passcode'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs transition focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer mt-2 active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Account & Send Verification Email' : 'Sign In To Portal'}</span>
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  </div>
                  <input
                    type="password"
                    required
                    value={forgotMasterKey}
                    onChange={(e) => setForgotMasterKey(e.target.value)}
                    placeholder="Enter your authorized passcode"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600 font-mono"
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
