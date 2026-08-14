import React from 'react';
import { 
  Building2, 
  Zap, 
  CigaretteOff, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  Compass,
  Award
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const pillars = [
    {
      icon: <Building2 className="w-4 h-4 text-[#af8a52]" />,
      title: 'Home Comfort & Restful Calm',
      paragraph: 'Experience the peaceful privacy of an elegant home with boutique hotel care. Meticulously designed rooms feature plush bedding, ambient lighting, and sound-insulated architecture for deep relaxation.'
    },
    {
      icon: <Zap className="w-4 h-4 text-[#af8a52]" />,
      title: '24/7 Power & High-Speed Wi-Fi',
      paragraph: 'Stay connected and productive without interruption. Automatic generator backup guarantees round-the-clock electricity, paired with dual-band fiber Wi-Fi and quiet inverter climate control.'
    },
    {
      icon: <CigaretteOff className="w-4 h-4 text-[#af8a52]" />,
      title: '100% Smoke-Free & Pure Hygiene',
      paragraph: 'We strictly enforce a 100% smoke-free indoor environment. Every room and bathroom undergoes hospital-grade sanitation with fresh laundered linens before arrival, plus daily on-demand housekeeping.'
    },
    {
      icon: <MapPin className="w-4 h-4 text-[#af8a52]" />,
      title: 'Prime Medical & Central Hub',
      paragraph: 'Located quietly on Road 9/A, directly opposite Ibne Sina Hospital (9/A) and Northern Medical College. Walking distance to Dhanmondi Lake, Meena Bazar, banks, and Dhaka’s premier restaurants.'
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#af8a52]" />,
      title: '24/7 Security & Sincere Hospitality',
      paragraph: 'Rest with peace of mind under round-the-clock CCTV surveillance and secured access. Our attentive front desk team is on duty 24/7 to assist with luggage, local transit, and personalized guest needs.'
    },
    {
      icon: <Award className="w-4 h-4 text-[#af8a52]" />,
      title: 'Transparent Rates & Long Stays',
      paragraph: 'Enjoy premium hospitality at honest, competitive tariffs with zero hidden charges. Special discounted packages are available for medical travelers, corporate guests, and extended-stay visitors.'
    }
  ];

  return (
    <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 scroll-mt-20">
      <div className="bg-[#efe8d8]/50 border border-[#0e2b33]/15 rounded-2xl p-5 sm:p-8 lg:p-9 shadow-xs space-y-6">
        
        {/* Section Header - Compact Editorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0e2b33]/10 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-[#0e2b33] text-[#efe8d8] px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase shadow-2xs">
              <Compass className="w-3 h-3 text-[#af8a52]" />
              <span>THE ISLAMIA EXPERIENCE</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e2b33] tracking-tight">
              Why Guests Choose Islamia Guest House
            </h2>
            <p className="text-xs sm:text-sm text-[#0e2b33]/75 font-sans leading-normal">
              A tranquil boutique haven in central Dhanmondi tailored for corporate delegates, medical travelers, and families seeking refined comfort.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-white border border-[#0e2b33]/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0e2b33] shadow-2xs">
              <CigaretteOff className="w-3.5 h-3.5 text-emerald-600" />
              100% Smoke-Free
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-[#0e2b33]/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0e2b33] shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              24/7 Generator
            </span>
          </div>
        </div>

        {/* Paragraph-Style 3-Column Desktop Grid (Fits 1 Desktop Viewport) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {pillars.map((pillar, idx) => (
            <div 
              key={idx}
              className="bg-white/90 border border-[#0e2b33]/10 hover:border-[#af8a52]/60 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-2.5 group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0e2b33] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {pillar.icon}
                  </div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#0e2b33] group-hover:text-[#af8a52] transition-colors leading-tight">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                  {pillar.paragraph}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Dhanmondi Rd 9/A</span>
                <span className="text-[#af8a52] font-semibold">Islamia Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Hotline Footer Banner */}
        <div className="bg-[#0e2b33] text-white px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl border border-[#af8a52]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-[#af8a52]/20 border border-[#af8a52]/40 flex items-center justify-center text-[#af8a52] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm text-[#efe8d8]">
              <span className="font-bold text-white">Need immediate room booking or medical stay inquiries?</span> Our 24/7 reception desk is standing by.
            </p>
          </div>

          <a 
            href="tel:01909806960" 
            className="inline-flex items-center gap-2 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 px-4 py-2 rounded-lg font-bold text-xs transition duration-200 shrink-0 shadow-2xs whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call: 01909-806960</span>
          </a>
        </div>

      </div>
    </section>
  );
};



