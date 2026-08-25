/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Room, Booking, RoomType, RoomStatus, BookingStatus, UserProfile, UserRole } from '../types';
import { RoomCard } from './RoomCard';
import { PrintableInvoice } from './PrintableInvoice';
import { 
  Building, Shield, ShieldCheck, Users, CheckCircle2, AlertCircle, Key, 
  Plus, Edit3, Trash2, Search, Filter, Clock, CreditCard, TrendingUp, 
  Printer, Receipt, Settings, DollarSign, UserCheck, UserX, Lock, 
  RefreshCw, FileText, Sparkles, Phone, MapPin, Check, X, ShieldAlert,
  ChevronRight, BarChart3, PieChart, Download, Eye, EyeOff, KeyRound,
  Calendar, RotateCcw, ArrowUpDown, Upload, Loader2, Star, MessageSquare,
  Image as ImageIcon, ToggleLeft, ToggleRight, Sliders, Globe, Palette, Layers
} from 'lucide-react';

const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file.'));
      return;
    }

    // Direct data URL for SVG to preserve perfect scalable vector crispness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read image file'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Preserve PNG transparency; otherwise use clean webp or high-quality jpeg
          const isPng = file.type === 'image/png';
          const outputFormat = isPng ? 'image/png' : 'image/jpeg';
          const quality = isPng ? undefined : 0.88;
          const compressedDataUrl = canvas.toDataURL(outputFormat, quality);
          resolve(compressedDataUrl);
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const AdminPanel: React.FC = () => {
  const { 
    rooms, 
    bookings, 
    archivedBookings,
    serviceRequests, 
    feedbacks,
    addRoom, 
    updateRoomStatus, 
    editRoomDetails,
    deleteRoom,
    updateBookingStatus,
    deleteFeedback,
    opMode,
    setOpMode,
    isFirebaseActive,
    showToast,
    changeAdminPassword,
    registeredUsers,
    updateStaffApproval,
    deleteStaffAccount,
    masterStaffPasscode,
    updateMasterStaffPasscode,
    currentUser,
    currentRole,
    guestLogoSettings,
    updateGuestLogoSettings
  } = useApp();

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'chambers' | 'reservations' | 'reviews' | 'settings'>('analytics');

  // Change Admin Password State & Toggles
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Submit Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // 1. Client-Side Validation
    if (!currentPasswordInput.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPasswordInput) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changeAdminPassword(currentPasswordInput, newPasswordInput);
      if (res.success) {
        setPasswordSuccess('✅ Admin password updated successfully! Credentials are now secured in Firebase Authentication.');
        showToast({
          type: 'success',
          message: '🔒 Admin password updated successfully!'
        });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        setPasswordError(res.error || 'Failed to update admin password.');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'An error occurred while updating admin password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Master Secret Passcode editing state
  const [editingPasscode, setEditingPasscode] = useState<string>(masterStaffPasscode || 'ISLAMIA-STAFF-2026');
  const [isEditingPasscode, setIsEditingPasscode] = useState<boolean>(false);
  const [staffFilterTab, setStaffFilterTab] = useState<'all' | 'online' | 'pending' | 'admins' | 'staff'>('all');
  const [presenceTick, setPresenceTick] = useState<number>(0);

  // Periodic ticker to recalculate dynamic live presence every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPresenceTick(t => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Search & Filter States
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [chamberSearch, setChamberSearch] = useState<string>('');
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [ledgerSelectedDate, setLedgerSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Chamber Creation / Editing State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState<boolean>(false);
  const [newRoomNo, setNewRoomNo] = useState<string>('');
  const [newRoomTitle, setNewRoomTitle] = useState<string>('Double Deluxe');
  const [newRoomType, setNewRoomType] = useState<RoomType>('deluxe');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(2000);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(4);
  const [newRoomCapacityText, setNewRoomCapacityText] = useState<string>('Capacity 4 people');
  const [newRoomBedSize, setNewRoomBedSize] = useState<string>('Double + Double Bed');
  const [newRoomWindows, setNewRoomWindows] = useState<string>('West & South Facing');
  const [newRoomToilet, setNewRoomToilet] = useState<string>('Private High Commode Toilet');
  const [newRoomExtra, setNewRoomExtra] = useState<string>('Cloth Rack & All Facilities');
  const [newRoomStartingPriceBanner, setNewRoomStartingPriceBanner] = useState<string>('Standard Rate');
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>([
    'Free High-Speed Wi-Fi',
    'Air Conditioning',
    'Flat-screen TV',
    'Refrigerator',
    'Private High Commode Toilet',
    '24/7 Power Backup'
  ]);
  const [newRoomDesc, setNewRoomDesc] = useState<string>('Capacity 4 people, Double + Double Bed, West & South Facing, Private High Commode Toilet, TV, Free WiFi, Refrigerator, AC/Non-AC and all facilities.');
  const [newRoomImg, setNewRoomImg] = useState<string>('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800');

  // Preset Template loader for 6 Standard Room Types
  const applyRoomPreset = (presetKey: 'double_deluxe' | 'family' | 'executive_single' | 'triple' | 'standard_double' | 'single_economy') => {
    switch (presetKey) {
      case 'double_deluxe':
        setNewRoomTitle('Double Deluxe');
        setNewRoomType('deluxe');
        setNewRoomPrice(2000);
        setNewRoomCapacity(4);
        setNewRoomCapacityText('Capacity 4 people');
        setNewRoomBedSize('Double + Double Bed');
        setNewRoomWindows('West & South Facing');
        setNewRoomToilet('Private High Commode Toilet');
        setNewRoomExtra('Cloth Rack & All Facilities');
        setNewRoomStartingPriceBanner('Standard Rate');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Refrigerator', 'Private High Commode Toilet', '24/7 Power Backup']);
        setNewRoomDesc('Capacity 4 people, Double + Double Bed, West & South Facing, Private High Commode Toilet, TV, Free WiFi, Refrigerator, AC/Non-AC and all facilities.');
        setNewRoomImg('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800');
        break;
      case 'family':
        setNewRoomTitle('Family Room');
        setNewRoomType('family');
        setNewRoomPrice(2000);
        setNewRoomCapacity(4);
        setNewRoomCapacityText('Capacity 2 adults + 2 children');
        setNewRoomBedSize('Double + Semi Double Bed');
        setNewRoomWindows('West & North Facing');
        setNewRoomToilet('Private High Commode Toilet');
        setNewRoomExtra('Sofa & Cloth Rack');
        setNewRoomStartingPriceBanner('Family Special');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Comfortable Sofa', 'Private High Commode Toilet', '24/7 Electricity']);
        setNewRoomDesc('Capacity 2 adults + 2 children, Double + Semi Double Bed, West & North Facing, Private High Commode Toilet and Sofa.');
        setNewRoomImg('https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800');
        break;
      case 'executive_single':
        setNewRoomTitle('Double - Executive Single');
        setNewRoomType('double');
        setNewRoomPrice(1500);
        setNewRoomCapacity(2);
        setNewRoomCapacityText('Capacity 1/2 people');
        setNewRoomBedSize('Queen Size Bed');
        setNewRoomWindows('East & North Facing');
        setNewRoomToilet('Private High Commode Toilet');
        setNewRoomExtra('AC/Non-AC Option');
        setNewRoomStartingPriceBanner('Executive Deal');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', 'Air Conditioning / Non-AC Option', 'Flat-screen TV', 'Private High Commode Toilet', 'Work Desk', '24/7 Electricity']);
        setNewRoomDesc('Capacity 1/2 people, Queen Size Bed, East & North Facing, Private High Commode Toilet, AC/Non-AC option.');
        setNewRoomImg('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800');
        break;
      case 'triple':
        setNewRoomTitle('Triple Room');
        setNewRoomType('triple');
        setNewRoomPrice(1800);
        setNewRoomCapacity(3);
        setNewRoomCapacityText('Capacity 3 people');
        setNewRoomBedSize('Double + Single Bed');
        setNewRoomWindows('West & South Facing');
        setNewRoomToilet('Private High Commode Toilet');
        setNewRoomExtra('Balcony & Full Facilities');
        setNewRoomStartingPriceBanner('Group Saver');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', 'Air Conditioning', 'Private Balcony', 'Private High Commode Toilet', 'Flat-screen TV', '24/7 Electricity']);
        setNewRoomDesc('Capacity 3 people, Double + Single Bed, West & South Facing, Private High Commode Toilet, Balcony and full facilities.');
        setNewRoomImg('https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=800');
        break;
      case 'standard_double':
        setNewRoomTitle('Standard Double');
        setNewRoomType('double');
        setNewRoomPrice(1700);
        setNewRoomCapacity(3);
        setNewRoomCapacityText('Capacity 2 people + 1 child (below 6 years)');
        setNewRoomBedSize('King Size Bed');
        setNewRoomWindows('East & South Facing');
        setNewRoomToilet('Private Pan Toilet');
        setNewRoomExtra('Balcony & Private Pan Toilet');
        setNewRoomStartingPriceBanner('Standard Value');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', 'King Size Bed', 'Private Balcony', 'Private Pan Toilet', 'Air Conditioning', '24/7 Electricity']);
        setNewRoomDesc('Capacity 2 people + 1 child (below 6 years), King Size Bed, East & South Facing, Private Pan Toilet and Balcony.');
        setNewRoomImg('https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800');
        break;
      case 'single_economy':
        setNewRoomTitle('Single - Economy');
        setNewRoomType('single');
        setNewRoomPrice(700);
        setNewRoomCapacity(1);
        setNewRoomCapacityText('Capacity 1 person');
        setNewRoomBedSize("Single Bed (3' / 7')");
        setNewRoomWindows('East Facing');
        setNewRoomToilet('Common Pan Toilet');
        setNewRoomExtra('WiFi & 24/7 Electricity Facilities');
        setNewRoomStartingPriceBanner('Budget Choice');
        setNewRoomAmenities(['Free High-Speed Wi-Fi', '24/7 Electricity', 'Common Pan Toilet', 'Ceiling Fan', 'Clean Linen']);
        setNewRoomDesc("Capacity 1 person, Single Bed (3' / 7'), East Facing, Common Pan Toilet, WiFi and 24/7 electricity facilities.");
        setNewRoomImg('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800');
        break;
    }
  };

  // Editing price modal / state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  // Selected Booking Invoice Modal State
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // Property Details State
  const [propertyHotline, setPropertyHotline] = useState<string>('01909-806960');
  const [propertyAddress, setPropertyAddress] = useState<string>(() => {
    return localStorage.getItem('property_address') || 'House No: 55/C/1, Road No: 9/A, Dhanmondi - 1209';
  });
  const [propertyTaxRate, setPropertyTaxRate] = useState<number>(5);

  // Guest View Logo Management States
  const [logoShowToggle, setLogoShowToggle] = useState<boolean>(() => guestLogoSettings?.showLogo ?? true);
  const [logoUrlInput, setLogoUrlInput] = useState<string>(() => guestLogoSettings?.customLogoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isSavingLogo, setIsSavingLogo] = useState<boolean>(false);

  // Sync state when context settings update from Firestore/Local
  React.useEffect(() => {
    if (guestLogoSettings) {
      setLogoShowToggle(guestLogoSettings.showLogo ?? true);
      setLogoUrlInput(guestLogoSettings.customLogoUrl || '');
    }
  }, [guestLogoSettings]);

  const handleLogoFileUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      const dataUrl = await processUploadedImage(file);
      setLogoUrlInput(dataUrl);
      showToast({
        type: 'info',
        message: '📷 Logo image loaded. Click "Save & Publish Logo" to update the live website.'
      });
    } catch (e: any) {
      showToast({
        type: 'warning',
        message: e?.message || 'Failed to upload logo image.'
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveLogoSettings = async () => {
    setIsSavingLogo(true);
    try {
      await updateGuestLogoSettings({
        showLogo: logoShowToggle,
        logoType: 'image',
        customLogoUrl: logoUrlInput.trim()
      });
      showToast({
        type: 'success',
        message: '✓ Logo updated successfully on the guest website.'
      });
    } catch (e: any) {
      showToast({
        type: 'warning',
        message: 'Could not save logo settings.'
      });
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleToggleLogoVisibilityQuick = async (newValue: boolean) => {
    setLogoShowToggle(newValue);
    try {
      await updateGuestLogoSettings({
        showLogo: newValue
      });
    } catch (e) {}
  };

  // Staff Deletion Modal & Async Action States
  const [userPendingDeletion, setUserPendingDeletion] = useState<UserProfile | null>(null);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);

  // Approve single staff / join request
  const handleApproveStaff = async (user: UserProfile) => {
    setActionLoadingEmail(user.email);
    try {
      await updateStaffApproval(user.email, true, user.uid);
      showToast({
        type: 'success',
        message: `✅ Staff join request for ${user.name} approved! Front-desk access granted.`
      });
    } catch (e) {
      showToast({
        type: 'error',
        message: `Could not approve account for ${user.name}.`
      });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  // Revoke or place on pending
  const handleRevokeStaff = async (user: UserProfile) => {
    setActionLoadingEmail(user.email);
    try {
      await updateStaffApproval(user.email, false, user.uid);
      showToast({
        type: 'info',
        message: `⚠️ Access authorization revoked for ${user.name}.`
      });
    } catch (e) {
      showToast({
        type: 'error',
        message: `Could not update status for ${user.name}.`
      });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  // Bulk Approve All Pending Join Requests
  const handleApproveAllPending = async () => {
    const pendingUsers = registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved);
    if (pendingUsers.length === 0) return;
    
    setActionLoadingEmail('bulk-pending');
    try {
      for (const u of pendingUsers) {
        await updateStaffApproval(u.email, true, u.uid);
      }
      showToast({
        type: 'success',
        message: `✅ Approved all ${pendingUsers.length} pending staff join request(s)!`
      });
    } catch (e) {
      showToast({
        type: 'error',
        message: 'Failed to approve some accounts.'
      });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  // Trigger staff user or join request deletion modal
  const handleDeleteStaffUser = (user: UserProfile) => {
    if (currentUser?.email && currentUser.email.toLowerCase() === user.email.toLowerCase()) {
      showToast({
        type: 'error',
        message: 'Cannot delete your own currently active admin account.'
      });
      return;
    }
    if (user.email.toLowerCase() === 'islamiaguesthouse@gmail.com') {
      showToast({
        type: 'error',
        message: 'Primary master administrator account cannot be deleted.'
      });
      return;
    }
    setUserPendingDeletion(user);
  };

  // Confirm delete staff account / join request
  const handleConfirmDeleteStaff = async () => {
    if (!userPendingDeletion) return;
    const user = userPendingDeletion;
    setActionLoadingEmail(user.email);
    try {
      await deleteStaffAccount(user.email, user.uid);
      showToast({
        type: 'info',
        message: `🗑️ ${user.name} (${user.email}) has been permanently deleted from staff registry.`
      });
    } catch (e) {
      showToast({
        type: 'error',
        message: `Failed to delete ${user.name}.`
      });
    } finally {
      setActionLoadingEmail(null);
      setUserPendingDeletion(null);
    }
  };

  // Save Master Staff Secret Passcode
  const handleSaveMasterPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editingPasscode.trim().toUpperCase();
    if (!clean) return;
    await updateMasterStaffPasscode(clean);
    setIsEditingPasscode(false);
    showToast({
      type: 'success',
      message: `🔑 Master Staff Secret Passcode updated to: ${clean}`
    });
  };

  // Helper to determine real-time live online presence
  const isUserOnline = (u: UserProfile) => {
    if (currentUser?.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) return true;
    if (u.email.toLowerCase() === 'islamiaguesthouse@gmail.com' && (currentUser?.role === 'admin' || opMode === 'admin')) return true;
    if (u.isOnline) return true;
    if (u.lastActiveAt) {
      const diff = Date.now() - new Date(u.lastActiveAt).getTime();
      if (diff < 5 * 60 * 1000) return true; // active within last 5 minutes
    }
    return false;
  };

  // Filtered Users for Staff tab with live presence filters
  const filteredStaff = useMemo(() => {
    return registeredUsers.map(u => {
      const online = isUserOnline(u);
      return online && !u.isOnline ? { ...u, isOnline: true } : u;
    }).filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(staffSearch)) ||
        (u.staffSecretKey && u.staffSecretKey.toLowerCase().includes(staffSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (staffFilterTab === 'online') return isUserOnline(u);
      if (staffFilterTab === 'pending') return u.role === 'staff' && !u.hrApproved;
      if (staffFilterTab === 'admins') return u.role === 'admin';
      if (staffFilterTab === 'staff') return u.role === 'staff';
      return true;
    });
  }, [registeredUsers, staffSearch, staffFilterTab, currentUser, presenceTick, opMode]);

  // Filtered Chambers for Chambers tab
  const filteredChambers = useMemo(() => {
    return rooms.filter(r => 
      r.number.toLowerCase().includes(chamberSearch.toLowerCase()) ||
      r.type.toLowerCase().includes(chamberSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(chamberSearch.toLowerCase())
    );
  }, [rooms, chamberSearch]);

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

  // Calculate Key Financial Metrics (Daily Updates based on selectedDate)
  const metrics = useMemo(() => {
    const activeDate = selectedDate || new Date().toISOString().split('T')[0];
    const currentToday = new Date().toISOString().split('T')[0];

    // Filter reservations active or checked out on selectedDate
    const dateBookings = allCombinedBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const cin = b.checkIn || b.checkInDate || '';
      const cout = b.checkOut || b.checkOutDate || cin;

      const inRange = Boolean(cin && cout && cin <= activeDate && cout >= activeDate);
      const isCheckedOutOnDate = Boolean(
        (b.status === 'checked-out' || b.status === 'checked_out') && 
        ((b.checkedOutAt && b.checkedOutAt.startsWith(activeDate)) || cout === activeDate)
      );
      const isCreatedOnDate = Boolean(b.createdAt && b.createdAt.startsWith(activeDate));

      return inRange || isCheckedOutOnDate || isCreatedOnDate;
    });

    // Gross Earnings for reservations active or checked out on selected date
    const totalEarnings = dateBookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'checked-in' || b.status === 'checked-out' || b.status === 'checked_out') {
        return sum + (b.finalBillAmount ?? b.paidAmount ?? b.totalAmount ?? 0);
      }
      return sum;
    }, 0);

    // Checked-out payments specifically on selected date
    const checkedOutEarnings = dateBookings.reduce((sum, b) => {
      if (b.status === 'checked-out' || b.status === 'checked_out') {
        return sum + (b.finalBillAmount ?? b.paidAmount ?? b.totalAmount ?? 0);
      }
      return sum;
    }, 0);

    // Active reservations on selected date
    const activeBookingsCount = dateBookings.filter(b => 
      b.status === 'checked-in' || b.status === 'confirmed' || b.status === 'occupied'
    ).length;

    // Daily Chamber Occupancy rate strictly based on chambers occupied on selected date
    const occupiedRoomIds = new Set<string>();
    allCombinedBookings.forEach(b => {
      if (b.status === 'checked-in' || b.status === 'confirmed' || b.status === 'occupied') {
        const cin = b.checkIn || b.checkInDate || '';
        const cout = b.checkOut || b.checkOutDate || cin;
        if (cin && cout && cin <= activeDate && cout >= activeDate) {
          if (b.roomId) occupiedRoomIds.add(b.roomId);
          if (b.roomNumber) {
            const matchedRoom = rooms.find(r => r.number === b.roomNumber);
            if (matchedRoom) occupiedRoomIds.add(matchedRoom.id);
          }
        }
      }
    });

    // If activeDate is today, also include chambers marked as occupied in room state
    if (activeDate === currentToday) {
      rooms.forEach(r => {
        if (r.status === 'occupied') occupiedRoomIds.add(r.id);
      });
    }

    const occupiedChambersCount = Math.min(occupiedRoomIds.size, rooms.length);
    const totalChambers = rooms.length;
    const occupancyPercentage = totalChambers > 0 ? Math.round((occupiedChambersCount / totalChambers) * 100) : 0;

    const pendingServicesCount = serviceRequests.filter(s => s.status === 'pending').length;
    const staffAccountsCount = registeredUsers.filter(u => u.role === 'staff').length;
    const pendingStaffApprovals = registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length;

    return {
      selectedDate: activeDate,
      totalEarnings,
      checkedOutEarnings,
      activeBookingsCount,
      occupiedChambersCount,
      totalChambers,
      occupancyPercentage,
      pendingServicesCount,
      staffAccountsCount,
      pendingStaffApprovals
    };
  }, [allCombinedBookings, rooms, serviceRequests, registeredUsers, selectedDate]);

  // Filtered Bookings for Reservations tab with Day-by-Day Guest History support
  const filteredBookings = useMemo(() => {
    return allCombinedBookings.filter(b => {
      const searchLower = reservationSearch.toLowerCase().trim();
      const matchesSearch = 
        !searchLower ||
        (b.guestName && b.guestName.toLowerCase().includes(searchLower)) ||
        (b.guestPhone && b.guestPhone.includes(searchLower)) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(searchLower)) ||
        (b.nidNumber && b.nidNumber.includes(searchLower)) ||
        (b.zilaDistrict && b.zilaDistrict.toLowerCase().includes(searchLower));
      
      const matchesStatus = reservationStatusFilter === 'all' || b.status === reservationStatusFilter;

      let matchesDate = true;
      if (ledgerSelectedDate) {
        const cin = b.checkIn || b.checkInDate || '';
        const cout = b.checkOut || b.checkOutDate || cin;

        const inRange = Boolean(cin && cout && cin <= ledgerSelectedDate && cout >= ledgerSelectedDate);
        const isCin = cin === ledgerSelectedDate;
        const isCout = cout === ledgerSelectedDate;
        const isCheckedOutAt = Boolean(b.checkedOutAt && b.checkedOutAt.startsWith(ledgerSelectedDate));
        const isCreatedAt = Boolean(b.createdAt && b.createdAt.startsWith(ledgerSelectedDate));

        matchesDate = inRange || isCin || isCout || isCheckedOutAt || isCreatedAt;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allCombinedBookings, reservationSearch, reservationStatusFilter, ledgerSelectedDate]);

  // Daily Summary Metrics for Day-by-Day Report Bar
  const dailyMetrics = useMemo(() => {
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

      if (ledgerSelectedDate) {
        if (cin === ledgerSelectedDate) checkInsCount++;
        if (cout === ledgerSelectedDate || (b.checkedOutAt && b.checkedOutAt.startsWith(ledgerSelectedDate))) checkOutsCount++;
      } else {
        if (b.status === 'checked-in') checkInsCount++;
        if (b.status === 'checked-out') checkOutsCount++;
      }
    });

    return { totalGuests, totalRevenue, checkInsCount, checkOutsCount };
  }, [filteredBookings, ledgerSelectedDate]);

  // Review Stats & Filtered Reviews
  const reviewStats = useMemo(() => {
    const list = feedbacks || [];
    const total = list.length;
    if (total === 0) return { total: 0, avg: '5.0', fiveStars: 0, fourStars: 0, threeOrLess: 0 };
    const sum = list.reduce((acc, f) => acc + (Number(f.rating) || 5), 0);
    const avg = (sum / total).toFixed(1);
    const fiveStars = list.filter(f => Number(f.rating) === 5).length;
    const fourStars = list.filter(f => Number(f.rating) === 4).length;
    const threeOrLess = list.filter(f => Number(f.rating) <= 3).length;
    return { total, avg, fiveStars, fourStars, threeOrLess };
  }, [feedbacks]);

  const filteredReviews = useMemo(() => {
    return (feedbacks || []).filter(f => {
      const matchesRating = reviewRatingFilter === 'all' || Number(f.rating) === Number(reviewRatingFilter);
      const search = reviewSearch.toLowerCase().trim();
      const matchesSearch = !search ||
        (f.userName && f.userName.toLowerCase().includes(search)) ||
        (f.userEmail && f.userEmail.toLowerCase().includes(search)) ||
        (f.comment && f.comment.toLowerCase().includes(search));
      return matchesRating && matchesSearch;
    });
  }, [feedbacks, reviewSearch, reviewRatingFilter]);

  // Delete Guest Review handler
  const handleDeleteReview = async (review: { id: string; userName?: string }) => {
    const guestLabel = review.userName || 'Verified Guest';
    if (window.confirm(`Are you sure you want to permanently delete this review submitted by "${guestLabel}"?`)) {
      try {
        await deleteFeedback(review.id);
        showToast({
          type: 'info',
          message: `🗑️ Review by ${guestLabel} deleted successfully.`
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          message: err?.message || 'Failed to delete review.'
        });
      }
    }
  };

  // Handle Chamber Add Submit
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const trimmedNo = newRoomNo.trim();
    if (!trimmedNo) {
      showToast({ type: 'warning', message: 'Please provide a valid room number.' });
      return;
    }

    const parsedPrice = Number(newRoomPrice) || 0;
    const parsedCapacity = Number(newRoomCapacity) || 1;

    await addRoom({
      number: trimmedNo,
      title: newRoomTitle.trim() || `${newRoomType.toUpperCase()} Room`,
      type: newRoomType,
      price: parsedPrice,
      status: 'available',
      capacity: parsedCapacity,
      capacityText: newRoomCapacityText || `Capacity ${parsedCapacity} people`,
      bedSize: newRoomBedSize,
      windows: newRoomWindows,
      toilet: newRoomToilet,
      extra: newRoomExtra,
      startingPriceBanner: newRoomStartingPriceBanner,
      description: newRoomDesc || `${newRoomTitle} at Islamia Guest House Dhanmondi`,
      image: newRoomImg || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800',
      images: [newRoomImg || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800'],
      amenities: newRoomAmenities.length > 0 ? newRoomAmenities : ['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Private Toilet']
    });

    setIsAddRoomOpen(false);
    setNewRoomNo('');
    setNewRoomDesc('');
    setNewRoomImg('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800');
    showToast({
      type: 'success',
      message: `🏨 New Room #${trimmedNo} (${newRoomTitle}) added to inventory!`
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

  // Export guest logs to CSV format for offline record keeping
  const exportGuestLogsToCSV = (dataToExport: Booking[], filenamePrefix = 'Master_Guest_Reservation_Ledger') => {
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
      'Room Number',
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
      message: `📥 Exported ${dataToExport.length} reservation records to CSV file successfully!`
    });
  };

  const [panelUnlocked, setPanelUnlocked] = useState<boolean>(() => {
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'staff') return false;
    return sessionStorage.getItem('admin_authorized') === 'true';
  });
  const [gatePasscode, setGatePasscode] = useState<string>('');
  const [gateError, setGateError] = useState<string>('');

  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    const clean = gatePasscode.trim().toUpperCase();
    const validCodes = ['ADMIN2026', 'ISLAMIA-ADMIN-2026', 'ADMIN789', 'ADMIN-IGH-2026', masterStaffPasscode].filter(Boolean);

    if (validCodes.includes(clean)) {
      sessionStorage.setItem('admin_authorized', 'true');
      setPanelUnlocked(true);
      showToast({
        type: 'success',
        message: '🔓 Executive Admin Panel unlocked.'
      });
    } else {
      setGateError('Access Denied: Invalid Admin Master Passcode. Staff and non-admin users cannot view Admin controls without Executive authorization.');
    }
  };

  const handleLockPanel = () => {
    sessionStorage.removeItem('admin_authorized');
    setPanelUnlocked(false);
    setOpMode('receptionist');
    showToast({
      type: 'info',
      message: '🔒 Admin Panel locked. Returned to Front Desk.'
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
                  placeholder="Enter Admin Passcode"
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
              <span>Islamia Guest House • {propertyAddress}</span>
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
              onClick={() => {
                setPasswordError(null);
                setPasswordSuccess(null);
                setIsPasswordModalOpen(true);
              }}
              title="Change Admin Password"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Password</span>
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

      {/* Date Selector Filter Bar for Daily Operational Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <Calendar className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider font-mono">
                Daily Operational Metrics Date
              </h3>
              <span className="px-2 py-0.5 bg-teal-100/80 text-teal-800 text-[10px] font-mono font-bold rounded-md">
                {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Filter Gross Earnings and Room Occupancy rate day-by-day for a specific date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            id="admin-metrics-date-picker"
            value={selectedDate}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setSelectedDate(val);
                setLedgerSelectedDate(val);
              }
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white shadow-xs cursor-pointer"
          />
          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
                setLedgerSelectedDate(today);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Reset filter to today's date"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Daily Gross Earnings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono block">Gross Earnings</span>
              <span className="text-[9px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold inline-block">
                {metrics.selectedDate}
              </span>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850">
            ৳{metrics.totalEarnings.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Checked-out ({metrics.selectedDate}): <span className="font-semibold text-emerald-600">৳{metrics.checkedOutEarnings.toLocaleString()}</span>
          </p>
        </div>

        {/* Metric 2: Daily Room Occupancy */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono block">Room Occupancy</span>
              <span className="text-[9px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold inline-block">
                {metrics.selectedDate}
              </span>
            </div>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850 flex items-baseline gap-2">
            <span>{metrics.occupancyPercentage}%</span>
            <span className="text-xs font-normal text-slate-500">({metrics.occupiedChambersCount}/{metrics.totalChambers})</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-500 h-full transition-all duration-500" 
              style={{ width: `${metrics.occupancyPercentage}%` }} 
            />
          </div>
        </div>

        {/* Metric 3: Active Guests */}
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
            Total Ledger Records: <span className="font-semibold text-slate-700">{allCombinedBookings.length}</span>
          </p>
        </div>

        {/* Metric 4: Staff HR Approvals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Staff &amp; Live Presence</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-850 flex items-center gap-2">
            <span>{registeredUsers.filter(u => isUserOnline(u)).length} Online</span>
            <span className="text-xs text-slate-400 font-normal">({metrics.staffAccountsCount} total)</span>
            {metrics.pendingStaffApprovals > 0 && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-sans font-bold text-[10px] rounded-full animate-pulse">
                {metrics.pendingStaffApprovals} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Master Passcode: <strong className="font-mono text-slate-700">{masterStaffPasscode}</strong></span>
            <button onClick={() => setActiveTab('staff')} className="text-teal-700 font-semibold hover:underline cursor-pointer">View Staff →</button>
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
            Guest Reviews: <button onClick={() => setActiveTab('reviews')} className="font-semibold text-teal-700 hover:underline cursor-pointer">{feedbacks.length} Submissions</button>
          </p>
        </div>
      </div>

      {/* Main Admin Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap items-center gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition relative cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'chambers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4 text-sky-400" />
          <span>Room Inventory &amp; Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Master Guest Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Guest Reviews ({feedbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                    <span>Earnings Distribution by Room Category</span>
                  </h3>
                  <p className="text-xs text-slate-400">Gross income generated across room tiers in Islamia.</p>
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
                        <span>Rooms Count: {typeRoomCount}</span>
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
                  <span className="font-bold text-teal-700 font-mono">{masterStaffPasscode}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600 font-medium">Total Feedback Reviews:</span>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className="font-bold text-teal-700 font-mono hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{feedbacks.length} Submissions</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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

          {/* Live Staff On-Duty Realtime Quick Monitor */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Front Desk Staff Live Presence &amp; Login Monitor</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    {registeredUsers.filter(u => isUserOnline(u)).length} Online Now
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Real-time status of staff signed in across all reception devices and consoles.</p>
              </div>
              <button
                onClick={() => setActiveTab('staff')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Staff &amp; HR Panel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {registeredUsers.map((u, idx) => {
                const online = isUserOnline(u);
                return (
                  <div 
                    key={u.uid || idx} 
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      online 
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-xs' 
                        : 'bg-slate-50 border-slate-200/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full ${u.role === 'admin' ? 'bg-purple-900 text-purple-100' : 'bg-slate-800 text-white'} font-bold flex items-center justify-center text-xs font-mono uppercase shadow-xs`}>
                          {u.name.slice(0, 1)}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          online ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}></span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                          <span>{u.name}</span>
                          {u.role === 'admin' && <Shield className="w-3 h-3 text-purple-600 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">{u.email}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {online ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              <span>Active Live</span>
                            </span>
                          ) : (
                            <span>Offline</span>
                          )}
                          {u.lastActiveAt && (
                            <span>• {new Date(u.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & HR APPROVALS */}
      {activeTab === 'staff' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Live Real-time Status Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 border border-teal-800/40 rounded-3xl p-6 shadow-xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Real-Time Staff Presence &amp; HR Approvals</span>
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                    🟢 Live Sync Active
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Instant real-time presence, passcode sign-ins, and HR authorization across all reception desks.
                </p>
              </div>

              {/* Quick Summary Metrics */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Online Now</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {registeredUsers.filter(u => isUserOnline(u)).length} Active
                    </div>
                  </div>
                </div>

                <div className="flex-1 sm:flex-initial px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Pending HR</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      {registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length} Pending
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Staff Passcode Configurator inside Card */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200">Front Desk Master Passcode:</span>
                  <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">Staff use this passcode to instantly sign in at reception.</span>
                </div>
              </div>

              {!isEditingPasscode ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3.5 py-1.5 bg-slate-950 border border-amber-500/30 text-amber-300 font-mono font-bold rounded-xl text-xs tracking-wider flex items-center gap-2">
                    <span>{masterStaffPasscode || 'ISLAMIA-STAFF-2026'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPasscode(masterStaffPasscode || 'ISLAMIA-STAFF-2026');
                      setIsEditingPasscode(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Passcode</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveMasterPasscode} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editingPasscode}
                    onChange={(e) => setEditingPasscode(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-slate-950 border border-amber-500 text-amber-300 font-mono font-bold rounded-xl text-xs focus:outline-none uppercase"
                    placeholder="Enter Passcode"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPasscode(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Registered Staff Accounts & HR Approvals Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            {/* Action Banner for Pending Staff Join Requests */}
            {registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length > 0 && (
              <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 flex-wrap">
                      <span>{registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length} Staff Join Request(s) Pending HR Review</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold uppercase">Action Required</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Staff registrations await administrator approval before accessing front-desk checkout and room assignment consoles.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setStaffFilterTab('pending')}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Filter Pending ({registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length})
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingEmail === 'bulk-pending'}
                    onClick={handleApproveAllPending}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingEmail === 'bulk-pending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Approve All</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Staff &amp; Receptionist Registry</span>
                  <span className="text-xs font-normal text-slate-400">({filteredStaff.length} of {registeredUsers.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Live presence monitor, passcode sign-in audits, and 1-click HR access approval.</p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
                  <button
                    onClick={() => setStaffFilterTab('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      staffFilterTab === 'all' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({registeredUsers.length})
                  </button>
                  <button
                    onClick={() => setStaffFilterTab('online')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      staffFilterTab === 'online' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Online ({registeredUsers.filter(u => isUserOnline(u)).length})</span>
                  </button>
                  <button
                    onClick={() => setStaffFilterTab('pending')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      staffFilterTab === 'pending' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-slate-500 hover:text-amber-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Pending HR ({registeredUsers.filter(u => u.role === 'staff' && !u.hrApproved).length})</span>
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search name, email, passcode..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                  {staffSearch && (
                    <button
                      type="button"
                      onClick={() => setStaffSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Staff Profile &amp; Contact</th>
                    <th className="p-3">Live Presence Status</th>
                    <th className="p-3">Authentication Method</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">HR Status</th>
                    <th className="p-3 text-right">HR Authorization Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 space-y-1">
                        <UserX className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">No staff members found</p>
                        <p className="text-[11px] text-slate-400">No registered accounts matched the selected filter or search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((user, idx) => {
                      const userOnline = isUserOnline(user);
                      const isPending = user.role === 'staff' && !user.hrApproved;
                      const isPrimaryAdmin = user.email.toLowerCase() === 'islamiaguesthouse@gmail.com';
                      const isCurrentActiveUser = currentUser?.email && currentUser.email.toLowerCase() === user.email.toLowerCase();
                      const isLoadingThis = actionLoadingEmail === user.email;

                      return (
                      <tr key={user.uid || idx} className={`hover:bg-slate-50/80 transition ${isPending ? 'bg-amber-50/40' : ''}`}>
                        {/* Profile Info */}
                        <td className="p-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full ${user.role === 'admin' ? 'bg-purple-900 text-purple-100' : 'bg-slate-800 text-white'} font-bold flex items-center justify-center text-xs font-mono uppercase shadow-sm`}>
                                {user.name.slice(0, 1)}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                userOnline ? 'bg-emerald-500' : 'bg-slate-300'
                              }`} title={userOnline ? 'Active Online' : 'Offline'}></span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.role === 'admin' && (
                                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                                )}
                                {isPending && (
                                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[9px] font-bold rounded">JOIN REQUEST</span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500">{user.email}</div>
                              {user.phone && <div className="text-[10px] text-slate-400 font-mono">{user.phone}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Live Presence */}
                        <td className="p-3">
                          {userOnline ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                <span>LIVE ONLINE</span>
                              </span>
                              <span className="text-[10px] text-emerald-700 font-mono font-medium">
                                {user.role === 'admin' ? 'Active in Admin Console' : 'Active at Front Desk'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-full text-[10px] flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span>Offline</span>
                              </span>
                              {user.lastLoginAt ? (
                                <span className="text-[10px] text-slate-400">
                                  Last seen: {new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Not recently active</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Auth Method / Passcode */}
                        <td className="p-3">
                          <div className="space-y-1">
                            {user.loginMethod === 'passcode' || user.staffSecretKey ? (
                              <div className="flex items-center gap-1 text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg w-fit border border-teal-200/60">
                                <KeyRound className="w-3 h-3 text-teal-600" />
                                <span>Passcode: {user.staffSecretKey || 'STAFF789'}</span>
                              </div>
                            ) : user.loginMethod === 'google' ? (
                              <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg w-fit border border-blue-200/60 font-semibold">
                                Google SSO Verified
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg w-fit font-mono">
                                Password Login
                              </div>
                            )}

                            {user.lastLoginAt && (
                              <div className="text-[10px] text-slate-400">
                                Signed in: {new Date(user.lastLoginAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* HR Approval Status */}
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

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!user.hrApproved ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isLoadingThis}
                                  onClick={() => handleApproveStaff(user)}
                                  className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                                  title="Approve staff join request and grant front-desk access"
                                >
                                  {isLoadingThis ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve Access</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isLoadingThis}
                                  onClick={() => handleDeleteStaffUser(user)}
                                  className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                                  title="Delete / Reject this staff join request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Reject / Delete Request</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {user.role !== 'admin' && (
                                  <button
                                    type="button"
                                    disabled={isLoadingThis}
                                    onClick={() => handleRevokeStaff(user)}
                                    className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                                    title="Revoke HR authorization and place back to pending review"
                                  >
                                    {isLoadingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    )}
                                    <span>Revoke Access</span>
                                  </button>
                                )}
                                {!isPrimaryAdmin && !isCurrentActiveUser && (
                                  <button
                                    type="button"
                                    disabled={isLoadingThis}
                                    onClick={() => handleDeleteStaffUser(user)}
                                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition flex items-center gap-1 font-bold text-[11px] cursor-pointer disabled:opacity-50 active:scale-95"
                                    title="Permanently remove user record from system"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Account</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS & TARIFF MATRIX */}
      {activeTab === 'chambers' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Room Control Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  <span>Room Inventory &amp; Tariff Management</span>
                </h3>
                <p className="text-xs text-slate-400">Add new rooms, update nightly pricing (৳), and change room maintenance statuses.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={chamberSearch}
                    onChange={(e) => setChamberSearch(e.target.value)}
                    placeholder="Search Room # or Type..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddRoomOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>Add Room</span>
                </button>
              </div>
            </div>

            {/* Room List Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Room #</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Nightly Tariff (৳)</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right">Room Control</th>
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
                          {room.type} Room
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editRoomDetails(room.id, { description: `${room.description} (Inspected)` })}
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
                          >
                            Inspection Log
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove Room #${room.number}?`)) {
                                showToast({
                                  type: 'info',
                                  message: `🗑️ Room #${room.number} deleted successfully!`
                                });
                                deleteRoom(room.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                <p className="text-xs text-slate-400">Review all historical, active, and completed guest reservations in Dhanmondi.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  id="admin-export-csv-btn"
                  onClick={() => exportGuestLogsToCSV(filteredBookings, 'Master_Guest_Reservation_Ledger')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  title="Export master reservation ledger to CSV for offline record keeping"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Export to CSV</span>
                </button>

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

                {/* Day-by-Day Date Picker Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-teal-500">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <input
                    type="date"
                    id="admin-ledger-date-picker"
                    value={ledgerSelectedDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLedgerSelectedDate(val);
                      if (val) setSelectedDate(val);
                    }}
                    className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer font-mono font-bold"
                    title="Filter guest history by specific date"
                  />
                </div>

                {/* Date Filter Reset Button */}
                {ledgerSelectedDate !== new Date().toISOString().split('T')[0] && (
                  <button
                    type="button"
                    id="admin-ledger-date-reset-btn"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setLedgerSelectedDate(today);
                      setSelectedDate(today);
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    title="Reset date filter to today's date"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-600" />
                    <span>Today</span>
                  </button>
                )}

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

            {/* DAILY REPORT SUMMARY BAR */}
            <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 border border-teal-800/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-200 flex items-center gap-2">
                    <span>Daily Guest Report</span>
                    {ledgerSelectedDate ? (
                      <span className="px-2.5 py-0.5 bg-teal-500/25 text-teal-300 rounded-full text-[10px] font-mono border border-teal-500/40 font-bold">
                        📅 {ledgerSelectedDate}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-[10px]">
                        All Records
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {ledgerSelectedDate 
                      ? `Guest details, earned revenue, and check-in/out summary for ${ledgerSelectedDate}` 
                      : 'Select a specific date from the Date Picker above to filter guest history and summary.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Metric 1: Total Guests */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Total Guests</p>
                    <p className="text-xs font-bold font-mono text-white">{dailyMetrics.totalGuests} Guests</p>
                  </div>
                </div>

                {/* Metric 2: Total Revenue / Collections */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Total Revenue</p>
                    <p className="text-xs font-bold font-mono text-emerald-300">৳{dailyMetrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Metric 3: Total Check-Ins & Check-Outs */}
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2.5">
                  <ArrowUpDown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Check-In / Check-Out</p>
                    <p className="text-xs font-bold font-mono text-amber-200">
                      📥 {dailyMetrics.checkInsCount} Check-In | 📤 {dailyMetrics.checkOutsCount} Check-Out
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Bookings Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="p-3">Guest Name &amp; Contact</th>
                    <th className="p-3">Room</th>
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
                          {b.checkIn || b.checkInDate || 'N/A'} &rarr; {b.checkOut || b.checkOutDate || 'N/A'}
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

      {/* TAB 5: GUEST REVIEWS & FEEDBACK MANAGEMENT */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Review Analytics & Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Total Reviews</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-850">
                {reviewStats.total}
              </div>
              <p className="text-[11px] text-slate-500">
                Across all guest reservations
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Average Rating</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-850 flex items-center gap-2">
                <span>{reviewStats.avg}</span>
                <span className="text-xs text-amber-500 font-sans font-bold flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(Number(reviewStats.avg))
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Out of 5.0 maximum score
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">5-Star Ratings</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 flex items-center gap-2">
                <span>{reviewStats.fiveStars}</span>
                <span className="text-xs font-sans font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {reviewStats.total > 0 ? `${Math.round((reviewStats.fiveStars / reviewStats.total) * 100)}%` : '0%'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Top rated guest stays
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Other Ratings</span>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-850">
                {reviewStats.fourStars + reviewStats.threeOrLess}
              </div>
              <p className="text-[11px] text-slate-500">
                {reviewStats.fourStars} (4★) · {reviewStats.threeOrLess} (≤3★)
              </p>
            </div>
          </div>

          {/* Search, Rating Filter & Action Header */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Guest Reviews &amp; Feedback Management</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View, filter, audit, and permanently delete guest testimonials and feedback submissions.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Showing <span className="font-bold text-slate-850">{filteredReviews.length}</span> of {feedbacks.length} Reviews
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by reviewer name, contact email/phone, or review keywords..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                {reviewSearch && (
                  <button
                    onClick={() => setReviewSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Star Rating Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={reviewRatingFilter}
                  onChange={(e) => setReviewRatingFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer w-full md:w-auto"
                >
                  <option value="all">All Star Ratings (★ 1-5)</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars Only</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                  <option value="3">⭐⭐⭐ 3 Stars</option>
                  <option value="2">⭐⭐ 2 Stars</option>
                  <option value="1">⭐ 1 Star</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Guest Reviews Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {reviewSearch || reviewRatingFilter !== 'all'
                  ? 'No reviews match your current search or star filter criteria. Try clearing your filters.'
                  : 'No reviews have been submitted by guests yet. When guests submit ratings from the guest view, they will appear here for admin moderation.'}
              </p>
              {(reviewSearch || reviewRatingFilter !== 'all') && (
                <button
                  onClick={() => {
                    setReviewSearch('');
                    setReviewRatingFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Review Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((review) => {
                const initial = (review.userName || 'G').charAt(0).toUpperCase();
                const formattedDate = review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Recent Stay';

                return (
                  <div
                    key={review.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-850">
                              {review.userName || 'Verified Guest'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200/60 rounded-full">
                              Verified
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                            {review.userEmail && <span>{review.userEmail}</span>}
                            <span>•</span>
                            <span className="text-slate-400">{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold font-mono text-amber-900">
                            {review.rating}.0
                          </span>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (review.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Comment Body */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 text-slate-700 text-xs leading-relaxed italic relative">
                      <span className="text-slate-300 font-serif text-lg leading-none absolute top-2 left-2 select-none">“</span>
                      <p className="pl-3.5 relative z-10 font-normal">
                        {review.comment || 'No written text comment provided.'}
                      </p>
                    </div>

                    {/* Footer Actions: ID & Delete Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {review.id}
                      </span>

                      <button
                        onClick={() => handleDeleteReview(review)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px]"
                        title="Delete this guest review permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SYSTEM SETTINGS & PROPERTY AUDIT */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          {/* FEATURE: WEBSITE GUEST VIEW LOGO & BRANDING MANAGEMENT */}
          <div id="admin-guest-logo-settings-card" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                      <span>Website Guest View Logo &amp; Branding</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        logoShowToggle 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {logoShowToggle ? '● Logo Active on Website' : '○ Logo Hidden'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add, remove, or customize the brand emblem and logo image displayed to visitors on the guest portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instant Quick Visibility Switch */}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">
                  {logoShowToggle ? 'Logo Visible' : 'Logo Removed'}
                </span>
                <button
                  id="admin-toggle-guest-logo-btn"
                  type="button"
                  onClick={() => handleToggleLogoVisibilityQuick(!logoShowToggle)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    logoShowToggle ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                  title={logoShowToggle ? 'Click to Remove Logo from Guest View' : 'Click to Add/Show Logo in Guest View'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      logoShowToggle ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Logo Configuration Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Logo Display Toggle Banner */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  logoShowToggle 
                    ? 'bg-amber-50/50 border-amber-200/80 text-amber-950' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        {logoShowToggle ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>Logo is currently enabled for guest visitors</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-slate-500" />
                            <span>Logo is currently removed / hidden</span>
                          </>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {logoShowToggle
                          ? 'Guests will see the selected emblem or custom logo photo in the navigation bar and footer.'
                          : 'Guests will only see the text brand name without any icon or image logo in the header and footer.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleLogoVisibilityQuick(!logoShowToggle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        logoShowToggle 
                          ? 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {logoShowToggle ? 'Remove Logo' : 'Add Logo'}
                    </button>
                  </div>
                </div>

                {/* Logo Upload Box */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Upload Logo File
                      </label>
                      {logoUrlInput && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          Logo Selected
                        </span>
                      )}
                    </div>

                    {logoUrlInput ? (
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg border border-amber-300 bg-slate-50 p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={logoUrlInput}
                              alt="Uploaded logo"
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Custom Logo Loaded</div>
                            <div className="text-[10px] text-slate-500">Ready to publish on live website</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition">
                            <span>Change</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoFileUpload(file);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setLogoUrlInput('')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg cursor-pointer transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl transition text-center group">
                        <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100 text-amber-700 flex items-center justify-center mb-2 transition">
                          {isUploadingLogo ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <label className="cursor-pointer">
                          <span className="text-xs font-bold text-[#0e2b33] group-hover:text-amber-700 underline underline-offset-2">
                            {isUploadingLogo ? 'Processing photo...' : 'Choose Logo File (PNG, SVG, JPG, WebP)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoFileUpload(file);
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Recommended: Square or horizontal transparent PNG / SVG icon (approx 200×200px).
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save & Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="admin-save-guest-logo-btn"
                    type="button"
                    disabled={isSavingLogo}
                    onClick={handleSaveLogoSettings}
                    className="w-full sm:w-auto px-6 py-3 bg-[#af8a52] hover:bg-[#8c6736] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSavingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Check className="w-4 h-4 text-white" />
                    )}
                    <span>{isSavingLogo ? 'Publishing Changes...' : 'Save & Publish to Live Guest View'}</span>
                  </button>

                  {logoUrlInput && (
                    <button
                      type="button"
                      onClick={() => setLogoUrlInput('')}
                      className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Live Guest View Preview Showcase */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Guest View Preview</span>
                    </span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                      Real-time
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live simulation of the navigation bar and footer as viewed by guests.
                  </p>
                </div>

                {/* 1. Simulated Guest Navbar (Light Background) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Header Navbar (Light)
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-slate-900">
                    <div className="flex items-center gap-2.5">
                      {logoShowToggle && logoUrlInput ? (
                        <img
                          src={logoUrlInput}
                          alt="Preview Logo"
                          className="w-8 h-8 rounded-md object-contain border border-[#af8a52]/40 bg-white shadow-xs"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                          ◆
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-serif text-xs font-bold text-[#0e2b33] tracking-tight leading-tight">
                          ISLAMIA GUEST HOUSE
                        </span>
                        <span className="text-[7.5px] tracking-[0.2em] text-[#af8a52] font-semibold uppercase">
                          DHANMONDI, DHAKA
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                      <span className="hidden sm:inline">Rooms • Philosophy • Reviews</span>
                    </div>
                  </div>
                </div>

                {/* 2. Simulated Guest Footer (Luxury Dark Background) */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Footer Brand Block (Dark)
                  </div>
                  <div className="bg-[#081b21] p-3.5 rounded-xl border border-[#0e2b33] shadow-inner text-[#f8f4ec]">
                    <div className="font-serif text-xs text-[#af8a52] font-semibold tracking-wide mb-1 flex items-center gap-2">
                      {logoShowToggle && logoUrlInput ? (
                        <img
                          src={logoUrlInput}
                          alt="Footer Logo"
                          className="w-5 h-5 rounded object-contain border border-[#d7bd8a]/40 bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[#af8a52] text-xs">◆</span>
                      )}
                      <span>ISLAMIA GUEST HOUSE</span>
                    </div>
                    <p className="text-[9px] text-[#efe8d8]/60 leading-relaxed">
                      Dhanmondi Road 9/A. Homely luxury and security.
                    </p>
                  </div>
                </div>

                {/* Information Status Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Persistence: Firestore + Offline Cache</span>
                  <span className="text-amber-400 font-semibold">
                    {logoShowToggle ? (logoUrlInput ? '✓ Custom Logo Active' : '✓ Active') : '✕ Logo Hidden'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    Property Address (Dhanmondi)
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
                  onClick={() => {
                    localStorage.setItem('property_address', propertyAddress);
                    localStorage.setItem('property_hotline', propertyHotline);
                    showToast({ type: 'success', message: 'Property metadata & address saved successfully.' });
                  }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Admin Password Management Settings Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-850 flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Admin Password Management</span>
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded-md font-semibold">
                  Firebase Auth
                </span>
              </h3>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password (Min. 6 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Admin Password'}</span>
                </button>
              </form>
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

      {/* Change Admin Password Standalone Modal Dialog */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Change Executive Admin Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Re-authenticate with your current password to update your Firebase Authentication credentials securely.
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (Min. 6 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUpdatingPassword ? 'Updating...' : 'Save Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR New Room Section / Add Room Modal Dialog */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  <span>HR Room Section: Add New Guest Chamber</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure chamber specifications, amenities, bed configuration, toilet type, and nightly tariffs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoomOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Preset Template Bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Template Presets (Click to Auto-fill):</span>
                </span>
                <span className="text-[10px] text-slate-400">6 Standard Configurations</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyRoomPreset('double_deluxe')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Double Deluxe</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳2,000 · 4 Persons</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRoomPreset('family')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Family Room</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳2,000 · 2A + 2C</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRoomPreset('executive_single')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Double - Exec Single</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳1,500 · 1/2 Persons</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRoomPreset('triple')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Triple Room</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳1,800 · 3 Persons</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRoomPreset('standard_double')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Standard Double</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳1,700 · 2A + 1C</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRoomPreset('single_economy')}
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Single - Economy</div>
                  <div className="text-[10px] font-mono text-teal-600 font-semibold">৳700 · 1 Person</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={newRoomNo}
                    onChange={(e) => setNewRoomNo(e.target.value)}
                    placeholder="e.g. 101, 204, 305"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Title *</label>
                  <input
                    type="text"
                    required
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    placeholder="e.g. Double Deluxe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Code *</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-900"
                  >
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                    <option value="double">Double</option>
                    <option value="single">Single</option>
                    <option value="family">Family</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nightly Tariff (৳ BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newRoomPrice || ''}
                    onChange={(e) => setNewRoomPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono font-bold text-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guest Capacity (Max Count) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity Display Text</label>
                  <input
                    type="text"
                    value={newRoomCapacityText}
                    onChange={(e) => setNewRoomCapacityText(e.target.value)}
                    placeholder="e.g. Capacity 4 people"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Room Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    value={newRoomBedSize}
                    onChange={(e) => setNewRoomBedSize(e.target.value)}
                    placeholder="e.g. Double + Double Bed"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Window Direction / Facing</label>
                  <input
                    type="text"
                    value={newRoomWindows}
                    onChange={(e) => setNewRoomWindows(e.target.value)}
                    placeholder="e.g. West & South Facing"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Toilet / Washroom Type</label>
                  <select
                    value={newRoomToilet}
                    onChange={(e) => setNewRoomToilet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Private High Commode Toilet">Private High Commode Toilet</option>
                    <option value="Private Pan Toilet">Private Pan Toilet</option>
                    <option value="Common Pan Toilet">Common Pan Toilet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Extra Facilities / Tag</label>
                  <input
                    type="text"
                    value={newRoomExtra}
                    onChange={(e) => setNewRoomExtra(e.target.value)}
                    placeholder="e.g. Cloth Rack & All Facilities, Balcony"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price Tag / Banner</label>
                  <input
                    type="text"
                    value={newRoomStartingPriceBanner}
                    onChange={(e) => setNewRoomStartingPriceBanner(e.target.value)}
                    placeholder="e.g. Standard Rate, Family Special"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room Photo (Upload from Computer or Image URL)</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="admin-new-room-photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await processUploadedImage(file);
                            setNewRoomImg(dataUrl);
                            showToast({ type: 'success', message: '📸 Room photo uploaded from computer!' });
                          } catch (err) {
                            showToast({ type: 'error', message: 'Failed to process image.' });
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="admin-new-room-photo-upload"
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition shrink-0 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from PC</span>
                    </label>
                  </div>

                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="text"
                      value={newRoomImg}
                      onChange={(e) => setNewRoomImg(e.target.value)}
                      placeholder="Or enter Image URL..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-700 font-mono"
                    />
                    {newRoomImg && (
                      <img 
                        src={newRoomImg} 
                        alt="Preview" 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Chamber Description</label>
                <textarea
                  rows={3}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="e.g. Capacity 4 people, Double + Double Bed, West & South Facing, Private High Commode Toilet, TV, Free WiFi, Refrigerator..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Create &amp; Publish Room
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

      {/* Delete Staff / Join Request Modal */}
      {userPendingDeletion && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {userPendingDeletion.hrApproved ? 'Delete Staff Account' : 'Delete Staff Join Request'}
                </h3>
                <p className="text-xs text-slate-500">Confirm permanent removal from system registry</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{userPendingDeletion.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800 font-medium">{userPendingDeletion.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role &amp; Status:</span>
                <span className="font-semibold text-slate-800">
                  {userPendingDeletion.role.toUpperCase()} • {userPendingDeletion.hrApproved ? 'HR Authorized' : 'Pending Join Request'}
                </span>
              </div>
              {userPendingDeletion.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono text-slate-800">{userPendingDeletion.phone}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl p-3">
              ⚠️ This action will immediately remove this user account from the Islamia Guest House system and reject any active access.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserPendingDeletion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingEmail === userPendingDeletion.email}
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoadingEmail === userPendingDeletion.email ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm &amp; Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
