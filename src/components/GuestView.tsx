/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, ServiceRequestType } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { Calendar, Search, Filter, Sliders, CheckCircle2, Ticket, Sparkles, X, BellDot, HeartHandshake, Receipt, Printer, MapPin, Phone, Info, Star, MessageSquare, Check, Mic, MicOff, ExternalLink, ChevronDown, ChevronUp, Minus, Plus, User, Menu } from 'lucide-react';
import dhanmondiMapImg from '../assets/images/dhanmondi_map_location_1785059048345.jpg';
import nationalParliamentImg from '../assets/images/national_parliament_dhaka_1785812392106.jpg';
import lalbaghFortImg from '../assets/images/lalbagh_fort_dhaka_1785812405532.jpg';
import ahsanManzilImg from '../assets/images/ahsan_manzil_dhaka_1785813447557.jpg';
import taraMasjidImg from '../assets/images/tara_masjid_dhaka_1785813463413.jpg';
import dhanmondiLakeImg from '../assets/images/dhanmondi_lake_dhaka_1785812418285.jpg';

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
    toggleRole,
    logout,
    createBooking, 
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
  const [additionalGuests, setAdditionalGuests] = useState<{ name: string; phone: string; }[]>([]);
  const [bookReferenceName, setBookReferenceName] = useState<string>('');
  const [kids, setKids] = useState<{ name: string; age: string; }[]>([]);

  // Rating & Review Feedback Form State
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Voice-to-text input state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
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
      if (recognitionRef.current) recognitionRef.current.abort();

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = speechLanguage;

      rec.onstart = () => setIsListening(true);
      rec.onerror = (event: any) => {
        setSpeechError(event.error === 'not-allowed' ? "Microphone permission denied." : `Voice input error: ${event.error}`);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setBookNotes(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setSpeechError(err?.message || "Failed to initialize microphone.");
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleVoiceInput = () => isListening ? stopVoiceInput() : startVoiceInput();

  const handleAddGuestField = () => {
    if (additionalGuests.length < 15) setAdditionalGuests([...additionalGuests, { name: '', phone: '' }]);
  };

  const handleUpdateGuestField = (index: number, key: 'name' | 'phone', value: string) => {
    const updated = [...additionalGuests];
    updated[index][key] = value;
    setAdditionalGuests(updated);
  };

  const handleRemoveGuestField = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

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

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter;
      const matchesCapacity = room.capacity >= adultsCount;
      return matchesType && matchesCapacity;
    });
  }, [rooms, roomTypeFilter, adultsCount]);

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(b => b.userId === currentUser.uid || b.guestEmail.toLowerCase() === currentUser.email.toLowerCase());
  }, [bookings, currentUser]);

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

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userComment.trim()) return;
    setSubmittingFeedback(true);
    try {
      await submitFeedback(userRating, userComment);
      setUserComment('');
      setUserRating(5);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f4ec] text-[#20242a] relative overflow-y-auto">
      
      {/* 0. Top Utility Bar */}
      <div className="bg-[#f4efe6] border-b border-[#e5dcce] text-[#0e2b33] text-xs py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-6 items-center">
            <a href="tel:01909806960" className="hover:text-[#905e38] flex items-center gap-1.5 font-mono text-[#0e2b33] font-medium">
              <Phone className="w-3 h-3 text-[#905e38]" />
              <span>☏ 01909-806960</span>
            </a>
            <a 
              href="https://wa.me/8801799148408?text=Hello%20Islamia%20Guest%20House" 
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

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#e8e0d2] px-2 py-0.5 rounded text-[10px] border border-[#af8a52]/30 text-[#0e2b33]">
                  <span className="text-[#0e2b33] font-bold">{currentUser.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => toggleRole()}
                className="bg-[#0e2b33] hover:bg-[#905e38] text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
              >
                Sign In →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Navigation Header */}
      <nav className="bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-full bg-[#af8a52] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm">
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

          <ul className="hidden lg:flex gap-8 text-[11px] tracking-widest text-[#0e2b33] uppercase font-bold">
            <li><a href="#destinations" className="hover:text-[#af8a52] transition">Chambers</a></li>
            <li><a href="#philosophy" className="hover:text-[#af8a52] transition">Philosophy</a></li>
            <li><a href="#guest-reviews-section" className="hover:text-[#af8a52] transition">Reviews</a></li>
            <li><a href="#contact-footer" className="hover:text-[#af8a52] transition">Location</a></li>
          </ul>

          <div className="flex items-center gap-3">
            <a href="tel:01909806960" className="p-2 sm:p-2.5 rounded-full bg-slate-100 text-[#0e2b33] border border-slate-200">
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0e2b33] border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-3 text-xs uppercase font-semibold text-[#0e2b33]">
            <a href="#destinations" onClick={() => setMobileMenuOpen(false)}>Chambers &amp; Suites</a>
            <a href="#philosophy" onClick={() => setMobileMenuOpen(false)}>Philosophy</a>
            <a href="#guest-reviews-section" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <a href="#contact-footer" onClick={() => setMobileMenuOpen(false)}>Location</a>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section 
        className="relative h-[360px] sm:h-[450px] bg-cover bg-center flex items-center justify-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1920&q=80')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-3xl sm:text-6xl font-normal tracking-wide">Islamia Guest House</h1>
          <p className="font-serif text-lg sm:text-2xl mt-2 tracking-wider">Dhanmondi, Dhaka</p>
        </div>
      </section>

      {/* 3. Search Bar */}
      <div id="book-section" className="-mt-16 relative z-20 max-w-4xl mx-auto px-4 mb-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            <div className="md:col-span-5 pb-3 md:pb-0 md:pr-4 md:border-r border-slate-200">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">CHECK IN / OUT</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#905e38]" />
                <input
                  type="date"
                  value={searchCheckIn}
                  min={todayStr}
                  onChange={(e) => setSearchCheckIn(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent"
                />
                <span className="text-[#905e38] font-bold">→</span>
                <input
                  type="date"
                  value={searchCheckOut}
                  min={searchCheckIn || todayStr}
                  onChange={(e) => setSearchCheckOut(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent"
                />
              </div>
            </div>

            <div ref={guestPickerRef} className="relative md:col-span-4 pb-3 md:pb-0 md:pr-4 md:border-r border-slate-200">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">ROOMS &amp; GUESTS</label>
              <button
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full flex items-center justify-between text-xs font-bold bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#905e38]" />
                  <span>{roomsCount} Room, {adultsCount + childrenCount} Guests</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#905e38]" />
              </button>

              {showGuestPicker && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-xs font-semibold">Rooms</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))} className="px-2 py-1 bg-slate-100 rounded">-</button>
                      <span className="text-xs font-bold">{roomsCount}</span>
                      <button onClick={() => setRoomsCount(roomsCount + 1)} className="px-2 py-1 bg-slate-100 rounded">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-semibold">Adults</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))} className="px-2 py-1 bg-slate-100 rounded">-</button>
                      <span className="text-xs font-bold">{adultsCount}</span>
                      <button onClick={() => setAdultsCount(adultsCount + 1)} className="px-2 py-1 bg-slate-100 rounded">+</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <a href="#destinations" className="w-full bg-[#905e38] text-white py-3 px-4 rounded-xl font-bold text-xs flex justify-center items-center">
                Search Rooms
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Room Listing Section */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-[#e5dcce] pb-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#0e2b33]">Available Rooms &amp; Suites</h2>
            <p className="text-xs text-[#905e38] mt-1">Select your preferred space for booking</p>
          </div>
          <div className="flex gap-2 text-xs">
            {['all', 'single', 'double', 'suite'].map(type => (
              <button
                key={type}
                onClick={() => setRoomTypeFilter(type as any)}
                className={`px-3 py-1.5 rounded-lg capitalize font-bold transition ${
                  roomTypeFilter === type ? 'bg-[#0e2b33] text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} onBookNow={() => handleOpenBooking(room)} />
          ))}
        </div>
      </section>

      {/* 5. Booking Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative my-8 shadow-2xl">
            <button 
              onClick={() => setSelectedRoom(null)} 
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {!justCompletedBookingId ? (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#0e2b33]">Book {selectedRoom.name}</h3>
                <p className="text-xs text-slate-500">৳{selectedRoom.price.toLocaleString()} / night</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Check-in</label>
                    <input 
                      type="date" 
                      value={bookCheckIn} 
                      min={todayStr}
                      onChange={e => setBookCheckIn(e.target.value)} 
                      className="w-full border rounded-lg p-2"
                      required 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Check-out</label>
                    <input 
                      type="date" 
                      value={bookCheckOut} 
                      min={bookCheckIn}
                      onChange={e => setBookCheckOut(e.target.value)} 
                      className="w-full border rounded-lg p-2"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={bookName} 
                    onChange={e => setBookName(e.target.value)} 
                    className="w-full border rounded-lg p-2" 
                    required 
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={bookEmail} 
                    onChange={e => setBookEmail(e.target.value)} 
                    className="w-full border rounded-lg p-2" 
                    required 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={bookPhone} 
                    onChange={e => setBookPhone(e.target.value)} 
                    className="w-full border rounded-lg p-2" 
                    required 
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs flex justify-between font-bold text-[#0e2b33]">
                  <span>Total ({computedNights} nights):</span>
                  <span>৳{computedTotal.toLocaleString()}</span>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#0e2b33] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#905e38] transition"
                >
                  Confirm Reservation
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-[#0e2b33]">Booking Confirmed!</h3>
                <p className="text-xs text-slate-600">Your reservation has been completed successfully.</p>
                <button 
                  onClick={() => setSelectedRoom(null)} 
                  className="bg-[#0e2b33] text-white px-6 py-2 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Footer Section */}
      <footer id="contact-footer" className="bg-[#0e2b33] text-white py-12 px-4 sm:px-8 mt-20 border-t border-[#af8a52]/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#af8a52] mb-3">Islamia Guest House</h4>
            <p className="text-slate-300 leading-relaxed">Providing comfortable &amp; serene stays in Dhanmondi with unmatched hospitality.</p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold text-[#af8a52] mb-3">Contact Information</h4>
            <p className="text-slate-300">House #12, Road #8, Dhanmondi, Dhaka</p>
            <p className="text-slate-300 mt-2">Phone: 01909-806960</p>
            <p className="text-slate-300">bKash: 01832-841818</p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold text-[#af8a52] mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#destinations" className="hover:underline">Rooms &amp; Rates</a></li>
              <li><a href="#book-section" className="hover:underline">Online Booking</a></li>
              <li><a href="https://wa.me/8801799148408" target="_blank" rel="noreferrer" className="hover:underline">WhatsApp Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-[11px]">
          © {new Date().getFullYear()} Islamia Guest House. All Rights Reserved.
        </div>
      </footer>

    </div>
  );
};
