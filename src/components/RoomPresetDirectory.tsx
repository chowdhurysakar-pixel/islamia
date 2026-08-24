/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RoomCategoryPreset, Room } from '../types';
import { STANDARDIZED_ROOM_PRESETS } from '../data/roomPresets';
import {
  Building,
  Users,
  BedDouble,
  Compass,
  Bath,
  CheckCircle2,
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  Tv,
  Wifi,
  Snowflake,
  Coffee,
  Layers,
  Lamp,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface RoomPresetDirectoryProps {
  currentRooms?: Room[];
  onSelectPreset?: (preset: RoomCategoryPreset) => void;
  userRoleLabel?: 'Executive Admin' | 'HR Manager' | 'Front Desk Staff';
  className?: string;
  showDeployButton?: boolean;
}

export const RoomPresetDirectory: React.FC<RoomPresetDirectoryProps> = ({
  currentRooms = [],
  onSelectPreset,
  userRoleLabel = 'Front Desk Staff',
  className = '',
  showDeployButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetForModal, setSelectedPresetForModal] = useState<RoomCategoryPreset | null>(null);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const filteredPresets = STANDARDIZED_ROOM_PRESETS.filter((preset) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      preset.categoryName.toLowerCase().includes(q) ||
      preset.capacityText.toLowerCase().includes(q) ||
      preset.bedSize.toLowerCase().includes(q) ||
      preset.facing.toLowerCase().includes(q) ||
      preset.bathroom.toLowerCase().includes(q) ||
      preset.specs.some((s) => s.toLowerCase().includes(q))
    );
  });

  // Calculate existing room counts matching each preset
  const getRoomCountForPreset = (preset: RoomCategoryPreset) => {
    return currentRooms.filter(
      (r) =>
        r.type === preset.roomType ||
        (r.title && r.title.toLowerCase().includes(preset.categoryName.toLowerCase())) ||
        (r.bedSize && r.bedSize.toLowerCase().includes(preset.bedSize.toLowerCase().split(' ')[0]))
    ).length;
  };

  const handleApplyPreset = (preset: RoomCategoryPreset) => {
    setAppliedPresetId(preset.id);
    if (onSelectPreset) {
      onSelectPreset(preset);
    }
    setTimeout(() => {
      setAppliedPresetId(null);
    }, 2000);
  };

  const getSpecIcon = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('wifi')) return <Wifi className="w-3 h-3 text-teal-600 shrink-0" />;
    if (s.includes('tv')) return <Tv className="w-3 h-3 text-sky-600 shrink-0" />;
    if (s.includes('ac')) return <Snowflake className="w-3 h-3 text-blue-600 shrink-0" />;
    if (s.includes('tea') || s.includes('table')) return <Coffee className="w-3 h-3 text-amber-600 shrink-0" />;
    if (s.includes('lamp')) return <Lamp className="w-3 h-3 text-yellow-600 shrink-0" />;
    if (s.includes('rack') || s.includes('cloth')) return <Layers className="w-3 h-3 text-indigo-600 shrink-0" />;
    if (s.includes('sofa')) return <Building className="w-3 h-3 text-emerald-600 shrink-0" />;
    return <Sparkles className="w-3 h-3 text-slate-500 shrink-0" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Directory Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e2b33] to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded-full border border-teal-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>6 Standardized Categories</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-md border border-slate-700">
                {userRoleLabel} Reference
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">
              Official Room Types &amp; Preset Directory
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Standardized guest chamber specifications for Islamia Guest House in Dhanmondi. Includes verified capacities, bed dimensions, orientation facings, and sanitization fixtures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specs, bed, facing..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPresets.map((preset, index) => {
          const matchingRoomCount = getRoomCountForPreset(preset);
          const isApplied = appliedPresetId === preset.id;

          return (
            <div
              key={preset.id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-500/60 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header & Photo */}
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={preset.image}
                    alt={preset.categoryName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                  {/* Preset Number Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-teal-300 font-mono text-[11px] font-bold rounded-xl border border-teal-400/30">
                      CATEGORY #{index + 1}
                    </span>
                  </div>

                  {/* Nightly Tariff Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-teal-500 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-md flex items-center gap-1">
                      <span>৳{preset.basePrice.toLocaleString()}</span>
                      <span className="text-[10px] font-sans font-semibold opacity-80">/night</span>
                    </span>
                  </div>

                  {/* Title and Capacity Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-base font-serif font-bold text-white tracking-wide drop-shadow-sm">
                        {preset.categoryName}
                      </h3>
                      <p className="text-[11px] text-teal-200 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{preset.capacityText}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-slate-200 text-[10px] font-mono rounded-lg border border-white/10">
                      {preset.roomType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Specs Body */}
                <div className="p-5 space-y-4">
                  {/* Specification Table Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block">
                        Bed Setup
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <BedDouble className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{preset.bedSize}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block">
                        Orientation / Facing
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{preset.facing}</span>
                      </div>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-200/60 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block">
                        Bathroom Specification
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Bath className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{preset.bathroom}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>

                  {/* Amenities / Specs Badges */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 block">
                      Included Room Specs ({preset.specs.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {preset.specs.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 rounded-xl text-[11px] font-medium border border-slate-200/70 transition"
                        >
                          {getSpecIcon(spec)}
                          <span>{spec}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer & Action Buttons */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 font-mono">
                  <span>In-House Inventory:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {matchingRoomCount} Active Unit{matchingRoomCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPresetForModal(preset)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition cursor-pointer flex items-center justify-center shrink-0"
                    title="View complete specifications and policy details"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {showDeployButton && (
                    <button
                      type="button"
                      id={`deploy-preset-btn-${preset.id}`}
                      onClick={() => handleApplyPreset(preset)}
                      className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-teal-600 text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Preset Applied!</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-teal-300" />
                          <span>Quick Deploy / Select Room Type</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Detail Modal */}
      {selectedPresetForModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden space-y-0">
            <div className="relative h-48 w-full bg-slate-900">
              <img
                src={selectedPresetForModal.image}
                alt={selectedPresetForModal.categoryName}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedPresetForModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition text-sm cursor-pointer"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-300 bg-black/40 px-2 py-0.5 rounded">
                    Official Standard
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">
                    {selectedPresetForModal.categoryName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-teal-400">
                    ৳{selectedPresetForModal.basePrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-300 block">/night</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Guest Capacity</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" />
                    {selectedPresetForModal.capacityText}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Bed Dimensions</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-teal-600" />
                    {selectedPresetForModal.bedSize}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Window Facing</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-600" />
                    {selectedPresetForModal.facing}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Toilet Fixture</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Bath className="w-4 h-4 text-blue-600" />
                    {selectedPresetForModal.bathroom}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Official Amenities &amp; Inclusions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedPresetForModal.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-2"
                    >
                      {getSpecIcon(spec)}
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">🏨 Front Desk Staff &amp; HR Standard Policy:</p>
                <p className="text-[11px] leading-relaxed">
                  All reservations booked under this category must be allocated rooms adhering to these bed and bathroom dimensions.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPresetForModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              {showDeployButton && (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyPreset(selectedPresetForModal);
                    setSelectedPresetForModal(null);
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-teal-300" />
                  <span>Quick Deploy This Category</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
