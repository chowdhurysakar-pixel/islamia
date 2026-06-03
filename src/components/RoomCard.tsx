/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Room, RoomStatus } from '../types';
import { Users, Wifi, Tv, Coffee, Wind, Eye, Compass, ShieldAlert, KeyRound, Hammer, Sparkles } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onBookClick?: (room: Room) => void;
  onStatusChange?: (roomId: string, status: RoomStatus) => void;
  isStaffMode: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onBookClick, onStatusChange, isStaffMode }) => {
  
  // Status Visual Builders
  const getStatusStyle = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', label: 'Available' };
      case 'occupied':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', label: 'Occupied' };
      case 'cleaning':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500 animate-pulse', label: 'Cleaning' };
      case 'maintenance':
        return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-500', label: 'Maintenance' };
    }
  };

  const statusStyle = getStatusStyle(room.status);

  // Map amenities to icons
  const getAmenityIcon = (amenity: string) => {
    const textSnapshot = amenity.toLowerCase();
    if (textSnapshot.includes('wi-fi') || textSnapshot.includes('wifi')) return <Wifi className="w-3.5 h-3.5" />;
    if (textSnapshot.includes('tv') || textSnapshot.includes('streaming')) return <Tv className="w-3.5 h-3.5" />;
    if (textSnapshot.includes('coffee') || textSnapshot.includes('nespresso')) return <Coffee className="w-3.5 h-3.5" />;
    if (textSnapshot.includes('air') || textSnapshot.includes('ac')) return <Wind className="w-3.5 h-3.5" />;
    if (textSnapshot.includes('bath') || textSnapshot.includes('tub')) return <Compass className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <div 
      id={`room-${room.id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full"
    >
      {/* Room Image Banner */}
      <div className="relative h-48 overflow-hidden aspect-video bg-slate-100">
        <img
          src={room.image}
          alt={`Room ${room.number}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Absolute Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md font-bold shadow-sm">
            {room.type === 'suite' ? 'Room Suite' : `${room.type} Room`}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border backdrop-blur-md ${statusStyle.bg} shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            <span>{statusStyle.label}</span>
          </span>
        </div>

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-mono font-semibold">
          ৳{room.price * 10} <span className="text-[10px] opacity-70 font-sans font-normal">/ night</span>
        </div>
      </div>

      {/* Room Details Column */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-serif text-lg font-semibold text-slate-800">
            Room {room.number}
          </h3>
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Up to {room.capacity} Person{room.capacity > 1 ? 's' : ''}</span>
          </div>
        </div>

        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {room.description}
        </p>

        {/* Room Amenities Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
          {room.amenities.slice(0, 4).map((amenity, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100/75 px-2 py-1 rounded-md"
            >
              {getAmenityIcon(amenity)}
              <span>{amenity}</span>
            </span>
          ))}
          {room.amenities.length > 4 && (
            <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
              +{room.amenities.length - 4} more
            </span>
          )}
        </div>

        {/* Staff Actions vs Guest Booking Trigger */}
        <div className="pt-4 border-t border-slate-100/75 flex flex-col gap-2">
          {isStaffMode ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Update Room status
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(['available', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map((status) => (
                  <button
                    key={status}
                    id={`room-${room.id}-set-${status}`}
                    onClick={() => onStatusChange && onStatusChange(room.id, status)}
                    className={`text-[10px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                      room.status === status
                        ? 'bg-slate-800 text-white border-slate-800/80'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              id={`book-room-${room.id}-btn`}
              onClick={() => onBookClick && onBookClick(room)}
              disabled={room.status !== 'available'}
              className={`w-full py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                room.status === 'available'
                  ? 'bg-teal-600 shadow-sm shadow-teal-600/20 text-white hover:bg-teal-700 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
              }`}
            >
              {room.status === 'available' ? 'Reserve Room' : 'Unavailable'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
