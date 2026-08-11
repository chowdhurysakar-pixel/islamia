import React, { useState } from 'react';
import {
  Users,
  Building,
  Receipt,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Key,
  X,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  BedDouble
} from 'lucide-react';

// --- TYPES ---
export type RoomType = 'single' | 'double' | 'deluxe' | 'suite';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  capacity: number;
  status: RoomStatus;
  description: string;
  image: string;
}

export interface UserAccount {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  hrApproved: boolean;
}

export interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  nidNumber?: string;
  roomId: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: BookingStatus;
}

interface AdminPanelProps {
  rooms?: Room[];
  staffList?: UserAccount[];
  bookings?: Booking[];
  onUpdateRoom?: (room: Room) => void;
  onDeleteRoom?: (id: string) => void;
  onAddRoom?: (room: Omit<Room, 'id'>) => void;
  onToggleStaffApproval?: (email: string) => void;
  onDeleteStaff?: (email: string) => void;
  onUpdateBookingStatus?: (id: string, status: BookingStatus) => void;
  opMode?: 'live' | 'demo';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  rooms = [],
  staffList = [],
  bookings = [],
  onUpdateRoom,
  onDeleteRoom,
  onAddRoom,
  onToggleStaffApproval,
  onDeleteStaff,
  onUpdateBookingStatus,
  opMode = 'live',
}) => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'chambers' | 'reservations' | 'settings'>('analytics');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);
  
  // Search & Filter States
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [chamberSearch, setChamberSearch] = useState<string>('');
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<BookingStatus | 'all'>('all');

  // Modals & Forms
  const [isAddRoomOpen, setIsAddRoomOpen] = useState<boolean>(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // New Room Form Fields
  const [newRoomNo, setNewRoomNo] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('single');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(2500);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(2);
  const [newRoomDesc, setNewRoomDesc] = useState<string>('');
  const [newRoomImg, setNewRoomImg] = useState<string>('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800');

  // Settings
  const [propertyHotline, setPropertyHotline] = useState<string>('+880 1700-000000');
  const [propertyAddress, setPropertyAddress] = useState<string>('Road 11, Banani, Dhaka, Bangladesh');
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(15);
  const [masterPasscode, setMasterPasscode] = useState<string>('1234');
  const [editingPasscode, setEditingPasscode] = useState<string>('1234');

  // --- SAFE FILTERING (Safety Guards) ---
  const filteredStaff = (staffList || []).filter(
    (user) =>
      user.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const filteredChambers = (rooms || []).filter(
    (room) =>
      room.number?.toLowerCase().includes(chamberSearch.toLowerCase()) ||
      room.type?.toLowerCase().includes(chamberSearch.toLowerCase())
  );

  const filteredBookings = (bookings || []).filter((b) => {
    const matchesQuery =
      b.guestName?.toLowerCase().includes(reservationSearch.toLowerCase()) ||
      b.guestPhone?.includes(reservationSearch) ||
      b.roomNumber?.toLowerCase().includes(reservationSearch.toLowerCase());
    
    const matchesStatus =
      reservationStatusFilter === 'all' || b.status === reservationStatusFilter;

    return matchesQuery && matchesStatus;
  });

  // Analytics Metrics (Safely Calculated)
  const totalRevenue = (bookings || [])
    .filter((b) => b.status === 'confirmed' || b.status === 'checked-in' || b.status === 'checked-out')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const occupiedCount = (rooms || []).filter((r) => r.status === 'occupied').length;
  const pendingApprovalsCount = (staffList || []).filter((s) => !s.hrApproved).length;

  // --- HANDLERS ---
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === masterPasscode) {
      setIsLocked(false);
      setPasscodeError(false);
      setPasscode('');
    } else {
      setPasscodeError(true);
    }
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNo) return;

    if (onAddRoom) {
      onAddRoom({
        number: newRoomNo,
        type: newRoomType,
        price: newRoomPrice,
        capacity: newRoomCapacity,
        status: 'available',
        description: newRoomDesc || 'Standard Guest Chamber',
        image: newRoomImg,
      });
    }

    setIsAddRoomOpen(false);
    setNewRoomNo('');
    setNewRoomDesc('');
  };

  const handleSavePrice = (roomId: string) => {
    const room = (rooms || []).find((r) => r.id === roomId);
    if (room && onUpdateRoom) {
      onUpdateRoom({ ...room, price: editingPrice });
    }
    setEditingRoomId(null);
  };

  const exportGuestLogsToCSV = (data: Booking[]) => {
    const headers = ['Booking ID,Guest Name,Phone,NID,Room,Check-In,Check-Out,Amount,Status\n'];
    const rows = data.map(
      (b) =>
        `"${b.id}","${b.guestName}","${b.guestPhone}","${b.nidNumber || ''}","${
          b.roomNumber || b.roomId
        }","${b.checkIn}","${b.checkOut}","${b.totalAmount}","${b.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // --- SECURITY LOCK SCREEN ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-850">Admin Terminal Locked</h2>
            <p className="text-xs text-slate-500 mt-1">Please enter master passcode to authenticate access.</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full text-center py-3 text-lg font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
            />
            {passcodeError && (
              <p className="text-xs font-bold text-rose-600">Invalid Passcode. Please try again.</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans text-slate-800">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Admin Command Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
              {opMode} Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System Control Center • Chamber Inventory, HR Approvals & Guest Ledgers
          </p>
        </div>

        <button
          onClick={() => setIsLocked(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-slate-500" />
          <span>Lock Console</span>
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'analytics', label: 'Overview & Metrics', icon: TrendingUp },
          { id: 'staff', label: 'Staff & HR Access', icon: Users, badge: pendingApprovalsCount },
          { id: 'chambers', label: 'Chamber Inventory', icon: Building },
          { id: 'reservations', label: 'Guest Ledger', icon: Receipt },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase">Gross Revenue</p>
                <h3 className="text-xl font-bold font-mono text-slate-800">৳{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
                <BedDouble className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase">Occupied Chambers</p>
                <h3 className="text-xl font-bold font-mono text-slate-800">
                  {occupiedCount} / {(rooms || []).length}
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase">Registered Staff</p>
                <h3 className="text-xl font-bold font-mono text-slate-800">{(staffList || []).length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase">Pending HR Approvals</p>
                <h3 className="text-xl font-bold font-mono text-slate-800">{pendingApprovalsCount}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>System Health & Active Configuration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Master Security Passcode:</span>
                <span className="font-bold text-slate-800 font-mono">Configured</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center">
                <span className="text-slate-600 font-medium">HR Staff Approval Enforcement:</span>
                <span className="font-bold text-emerald-700">Active</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Active Operational View:</span>
                <span className="font-bold text-teal-700 uppercase font-mono">{opMode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & HR APPROVALS */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Registered Staff &amp; HR Verification</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage receptionists, housekeeping staff, and authorize HR access permissions.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff name or email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Staff Member</th>
                  <th className="py-3 px-4 font-bold">Email / Contact</th>
                  <th className="py-3 px-4 font-bold">Role Tier</th>
                  <th className="py-3 px-4 font-bold">HR Approval Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No staff accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{user.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.hrApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>HR Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pending HR Access</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => onToggleStaffApproval && onToggleStaffApproval(user.email)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            user.hrApproved
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {user.hrApproved ? 'Revoke Approval' : 'Approve Staff'}
                        </button>

                        <button
                          onClick={() => onDeleteStaff && onDeleteStaff(user.email)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Account"
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
      )}

      {/* TAB 3: CHAMBER INVENTORY */}
      {activeTab === 'chambers' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-600" />
                <span>Chamber Master Inventory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update tariffs, edit room details, or register new chambers.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chamberSearch}
                  onChange={(e) => setChamberSearch(e.target.value)}
                  placeholder="Search chamber # or type..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <button
                onClick={() => setIsAddRoomOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chamber</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChambers.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img src={room.image} alt={`Chamber ${room.number}`} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${
                        room.status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : room.status === 'occupied'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-serif font-bold text-slate-800">Chamber #{room.number}</h4>
                        <p className="text-xs text-slate-500 font-mono uppercase">
                          {room.type} • Capacity: {room.capacity} Persons
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-teal-700">
                          ৳{room.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/night</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{room.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingRoomId(room.id);
                        setEditingPrice(room.price);
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Tariff</span>
                    </button>

                    <button
                      onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete Chamber"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RESERVATIONS & GUEST LEDGER */}
      {activeTab === 'reservations' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Master Reservation &amp; Guest Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                View all guest bookings, track check-ins/outs, and export invoices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                  placeholder="Search guest, NID, room..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <select
                value={reservationStatusFilter}
                onChange={(e) => setReservationStatusFilter(e.target.value as BookingStatus | 'all')}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-600"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => exportGuestLogsToCSV(filteredBookings)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Booking ID</th>
                  <th className="py-3 px-4 font-bold">Guest Details</th>
                  <th className="py-3 px-4 font-bold">Chamber #</th>
                  <th className="py-3 px-4 font-bold">Check-In / Out</th>
                  <th className="py-3 px-4 font-bold">Total Tariff</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No reservation records found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        #{b.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{b.guestName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.guestPhone}</div>
                        {b.nidNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">NID: {b.nidNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        Chamber #{b.roomNumber || b.roomId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        <div>In: {b.checkIn}</div>
                        <div>Out: {b.checkOut}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-850">
                        ৳{b.totalAmount?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={b.status}
                          onChange={(e) =>
                            onUpdateBookingStatus &&
                            onUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                          }
                          className={`py-1 px-2 rounded-full text-[10px] font-mono font-bold uppercase border focus:outline-none cursor-pointer ${
                            b.status === 'checked-in'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : b.status === 'checked-out'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : b.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : b.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="checked-in">Checked In</option>
                          <option value="checked-out">Checked Out</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceBooking(b)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-600" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <span>Guest House Profile Settings</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 font-mono">Front Desk Hotline</label>
                <input
                  type="text"
                  value={propertyHotline}
                  onChange={(e) => setPropertyHotline(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 font-mono">Property Physical Address</label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 font-mono">Applicable Service Tax (%)</label>
                <input
                  type="number"
                  value={propertyTaxRate}
                  onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key className="w-5 h-5 text-amber-500" />
              <span>Master Staff Passcode Config</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              This secret passcode controls unlock privileges and front-desk security access.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMasterPasscode(editingPasscode);
                alert('Master passcode updated successfully.');
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-600 font-mono uppercase">New Master Passcode</label>
                <input
                  type="text"
                  value={editingPasscode}
                  onChange={(e) => setEditingPasscode(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Update Master Passcode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CHAMBER */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-800">Add New Chamber</h3>
              <button
                onClick={() => setIsAddRoomOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Chamber Number *</label>
                  <input
                    type="text"
                    required
                    value={newRoomNo}
                    onChange={(e) => setNewRoomNo(e.target.value)}
                    placeholder="e.g. 105"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Room Type</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Nightly Rate (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Capacity (Persons)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Chamber description and amenities..."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Image URL</label>
                <input
                  type="url"
                  value={newRoomImg}
                  onChange={(e) => setNewRoomImg(e.target.value)}
                  placeholder="https://..."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Create Chamber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TARIFF PRICE */}
      {editingRoomId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-serif font-bold text-slate-800">Edit Nightly Tariff</h3>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-600 font-mono">New Rate (BDT ৳)</label>
              <input
                type="number"
                value={editingPrice}
                onChange={(e) => setEditingPrice(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                onClick={() => setEditingRoomId(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSavePrice(editingRoomId)}
                className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE INVOICE */}
      {selectedInvoiceBooking && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-800">Guest Invoice Summary</h3>
              <button
                onClick={() => setSelectedInvoiceBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice ID:</span>
                <span className="font-bold text-slate-800">INV-{selectedInvoiceBooking.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name:</span>
                <span className="font-bold text-slate-800">{selectedInvoiceBooking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone / NID:</span>
                <span className="font-bold text-slate-800">
                  {selectedInvoiceBooking.guestPhone} {selectedInvoiceBooking.nidNumber ? `| NID: ${selectedInvoiceBooking.nidNumber}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chamber Allocated:</span>
                <span className="font-bold text-teal-700">Chamber #{selectedInvoiceBooking.roomNumber || selectedInvoiceBooking.roomId}</span>
              </div>
              <div className="flex justify-between border-t border-b border-slate-100 py-2">
                <span className="text-slate-500">Dates:</span>
                <span className="font-bold text-slate-800">{selectedInvoiceBooking.checkIn} to {selectedInvoiceBooking.checkOut}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">Total BDT Amount:</span>
                <span className="font-bold text-emerald-700">৳{selectedInvoiceBooking.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
