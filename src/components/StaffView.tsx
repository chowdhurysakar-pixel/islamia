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
  CreditCard, History, User, Check, X, ShieldCheck, Settings, Lock, Trash2, Download, FileSpreadsheet, Loader2,
  Calendar, RotateCcw, DollarSign, Users, ArrowUpDown
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    archivedBookings,
    serviceRequests, 
    addRoom, 
    updateRoomStatus, 
    editRoomDetails,
    deleteRoom,
    createBooking,
    updateBookingStatus, 
    checkOutGuest,
    updateServiceRequestStatus,
    opMode,
    setOpMode,
    showToast
  } = useApp();

  // Async Action Loading States
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);

  // Active logs search and states
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<ServiceRequestStatus | 'all'>('all');
  const [hrSelectedDate, setHrSelectedDate] = useState<string>('');

  // HR Searchable Guest History States
  const [guestHistoryPhoneSearch, setGuestHistoryPhoneSearch] = useState<string>('');
  const [selectedHistoryGuestPhone, setSelectedHistoryGuestPhone] = useState<string>('');

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
  const [autoPrintInvoice, setAutoPrintInvoice] = useState<boolean>(false);
  const [selectedRoomToManage, setSelectedRoomToManage] = useState<Room | null>(null);

  // HR Manager Gate Passcode Protection States
  const [isHrPasscodeModalOpen, setIsHrPasscodeModalOpen] = useState<boolean>(false);
  const [hrPasscodeInput, setHrPasscodeInput] = useState<string>('');
  const [hrPasscodeError, setHrPasscodeError] = useState<string>('');

  // Room tracking edit states (money pricing, numbers, capacities, and statuses)
  const [editRoomNumber, setEditRoomNumber] = useState<string>('');
  const [editRoomType, setEditRoomType] = useState<RoomType>('single');
  const [editRoomPrice, setEditRoomPrice] = useState<number>(0);
  const [editRoomCapacity, setEditRoomCapacity] = useState<number>(1);
  const [editRoomStatus, setEditRoomStatus] = useState<RoomStatus>('available');
  const [editRoomDescription, setEditRoomDescription] = useState<string>('');
  const [editRoomAmenities, setEditRoomAmenities] = useState<string[]>([]);
  const [editRoomImages, setEditRoomImages] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState<string>('');
  const [newImage, setNewImage] = useState<string>('');

  React.useEffect(() => {
    if (selectedRoomToManage) {
      setEditRoomNumber(selectedRoomToManage.number);
      setEditRoomType(selectedRoomToManage.type);
      setEditRoomPrice(selectedRoomToManage.price);
      setEditRoomCapacity(selectedRoomToManage.capacity);
      setEditRoomStatus(selectedRoomToManage.status);
      setEditRoomDescription(selectedRoomToManage.description || '');
      setEditRoomAmenities(selectedRoomToManage.amenities || []);
      setEditRoomImages(selectedRoomToManage.images || (selectedRoomToManage.image ? [selectedRoomToManage.image] : []));
      setNewAmenity('');
      setNewImage('');
    }
  }, [selectedRoomToManage]);

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
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const trimmedNo = newRoomNo.trim();
    if (!trimmedNo) return;
    
    const finalPrice = Number(newRoomPrice) || 0;
    const finalCapacity = Number(newRoomCapacity) || 1;
    const existingRoom = rooms.find(r => r.number === trimmedNo || r.id === trimmedNo);

    try {
      if (existingRoom) {
        await editRoomDetails(existingRoom.id, {
          number: trimmedNo,
          type: newRoomType,
          price: finalPrice,
          capacity: finalCapacity,
          description: newRoomDescription || existingRoom.description,
        });
        showToast({
          type: 'success',
          message: `🏨 Chamber #${trimmedNo} updated with rate ৳${finalPrice.toLocaleString()}/night!`
        });
      } else {
        await addRoom({
          number: trimmedNo,
          type: newRoomType,
          price: finalPrice,
          capacity: finalCapacity,
          description: newRoomDescription || `${newRoomType.toUpperCase()} Suite featuring high speed Wi-Fi and modern amenities.`,
          image: newRoomImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
          status: 'available',
          amenities: ['Wi-Fi', 'Air Conditioning', 'LED TV', 'Bathroom En-suite']
        });

        showToast({
          type: 'success',
          message: `🏨 New Chamber #${trimmedNo} saved with rate ৳${finalPrice.toLocaleString()}/night!`
        });
      }
    } catch (err) {
      console.warn("Notice saving chamber:", err);
      showToast({
        type: 'success',
        message: `🏨 Chamber #${trimmedNo} saved locally with rate ৳${finalPrice.toLocaleString()}/night!`
      });
    }

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

    // 1. Validate customer name
    if (!posCustomerName.trim()) {
      showToast({ type: 'error', message: "⚠️ Please enter the Customer's Full Name." });
      document.getElementById("pos-guest-name-input")?.focus();
      return;
    }

    // 2. Validate customer phone
    if (!posCustomerPhone.trim()) {
      showToast({ type: 'error', message: "⚠️ Please enter the Customer Phone Number." });
      document.getElementById("pos-guest-phone-input")?.focus();
      return;
    }

    // 3. Validate dates
    if (posCheckIn && posCheckOut && new Date(posCheckOut) <= new Date(posCheckIn)) {
      showToast({ type: 'error', message: "⚠️ Check-Out date must be after Check-In date." });
      return;
    }

    // 4. Chamber Selection
    let selectedRoomIdToUse = posSelectedRoomId;
    if (!selectedRoomIdToUse) {
      const avail = rooms.find(r => r.status === 'available');
      if (avail) {
        selectedRoomIdToUse = avail.id;
      } else if (rooms[0]) {
        selectedRoomIdToUse = rooms[0].id;
      } else {
        showToast({ type: 'error', message: "⚠️ No chambers available in the system." });
        return;
      }
    }

    const targetRoom = rooms.find(r => r.id === selectedRoomIdToUse);
    if (!targetRoom) {
      showToast({ type: 'error', message: "⚠️ Selected chamber could not be found. Please pick a room." });
      return;
    }

    const nights = calcNights(posCheckIn, posCheckOut);
    const validNights = nights > 0 ? nights : 1;
    const finalBill = posCustomBill ? Number(posCustomBill) : (calculatedBasePrice || (targetRoom.price * validNights));

    try {
      const gList = receptionistGuests.filter(g => g.name.trim() !== '');
      const kList = receptionistKids.filter(k => k.name.trim() !== '');
      const generatedRef = await createBooking({
        roomId: selectedRoomIdToUse,
        roomNumber: targetRoom.number,
        roomType: targetRoom.type,
        guestName: posCustomerName.trim(),
        guestEmail: `${posCustomerName.trim().toLowerCase().replace(/\s+/g, '')}@islamiaguesthouse.com`,
        guestPhone: posCustomerPhone.trim(),
        nidNumber: posCustomerNid.trim() || 'Not Specified',
        upazila: posCustomerUpazila.trim() || 'Dhanmondi',
        zila: posCustomerZila.trim() || 'Dhanmondi',
        checkIn: posCheckIn,
        checkOut: posCheckOut,
        totalAmount: finalBill,
        status: 'checked-in',
        notes: `Checked in directly via front-desk guest registration desk at Dhanmondi.`,
        additionalGuests: gList,
        referenceName: posReferenceName.trim() || '',
        kids: kList
      });

      const finalBookingItem: Booking = {
        id: generatedRef || `B${Date.now().toString().slice(-4)}`,
        roomId: selectedRoomIdToUse,
        roomNumber: targetRoom.number,
        roomType: targetRoom.type,
        guestName: posCustomerName.trim(),
        guestEmail: `${posCustomerName.trim().toLowerCase().replace(/\s+/g, '')}@islamiaguesthouse.com`,
        guestPhone: posCustomerPhone.trim(),
        nidNumber: posCustomerNid.trim() || 'Not Provided',
        upazila: posCustomerUpazila.trim() || 'Dhanmondi',
        zila: posCustomerZila.trim() || 'Dhanmondi',
        checkIn: posCheckIn,
        checkOut: posCheckOut,
        totalAmount: finalBill,
        status: 'checked-in',
        notes: 'Checked in directly via front-desk guest registration desk.',
        additionalGuests: gList,
        referenceName: posReferenceName.trim() || '',
        kids: kList,
        createdAt: new Date().toISOString()
      };

      setInvoiceBooking(finalBookingItem);
      setShowBillModal(true);

      showToast({
        type: 'success',
        message: `🎟️ Checkout booking created & invoice generated for ${posCustomerName.trim()} in Chamber ${targetRoom.number}!`
      });

      // Clear form fields
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
    } catch (err: any) {
      console.error("POS Booking error:", err);
      showToast({
        type: 'error',
        message: `❌ Failed to create booking: ${err?.message || 'Unknown error'}`
      });
    }
  };

  // Launch Invoice Modal for any given row/booking
  const openInvoiceForBooking = (bookingItem: Booking, autoPrint: boolean = false) => {
    setAutoPrintInvoice(autoPrint);
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

  // Combined bookings from live state & archived historical storage
  const allCombinedBookings = useMemo(() => {
    const map = new Map<string, Booking>();
    bookings.forEach(b => map.set(b.id, b));
    (archivedBookings || []).forEach(b => {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      } else {
        map.set(b.id, { ...map.get(b.id)!, ...b });
      }
    });
    return Array.from(map.values());
  }, [bookings, archivedBookings]);

  // Filter Active / Historical bookings for Receptionist & HR Master Guest Ledger
  const filteredBookings = useMemo(() => {
    return allCombinedBookings.filter(booking => {
      if (opMode === 'receptionist' && booking.status === 'checked-out' && bookingStatusFilter !== 'all' && bookingStatusFilter !== 'checked-out' && !hrSelectedDate) {
        return false;
      }

      const matchStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
      
      const searchLower = bookingSearch.toLowerCase().trim();
      const matchSearch = 
        !searchLower ||
        (booking.guestName && booking.guestName.toLowerCase().includes(searchLower)) ||
        (booking.guestPhone && booking.guestPhone.includes(searchLower)) ||
        (booking.id && booking.id.toLowerCase().includes(searchLower)) ||
        (booking.roomId && booking.roomId.toLowerCase().includes(searchLower)) ||
        (booking.roomNumber && booking.roomNumber.toLowerCase().includes(searchLower)) ||
        (booking.nidNumber && booking.nidNumber.includes(searchLower)) ||
        (booking.zila && booking.zila.toLowerCase().includes(searchLower)) ||
        (booking.zilaDistrict && booking.zilaDistrict.toLowerCase().includes(searchLower));

      let matchDate = true;
      if (hrSelectedDate) {
        const cin = booking.checkIn || booking.checkInDate || '';
        const cout = booking.checkOut || booking.checkOutDate || cin;

        const inRange = Boolean(cin && cout && cin <= hrSelectedDate && cout >= hrSelectedDate);
        const isCin = cin === hrSelectedDate;
        const isCout = cout === hrSelectedDate;
        const isCheckedOutAt = Boolean(booking.checkedOutAt && booking.checkedOutAt.startsWith(hrSelectedDate));
        const isCreatedAt = Boolean(booking.createdAt && booking.createdAt.startsWith(hrSelectedDate));

        matchDate = inRange || isCin || isCout || isCheckedOutAt || isCreatedAt;
      }

      return matchStatus && matchSearch && matchDate;
    });
  }, [allCombinedBookings, bookingSearch, bookingStatusFilter, opMode, hrSelectedDate]);

  // Daily Summary Metrics for HR & Staff Ledger
  const hrDailyMetrics = useMemo(() => {
    let totalGuests = 0;
    let totalRevenue = 0;
    let checkInsCount = 0;
    let checkOutsCount = 0;

    filteredBookings.forEach(b => {
      const guests = 
        (b.adultsCount || b.adults || 0) + 
        (b.kidsCount || b.children || 0) + 
        (b.additionalGuests?.length || 0) || 
        b.guestCount || 
        1;
      totalGuests += guests;

      const rev = b.finalBillAmount ?? b.paidAmount ?? b.totalAmount ?? 0;
      totalRevenue += rev;

      const cin = b.checkIn || b.checkInDate || '';
      const cout = b.checkOut || b.checkOutDate || cin;

      if (hrSelectedDate) {
        if (cin === hrSelectedDate) checkInsCount++;
        if (cout === hrSelectedDate || (b.checkedOutAt && b.checkedOutAt.startsWith(hrSelectedDate))) checkOutsCount++;
      } else {
        if (b.status === 'checked-in') checkInsCount++;
        if (b.status === 'checked-out') checkOutsCount++;
      }
    });

    return { totalGuests, totalRevenue, checkInsCount, checkOutsCount };
  }, [filteredBookings, hrSelectedDate]);

  // HR Archival Only Customer Database List
  const hrHistoricalBookings = useMemo(() => {
    // Show only checked-out, cancelled, or general stays list historical records
    return bookings.filter(b => b.status === 'checked-out' || b.status === 'cancelled');
  }, [bookings]);

  // HR Chronological Guest Stay History Lookup
  const guestHistoryBookings = useMemo(() => {
    if (!selectedHistoryGuestPhone) return [];
    const searchVal = selectedHistoryGuestPhone.trim();
    if (!searchVal) return [];
    
    return bookings
      .filter(b => {
        const phone = b.guestPhone || '';
        const matchesMainPhone = phone.replace(/[^0-9]/g, '').includes(searchVal.replace(/[^0-9]/g, ''));
        const matchesAdditional = b.additionalGuests?.some(g => 
          g.phone?.replace(/[^0-9]/g, '').includes(searchVal.replace(/[^0-9]/g, ''))
        ) || false;
        return matchesMainPhone || matchesAdditional;
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  }, [bookings, selectedHistoryGuestPhone]);

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

  // Export guest logs to CSV format for offline record keeping
  const exportGuestLogsToCSV = (dataToExport: Booking[], filenamePrefix = 'HR_Historical_Guest_Archives') => {
    if (!dataToExport || dataToExport.length === 0) {
      showToast({
        type: 'warning',
        message: '⚠️ No guest records available to export.'
      });
      return;
    }

    const headers = [
      'Booking ID',
      'Guest Name',
      'Phone Number',
      'Email Address',
      'NID Number',
      'Chamber Number',
      'Room Type',
      'Check In Date',
      'Check Out Date',
      'Booking Status',
      'District (Zila)',
      'Sub-District (Upazila)',
      'Reference Name',
      'Additional Guests',
      'Kids',
      'Total Amount (BDT)',
      'Created Date',
      'Notes & Incidents'
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = dataToExport.map(b => {
      const extraGuestsStr = b.additionalGuests?.map(g => `${g.name}${g.phone ? ' (' + g.phone + ')' : ''}`).join('; ') || 'None';
      const kidsStr = b.kids?.map(k => `${k.name}${k.age ? ' (' + k.age + 'y)' : ''}`).join('; ') || 'None';

      return [
        escapeCSV(b.id),
        escapeCSV(b.guestName),
        escapeCSV(b.guestPhone),
        escapeCSV(b.guestEmail || ''),
        escapeCSV(b.nidNumber || ''),
        escapeCSV(b.roomNumber || b.roomId),
        escapeCSV(b.roomType || ''),
        escapeCSV(b.checkIn),
        escapeCSV(b.checkOut),
        escapeCSV(b.status),
        escapeCSV(b.zila || ''),
        escapeCSV(b.upazila || ''),
        escapeCSV(b.referenceName || ''),
        escapeCSV(extraGuestsStr),
        escapeCSV(kidsStr),
        escapeCSV(b.totalAmount || 0),
        escapeCSV(b.createdAt ? new Date(b.createdAt).toLocaleString() : ''),
        escapeCSV(b.notes || '')
      ].join(',');
    });

    const csvData = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      message: `📥 Exported ${dataToExport.length} guest logs to CSV file successfully!`
    });
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
            onClick={() => {
              if (opMode === 'hr') {
                // Already in HR mode
              } else {
                setHrPasscodeInput('');
                setHrPasscodeError('');
                setIsHrPasscodeModalOpen(true);
              }
            }}
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
                <label className="text-[10px] font-bold text-slate-500 uppercase">Night Price (৳ BDT)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newRoomPrice || ''}
                  onChange={(e) => setNewRoomPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="e.g. 2500"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-teal-700"
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
                  id="save-chamber-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-black cursor-pointer transition"
                >
                  Save Chamber
                </button>
              </div>
            </form>
          )}

          {/* Visual Interactive Map List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {rooms.map(room => (
              <div
                key={room.id}
                id={`room-btn-${room.id}`}
                onClick={() => triggerDeskFromRoom(room)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[100px] active:scale-95 group cursor-pointer ${
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
                      ৳{room.price} / night
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
              </div>
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

          <form noValidate onSubmit={handleDeskBookingSubmit} className="space-y-3.5">
            {/* Room Selection Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Select Chamber / Room *</label>
              <select
                id="pos-room-select-dropdown"
                value={posSelectedRoomId}
                onChange={(e) => setPosSelectedRoomId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white font-serif font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">-- Click a Room Left or Choose Here --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Chamber {r.number} ({r.type.toUpperCase()}) - ৳{r.price}/night [{r.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

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
                    ৳{selectedRoomDetails.price}/Night
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
                  placeholder="e.g. Dhanmondi"
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
                placeholder={selectedRoomDetails ? `Auto BDT Subtotal: ৳${calculatedBasePrice}` : "Select Room..."}
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
              className="w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition uppercase flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 active:scale-95 cursor-pointer"
            >
              <TicketPlus className="w-4 h-4" />
              <span>Checkout Booking</span>
            </button>
          </form>
        </div>
      </div>

      {/* HR Guest View & Room Media Customizer (DEDICATED PANEL FOR MANAGING PICTURES AND AMENITIES) */}
      {opMode === 'hr' && (
        <div id="hr-room-media-customizer" className="bg-white rounded-3xl border border-amber-200/70 p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-4">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-5.5 h-5.5 text-amber-600 animate-pulse" />
                HR Guest View Content & Media Customizer
              </h3>
              <p className="text-xs text-slate-500">
                Directly customize the guest reservation portal. Update picture galleries, edit marketing descriptions, and manage amenity tags in real-time.
              </p>
            </div>
            <div className="bg-amber-50 text-amber-800 text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-wider shrink-0">
              {rooms.length} Chambers Configured
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => {
              const galleryCount = room.images?.length || (room.image ? 1 : 0);
              return (
                <div 
                  key={room.id} 
                  id={`hr-media-card-${room.id}`}
                  className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-4.5 space-y-4 transition-all duration-300 flex flex-col justify-between group/card hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                          Chamber {room.number}
                        </span>
                        <h4 className="text-xs font-serif font-bold text-slate-800 capitalize mt-2">{room.type} Bed</h4>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-teal-800 bg-teal-50/50 border border-teal-100 px-2.5 py-1 rounded-lg">
                        <span>৳{room.price}/night</span>
                      </div>
                    </div>

                    {/* Thumbnail preview of current pictures */}
                    <div className="relative h-28 rounded-xl overflow-hidden bg-slate-200 border border-slate-150 shadow-inner group/img">
                      <img
                        src={room.images?.[0] || room.image}
                        alt={`Room ${room.number} preview`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-sm">
                        <span>{galleryCount} Pictures</span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Description (Guest View)</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed italic bg-white p-2 rounded-xl border border-slate-150/50">
                        "{room.description || 'No description written yet.'}"
                      </p>
                    </div>

                    {/* Amenities list tags */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Amenity Tags ({room.amenities.length})</span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-0.5">
                        {room.amenities.map((amenity, aIdx) => (
                          <span key={aIdx} className="text-[9px] bg-white text-slate-600 font-sans px-1.5 py-0.5 rounded border border-slate-150 shadow-3xs hover:border-amber-300 transition-colors">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`hr-edit-media-btn-${room.id}`}
                    onClick={() => {
                      setSelectedRoomToManage(room);
                    }}
                    className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/10 active:scale-[0.98] cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-200" />
                    <span>Manage Gallery & Amenities</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HR Chronological Guest History Tracker Section (Only visible in HR Mode) */}
      {opMode === 'hr' && (
        <div id="hr-guest-history-tracker" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 animate-fadeIn">
          
          {/* Header block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-teal-400 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                HR Guest Chronological History Audit Tracker
              </h3>
              <p className="text-xs text-slate-400">
                Search and audit the full timeline of past check-ins and check-outs for a specific guest using their contact number.
              </p>
            </div>
            
            {/* Quick Helper contacts tags for easy demonstration/testing */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500 font-mono">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  setGuestHistoryPhoneSearch('+1 (555) 321-9876');
                  setSelectedHistoryGuestPhone('+1 (555) 321-9876');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[9px] px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                +1 (555) 321-9876
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuestHistoryPhoneSearch('+1 (555) 789-1234');
                  setSelectedHistoryGuestPhone('+1 (555) 789-1234');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[9px] px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                +1 (555) 789-1234
              </button>
            </div>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 shrink-0">
                <Search className="w-4 h-4 text-slate-500" />
              </span>
              <input
                id="hr-history-phone-search-input"
                type="text"
                placeholder="Enter guest contact/phone number (e.g. 01712xxxxxx or +1)..."
                value={guestHistoryPhoneSearch}
                onChange={(e) => setGuestHistoryPhoneSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedHistoryGuestPhone(guestHistoryPhoneSearch);
                  }
                }}
                className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none text-white font-mono placeholder:text-slate-600"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                id="hr-history-search-btn"
                type="button"
                onClick={() => setSelectedHistoryGuestPhone(guestHistoryPhoneSearch)}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition uppercase tracking-wider font-mono shrink-0 cursor-pointer"
              >
                Trace History
              </button>
              
              {selectedHistoryGuestPhone && (
                <button
                  id="hr-history-clear-btn"
                  type="button"
                  onClick={() => {
                    setGuestHistoryPhoneSearch('');
                    setSelectedHistoryGuestPhone('');
                  }}
                  className="px-4 py-3 border border-slate-850 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl text-xs font-semibold transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Search Results Visual Layout */}
          {selectedHistoryGuestPhone ? (
            <div className="space-y-4 animate-fadeIn">
              {guestHistoryBookings.length > 0 ? (
                <div className="space-y-5">
                  
                  {/* Stats summary of guest history with CSV Export */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Verified Guest Name</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-4 h-4 text-teal-400" />
                          {guestHistoryBookings[guestHistoryBookings.length - 1].guestName}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Stays Tracked</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <History className="w-4 h-4 text-teal-400" />
                          {guestHistoryBookings.length} Times
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Lifetime Billed Revenue</span>
                        <span className="text-sm font-bold text-teal-400 font-mono">
                          ৳{guestHistoryBookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString()} BDT
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="export-single-guest-history-csv-btn"
                      onClick={() => exportGuestLogsToCSV(guestHistoryBookings, `Guest_History_${guestHistoryBookings[0]?.guestName?.replace(/\s+/g, '_') || 'Logs'}`)}
                      className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                      title="Download guest stay timeline to CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Timeline to CSV</span>
                    </button>
                  </div>

                  {/* Chronological Vertical Timeline */}
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-y-1 before:left-2.5 before:w-0.5 before:bg-slate-800">
                    {guestHistoryBookings.map((b, idx) => {
                      return (
                        <div key={b.id} className="relative group animate-slideIn">
                          
                          {/* Timeline node icon */}
                          <div className={`absolute left-[-21px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-950 flex items-center justify-center transition-colors ${
                            b.status === 'checked-out' ? 'bg-slate-500 ring-4 ring-slate-900' :
                            b.status === 'checked-in' ? 'bg-emerald-500 ring-4 ring-emerald-950/40' :
                            b.status === 'confirmed' ? 'bg-sky-500 ring-4 ring-sky-950/40' : 'bg-rose-500'
                          }`} />

                          {/* Timeline Card */}
                          <div className="bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl space-y-3 transition-all duration-200">
                            
                            {/* Card top row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-white">#{b.id}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-xs font-serif font-bold text-teal-400">Suite {b.roomNumber || b.roomId}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400">{b.roomType}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded ${
                                  b.status === 'checked-out' ? 'bg-slate-800 text-slate-400' :
                                  b.status === 'checked-in' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                                  b.status === 'confirmed' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' : 'bg-rose-950 text-rose-400'
                                }`}>
                                  {b.status}
                                </span>
                                <span className="text-xs font-mono text-slate-400 font-bold">
                                  ৳{b.totalAmount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openInvoiceForBooking(b, false)}
                                  className="ml-2 px-2 py-0.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 rounded text-[9px] font-bold font-mono transition inline-flex items-center gap-1 border border-teal-500/30"
                                >
                                  <Receipt className="w-2.5 h-2.5" />
                                  <span>Show Bill</span>
                                </button>
                              </div>
                            </div>

                            {/* Stay Span dates */}
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-500 uppercase font-mono">Check In Date</span>
                                <p className="font-semibold text-white">{b.checkIn}</p>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-500 uppercase font-mono">Check Out Date</span>
                                <p className="font-semibold text-white">{b.checkOut}</p>
                              </div>
                            </div>

                            {/* Notes or incident log */}
                            {b.notes && (
                              <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-900 leading-relaxed">
                                "{b.notes}"
                              </p>
                            )}

                            {/* Additional Guests and children registry tags inside this stay */}
                            {((b.additionalGuests && b.additionalGuests.length > 0) || (b.kids && b.kids.length > 0)) && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {b.additionalGuests?.map((guest, gIdx) => (
                                  <span key={gIdx} className="text-[9px] bg-slate-950 text-slate-400 font-sans px-2 py-0.5 rounded-lg border border-slate-900">
                                    Extra Guest: {guest.name} ({guest.phone})
                                  </span>
                                ))}
                                {b.kids?.map((kid, kIdx) => (
                                  <span key={kIdx} className="text-[9px] bg-sky-950/20 text-sky-400 font-sans px-2 py-0.5 rounded-lg border border-sky-900/20">
                                    Child: {kid.name} ({kid.age}y)
                                  </span>
                                ))}
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <p>
                    No past stay records found for contact number: <span className="text-white font-mono font-bold">"{selectedHistoryGuestPhone}"</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal">
                    Check if the phone matches exactly, or trace check-ins by searching '01712' or '555'.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              <span>Enter a guest phone number above and click "Trace History" to inspect stay timelines.</span>
            </div>
          )}

        </div>
      )}

      {/* 4. Active Logs Views & HR Customers Archives */}
      <div className="space-y-6">
        
        {/* Active stays list & Guest log history */}
        <div className="w-full space-y-6">
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

              {/* Controls & Export to CSV button */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  id="hr-export-csv-btn"
                  onClick={() => exportGuestLogsToCSV(filteredBookings, opMode === 'hr' ? 'HR_Historical_Guest_Archives' : 'FrontDesk_Reception_Logs')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  title="Export guest logs to CSV file for offline record keeping"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Export to CSV</span>
                </button>

                {/* Date Picker Filter for Day-by-Day Guest History */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 focus-within:border-teal-500">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <input
                    type="date"
                    id="hr-ledger-date-picker"
                    value={hrSelectedDate}
                    onChange={(e) => setHrSelectedDate(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                    title="Filter guest history by specific date"
                  />
                </div>

                {/* Reset Date Button */}
                {hrSelectedDate && (
                  <button
                    type="button"
                    id="hr-ledger-date-reset-btn"
                    onClick={() => setHrSelectedDate('')}
                    className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    title="Clear date filter to view all history"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-600" />
                    <span>রিসেট (Reset Date)</span>
                  </button>
                )}

                {opMode !== 'hr' && (
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
                )}
              </div>
            </div>

            {/* DAILY REPORT SUMMARY BAR FOR HR / FRONT DESK */}
            <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 border border-teal-800/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-200 flex items-center gap-2">
                    <span>দিনভিত্তিক রিপোর্ট সামারি (Day-by-Day Summary)</span>
                    {hrSelectedDate ? (
                      <span className="px-2.5 py-0.5 bg-teal-500/25 text-teal-300 rounded-full text-[10px] font-mono border border-teal-500/40 font-bold">
                        📅 {hrSelectedDate}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px]">
                        সকল ইতিহাস (All History)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {hrSelectedDate 
                      ? `${hrSelectedDate} তারিখের গেস্ট সংখ্যা, মোট অর্জিত রেভিনিউ এবং চেক-ইন/আউট সংখ্যা` 
                      : 'নির্দিষ্ট তারিখ নির্বাচন করে ওই দিনের গেস্ট হিস্ট্রি ও রিপোর্ট সামারি দেখুন।'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Metric 1: Total Guests */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">মোট গেস্ট (Total Guests)</p>
                    <p className="text-xs font-bold font-mono text-white">{hrDailyMetrics.totalGuests} জন</p>
                  </div>
                </div>

                {/* Metric 2: Total Revenue / Collections */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">মোট অর্জিত রেভিনিউ</p>
                    <p className="text-xs font-bold font-mono text-emerald-300">৳{hrDailyMetrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Metric 3: Total Check-Ins & Check-Outs */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <ArrowUpDown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">চেক-ইন / চেক-আউট</p>
                    <p className="text-xs font-bold font-mono text-amber-200">
                      📥 {hrDailyMetrics.checkInsCount} চেক-ইন | 📤 {hrDailyMetrics.checkOutsCount} চেক-আউট
                    </p>
                  </div>
                </div>
              </div>
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
                            ৳{booking.totalAmount}
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
                              disabled={loadingBookingId === booking.id}
                              onClick={async () => {
                                setLoadingBookingId(booking.id);
                                try {
                                  await updateBookingStatus(booking.id, 'checked-in');
                                } catch (e) {
                                  console.error("Check-in error:", e);
                                } finally {
                                  setLoadingBookingId(null);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {loadingBookingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check In'}
                            </button>
                          )}
                          {booking.status === 'checked-in' && (
                            <button
                              id={`check-out-btn-${booking.id}`}
                              disabled={loadingBookingId === booking.id}
                              onClick={async () => {
                                setLoadingBookingId(booking.id);
                                try {
                                  await updateBookingStatus(booking.id, 'checked-out');
                                  openInvoiceForBooking({ ...booking, status: 'checked-out' }, false);
                                } catch (e) {
                                  console.error("Check-out error:", e);
                                } finally {
                                  setLoadingBookingId(null);
                                }
                              }}
                              className="px-2 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px] hover:bg-rose-700 transition disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {loadingBookingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check Out & Bill'}
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <button
                              id={`void-btn-${booking.id}`}
                              disabled={loadingBookingId === booking.id}
                              onClick={async () => {
                                setLoadingBookingId(booking.id);
                                try {
                                  await updateBookingStatus(booking.id, 'cancelled');
                                } catch (e) {
                                  console.error("Void error:", e);
                                } finally {
                                  setLoadingBookingId(null);
                                }
                              }}
                              className="px-2 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg font-semibold text-[10px] transition ml-1 disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {loadingBookingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Void'}
                            </button>
                          )}
                          <button
                            id={`show-bill-row-btn-${booking.id}`}
                            onClick={() => openInvoiceForBooking(booking, false)}
                            className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-bold text-[10px] font-mono transition inline-flex items-center gap-1 border border-teal-150 ml-1"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Show Bill</span>
                          </button>
                          <button
                            id={`direct-print-row-btn-${booking.id}`}
                            onClick={() => openInvoiceForBooking(booking, true)}
                            className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[10px] font-mono transition inline-flex items-center gap-1 border border-amber-150 ml-1"
                            title="Trigger automated browser print immediately"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Direct Print</span>
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

      </div>

      {/* 5. DEDICATED PRINTABLE INVOICE COMPONENT (Thermal & Standard Layouts) */}
      {showBillModal && invoiceBooking && (
        <PrintableInvoice 
          booking={invoiceBooking}
          rooms={rooms}
          onClose={() => setShowBillModal(false)}
          autoPrint={autoPrintInvoice}
        />
      )}

      {/* 6. ROOM STATUS, PRICING & CHAMBER DUTY SETTINGS MANAGER */}
      {selectedRoomToManage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-800">
                    Chamber Settings & Status Tracker
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                    Room {selectedRoomToManage.number} • {selectedRoomToManage.type}
                  </p>
                </div>
              </div>
              <button
                id="close-status-manager-btn"
                onClick={() => {
                  const num = selectedRoomToManage.number;
                  setSelectedRoomToManage(null);
                  showToast({
                    type: 'info',
                    message: `ℹ️ Chamber #${num} settings closed.`
                  });
                }}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-lg shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* If chamber is occupied, show prominent quick Checkout & Show Bill Banner */}
              {selectedRoomToManage.status === 'occupied' && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-700 block font-mono">Currently Occupied</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {bookings.find(b => b.roomId === selectedRoomToManage.id && b.status === 'checked-in')?.guestName ? 
                        `Guest: ${bookings.find(b => b.roomId === selectedRoomToManage.id && b.status === 'checked-in')?.guestName}` : 
                        `Chamber #${selectedRoomToManage.number}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="modal-checkout-and-bill-btn"
                    onClick={async () => {
                      const activeBookingForRoom = bookings.find(b => b.roomId === selectedRoomToManage.id && b.status === 'checked-in');
                      if (activeBookingForRoom) {
                        await updateBookingStatus(activeBookingForRoom.id, 'checked-out');
                        openInvoiceForBooking({ ...activeBookingForRoom, status: 'checked-out' }, false);
                      } else {
                        await updateRoomStatus(selectedRoomToManage.id, 'cleaning');
                      }
                      setSelectedRoomToManage(null);
                    }}
                    className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Checkout & Show Bill</span>
                  </button>
                </div>
              )}
              
              {/* Settings Fields: Room details, capacity, and PRICE (Money edit!) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block font-bold">Chamber & Tracker Settings</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Room Number</label>
                    <input
                      id="edit-room-number-input"
                      type="text"
                      value={editRoomNumber}
                      onChange={(e) => setEditRoomNumber(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white font-mono"
                    />
                  </div>

                  {/* Money Editing Option */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Nightly Price (৳ BDT)</label>
                    <input
                      id="edit-room-price-input"
                      type="number"
                      min="0"
                      value={editRoomPrice || ''}
                      onChange={(e) => setEditRoomPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="e.g. 2500"
                      className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white font-mono font-bold text-teal-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Room Type</label>
                    <select
                      id="edit-room-type-select"
                      value={editRoomType}
                      onChange={(e) => setEditRoomType(e.target.value as RoomType)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white font-medium"
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="deluxe">Deluxe</option>
                      <option value="suite">Suite</option>
                      <option value="family">Family Suite</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Capacity (Persons)</label>
                    <input
                      id="edit-room-capacity-input"
                      type="number"
                      min={1}
                      max={10}
                      value={editRoomCapacity}
                      onChange={(e) => setEditRoomCapacity(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status Selector Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Select Tracker Status
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'available', name: 'Available (Ready)', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-800 bg-emerald-50/20', dotColor: 'bg-emerald-500', desc: 'Ready for passenger check-in' },
                    { id: 'occupied', name: 'Occupied', color: 'border-rose-200 hover:bg-rose-50 text-rose-800 bg-rose-50/20', dotColor: 'bg-rose-500', desc: 'Currently checked-in guests inside' },
                    { id: 'cleaning', name: 'Cleaning (Duty)', color: 'border-amber-200 hover:bg-amber-50 text-amber-800 bg-amber-50/20', dotColor: 'bg-amber-400', desc: 'Chamber duty / vacuum & stock' },
                    { id: 'maintenance', name: 'Maintenance', color: 'border-slate-200 hover:bg-slate-50 text-slate-850 bg-slate-50/20', dotColor: 'bg-slate-400', desc: 'Engineering repairs / offline' }
                  ].map((opt) => {
                    const isSelected = editRoomStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`status-selector-btn-${opt.id}`}
                        type="button"
                        onClick={() => setEditRoomStatus(opt.id as RoomStatus)}
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

              {/* HR Content Manager - Description, Amenities and Pictures */}
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/85 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-amber-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-mono">
                    HR Manager Content Control
                  </span>
                </div>

                {/* 1. Description Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block font-mono">
                    Room Description (Guest View)
                  </label>
                  <textarea
                    rows={4}
                    value={editRoomDescription}
                    onChange={(e) => setEditRoomDescription(e.target.value)}
                    placeholder="Enter description for guest view..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                  />
                </div>

                {/* 2. Pictures Gallery Management */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block font-mono">
                      Guest View Picture Gallery
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">
                      ({editRoomImages.length} pictures)
                    </span>
                  </div>

                  {/* Picture Thumbnails */}
                  {editRoomImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {editRoomImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img src={img} alt={`Room picture ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setEditRoomImages(editRoomImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-700 transition shadow-sm"
                            title="Remove Picture"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic text-center py-2 bg-white rounded-xl border border-dashed border-slate-200">
                      No pictures in gallery. Add one below.
                    </div>
                  )}

                  {/* Add Picture Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 text-[11px] border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImage.trim()) {
                          setEditRoomImages([...editRoomImages, newImage.trim()]);
                          setNewImage('');
                        }
                      }}
                      className="px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Premium Image Presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Presets (Click to add):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Cozy Retreater', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Queen Bed Suite', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Executive Suite', url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80' },
                        { label: 'Rain Shower', url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (!editRoomImages.includes(preset.url)) {
                              setEditRoomImages([...editRoomImages, preset.url]);
                            }
                          }}
                          className="text-[9px] bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md transition"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Amenities List Editor */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block font-mono">
                    Room Amenities List
                  </label>

                  {/* Tags */}
                  {editRoomAmenities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editRoomAmenities.map((amenity, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-white text-slate-700 text-[10px] font-medium px-2 py-1 rounded-lg border border-slate-150 shadow-xs">
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => setEditRoomAmenities(editRoomAmenities.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic text-center py-2 bg-white rounded-xl border border-dashed border-slate-200">
                      No amenities defined. Use presets or type custom ones below.
                    </div>
                  )}

                  {/* Add Amenity Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Free High-Speed Wi-Fi..."
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAmenity.trim()) {
                          setEditRoomAmenities([...editRoomAmenities, newAmenity.trim()]);
                          setNewAmenity('');
                        }
                      }}
                      className="px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Amenity Presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Presets (Click to add):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Free High-Speed Wi-Fi',
                        'Smart TV with Streaming',
                        'Plush Ergonomic Desk',
                        'Premium Eco-friendly Toiletries',
                        'Air Conditioning',
                        'Mini Fridge',
                        'Tea & Coffee Maker'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (!editRoomAmenities.includes(preset)) {
                              setEditRoomAmenities([...editRoomAmenities, preset]);
                            }
                          }}
                          className="text-[9px] bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md transition"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Informative text */}
              <div className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-500 mb-0.5">💡 Room Customization & Tracker</p>
                Editing the room details or status instantly updates the live operational grid. To persist the modified rate and configuration, please click <span className="font-bold text-teal-600">Apply & Save Settings</span> below.
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete Chamber #${selectedRoomToManage.number}?`)) {
                    const chamberNum = selectedRoomToManage.number;
                    const roomId = selectedRoomToManage.id;
                    setSelectedRoomToManage(null);
                    showToast({
                      type: 'info',
                      message: `🗑️ Chamber #${chamberNum} deleted successfully from inventory!`
                    });
                    await deleteRoom(roomId);
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Chamber</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  id="cancel-status-manager-btn"
                  type="button"
                  onClick={() => {
                    const chamberNum = selectedRoomToManage.number;
                    setSelectedRoomToManage(null);
                    showToast({
                      type: 'info',
                      message: `ℹ️ Chamber #${chamberNum} modifications cancelled.`
                    });
                  }}
                  className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="apply-status-manager-btn"
                  type="button"
                  onClick={async () => {
                    const finalPrice = Number(editRoomPrice) || 0;
                    const chamberNum = editRoomNumber || selectedRoomToManage.number;
                    const roomId = selectedRoomToManage.id;

                    // Instantly notify & close modal for optimal responsiveness
                    showToast({
                      type: 'success',
                      message: `✅ Chamber #${chamberNum} saved with tariff ৳${finalPrice.toLocaleString()}/night!`
                    });
                    setSelectedRoomToManage(null);

                    await editRoomDetails(roomId, {
                      number: editRoomNumber,
                      price: finalPrice,
                      type: editRoomType,
                      capacity: editRoomCapacity,
                      status: editRoomStatus,
                      description: editRoomDescription,
                      amenities: editRoomAmenities,
                      images: editRoomImages,
                      image: editRoomImages[0] || selectedRoomToManage.image
                    });
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Apply & Save Settings
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. HR MANAGER ACCESS PROTECTION PASSCODE MODAL */}
      {isHrPasscodeModalOpen && (
        <div id="hr-passcode-verification-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center relative">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-6 h-6 text-amber-100 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold">HR Privilege Required</h3>
              <p className="text-amber-100 text-xs mt-1">
                Access is restricted to HR Managers and authorized administrators only.
              </p>
            </div>

            {/* Content Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const code = hrPasscodeInput.trim();
                if (code === '7788' || code === '1234' || code.toLowerCase() === 'hr123' || code === '2026') {
                  setOpMode('hr');
                  setIsHrPasscodeModalOpen(false);
                  setHrPasscodeInput('');
                  setHrPasscodeError('');
                } else {
                  setHrPasscodeError('Access Denied. Incorrect HR security passcode.');
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Enter HR Security Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="••••"
                    value={hrPasscodeInput}
                    onChange={(e) => {
                      setHrPasscodeInput(e.target.value);
                      if (hrPasscodeError) setHrPasscodeError('');
                    }}
                    className="w-full text-center text-xl font-mono tracking-widest border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                {hrPasscodeError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{hrPasscodeError}</span>
                  </p>
                )}
              </div>

              {/* Secure Tip */}
              <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-3.5 text-[11px] text-amber-800 leading-normal">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Front Desk Access Control</span>
                </p>
                <p className="mt-1 text-slate-600">
                  To prevent unauthorized Front Desk receptionists from editing marketing info & guest archives, a security passcode is required.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  id="cancel-hr-verification-btn"
                  onClick={() => {
                    setIsHrPasscodeModalOpen(false);
                    setHrPasscodeInput('');
                    setHrPasscodeError('');
                  }}
                  className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-hr-verification-btn"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 active:scale-[0.98]"
                >
                  Unlock Access
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
