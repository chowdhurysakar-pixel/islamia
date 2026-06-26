/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, ServiceRequestType, BookingStatus } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { Calendar, Search, Filter, Sliders, CheckCircle2, Ticket, Sparkles, MessageSquarePlus, X, BellDot, HeartHandshake, Receipt, Printer, MapPin, Phone, Info, Star, MessageSquare, Check, Mic, MicOff } from 'lucide-react';

// Custom contact icon/badge components
const BkashLogo: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect width="40" height="40" rx="8" fill="#E2136E" />
    <path d="M10 16 L20 10 L30 16 L20 23 Z" fill="white" />
    <path d="M20 23 L28 30 L30 16 Z" fill="#F1F1F1" />
    <path d="M20 23 L12 30 L10 16 Z" fill="#E1E1E1" />
  </svg>
);

const CallLogo: React.FC<{ className?: string }> = ({ className = "w-2.5 h-2.5" }) => (
  <span className="inline-flex items-center justify-center bg-slate-900 text-white rounded-full p-0.5 w-4 h-4 shrink-0" style={{ verticalAlign: 'middle' }}>
    <Phone className={className} strokeWidth={3} />
  </span>
);

const WhatsappLogo: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12.012 2C6.485 2 2.002 6.482 2 12.01c-.002 1.73.44 3.42 1.29 4.91L2 22l5.24-1.37c1.44.78 3.07 1.2 4.76 1.21h.005c5.527 0 10.01-4.483 10.012-10.01a10.01 10.01 0 00-10.005-10.01v.01z" fill="#25D366" />
    <path d="M16.94 14.5c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.69.87-.85 1.05-.16.18-.32.2-.59.06-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.44-.46-.61-.46h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27s.98 2.62 1.11 2.8c.14.18 1.92 2.93 4.66 4.12.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.59-.65 1.81-1.27.22-.62.22-1.15.16-1.27-.07-.11-.25-.18-.53-.32z" fill="white" />
  </svg>
);

export const GuestView: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    serviceRequests,
    feedbacks,
    currentUser, 
    createBooking, 
    updateBookingStatus, 
    createServiceRequest,
    submitFeedback
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
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [autoPrintInvoice, setAutoPrintInvoice] = useState<boolean>(false);
  const [additionalGuests, setAdditionalGuests] = useState<{ name: string; phone: string; }[]>([]);
  const [bookReferenceName, setBookReferenceName] = useState<string>('');
  const [kids, setKids] = useState<{ name: string; age: string; }[]>([]);

  // Rating & Review Feedback Form State
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Voice-to-text input state for Special Room Requests
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLanguage, setSpeechLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    setSpeechError(null);
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = speechLanguage;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone permission denied. Check browser settings.");
        } else {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setBookNotes(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setSpeechError(err?.message || "Failed to initialize microphone.");
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

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

  const handleAddKidField = () => {
    if (kids.length < 10) {
      setKids([...kids, { name: '', age: '' }]);
    }
  };

  const handleUpdateKidField = (index: number, key: 'name' | 'age', value: string) => {
    const updated = [...kids];
    updated[index][key] = value;
    setKids(updated);
  };

  const handleRemoveKidField = (index: number) => {
    setKids(kids.filter((_, i) => i !== index));
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
    setBookReferenceName('');
    setKids([]);
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
      additionalGuests: additionalGuests.filter(g => g.name.trim() !== ''),
      referenceName: bookReferenceName.trim() || undefined,
      kids: kids.filter(k => k.name.trim() !== '')
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

  // Submit Guest Rating and Written Review
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!userComment.trim()) {
      alert("Please enter a short review or comment.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await submitFeedback(userRating, userComment);
      setUserComment('');
      setUserRating(5);
    } catch (err) {
      console.error("Feedback submit error: ", err);
    } finally {
      setSubmittingFeedback(false);
    }
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
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a 
              id="whats-app-support-btn"
              href="https://wa.me/8801799148408?text=Hello%20Islamia%20Guest%20House,%20I%20would%20like%20to%20inquire%20about%20room%20availability%20and%20booking%20details."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              <WhatsappLogo className="w-4 h-4 shrink-0" />
              <span>Message Support (WhatsApp)</span>
            </a>
            <a 
              id="hotline-call-btn"
              href="tel:01909806960"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/60 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Call Hotline</span>
            </a>
          </div>
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
                      <div className="text-xs text-slate-400 flex items-center flex-wrap gap-1.5">
                        <span>Reserved for: <span className="font-medium text-slate-600">{booking.guestName}</span></span>
                        {isRepeatGuest(booking) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded-full text-[8px] font-extrabold uppercase tracking-wide shrink-0 font-sans">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                            Repeat Guest
                          </span>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="text-[10px] text-amber-600 bg-amber-50/50 px-2 py-1 rounded inline-block border border-amber-100/50 mt-1">
                          Notes: "{booking.notes}"
                        </p>
                      )}
                      {booking.referenceName && (
                        <div className="mt-1">
                          <span className="text-[10px] text-teal-600 bg-teal-50/50 px-2 py-1 rounded inline-block border border-teal-100/50">
                            Reference: <span className="font-semibold">{booking.referenceName}</span>
                          </span>
                        </div>
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
                      {booking.kids && booking.kids.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/60">
                          <p className="text-[10px] font-semibold text-slate-500">Kids / Children ({booking.kids.length}):</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {booking.kids.map((k, ki) => (
                              <span key={ki} className="inline-flex text-[9px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-150 font-mono">
                                {k.name} ({k.age} yrs)
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
                      {/* Print Ticket / Invoice Option */}
                      {(booking.status === 'confirmed' || booking.status === 'checked-in' || booking.status === 'checked-out') && (
                        <>
                          <button
                            id={`guest-view-receipt-${booking.id}`}
                            onClick={() => {
                              setAutoPrintInvoice(false);
                              setInvoiceBooking(booking);
                              setShowBillModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoice / Ticket</span>
                          </button>
                          <button
                            id={`guest-direct-print-${booking.id}`}
                            onClick={() => {
                              setAutoPrintInvoice(true);
                              setInvoiceBooking(booking);
                              setShowBillModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition border border-amber-150"
                            title="Directly trigger browser printing"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600" />
                            <span>Direct Print</span>
                          </button>
                        </>
                      )}

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

                      {/* Star rating option after stay or during stay */}
                      {(booking.status === 'checked-out' || booking.status === 'checked-in') && (
                        <button
                          id={`leave-feedback-btn-${booking.id}`}
                          onClick={() => {
                            const section = document.getElementById('guest-reviews-section');
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition border border-amber-100"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Rate Stay Experience</span>
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Reference Name (Optional)</label>
                    <input
                      id="modal-reference-name"
                      type="text"
                      placeholder="Who referred you or contact person"
                      value={bookReferenceName}
                      onChange={(e) => setBookReferenceName(e.target.value)}
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

                  {/* Kids Option with Age Box */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Kids / Children (Under 12 years)
                      </label>
                      <button
                        id="add-kid-field-btn"
                        type="button"
                        onClick={handleAddKidField}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/40"
                      >
                        + Add Kid
                      </button>
                    </div>

                    {kids.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No kids registered for this booking. Click "+ Add Kid" to include children.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {kids.map((kid, idx) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-150 relative space-y-2 animate-fadeIn">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                                Kid #{idx + 1}
                              </span>
                              <button
                                id={`remove-kid-field-${idx}`}
                                type="button"
                                onClick={() => handleRemoveKidField(idx)}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <input
                                  id={`kid-name-${idx}`}
                                  type="text"
                                  required
                                  placeholder="Kid's Name"
                                  value={kid.name}
                                  onChange={(e) => handleUpdateKidField(idx, 'name', e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                                />
                              </div>
                              <div>
                                <input
                                  id={`kid-age-${idx}`}
                                  type="number"
                                  required
                                  min="0"
                                  max="17"
                                  placeholder="Age"
                                  value={kid.age}
                                  onChange={(e) => handleUpdateKidField(idx, 'age', e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 block">Special Room Requests (Optional)</label>
                      
                      {/* Hands-Free Speech to Text Controls */}
                      <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px]">
                          <button
                            id="lang-en-btn"
                            type="button"
                            onClick={() => setSpeechLanguage('en-US')}
                            className={`px-1.5 py-0.5 rounded-md font-mono font-bold transition-colors ${
                              speechLanguage === 'en-US'
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            ENG
                          </button>
                          <button
                            id="lang-bn-btn"
                            type="button"
                            onClick={() => setSpeechLanguage('bn-BD')}
                            className={`px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                              speechLanguage === 'bn-BD'
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            বাংলা
                          </button>
                        </div>

                        {/* Mic Trigger */}
                        <button
                          id="voice-mic-trigger-btn"
                          type="button"
                          onClick={toggleVoiceInput}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                            isListening
                              ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                              : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100'
                          }`}
                        >
                          {isListening ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                              <MicOff className="w-3.5 h-3.5" />
                              <span>Listening...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5" />
                              <span>Describe hands-free</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <textarea
                      id="modal-special-notes"
                      rows={2}
                      placeholder={
                        isListening 
                          ? (speechLanguage === 'en-US' ? "Speak now! e.g. 'I need three extra towels and morning tea'..." : "এখন বলুন! যেমন: 'আমার ৩টি অতিরিক্ত তোয়ালে ও সকালের চা লাগবে'...")
                          : "e.g. Feather pillows, extra towels, morning tea..."
                      }
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      className={`w-full text-xs border rounded-xl p-2.5 resize-none transition-all duration-200 leading-relaxed ${
                        isListening
                          ? 'border-red-400 ring-1 ring-red-400/20 bg-red-50/10'
                          : 'border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20'
                      }`}
                    />

                    {/* Speech Errors */}
                    {speechError && (
                      <div className="text-[10px] text-red-500 font-medium bg-red-50/50 border border-red-100/50 p-1.5 rounded-lg flex items-center gap-1 animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                        <span>{speechError}</span>
                      </div>
                    )}
                    {isListening && (
                      <div className="text-[10px] text-teal-600 font-medium bg-teal-50/30 border border-teal-100/40 p-1.5 rounded-lg flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 animate-ping" />
                        <span>
                          {speechLanguage === 'en-US' 
                            ? "Voice input active: speak clearly into your mic. Your transcript will append below." 
                            : "ভয়েস ইনপুট সক্রিয়: মাইক্রোফোনে স্পষ্ট করে বলুন। আপনার বক্তব্য নিচে যোগ হবে।"}
                        </span>
                      </div>
                    )}
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

      {/* 4.5. Guest Reviews & Star Ratings Section */}
      <div id="guest-reviews-section" className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-800">Guest Ratings & Feedback</h2>
              <p className="text-xs text-slate-500">Real experiences shared by authenticated visitors of Islamia Guest House</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          {feedbacks && feedbacks.length > 0 && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start sm:self-center">
              <span className="text-2xl font-black text-slate-800 font-mono">
                {(feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)}
              </span>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const avg = feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length;
                    return (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-1">{feedbacks.length} Verified Reviews</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Submit Review Card */}
          <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-800 font-sans">Write a Review</h3>
            {currentUser ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <p className="text-xs text-slate-500">
                  You are reviewing as <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
                </p>
                
                {/* Star Rating Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Your Star Rating</label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        id={`star-btn-${star}`}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="p-1 hover:scale-110 active:scale-95 transition cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors duration-150 ${
                            star <= userRating
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.2)]'
                              : 'text-slate-200 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-amber-600 font-mono ml-2">
                      {userRating === 5 ? 'Excellent 🌟' : userRating === 4 ? 'Very Good 👍' : userRating === 3 ? 'Good Ok 🙂' : userRating === 2 ? 'Fair 😐' : 'Poor 😞'}
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Feedback Details</label>
                  <textarea
                    id="user-feedback-comment"
                    required
                    rows={4}
                    maxLength={2000}
                    placeholder="Share details of your room comfort, staff services, and neighborhood accessibility (e.g., proximity to Ibn Sina or Meena Bazar)..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                    <span>Constructive comments are appreciated.</span>
                    <span>{userComment.length}/2000</span>
                  </div>
                </div>

                <button
                  id="submit-feedback-btn"
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {submittingFeedback ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MessageSquarePlus className="w-4 h-4" />
                  )}
                  <span>Post Verified Review</span>
                </button>
              </form>
            ) : (
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5 text-center space-y-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Info className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-amber-800">Authentication Required</h4>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  Only signed-in guests can publish star ratings and stay testimonials. 
                </p>
                <div className="text-[11px] text-slate-500 bg-white/80 p-2.5 rounded-xl border border-slate-100/50">
                  Please use the **Google Login** or the **Role Switcher / Simulator** at the top bar to authenticate as a Guest.
                </div>
              </div>
            )}
          </div>

          {/* Feedback Feed Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-slate-800 font-sans">Recent Stay Testimonials</h3>
              <span className="text-xs text-slate-400 font-mono">{feedbacks ? feedbacks.length : 0} items</span>
            </div>
            
            {(!feedbacks || feedbacks.length === 0) ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-200" />
                <p className="text-sm font-medium">No Reviews Yet</p>
                <p className="text-xs">Be the very first authenticated guest to post your stay experience!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {feedbacks.map((f) => {
                  const firstChar = f.userName ? f.userName.charAt(0).toUpperCase() : 'G';
                  const dateStr = new Date(f.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  
                  return (
                    <div 
                      key={f.id} 
                      className="bg-white border border-slate-100 hover:border-slate-200 transition-colors duration-150 p-4 rounded-2xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {firstChar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-slate-800 leading-none">{f.userName}</h4>
                              <span className="text-[9px] font-bold font-mono uppercase bg-teal-100/60 text-teal-800 px-1.5 py-0.5 rounded-md">Verified Guest</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-1">{dateStr}</span>
                          </div>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-xl border border-amber-100/50">
                          <span className="text-xs font-bold text-amber-700 font-mono mr-1 leading-none">{f.rating}</span>
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed pl-1.5 border-l-2 border-slate-100 italic">
                        "{f.comment}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 5. Contact & Location Info Footer Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-800 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading, Address & Landmark */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-400/20 px-3 py-1 text-teal-300 rounded-full text-xs font-mono tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-teal-300" />
              <span>FIND US IN DHANMONDI</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                ইসলামিয়া গেস্ট হাউস (Islamia Guest House)
              </h3>
              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                বাড়ি নং ৫৫/সি/১, রোড নং ৯/এ, ধানমন্ডি, ঢাকা - ১২০৯ <br />
                <span className="text-slate-400 text-xs font-normal">
                  (House No: 55/C/1, Road No: 9/A, Dhanmondi, Dhaka - 1209)
                </span>
              </p>
            </div>

            <div className="flex gap-2.5 items-start bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Landmarks / ল্যান্ডমার্ক
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  ইবনে সিনা ৯/এ এর বিপরীতে, মীনা বাজারের পিছনে, নর্দান মেডিকেল কলেজ বিল্ডিং সংলগ্ন
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Details with logos */}
          <div className="lg:col-span-5 space-y-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-700/30">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Hotline & Payment Support / যোগাযোগ
            </h4>
            
            <div className="space-y-3.5">
              {/* bKash */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-pink-500/30 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-pink-500/10 rounded-lg group-hover:scale-105 transition">
                    <BkashLogo className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono leading-none mb-1">
                      bKash (Merchant / Personal)
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-100">01832-841818</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded-full">
                  bKash
                </span>
              </div>

              {/* Call */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-teal-500/30 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-700/50 rounded-lg group-hover:scale-105 transition">
                    <CallLogo className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono leading-none mb-1">
                      Direct Call Support
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-100">01909-806960</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
                  Call
                </span>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover:scale-105 transition">
                    <WhatsappLogo className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono leading-none mb-1">
                      WhatsApp Message
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-100">01799-148408</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  WhatsApp
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dedicated Guest Invoice / Ticket modal */}
      {showBillModal && invoiceBooking && (
        <PrintableInvoice
          booking={invoiceBooking}
          rooms={rooms}
          onClose={() => setShowBillModal(false)}
          autoPrint={autoPrintInvoice}
        />
      )}

    </div>
  );
};
