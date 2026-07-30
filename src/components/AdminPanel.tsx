/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, RoomStatus, BookingStatus, UserProfile } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { 
  Building, Shield, ShieldCheck, Users, CheckCircle2, AlertCircle, Key, 
  Plus, Edit3, Trash2, Search, Filter, Clock, CreditCard, TrendingUp, 
  Printer, Receipt, Settings, DollarSign, UserCheck, UserX, Lock, 
  RefreshCw, FileText, Sparkles, Phone, MapPin, Check, X, ShieldAlert,
  ChevronRight, BarChart3, PieChart
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    serviceRequests, 
    feedbacks,
    addRoom, 
    updateRoomStatus, 
    editRoomDetails,
    updateBookingStatus,
    opMode,
    setOpMode,
    isFirebaseActive,
    showToast
  } = useApp();

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'chambers' | 'reservations' | 'settings'>('analytics');

  // Registered Staff Management State
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('hotel_registered_users');
      return stored ? JSON.parse(stored) : [
        {
          uid: 'local-admin-1',
          email: 'hr.manager@islamiaguesthouse.com',
          name: 'Sakar Chowdhury (HR Manager)',
          role: 'admin',
          hrApproved: true
        },
        {
          uid: 'local-staff-1',
          email: 'frontdesk.receptionist@islamiaguesthouse.com',
          name: 'Front Desk Reception Team',
          role: 'staff',
          staffSecretKey: 'ISLAMIA-STAFF-2026',
          hrApproved: true
        },
        {
          uid: 'local-staff-2',
          email: 'cleaning.supervisor@islamiaguesthouse.com',
          name: 'Kamrul Hasan (Housekeeping)',
          role: 'staff',
          staffSecretKey: 'ISLAMIA-STAFF-2026',
          hrApproved: false
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Master Secret Passcode state
  const [masterPasscode, setMasterPasscode] = useState<string>(() => {
    return localStorage.getItem('master_staff_passcode') || 'ISLAMIA-STAFF-2026';
  });
  const [editingPasscode, setEditingPasscode] = useState<string>(masterPasscode);
  const [isEditingPasscode, setIsEditingPasscode] = useState<boolean>(false);

  // Search & Filter States
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [chamberSearch, setChamberSearch] = useState<string>('');
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Chamber Creation / Editing State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState<boolean>(false);
  const [newRoomNo, setNewRoomNo] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('single');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(1500);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(2);
  const [newRoomDesc, setNewRoomDesc] = useState<string>('');
  const [newRoomImg, setNewRoomImg] = useState<string>('');

  // Editing price modal / state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  // Selected Booking Invoice Modal State
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // Property Details State
  const [propertyHotline, setPropertyHotline] = useState<string>('01909-806960');
  const [propertyAddress, setPropertyAddress] = useState<string>('House 38, Road 2, Dhanmondi, Dhaka 1205');
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(5);

  // Update staff HR Approval status
  const toggleStaffApproval = (email: string) => {
    const updated = registeredUsers.map(user => {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        const nextApproved = !user.hrApproved;
        showToast({
          type: 'success',
          message: nextApproved 
            ? `✅ Staff account for ${user.name} approved by HR/Admin!` 
            : `⚠️ HR authorization revoked for ${user.name}.`
        });
        return { ...user, hrApproved: nextApproved };
      }
      return user;
    });
    setRegisteredUsers(updated);
    localStorage.setItem('hotel_registered_users', JSON.stringify(updated));
  };

  // Delete staff user profile
  const deleteStaffUser = (email: string) => {
    if (window.confirm(`Are you sure you want to remove user account ${email}?`)) {
      const updated = registeredUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      setRegisteredUsers(updated);
      localStorage.setItem('hotel_registered_users', JSON.stringify(updated));
      showToast({
        type: 'info',
        message: `User record for ${email} removed from system registry.`
      });
    }
  };

  // Save Master Staff Secret Passcode
  const handleSaveMasterPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editingPasscode.trim().toUpperCase();
    if (!clean) return;
    setMasterPasscode(clean);
    localStorage.setItem('master_staff_passcode', clean);
    setIsEditingPasscode(false);
    showToast({
      type: 'success',
      message: `🔑 Master Staff Secret Passcode updated to: ${clean}`
    });
  };

  // Calculate Key Financial Metrics
  const metrics = useMemo(() => {
    const totalEarnings = bookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'checked-in' || b.status === 'checked-out') {
        return sum + (b.totalAmount || 0);
      }
      return sum;
    }, 0);

    const checkedOutEarnings = bookings.reduce((sum, b) => {
      if (b.status === 'checked-out') return sum + (b.totalAmount || 0);
      return sum;
    }, 0);

    const activeBookingsCount = bookings.filter(b => b.status === 'checked-in' || b.status === 'confirmed').length;
    const occupiedChambersCount = rooms.filter(r => r.status === 'occupied').length;
    const occupancyPercentage = rooms.length > 0 ? Math.round((occupiedChambersCount / rooms.length) * 100) : 0;
    const pendingServicesCount = serviceRequests.filter(s => s.status === 'pending').length;

    const staffAccountsCount = registeredUsers.filter(u => u.role === 'staff').length;
    const pendingStaffApprovals = registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length;

    return {
      totalEarnings,
      checkedOutEarnings,
      activeBookingsCount,
      occupiedChambersCount,
      occupancyPercentage,
      pendingServicesCount,
      staffAccountsCount,
      pendingStaffApprovals
    };
  }, [bookings, rooms, serviceRequests, registeredUsers]);

  // Filtered Users for Staff tab
  const filteredStaff = useMemo(() => {
    return registeredUsers.filter(u => 
      u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(staffSearch))
    );
  }, [registeredUsers, staffSearch]);

  // Filtered Chambers for Chambers tab
  const filteredChambers = useMemo(() => {
    return rooms.filter(r => 
      r.number.toLowerCase().includes(chamberSearch.toLowerCase()) ||
      r.type.toLowerCase().includes(chamberSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(chamberSearch.toLowerCase())
    );
  }, [rooms, chamberSearch]);

  // Filtered Bookings for Reservations tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        (b.guestName && b.guestName.toLowerCase().includes(reservationSearch.toLowerCase())) ||
        (b.guestPhone && b.guestPhone.includes(reservationSearch)) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(reservationSearch.toLowerCase())) ||
        (b.nidNumber && b.nidNumber.includes(reservationSearch));
      
      const matchesStatus = reservationStatusFilter === 'all' || b.status === reservationStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, reservationSearch, reservationStatusFilter]);

  // Handle Chamber Add Submit
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNo.trim()) return;

    await addRoom({
      number: newRoomNo.trim(),
      type: newRoomType,
      price: newRoomPrice,
      status: 'available',
      capacity: newRoomCapacity,
      description: newRoomDesc || `${newRoomType.toUpperCase()} Chamber at Islamia Guest House Dhanmondi`,
      imageUrl: newRoomImg || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800'
    });

    setIsAddRoomOpen(false);
    setNewRoomNo('');
    setNewRoomDesc('');
    setNewRoomImg('');
    showToast({
      type: 'success',
      message: `🏨 New Chamber #${newRoomNo} added to inventory!`
    });
  };

  // Save Edit Price
  const handleSavePrice = async (roomId: string) => {
    if (editingPrice <= 0) return;
    await editRoomDetails(roomId, { price: editingPrice });
    setEditingRoomId(null);
    showToast({
      type: 'success',
      message: `৳ Nightly tariff updated to ৳${editingPrice.toLocaleString()}/night`
    });
  };

  const { currentUser } = useApp();
  const [panelUnlocked, setPanelUnlocked] = useState<boolean>(() => {
    return currentUser?.role === 'admin' || sessionStorage.getItem('admin_authorized') === 'true';
  });
  const [gatePasscode, setGatePasscode] = useState<string>('');
  const [gateError, setGateError] = useState<string>('');

  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    const clean = gatePasscode.trim().toUpperCase();
    const validCodes = ['ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', '123456', 'ISLAMIA2026', masterPasscode];

    if (validCodes.includes(clean)) {
      sessionStorage.setItem('admin_authorized', 'true');
      setPanelUnlocked(true);
      showToast({
        type: 'success',
        message: '🔓 Executive Admin Panel unlocked.'
      });
    } else {
      setGateError('Access Denied: Invalid Admin Passcode. Guests, regular Staff, and HR users cannot view Admin controls without authorization.');
    }
  };

  const handleLockPanel = () => {
    sessionStorage.removeItem('admin_authorized');
    setPanelUnlocked(false);
    showToast({
      type: 'info',
      message: '🔒 Admin Panel locked.'
    });
  };

  if (!panelUnlocked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl max-w-md w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-slate-800">
              Admin Panel Security Lock
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              This panel contains sensitive revenue records, room tariff controls, and staff permissions.
            </p>
          </div>

          {gateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockGate} className="space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 font-mono">
                Enter Admin Executive Passcode *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={gatePasscode}
                  onChange={(e) => setGatePasscode(e.target.value)}
                  placeholder="Enter ADMIN2026"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 text-slate-900 rounded-xl text-xs font-mono font-bold transition focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpMode('receptionist')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Back to Front Desk
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock Panel</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Executive Admin Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Management Level</span>
              </span>
              <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                {isFirebaseActive ? 'Realtime Database Connected' : 'Local Sandbox Mode'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
              <span>Executive Admin Control Center</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-sans">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Islamia Guest House • House 38, Road 2, Dhanmondi, Dhaka 1205</span>
            </p>
          </div>

          {/* Quick Operational Switcher & Lock */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setOpMode('receptionist')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                opMode === 'receptionist'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Front Desk View</span>
            </button>
            <button
              onClick={handleLockPanel}
              title="Lock Admin Panel"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
            <button
              onClick={() => setOpMode('hr')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                opMode === 'hr'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>HR Archives</span>
            </button>
            <button
              onClick={() => setOpMode('admin')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                opMode === 'admin'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Gross Earnings</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850">
            ৳{metrics.totalEarnings.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Checked-out: <span className="font-semibold text-emerald-600">৳{metrics.checkedOutEarnings.toLocaleString()}</span>
          </p>
        </div>

        {/* Metric 2: Occupancy Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Chamber Occupancy</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850 flex items-baseline gap-2">
            <span>{metrics.occupancyPercentage}%</span>
            <span className="text-xs font-normal text-slate-500">({metrics.occupiedChambersCount}/{rooms.length})</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-500 h-full transition-all duration-500" 
              style={{ width: `${metrics.occupancyPercentage}%` }} 
            />
          </div>
        </div>

        {/* Metric 3: Active Bookings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Active Guests</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850">
            {metrics.activeBookingsCount} Reservations
          </div>
          <p className="text-[11px] text-slate-500">
            Total Ledger Records: <span className="font-semibold text-slate-700">{bookings.length}</span>
          </p>
        </div>

        {/* Metric 4: Staff HR Approvals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Staff Approvals</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850 flex items-center gap-2">
            <span>{metrics.staffAccountsCount} Staff</span>
            {metrics.pendingStaffApprovals > 0 && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-sans font-bold text-[10px] rounded-full animate-pulse">
                {metrics.pendingStaffApprovals} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Master Key: <span className="font-mono font-bold text-slate-700">{masterPasscode}</span>
          </p>
        </div>

        {/* Metric 5: Pending Service Tickets */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Service Tickets</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850">
            {metrics.pendingServicesCount} Pending
          </div>
          <p className="text-[11px] text-slate-500">
            Guest Reviews: <span className="font-semibold text-slate-700">{feedbacks.length} Submissions</span>
          </p>
        </div>
      </div>

      {/* Main Admin Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap items-center gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <span>Analytics &amp; Revenue</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition relative ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>Staff &amp; HR Approvals</span>
          {metrics.pendingStaffApprovals > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('chambers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'chambers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-sky-400" />
          <span>Chamber Inventory &amp; Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'reservations'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Master Guest Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-400" />
          <span>System Settings</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & REVENUE OVERVIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Breakdown by Room Type */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span>Earnings Distribution by Chamber Category</span>
                  </h3>
                  <p className="text-xs text-slate-400">Gross income generated across room tiers in Dhaka Dhanmondi.</p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/50">
                  Total: ৳{metrics.totalEarnings.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(['single', 'double', 'deluxe', 'suite'] as RoomType[]).map(type => {
                  const typeBookings = bookings.filter(b => b.roomType === type || rooms.find(r => r.id === b.roomId)?.type === type);
                  const typeRevenue = typeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                  const typeRoomCount = rooms.filter(r => r.type === type).length;
                  const typeOccupied = rooms.filter(r => r.type === type && r.status === 'occupied').length;

                  return (
                    <div key={type} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                          {type === 'single' ? 'Standard Single' : type === 'double' ? 'Deluxe Double' : type === 'deluxe' ? 'Executive Premium' : 'Family Suite'}
                        </span>
                        <span className="text-xs font-bold font-mono text-teal-700">৳{typeRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Chambers Count: {typeRoomCount}</span>
                        <span>Occupied: {typeOccupied}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-800 h-full"
                          style={{ width: `${typeRoomCount > 0 ? Math.round((typeOccupied / typeRoomCount) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick System Audit Status */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security &amp; Database Health</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600 font-medium">Database Engine:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {isFirebaseActive ? 'Firestore Realtime' : 'LocalStorage Sandbox'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600 font-medium">Master Staff Passcode:</span>
                  <span className="font-bold text-teal-700 font-mono">{masterPasscode}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600 font-medium">Total Feedback Reviews:</span>
                  <span className="font-bold text-slate-800 font-mono">{feedbacks.length} Submissions</span>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-200/60 rounded-xl space-y-1">
                  <span className="font-bold text-teal-800 block">System Compliance Note</span>
                  <p className="text-[11px] text-teal-700 leading-snug">
                    All front desk guest records automatically store Bangladesh Zila District, NID identification, and phone details for local law compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & HR APPROVALS */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Master Staff ID Secret Key Configurator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Master Staff ID Secret Passcode Configurator</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Staff members must provide this Secret Passcode during sign up or sign in to request HR authorization.
                </p>
              </div>

              {!isEditingPasscode ? (
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold rounded-xl text-sm tracking-wider">
                    {masterPasscode}
                  </div>
                  <button
                    onClick={() => setIsEditingPasscode(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Key</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveMasterPasscode} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editingPasscode}
                    onChange={(e) => setEditingPasscode(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-slate-950 border border-amber-500/50 text-amber-300 font-mono font-bold rounded-xl text-xs focus:outline-none uppercase"
                    placeholder="e.g. ISLAMIA-STAFF-2026"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPasscode(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Registered Staff Accounts & HR Approvals Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Staff &amp; Receptionist User Registry</span>
                </h3>
                <p className="text-xs text-slate-400">Manage HR approval status, grant or revoke staff login permissions.</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by Name or Email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Staff Name &amp; Contact</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">HR Status</th>
                    <th className="p-3 text-right">HR Authorization Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No registered staff accounts match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((user, idx) => (
                      <tr key={user.uid || idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs font-mono uppercase">
                              {user.name.slice(0, 1)}
                            </div>
                            <div>
                              <span>{user.name}</span>
                              {user.phone && <p className="text-[10px] text-slate-400 font-mono">{user.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-700">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.hrApproved ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>HR Authorized</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Pending HR Review</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => toggleStaffApproval(user.email)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                              user.hrApproved
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-sm'
                            }`}
                          >
                            {user.hrApproved ? 'Revoke Access' : 'Approve Staff'}
                          </button>
                          <button
                            onClick={() => deleteStaffUser(user.email)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove User Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHAMBERS & TARIFF MATRIX */}
      {activeTab === 'chambers' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Chamber Control Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  <span>Chamber Inventory &amp; Tariff Management</span>
                </h3>
                <p className="text-xs text-slate-400">Add new rooms, update nightly pricing (৳), and change chamber maintenance statuses.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={chamberSearch}
                    onChange={(e) => setChamberSearch(e.target.value)}
                    placeholder="Search Chamber # or Type..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddRoomOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>Add Chamber</span>
                </button>
              </div>
            </div>

            {/* Chamber List Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Chamber #</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Nightly Tariff (৳)</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right">Chamber Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChambers.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold font-mono text-slate-850 text-sm">
                        #{room.number}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 capitalize">
                          {room.type} Chamber
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-700">
                        {editingRoomId === room.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-teal-500 rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => handleSavePrice(room.id)}
                              className="px-2 py-1 bg-teal-500 text-slate-950 font-bold rounded text-[10px]"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>৳{room.price.toLocaleString()}</span>
                            <button
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setEditingPrice(room.price);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Edit Tariff"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {room.capacity} Guests
                      </td>
                      <td className="p-3">
                        <select
                          value={room.status}
                          onChange={(e) => updateRoomStatus(room.id, e.target.value as RoomStatus)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-none cursor-pointer focus:outline-none ${
                            room.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                            room.status === 'occupied' ? 'bg-rose-100 text-rose-800' :
                            room.status === 'cleaning' ? 'bg-sky-100 text-sky-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => editRoomDetails(room.id, { description: `${room.description} (Inspected)` })}
                          className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
                        >
                          Inspection Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MASTER RESERVATION LEDGER */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Master Reservation &amp; Billing Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">Review all historical, active, and completed guest reservations in Dhaka.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                >
                  <option value="all">All Booking Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked-in">Checked-In</option>
                  <option value="checked-out">Checked-Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    placeholder="Search by Guest, Phone, or NID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Master Bookings Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Guest Name &amp; Contact</th>
                    <th className="p-3">Chamber</th>
                    <th className="p-3">Check-In / Out</th>
                    <th className="p-3">NID / Zila</th>
                    <th className="p-3">Total Tariff</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Invoice &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No reservation records match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          <div>
                            <span>{b.guestName || 'Unnamed Guest'}</span>
                            <p className="text-[10px] text-slate-400 font-mono">{b.guestPhone || 'No phone'}</p>
                          </div>
                        </td>
                        <td className="p-3 font-bold font-mono text-slate-800">
                          #{b.roomNumber || 'N/A'}
                        </td>
                        <td className="p-3 text-[11px] font-mono text-slate-600">
                          {b.checkInDate} &rarr; {b.checkOutDate}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>
                            <span>{b.nidNumber || 'N/A'}</span>
                            {b.zilaDistrict && <p className="text-[10px] text-slate-400">{b.zilaDistrict}</p>}
                          </div>
                        </td>
                        <td className="p-3 font-bold font-mono text-teal-700">
                          ৳{(b.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                            className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold border-none cursor-pointer focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked-in">Checked-In</option>
                            <option value="checked-out">Checked-Out</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedInvoiceBooking(b)}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold hover:bg-slate-800 transition flex items-center gap-1 ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5 text-teal-400" />
                            <span>Print Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS & PROPERTY AUDIT */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hotel Business Settings */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>Guest House Metadata &amp; Hotline</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Hotline Contact Number
                  </label>
                  <input
                    type="text"
                    value={propertyHotline}
                    onChange={(e) => setPropertyHotline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Property Address (Dhanmondi Dhaka)
                  </label>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Default Service Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={propertyTaxRate}
                    onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => showToast({ type: 'success', message: 'Property metadata & hotline saved successfully.' })}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Maintenance & Data Management */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
                <RefreshCw className="w-4 h-4 text-teal-600" />
                <span>Database Operations &amp; Sandbox Reset</span>
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Use administrative controls to re-initialize room inventory or restore standard Dhanmondi guest records for simulation testing.
              </p>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('hotel_rooms');
                    localStorage.removeItem('hotel_bookings');
                    window.location.reload();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-teal-400" />
                  <span>Restore Standard Seed Inventory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Chamber Modal Dialog */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span>Add New Guest House Chamber</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Chamber Number *</label>
                  <input
                    type="text"
                    required
                    value={newRoomNo}
                    onChange={(e) => setNewRoomNo(e.target.value)}
                    placeholder="e.g. 501"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                  >
                    <option value="single">Standard Single</option>
                    <option value="double">Deluxe Double</option>
                    <option value="deluxe">Executive Premium</option>
                    <option value="suite">Family Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nightly Tariff (৳ BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newRoomPrice || ''}
                    onChange={(e) => setNewRoomPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono font-bold text-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Guest Capacity *</label>
                  <input
                    type="number"
                    required
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Description / Amenities</label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="e.g. AC, Attached Bath, High-speed Wi-Fi, Balcony..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition"
                >
                  Create Chamber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceBooking && (
        <PrintableInvoice
          booking={selectedInvoiceBooking}
          rooms={rooms}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      )}
    </div>
  );
};
