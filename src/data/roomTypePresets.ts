/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomType } from '../types';

export interface RoomTypePreset {
  id: string;
  name: string;
  subtitle: string;
  roomType: RoomType;
  defaultPrice: number;
  capacity: number;
  capacityText: string;
  bedSize: string;
  windows: string;
  toilet: string;
  extra: string;
  startingPriceBanner?: string;
  amenities: string[];
  defaultImage: string;
  description: string;
  badge: string;
  iconTag: string;
}

export const OFFICIAL_ROOM_TYPES: RoomTypePreset[] = [
  {
    id: 'double-deluxe',
    name: 'Double Deluxe',
    subtitle: '4 Adults • Double + Double Bed',
    roomType: 'deluxe',
    defaultPrice: 2500,
    capacity: 4,
    capacityText: '4 Adults',
    bedSize: 'Double + Double',
    windows: 'West & South Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: [
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'AC/Non-AC'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800&q=80',
    description: 'Double Deluxe room with spacious layout featuring two double beds, dual aspect windows (West & South), and complete luxury amenities for up to 4 adults.',
    badge: '👤👤👤👤 4 Adults',
    iconTag: '4 Adults'
  },
  {
    id: 'family-room',
    name: 'Family Room',
    subtitle: '2 Adults + 2 Child • Double + Semi Double Bed',
    roomType: 'suite',
    defaultPrice: 2800,
    capacity: 4,
    capacityText: '2 Adults + 2 Child',
    bedSize: 'Double + Semi Double',
    windows: 'West & North Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: [
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Family Room designed for serene family stays with a double and semi-double bed arrangement, west & north facing windows, private high commode, and full essential comforts.',
    badge: '👤👤👥 2 Adults + 2 Child',
    iconTag: '2 Adults + 2 Child'
  },
  {
    id: 'executive-single',
    name: 'Double (Executive Single)',
    subtitle: '2 / 1 Adults • Queen Size Bed',
    roomType: 'double',
    defaultPrice: 1800,
    capacity: 2,
    capacityText: '2 / 1 Adults',
    bedSize: 'Queen Size',
    windows: 'East & North Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: [
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'AC/Non-AC'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Executive Single / Double room offering a queen size bed, peaceful east & north facing windows, sofa seating, and flexible climate choices.',
    badge: '👤👤 / 👤 2/1 Adults',
    iconTag: '2/1 Adults'
  },
  {
    id: 'triple-room',
    name: 'Triple Room',
    subtitle: '3 Adults • Double + Single Bed',
    roomType: 'deluxe',
    defaultPrice: 2200,
    capacity: 3,
    capacityText: '3 Adults',
    bedSize: 'Double + Single',
    windows: 'West & South Facing',
    toilet: 'Private Toilet (High Commode)',
    extra: 'Cloth Rack',
    amenities: [
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'Balcony',
      'AC/Non-AC'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    description: 'Triple Room accommodating 3 adults with a double plus single bed setup, sunny private balcony, west & south facing windows, and private high commode toilet.',
    badge: '👤👤👤 3 Adults',
    iconTag: '3 Adults'
  },
  {
    id: 'standard-double',
    name: 'Standard Double',
    subtitle: '2 Adults + 1 Child • King Size Bed',
    roomType: 'double',
    defaultPrice: 1600,
    capacity: 3,
    capacityText: '2 Adults + 1 Child (Below 6)',
    bedSize: 'King Size',
    windows: 'East & South Facing',
    toilet: 'Private Toilet (Pan)',
    extra: 'Cloth Rack',
    amenities: [
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'Balcony',
      'AC/Non-AC'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'Standard Double room with a king size bed, breezy balcony, east & south facing windows, pan toilet, and comfortable sofa for couples or small families.',
    badge: '👤👤👶 2 Adults + 1 Child',
    iconTag: '2 Adults + 1 Child'
  },
  {
    id: 'single-economy',
    name: 'Single (Economy)',
    subtitle: "1 Adult • Single (3'/7') Bed",
    roomType: 'single',
    defaultPrice: 700,
    capacity: 1,
    capacityText: '1 Adult',
    bedSize: "Single (3'/7')",
    windows: 'East Facing',
    toilet: 'Common Toilet (Pan)',
    extra: 'Cloth Rack',
    startingPriceBanner: 'Starts from 700/- (*T&C Apply)',
    amenities: [
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity'
    ],
    defaultImage: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: "Economy Single room tailored for solo travelers or medical visits on a budget. Features east-facing window, single bed (3'/7'), common pan toilet, WiFi, and tea table.",
    badge: '👤 1 Adult • Starts ৳700',
    iconTag: '1 Adult'
  }
];
