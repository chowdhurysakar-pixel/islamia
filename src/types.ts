/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomType = 'single' | 'double' | 'suite' | 'deluxe';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';
export type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
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
  staffSecretKey?: string;
  hrApproved?: boolean;
}

export interface ToastInfo {
  message: string;
  type: 'success' | 'info' | 'warning' | 'email';
  duration?: number;
  emailAction?: {
    recipient: string;
    subject: string;
    body: string;
    mailtoUrl: string;
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

