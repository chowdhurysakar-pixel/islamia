import React from 'react';
import { 
  Home, 
  Zap, 
  Sparkles, 
  CigaretteOff, 
  ShieldCheck, 
  UtensilsCrossed, 
  HeartHandshake, 
  BadgePercent, 
  Award, 
  Moon,
  Phone,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const reasons = [
    {
      num: '01',
      icon: <Home className="w-5 h-5 text-[#af8a52]" />,
      title: 'Home-Like Comfort, Hotel-Grade Service',
      description: 'Experience the warmth and tranquility of a private home with the effortless convenience of a full-service hotel. Every room at Islamia Guest House is meticulously appointed for calm, quiet, and ultimate privacy—creating your ideal personal retreat in Dhanmondi.'
    },
    {
      num: '02',
      icon: <Zap className="w-5 h-5 text-[#af8a52]" />,
      title: 'Uninterrupted Modern Essentials, 24/7',
      description: 'Stay connected and comfortable without compromise. High-speed dual-band WiFi, wall-mounted smart TVs, quiet inverter climate control, and uninterrupted generator power backup ensure your work, entertainment, and rest continue seamlessly day and night.'
    },
    {
      num: '03',
      icon: <Sparkles className="w-5 h-5 text-[#af8a52]" />,
      title: 'Immaculate Hygiene & On-Demand Housekeeping',
      description: 'We adhere to luxury hospital-grade cleanliness standards. Fresh sanitized linens, deep-cleaned private washrooms, and crisp towels are standard for every arrival. Need your room refreshed during your stay? Our dedicated housekeeping staff is on call 24 hours a day.'
    },
    {
      num: '04',
      icon: <CigaretteOff className="w-5 h-5 text-[#af8a52]" />,
      title: '100% Smoke-Free & Eco-Conscious Haven',
      description: 'Breathe pure, fresh air. Islamia Guest House maintains a strictly enforced 100% non-smoking policy throughout all indoor rooms and hallways. Combined with energy-efficient LED lighting and eco-friendly guest amenities, we care for both your wellbeing and our planet.'
    },
    {
      num: '05',
      icon: <ShieldCheck className="w-5 h-5 text-[#af8a52]" />,
      title: 'Assured Safety, Privacy & CCTV Security',
      description: 'Your safety and peace of mind are non-negotiable. With round-the-clock CCTV surveillance monitoring entryways, secure electronic keycard access, and a trained front desk security concierge, you and your valuables remain completely protected at all times.'
    },
    {
      num: '06',
      icon: <UtensilsCrossed className="w-5 h-5 text-[#af8a52]" />,
      title: 'Curated Gourmet Dining & Delivery Partnerships',
      description: "Enjoy Dhanmondi's rich culinary scene directly from the comfort of your bed. While we prioritize quiet guest quarters over kitchen noise, we partner with premier local dining establishments and food delivery services to bring piping-hot meals straight to your door."
    },
    {
      num: '07',
      icon: <HeartHandshake className="w-5 h-5 text-[#af8a52]" />,
      title: 'Warm, Attentive & Multilingual Hospitality',
      description: 'Our hospitable team members treat every visitor like family. From assisting with luggage and arranging city transport to providing insider tips on Dhaka’s cultural hubs, our 24/7 desk staff delivers prompt, heartfelt service with genuine Bangladeshi warmth.'
    },
    {
      num: '08',
      icon: <BadgePercent className="w-5 h-5 text-[#af8a52]" />,
      title: 'Exceptional Value & Transparent Tariff Structure',
      description: 'Experience premium hospitality at honest, competitive rates. We maintain zero hidden fees, clear booking receipts, and fair seasonal tariffs, offering medical guests, business travelers, and families unmatched value in central Dhanmondi.'
    },
    {
      num: '09',
      icon: <Award className="w-5 h-5 text-[#af8a52]" />,
      title: 'Exclusive Privileges for Long Stays & Corporate Guests',
      description: 'We reward our frequent visitors and extended-stay guests. Enjoy tailored corporate rate agreements, priority check-in privileges, and discounted weekly or monthly tariff packages designed for medical visitors, university faculty, and business delegates.'
    },
    {
      num: '10',
      icon: <Moon className="w-5 h-5 text-[#af8a52]" />,
      title: 'A Quiet Sanctuary Tailored for Rest & Focus',
      description: 'Escape the bustle of Dhaka. Our thoughtfully isolated building layout minimizes corridor noise and traffic distractions, providing a peaceful environment where business executives can work uninterrupted and travelers can enjoy deep, restorative sleep.'
    }
  ];

  return (
    <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 scroll-mt-24">
      <div className="bg-[#efe8d8]/50 border border-[#0e2b33]/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm space-y-10">
        
        {/* Section Header - Editorial Style */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#0e2b33] text-[#efe8d8] px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#af8a52]" />
            <span>EXECUTIVE INSIGHTS &amp; GUEST DISPATCHES</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#0e2b33] tracking-tight">
            10 Reasons Why Guests Choose Islamia Guest House
          </h2>
          <p className="text-xs sm:text-base text-[#0e2b33]/80 leading-relaxed font-sans">
            A comprehensive guide to why corporate executives, medical travelers, families, and long-stay guests consistently select our serene boutique residence in Dhanmondi.
          </p>
        </div>

        {/* 2-Column Responsive Blog-Style Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {reasons.map((item) => (
            <article 
              key={item.num}
              className="bg-white border border-[#0e2b33]/12 hover:border-[#af8a52] p-6 sm:p-8 rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4 relative z-10">
                {/* Header Row: Index Number & Category Icon */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="font-serif text-3xl sm:text-4xl font-black text-[#af8a52] group-hover:text-[#0e2b33] transition-colors tracking-tight">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#0e2b33]/5 border border-[#0e2b33]/10 flex items-center justify-center group-hover:bg-[#0e2b33] transition-colors duration-300">
                    <span className="group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="space-y-2.5">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0e2b33] group-hover:text-[#af8a52] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Accent Bottom Line */}
              <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-[#af8a52] font-semibold">Islamia Guest House • Dhanmondi</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">Read Article &rarr;</span>
              </div>
            </article>
          ))}
        </div>

        {/* Quick Hotline Banner */}
        <div className="bg-[#0e2b33] text-white p-6 sm:p-8 rounded-2xl border border-[#af8a52]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#af8a52]/20 border border-[#af8a52]/40 flex items-center justify-center text-[#af8a52] shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-base sm:text-lg font-bold text-white">Need Immediate Room Reservation?</h4>
              <p className="text-xs sm:text-sm text-[#efe8d8]/80">Our 24/7 front desk concierge is standing by to confirm room availability and tariffs.</p>
            </div>
          </div>

          <a 
            href="tel:01909806960" 
            className="inline-flex items-center gap-2.5 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition duration-200 shrink-0 shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Call Desk: 01909-806960</span>
          </a>
        </div>

      </div>
    </section>
  );
};

