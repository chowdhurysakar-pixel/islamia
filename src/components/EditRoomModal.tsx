/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Room, RoomType, RoomStatus } from '../types';
import { 
  X, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Loader2, 
  DollarSign, 
  Users, 
  BedDouble, 
  Compass, 
  Bath, 
  Shirt, 
  Tag, 
  FileText, 
  Image as ImageIcon,
  Sliders,
  Type
} from 'lucide-react';

interface EditRoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomId: string, updates: Partial<Room>) => Promise<void>;
  showToast?: (toast: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
}

const COMMON_AMENITIES_PRESETS = [
  'Free WiFi',
  'TV',
  'AC/Non-AC',
  'Common Refrigeration',
  'Tea Table',
  '24/7 Electricity',
  'Stand Lamp',
  'Sofa',
  'Balcony',
  'Cloth Rack',
  'Hot Water',
  'Geyser'
];

const TOILET_PRESETS = [
  'Private Toilet (High Commode)',
  'Private Toilet (Pan)',
  'Common Toilet (Pan)',
  'Attached Bathroom (High Commode)'
];

const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read image file'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  isOpen,
  onClose,
  onSave,
  showToast
}) => {
  if (!isOpen || !room) return null;

  // Helper for human-friendly category title fallback
  const getInitialTitle = (r: Room) => {
    if (r.title) return r.title;
    switch (r.number) {
      case '101': return 'Double Deluxe';
      case '102': return 'Family Room';
      case '103': return 'Double (Executive Single)';
      case '201': return 'Triple Room';
      case '202': return 'Standard Double';
      case '301': return 'Single (Economy)';
      default:
        return r.type === 'suite' ? 'Room Suite' : `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Room`;
    }
  };

  const [title, setTitle] = useState<string>(getInitialTitle(room));
  const [number, setNumber] = useState<string>(room.number || '');
  const [price, setPrice] = useState<number>(room.price || 0);
  const [type, setType] = useState<RoomType>(room.type || 'double');
  const [status, setStatus] = useState<RoomStatus>(room.status || 'available');
  const [capacity, setCapacity] = useState<number>(room.capacity || 2);
  const [capacityText, setCapacityText] = useState<string>(room.capacityText || `${room.capacity || 2} Adults`);
  const [bedSize, setBedSize] = useState<string>(room.bedSize || '');
  const [windows, setWindows] = useState<string>(room.windows || '');
  const [toilet, setToilet] = useState<string>(room.toilet || '');
  const [extra, setExtra] = useState<string>(room.extra || '');
  const [startingPriceBanner, setStartingPriceBanner] = useState<string>(room.startingPriceBanner || '');
  const [description, setDescription] = useState<string>(room.description || '');
  const [amenities, setAmenities] = useState<string[]>(room.amenities || []);
  const [customAmenity, setCustomAmenity] = useState<string>('');
  
  const [images, setImages] = useState<string[]>(
    room.images && room.images.length > 0 ? room.images : (room.image ? [room.image] : [])
  );
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Re-sync form state if room changes
  useEffect(() => {
    if (room) {
      setTitle(getInitialTitle(room));
      setNumber(room.number || '');
      setPrice(room.price || 0);
      setType(room.type || 'double');
      setStatus(room.status || 'available');
      setCapacity(room.capacity || 2);
      setCapacityText(room.capacityText || `${room.capacity || 2} Adults`);
      setBedSize(room.bedSize || '');
      setWindows(room.windows || '');
      setToilet(room.toilet || '');
      setExtra(room.extra || '');
      setStartingPriceBanner(room.startingPriceBanner || '');
      setDescription(room.description || '');
      setAmenities(room.amenities || []);
      setImages(room.images && room.images.length > 0 ? room.images : (room.image ? [room.image] : []));
    }
  }, [room]);

  const toggleAmenity = (amenityName: string) => {
    if (amenities.includes(amenityName)) {
      setAmenities(amenities.filter(a => a !== amenityName));
    } else {
      setAmenities([...amenities, amenityName]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (amenityName: string) => {
    setAmenities(amenities.filter(a => a !== amenityName));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const fileArray = Array.from(files) as File[];
      const newUrls: string[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await processUploadedImage(file);
        newUrls.push(dataUrl);
      }

      if (newUrls.length > 0) {
        setImages(prev => [...prev, ...newUrls]);
        if (showToast) {
          showToast({
            type: 'success',
            message: `📸 ${newUrls.length} photo(s) uploaded successfully!`
          });
        }
      }
    } catch (err) {
      if (showToast) {
        showToast({
          type: 'error',
          message: 'Failed to upload photo from device.'
        });
      }
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (trimmed) {
      setImages([...images, trimmed]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    if (!title.trim()) {
      if (showToast) showToast({ type: 'error', message: 'Please enter a room title or category name.' });
      return;
    }
    if (!number.trim()) {
      if (showToast) showToast({ type: 'error', message: 'Please enter a room number.' });
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      if (showToast) showToast({ type: 'error', message: 'Please enter a valid positive price per night.' });
      return;
    }

    setIsSaving(true);
    try {
      const mainImage = images.length > 0 ? images[0] : room.image;
      
      const updates: Partial<Room> = {
        title: title.trim(),
        number: number.trim(),
        price: Number(price) || 0,
        type,
        status,
        capacity: Number(capacity) || 1,
        capacityText: capacityText.trim(),
        bedSize: bedSize.trim(),
        windows: windows.trim(),
        toilet: toilet.trim(),
        extra: extra.trim(),
        startingPriceBanner: startingPriceBanner.trim(),
        description: description.trim(),
        amenities,
        image: mainImage,
        images
      };

      await onSave(room.id, updates);
      if (showToast) {
        showToast({
          type: 'success',
          message: `✨ Room details for ${title.trim() || room.number} updated successfully!`
        });
      }
      onClose();
    } catch (err) {
      console.error("Error saving room details:", err);
      if (showToast) {
        showToast({
          type: 'error',
          message: 'Failed to save room updates. Please try again.'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white border border-[#0e2b33]/20 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0e2b33] text-white px-6 py-4 flex items-center justify-between border-b border-[#af8a52]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#af8a52]/20 border border-[#af8a52]/40 flex items-center justify-center text-[#d7bd8a]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#f8f4ec] leading-tight">
                Edit Room Details: {title}
              </h3>
              <p className="text-xs text-[#f8f4ec]/70 font-mono">
                Room No. #{room.number} • Updates sync in real time to website
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Section 1: Title, Category & Pricing */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-[#0e2b33] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Type className="w-4 h-4 text-[#af8a52]" />
              <span>1. Basic Info &amp; Nightly Tariff</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Room Title / Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Double Deluxe, Family Room"
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] focus:ring-1 focus:ring-[#af8a52] rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Room No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="101"
                  className="w-full text-xs font-mono font-bold border border-slate-300 focus:border-[#af8a52] focus:ring-1 focus:ring-[#af8a52] rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Price Per Night (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold border border-slate-300 focus:border-[#af8a52] focus:ring-1 focus:ring-[#af8a52] rounded-xl bg-slate-50 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Room Type Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as RoomType)}
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                >
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="double">Double</option>
                  <option value="single">Single</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Current Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoomStatus)}
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                >
                  <option value="available">Available (Green)</option>
                  <option value="occupied">Occupied (Red)</option>
                  <option value="cleaning">Cleaning (Amber)</option>
                  <option value="maintenance">Maintenance (Gray)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Capacity & Room Specifications */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-[#0e2b33] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Users className="w-4 h-4 text-[#af8a52]" />
              <span>2. Occupancy &amp; Room Specifications</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Max Adults Count (Number)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full text-xs font-mono font-semibold border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Capacity Display Label (e.g., "4 Adults", "2 Adults + 2 Children")
                </label>
                <input
                  type="text"
                  value={capacityText}
                  onChange={(e) => setCapacityText(e.target.value)}
                  placeholder="4 Adults"
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-[#af8a52]" />
                  <span>Bed Size / Setup</span>
                </label>
                <input
                  type="text"
                  value={bedSize}
                  onChange={(e) => setBedSize(e.target.value)}
                  placeholder="Double + Double, King Size, Queen Size..."
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#af8a52]" />
                  <span>Window Facing Direction</span>
                </label>
                <input
                  type="text"
                  value={windows}
                  onChange={(e) => setWindows(e.target.value)}
                  placeholder="West & South Facing, East Facing..."
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-[#af8a52]" />
                  <span>Toilet Type</span>
                </label>
                <input
                  type="text"
                  value={toilet}
                  onChange={(e) => setToilet(e.target.value)}
                  placeholder="Private Toilet (High Commode), Pan, Common..."
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
                {/* Toilet Presets */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {TOILET_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setToilet(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                        toilet === preset
                          ? 'bg-[#0e2b33] text-white border-[#0e2b33]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Shirt className="w-3.5 h-3.5 text-[#af8a52]" />
                  <span>Extra Spec Tag</span>
                </label>
                <input
                  type="text"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Cloth Rack, Dressing Table..."
                  className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Starting Price / Special Promo Banner (Optional)</span>
                </label>
                <input
                  type="text"
                  value={startingPriceBanner}
                  onChange={(e) => setStartingPriceBanner(e.target.value)}
                  placeholder="e.g. Starts from 700/- (*T&C Apply)"
                  className="w-full text-xs font-medium border border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 bg-amber-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Included Amenities */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-[#0e2b33] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Sparkles className="w-4 h-4 text-[#af8a52]" />
              <span>3. Included Room Amenities</span>
            </div>

            {/* Quick Preset Toggles */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Quick Toggle Common Amenities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_AMENITIES_PRESETS.map((item) => {
                  const isSelected = amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0e2b33] text-[#f8f4ec] border-[#0e2b33] shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 shrink-0" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Amenities Tag List & Add Custom */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Active Amenities ({amenities.length}):
                </span>
              </div>

              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0e2b33] bg-white border border-[#0e2b33]/20 px-2.5 py-1 rounded-lg shadow-2xs"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="text-rose-500 hover:text-rose-700 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No amenities selected yet.</p>
              )}

              {/* Custom Amenity Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add custom amenity (e.g. Executive Desk)..."
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Photo Gallery & Computer Upload */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-[#0e2b33] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <ImageIcon className="w-4 h-4 text-[#af8a52]" />
              <span>4. Room Photos ({images.length})</span>
            </div>

            {/* Current Image Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img 
                      src={imgUrl} 
                      alt={`Room photo ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-teal-800/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold">
                        Main Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Computer Upload & URL Add */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <input
                  type="file"
                  id="modal-photo-upload-input"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
                <label
                  htmlFor="modal-photo-upload-input"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-teal-50 hover:bg-teal-100/80 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer transition text-teal-900 text-xs font-bold group shadow-2xs"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      <span>Uploading photo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-teal-600 group-hover:scale-110 transition" />
                      <span>Upload Photo from Computer</span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-slate-50 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-[#0e2b33] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#af8a52]" />
              <span>5. Room Description / Overview</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe layout, ambiance, view, features..."
              className="w-full text-xs font-medium border border-slate-300 focus:border-[#af8a52] rounded-xl p-3 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 font-bold text-xs rounded-xl shadow-md active:scale-[0.98] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
