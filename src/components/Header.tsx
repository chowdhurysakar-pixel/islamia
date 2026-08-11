/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Phone, MessageSquare, Globe, LogIn, LogOut, 
  Menu, X, Shield, User, Hotel
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    user, 
    logout, 
    setOpMode, 
    setIsAuthModalOpen,
    bookings 
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Safe Sign-In handler to prevent "is not a function" errors
  const handleSignIn = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (typeof setOpMode === 'function') {
      setOpMode('gateway');
    }
    
    if (typeof setIsAuthModalOpen === 'function') {
      setIsAuthModalOpen(true);
    }
  };

  const activeBookingsCount = bookings ? bookings.filter(b => b.status === 'confirmed').length : 0;

  return (
    <header className="w-full relative z-30 font-sans shadow-xs">
      
      {/* 1. Top Utility Bar */}
      <div className="bg-[#FAF7F2] text-slate-700 text-xs py-2 px-4 sm:px-8 border-b border-slate-200/80 flex justify-between items-center relative z-40">
        
        {/* Left Side Contact Info */}
        <div className="flex items-center gap-4 sm:gap-6 text-slate-600 font-medium">
          <a 
            href="tel:01909806960" 
            className="hover:text-slate-900 transition flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-teal-700" />
            <span className="tracking-wide">01909-806960</span>
          </a>

          <a 
            href="https://wa.me/8801909806960" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-emerald-800 text-emerald-700 font-semibold transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Right Side Utility Actions & Sign In Button */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden md:flex items-center gap-1.5 text-slate-500 font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>English / বাংলা</span>
          </div>

          <div className="hidden sm:block text-slate-600 font-semibold">
            My Stays <span className="text-teal-700">({activeBookingsCount})</span>
          </div>

          <div className="hidden sm:inline-block bg-[#C8956A] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
            bKash: 01832-841818
          </div>

          {/* SIGN IN / SIGN OUT BUTTON */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-700" />
                {user.displayName || user.email || 'User'}
              </span>
              <button
                type="button"
                onClick={() => typeof logout === 'function' && logout()}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 z-50 active:scale-95 pointer-events-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="bg-[#1E293B] hover:bg-teal-900 text-white px-3.5 py-1 rounded-md text-xs font-bold transition-all duration-150 shadow-xs cursor-pointer flex items-center gap-1.5 z-50 active:scale-95 pointer-events-auto"
            >
              <span>Sign In &rarr;</span>
              <LogIn className="w-3.5 h-3.5 text-teal-400" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Brand Navbar */}
      <div className="bg-white px-4 sm:px-8 py-3.5 border-b border-slate-100 flex items-center justify-between relative z-30">
        
        {/* Brand Logo */}
        <div 
          onClick={() => typeof setOpMode === 'function' && setOpMode('guest')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8956A] to-amber-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight leading-none">
              ISLAMIA GUEST HOUSE
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-amber-800 uppercase font-bold mt-0.5">
              DHANMONDI
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-wider text-slate-700 uppercase">
          <a href="#chambers" className="hover:text-teal-700 transition">Chambers</a>
          <a href="#philosophy" className="hover:text-teal-700 transition">Philosophy</a>
          <a href="#experience" className="hover:text-teal-700 transition">Experience</a>
          <a href="#reviews" className="hover:text-teal-700 transition">Reviews</a>
          <a href="#location" className="hover:text-teal-700 transition">Location</a>
        </nav>

        {/* Mobile Menu & Call Toggle */}
        <div className="flex items-center gap-3">
          <a 
            href="tel:01909806960" 
            className="p-2.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-full transition cursor-pointer"
            title="Call Front Desk"
          >
            <Phone className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Offer Banner */}
      <div className="bg-[#F3ECE1] text-amber-950 text-center py-2 px-4 text-xs font-medium border-b border-amber-200/60">
        Stay 3, pay for 2 on Suites &amp; Deluxe Chambers across our Dhanmondi location. Extend your stay — valid through 2026.{' '}
        <a 
          href="https://wa.me/8801909806960" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-amber-800 font-bold underline hover:text-amber-900 transition inline-block ml-1"
        >
          Inquire on WhatsApp &rarr;
        </a>
      </div>

      {/* 4. Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 font-semibold text-sm text-slate-700 shadow-xl relative z-40">
          <a href="#chambers" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-teal-700">Chambers</a>
          <a href="#philosophy" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-teal-700">Philosophy</a>
          <a href="#experience" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-teal-700">Experience</a>
          <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-teal-700">Reviews</a>
          <a href="#location" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-teal-700">Location</a>
          
          <div className="pt-3 border-t border-slate-100">
            {!user && (
              <button
                type="button"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleSignIn(e);
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Sign In to Access Gateway</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
