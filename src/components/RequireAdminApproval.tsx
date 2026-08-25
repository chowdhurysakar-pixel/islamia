/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, Clock, RefreshCw, LogOut, CheckCircle2, 
  KeyRound, Mail, User, Phone, Sparkles, Building2, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface RequireAdminApprovalProps {
  children: React.ReactNode;
}

export const RequireAdminApproval: React.FC<RequireAdminApprovalProps> = ({ children }) => {
  const { currentUser, currentRole, logout, showToast, isFirebaseActive } = useApp();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [pulseCount, setPulseCount] = useState<number>(0);

  // If user is Admin or has hrApproved set to true, grant full access
  const isAuthorized = 
    currentRole === 'admin' || 
    currentUser?.role === 'admin' || 
    currentUser?.hrApproved === true ||
    currentUser?.email?.toLowerCase() === 'islamiaguesthouse@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'chowdhurysakar@gmail.com';

  // Periodic heartbeat animation
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Manual status check handler
  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      if (isFirebaseActive && db && currentUser?.uid) {
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.hrApproved) {
            showToast({
              type: 'success',
              message: '🎉 Your staff account has been approved by HR! Unlocking Front Desk now...'
            });
            setIsChecking(false);
            return;
          }
        }
      }

      // Check local storage fallback
      const stored = localStorage.getItem('hotel_registered_users');
      if (stored && currentUser?.email) {
        const list = JSON.parse(stored);
        const match = list.find((u: any) => u.email?.toLowerCase() === currentUser.email.toLowerCase());
        if (match?.hrApproved) {
          showToast({
            type: 'success',
            message: '🎉 Access authorized! Unlocking Front Desk...'
          });
          setIsChecking(false);
          return;
        }
      }

      showToast({
        type: 'info',
        message: '⏳ Status: Still pending review. Please notify the Administrator or HR Manager to approve your access.'
      });
    } catch (e) {
      showToast({
        type: 'info',
        message: 'Waiting for Admin approval...'
      });
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div id="require-admin-approval-gate" className="min-h-[80vh] flex items-center justify-center p-4 py-8 animate-fadeIn font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-amber-200/80 shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 text-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-950/20 backdrop-blur-xs rounded-full text-slate-950 text-xs font-mono font-bold tracking-wider uppercase border border-slate-950/10">
              <span className="w-2 h-2 rounded-full bg-amber-200 animate-ping" />
              <span>Access Gatekeeper</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-950/80">
              Islamia Guest House Security
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 font-serif leading-tight">
                Waiting for Admin Approval
              </h2>
              <p className="text-xs text-slate-950/85 mt-0.5 font-medium">
                Mandatory HR authorization required before accessing Front Desk &amp; guest operations.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Alert Callout */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-900">Status: Pending HR Approval</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold uppercase">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your staff profile has been recorded in the hotel registry. An administrator or HR manager must approve your account in the Admin Console before you can create bookings, check in guests, or view room tariffs.
              </p>
            </div>
          </div>

          {/* Registered Staff Profile Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider">
              Registered Profile Details
            </h3>

            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </span>
                <span className="font-bold text-slate-900">{currentUser?.name || 'Staff Member'}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </span>
                <span className="font-mono text-slate-800 font-medium">{currentUser?.email}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned Role</span>
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-mono font-bold rounded text-[10px] uppercase">
                  {currentUser?.role || 'staff'} / Front Desk
                </span>
              </div>

              {currentUser?.staffSecretKey && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Passcode Used</span>
                  </span>
                  <span className="font-mono font-bold text-teal-700">{currentUser.staffSecretKey}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Timestamp</span>
                </span>
                <span className="text-slate-600 font-mono">
                  {new Date(currentUser?.registeredAt || currentUser?.lastLoginAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Live Listener Indicator */}
          <div className="p-3.5 bg-teal-50 border border-teal-200/70 rounded-2xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping shrink-0" />
            <div className="text-[11px] text-teal-900 leading-snug">
              <span className="font-bold block">Instant Live Sync Active</span>
              This screen is connected via real-time Firestore synchronization. As soon as the Administrator clicks <strong>"Approve Access"</strong> in the Admin Registry, this portal will automatically unlock!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              id="approval-check-status-btn"
              type="button"
              disabled={isChecking}
              onClick={handleCheckStatus}
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Authorization...' : 'Check Approval Status'}</span>
            </button>

            <button
              id="approval-logout-btn"
              type="button"
              onClick={logout}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out / Switch</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200/70 px-6 py-3.5 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Islamia Guest House • Dhanmondi 4/A, Dhaka-1209 • +880 1711-234567</span>
        </div>
      </div>
    </div>
  );
};
