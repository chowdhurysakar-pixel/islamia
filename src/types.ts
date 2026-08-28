/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomType = 'single' | 'double' | 'suite' | 'deluxe';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';
export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'checked_out' | 'cancelled';
export type ServiceRequestType = 'housekeeping' | 'room-service' | 'maintenance' | 'concierge';
export type ServiceRequestStatus = 'pending' | 'in-progress' | 'completed';
export type UserRole = 'admin' | 'staff' | 'guest';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  status: RoomStatus;
  capacity: number;
  title?: string;
  capacityText?: string;
  bedSize?: string;
  windows?: string;
  toilet?: string;
  extra?: string;
  startingPriceBanner?: string;
  promoTag?: string;
  amenities: string[];
  image: string;
  description: string;
  images?: string[];
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber?: string;
  roomType?: string;
  userId?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  nidNumber?: string;
  upazila?: string;
  zila?: string;
  additionalGuests?: { name: string; phone: string; }[];
  referenceName?: string;
  kids?: { name: string; age: string; }[];
  expectedPersonCount?: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  totalAmount: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string; // ISO String or similar
  checkedOutAt?: string;
  checkedOutByStaffId?: string;
  finalBillAmount?: number;
  paymentStatus?: 'pending' | 'paid' | 'unpaid' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'bKash' | 'other';
}

export interface ServiceRequest {
  id: string;
  roomId: string;
  type: ServiceRequestType;
  description: string;
  status: ServiceRequestStatus;
  createdAt: string; // ISO String or similar
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  password?: string;
  staffSecretKey?: string;
  hrApproved?: boolean;
  emailVerified?: boolean;
  registeredAt?: string;
  isOnline?: boolean;
  lastLoginAt?: string;
  lastActiveAt?: string;
  loginMethod?: 'passcode' | 'password' | 'google' | 'master_key' | 'offline';
  deviceInfo?: string;
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'warning' | 'email' | 'sms';
  duration?: number;
  emailAction?: {
    recipient: string;
    subject: string;
    body: string;
    mailtoUrl: string;
  };
  smsAction?: {
    phoneNumber: string;
    smsText: string;
    smsUrl: string;
    whatsappUrl: string;
    bookingId?: string;
    guestName?: string;
  };
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BrandingSetting {
  logo: string; // Base64 data URL of uploaded image
  updatedAt?: string;
  updatedBy?: string;
}

export interface SEOSetting {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  hotelName: string;
  address: string;
  phone: string;
  googleMapUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

