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

// Firebase Firestore Imports for Real-Time Presence & Direct HR Operations
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file.'));
      return;
    }

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

  // Local state for Real-time Firestore Staff Presence
  const [liveStaffProfiles, setLiveStaffProfiles] = useState<Record<string, any>>({});

  // 1. REAL-TIME FIRESTORE LISTENER FOR ONLINE PRESENCE
  useEffect(() => {
    if (!db) return;
    const staffRef = collection(db, 'staff_profiles');
    const unsubscribe = onSnapshot(staffRef, (snapshot) => {
      const profiles: Record<string, any> = {};
      snapshot.forEach((docSnapshot) => {
        profiles[docSnapshot.id] = docSnapshot.data();
      });
      setLiveStaffProfiles(profiles);
    }, (error) => {
      console.error("Error listening to live staff presence:", error);
    });

    return () => unsubscribe();
  }, []);

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'chambers' | 'reservations' | 'reviews' | 'settings'>('analytics');

  // Password Change States
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

  // Passcode & Filters
  const [editingPasscode, setEditingPasscode] = useState<string>(masterStaffPasscode || 'ISLAMIA-STAFF-2026');
  const [isEditingPasscode, setIsEditingPasscode] = useState<boolean>(false);
  const [staffFilterTab, setStaffFilterTab] = useState<'all' | 'online' | 'pending' | 'admins' | 'staff'>('all');

  const [staffSearch, setStaffSearch] = useState<string>('');
  const [chamberSearch, setChamberSearch] = useState<string>('');
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [ledgerSelectedDate, setLedgerSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Chamber State
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
    'Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Refrigerator', 'Private High Commode Toilet', '24/7 Power Backup'
  ]);
  const [newRoomDesc, setNewRoomDesc] = useState<string>('Capacity 4 people, Double + Double Bed, West & South Facing, Private High Commode Toilet, TV, Free WiFi, Refrigerator, AC/Non-AC and all facilities.');
  const [newRoomImg, setNewRoomImg] = useState<string>('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800');

  // Deletion Modal
  const [userPendingDeletion, setUserPendingDeletion] = useState<UserProfile | null>(null);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);

  // 2. DIRECT HR ACTIONS WITH FIRESTORE
  const handleApproveStaff = async (user: UserProfile) => {
    setActionLoadingEmail(user.email);
    try {
      await updateStaffApproval(user.email, true, user.uid);
      if (user.uid && db) {
        await updateDoc(doc(db, "staff_profiles", user.uid), { hrApproved: true }).catch(() => {});
      }
      showToast({ type: 'success', message: `✅ Approved staff request for ${user.name}` });
    } catch (e) {
      showToast({ type: 'error', message: `Could not approve ${user.name}` });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!userPendingDeletion) return;
    const user = userPendingDeletion;
    setActionLoadingEmail(user.email);
    try {
      await deleteStaffAccount(user.email, user.uid);
      if (user.uid && db) {
        await deleteDoc(doc(db, "staff_profiles", user.uid)).catch(() => {});
      }
      showToast({ type: 'info', message: `🗑️ ${user.name} removed permanently.` });
    } catch (e) {
      showToast({ type: 'error', message: `Failed to delete ${user.name}` });
    } finally {
      setActionLoadingEmail(null);
      setUserPendingDeletion(null);
    }
  };

  // Helper for live online status check
  const isUserOnline = (u: UserProfile) => {
    if (u.uid && liveStaffProfiles[u.uid]) {
      return liveStaffProfiles[u.uid].isOnline === true;
    }
    if (u.isOnline) return true;
    if (currentUser?.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) return true;
    if (u.email.toLowerCase() === 'islamiaguesthouse@gmail.com') return true;
    return false;
  };

  // Filtered Users
  const filteredStaff = useMemo(() => {
    return registeredUsers.map(u => {
      const online = isUserOnline(u);
      return online ? { ...u, isOnline: true } : u;
    }).filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(staffSearch.toLowerCase());

      if (!matchesSearch) return false;
      if (staffFilterTab === 'online') return isUserOnline(u);
      if (staffFilterTab === 'pending') return u.role === 'staff' && !u.hrApproved;
      if (staffFilterTab === 'admins') return u.role === 'admin';
      if (staffFilterTab === 'staff') return u.role === 'staff';
      return true;
    });
  }, [registeredUsers, staffSearch, staffFilterTab, liveStaffProfiles]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" /> Administrative Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time Staff Presence, HR Authorizations & Room Management
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
          {(['analytics', 'staff', 'chambers', 'reservations', 'reviews', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Staff & HR Management Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Staff & Authorization Registry
            </h2>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Staff List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">HR Gate</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredStaff.map((user) => {
                  const online = isUserOnline(user);
                  return (
                    <tr key={user.uid || user.email} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        <div>{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3">
                        {online ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            LIVE ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {user.hrApproved ? (
                          <span className="text-green-600 flex items-center gap-1 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Approved
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1 text-xs font-medium">
                            <Clock className="w-4 h-4" /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {!user.hrApproved && (
                          <button
                            onClick={() => handleApproveStaff(user)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setUserPendingDeletion(user)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userPendingDeletion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete User Account?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete access for <b>{userPendingDeletion.name}</b>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserPendingDeletion(null)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
