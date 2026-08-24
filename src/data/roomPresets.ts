/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomCategoryPreset } from '../types';

export const STANDARDIZED_ROOM_PRESETS: RoomCategoryPreset[] = [
  {
    id: 'preset-double-deluxe',
    categoryName: 'DOUBLE DELUXE',
    roomType: 'deluxe',
    capacityText: '4 Adults',
    capacityNumber: 4,
    bedSize: 'Double + Double Bed',
    facing: 'West & South Facing',
    bathroom: 'Private Toilet (High Commode)',
    basePrice: 2500,
    priceNote: 'Standard tariff per night',
    extra: 'Cloth Rack',
    specs: [
      'Cloth Rack',
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'AC/Non-AC'
    ],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: 'Premier Double Deluxe room engineered for family or group stays with 2 double beds, dual panoramic windows, high commode bathroom, and complete luxury amenities.'
  },
  {
    id: 'preset-family-room',
    categoryName: 'FAMILY ROOM',
    roomType: 'suite',
    capacityText: '2 Adults + 2 Child',
    capacityNumber: 4,
    bedSize: 'Double + Semi Double Bed',
    facing: 'West & North Facing',
    bathroom: 'Private Toilet (High Commode)',
    basePrice: 2800,
    priceNote: 'Family suite tariff per night',
    extra: 'Cloth Rack',
    specs: [
      'Cloth Rack',
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa'
    ],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Dedicated Family Suite offering a double and semi-double bed arrangement, west & north facing orientation, private high commode toilet, and relaxing sofa lounge.'
  },
  {
    id: 'preset-executive-double',
    categoryName: 'DOUBLE (EXECUTIVE SINGLE)',
    roomType: 'double',
    capacityText: '2 / 1 Adults',
    capacityNumber: 2,
    bedSize: 'Queen Size Bed',
    facing: 'East & North Facing',
    bathroom: 'Private Toilet (High Commode)',
    basePrice: 1800,
    priceNote: 'Executive single/double tariff',
    extra: 'Cloth Rack',
    specs: [
      'Cloth Rack',
      'TV',
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity',
      'Stand Lamp',
      'Sofa',
      'AC/Non-AC'
    ],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    description: 'Refined Executive Room with a Queen size bed, peaceful dual aspect windows, private high commode toilet, and flexible AC/Non-AC options.'
  },
  {
    id: 'preset-triple-room',
    categoryName: 'TRIPLE ROOM',
    roomType: 'deluxe',
    capacityText: '3 Adults',
    capacityNumber: 3,
    bedSize: 'Double + Single Bed',
    facing: 'West & South Facing',
    bathroom: 'Private Toilet (High Commode) & Balcony',
    basePrice: 2200,
    priceNote: 'Triple occupancy tariff',
    extra: 'Cloth Rack',
    specs: [
      'Cloth Rack',
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
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    description: 'Triple guest chamber featuring a double and single bed, sunny private balcony, private high commode, and full hospitality amenities.'
  },
  {
    id: 'preset-standard-double',
    categoryName: 'STANDARD DOUBLE',
    roomType: 'double',
    capacityText: '2 Adults + 1 Child (Below 6)',
    capacityNumber: 3,
    bedSize: 'King Size Bed',
    facing: 'East & South Facing',
    bathroom: 'Private Toilet (Pan) & Balcony',
    basePrice: 1600,
    priceNote: 'Standard tariff per night',
    extra: 'Cloth Rack',
    specs: [
      'Cloth Rack',
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
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    description: 'Comfortable Standard Double room equipped with a King Size bed, private balcony, private pan toilet, and comfortable seating.'
  },
  {
    id: 'preset-single-economy',
    categoryName: 'SINGLE (ECONOMY)',
    roomType: 'single',
    capacityText: '1 Adult',
    capacityNumber: 1,
    bedSize: "Single (3' / 7')",
    facing: 'East Facing',
    bathroom: 'Common Toilet (Pan)',
    basePrice: 700,
    priceNote: 'Starts from ৳700/night (*T&C Apply)',
    extra: 'Cloth Rack',
    specs: [
      'Free WiFi',
      'Common Refrigeration',
      'Tea Table',
      '24/7 Electricity'
    ],
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: 'Affordable Economy Single room tailored for solo travelers, budget business guests, or medical attendants. Includes high-speed Wi-Fi and 24/7 power.'
  }
];
