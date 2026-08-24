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
    title: 'Double Deluxe',
    price: 2000,
    status: 'available',
    capacity: 4,
    capacityText: 'Capacity 4 People',
    bedSize: 'Double + Double Bed',
    windows: 'West & South Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Cloth Rack & All Facilities',
    amenities: ['TV', 'Free WiFi', 'Refrigerator', 'AC/Non-AC', '24/7 Electricity', 'Tea Table', 'Stand Lamp', 'Sofa', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Double Deluxe (৳2000/night): Capacity 4 people, Double + Double Bed, West & South Facing, Private High Commode Toilet, TV, Free WiFi, Refrigerator, AC/Non-AC and all facilities.'
  },
  {
    id: '102',
    number: '102',
    type: 'suite',
    title: 'Family Room',
    price: 2000,
    status: 'available',
    capacity: 4,
    capacityText: '2 Adults + 2 Children',
    bedSize: 'Double + Semi Double Bed',
    windows: 'West & North Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Sofa & Cloth Rack',
    amenities: ['TV', 'Free WiFi', 'Refrigerator', 'Sofa', '24/7 Electricity', 'Tea Table', 'Stand Lamp', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Family Room (৳2000/night): Capacity 2 adults + 2 children, Double + Semi Double Bed, West & North Facing, Private High Commode Toilet and Sofa.'
  },
  {
    id: '103',
    number: '103',
    type: 'double',
    title: 'Double - Executive Single',
    price: 1500,
    status: 'available',
    capacity: 2,
    capacityText: '1/2 People',
    bedSize: 'Queen Size Bed',
    windows: 'East & North Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'AC/Non-AC Option',
    amenities: ['TV', 'Free WiFi', 'AC/Non-AC Option', 'Refrigerator', 'Sofa', '24/7 Electricity', 'Tea Table', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Double - Executive Single (৳1500/night): Capacity 1/2 people, Queen Size Bed, East & North Facing, Private High Commode Toilet, AC/Non-AC option.'
  },
  {
    id: '201',
    number: '201',
    type: 'triple',
    title: 'Triple Room',
    price: 1800,
    status: 'available',
    capacity: 3,
    capacityText: '3 People',
    bedSize: 'Double + Single Bed',
    windows: 'West & South Facing',
    toilet: 'Private High Commode Toilet',
    extra: 'Balcony & Full Facilities',
    amenities: ['TV', 'Free WiFi', 'Balcony', 'Refrigerator', 'AC/Non-AC', '24/7 Electricity', 'Tea Table', 'Sofa', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    description: 'Triple Room (৳1800/night): Capacity 3 people, Double + Single Bed, West & South Facing, Private High Commode Toilet, Balcony and full facilities.'
  },
  {
    id: '202',
    number: '202',
    type: 'double',
    title: 'Standard Double',
    price: 1700,
    status: 'available',
    capacity: 3,
    capacityText: '2 People + 1 Child (below 6 years)',
    bedSize: 'King Size Bed',
    windows: 'East & South Facing',
    toilet: 'Private Pan Toilet',
    extra: 'Private Pan Toilet & Balcony',
    amenities: ['TV', 'Free WiFi', 'Balcony', 'AC/Non-AC', 'Sofa', '24/7 Electricity', 'Tea Table', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'Standard Double (৳1700/night): Capacity 2 people + 1 child (below 6 years), King Size Bed, East & South Facing, Private Pan Toilet and Balcony.'
  },
  {
    id: '301',
    number: '301',
    type: 'single',
    title: 'Single - Economy',
    price: 700,
    status: 'available',
    capacity: 1,
    capacityText: '1 Person',
    bedSize: "Single Bed (3' / 7')",
    windows: 'East Facing',
    toilet: 'Common Pan Toilet',
    startingPriceBanner: 'Starts from ৳700/night',
    extra: 'WiFi & 24/7 Electricity Facilities',
    amenities: ['Free WiFi', '24/7 Electricity', 'Common Refrigeration', 'Tea Table', 'Cloth Rack'],
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: "Single - Economy (৳700/night): Capacity 1 person, Single Bed (3' / 7'), East Facing, Common Pan Toilet, WiFi and 24/7 electricity facilities."
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
