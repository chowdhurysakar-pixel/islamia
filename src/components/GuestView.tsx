/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, ServiceRequestType, BookingStatus } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { Calendar, Search, Filter, Sliders, CheckCircle2, Ticket, Sparkles, MessageSquarePlus, X, BellDot, HeartHandshake, Receipt, Printer, MapPin, Phone, Info, Star, MessageSquare, Check, Mic, MicOff, ExternalLink, ChevronDown, ChevronUp, Minus, Plus, User, Menu } from 'lucide-react';
import dhanmondiMapImg from '../assets/images/dhanmondi_map_location_1785059048345.jpg';
import nationalParliamentImg from '../assets/images/national_parliament_dhaka_1785812392106.jpg';
import lalbaghFortImg from '../assets/images/lalbagh_fort_dhaka_1785812405532.jpg';
import ahsanManzilImg from '../assets/images/ahsan_manzil_dhaka_1785813447557.jpg';
import taraMasjidImg from '../assets/images/tara_masjid_dhaka_1785813463413.jpg';
import dhanmondiLakeImg from '../assets/images/dhanmondi_lake_dhaka_1785812418285.jpg';

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
    currentRole,
    toggleRole,
    logout,
    createBooking, 
    updateBookingStatus, 
    createServiceRequest,
    submitFeedback
  } = useApp();

  // Guest Search state
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomType | 'all'>('all');
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [showGuestPicker, setShowGuestPicker] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const guestPickerRef = React.useRef<HTMLDivElement>(null);

  // Close guest picker on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestPickerRef.current && !guestPickerRef.current.contains(event.target as Node)) {
        setShowGuestPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
      const matchesCapacity = room.capacity >= adultsCount;
      return matchesType && matchesCapacity;
    });
  }, [rooms, roomTypeFilter, adultsCount]);

  // Guest reservations made
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(b => b.userId === currentUser.uid || b.guestEmail.toLowerCase() === currentUser.email.toLowerCase());
  }, [bookings, currentUser]);

  // Memoized repeat guest lookup map by contact info
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
      referenceName: bookReferenceName.trim() || '',
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
    <div className="min-h-screen bg-[#f8f4ec] text-[#20242a] w-full">
      
      {/* 0. Utility Bar */}
      <div className="bg-[#f4efe6] border-b border-[#e5dcce] text-[#0e2b33] text-xs py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-6 items-center">
            <a href="tel:01909806960" className="hover:text-[#905e38] flex items-center gap-1.5 font-mono text-[#0e2b33] font-medium">
              <Phone className="w-3 h-3 text-[#905e38]" />
              <span>☏ 01909-806960</span>
            </a>
            <a 
              href="https://wa.me/8801799148408?text=Hello%20Islamia%20Guest%20House,%20I%20would%20like%20to%20inquire%20about%20room%20availability." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#905e38] flex items-center gap-1.5 text-[#0e2b33] font-medium"
            >
              <WhatsappLogo className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
          <div className="flex flex-wrap gap-3.5 items-center text-[11px]">
            <span className="opacity-80 text-[#0e2b33]">🌐 English / বাংলা</span>
            <a href="#my-stays-section" className="hover:text-[#905e38] font-medium text-[#0e2b33]">
              My Stays ({myBookings.length})
            </a>
            <span className="bg-[#af8a52] text-white px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider shadow-sm">
              bKash: 01832-841818
            </span>

            {/* Dynamic Sign In / Sign Out Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#e8e0d2] px-2 py-0.5 rounded text-[10px] border border-[#af8a52]/30 text-[#0e2b33]">
                  <span className="text-[#0e2b33] font-bold">{currentUser.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => toggleRole()}
                className="bg-[#0e2b33] hover:bg-[#905e38] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                title="Sign In"
              >
                Sign In →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 0.1 Main Navigation Bar */}
      <nav className="bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand Logo & Name */}
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#af8a52] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm group-hover:bg-[#8c6736] transition">
              ◆
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-xl text-[#0e2b33] font-bold tracking-tight leading-tight">
                ISLAMIA GUEST HOUSE
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#af8a52] font-semibold uppercase">
                DHANMONDI
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <ul className="hidden lg:flex gap-8 text-[11px] tracking-widest text-[#0e2b33] uppercase font-bold">
            <li><a href="#destinations" className="hover:text-[#af8a52] transition">Chambers</a></li>
            <li><a href="#philosophy" className="hover:text-[#af8a52] transition">Philosophy</a></li>
            <li><a href="#events" className="hover:text-[#af8a52] transition">Experience</a></li>
            <li><a href="#guest-reviews-section" className="hover:text-[#af8a52] transition">Reviews</a></li>
            <li><a href="#contact-footer" className="hover:text-[#af8a52] transition">Location</a></li>
          </ul>

          {/* Header Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <a 
              href="tel:01909806960" 
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-[#af8a52]/10 text-[#0e2b33] hover:text-[#af8a52] transition-colors border border-slate-200"
              title="Call Reservation: 01909-806960"
            >
              <Phone className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-lg text-[#0e2b33] hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="mt-3 pt-3 border-t border-slate-200 bg-white/95 rounded-b-2xl p-4 shadow-lg flex flex-col gap-3 text-xs uppercase font-semibold text-[#0e2b33] animate-in fade-in duration-200">
            <a href="#destinations" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Chambers &amp; Suites
            </a>
            <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Philosophy &amp; Service
            </a>
            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Experience
            </a>
            <a href="#guest-reviews-section" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Guest Reviews
            </a>
            <a href="#contact-footer" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Location &amp; Directions
            </a>
            <a href="#my-stays-section" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded bg-slate-50 text-[#af8a52] font-bold">
              My Stays ({myBookings.length})
            </a>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              {currentUser ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="bg-rose-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-rose-700 transition cursor-pointer"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); toggleRole(); }}
                  className="bg-[#0e2b33] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#af8a52] transition cursor-pointer"
                >
                  Sign In →
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 0.2 Promo Strip */}
      <div className="bg-[#efe8d8] border-b border-[#0e2b33]/10 py-2.5 px-4 text-xs text-[#0e2b33] text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-2">
          <span>
            Stay 3, pay for 2 on Suites &amp; Deluxe Chambers across our Dhanmondi location. Extend your stay — valid through 2026.
          </span>
          <a 
            href="https://wa.me/8801799148408" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold text-[#c0603f] hover:underline"
          >
            Inquire on WhatsApp →
          </a>
        </div>
      </div>

      {/* 1. Luxury Hero Banner Image */}
      <section 
        className="relative h-[380px] sm:h-[460px] md:h-[520px] bg-cover bg-center flex items-center justify-center overflow-hidden" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1920&q=80')" 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-3xl -mt-12 sm:-mt-16">
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal tracking-wide drop-shadow-md leading-tight">
            Islamia Guest House
          </h1>
          <p className="font-serif text-xl sm:text-3xl text-white/90 mt-2 font-light tracking-wider drop-shadow">
            Dhanmondi
          </p>
        </div>
      </section>

      {/* 2. Floating Mobile & Desktop Booking Search Card */}
      <div id="book-section" className="-mt-24 sm:-mt-32 relative z-20 max-w-sm sm:max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 sm:p-6 text-slate-800">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Field 1: CHECK IN & DATES */}
            <div className="md:col-span-5 pb-3 md:pb-0 md:pr-4 md:border-r border-slate-200/80">
              <label className="text-[10px] sm:text-[11px] tracking-widest text-slate-500 font-bold uppercase block mb-1">
                CHECK IN
              </label>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#905e38] shrink-0" />
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    id="search-check-in-date"
                    type="date"
                    value={searchCheckIn}
                    min={todayStr}
                    onChange={(e) => setSearchCheckIn(e.target.value)}
                    className="w-full text-xs sm:text-sm text-[#0e2b33] font-bold border-none focus:outline-none bg-transparent cursor-pointer p-0"
                  />
                  <span className="text-[#905e38] font-bold text-xs shrink-0">→</span>
                  <input
                    id="search-check-out-date"
                    type="date"
                    value={searchCheckOut}
                    min={searchCheckIn || todayStr}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full text-xs sm:text-sm text-[#0e2b33] font-bold border-none focus:outline-none bg-transparent cursor-pointer p-0"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Divider line */}
            <div className="block md:hidden border-b border-slate-100 my-0.5" />

            {/* Field 2: ROOMS & GUESTS */}
            <div ref={guestPickerRef} className="relative md:col-span-4 pb-3 md:pb-0 md:pr-4 md:border-r border-slate-200/80">
              <label 
                className="text-[10px] sm:text-[11px] tracking-widest text-slate-500 font-bold uppercase block mb-1 cursor-pointer select-none"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
              >
                ROOMS &amp; GUESTS
              </label>
              <button
                id="search-rooms-guests-trigger"
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full flex items-center justify-between text-xs sm:text-sm text-[#0e2b33] font-bold bg-transparent focus:outline-none cursor-pointer p-0 text-left select-none"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <User className="w-5 h-5 text-[#905e38] shrink-0" />
                  <span className="truncate">
                    {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}, {adultsCount + childrenCount} {adultsCount + childrenCount === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                {showGuestPicker ? (
                  <ChevronUp className="w-4 h-4 text-[#905e38] shrink-0 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#905e38] shrink-0 ml-1" />
                )}
              </button>

              {/* Rooms & Guests Popover Card */}
              {showGuestPicker && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Rooms Row */}
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Rooms</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={roomsCount <= 1}
                        onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          roomsCount <= 1 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#0e2b33]">{roomsCount}</span>
                      <button
                        type="button"
                        disabled={roomsCount >= 10}
                        onClick={() => setRoomsCount(Math.min(10, roomsCount + 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          roomsCount >= 10 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Adults Row */}
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Adults</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={adultsCount <= 1}
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          adultsCount <= 1 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#0e2b33]">{adultsCount}</span>
                      <button
                        type="button"
                        disabled={adultsCount >= 10}
                        onClick={() => setAdultsCount(Math.min(10, adultsCount + 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          adultsCount >= 10 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children Row */}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs font-semibold text-slate-800">Children</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={childrenCount <= 0}
                        onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          childrenCount <= 0 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#0e2b33]">{childrenCount}</span>
                      <button
                        type="button"
                        disabled={childrenCount >= 10}
                        onClick={() => setChildrenCount(Math.min(10, childrenCount + 1))}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition text-xs font-bold ${
                          childrenCount >= 10 
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'border-[#905e38] text-[#905e38] hover:bg-[#905e38]/10 cursor-pointer active:scale-95'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: VIEW PRICES BUTTON */}
            <div className="md:col-span-3">
              <a
                href="#destinations"
                className="w-full bg-[#905e38] hover:bg-[#72482a] text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                <span>View prices</span>
              </a>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
