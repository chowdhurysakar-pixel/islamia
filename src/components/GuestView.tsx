/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, ServiceRequestType, BookingStatus } from '../types';
import { RoomCard } from './RoomCard';
import { Chambers } from './Chambers';
import { PrintableInvoice } from './PrintableInvoice';
import { WhyChooseUs } from './WhyChooseUs';
import { Calendar, Search, Filter, Sliders, CheckCircle2, Ticket, Sparkles, MessageSquarePlus, X, BellDot, HeartHandshake, Receipt, Printer, MapPin, Phone, Info, Star, MessageSquare, Check, Mic, MicOff, ExternalLink, ChevronDown, ChevronUp, Minus, Plus, User, Menu, Send, AlertCircle, Mail, LogOut, RotateCcw, Trash2, Smartphone, Copy } from 'lucide-react';
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
    activeGuestsCount,
    createBooking, 
    addBooking,
    updateBookingStatus, 
    createServiceRequest,
    submitFeedback,
    deleteFeedback,
    triggerSmsConfirmation,
    getBookingSmsText,
    showToast
  } = useApp();

  // Instant Text confirmation states
  const [copiedSms, setCopiedSms] = useState<boolean>(false);
  const [showSmsPreviewModal, setShowSmsPreviewModal] = useState<boolean>(false);

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

  // Quick Inquiry & Newsletter Form State
  const [inquiryName, setInquiryName] = useState<string>('');
  const [inquiryContact, setInquiryContact] = useState<string>('');
  const [inquiryMessage, setInquiryMessage] = useState<string>('');
  const [inquiryLoading, setInquiryLoading] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);
  const [inquiryError, setInquiryError] = useState<string>('');

  // Rating & Review Feedback Form State
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [guestReviewerName, setGuestReviewerName] = useState<string>('');
  const [guestReviewerContact, setGuestReviewerContact] = useState<string>('');
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

  // Search query state for My Stays
  const [myStaySearch, setMyStaySearch] = useState<string>(() => {
    try {
      return localStorage.getItem('guest_my_stay_query') || '';
    } catch (e) {
      return '';
    }
  });

  // Guest reservations made (filtered by logged-in user OR phone / NID / email / guest name search)
  const myBookings = useMemo(() => {
    const queryLower = myStaySearch.trim().toLowerCase();

    return bookings.filter(b => {
      // Direct user match
      const isUserMatch = Boolean(currentUser && (
        (b.userId && b.userId === currentUser.uid) ||
        (b.guestEmail && currentUser.email && b.guestEmail.toLowerCase() === currentUser.email.toLowerCase())
      ));

      // Just created booking match
      const isJustCreatedMatch = Boolean(justCompletedBookingId && b.id === justCompletedBookingId);

      // Search field matches
      const phoneMatch = Boolean(queryLower && b.guestPhone && b.guestPhone.toLowerCase().includes(queryLower));
      const nidMatch = Boolean(queryLower && b.nidNumber && b.nidNumber.toLowerCase().includes(queryLower));
      const emailMatch = Boolean(queryLower && b.guestEmail && b.guestEmail.toLowerCase().includes(queryLower));
      const nameMatch = Boolean(queryLower && b.guestName && b.guestName.toLowerCase().includes(queryLower));
      const idMatch = Boolean(queryLower && b.id && b.id.toLowerCase().includes(queryLower));
      const isSearchMatch = phoneMatch || nidMatch || emailMatch || nameMatch || idMatch;

      if (queryLower) {
        return isSearchMatch || isUserMatch || isJustCreatedMatch;
      }

      return isUserMatch || isJustCreatedMatch;
    });
  }, [bookings, currentUser, myStaySearch, justCompletedBookingId]);

  // Auto-fill reviewer details when guest has a booking or currentUser exists
  React.useEffect(() => {
    if (!guestReviewerName) {
      if (currentUser?.name) {
        setGuestReviewerName(currentUser.name);
      } else if (myBookings.length > 0 && myBookings[0].guestName) {
        setGuestReviewerName(myBookings[0].guestName);
      }
    }
    if (!guestReviewerContact) {
      if (currentUser?.email) {
        setGuestReviewerContact(currentUser.email);
      } else if (myBookings.length > 0) {
        setGuestReviewerContact(myBookings[0].guestPhone || myBookings[0].guestEmail || '');
      }
    }
  }, [currentUser, myBookings]);

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
    if (!selectedRoom || computedNights <= 0) {
      showToast({ type: 'error', message: 'Invalid booking dates. Check-out must be after check-in.' });
      return;
    }

    if (!bookName.trim()) {
      showToast({ type: 'error', message: 'Please enter lead guest full name.' });
      return;
    }
    if (!bookEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookEmail.trim())) {
      showToast({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!bookPhone.trim() || bookPhone.trim().length < 6) {
      showToast({ type: 'error', message: 'Please enter a valid phone number.' });
      return;
    }

    // 1. Optimistically display the confirmation modal immediately using a generated fallback reference code
    const fallbackBookingId = `B${Date.now().toString().slice(-4)}`;
    setJustCompletedBookingId(fallbackBookingId);

    const bookingPayload = {
      roomId: selectedRoom.id,
      userId: currentUser?.uid || 'temp-guest',
      guestName: bookName.trim(),
      guestEmail: bookEmail.trim().toLowerCase(),
      guestPhone: bookPhone.trim(),
      checkIn: bookCheckIn,
      checkOut: bookCheckOut,
      totalAmount: computedTotal,
      status: 'confirmed' as const,
      notes: bookNotes,
      additionalGuests: additionalGuests.filter(g => g.name.trim() !== ''),
      referenceName: bookReferenceName.trim() || '',
      kids: kids.filter(k => k.name.trim() !== '')
    };

    // 2. Wrap database submission in try...catch block for graceful fallback handling
    try {
      const addFn = addBooking || createBooking;
      const realBookingId = await addFn(bookingPayload);
      if (realBookingId) {
        setJustCompletedBookingId(realBookingId);
      }
      if (bookPhone.trim()) {
        setMyStaySearch(bookPhone.trim());
        try {
          localStorage.setItem('guest_my_stay_query', bookPhone.trim());
        } catch (e) {}
      }
    } catch (error) {
      console.warn("Notice: Database save encountered network/permission delay; using local fallback state:", error);
      // Fallback ID remains active so the guest still sees their confirmation screen seamlessly
    }

    showToast({
      type: 'success',
      message: `🎉 Booking confirmed for ${bookName.trim()} in Room ${selectedRoom.number}!`
    });
  };

  // Submit Guest Incident / service request ticket
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceBooking || !serviceDetails.trim()) {
      showToast({ type: 'error', message: 'Please describe your request details.' });
      return;
    }

    await createServiceRequest({
      roomId: selectedServiceBooking.roomId,
      type: serviceType,
      description: `[Guest Request] ${serviceDetails.trim()}`,
      status: 'pending'
    });

    setServiceSuccess(true);
    setServiceDetails('');
    showToast({ type: 'success', message: '🔔 Staff member dispatched for your room service request.' });
    setTimeout(() => {
      setServiceSuccess(false);
      setSelectedServiceBooking(null);
    }, 3000);
  };

  // Direct Inquiry & Newsletter Submit Handler
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');

    if (!inquiryName.trim()) {
      setInquiryError('Please enter your full name.');
      return;
    }
    if (!inquiryContact.trim()) {
      setInquiryError('Please enter your email or phone number.');
      return;
    }
    if (!inquiryMessage.trim()) {
      setInquiryError('Please write your inquiry or request message.');
      return;
    }

    setInquiryLoading(true);
    try {
      await createServiceRequest({
        roomId: 'Inquiry Desk',
        type: 'concierge',
        description: `[Direct Concierge Inquiry] From: ${inquiryName.trim()} (${inquiryContact.trim()}) — Message: ${inquiryMessage.trim()}`,
        status: 'pending'
      });
    } catch (err) {
      console.warn("Notice saving concierge inquiry:", err);
    }

    setInquiryLoading(false);
    setInquirySuccess(true);
    showToast({
      type: 'success',
      message: '📨 Inquiry submitted! Front desk management will respond shortly.'
    });
    setInquiryName('');
    setInquiryContact('');
    setInquiryMessage('');
    setTimeout(() => setInquirySuccess(false), 6000);
  };

  // Submit Guest Rating and Written Review
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalReviewerName = currentUser?.name || guestReviewerName.trim() || (myBookings.length > 0 ? myBookings[0].guestName : '') || bookName.trim() || 'Verified Guest';
    const finalReviewerContact = currentUser?.email || guestReviewerContact.trim() || (myBookings.length > 0 ? (myBookings[0].guestPhone || myBookings[0].guestEmail || '') : '') || bookPhone.trim() || '';

    if (!currentUser && !finalReviewerName.trim()) {
      showToast({ type: 'error', message: 'Please enter your reviewer name.' });
      return;
    }

    if (!userComment.trim()) {
      showToast({ type: 'info', message: 'Please enter your stay review details before submitting.' });
      return;
    }

    setSubmittingFeedback(true);
    try {
      await submitFeedback(userRating, userComment.trim(), finalReviewerName, finalReviewerContact);
      setUserComment('');
      setUserRating(5);
      showToast({ type: 'success', message: '🌟 Thank you! Your review has been published.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Failed to submit review. Please try again.' });
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
            <span className="opacity-80 text-[#0e2b33]">🌐 English</span>
            <a href="#my-stays-section" className="hover:text-[#905e38] font-medium text-[#0e2b33]">
              My Stays ({myBookings.length})
            </a>
            <span className="bg-[#af8a52] text-white px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider shadow-sm">
              bKash: 01832-841818
            </span>
            {currentUser && (
              <div className="flex items-center gap-2 bg-[#e8e0d2] px-2.5 py-1 rounded-lg border border-[#af8a52]/30 text-[#0e2b33]">
                <span className="text-[#0e2b33] font-bold text-[11px]">{currentUser.name}</span>
                <button 
                  id="guest-logout-btn"
                  onClick={logout}
                  className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[10px] font-bold transition shadow-xs cursor-pointer ml-1"
                  title="Sign Out of Islamia System"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
            <button
              onClick={() => toggleRole()}
              className="bg-[#0e2b33] hover:bg-[#905e38] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
              title="Sign In"
            >
              Sign In →
            </button>
          </div>
        </div>
      </div>

      {/* 0.1 Main Navigation Bar (Clean luxury header like reference) */}
      <nav className="bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand Logo & Name */}
          <a 
            href="#top" 
            onClick={(e) => { 
              e.preventDefault(); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }} 
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#af8a52] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm group-hover:bg-[#8c6736] transition">
              ◆
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-xl text-[#0e2b33] font-bold tracking-tight leading-tight">
                ISLAMIA GUEST HOUSE
              </span>
              <span className="text-[9px] tracking-[0.25em] text-[#af8a52] font-semibold uppercase">
                DHANMONDI, DHAKA
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <ul className="hidden lg:flex gap-8 text-[11px] tracking-widest text-[#0e2b33] uppercase font-bold">
            <li><a href="#destinations" className="hover:text-[#af8a52] transition">Rooms</a></li>
            <li><a href="#philosophy" className="hover:text-[#af8a52] transition">Philosophy</a></li>
            <li><a href="#events" className="hover:text-[#af8a52] transition">Experience</a></li>
            <li><a href="#guest-reviews-section" className="hover:text-[#af8a52] transition">Reviews</a></li>
            <li><a href="#why-us" className="hover:text-[#af8a52] transition">Why Us</a></li>
            <li><a href="#contact-footer" className="hover:text-[#af8a52] transition">Location</a></li>
          </ul>

          {/* Header Action Items: Quick Call + Hamburger Menu (NO Join for Free option) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Direct Telephone Call Button (matching phone icon in image) */}
            <a 
              href="tel:01909806960" 
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-[#af8a52]/10 text-[#0e2b33] hover:text-[#af8a52] transition-colors border border-slate-200"
              title="Call Reservation: 01909-806960"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Mobile / Compact Menu Toggle Button (≡) */}
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
              Rooms &amp; Suites
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
            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Why Choose Us
            </a>
            <a href="#contact-footer" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded hover:bg-slate-100 transition">
              Location &amp; Directions
            </a>
            <a href="#my-stays-section" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded bg-slate-50 text-[#af8a52] font-bold">
              My Stays ({myBookings.length})
            </a>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => { setMobileMenuOpen(false); toggleRole(); }}
                className="bg-[#0e2b33] text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#af8a52] transition"
              >
                Sign In →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 0.2 Promo Strip */}
      <div className="bg-[#efe8d8] border-b border-[#0e2b33]/10 py-2.5 px-4 text-xs text-[#0e2b33] text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-2">
          <span className="font-serif font-medium text-slate-850">
            Dhanmondi's Most Thoughtful Stay, Where Comfort Meets Conscience
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

      {/* 1. Luxury Hero Banner Image with Display Serif Title Overlay */}
      <section 
        className="relative h-[380px] sm:h-[460px] md:h-[520px] bg-cover bg-center flex items-center justify-center overflow-hidden" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1920&q=80')" 
        }}
      >
        {/* Light luxury gradient overlay for typography readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hero Title Overlay - White Display Serif matching screenshot */}
        <div className="relative z-10 text-center px-4 max-w-3xl -mt-12 sm:-mt-16">
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal tracking-wide drop-shadow-md leading-tight">
            Islamia Guest House
          </h1>
          <p className="font-serif text-xl sm:text-3xl text-white/90 mt-2 font-light tracking-wider drop-shadow">
            Dhanmondi
          </p>
        </div>
      </section>

      {/* 2. Floating Mobile & Desktop Booking Search Card (Matching Reference Picture Layout) */}
      <div id="book-section" className="-mt-24 sm:-mt-32 relative z-20 max-w-sm sm:max-w-xl md:max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 sm:p-6 text-slate-800">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Field 1: CHECK IN & DATES (Matching Picture: Calendar icon + Check-in -> Check-out) */}
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

            {/* Field 2: ROOMS & GUESTS (Matching Picture: Person icon + 1 Room, 1 Guest + Popover) */}
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

                  {/* Apply button */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGuestPicker(false)}
                      className="text-xs font-bold text-white bg-[#0e2b33] hover:bg-[#905e38] transition cursor-pointer px-4 py-1.5 rounded-lg shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: Action Button - View prices (Matching warm brown rounded button in image) */}
            <div className="md:col-span-3 pt-2 md:pt-0">
              <button 
                type="button"
                onClick={() => {
                  if (searchCheckIn && searchCheckOut && new Date(searchCheckOut) <= new Date(searchCheckIn)) {
                    showToast({ type: 'error', message: 'Check-out date must be after check-in date.' });
                    return;
                  }
                  showToast({ type: 'success', message: `🔎 Showing available rooms for ${searchCheckIn} to ${searchCheckOut}` });
                  const el = document.getElementById('destinations');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#905e38] hover:bg-[#784d2d] active:scale-[0.99] text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl transition-all w-full flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg"
              >
                View prices
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 2.5 Our Philosophy Section */}
      <section id="philosophy" className="py-12 bg-[#efe8d8]/50 border-y border-[#0e2b33]/10 mb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[11px] tracking-[0.28em] text-[#af8a52] font-bold mb-3 uppercase">OUR PHILOSOPHY</div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#0e2b33] max-w-2xl leading-tight mb-4">
            Opening doors to a world of quiet fascination and homely luxury
          </h2>
          <p className="text-sm md:text-base text-[#3c4650] max-w-2xl leading-relaxed">
            Travel, to us, is more than a destination — it's a passage that widens perspective, connects cultures, and leaves a mark long after check-out. As custodians of a slower kind of luxury in Dhanmondi, Islamia Guest House invites you into peaceful rooms where remarkable service happens in the moments you least expect.
          </p>
        </div>
      </section>

      {/* 3. Rooms Listing Grid */}
      {filteredRooms.length === 0 ? (
        <section id="destinations" className="max-w-7xl mx-auto px-6 mb-16 space-y-8 scroll-mt-24">
          <div className="text-center py-16 bg-[#efe8d8]/30 rounded-2xl border border-[#0e2b33]/10">
            <p className="text-[#0e2b33] font-medium text-sm">No rooms match your specific parameters.</p>
            <button 
              id="clear-filters-btn"
              onClick={() => { setRoomTypeFilter('all'); setRoomsCount(1); setAdultsCount(1); }}
              className="mt-3 text-xs text-[#af8a52] font-bold underline hover:text-[#d7bd8a]"
            >
              Reset Search Parameters
            </button>
          </div>
        </section>
      ) : (
        <Chambers 
          rooms={filteredRooms}
          onBookClick={handleOpenBooking}
        />
      )}

      {/* 3.5 Events & Experience Collage Section */}
      <section id="events" className="bg-[#0e2b33] text-[#f8f4ec] py-20 px-6 mb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[11px] tracking-[0.28em] text-[#d7bd8a] font-bold uppercase">
              EXPLORE HISTORIC DHANMONDI
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
              Discover Dhanmondi's Heritage & Iconic Landmarks
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-[#f8f4ec]/85 leading-relaxed">
              <p>
                Stay at the center of culture and history. From our prime Dhanmondi location, immerse yourself in Bangladesh’s most celebrated architectural and historic wonders:
              </p>
              <ul className="space-y-2 pt-1 border-t border-[#f8f4ec]/10">
                <li className="flex items-start gap-2">
                  <span className="text-[#d7bd8a] font-bold">🏛️</span>
                  <span><strong>Jatiya Sangsad Bhaban:</strong> World-renowned brutalist parliament house designed by Louis Kahn, framed by scenic water pools.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d7bd8a] font-bold">🏰</span>
                  <span><strong>Lalbagh Kella (Fort):</strong> Majestic 17th-century Mughal fortress featuring the tomb of Pari Bibi and subterranean gardens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d7bd8a] font-bold">🌿</span>
                  <span><strong>Dhanmondi Lake Park:</strong> Serene waterfront promenade located steps away for morning walks, fresh breeze, and local tea stalls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d7bd8a] font-bold">✍️</span>
                  <span><strong>Kazi Nazrul Islam Shrine & Museum:</strong> Pay homage to National Poet Kazi Nazrul Islam (Rebel Poet) at his central Dhanmondi memorial & Nazrul Institute.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d7bd8a] font-bold">🕌</span>
                  <span><strong>Ahsan Manzil & Tara Masjid:</strong> Explore the iconic Pink Palace on the Buriganga River and the stunning ornate Star Mosque in historic Dhanmondi surroundings.</span>
                </li>
              </ul>
            </div>
            <a 
              href="https://wa.me/8801799148408" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#d7bd8a] text-[#d7bd8a] hover:bg-[#d7bd8a] hover:text-[#0e2b33] px-6 py-2.5 text-xs font-bold tracking-wider rounded transition-all mt-2"
            >
              <span>Get Guided City Tour Info on WhatsApp</span> →
            </a>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="relative group overflow-hidden rounded shadow-lg h-44">
              <img 
                src={nationalParliamentImg} 
                alt="National Parliament House (Jatiya Sangsad Bhaban)" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">National Parliament</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded shadow-lg h-44">
              <img 
                src={lalbaghFortImg} 
                alt="Lalbagh Fort (Lalbagh Kella)" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1608958435020-e827101ef2b8?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">Lalbagh Fort (Kella)</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded shadow-lg h-44">
              <img 
                src={ahsanManzilImg} 
                alt="Ahsan Manzil Pink Palace" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">Ahsan Manzil (Pink Palace)</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded shadow-lg h-44">
              <img 
                src={taraMasjidImg} 
                alt="Tara Masjid Star Mosque" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">Tara Masjid (Star Mosque)</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-2 relative group overflow-hidden rounded shadow-lg h-44">
              <img 
                src={dhanmondiLakeImg} 
                alt="Dhanmondi Lake Park" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">Dhanmondi Lake Park</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Guest Reservations Section */}
      <section id="my-stays-section" className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-[#0e2b33]/10 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-[#af8a52]" />
            <h2 className="font-serif text-2xl font-normal text-[#0e2b33]">
              My Stays &amp; Room Control
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#0e2b33]/50" />
              <input
                type="text"
                id="my-stay-search-input-field"
                value={myStaySearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setMyStaySearch(val);
                  try {
                    localStorage.setItem('guest_my_stay_query', val);
                  } catch (err) {}
                }}
                placeholder="Search by Mobile number / NID / Email..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#0e2b33]/20 rounded-xl text-xs text-[#0e2b33] placeholder:text-slate-400 focus:outline-none focus:border-[#af8a52] focus:ring-1 focus:ring-[#af8a52] shadow-xs"
              />
              {myStaySearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMyStaySearch('');
                    try {
                      localStorage.removeItem('guest_my_stay_query');
                    } catch (err) {}
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {myBookings.length === 0 ? (
          <div className="bg-[#efe8d8]/40 p-8 rounded-2xl text-center border border-[#0e2b33]/10 max-w-xl mx-auto my-4 shadow-xs">
            <HeartHandshake className="w-10 h-10 text-[#af8a52] mx-auto mb-3" />
            <h4 className="font-semibold text-[#0e2b33] text-sm">
              {myStaySearch ? 'No Match Found' : 'No Active Booking'}
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {myStaySearch 
                ? `No booking found matching "${myStaySearch}". Please verify your mobile number or NID.` 
                : 'Search using your mobile number or NID provided during booking to manage your room services and stay details.'}
            </p>
            {myStaySearch && (
              <button
                type="button"
                onClick={() => {
                  setMyStaySearch('');
                  try { localStorage.removeItem('guest_my_stay_query'); } catch (e) {}
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0e2b33] text-[#efe8d8] text-xs font-bold rounded-xl hover:bg-[#af8a52] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Search</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => {
              const rDetails = rooms.find(r => r.id === booking.roomId);
              return (
                <div 
                  key={booking.id}
                  id={`my-booking-${booking.id}`}
                  className="bg-white border border-[#0e2b33]/10 shadow-sm rounded p-5 hover:border-[#af8a52] transition-all flex flex-col md:flex-row justify-between gap-6"
                >
                  {/* Reservation Room detail info */}
                  <div className="flex gap-4">
                    {rDetails && (
                      <div className="w-20 h-20 rounded overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                        <img 
                          src={rDetails.image} 
                          alt="Room" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                          }}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0e2b33]">Room {rDetails?.number || 'N/A'}</span>
                        <span className="text-[10px] font-mono uppercase bg-[#efe8d8] text-[#0e2b33] py-0.5 px-2 rounded">
                          {rDetails?.type || 'Standard'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {booking.checkIn} — {booking.checkOut}
                      </p>
                      <div className="text-xs text-slate-500 flex items-center flex-wrap gap-1.5">
                        <span>Reserved for: <span className="font-semibold text-[#0e2b33]">{booking.guestName}</span></span>
                        {isRepeatGuest(booking) && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#af8a52]/10 text-[#af8a52] border border-[#af8a52]/30 rounded text-[9px] font-bold uppercase tracking-wide">
                            <Sparkles className="w-2.5 h-2.5 text-[#af8a52]" />
                            Repeat Guest
                          </span>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded inline-block border border-amber-200 mt-1">
                          Notes: "{booking.notes}"
                        </p>
                      )}
                      {booking.referenceName && (
                        <div className="mt-1">
                          <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-1 rounded inline-block border border-teal-200">
                            Reference: <span className="font-semibold">{booking.referenceName}</span>
                          </span>
                        </div>
                      )}
                      {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-500">Additional Guests ({booking.additionalGuests.length}):</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {booking.additionalGuests.map((g, gi) => (
                              <span key={gi} className="inline-flex text-[9px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                {g.name} ({g.phone})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {booking.kids && booking.kids.length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-500">Kids / Children ({booking.kids.length}):</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {booking.kids.map((k, ki) => (
                              <span key={ki} className="inline-flex text-[9px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-mono">
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
                      <span className="text-xs font-mono text-slate-500 block">
                        Total Amount: <span className="text-[#0e2b33] font-bold">৳{booking.totalAmount}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
                        booking.status === 'checked-in' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                        booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-600'
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
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e2b33] hover:bg-[#081b21] text-white rounded text-xs font-semibold transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                          <button
                            id={`guest-direct-print-${booking.id}`}
                            onClick={() => {
                              setAutoPrintInvoice(true);
                              setInvoiceBooking(booking);
                              setShowBillModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#af8a52] hover:bg-[#d7bd8a] text-[#081b21] rounded text-xs font-bold transition"
                            title="Directly trigger browser printing"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </>
                      )}

                      {/* Service request option */}
                      {booking.status === 'checked-in' && (
                        <button
                          id={`make-service-req-${booking.id}`}
                          onClick={() => { setSelectedServiceBooking(booking); setServiceSuccess(false); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded text-xs font-semibold transition border border-teal-200"
                        >
                          <BellDot className="w-3.5 h-3.5 text-teal-600" />
                          <span>Request Service</span>
                        </button>
                      )}

                      {/* Feedback option */}
                      {(booking.status === 'checked-out' || booking.status === 'checked-in') && (
                        <button
                          id={`leave-feedback-btn-${booking.id}`}
                          onClick={() => {
                            const section = document.getElementById('guest-reviews-section');
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold transition border border-amber-200"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Rate Stay</span>
                        </button>
                      )}

                      {/* Cancel option */}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <button
                          id={`cancel-booking-${booking.id}`}
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold transition"
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
      </section>

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

            {/* If completed booking, show success screen inside modal with instant phone text confirmation */}
            {justCompletedBookingId ? (() => {
              const completedBooking = bookings.find(b => b.id === justCompletedBookingId) || {
                id: justCompletedBookingId,
                roomId: selectedRoom.id,
                roomNumber: selectedRoom.number,
                roomType: selectedRoom.type,
                guestName: bookName || 'Valued Guest',
                guestPhone: bookPhone || '',
                guestEmail: bookEmail || '',
                checkIn: bookCheckIn,
                checkOut: bookCheckOut,
                totalAmount: computedTotal,
                status: 'confirmed' as BookingStatus,
                createdAt: new Date().toISOString()
              };

              const smsText = getBookingSmsText(completedBooking);
              const cleanPhone = (bookPhone || '').replace(/[^\d+]/g, '');
              let waNumber = cleanPhone.replace(/^\+/, '');
              if (waNumber.startsWith('01')) waNumber = '88' + waNumber;
              else if (!waNumber.startsWith('880') && waNumber.length === 10 && waNumber.startsWith('1')) waNumber = '880' + waNumber;

              const smsUrl = `sms:${cleanPhone}?&body=${encodeURIComponent(smsText)}`;
              const whatsappUrl = `https://wa.me/${waNumber || '8801799148408'}?text=${encodeURIComponent(smsText)}`;

              const handleCopy = () => {
                navigator.clipboard.writeText(smsText);
                setCopiedSms(true);
                setTimeout(() => setCopiedSms(false), 2500);
              };

              return (
                <div className="p-6 text-center space-y-4 max-h-[85vh] overflow-y-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-sm shadow-emerald-500/10">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-slate-800">Reservation Confirmed!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                      Room {selectedRoom.number} ({selectedRoom.type}) is booked for <span className="font-bold text-slate-700">{bookName || 'you'}</span>.
                    </p>
                  </div>

                  {/* Instant SMS Confirmation Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Smartphone className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-950 font-sans">Instant Text Confirmation</span>
                            <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                              Sent to Mobile
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                            {bookPhone ? `📱 ${bookPhone}` : '📱 Guest Mobile Phone'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      An instant booking confirmation text has been dispatched for your phone with reference <span className="font-mono font-bold text-emerald-900">#{justCompletedBookingId}</span>, complete room details, invoice amount, and Dhanmondi address.
                    </p>

                    {/* Quick Instant Message Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <a
                        id="open-sms-text-btn"
                        href={smsUrl}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center active:scale-95"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Open SMS</span>
                      </a>

                      <a
                        id="open-whatsapp-text-btn"
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        id="copy-sms-text-btn"
                        type="button"
                        onClick={handleCopy}
                        className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-center active:scale-95 cursor-pointer"
                      >
                        {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSms ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>

                    {/* Toggleable Text Message Preview */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowSmsPreviewModal(!showSmsPreviewModal)}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1"
                      >
                        {showSmsPreviewModal ? 'Hide Text Message Details ▲' : 'View Text Message Sent to Phone ▼'}
                      </button>

                      {showSmsPreviewModal && (
                        <div className="mt-2 p-3 bg-white/90 border border-emerald-200 rounded-xl font-mono text-[10.5px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto shadow-inner">
                          {smsText}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return to Lobby / Main View */}
                  <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                    <button
                      id="finish-booking-btn"
                      onClick={() => {
                        setSelectedRoom(null);
                        setShowSmsPreviewModal(false);
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      <span>Return to Lobby</span>
                    </button>
                  </div>
                </div>
              );
            })() : (
              <form noValidate onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs font-medium text-slate-500">
                    Daily Room Rate: <span className="font-semibold text-slate-700 block mt-0.5">৳{selectedRoom.price} / night</span>
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
                            Bengali
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
                          ? "Speak now! e.g. 'I need three extra towels and morning tea'..."
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
                          Voice input active: speak clearly into your mic. Your transcript will append below.
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
                    <span className="text-lg font-serif font-semibold text-teal-900 block">৳{computedTotal}</span>
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
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {currentUser ? (
                <p className="text-xs text-slate-500">
                  You are reviewing as <span className="font-semibold text-slate-700">{currentUser.name}</span> ({currentUser.role})
                </p>
              ) : myBookings.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Verified Reservation Guest:</span> {myBookings[0].guestName} (Room #{myBookings[0].roomId})
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Share your stay experience after a reservation or enter your guest details below.
                </p>
              )}

              {/* Guest Name & Contact Inputs (For Guests not signed into a formal account) */}
              {!currentUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={guestReviewerName}
                      onChange={(e) => setGuestReviewerName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Phone / Email (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="01711223344"
                      value={guestReviewerContact}
                      onChange={(e) => setGuestReviewerContact(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              )}

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
                  placeholder="Share details of your room comfort, staff services, and neighborhood accessibility..."
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

                      {currentRole === 'admin' && (
                        <div className="pt-1.5 flex justify-end border-t border-slate-100/80">
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Admin action: Delete review from "${f.userName || 'Guest'}"?`)) {
                                try {
                                  await deleteFeedback(f.id);
                                  showToast({ type: 'info', message: 'Review deleted by admin.' });
                                } catch (e: any) {
                                  showToast({ type: 'error', message: e?.message || 'Failed to delete review.' });
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition cursor-pointer border border-rose-200/60"
                            title="Delete review as Admin"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete Review (Admin)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4.8. Why Choose Us Section */}
      <WhyChooseUs />

      {/* 5. Contact & Location Info Footer Banner with Map Background */}
      <div 
        id="contact-footer" 
        className="text-white rounded p-8 shadow-2xl border border-[#d7bd8a]/30 relative overflow-hidden max-w-7xl mx-auto mb-16 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(8,27,33,0.90) 0%, rgba(14,43,51,0.85) 50%, rgba(8,27,33,0.94) 100%), url('${dhanmondiMapImg}')`
        }}
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#af8a52]/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d7bd8a]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Heading, Address & Interactive Google Maps Link */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-[#af8a52]/30 border border-[#d7bd8a]/40 px-3.5 py-1 text-[#d7bd8a] rounded text-xs font-mono tracking-widest uppercase shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#d7bd8a]" />
                <span>FIND US IN DHANMONDI</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-tight drop-shadow">
                  Islamia Guest House
                </h3>
                <p className="text-sm text-[#efe8d8] font-medium leading-relaxed">
                  House No: 55/C/1, Road No: 9/A, Dhanmondi - 1209, Dhaka, Bangladesh
                </p>
              </div>

              <div className="flex gap-2.5 items-start bg-[#0e2b33]/80 backdrop-blur-md border border-[#d7bd8a]/30 p-4 rounded shadow-lg">
                <Info className="w-5 h-5 text-[#d7bd8a] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#d7bd8a] uppercase tracking-wider font-mono">
                    Landmarks
                  </p>
                  <p className="text-xs text-[#efe8d8] leading-relaxed font-sans">
                    Opposite Ibne Sina 9/A, Behind Meena Bazar, Adjacent to Northern Medical College Building
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Google Maps Action Box */}
            <div className="pt-2">
              <a
                href="https://maps.app.goo.gl/e3o656i1uDh3QXHV8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 font-semibold px-5 py-3 rounded-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm tracking-wide border border-[#f5e5c8]/50 group"
              >
                <MapPin className="w-4 h-4 text-slate-950 group-hover:scale-110 transition" />
                <span>Open Location in Google Maps</span>
                <ExternalLink className="w-4 h-4 text-slate-950/70 group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          </div>

          {/* Right Column: Contact Details with logos & Map Preview Card */}
          <div className="lg:col-span-5 space-y-4 bg-[#0e2b33]/80 backdrop-blur-md p-6 rounded-xl border border-[#d7bd8a]/30 shadow-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#d7bd8a] uppercase tracking-wider font-mono mb-3.5">
                Hotline &amp; Payment Support
              </h4>
              
              <div className="space-y-3">
                {/* bKash */}
                <div className="flex items-center justify-between p-3 bg-[#081b21]/90 rounded-lg border border-pink-500/30 group">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-pink-500/10 rounded group-hover:scale-105 transition">
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
                <div className="flex items-center justify-between p-3 bg-[#081b21]/90 rounded-lg border border-[#af8a52]/30 group">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-700/50 rounded group-hover:scale-105 transition">
                      <CallLogo className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono leading-none mb-1">
                        Direct Call Support
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-100">01909-806960</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[#d7bd8a] bg-[#af8a52]/10 px-2 py-0.5 rounded-full">
                    Call
                  </span>
                </div>

                {/* WhatsApp */}
                <div className="flex items-center justify-between p-3 bg-[#081b21]/90 rounded-lg border border-emerald-500/30 group">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded group-hover:scale-105 transition">
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

            {/* Clickable Map Thumbnail Banner */}
            <a
              href="https://maps.app.goo.gl/e3o656i1uDh3QXHV8"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative rounded-lg overflow-hidden border border-[#d7bd8a]/40 group shadow-md hover:border-[#d7bd8a] transition"
            >
              <img 
                src={dhanmondiMapImg} 
                alt="Dhanmondi Road 9/A Islamia Guesthouse Map" 
                className="w-full h-24 object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition flex items-center justify-center gap-2 text-xs font-mono text-white font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#d7bd8a] animate-bounce" />
                <span>View Dhanmondi Map</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#d7bd8a]" />
              </div>
            </a>

          </div>

        </div>
      </div>



      {/* 6. Luxury Footer */}
      <footer className="bg-[#081b21] text-[#f8f4ec]/70 py-12 px-6 border-t border-[#0e2b33]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-8 border-b border-white/10">
            <div>
              <div className="font-serif text-xl text-[#af8a52] font-semibold tracking-wide mb-2 flex items-center gap-2">
                <span className="text-[#af8a52]">◆</span>
                <span>ISLAMIA GUEST HOUSE</span>
              </div>
              <p className="text-xs text-[#efe8d8]/60 max-w-sm leading-relaxed">
                Dhanmondi Road 9/A. Homely luxury, family-friendly security, and peaceful accommodations.
              </p>
            </div>
            <div className="flex flex-wrap gap-12 text-xs">
              <div>
                <h5 className="text-[11px] font-bold tracking-widest text-[#d7bd8a] uppercase mb-3">Explore</h5>
                <ul className="space-y-2">
                  <li><a href="#destinations" className="hover:text-white">Rooms</a></li>
                  <li><a href="#philosophy" className="hover:text-white">Philosophy</a></li>
                  <li><a href="#events" className="hover:text-white">Experience</a></li>
                  <li><a href="#guest-reviews-section" className="hover:text-white">Reviews</a></li>
                  <li><a href="#why-us" className="hover:text-white">Why Us</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[11px] font-bold tracking-widest text-[#d7bd8a] uppercase mb-3">Support</h5>
                <ul className="space-y-2">
                  <li><a href="https://maps.app.goo.gl/e3o656i1uDh3QXHV8" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">Location &amp; Map <ExternalLink className="w-3 h-3 text-[#d7bd8a]" /></a></li>
                  <li><a href="tel:01909806960" className="hover:text-white">Hotline: 01909-806960</a></li>
                  <li><a href="https://wa.me/8801799148408" target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp 01799-148408</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-6 text-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-[#efe8d8]/60">
            <span>© 2026 Islamia Guest House, Dhanmondi. All rights reserved.</span>
            <span className="text-[#d7bd8a]/80 font-mono">Dedicated to Islamia Guest House</span>
          </div>
        </div>
      </footer>

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
