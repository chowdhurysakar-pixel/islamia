/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, ServiceRequest, RoomType, RoomStatus, BookingStatus, ServiceRequestStatus } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { 
  Building, CheckSquare, Clock, AlertCircle, Sparkles, Filter, 
  Search, ShieldAlert, BadgeInfo, Play, CheckCircle2, TicketPlus, 
  Plus, ChevronRight, Receipt, Printer, UserCheck, MapPin, 
  CreditCard, History, User, Check, X, ShieldCheck, Settings
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    serviceRequests, 
    addRoom, 
    updateRoomStatus, 
    createBooking,
    updateBookingStatus, 
    updateServiceRequestStatus 
  } = useApp();

  // Mode Simulation Toggles are local to the operations center:
  // - "receptionist": accesses rooms & the live checkout log (+ receipt viewing of active stays)
  // - "hr": receptionist + full historical logs database access & archive search
  const [opMode, setOpMode] = useState<'receptionist' | 'hr'>('receptionist');

  // Active logs search and states
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<ServiceRequestStatus | 'all'>('all');

  // Rooms creation State
  const [isAddingRoom, setIsAddingRoom] = useState<boolean>(false);
  const [newRoomNo, setNewRoomNo] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('single');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(150);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(2);
  const [newRoomDescription, setNewRoomDescription] = useState<string>('');
  const [newRoomImage, setNewRoomImage] = useState<string>('');

  // Front Desk Custom Room Billing Desk States
  const [posSelectedRoomId, setPosSelectedRoomId] = useState<string>('');
  const [posCustomerName, setPosCustomerName] = useState<string>('');
  const [posCustomerPhone, setPosCustomerPhone] = useState<string>('');
  const [posCustomerNid, setPosCustomerNid] = useState<string>('');
  const [posCustomerUpazila, setPosCustomerUpazila] = useState<string>('');
  const [posCustomerZila, setPosCustomerZila] = useState<string>('');
  const [posCheckIn, setPosCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [posCheckOut, setPosCheckOut] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [posCustomBill, setPosCustomBill] = useState<string>(''); // Blank to autocalculate, editable to override
  const [receptionistGuests, setReceptionistGuests] = useState<{ name: string; phone: string; }[]>([]);
  const [posReferenceName, setPosReferenceName] = useState<string>('');
  const [receptionistKids, setReceptionistKids] = useState<{ name: string; age: string; }[]>([]);

  const handleAddReceptionistGuest = () => {
    if (receptionistGuests.length < 15) {
      setReceptionistGuests([...receptionistGuests, { name: '', phone: '' }]);
    }
  };

  const handleUpdateReceptionistGuest = (index: number, key: 'name' | 'phone', value: string) => {
    const updated = [...receptionistGuests];
    updated[index][key] = value;
    setReceptionistGuests(updated);
  };

  const handleRemoveReceptionistGuest = (index: number) => {
    setReceptionistGuests(receptionistGuests.filter((_, i) => i !== index));
  };

  const handleAddReceptionistKid = () => {
    if (receptionistKids.length < 10) {
      setReceptionistKids([...receptionistKids, { name: '', age: '' }]);
    }
  };

  const handleUpdateReceptionistKid = (index: number, key: 'name' | 'age', value: string) => {
    const updated = [...receptionistKids];
    updated[index][key] = value;
    setReceptionistKids(updated);
  };

  const handleRemoveReceptionistKid = (index: number) => {
    setReceptionistKids(receptionistKids.filter((_, i) => i !== index));
  };

  // Detailed Modal Bill/Receipt state
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [selectedRoomToManage, setSelectedRoomToManage] = useState<Room | null>(null);

  // Stats Analytics Calculations
  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;
    
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const pendingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
    const pendingServices = serviceRequests.filter(s => s.status !== 'completed').length;

    return { total, occupied, available, cleaning, maintenance, rate, pendingBookings, pendingServices };
  }, [rooms, bookings, serviceRequests]);

  // Handle auto-room price filling upon front desk selector
  const selectedRoomDetails = useMemo(() => {
    if (!posSelectedRoomId) return null;
    return rooms.find(r => r.id === posSelectedRoomId);
  }, [posSelectedRoomId, rooms]);

  // Helper stays calculator
  const calcNights = (inD: string, outD: string) => {
    const start = new Date(inD);
    const end = new Date(outD);
    const diff = end.getTime() - start.getTime();
    if (isNaN(diff)) return 1;
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const calculatedBasePrice = useMemo(() => {
    if (!selectedRoomDetails) return 0;
    const nights = calcNights(posCheckIn, posCheckOut);
    return selectedRoomDetails.price * nights;
  }, [selectedRoomDetails, posCheckIn, posCheckOut]);

  // Room submission
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNo) return;
    
    await addRoom({
      number: newRoomNo,
      type: newRoomType,
      price: newRoomPrice,
      capacity: newRoomCapacity,
      description: newRoomDescription || `${newRoomType.toUpperCase()} Suite featuring high speed Wi-Fi and modern amenities.`,
      image: newRoomImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
      status: 'available',
      amenities: ['Wi-Fi', 'Air Conditioning', 'LED TV', 'Bathroom En-suite']
    });

    setNewRoomNo('');
    setNewRoomDescription('');
    setNewRoomImage('');
    setIsAddingRoom(false);
  };

  // Click room visual grid handler to bind instantly to Front Desk Booking Form
  const triggerDeskFromRoom = (room: Room) => {
    if (room.status !== 'available') {
      setSelectedRoomToManage(room);
      return;
    }
    setPosSelectedRoomId(room.id);
    setPosCustomBill(''); // reset to use standard pricing
    setReceptionistGuests([]);
    setPosReferenceName('');
    setReceptionistKids([]);
    // Scroll smoothly to Guest Desk form
    const formElement = document.getElementById('pos-guest-desk');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Submit fast front desk booking
  const handleDeskBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posSelectedRoomId) {
      alert("Please select a room number from the list.");
      return;
    }
    if (!posCustomerName || !posCustomerPhone) {
      alert("Please provide the basic Customer Name and Phone Number.");
      return;
    }

    const finalBill = posCustomBill ? Number(posCustomBill) : calculatedBasePrice;
    const targetRoom = rooms.find(r => r.id === posSelectedRoomId);
    
    if (!targetRoom) return;

    try {
      const gList = receptionistGuests.filter(g => g.name.trim() !== '');
      const kList = receptionistKids.filter(k => k.name.trim() !== '');
      const generatedRef = await createBooking({
        roomId: posSelectedRoomId,
        roomNumber: targetRoom.number,
        roomType: targetRoom.type,
        guestName: posCustomerName,
        guestEmail: `${posCustomerName.toLowerCase().replace(/\s+/g, '')}@islamiaguesthouse.com`,
        guestPhone: posCustomerPhone,
        nidNumber: posCustomerNid || 'Not Specified',
        upazila: posCustomerUpazila || 'Dhanmondi',
        zila: posCustomerZila || 'Dhaka',
        checkIn: posCheckIn,
        checkOut: posCheckOut,
        totalAmount: finalBill,
        status: 'checked-in', // Front-desk checkins go directly as checked-in!
        notes: `Checked in directly via front-desk guest registration desk at Dhanmondi, Dhaka.`,
        additionalGuests: gList,
        referenceName: posReferenceName.trim() || undefined,
        kids: kList
      });

      // Fetch the created booking object to launch the BILL INVOICE immediately!
      const finalBookingItem: Booking = {
        id: generatedRef,
        roomId: posSelectedRoomId,
        roomNumber: targetRoom.number,
        roomType: targetRoom.type,
        guestName: posCustomerName,
        guestEmail: `${posCustomerName.toLowerCase().replace(/\s+/g, '')}@islamiaguesthouse.com`,
        guestPhone: posCustomerPhone,
        nidNumber: posCustomerNid || 'Not Provided',
        upazila: posCustomerUpazila || 'Dhanmondi',
        zila: posCustomerZila || 'Dhaka',
        checkIn: posCheckIn,
        checkOut: posCheckOut,
        totalAmount: finalBill,
        status: 'checked-in',
        notes: 'Checked in directly via front-desk guest registration desk.',
        additionalGuests: gList,
        referenceName: posReferenceName.trim() || undefined,
        kids: kList,
        createdAt: new Date().toISOString()
      };

      setInvoiceBooking(finalBookingItem);
      setShowBillModal(true);

      // Clean form fields
      setPosCustomerName('');
      setPosCustomerPhone('');
      setPosCustomerNid('');
      setPosCustomerUpazila('');
      setPosCustomerZila('');
      setPosSelectedRoomId('');
      setPosCustomBill('');
      setReceptionistGuests([]);
      setPosReferenceName('');
      setReceptionistKids([]);
    } catch (err) {
      console.error(err);
      alert("An error occurred creating the booking in Google Firestore.");
    }
  };

  // Launch Invoice Modal for any given row/booking
  const openInvoiceForBooking = (bookingItem: Booking) => {
    // If room details exist, let's grab room metadata
    const rMatch = rooms.find(r => r.id === bookingItem.roomId);
    const hydratedBooking = {
      ...bookingItem,
      roomNumber: bookingItem.roomNumber || rMatch?.number || bookingItem.roomId,
      roomType: bookingItem.roomType || rMatch?.type || 'Standard Suite'
    };
    setInvoiceBooking(hydratedBooking);
    setShowBillModal(true);
  };

  // Filter Active bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filter out bookings that correspond to historical checked-out ones if in standard "receptionist" mode to keep UI simple
      if (opMode === 'receptionist' && booking.status === 'checked-out') {
        return false;
      }

      const matchStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
      
      const searchLower = bookingSearch.toLowerCase();
      const matchSearch = 
        booking.guestName.toLowerCase().includes(searchLower) ||
        booking.guestPhone.includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower) ||
        booking.roomId.toLowerCase().includes(searchLower) ||
        (booking.nidNumber && booking.nidNumber.includes(searchLower)) ||
        (booking.zila && booking.zila.toLowerCase().includes(searchLower));

      return matchStatus && matchSearch;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, opMode]);

  // HR Archival Only Customer Database List
  const hrHistoricalBookings = useMemo(() => {
    // Show only checked-out, cancelled, or general stays list historical records
    return bookings.filter(b => b.status === 'checked-out' || b.status === 'cancelled');
  }, [bookings]);

  const filteredServices = useMemo(() => {
    return serviceRequests.filter(req => {
      const matchStatus = serviceStatusFilter === 'all' || req.status === serviceStatusFilter;
      return matchStatus;
    });
  }, [serviceRequests, serviceStatusFilter]);

  // Memoized repeat guest lookup map by contact info (phone/email/name) to count of bookings
  const guestBookingCounts = useMemo(() => {
    const countsByPhone: Record<string, number> = {};
    const countsByEmail: Record<string, number> = {};
    const countsByName: Record<string, number> = {};

    bookings.forEach(b => {
      const phone = b.guestPhone?.trim();
      const email = b.guestEmail?.trim().toLowerCase();
      const name = b.guestName?.trim().toLowerCase();

      if (phone) countsByPhone[phone] = (countsByPhone[phone] || 0) + 1;
      if (email) countsByEmail[email] = (countsByEmail[email] || 0) + 1;
      if (name) countsByName[name] = (countsByName[name] || 0) + 1;
    });

    return { countsByPhone, countsByEmail, countsByName };
  }, [bookings]);

  const isRepeatGuest = (booking: Booking) => {
    const phone = booking.guestPhone?.trim();
    const email = booking.guestEmail?.trim().toLowerCase();
    const name = booking.guestName?.trim().toLowerCase();

    const phoneCount = phone ? (guestBookingCounts.countsByPhone[phone] || 0) : 0;
    const emailCount = email ? (guestBookingCounts.countsByEmail[email] || 0) : 0;
    const nameCount = name ? (guestBookingCounts.countsByName[name] || 0) : 0;

    // A repeat guest has at least 2 distinct bookings in the system under their phone, email, or name
    return phoneCount > 1 || emailCount > 1 || (nameCount > 1 && !phone && !email);
  };

  // Compute Total Bill breakups for Dhaka Taxes
  const getDhakaBillBreakup = (total: number) => {
    // 15% Dhaka Tourism VAT & 5% Service fee
    const vat = Math.round(total * 0.15);
    const serviceFee = Math.round(total * 0.05);
    const subtotal = total - vat - serviceFee;
    return {
      subtotal: subtotal > 0 ? subtotal : total,
      vat: subtotal > 0 ? vat : 0,
      serviceFee: subtotal > 0 ? serviceFee : 0,
      grandTotal: total
    };
  };

  return (
    <div className="space-y-8">
      {/* 1. Statistics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-white">
            <Building className="w-24 h-24" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-teal-400">
            Dhanmondi Occupancy
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-serif font-bold">{stats.rate}%</h3>
            <span className="text-[10px] text-slate-400">({stats.occupied} / {stats.total} Active)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3">
            <div className="bg-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.rate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
              Staff Chamber Duty
            </span>
            <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              Needs Service
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-serif font-bold text-slate-800">{stats.cleaning + stats.maintenance}</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              {stats.cleaning} Cleaning • {stats.maintenance} Maintenance Queues
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
              Active Stays
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              Checked In
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-serif font-bold text-slate-800">
              {bookings.filter(b => b.status === 'checked-in').length}
            </h3>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              In-house guests with active NID/Phone registry
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
              Reception Service Tickets
            </span>
            <span className="bg-teal-100 text-teal-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
              Active Request
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-serif font-bold text-slate-800">{stats.pendingServices}</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              Housekeeping or room-service logs remaining
            </span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL LEVEL USER ROLE SELECTOR (Required Scope Constraint) */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 pl-2">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
            Operational Privilege Mode:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="receptionist-desk-mode-btn"
            onClick={() => setOpMode('receptionist')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              opMode === 'receptionist'
                ? 'bg-slate-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Receptionist Front Desk</span>
          </button>
          <button
            id="hr-mode-btn"
            onClick={() => setOpMode('hr')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              opMode === 'hr'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HR Manager Archive Access</span>
          </button>
        </div>
      </div>

      {/* 3. Point Of Sale Fast Room Booking Desk */}
      <div id="pos-guest-desk" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Chamber Picker Visual Grid & Quick Binder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-baseline">
            <div className="space-y-0.5">
              <h3 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                Live Front Desk Room Tracker
              </h3>
              <p className="text-xs text-slate-400">
                Click any <span className="text-emerald-600 font-bold">Green (Available)</span> card to instantly bind details to the guest registration form.
              </p>
            </div>
            <button
              id="receptionist-add-room-btn"
              onClick={() => setIsAddingRoom(!isAddingRoom)}
              className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>
          </div>

          {/* Quick Room Creator Form */}
          {isAddingRoom && (
            <form 
              onSubmit={handleAddRoomSubmit}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Suite Number</label>
                <input
                  type="text"
                  placeholder="e.g. 502"
                  required
                  value={newRoomNo}
                  onChange={(e) => setNewRoomNo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Room Type</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-semibold text-slate-700"
                >
                  <option value="single">Single Room</option>
                  <option value="double">Double Bed deluxe</option>
                  <option value="deluxe">Executive Suite</option>
                  <option value="suite">VIP Suite</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Night Price (৳)</label>
                <input
                  type="number"
                  min="30"
                  max="1000"
                  required
                  value={newRoomPrice}
                  onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Max Cap</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Highlights</label>
                <input
                  type="text"
                  placeholder="e.g. Balcony overlooking Dhanmondi lake..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="col-span-2 flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-black"
                >
                  Save Chamber
                </button>
              </div>
            </form>
          )}

          {/* Visual Interactive Map List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {rooms.map(room => (
              <button
                key={room.id}
                id={`room-btn-${room.id}`}
                onClick={() => triggerDeskFromRoom(room)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[100px] active:scale-95 group ${
                  posSelectedRoomId === room.id
                    ? 'ring-2 ring-teal-600 bg-teal-50/40 border-teal-600'
                    : room.status === 'available'
                    ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'
                    : room.status === 'occupied'
                    ? 'bg-rose-50/20 border-rose-150 opacity-90'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-serif text-base font-bold text-slate-800">
                    Room {room.number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`room-manage-trigger-${room.id}`}
                      type="button"
                      title="Manage room status/chamber duty"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoomToManage(room);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all active:scale-90"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <span className={`w-2 h-2 rounded-full ${
                      room.status === 'available' ? 'bg-emerald-500 animate-pulse' :
                      room.status === 'occupied' ? 'bg-rose-500' :
                      room.status === 'cleaning' ? 'bg-amber-400' : 'bg-slate-400'
                    }`} />
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400 block">
                    {room.type}
                  </span>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs font-mono font-bold text-teal-700">
                      ৳{room.price * 10} / night
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Cap: {room.capacity}
                    </span>
                  </div>
                </div>

                {/* Instant Bind Visual Label */}
                {room.status === 'available' && (
                  <div className="absolute inset-0 bg-emerald-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs font-bold tracking-wider uppercase font-mono">
                      Book Instantly
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Instant Frontpage Billing form terminal */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
          <div className="space-y-0.5 border-b border-slate-200 pb-3">
            <h4 className="font-serif text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-800" />
              Front Desk booking Terminal
            </h4>
            <p className="text-[10px] text-slate-400">Front desk passenger registry form</p>
          </div>

          <form onSubmit={handleDeskBookingSubmit} className="space-y-3.5">
            {/* Selected Room Info */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block font-bold">
                  Billed Room Selection
                </span>
                <span className="font-serif text-sm font-bold text-slate-800">
                  {selectedRoomDetails ? `Room ${selectedRoomDetails.number}` : 'No Chamber Selected'}
                </span>
              </div>
              <div>
                {selectedRoomDetails ? (
                  <span className="bg-teal-50 text-teal-700 font-mono font-semibold px-2 py-1 rounded text-[10px] border border-teal-100 uppercase">
                    ৳{selectedRoomDetails.price * 10}/Night
                  </span>
                ) : (
                  <span className="text-rose-500 font-mono text-[10px] uppercase font-bold animate-pulse">
                    Click a room left
                  </span>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name *</label>
              <input
                id="pos-guest-name-input"
                type="text"
                placeholder="Full Name"
                required
                value={posCustomerName}
                onChange={(e) => setPosCustomerName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
              <input
                id="pos-guest-phone-input"
                type="tel"
                placeholder="e.g. 01712XXXXXX"
                required
                value={posCustomerPhone}
                onChange={(e) => setPosCustomerPhone(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Reference Name (Optional)</label>
              <input
                id="pos-reference-name-input"
                type="text"
                placeholder="Who referred / contact person"
                value={posReferenceName}
                onChange={(e) => setPosReferenceName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">National ID (NID) *</label>
              <input
                id="pos-guest-nid-input"
                type="text"
                placeholder="e.g. 1993261234567"
                required
                value={posCustomerNid}
                onChange={(e) => setPosCustomerNid(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            {/* Address Columns Upazila & Zila */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Upazila *</label>
                <input
                  id="pos-guest-upazila-input"
                  type="text"
                  placeholder="e.g. Dhanmondi"
                  required
                  value={posCustomerUpazila}
                  onChange={(e) => setPosCustomerUpazila(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Zila (District) *</label>
                <input
                  id="pos-guest-zila-input"
                  type="text"
                  placeholder="e.g. Dhaka"
                  required
                  value={posCustomerZila}
                  onChange={(e) => setPosCustomerZila(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Additional Guests option for 2nd to 10+ person */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Additional Passengers</label>
                <button
                  id="receptionist-add-guest-btn"
                  type="button"
                  onClick={handleAddReceptionistGuest}
                  className="text-[9px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/40"
                >
                  + Add Guest
                </button>
              </div>

              {receptionistGuests.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No additional guest records registered representing extra capacity.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {receptionistGuests.map((guest, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 relative space-y-1.5 shadow-xs animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">
                          Guest #{idx + 2}
                        </span>
                        <button
                          id={`remove-receptionist-guest-${idx}`}
                          type="button"
                          onClick={() => handleRemoveReceptionistGuest(idx)}
                          className="text-[9px] font-bold text-rose-500 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          id={`receptionist-guest-name-${idx}`}
                          type="text"
                          required
                          placeholder="Guest Name"
                          value={guest.name}
                          onChange={(e) => handleUpdateReceptionistGuest(idx, 'name', e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-slate-200 rounded bg-slate-50"
                        />
                        <input
                          id={`receptionist-guest-phone-${idx}`}
                          type="tel"
                          required
                          placeholder="Phone"
                          value={guest.phone}
                          onChange={(e) => handleUpdateReceptionistGuest(idx, 'phone', e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-slate-200 rounded bg-slate-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kids Option with Age Box */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Kids / Children (Under 12)</label>
                <button
                  id="receptionist-add-kid-btn"
                  type="button"
                  onClick={handleAddReceptionistKid}
                  className="text-[9px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/40"
                >
                  + Add Kid
                </button>
              </div>

              {receptionistKids.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No kids registered. Click "+ Add Kid" to register child passengers.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {receptionistKids.map((kid, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 relative space-y-1.5 shadow-xs animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">
                          Kid #{idx + 1}
                        </span>
                        <button
                          id={`remove-receptionist-kid-${idx}`}
                          type="button"
                          onClick={() => handleRemoveReceptionistKid(idx)}
                          className="text-[9px] font-bold text-rose-500 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="col-span-2">
                          <input
                            id={`receptionist-kid-name-${idx}`}
                            type="text"
                            required
                            placeholder="Kid's Name"
                            value={kid.name}
                            onChange={(e) => handleUpdateReceptionistKid(idx, 'name', e.target.value)}
                            className="w-full text-[11px] p-1.5 border border-slate-200 rounded bg-slate-50"
                          />
                        </div>
                        <div>
                          <input
                            id={`receptionist-kid-age-${idx}`}
                            type="number"
                            required
                            min="0"
                            max="17"
                            placeholder="Age"
                            value={kid.age}
                            onChange={(e) => handleUpdateReceptionistKid(idx, 'age', e.target.value)}
                            className="w-full text-[11px] p-1.5 border border-slate-200 rounded bg-slate-50 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Travel Span Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Check In *</label>
                <input
                  type="date"
                  required
                  value={posCheckIn}
                  onChange={(e) => setPosCheckIn(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Check Out *</label>
                <input
                  type="date"
                  required
                  value={posCheckOut}
                  onChange={(e) => setPosCheckOut(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white font-mono"
                />
              </div>
            </div>

            {/* Price Calculations & Bill Overrides */}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dynamic Total Bill (৳)</label>
                {selectedRoomDetails && (
                  <span className="text-[9px] font-semibold text-slate-400 font-mono">
                    ({calcNights(posCheckIn, posCheckOut)} night stay)
                  </span>
                )}
              </div>
              <input
                id="pos-bill-input"
                type="number"
                placeholder={selectedRoomDetails ? `Auto BDT Subtotal: ৳${calculatedBasePrice * 10}` : "Select Room..."}
                value={posCustomBill}
                onChange={(e) => setPosCustomBill(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-teal-800 font-mono font-bold font-semibold focus:outline-none"
              />
              <span className="text-[8px] text-slate-400 leading-normal block mt-1">
                Leave field blank to auto-price based on {calcNights(posCheckIn, posCheckOut)} nights, or enter any bespoke amount to override bill manually.
              </span>
            </div>

            <button
              id="pos-submit-booking-btn"
              type="submit"
              disabled={!posSelectedRoomId}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition uppercase flex items-center justify-center gap-2 ${
                posSelectedRoomId 
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <TicketPlus className="w-4 h-4" />
              <span>Checkout Booking & Show Bill</span>
            </button>
          </form>
        </div>
      </div>

      {/* 4. Active Logs Views & HR Customers Archives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column stays list & Guest log history (depends on opMode) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            
            {/* Header stays log & switch tabs */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-800">
                  {opMode === 'hr' ? 'HR Historical Guest Archives & Registries' : 'Active Reception Logs'}
                </h2>
                <p className="text-xs text-slate-400">
                  {opMode === 'hr' 
                    ? 'Audit book records, analyze National ID card entries, and trace billing histories.' 
                    : 'Manage current day check-ins, guest departures, and print invoices.'}
                </p>
              </div>

              {/* Status Select Filter to make managing easier */}
              {opMode !== 'hr' && (
                <div className="flex items-center gap-2">
                  <select
                    id="staff-booking-status-filter"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value as BookingStatus | 'all')}
                    className="bg-slate-50 text-xs border border-slate-200/80 rounded-xl px-3 py-2 text-slate-600 focus:outline-none"
                  >
                    <option value="all">All Stays</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            {/* Live Search Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center shrink-0">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                id="staff-booking-search-input"
                type="text"
                placeholder={opMode === 'hr' ? "Search archival logs by Name, Phone, Zila District, or NID..." : "Search active list by Name or Phone..."}
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full text-xs border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-slate-800"
              />
            </div>

            {/* Bookings List Table */}
            <div className="overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-400 font-semibold text-xs flex flex-col items-center justify-center gap-2">
                  <History className="w-6 h-6 text-slate-300" />
                  <span>No matching bookings found in the front desk log.</span>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                      <th className="py-3 px-2">Ref / Chamber</th>
                      <th className="py-3 px-2">PASSENGER NAME & IDENTITIES</th>
                      <th className="py-3 px-2">SPAN DATES</th>
                      <th className="py-3 px-2">BILL PREVIEW</th>
                      <th className="py-3 px-2 text-right">CONTROLS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} id={`booking-row-${booking.id}`} className="hover:bg-slate-50/40">
                        <td className="py-3.5 px-2">
                          <span className="font-mono font-bold text-slate-800 block">{booking.id}</span>
                          <span className="text-[10px] text-slate-500 font-extrabold text-teal-600">
                            Chamber {booking.roomNumber || booking.roomId}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 space-y-1">
                          <div className="font-bold text-slate-800 text-xs flex items-center flex-wrap gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{booking.guestName}</span>
                            {isRepeatGuest(booking) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[8px] font-extrabold uppercase tracking-wide shrink-0 font-sans">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                                Repeat Guest
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex flex-col gap-0.5 pl-5">
                            <span>Phone: {booking.guestPhone}</span>
                            {booking.nidNumber && <span>NID: {booking.nidNumber}</span>}
                            {booking.referenceName && (
                              <span className="text-teal-600 font-semibold text-[9px]">
                                Ref: {booking.referenceName}
                              </span>
                            )}
                            {(booking.upazila || booking.zila) && (
                              <span className="text-slate-400 text-[9px] font-mono flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 inline" />
                                {booking.upazila}, {booking.zila}
                              </span>
                            )}
                            {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                              <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">
                                Extras: {booking.additionalGuests.map(g => g.name).join(', ')}
                              </span>
                            )}
                            {booking.kids && booking.kids.length > 0 && (
                              <span className="text-[9px] text-sky-600 font-sans mt-0.5 block">
                                Kids: {booking.kids.map(k => `${k.name} (${k.age}y)`).join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-mono text-slate-600 block">{booking.checkIn}</span>
                          <span className="text-[10px] text-slate-400 font-medium">to {booking.checkOut}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="font-mono font-bold text-teal-700 block text-xs">
                            ৳{booking.totalAmount * 10}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wide mt-1 ${
                            booking.status === 'checked-in' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            booking.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            booking.status === 'checked-out' ? 'bg-slate-100 text-slate-600' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right space-y-1.5 whitespace-nowrap">
                          {booking.status === 'confirmed' && (
                            <button
                              id={`check-in-btn-${booking.id}`}
                              onClick={() => updateBookingStatus(booking.id, 'checked-in')}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition"
                            >
                              Check In
                            </button>
                          )}
                          {booking.status === 'checked-in' && (
                            <button
                              id={`check-out-btn-${booking.id}`}
                              onClick={() => updateBookingStatus(booking.id, 'checked-out')}
                              className="px-2 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px] hover:bg-rose-700 transition"
                            >
                              Check Out
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <button
                              id={`void-btn-${booking.id}`}
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="px-2 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg font-semibold text-[10px] transition ml-1"
                            >
                              Void
                            </button>
                          )}
                          <button
                            id={`show-bill-row-btn-${booking.id}`}
                            onClick={() => openInvoiceForBooking(booking)}
                            className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-bold text-[10px] font-mono transition inline-flex items-center gap-1 border border-teal-150 ml-1"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Show Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* SECURITY/ACCESS NOTICE for HR Archival list */}
            {opMode === 'hr' && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200/80 p-4 shrink-0 flex gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-800 uppercase font-mono tracking-wider block">
                    HR Archival Customer Audit Active
                  </span>
                  <p className="text-amber-700 leading-relaxed">
                    You are viewing the historical database ofchecked-out and archived customer records. Guest data entries including full National identification (NID) numbers, district of travel origins (Upazila, Zila) and checkout billing invoices are strictly restricted to receptionists with explicit HR credentials.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right column active housekeeping tickets */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-800">
                  Incident Support Tickets
                </h2>
                <p className="text-xs text-slate-400">Housekeeping & general service log</p>
              </div>

              <select
                id="staff-service-status-filter"
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value as ServiceRequestStatus | 'all')}
                className="bg-slate-50 text-[10px] font-mono border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">Active</option>
                <option value="completed">Done</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400 text-xs font-semibold">
                  All guest chambers report clear!
                </div>
              ) : (
                filteredServices.map((req) => (
                  <div 
                    key={req.id} 
                    id={`service-card-${req.id}`}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs">Suite {req.roomId}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded block w-max mt-0.5">
                          {req.type}
                        </span>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded font-mono ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed italic">
                      "{req.description}"
                    </p>

                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200/40">
                      {req.status === 'pending' && (
                        <button
                          id={`start-service-btn-${req.id}`}
                          onClick={() => updateServiceRequestStatus(req.id, 'in-progress')}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-900 transition"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Dispatch Staff</span>
                        </button>
                      )}
                      {req.status === 'in-progress' && (
                        <button
                          id={`complete-service-btn-${req.id}`}
                          onClick={() => updateServiceRequestStatus(req.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 5. DEDICATED PRINTABLE INVOICE COMPONENT (Thermal & Standard Layouts) */}
      {showBillModal && invoiceBooking && (
        <PrintableInvoice 
          booking={invoiceBooking}
          rooms={rooms}
          onClose={() => setShowBillModal(false)}
        />
      )}

      {/* 6. ROOM STATUS & CHAMBER DUTY MANAGER MODAL */}
      {selectedRoomToManage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-800">
                    Chamber Status Manager
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                    Room {selectedRoomToManage.number} • {selectedRoomToManage.type}
                  </p>
                </div>
              </div>
              <button
                id="close-status-manager-btn"
                onClick={() => setSelectedRoomToManage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-lg shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              {/* Current Status Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Current Status</span>
                  <span className="text-sm font-serif font-bold text-slate-800 capitalize">
                    {selectedRoomToManage.status === 'cleaning' ? 'Cleaning (Chamber Duty)' : selectedRoomToManage.status}
                  </span>
                </div>
                <span className={`w-3.5 h-3.5 rounded-full ring-4 ${
                  selectedRoomToManage.status === 'available' ? 'bg-emerald-500 ring-emerald-100 animate-pulse' :
                  selectedRoomToManage.status === 'occupied' ? 'bg-rose-500 ring-rose-100' :
                  selectedRoomToManage.status === 'cleaning' ? 'bg-amber-400 ring-amber-100 animate-pulse' :
                  'bg-slate-400 ring-slate-100'
                }`} />
              </div>

              {/* Status Selector Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Select New Chamber Status
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'available', name: 'Available (Ready)', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-800 bg-emerald-50/20', dotColor: 'bg-emerald-500', desc: 'Ready for passenger check-in' },
                    { id: 'occupied', name: 'Occupied', color: 'border-rose-200 hover:bg-rose-50 text-rose-800 bg-rose-50/20', dotColor: 'bg-rose-500', desc: 'Currently checked-in guests inside' },
                    { id: 'cleaning', name: 'Cleaning (Duty)', color: 'border-amber-200 hover:bg-amber-50 text-amber-800 bg-amber-50/20', dotColor: 'bg-amber-400', desc: 'Chamber duty / vacuum & stock' },
                    { id: 'maintenance', name: 'Maintenance', color: 'border-slate-200 hover:bg-slate-50 text-slate-850 bg-slate-50/20', dotColor: 'bg-slate-400', desc: 'Engineering repairs / offline' }
                  ].map((opt) => {
                    const isSelected = selectedRoomToManage.status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`status-selector-btn-${opt.id}`}
                        onClick={async () => {
                          await updateRoomStatus(selectedRoomToManage.id, opt.id as RoomStatus);
                          setSelectedRoomToManage(null);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between h-[75px] ${
                          isSelected 
                            ? 'ring-2 ring-teal-600 bg-teal-50/30 border-teal-600 scale-[0.98]' 
                            : `${opt.color}`
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                          <span>{opt.name}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-normal leading-tight mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative text */}
              <div className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-500 mb-0.5">💡 Chamber Duty Note</p>
                When passengers check out, their suites are automatically placed into <span className="text-amber-600 font-bold font-mono">Cleaning (Chamber Duty)</span> status. Once housekeeping has fully disinfected the room and laid out fresh linens, select <span className="text-emerald-600 font-bold font-mono">Available (Ready)</span> above to open the chamber back up for new front-desk reservations.
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-right">
              <button
                id="cancel-status-manager-btn"
                type="button"
                onClick={() => setSelectedRoomToManage(null)}
                className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                Close Manager
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
