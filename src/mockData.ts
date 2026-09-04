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
    image: 'https://i.ibb.co/tPkNrFV6/photo-2026-08-13-17-56-33-3.jpg',
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
    image: 'https://i.ibb.co/s91PjrHs/photo-2026-08-13-17-56-33.jpg',
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
    image: 'https://i.ibb.co/k2y1Ns91/photo-2026-08-13-17-56-34.jpg',
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
    image: 'https://i.ibb.co/XfqjpY6Z/photo-2026-08-13-17-56-33-2.jpg',
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
    image: 'https://i.ibb.co/DPjJC14G/photo-2026-08-13-17-56-33-4.jpg',
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
    image: 'https://i.ibb.co/xSMv6cmn/photo-2026-08-13-17-56-34-2.jpg',
    description: 'Single - Economy tailored for solo travellers, offering essential comfort, ceiling fan, clean linen, and 24/7 electricity.'
  }
];

export const INITIAL_ROOMS: Room[] = OFFICIAL_ROOM_TEMPLATES.map((tmpl, idx) => ({
  ...tmpl,
  id: tmpl.number || String(idx + 101)
}));

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_SERVICES: ServiceRequest[] = [];
