/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Booking, ServiceRequest } from './types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: '101',
    number: '101',
    type: 'single',
    price: 125,
    status: 'available',
    capacity: 1,
    amenities: ['Free High-Speed Wi-Fi', 'Smart TV with Streaming', 'Plush Ergonomic Desk', 'Premium Eco-friendly Toiletries', 'Nespresso Coffee Maker'],
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: 'A cozy, modern retreat tailored for solo leisure or corporate travelers. Features a snug queen-size bed, sleek work desk, and a modern walk-in rain shower designed for absolute relaxation.'
  },
  {
    id: '102',
    number: '102',
    type: 'double',
    price: 185,
    status: 'available',
    capacity: 2,
    amenities: ['Free High-Speed Wi-Fi', 'Full Balcony', 'Mini-fridge & Bar', 'In-room Electronic Safe', 'Plush Robes & Slippers', 'Air Conditioning'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Spacious and beautifully curated, this room offers premium comfort for couples. Boasts a grand king-size bed, a private sunlit balcony overlooking garden landscapes, and a fully stocked minibar.'
  },
  {
    id: '201',
    number: '201',
    type: 'suite',
    price: 380,
    status: 'occupied',
    capacity: 4,
    amenities: ['Free High-Speed Wi-Fi', 'Separate Living Salon', 'Kitchenette with Espresso Hub', 'Sound System', 'Bespoke In-room Dining', 'Soaking Bathtub'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Our luxurious signature suite offers a separate master bedroom and an expansive open salon. Complemented by designer mid-century furniture, deep copper soaking tub, and custom-ordered standard services.'
  },
  {
    id: '202',
    number: '202',
    type: 'deluxe',
    price: 245,
    status: 'cleaning',
    capacity: 2,
    amenities: ['Free High-Speed Wi-Fi', 'Spacious Sea View', 'Mini-fridge & Bar', 'Hammock Patio', 'Smart TV with Streaming', 'Bluetooth Speaker'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'A gorgeous escape with sweeping panoramic ocean vistas. Open your glass sliders to a breezy private patio equipped with a hammock, pristine wicker seating, and premium sound equipment.'
  },
  {
    id: '301',
    number: '301',
    type: 'suite',
    price: 650,
    status: 'maintenance',
    capacity: 6,
    amenities: ['Free High-Speed Wi-Fi', 'Private Outdoor Jacuzzi', 'Personal 24/7 Concierge', 'Cocktail Bar Lounge', 'Walk-in Wardrobes', 'Steam Shower Sauna'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'The crowning jewel of our estate, featuring grand floor-to-ceiling windows. Accompanied by three grand suites, private dining tables, and a private outdoor jacuzzi overlooking our infinity-edge ocean pool.'
  },
  {
    id: '302',
    number: '302',
    type: 'deluxe',
    price: 220,
    status: 'available',
    capacity: 3,
    amenities: ['Free High-Speed Wi-Fi', 'Twin Queen Beds', 'Plush Lounge Seating', 'In-room Desk', 'Private Balcony', 'Smart TV with Streaming'],
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    description: 'Perfect for small families or close friends, featuring two deluxe queen comfort beds, custom designer wall murals, a charming lounge niche, and fully climate-controlled zone vents.'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    roomId: '201',
    userId: 'mock-user-1',
    guestName: 'Robert Sterling',
    guestEmail: 'robert.sterling@example.com',
    guestPhone: '+1 (555) 321-9876',
    checkIn: '2026-06-01',
    checkOut: '2026-06-07',
    totalAmount: 2280,
    status: 'checked-in',
    notes: 'Requires early morning newspaper delivery and prefers almond milk in the kitchenette fridge.',
    createdAt: '2026-05-15T14:32:00Z'
  },
  {
    id: 'B002',
    roomId: '102',
    userId: 'mock-user-2',
    guestName: 'Eleanor Vance',
    guestEmail: 'eleanor.vance@example.com',
    guestPhone: '+1 (555) 789-1234',
    checkIn: '2026-06-10',
    checkOut: '2026-06-15',
    totalAmount: 925,
    status: 'confirmed',
    notes: 'Celebrating 5th anniversary. Please leave a complimentary champagne bottle on arrival.',
    createdAt: '2026-05-20T09:12:00Z'
  }
];

export const INITIAL_SERVICES: ServiceRequest[] = [
  {
    id: 'SR001',
    roomId: '201',
    type: 'room-service',
    description: 'Request for premium breakfast pancakes, fresh orange juice, and hot coffee at 08:30 AM.',
    status: 'pending',
    createdAt: '2026-06-03T00:10:00Z'
  },
  {
    id: 'SR002',
    roomId: '202',
    type: 'housekeeping',
    description: 'Complete linen overhaul, vacuum carpet, and restock standard mini-bar supplies.',
    status: 'in-progress',
    createdAt: '2026-06-02T22:45:00Z'
  }
];
