import React from 'react';

export const WhyChooseUs: React.FC = () => {
  const leftColumnItems = [
    {
      num: '1',
      title: 'Home-Like Comfort, Hotel-Grade Service',
      desc: 'Experience the warmth of home with the ease of a hotel. Every room is designed for calm, quiet, and serenity– your personal retreat in the heart of Dhanmondi.'
    },
    {
      num: '2',
      title: 'Uninterrupted Essentials, 24/7',
      desc: 'High-speed WiFi, smart TV, air conditioning, and reliable electricity – always on, so you can work, stream, and rest without a second thought.'
    },
    {
      num: '3',
      title: 'Immaculate & On-Demand Housekeeping',
      desc: 'We maintain hotel-wide standards of cleanliness. Need your room refreshed? Our housekeeping team is available on request, any time of day.'
    },
    {
      num: '4',
      title: '100% Smoke-Free & Eco-Conscious Stay',
      desc: 'We are a completely smoke-free property. From energy-efficient systems to sustainable practices, we prioritize your health and the environment.'
    },
    {
      num: '5',
      title: 'Assured Safety & Security',
      desc: '24/7 CCTV surveillance, secure key access, and a trained security team ensure you and your belongings are protected throughout your stay.'
    }
  ];

  const rightColumnItems = [
    {
      num: '6',
      title: 'Curated Food Delivery Partnerships',
      desc: "While we don't operate an in-house kitchen, we've partnered with Dhaka's top restaurants. Enjoy diverse cuisine delivered to your door, hot and hassle-free."
    },
    {
      num: '7',
      title: 'Warm, Attentive Team',
      desc: 'Our friendly, multilingual staff are always on hand to assist – from local recommendations to late-night requests. Service with a genuine smile.'
    },
    {
      num: '8',
      title: 'Exceptional Value, Transparent Pricing',
      desc: 'Enjoy premium comfort at a reasonable price. No hidden charges, just honest hospitality that feels like home.'
    },
    {
      num: '9',
      title: 'Exclusive Privileges for Select Guests',
      desc: 'We offer special discounts and perks for corporate clients, long-stay guests, and returning visitors. Terms and conditions apply.'
    },
    {
      num: '10',
      title: 'A Sanctuary for Rest & Focus',
      desc: "No noise, no chaos. Our serene atmosphere is ideal for business travelers, solo guests, and anyone seeking a peaceful night's sleep."
    }
  ];

  return (
    <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 scroll-mt-20">
      <div className="bg-[#efe8d8]/40 border border-[#0e2b33]/15 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
        
        {/* Section Heading */}
        <div className="border-b border-[#0e2b33]/15 pb-4">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e2b33] tracking-tight">
            Why Guests choose us?
          </h2>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column (Items 1 - 5) */}
          <div className="space-y-6">
            {leftColumnItems.map((item) => (
              <div key={item.num} className="space-y-1.5 border-b border-slate-200/70 pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0e2b33]">
                  {item.num}. {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column (Items 6 - 10) */}
          <div className="space-y-6">
            {rightColumnItems.map((item) => (
              <div key={item.num} className="space-y-1.5 border-b border-slate-200/70 pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0e2b33]">
                  {item.num}. {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Tagline */}
        <div className="pt-4 border-t border-[#0e2b33]/15 text-center">
          <p className="font-serif text-sm sm:text-base font-semibold text-[#0e2b33] italic">
            Your Sanctuary of Safety & Serenity
          </p>
        </div>

      </div>
    </section>
  );
};





