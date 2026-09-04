/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Room, RoomStatus } from '../types';
import { useApp } from '../context/AppContext';
import { EditRoomModal } from './EditRoomModal';
import { 
  Users, 
  Wifi, 
  Tv, 
  Wind, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  BedDouble,
  Compass,
  Bath,
  Shirt,
  Refrigerator,
  Coffee,
  Zap,
  Lamp,
  Sofa,
  Maximize2,
  Tag,
  Edit3
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onBookClick?: (room: Room) => void;
  onStatusChange?: (roomId: string, status: RoomStatus) => void;
  isStaffMode?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onBookClick, onStatusChange, isStaffMode = false }) => {
  const { currentRole, opMode, editRoomDetails, showToast } = useApp();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const displayImages = room.images && room.images.length > 0 ? room.images : [room.image];

  const canEdit = isStaffMode || currentRole === 'admin' || currentRole === 'staff' || opMode === 'hr' || opMode === 'admin';

  // Helper for human-friendly category name
  const getRoomTitle = (room: Room) => {
    if (room.title) return room.title;
    switch (room.number) {
      case '101': return 'Double Deluxe';
      case '102': return 'Family Room';
      case '103': return 'Double (Executive Single)';
      case '201': return 'Triple Room';
      case '202': return 'Standard Double';
      case '301': return 'Single (Economy)';
      default:
        return room.type === 'suite' ? 'Room Suite' : `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room`;
    }
  };

  // Status Visual Builders
  const getStatusStyle = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Available' };
      case 'occupied':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500', label: 'Occupied' };
      case 'cleaning':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500 animate-pulse', label: 'Cleaning' };
      case 'maintenance':
        return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-500', label: 'Maintenance' };
    }
  };

  const statusStyle = getStatusStyle(room.status);

  // Map amenities to specific icons
  const getAmenityIcon = (amenity: string) => {
    const textSnapshot = amenity.toLowerCase();
    if (textSnapshot.includes('wifi') || textSnapshot.includes('wi-fi')) return <Wifi className="w-3 h-3 text-sky-600" />;
    if (textSnapshot.includes('tv')) return <Tv className="w-3 h-3 text-indigo-600" />;
    if (textSnapshot.includes('refrigeration') || textSnapshot.includes('fridge')) return <Refrigerator className="w-3 h-3 text-teal-600" />;
    if (textSnapshot.includes('tea')) return <Coffee className="w-3 h-3 text-amber-700" />;
    if (textSnapshot.includes('electricity') || textSnapshot.includes('24/7')) return <Zap className="w-3 h-3 text-amber-500" />;
    if (textSnapshot.includes('lamp')) return <Lamp className="w-3 h-3 text-orange-500" />;
    if (textSnapshot.includes('sofa')) return <Sofa className="w-3 h-3 text-emerald-600" />;
    if (textSnapshot.includes('ac')) return <Wind className="w-3 h-3 text-blue-500" />;
    if (textSnapshot.includes('balcony')) return <Maximize2 className="w-3 h-3 text-teal-600" />;
    return <Sparkles className="w-3 h-3 text-[#af8a52]" />;
  };

  const roomTitle = getRoomTitle(room);

  return (
    <div 
      id={`room-${room.id}`}
      className="bg-white rounded-2xl border border-[#0e2b33]/15 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full"
    >
      {/* Room Image Banner */}
      <div className="relative h-52 overflow-hidden aspect-video bg-slate-100 group/img">
        <img
          src={displayImages[activeImgIndex % displayImages.length]}
          alt={`${roomTitle} - Image ${activeImgIndex + 1}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {displayImages.length > 1 && (
          <>
            {/* Left Button */}
            <button
              type="button"
              id={`prev-image-btn-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-opacity opacity-0 group-hover/img:opacity-100 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Right Button */}
            <button
              type="button"
              id={`next-image-btn-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev + 1) % displayImages.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-opacity opacity-0 group-hover/img:opacity-100 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
              {displayImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(dotIdx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    (activeImgIndex % displayImages.length) === dotIdx ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Absolute Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-[#0e2b33]/90 backdrop-blur-md text-[#efe8d8] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md font-bold shadow-sm border border-[#af8a52]/40">
            Room {room.number}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border backdrop-blur-md ${statusStyle.bg} shadow-sm uppercase tracking-wider`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            <span>{statusStyle.label}</span>
          </span>
        </div>

        {/* Bottom Left Promo / Value Badge on Image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
          <div className="bg-[#101b1e]/90 backdrop-blur-md text-[#f5d061] border border-[#eab308]/70 px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-[#facc15]" />
            <span>{room.promoTag || room.startingPriceBanner || (room.price ? `৳${room.price}/night` : 'Special Rate')}</span>
          </div>
        </div>
      </div>

      {/* Room Details Column */}
      <div className="p-5 flex-1 flex flex-col space-y-3.5 bg-white">
        
        {/* Title & Capacity */}
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-serif text-lg font-bold text-[#0e2b33] leading-snug">
              {roomTitle}
            </h3>
            {canEdit && (
              <button
                type="button"
                id={`edit-room-${room.id}-btn`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0e2b33] bg-[#efe8d8] hover:bg-[#e2d5bd] px-2.5 py-1 rounded-lg border border-[#0e2b33]/20 shadow-2xs transition shrink-0 cursor-pointer"
                title="Edit Room Category Details"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#af8a52]" />
                <span>Edit Details</span>
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 text-[#5e4b2d] bg-[#fbf7ee] border border-[#e6dcce] px-3 py-1 rounded-lg text-xs font-mono font-semibold">
            <Users className="w-3.5 h-3.5 text-[#af8a52]" />
            <span>Capacity: <strong>{room.capacityText || `Capacity ${room.capacity} people`}</strong></span>
          </div>
        </div>

        {/* Specification Details Grid */}
        <div className="bg-[#fbf9f4] rounded-xl p-3 border border-[#0e2b33]/12 text-xs space-y-2 font-sans">
          {room.bedSize && (
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold text-[#0e2b33]/80 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-[#af8a52]" />
                Bed Size:
              </span>
              <span className="font-medium text-[#0e2b33]">{room.bedSize}</span>
            </div>
          )}

          {room.windows && (
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold text-[#0e2b33]/80 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#af8a52]" />
                Windows:
              </span>
              <span className="font-medium text-[#0e2b33]">{room.windows}</span>
            </div>
          )}

          {room.toilet && (
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold text-[#0e2b33]/80 flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-[#af8a52]" />
                Toilet:
              </span>
              <span className="font-medium text-[#0e2b33]">{room.toilet}</span>
            </div>
          )}

          {room.extra && (
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold text-[#0e2b33]/80 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-[#af8a52]" />
                Extra:
              </span>
              <span className="font-medium text-[#0e2b33]">{room.extra}</span>
            </div>
          )}
        </div>

        {/* Promo Rate Banner Box */}
        <div className="bg-[#fff9ed] border border-[#f5d996] rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#b07d19]" />
          <span className="text-xs font-mono font-bold text-[#8a5b10]">
            Promo Rate: {room.promoTag || room.startingPriceBanner || (room.price ? `৳${room.price.toLocaleString()}/night` : 'Special Rate')}
          </span>
        </div>

        {/* Room Amenities Badges */}
        <div className="mt-auto pt-1">
          <p className="text-[10px] font-mono font-bold text-[#0e2b33]/60 uppercase tracking-wider mb-2">
            AMENITIES:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.map((amenity, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0e2b33] bg-white border border-[#0e2b33]/15 px-2.5 py-1 rounded-lg shadow-2xs"
              >
                {getAmenityIcon(amenity)}
                <span>{amenity}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Button / Staff Controls */}
        <div className="pt-2 border-t border-[#0e2b33]/10 flex flex-col gap-2">
          {isStaffMode ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Update Status
                </label>
                <button
                  type="button"
                  id={`staff-edit-room-${room.id}-btn`}
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Category</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(['available', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map((status) => (
                  <button
                    key={status}
                    id={`room-${room.id}-set-${status}`}
                    onClick={() => onStatusChange && onStatusChange(room.id, status)}
                    className={`text-[10px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                      room.status === status
                        ? 'bg-[#0e2b33] text-[#f8f4ec] border-[#0e2b33]'
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
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                room.status === 'available'
                  ? 'bg-[#b7915b] hover:bg-[#a67f49] text-[#19140b] shadow-sm active:scale-[0.98] border border-[#d5bc90]/50'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
              }`}
            >
              {room.status === 'available' ? 'Reserve Room' : 'Currently Unavailable'}
            </button>
          )}
        </div>

      </div>

      {/* Edit Room Details Modal for HR/Admin */}
      {isEditModalOpen && (
        <EditRoomModal
          room={room}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={editRoomDetails}
          showToast={showToast}
        />
      )}
    </div>
  );
};
