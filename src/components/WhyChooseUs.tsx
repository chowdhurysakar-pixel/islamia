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
  CheckCircle2
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const reasons = [
    {
      icon: <Home className="w-6 h-6 text-[#af8a52]" />,
      title: 'Home-Like Comfort, Hotel-Grade Service',
      description: 'Experience the warmth of home with the ease of a hotel. Every room is designed for calm, quiet, and serenity—your personal retreat in the heart of Dhanmondi.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#af8a52]" />,
      title: 'Uninterrupted Essentials, 24/7',
      description: 'High-speed WiFi, smart TV, air conditioning, and reliable electricity—always on, so you can work, stream, and rest without a second thought.'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#af8a52]" />,
      title: 'Immaculate & On-Demand Housekeeping',
      description: 'We maintain hotel-wide standards of cleanliness. Need your room refreshed? Our housekeeping team is available on request, any time of day.'
    },
    {
      icon: <CigaretteOff className="w-6 h-6 text-[#af8a52]" />,
      title: '100% Smoke-Free & Eco-Conscious Stay',
      description: 'We are a completely smoke-free property. From energy-efficient systems to sustainable practices, we prioritize your health and the environment.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#af8a52]" />,
      title: 'Assured Safety & Security',
      description: '24/7 CCTV surveillance, secure key access, and a trained security team ensure you and your belongings are protected throughout your stay.'
    },
    {
      icon: <UtensilsCrossed className="w-6 h-6 text-[#af8a52]" />,
      title: 'Curated Food Delivery Partnerships',
      description: "While we don't operate an in-house kitchen, we've partnered with Dhaka's top restaurants. Enjoy diverse cuisine delivered to your door, hot and hassle-free."
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-[#af8a52]" />,
      title: 'Warm, Attentive Team',
      description: 'Our friendly, multilingual staff are always on hand to assist—from local recommendations to late-night requests. Service with a genuine smile.'
    },
    {
      icon: <BadgePercent className="w-6 h-6 text-[#af8a52]" />,
      title: 'Exceptional Value, Transparent Pricing',
      description: 'Enjoy premium comfort at a reasonable price. No hidden charges, just honest hospitality that feels like home.'
    },
    {
      icon: <Award className="w-6 h-6 text-[#af8a52]" />,
      title: 'Exclusive Privileges for Select Guests',
      description: 'We offer special discounts and perks for corporate clients, long-stay guests, and returning visitors. Terms and conditions apply.'
    },
    {
      icon: <Moon className="w-6 h-6 text-[#af8a52]" />,
      title: 'A Sanctuary for Rest & Focus',
      description: 'No noise, no chaos. Our serene atmosphere is ideal for business travelers, solo guests, and anyone seeking a peaceful night\'s sleep.'
    }
  ];

  return (
    <section id="why-us" className="max-w-7xl mx-auto px-6 mb-16 scroll-mt-24">
      <div className="bg-[#efe8d8]/50 border border-[#0e2b33]/15 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#0e2b33] text-[#efe8d8] px-3.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#af8a52]" />
            <span>WHY GUESTS CHOOSE US</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0e2b33] tracking-tight">
            Why Guests Choose Islamia Guest House
          </h2>
          <p className="text-xs sm:text-sm text-[#0e2b33]/80 leading-relaxed">
            Discover why business travelers, families, medical guests, and tourists consistently choose our serene boutique guest house in Dhanmondi, Dhaka.
          </p>
        </div>

        {/* 2-Column Responsive Feature Grid (1 column on mobile, 2 columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reasons.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white border border-[#0e2b33]/10 hover:border-[#af8a52]/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0e2b33]/5 border border-[#0e2b33]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0e2b33] transition-colors duration-200">
                <span className="group-hover:text-[#af8a52] transition-colors">
                  {item.icon}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#0e2b33] group-hover:text-[#af8a52] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Hotline Banner */}
        <div className="bg-[#0e2b33] text-white p-5 rounded-2xl border border-[#af8a52]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#af8a52]/20 border border-[#af8a52]/40 flex items-center justify-center text-[#af8a52] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-white">Need Immediate Chamber Reservation?</h4>
              <p className="text-xs text-[#efe8d8]/80">Our front desk concierge is standing by 24/7 to confirm room availability.</p>
            </div>
          </div>

          <a 
            href="tel:01909806960" 
            className="inline-flex items-center gap-2 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 shrink-0 shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Call Desk: 01909-806960</span>
          </a>
        </div>

      </div>
    </section>
  );
};
