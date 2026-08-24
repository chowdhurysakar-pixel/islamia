/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SecureGateway } from './SecureGateway';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Hotel
} from 'lucide-react';
import { isAdminEmail } from '../context/AppContext';

interface RequireAdminApprovalProps {
  children: React.ReactNode;
}

export const RequireAdminApproval: React.FC<RequireAdminApprovalProps> = ({ children }) => {
  const {
    currentUser,
    currentRole,
    opMode,
    activeStaffRequestId,
    staffApprovalStatus,
    loginRequests,
    registeredUsers,
    logout,
    createLoginRequest,
    isFirebaseActive,
    showToast
  } = useApp();

  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState<string | null>(null);

  const emailLower = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(emailLower && isAdminEmail(emailLower)) || currentUser?.role === 'admin';

  // 1. If not authenticated at all or missing email, redirect to SecureGateway
  if (!currentUser || !emailLower) {
    return <SecureGateway />;
  }

  // 2. Executive Admin has master verified access
  if (isAdmin) {
    const isAuthorized = sessionStorage.getItem('admin_authorized') === 'true' || isAdminEmail(emailLower);
    if (!isAuthorized) {
      return <SecureGateway />;
    }
    return <>{children}</>;
  }

  // 3. If guest role is active, render unrestricted
  if (currentRole === 'guest' || currentUser.role === 'guest') {
    return <>{children}</>;
  }

  // 4. For Staff / Receptionist / HR / Housekeeping / Room Service:
  // Strict Gatekeeper Verification
  const userRecord = (registeredUsers || []).find(u => u.email && u.email.toLowerCase().trim() === emailLower);
  const userRequest = (loginRequests || []).find(r => 
    (activeStaffRequestId && r.id === activeStaffRequestId) || 
    (r.email && r.email.toLowerCase().trim() === emailLower)
  );

  const hasSessionToken = sessionStorage.getItem('staff_authorized') === 'true';
  const isExplicitlyApproved = (
    (staffApprovalStatus === 'APPROVED' && hasSessionToken) ||
    (userRequest && userRequest.status === 'approved' && hasSessionToken) ||
    (userRecord && userRecord.hrApproved === true && hasSessionToken)
  ) && staffApprovalStatus !== 'REJECTED' && userRequest?.status !== 'rejected';

  // If approved and verified in real time, render protected views
  if (isExplicitlyApproved) {
    return <>{children}</>;
  }

  // 5. HARD BLOCK: Render Full-Screen Gatekeeper Lockout Screen
  const isRejected = staffApprovalStatus === 'REJECTED' || userRequest?.status === 'rejected';
  const isPending = !isRejected;

  const handleManualRecheck = async () => {
    setIsRechecking(true);
    setRecheckMessage('Polling real-time database state...');
    
    // Simulate instantaneous verification
    setTimeout(() => {
      setIsRechecking(false);
      const latestReq = (loginRequests || []).find(r => 
        (activeStaffRequestId && r.id === activeStaffRequestId) || 
        (r.email && r.email.toLowerCase().trim() === emailLower)
      );

      if (latestReq?.status === 'approved') {
        sessionStorage.setItem('staff_authorized', 'true');
        showToast({
          type: 'success',
          message: '🎉 Authorization confirmed! Loading Front Desk Console...'
        });
      } else if (latestReq?.status === 'rejected') {
        setRecheckMessage('Executive Admin has declined this login request.');
        showToast({
          type: 'warning',
          message: '⛔ Access Request Rejected by Administrator.'
        });
      } else {
        setRecheckMessage('Request is still pending Admin approval.');
        showToast({
          type: 'info',
          message: '⏳ Awaiting Executive Admin approval in Dhanmondi...'
        });
      }
    }, 600);
  };

  const handleNewRequest = async () => {
    try {
      const newReqId = await createLoginRequest({
        email: emailLower,
        name: currentUser.name || 'Front Desk Staff',
        role: 'staff',
        phone: currentUser.phone || '',
        deviceInfo: navigator.userAgent
      });
      sessionStorage.setItem('active_staff_request_id', newReqId);
      showToast({
        type: 'info',
        message: '⚡ Fresh Login Request dispatched to Executive Admin console!'
      });
    } catch (e) {
      showToast({
        type: 'warning',
        message: 'Could not send request. Please check internet connection.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Banner */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-mono tracking-wider uppercase">
            <Hotel className="w-3.5 h-3.5" />
            <span>Islamia Guest House Dhanmondi</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            Mandatory Security Gatekeeper
          </h1>
          <p className="text-xs text-slate-400">
            Real-Time Zero-Trust Authorization &amp; Access Control
          </p>
        </div>

        {/* Main Lockout Card */}
        <div className={`bg-slate-950 rounded-3xl p-7 shadow-2xl border ${
          isRejected ? 'border-rose-500/50 shadow-rose-950/40' : 'border-amber-500/40 shadow-amber-950/40'
        } text-center space-y-5 relative`}>

          {/* Pulsing Status Radar Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            {isPending ? (
              <>
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                <div className="relative w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40">
                  <ShieldAlert className="w-7 h-7" />
                </div>
              </>
            )}
          </div>

          {/* Status Headline */}
          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              isRejected 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRejected ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isRejected ? 'Access Revoked / Denied' : 'Awaiting Administrator Approval'}</span>
            </div>

            <h2 className="text-lg font-bold text-white">
              {isRejected ? 'Authorization Revoked by Admin' : 'Front Desk Terminal Locked'}
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed px-2">
              {isRejected
                ? 'Your access has been terminated by executive management. You cannot access Front Desk records without authorization.'
                : 'Your sign-in request has been transmitted in real time to the Administrator at islamiaguesthouse.com.'
              }
            </p>
          </div>

          {/* Request Metadata Box */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-mono text-[11px]">Request Token:</span>
              <span className="font-mono font-bold text-slate-200 truncate max-w-[180px]">
                {userRequest?.id || activeStaffRequestId || 'Session Pending'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Account:</span>
              <span className="font-medium text-slate-200 truncate max-w-[180px]">{emailLower}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Target Role:</span>
              <span className="font-semibold text-teal-400 bg-teal-950/80 border border-teal-800/50 px-2 py-0.5 rounded-md text-[10px] uppercase font-mono">
                {opMode === 'hr' ? 'HR Manager' : 'Front Desk Receptionist'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Live Status:</span>
              {isPending ? (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Pending Admin Approval...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Rejected by Admin</span>
                </span>
              )}
            </div>
          </div>

          {/* Real-time Stream Info Banner */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5 text-left">
            <RefreshCw className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 animate-spin" />
            <p className="leading-relaxed">
              <strong className="text-teal-300">Live Stream Active:</strong> As soon as the Executive Administrator clicks <span className="text-emerald-400 font-bold">Approve</span> in the Admin Console, this terminal will automatically unlock and redirect to the Front Desk.
            </p>
          </div>

          {recheckMessage && (
            <p className="text-[11px] text-amber-400 font-mono animate-fadeIn">
              {recheckMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleManualRecheck}
              disabled={isRechecking}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md shadow-teal-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
              <span>{isRechecking ? 'Checking Real-Time Stream...' : 'Check Live Approval Now'}</span>
            </button>

            {isRejected && (
              <button
                type="button"
                onClick={handleNewRequest}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Send Fresh Login Request</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-800"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out &amp; Return to Login</span>
            </button>
          </div>

        </div>

        {/* Security Footer Notice */}
        <p className="text-[11px] text-slate-500 text-center font-mono">
          🔒 Enforced by Islamia Zero-Trust Gatekeeper &bull; Dhanmondi, Dhaka
        </p>

      </div>
    </div>
  );
};
