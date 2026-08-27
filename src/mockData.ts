/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Booking, ServiceRequest } from './types';

export interface RoomTemplate extends Omit<Room, 'id'> {
  templateKey: string;
}

export const OFFICIAL_ROOM_TEMPLATES: RoomTemplate[] = [
  {
    templateKey: 'triple-room-101',
    number: '101',
    title: 'Triple Room',
    type: 'suite',
    price: 2200,
    status: 'available',
    capacity: 3,
    capacityText: 'Capacity 3 people',
    bedSize: 'Double + Single Bed',
    windows: 'West & South Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Group Saver',
    startingPriceBanner: 'Group Saver',
    amenities: [
      'Free High-Speed Wi-Fi',
      'Air Conditioning',
      'Private Balcony',
      'Private High Commode Toilet',
      'Flat-screen TV',
      '24/7 Electricity'
    ],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Triple Room accommodating 3 people with a Double + Single Bed setup, sunny private balcony, and private high commode toilet.'
  },
  {
    templateKey: 'family-room-102',
    number: '102',
    title: 'Family Room',
    type: 'suite',
    price: 2500,
    status: 'available',
    capacity: 4,
    capacityText: 'Capacity 2 adults + 2 children',
    bedSize: 'Double + Semi Double Bed',
    windows: 'West & North Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Family Special',
    startingPriceBanner: 'Family Special',
    amenities: [
      'Free High-Speed Wi-Fi',
      'Air Conditioning',
      'Flat-screen TV',
      'Comfortable Sofa',
      'Private High Commode Toilet',
      '24/7 Electricity'
    ],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Family Room designed for serene family stays with Double + Semi Double beds, comfortable sofa, and cloth rack.'
  },
  {
    templateKey: 'standard-double-301',
    number: '301',
    title: 'Standard Double',
    type: 'double',
    price: 1600,
    status: 'available',
    capacity: 3,
    capacityText: 'Capacity 2 people + 1 child (below 6 years)',
    bedSize: 'King Size Bed',
    windows: 'East & South Facing',
    toilet: 'Private Pan Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Standard Value',
    startingPriceBanner: 'Standard Value',
    amenities: [
      'Free High-Speed Wi-Fi',
      'King Size Bed',
      'Private Balcony',
      'Private Pan Toilet',
      'Air Conditioning',
      '24/7 Electricity'
    ],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'Standard Double room featuring a King Size bed, East & South facing windows, private balcony, and private pan toilet.'
  },
  {
    templateKey: 'double-deluxe-302',
    number: '302',
    title: 'Double Deluxe',
    type: 'deluxe',
    price: 2800,
    status: 'available',
    capacity: 4,
    capacityText: 'Capacity 4 people',
    bedSize: 'Double + Double Bed',
    windows: 'West & South Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Standard Rate',
    startingPriceBanner: 'Standard Rate',
    amenities: [
      'Free High-Speed Wi-Fi',
      'Air Conditioning',
      'Flat-screen TV',
      'Refrigerator',
      'Private High Commode Toilet',
      '24/7 Power Backup'
    ],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Double Deluxe room with two double beds, refrigerator, flat-screen TV, and private high commode for up to 4 guests.'
  },
  {
    templateKey: 'double-executive-304',
    number: '304',
    title: 'Double - Executive Single',
    type: 'double',
    price: 1800,
    status: 'available',
    capacity: 2,
    capacityText: 'Capacity 1/2 people',
    bedSize: 'Queen Size Bed',
    windows: 'East & North Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Executive Deal',
    startingPriceBanner: 'Executive Deal',
    amenities: [
      'Free High-Speed Wi-Fi',
      'Air Conditioning / Non-AC Option',
      'Flat-screen TV',
      'Private High Commode Toilet',
      'Work Desk',
      '24/7 Electricity'
    ],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Double - Executive Single with Queen Size bed, work desk, and flexible AC/Non-AC options.'
  },
  {
    templateKey: 'single-economy-305',
    number: '305',
    title: 'Single - Economy',
    type: 'single',
    price: 700,
    status: 'available',
    capacity: 1,
    capacityText: 'Capacity 1 person',
    bedSize: "Single Bed (3' / 7')",
    windows: 'East Facing',
    toilet: 'Common Pan Toilet',
    extra: 'Cloth Rack',
    promoTag: 'Budget Choice',
    startingPriceBanner: 'Budget Choice',
    amenities: [
      'Free High-Speed Wi-Fi',
      '24/7 Electricity',
      'Common Pan Toilet',
      'Ceiling Fan',
      'Clean Linen'
    ],
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: 'Single - Economy tailored for solo travellers, offering essential comfort, ceiling fan, clean linen, and 24/7 electricity.'
  }
];

export const INITIAL_ROOMS: Room[] = OFFICIAL_ROOM_TEMPLATES.map((tmpl, idx) => ({
  ...tmpl,
  id: tmpl.number || String(idx + 101)
}));

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    roomId: '101',
    userId: 'mock-user-1',
    guestName: 'Md. Rafiqul Islam',
    guestEmail: 'rafiqul.islam@example.com',
    guestPhone: '01832-841818',
    checkIn: '2026-08-01',
    checkOut: '2026-08-07',
    totalAmount: 15000,
    status: 'checked-in',
    notes: 'Medical visit to Ibne Sina Hospital.',
    createdAt: '2026-07-15T14:32:00Z'
  },
  {
    id: 'B002',
    roomId: '102',
    userId: 'mock-user-2',
    guestName: 'Farhana Chowdhury',
    guestEmail: 'farhana.chowdhury@example.com',
    guestPhone: '01712-345678',
    checkIn: '2026-08-10',
    checkOut: '2026-08-14',
    totalAmount: 10000,
    status: 'checked-out',
    notes: 'Family visit in Dhanmondi.',
    createdAt: '2026-07-20T10:15:00Z'
  },
  {
    id: 'B003',
    roomId: '302',
    userId: 'mock-user-3',
    guestName: 'Tanvir Ahmed',
    guestEmail: 'tanvir.ahmed@example.com',
    guestPhone: '01909-806960',
    checkIn: '2026-08-15',
    checkOut: '2026-08-18',
    totalAmount: 8400,
    status: 'confirmed',
    notes: 'Executive corporate guest.',
    createdAt: '2026-07-22T12:00:00Z'
  }
];

export const INITIAL_SERVICES: ServiceRequest[] = [
  {
    id: 'SR001',
    roomId: '101',
    type: 'room-service',
    description: 'Request for clean drinking water bottle and extra towel set.',
    status: 'pending',
    createdAt: '2026-08-03T00:10:00Z'
  }
];
