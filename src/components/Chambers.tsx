/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Room } from '../types';
import { RoomCard } from './RoomCard';
import { Sparkles } from 'lucide-react';

interface ChambersProps {
  rooms: Room[];
  onBookClick?: (room: Room) => void;
  isStaffMode?: boolean;
}

export const Chambers: React.FC<ChambersProps> = ({ rooms, onBookClick, isStaffMode = false }) => {
  return (
    <section id="destinations" className="max-w-7xl mx-auto px-6 mb-16 space-y-8 scroll-mt-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#0e2b33]/15 pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-[0.2em] text-[#af8a52] font-bold uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BOUTIQUE CHAMBERS &amp; SUITES</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0e2b33] tracking-tight">
            Accommodations at Islamia Guest House
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-[#0e2b33] bg-[#efe8d8] px-3.5 py-1.5 rounded-lg border border-[#0e2b33]/15 shadow-2xs">
          {rooms.length} Categories Available
        </span>
      </div>

      {/* 3-Column Responsive Grid Layout (1 column on mobile, 3 columns on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isStaffMode={isStaffMode}
            onBookClick={onBookClick}
          />
        ))}
      </div>
    </section>
  );
};
