/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Booking, ServiceRequest } from './types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: '101',
    number: '101',
    type: 'deluxe',
    price: 2500,
    status: 'available',
    capacity: 4,
    capacityText: '4 Adults',
    bedSize: 'Double + Double',
    windows: 'West & South Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity', 'Stand Lamp', 'Sofa', 'AC/Non-AC'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Double Deluxe room with spacious layout featuring two double beds, dual aspect windows, and complete luxury amenities for up to 4 adults.'
  },
  {
    id: '102',
    number: '102',
    type: 'suite',
    price: 2800,
    status: 'available',
    capacity: 4,
    capacityText: '2 Adults + 2 Children',
    bedSize: 'Double + Semi Double',
    windows: 'West & North Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity', 'Stand Lamp', 'Sofa'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Family Room designed for serene family stays with a double and semi-double bed arrangement, private high commode, and full essential comforts.'
  },
  {
    id: '103',
    number: '103',
    type: 'double',
    price: 1800,
    status: 'available',
    capacity: 2,
    capacityText: '2 / 1 Adults',
    bedSize: 'Queen Size',
    windows: 'East & North Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity', 'Stand Lamp', 'Sofa', 'AC/Non-AC'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Executive Single / Double room offering a queen size bed, peaceful dual windows, sofa seating, and flexible climate choices.'
  },
  {
    id: '201',
    number: '201',
    type: 'deluxe',
    price: 2200,
    status: 'available',
    capacity: 3,
    capacityText: '3 Adults',
    bedSize: 'Double + Single',
    windows: 'West & South Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity', 'Stand Lamp', 'Sofa', 'Balcony', 'AC/Non-AC'],
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    description: 'Triple Room accommodating 3 adults with a double plus single bed setup, sunny private balcony, and private high commode toilet.'
  },
  {
    id: '202',
    number: '202',
    type: 'double',
    price: 1600,
    status: 'available',
    capacity: 3,
    capacityText: '2 Adults + 1 Child (Below 6)',
    bedSize: 'King Size',
    windows: 'East & South Facing',
    toilet: 'Private Toilet (Pan)',
    extra: 'Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity', 'Stand Lamp', 'Sofa', 'Balcony', 'AC/Non-AC'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'Standard Double room with a king size bed, breezy balcony, pan toilet, and comfortable sofa for couples or small families.'
  },
  {
    id: '301',
    number: '301',
    type: 'single',
    price: 700,
    status: 'available',
    capacity: 1,
    capacityText: '1 Adult',
    bedSize: "Single (3'/7')",
    windows: 'East Facing',
    toilet: 'Common Toilet (Pan)',
    startingPriceBanner: 'Starts from 700/- (*T&C Apply)',
    extra: 'Cloth Rack',
    amenities: ['Free WiFi', 'Common Refrigeration', 'Tea Table', '24/7 Electricity'],
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: 'Economy Single room tailored for solo travelers or medical visits on a budget. Includes essential WiFi, electricity, and tea table.'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    roomId: '101',
    userId: 'mock-user-1',
    guestName: 'Robert Sterling',
    guestEmail: 'robert.sterling@example.com',
    guestPhone: '+1 (555) 321-9876',
    checkIn: '2026-08-01',
    checkOut: '2026-08-07',
    totalAmount: 15000,
    status: 'checked-in',
    notes: 'Medical visit to Ibne Sina Hospital.',
    createdAt: '2026-07-15T14:32:00Z'
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
