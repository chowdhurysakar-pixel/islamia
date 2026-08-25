/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
    if (u.isOnline) return true;
    if (currentUser?.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) return true;
    if (u.email.toLowerCase() === 'islamiaguesthouse@gmail.com') return true;
    if (u.lastActiveAt) {
      const diff = Date.now() - new Date(u.lastActiveAt).getTime();
      if (diff < 10 * 60 * 1000) return true;
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
  }, [registeredUsers, staffSearch, staffFilterTab, currentUser]);

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
    const parsedCapacity = Number
