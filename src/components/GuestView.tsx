/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, ServiceRequestType, BookingStatus } from '../types';
import { RoomCard } from './RoomCard';
import { Calendar, Search, Filter, Sliders, CheckCircle2, Ticket, Sparkles, MessageSquarePlus, X, BellDot, HeartHandshake } from 'lucide-react';

export const GuestView: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    serviceRequests,
    currentUser, 
    createBooking, 
    updateBookingStatus, 
    createServiceRequest 
  } = useApp();

  // Guest Search state
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomType | 'all'>('all');
  const [priceLimit, setPriceLimit] = useState<number>(700);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  
  // Date states for filtering / booking
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const [searchCheckIn, setSearchCheckIn] = useState<string>(todayStr);
  const [searchCheckOut, setSearchCheckOut] = useState<string>(tomorrowStr);

  // Booking details modal state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookName, setBookName] = useState<string>('');
  const [bookEmail, setBookEmail] = useState<string>('');
  const [bookPhone, setBookPhone] = useState<string>('');
  const [bookCheckIn, setBookCheckIn] = useState<string>(todayStr);
  const [bookCheckOut, setBookCheckOut] = useState<string>(tomorrowStr);
  const [bookNotes, setBookNotes] = useState<string>('');
  const [justCompletedBookingId, setJustCompletedBookingId] = useState<string | null>(null);
  const [additionalGuests, setAdditionalGuests] = useState<{ name: string; phone: string; }[]>([]);

  const handleAddGuestField = () => {
    if (additionalGuests.length < 15) {
      setAdditionalGuests([...additionalGuests, { name: '', phone: '' }]);
    }
  };

  const handleUpdateGuestField = (index: number, key: 'name' | 'phone', value: string) => {
    const updated = [...additionalGuests];
    updated[index][key] = value;
    setAdditionalGuests(updated);
  };

  const handleRemoveGuestField = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  // Service request state
  const [selectedServiceBooking, setSelectedServiceBooking] = useState<Booking | null>(null);
  const [serviceType, setServiceType] = useState<ServiceRequestType>('housekeeping');
  const [serviceDetails, setServiceDetails] = useState<string>('');
  const [serviceSuccess, setServiceSuccess] = useState<boolean>(false);

  // Sync date changes from general filter to modal checks
  const handleOpenBooking = (room: Room) => {
    setSelectedRoom(room);
    setBookCheckIn(searchCheckIn);
    setBookCheckOut(searchCheckOut);
    setBookName(currentUser?.name || '');
    setBookEmail(currentUser?.email || '');
    setBookPhone('');
    setBookNotes('');
    setJustCompletedBookingId(null);
    setAdditionalGuests([]);
  };

  // Memoized lists filtering
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter;
      const matchesPrice = room.price <= priceLimit;
      const matchesCapacity = room.capacity >= adultsCount;
      return matchesType && matchesPrice && matchesCapacity;
    });
  }, [rooms, roomTypeFilter, priceLimit, adultsCount]);

  // Guest reservations made (filter bookings made by simulated or real user)
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(b => b.userId === currentUser.uid || b.guestEmail.toLowerCase() === currentUser.email.toLowerCase());
  }, [bookings, currentUser]);

  // Compute calculated values for dynamic billing
  const computedNights = useMemo(() => {
    const start = new Date(bookCheckIn);
    const end = new Date(bookCheckOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [bookCheckIn, bookCheckOut]);

  const computedTotal = useMemo(() => {
    if (!selectedRoom) return 0;
    return computedNights * selectedRoom.price;
  }, [computedNights, selectedRoom]);

  // Complete reservation checkout
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || computedNights <= 0) return;

    const bId = await createBooking({
      roomId: selectedRoom.id,
      userId: currentUser?.uid || 'temp-guest',
      guestName: bookName,
      guestEmail: bookEmail,
      guestPhone: bookPhone,
      checkIn: bookCheckIn,
      checkOut: bookCheckOut,
      totalAmount: computedTotal,
      status: 'confirmed',
      notes: bookNotes,
      additionalGuests: additionalGuests.filter(g => g.name.trim() !== '')
    });

    setJustCompletedBookingId(bId);
  };

  // Submit Guest Incident / service request ticket
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceBooking || !serviceDetails.trim()) return;

    await createServiceRequest({
      roomId: selectedServiceBooking.roomId,
      type: serviceType,
      description: `[Guest Request] ${serviceDetails}`,
      status: 'pending'
    });

    setServiceSuccess(true);
    setServiceDetails('');
    setTimeout(() => {
      setServiceSuccess(false);
      setSelectedServiceBooking(null);
    }, 3000);
  };

  return (
    <div className="space-y-12">
      
      {/* 1. Hero Welcomer Greeting */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 md:p-12 shadow-md">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80" 
            alt="Estate Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-400/20 px-3.5 py-1 text-teal-300 rounded-full text-xs font-mono tracking-wider">
            <Sparkles className="w-3 text-teal-300" />
            <span>WELCOME TO DHAKA, DHANMONDI</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight leading-none">
            Comfortable & Secure Homely Stay.
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-lg leading-relaxed">
            Welcome to <span className="text-white font-semibold">Islamia Guest House</span>. Experience high-quality hospitality, family-friendly security, and peaceful tranquility in the heart of Dhanmondi, Dhaka.
          </p>
        </div>
      </div>

      {/* 2. Interactive Availability Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 font-mono">
            Customize Room Filters
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Calendar Check In/Out Simulation */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Check-in & Out Dates
            </label>
            <div className="flex items-center gap-2">
              <input
                id="search-check-in-date"
                type="date"
                value={searchCheckIn}
                min={todayStr}
                onChange={(e) => setSearchCheckIn(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-teal-500"
              />
              <input
                id="search-check-out-date"
                type="date"
                value={searchCheckOut}
                min={searchCheckIn || todayStr}
                onChange={(e) => setSearchCheckOut(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Room Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Chamber Type
            </label>
            <select
              id="search-room-type"
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value as RoomType | 'all')}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-teal-500 font-medium text-slate-700"
            >
              <option value="all">All Rooms</option>
              <option value="single">Standard Single Room</option>
              <option value="double">Deluxe Double Room</option>
              <option value="deluxe">Executive Premium Room</option>
              <option value="suite">VIP Suite Room</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <label className="font-medium">Maximum Budget</label>
              <span className="font-mono font-semibold text-slate-800">৳{priceLimit * 10}/night</span>
            </div>
            <input
              id="search-price-range"
              type="range"
              min="100"
              max="700"
              step="25"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Person Count */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Expected Person Count
            </label>
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {[1, 2, 4, 6].map((num) => (
                <button
                  key={num}
                  id={`capacity-btn-${num}`}
                  type="button"
                  onClick={() => setAdultsCount(num)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold font-mono ${
                    adultsCount === num
                      ? 'bg-white shadow-sm text-teal-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {num}👤
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Rooms Listing Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-800">
              Exquisite Chambers & Rooms
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an available room to view dynamic booking computations
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
            {filteredRooms.length} Spaces Matched
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200/50">
            <p className="text-slate-500 font-medium">No rooms match your specific filters.</p>
            <button 
              id="clear-filters-btn"
              onClick={() => { setRoomTypeFilter('all'); setPriceLimit(700); setAdultsCount(1); }}
              className="mt-3 text-xs text-teal-600 font-semibold underline hover:text-teal-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard 
                key={room.id}
                room={room}
                isStaffMode={false}
                onBookClick={handleOpenBooking}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Active Guest Reservations Section */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2.5 mb-6">
          <Ticket className="w-5 h-5 text-teal-600" />
          <h2 className="font-serif text-2xl font-bold text-slate-800">
            My Reservations & Room Control
          </h2>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200/50 max-w-xl">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-medium text-slate-600 text-sm">No Active Booking Records</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Explore our boutique chambers above, choose your dates, and secure a reservation to manage custom service requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => {
              const rDetails = rooms.find(r => r.id === booking.roomId);
              return (
                <div 
                  key={booking.id}
                  id={`my-booking-${booking.id}`}
                  className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:border-slate-200 transition-all flex flex-col md:flex-row justify-between gap-6"
                >
                  {/* Reservation Room detail info */}
                  <div className="flex gap-4">
                    {rDetails && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                        <img src={rDetails.image} alt="Room" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">Room {rDetails?.number || 'N/A'}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-500 py-0.5 px-2 rounded">
                          {rDetails?.type || 'Standard'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {booking.checkIn} — {booking.checkOut}
                      </p>
                      <p className="text-xs text-slate-400">
                        Reserved for: <span className="font-medium text-slate-600">{booking.guestName}</span>
                      </p>
                      {booking.notes && (
                        <p className="text-[10px] text-amber-600 bg-amber-50/50 px-2 py-1 rounded inline-block border border-amber-100/50 mt-1">
                          Notes: "{booking.notes}"
                        </p>
                      )}
                      {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/60">
                          <p className="text-[10px] font-semibold text-slate-500">Additional Guests ({booking.additionalGuests.length}):</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {booking.additionalGuests.map((g, gi) => (
                              <span key={gi} className="inline-flex text-[9px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-150 font-mono">
                                {g.name} ({g.phone})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status, Total, Services trigger */}
                  <div className="flex flex-row md:flex-col justify-between items-end md:text-right gap-4">
                    <div className="space-y-1 text-left md:text-right">
                      <span className="text-xs font-mono font-semibold text-slate-500 block">
                        Total Amount: <span className="text-slate-800 font-bold">৳{booking.totalAmount * 10}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'checked-in' ? 'bg-emerald-50 text-emerald-700' :
                        booking.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700' :
                        booking.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        <span>●</span>
                        <span>{booking.status.toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {/* Only allowing service requests if currently checked-in */}
                      {booking.status === 'checked-in' && (
                        <button
                          id={`make-service-req-${booking.id}`}
                          onClick={() => { setSelectedServiceBooking(booking); setServiceSuccess(false); }}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-teal-5 warm-teal hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition"
                        >
                          <BellDot className="w-3.5 h-3.5 text-teal-600" />
                          <span>Request In-Room Service</span>
                        </button>
                      )}

                      {/* Cancel Booking option */}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <button
                          id={`cancel-booking-${booking.id}`}
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                        >
                          Cancel Stay
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== 5. MODAL: Reserve Suite Workout Checkout ==================== */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            <div className="p-6 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-800">
                  Book Room {selectedRoom.number}
                </h3>
                <span className="text-xs text-slate-400 font-medium">Secure your boutique reservation</span>
              </div>
              <button 
                id="close-booking-modal-btn"
                onClick={() => setSelectedRoom(null)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-200/55 p-1 rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If completed booking, show success screen inside modal */}
            {justCompletedBookingId ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-slate-800">Reservation Confirmed!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Excellent choice. Room {selectedRoom.number} is scheduled for you. Your booking reference code token is <span className="font-mono font-bold text-slate-800">{justCompletedBookingId}</span>.
                </p>
                <div className="pt-4">
                  <button
                    id="finish-booking-btn"
                    onClick={() => setSelectedRoom(null)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs font-medium text-slate-500">
                    Daily Chamber Rate: <span className="font-semibold text-slate-700 block mt-0.5">৳{selectedRoom.price * 10} / night</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    Max Capacity: <span className="font-semibold text-slate-700 block mt-0.5">{selectedRoom.capacity} Person{selectedRoom.capacity > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">Check-in Date</label>
                    <input
                      id="modal-checkin-date"
                      type="date"
                      min={todayStr}
                      value={bookCheckIn}
                      onChange={(e) => setBookCheckIn(e.target.value)}
                      required
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">Check-out Date</label>
                    <input
                      id="modal-checkout-date"
                      type="date"
                      min={bookCheckIn || todayStr}
                      value={bookCheckOut}
                      onChange={(e) => setBookCheckOut(e.target.value)}
                      required
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Lead Guest Full Name</label>
                    <input
                      id="modal-guest-name"
                      type="text"
                      placeholder="Passenger Name"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      required
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Email Address</label>
                      <input
                        id="modal-guest-email"
                        type="email"
                        placeholder="jane@example.com"
                        value={bookEmail}
                        onChange={(e) => setBookEmail(e.target.value)}
                        required
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Phone Number</label>
                      <input
                        id="modal-guest-phone"
                        type="tel"
                        placeholder="+880 1700-000000"
                        value={bookPhone}
                        onChange={(e) => setBookPhone(e.target.value)}
                        required
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>
                  </div>

                  {/* Additional Guests Dynamic Option (2nd to 10+ persons) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Additional Guests (2nd to 10+ Persons)
                      </label>
                      <button
                        id="add-guest-field-btn"
                        type="button"
                        onClick={handleAddGuestField}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/40"
                      >
                        + Add Guest
                      </button>
                    </div>

                    {additionalGuests.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No additional guests registered. Click "+ Add Guest" to add name and phone number options.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {additionalGuests.map((guest, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-150 relative space-y-2 animate-fadeIn">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                                Guest #{idx + 2}
                              </span>
                              <button
                                id={`remove-guest-field-${idx}`}
                                type="button"
                                onClick={() => handleRemoveGuestField(idx)}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <input
                                  id={`additional-guest-name-${idx}`}
                                  type="text"
                                  required
                                  placeholder="Guest Name"
                                  value={guest.name}
                                  onChange={(e) => handleUpdateGuestField(idx, 'name', e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  id={`additional-guest-phone-${idx}`}
                                  type="tel"
                                  required
                                  placeholder="Phone Number"
                                  value={guest.phone}
                                  onChange={(e) => handleUpdateGuestField(idx, 'phone', e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Special Room Requests (Optional)</label>
                    <textarea
                      id="modal-special-notes"
                      rows={2}
                      placeholder="e.g. Feather pillows, extra towels, morning tea..."
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 resize-none"
                    />
                  </div>
                </div>

                {/* Computational Billing summary */}
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-medium text-teal-700">Estimated stay:</span>
                    <span className="font-mono text-teal-800 font-bold block mt-0.5">{computedNights} night{computedNights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-teal-700">Total Invoice Amount:</span>
                    <span className="text-lg font-serif font-semibold text-teal-900 block">৳{computedTotal * 10}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="submit-booking-reservation-btn"
                    type="submit"
                    disabled={computedNights <= 0}
                    className="w-full py-3 bg-teal-600 text-white hover:bg-teal-700 font-semibold rounded-xl text-xs transition duration-300 shadow-md shadow-teal-600/10"
                  >
                    Confirm & Complete Booking
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ==================== 6. MODAL: Send Hotel service Request ==================== */}
      {selectedServiceBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-slate-800 flex items-center gap-2">
                <BellDot className="w-4 h-4 text-teal-600" />
                <span>Service Desk: Room {rooms.find(r => r.id === selectedServiceBooking.roomId)?.number}</span>
              </h3>
              <button 
                id="close-service-modal-btn"
                onClick={() => setSelectedServiceBooking(null)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {serviceSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Request Transmitted</h4>
                <p className="text-xs text-slate-400">
                  Our concierge team is notifying personnel. Housekeepers are being dispatched.
                </p>
              </div>
            ) : (
              <form onSubmit={handleServiceSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Select Service Department</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { value: 'housekeeping', label: 'Housekeeping' },
                      { value: 'room-service', label: 'Room Service' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'concierge', label: 'Concierge Desktop' }
                    ] as { value: ServiceRequestType, label: string }[]).map((opt) => (
                      <button
                        key={opt.value}
                        id={`service-opt-${opt.value}`}
                        type="button"
                        onClick={() => setServiceType(opt.value)}
                        className={`py-2 px-3 hover:bg-slate-50 transition border rounded-xl text-xs font-medium text-left ${
                          serviceType === opt.value
                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                            : 'border-slate-200 text-slate-600 bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Descriptive Instructions</label>
                  <textarea
                    id="service-descriptive-text"
                    required
                    rows={3}
                    placeholder="Describe your request closely (e.g., 'Need three more clean hand towels', 'Bring down morning coffees'...)"
                    value={serviceDetails}
                    onChange={(e) => setServiceDetails(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 resize-none focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  id="submit-service-req-btn"
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition mt-2"
                >
                  Dispatch Staff Member
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
