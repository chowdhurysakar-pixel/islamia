import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Smartphone,
  Compass,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReasonItem {
  num: string;
  tag: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlights: string[];
  accentColor: string;
}

export const WhyChooseUs: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const reasons: ReasonItem[] = [
    {
      num: '01',
      tag: 'Boutique Living',
      icon: <Home className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Home-Like Comfort, Hotel-Grade Service',
      description: 'Experience the warmth and tranquility of a private home with the effortless convenience of a full-service boutique hotel in central Dhanmondi.',
      highlights: [
        'Custom plush bedding & ergonomic work desks',
        'Private en-suite sanitized luxury washrooms',
        'Dedicated concierge & luggage assistance'
      ],
      accentColor: 'from-[#0e2b33] to-[#16434f]'
    },
    {
      num: '02',
      tag: 'Power & WiFi',
      icon: <Zap className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Uninterrupted Modern Essentials, 24/7',
      description: 'Stay connected and productive without compromise. Ultra-fast dual-band WiFi and instantaneous auto-start generator backup ensure seamless operations day & night.',
      highlights: [
        'Dedicated high-speed fiber internet coverage',
        'Auto-start silent heavy-duty generator backup',
        'Wall-mounted Smart LED TVs with streaming support'
      ],
      accentColor: 'from-[#0e2b33] to-[#1a3840]'
    },
    {
      num: '03',
      tag: 'Sanitation Standards',
      icon: <Sparkles className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Immaculate Hygiene & Housekeeping',
      description: 'We adhere to luxury hospital-grade cleanliness standards. Fresh sanitized linens, deep-cleaned fixtures, and on-call housekeeping guarantee immaculate comfort.',
      highlights: [
        'UV-sanitized linens & crisp fresh towels',
        '24/7 on-demand room makeup & trash clearance',
        'Eco-friendly complimentary premium toiletries'
      ],
      accentColor: 'from-[#0e2b33] to-[#123640]'
    },
    {
      num: '04',
      tag: 'Pure Air Haven',
      icon: <CigaretteOff className="w-6 h-6 text-[#d7bd8a]" />,
      title: '100% Smoke-Free & Eco-Conscious',
      description: 'Breathe pure, fresh air. Islamia Guest House maintains a strictly enforced 100% non-smoking policy across all guest rooms, lobbies, and indoor corridors.',
      highlights: [
        'Zero indoor smoke residue or tobacco odor',
        'Inverter energy-saving air purification & climate units',
        'Quiet, eco-friendly LED lighting across all wings'
      ],
      accentColor: 'from-[#0e2b33] to-[#174652]'
    },
    {
      num: '05',
      tag: '24/7 Security',
      icon: <ShieldCheck className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Assured Safety, Privacy & CCTV Coverage',
      description: 'Your safety and peace of mind are non-negotiable. Round-the-clock digital surveillance and trained security personnel keep you fully protected.',
      highlights: [
        '24/7 multi-angle CCTV coverage on all entries',
        'Electronic secure keycard locking hardware',
        'Front desk guest verification & night security guard'
      ],
      accentColor: 'from-[#0e2b33] to-[#1b3f49]'
    },
    {
      num: '06',
      tag: 'Dining & Cafes',
      icon: <UtensilsCrossed className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Curated Gourmet Dining & Food Delivery',
      description: 'Enjoy Dhanmondi’s world-renowned food scene straight from your bed. We partner with top neighborhood kitchens and delivery riders for piping-hot doorstep meals.',
      highlights: [
        'Fast doorstep delivery from nearby premier cafes',
        'Complimentary morning tea and mineral water',
        'In-room dining table and clean tableware sets'
      ],
      accentColor: 'from-[#0e2b33] to-[#133742]'
    },
    {
      num: '07',
      tag: 'Hospitality',
      icon: <HeartHandshake className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Warm, Attentive & Courteous Care',
      description: 'Our hospitable team members treat every visitor like cherished family, offering personal assistance with authentic Bangladeshi warmth.',
      highlights: [
        '24/7 reception desk for immediate support',
        'Airport transfer & ride hailing assistance',
        'Dhanmondi medical & shopping district navigation tips'
      ],
      accentColor: 'from-[#0e2b33] to-[#19404c]'
    },
    {
      num: '08',
      tag: 'Transparent Value',
      icon: <BadgePercent className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Competitive Tariffs & Zero Hidden Fees',
      description: 'Experience premium hospitality at straightforward, honest rates. Verified pricing, instant receipts, and no surprise checkout charges.',
      highlights: [
        'Crystal clear itemized check-in invoices',
        'bKash, Cash, and Digital payment flexibility',
        'Best direct booking rate guarantee'
      ],
      accentColor: 'from-[#0e2b33] to-[#153e48]'
    },
    {
      num: '09',
      tag: 'Extended Stays',
      icon: <Award className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'Corporate Packages & Medical Privileges',
      description: 'Special accommodations for frequent delegates, extended medical visitors at Ibne Sina / Northern Medical, and long-term university faculty.',
      highlights: [
        'Tiered weekly & monthly long-stay discounts',
        'Priority early check-in & late checkout options',
        'Formal corporate invoicing & billing support'
      ],
      accentColor: 'from-[#0e2b33] to-[#1a4450]'
    },
    {
      num: '10',
      tag: 'Peace & Quiet',
      icon: <Moon className="w-6 h-6 text-[#d7bd8a]" />,
      title: 'A Quiet Sanctuary Tailored for Rest & Sleep',
      description: 'Escape the rush of Dhaka. Thoughtfully insulated building architecture minimizes street traffic and corridor sounds for deep, restorative sleep.',
      highlights: [
        'Acoustically buffered walls & solid core doors',
        'Blackout privacy curtains for sound daytime rest',
        'Whisper-quiet inverter AC units in every chamber'
      ],
      accentColor: 'from-[#0e2b33] to-[#11313a]'
    }
  ];

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reasons.length);
  }, [reasons.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reasons.length) % reasons.length);
  }, [reasons.length]);

  const handleSelect = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play timer (optional)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, handleNext]);

  const activeReason = reasons[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 scroll-mt-24">
      <div className="bg-[#efe8d8]/40 border border-[#0e2b33]/15 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-sm space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#0e2b33] text-[#efe8d8] px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Smartphone className="w-3.5 h-3.5 text-[#d7bd8a]" />
            <span>DISCOVER ISLAMIA • 10 HIGHLIGHTS</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#0e2b33] tracking-tight">
            Why Guests Choose Islamia Guest House
          </h2>
          <p className="text-xs sm:text-sm text-[#0e2b33]/80 leading-relaxed">
            Swipe or tap to explore each key advantage of our peaceful boutique residence in Dhanmondi.
          </p>
        </div>

        {/* Mobile-First Single-Page Showcase Card Container */}
        <div className="max-w-md sm:max-w-lg mx-auto">
          
          {/* Mobile Screen Shell Frame */}
          <div className="relative bg-[#081b21] rounded-[2.5rem] p-3 sm:p-4 shadow-2xl border-4 border-[#0e2b33] ring-1 ring-[#d7bd8a]/40 overflow-hidden">
            
            {/* Top Phone Status & Story Progress Bar (10 segments) */}
            <div className="px-3 pt-2 pb-3 space-y-2.5">
              {/* Speaker / Camera Notch Mockup */}
              <div className="flex items-center justify-between text-[10px] text-[#efe8d8]/60 font-mono">
                <span className="font-bold tracking-wider text-[#d7bd8a]">ISLAMIA DISPATCH</span>
                <div className="w-16 h-3 bg-black/50 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
                <span className="font-bold">{currentIndex + 1} / {reasons.length}</span>
              </div>

              {/* 10 Segment Story Progress Indicator */}
              <div className="grid grid-cols-10 gap-1 pt-1">
                {reasons.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    className="h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer bg-white/20 hover:bg-white/40 focus:outline-none"
                    title={`View reason ${i + 1}`}
                  >
                    <div 
                      className={`h-full transition-all duration-300 ${
                        i === currentIndex 
                          ? 'bg-[#d7bd8a] w-full shadow-sm' 
                          : i < currentIndex 
                            ? 'bg-[#af8a52]/80 w-full' 
                            : 'w-0'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Single Mobile Page Content Viewport */}
            <div className="relative min-h-[460px] sm:min-h-[490px] rounded-[2rem] bg-gradient-to-b from-[#0e2b33] via-[#092229] to-[#081b21] border border-[#d7bd8a]/20 p-5 sm:p-7 flex flex-col justify-between overflow-hidden text-white select-none">
              
              {/* Subtle background ambient glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#af8a52]/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#d7bd8a]/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 relative z-10 flex flex-col justify-between h-full"
                >
                  {/* Top Mobile Card Row: Big Number, Tag Badge, Icon */}
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-3xl sm:text-4xl font-black text-[#d7bd8a] tracking-tight drop-shadow-sm font-mono">
                          {activeReason.num}
                        </span>
                        <div className="inline-flex items-center gap-1 bg-[#d7bd8a]/15 text-[#d7bd8a] border border-[#d7bd8a]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                          <Compass className="w-3 h-3 text-[#d7bd8a]" />
                          <span>{activeReason.tag}</span>
                        </div>
                      </div>

                      <div className="w-11 h-11 rounded-2xl bg-[#081b21] border border-[#d7bd8a]/40 flex items-center justify-center shadow-inner">
                        {activeReason.icon}
                      </div>
                    </div>

                    {/* Card Title & Description */}
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {activeReason.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#efe8d8]/85 leading-relaxed font-sans">
                        {activeReason.description}
                      </p>
                    </div>

                    {/* Key Highlights Bullet Points */}
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#d7bd8a] font-bold">
                        Key Advantages:
                      </p>
                      <div className="space-y-1.5">
                        {activeReason.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#d7bd8a] shrink-0 mt-0.5" />
                            <span className="text-xs text-[#efe8d8] font-medium leading-tight">
                              {highlight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Stamp */}
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/10">
                    <span className="text-[#d7bd8a] font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#d7bd8a] fill-[#d7bd8a]" />
                      Islamia Guest House
                    </span>
                    <span>Dhanmondi, Dhaka</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tap Left / Right Overlay Touch Zones */}
              <div 
                className="absolute inset-y-16 left-0 w-1/4 z-20 cursor-pointer opacity-0"
                onClick={handlePrev}
                title="Tap to go to previous reason"
              />
              <div 
                className="absolute inset-y-16 right-0 w-1/4 z-20 cursor-pointer opacity-0"
                onClick={handleNext}
                title="Tap to go to next reason"
              />
            </div>

            {/* Mobile Footer Controls (Previous / Next / Auto-play / Direct Dots) */}
            <div className="pt-4 pb-2 px-2 space-y-3">
              
              {/* Primary Nav Controls */}
              <div className="flex items-center justify-between gap-2">
                <button
                  id="why-us-prev-btn"
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0e2b33] hover:bg-[#153f4b] text-[#efe8d8] text-xs font-bold border border-[#d7bd8a]/30 transition active:scale-95 cursor-pointer shadow-sm"
                  aria-label="Previous reason"
                >
                  <ChevronLeft className="w-4 h-4 text-[#d7bd8a]" />
                  <span>Previous</span>
                </button>

                <button
                  id="why-us-autoplay-toggle"
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                    isAutoPlaying 
                      ? 'bg-[#d7bd8a] text-slate-950 border-[#d7bd8a]' 
                      : 'bg-[#0e2b33] text-[#d7bd8a] border-[#d7bd8a]/30 hover:bg-[#153f4b]'
                  }`}
                  title={isAutoPlaying ? 'Pause Auto-Play' : 'Start Auto-Play'}
                >
                  {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  id="why-us-next-btn"
                  type="button"
                  onClick={handleNext}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
                  aria-label="Next reason"
                >
                  <span>Next Reason</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>

              {/* Number Thumbnails / Direct Quick-Jump Bar */}
              <div className="flex items-center justify-center gap-1 overflow-x-auto py-1">
                {reasons.map((r, i) => (
                  <button
                    key={r.num}
                    type="button"
                    onClick={() => handleSelect(i)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                      i === currentIndex
                        ? 'bg-[#d7bd8a] text-slate-950 scale-110 shadow-sm'
                        : 'bg-[#0e2b33]/80 text-[#efe8d8]/60 hover:text-white hover:bg-[#0e2b33]'
                    }`}
                  >
                    {r.num}
                  </button>
                ))}
              </div>

            </div>

          </div>

        </div>

        {/* Quick Hotline Banner */}
        <div className="max-w-3xl mx-auto bg-[#0e2b33] text-white p-5 sm:p-6 rounded-2xl border border-[#af8a52]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#af8a52]/20 border border-[#af8a52]/40 flex items-center justify-center text-[#af8a52] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-serif text-sm sm:text-base font-bold text-white">Need Immediate Room Reservation?</h4>
              <p className="text-xs text-[#efe8d8]/80">Our 24/7 front desk is standing by to confirm room availability and tariffs.</p>
            </div>
          </div>

          <a 
            href="tel:01909806960" 
            className="inline-flex items-center gap-2 bg-[#af8a52] hover:bg-[#c29b5f] text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 shrink-0 shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Desk: 01909-806960</span>
          </a>
        </div>

      </div>
    </section>
  );
};


