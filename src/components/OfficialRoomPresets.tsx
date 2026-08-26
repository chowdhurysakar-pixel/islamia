/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_ROOM_TEMPLATES, RoomTemplate } from '../mockData';
import { Room } from '../types';
import { 
  Building, 
  Sparkles, 
  Check, 
  Plus, 
  BedDouble, 
  Compass, 
  Bath, 
  Shirt, 
  Tag, 
  Users, 
  Wifi, 
  Tv, 
  Wind, 
  Zap, 
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface OfficialRoomPresetsProps {
  onSuccess?: () => void;
  showToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
}

export const OfficialRoomPresets: React.FC<OfficialRoomPresetsProps> = ({ onSuccess, showToast }) => {
  const { rooms, addRoom, editRoomDetails } = useApp();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const [customRoomNumbers, setCustomRoomNumbers] = useState<{ [key: string]: string }>({});

  const handleSaveOne = async (template: RoomTemplate) => {
    const customNo = customRoomNumbers[template.templateKey]?.trim() || template.number;
    setSavingKey(template.templateKey);

    try {
      const roomPayload: Omit<Room, 'id'> = {
        number: customNo,
        title: template.title,
        type: template.type,
        price: template.price,
        status: 'available',
        capacity: template.capacity,
        capacityText: template.capacityText,
        bedSize: template.bedSize,
        windows: template.windows,
        toilet: template.toilet,
        extra: template.extra,
        promoTag: template.promoTag,
        startingPriceBanner: template.startingPriceBanner,
        amenities: [...template.amenities],
        image: template.image,
        description: template.description,
      };

      const existing = rooms.find(r => r.number === customNo || r.id === customNo);
      if (existing) {
        await editRoomDetails(existing.id, roomPayload);
        showToast({
          type: 'success',
          message: `✨ Room #${customNo} (${template.title}) updated with full official specifications!`
        });
      } else {
        await addRoom(roomPayload);
        showToast({
          type: 'success',
          message: `⚡ Room #${customNo} (${template.title}) saved with 1-Click!`
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error saving preset room:", err);
      showToast({
        type: 'error',
        message: 'Could not save room. Please try again.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      for (const template of OFFICIAL_ROOM_TEMPLATES) {
        const roomPayload: Omit<Room, 'id'> = {
          number: template.number,
          title: template.title,
          type: template.type,
          price: template.price,
          status: 'available',
          capacity: template.capacity,
          capacityText: template.capacityText,
          bedSize: template.bedSize,
          windows: template.windows,
          toilet: template.toilet,
          extra: template.extra,
          promoTag: template.promoTag,
          startingPriceBanner: template.startingPriceBanner,
          amenities: [...template.amenities],
          image: template.image,
          description: template.description,
        };

        const existing = rooms.find(r => r.number === template.number || r.id === template.number);
        if (existing) {
          await editRoomDetails(existing.id, roomPayload);
        } else {
          await addRoom(roomPayload);
        }
      }

      showToast({
        type: 'success',
        message: `🚀 All 6 Official Room Presets saved & synced successfully!`
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error saving all preset rooms:", err);
      showToast({
        type: 'error',
        message: 'Error saving all rooms. Please try again.'
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0e2b33] to-[#1a3f4a] rounded-2xl p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm border border-[#2a5563]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#b7915b] text-[#19140b] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              HR Preset Catalog
            </span>
            <h4 className="font-serif text-base font-bold text-[#f5ebd7]">
              6 Official Room Types
            </h4>
          </div>
          <p className="text-xs text-slate-300">
            Click &quot;Save Room (1-Click)&quot; on any card to instantly create or update that room with exact guest view details.
          </p>
        </div>

        <button
          type="button"
          id="save-all-6-presets-btn"
          onClick={handleSaveAll}
          disabled={isSavingAll}
          className="px-4 py-2 bg-[#b7915b] hover:bg-[#a67f4a] text-[#19140b] font-bold text-xs rounded-xl transition shadow flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSavingAll ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Saving All 6...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#19140b]" />
              <span>Save All 6 Preset Rooms</span>
            </>
          )}
        </button>
      </div>

      {/* 6 Official Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICIAL_ROOM_TEMPLATES.map((tmpl) => {
          const isCurrentlySaved = rooms.some(r => r.number === tmpl.number);
          const isSaving = savingKey === tmpl.templateKey;
          const currentCustomNo = customRoomNumbers[tmpl.templateKey] ?? tmpl.number;

          return (
            <div
              key={tmpl.templateKey}
              id={`preset-card-${tmpl.templateKey}`}
              className="bg-white border border-[#0e2b33]/15 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-[#b7915b]/60 transition-all group"
            >
              {/* Image Preview Header */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                <img
                  src={tmpl.image}
                  alt={tmpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                
                {/* Room # Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-[#0e2b33]/90 backdrop-blur-md text-[#efe8d8] text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border border-[#af8a52]/40">
                    Room {tmpl.number}
                  </span>
                </div>

                {/* Status / Saved Indicator */}
                <div className="absolute top-2.5 right-2.5">
                  {isCurrentlySaved ? (
                    <span className="bg-emerald-100/95 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>In System</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100/95 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-300">
                      Preset Ready
                    </span>
                  )}
                </div>

                {/* Promo Badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="bg-[#101b1e]/90 text-[#f5d061] border border-[#eab308]/70 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#facc15]" />
                    <span>{tmpl.promoTag || tmpl.startingPriceBanner}</span>
                  </span>
                </div>

                {/* Nightly Price Tag */}
                <div className="absolute bottom-2.5 right-2.5 bg-[#0e2b33]/90 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                  ৳{tmpl.price.toLocaleString()}<span className="text-[9px] text-white/70 font-normal">/nt</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col space-y-3">
                {/* Title & Capacity */}
                <div>
                  <h4 className="font-serif text-base font-bold text-[#0e2b33] leading-tight">
                    {tmpl.title}
                  </h4>
                  <div className="inline-flex items-center gap-1 text-[#5e4b2d] bg-[#fbf7ee] border border-[#e6dcce] px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold mt-1">
                    <Users className="w-3 h-3 text-[#af8a52]" />
                    <span>{tmpl.capacityText}</span>
                  </div>
                </div>

                {/* Specifications Box */}
                <div className="bg-[#fbf9f4] rounded-xl p-2.5 border border-[#0e2b33]/12 text-[11px] space-y-1.5 font-sans">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-[#0e2b33]/80 flex items-center gap-1">
                      <BedDouble className="w-3 h-3 text-[#af8a52]" />
                      Bed Size:
                    </span>
                    <span className="font-medium text-[#0e2b33]">{tmpl.bedSize}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-[#0e2b33]/80 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#af8a52]" />
                      Windows:
                    </span>
                    <span className="font-medium text-[#0e2b33]">{tmpl.windows}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-[#0e2b33]/80 flex items-center gap-1">
                      <Bath className="w-3 h-3 text-[#af8a52]" />
                      Toilet:
                    </span>
                    <span className="font-medium text-[#0e2b33] truncate max-w-[130px]" title={tmpl.toilet}>
                      {tmpl.toilet}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-[#0e2b33]/80 flex items-center gap-1">
                      <Shirt className="w-3 h-3 text-[#af8a52]" />
                      Extra:
                    </span>
                    <span className="font-medium text-[#0e2b33] truncate max-w-[130px]" title={tmpl.extra}>
                      {tmpl.extra}
                    </span>
                  </div>
                </div>

                {/* Amenities List */}
                <div>
                  <p className="text-[9px] font-mono font-bold text-[#0e2b33]/60 uppercase tracking-wider mb-1">
                    Amenities Included:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tmpl.amenities.slice(0, 4).map((am, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-medium text-[#0e2b33] bg-white border border-[#0e2b33]/15 px-1.5 py-0.5 rounded shadow-2xs"
                      >
                        {am}
                      </span>
                    ))}
                    {tmpl.amenities.length > 4 && (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        +{tmpl.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Suite Number (optional override) */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">
                    Suite #:
                  </label>
                  <input
                    type="text"
                    value={currentCustomNo}
                    onChange={(e) => {
                      setCustomRoomNumbers({
                        ...customRoomNumbers,
                        [tmpl.templateKey]: e.target.value
                      });
                    }}
                    placeholder={`e.g. ${tmpl.number}`}
                    className="w-24 text-xs font-mono font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-teal-500 text-center"
                    title="Change Suite number if adding another room of this type"
                  />
                </div>

                {/* One Click Save Button */}
                <button
                  type="button"
                  id={`save-preset-${tmpl.templateKey}-btn`}
                  onClick={() => handleSaveOne(tmpl)}
                  disabled={isSaving}
                  className="w-full py-2.5 px-3 bg-[#b7915b] hover:bg-[#a67f4a] text-[#19140b] font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98] border border-[#d5bc90]/50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-auto"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#19140b]" />
                      <span>Save Room (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
