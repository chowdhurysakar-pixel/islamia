import React from 'react';

import nationalParliamentImg from '../assets/images/national_parliament_dhaka_1785812392106.jpg';
import lalbaghFortImg from '../assets/images/lalbagh_fort_dhaka_1785812405532.jpg';
import ahsanManzilImg from '../assets/images/ahsan_manzil_dhaka_1785813447557.jpg';
import taraMasjidImg from '../assets/images/tara_masjid_dhaka_1785813463413.jpg';
import dhanmondiLakeImg from '../assets/images/dhanmondi_lake_dhaka_1785812418285.jpg';
import rabindraSarobarImg from '../assets/images/rabindra_sarobar_1787835690797.jpg';
import dhakaUniversityImg from '../assets/images/dhaka_university_1787835704900.jpg';
import nationalMuseumImg from '../assets/images/national_museum_1787835725342.jpg';
import aarongImg from '../assets/images/aarong_dhaka_1787835744302.jpg';
import newMarketImg from '../assets/images/new_market_dhaka_1787835765586.jpg';
import ramnaParkImg from '../assets/images/ramna_park_dhaka_1787835779889.jpg';
import highCourtImg from '../assets/images/high_court_dhaka_1787835795087.jpg';

interface LandmarkPhoto {
  id: string;
  name: string;
  distance: string;
  image: string;
  colSpan?: string;
}

const LANDMARK_PHOTOS: LandmarkPhoto[] = [
  { id: 'parliament', name: 'National Parliament', distance: '1.8 km', image: nationalParliamentImg },
  { id: 'lalbagh', name: 'Lalbagh Fort (Kella)', distance: '3.5 km', image: lalbaghFortImg },
  { id: 'ahsan-manzil', name: 'Ahsan Manzil (Pink Palace)', distance: '5.8 km', image: ahsanManzilImg },
  { id: 'tara-masjid', name: 'Tara Masjid (Star Mosque)', distance: '4.8 km', image: taraMasjidImg },
  { id: 'dhanmondi-lake', name: 'Dhanmondi Lake Park', distance: '200m', image: dhanmondiLakeImg },
  { id: 'rabindra-sarobar', name: 'Robindro Sorobor', distance: '500m', image: rabindraSarobarImg },
  { id: 'dhaka-university', name: 'Dhaka University (Curzon Hall)', distance: '3.5 km', image: dhakaUniversityImg },
  { id: 'new-market', name: 'Dhaka New Market', distance: '2.2 km', image: newMarketImg },
  { id: 'aarong', name: 'Aarong Dhanmondi', distance: '1.2 km', image: aarongImg },
  { id: 'national-museum', name: 'National Museum (Shahbagh)', distance: '3.0 km', image: nationalMuseumImg },
  { id: 'ramna-park', name: 'Ramna Park', distance: '3.8 km', image: ramnaParkImg },
  { id: 'high-court', name: 'High Court & Supreme Court', distance: '4.2 km', image: highCourtImg },
];

export const ExploreDhanmondi: React.FC = () => {
  return (
    <section id="events" className="bg-[#0e2b33] text-[#f8f4ec] py-20 px-6 my-16 rounded-3xl shadow-xl scroll-mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Title, Subtitle, Bullet Information with Distances, and WhatsApp Link */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-[11px] tracking-[0.28em] text-[#d7bd8a] font-bold uppercase">
            EXPLORE AROUND ISLAMIA GUEST HOUSE DHANMONDI
          </div>
          
          <h2 className="font-serif text-3xl sm:text-4xl text-white leading-tight">
            Discover Dhanmondi's Heritage & Iconic Landmarks
          </h2>
          
          <div className="space-y-3 text-xs sm:text-sm text-[#f8f4ec]/85 leading-relaxed">
            <p>
              Stay at the center of culture and history. From our prime Dhanmondi location, immerse yourself in Bangladesh's most celebrated architectural, cultural, and historic wonders:
            </p>
            
            <ul className="space-y-2.5 pt-1 border-t border-[#f8f4ec]/10">
              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🌊</span>
                <span>
                  <strong>Robindro Sorobor (500 meters):</strong> Open-air lakeside amphitheater & cultural hub by Dhanmondi Lake for evening acoustic music, lake breeze, and tea.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🎓</span>
                <span>
                  <strong>Dhaka University & Curzon Hall (3.5 km):</strong> Historic academic campus featuring the breathtaking 1904 red-brick Curzon Hall, Central Shaheed Minar, and TSC.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🛍️</span>
                <span>
                  <strong>Dhaka New Market (2.2 km):</strong> Historic 1950s shopping arcade famous for authentic handloom sarees, Bengal silk, fabrics, and traditional souvenirs.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🧵</span>
                <span>
                  <strong>Aarong Dhanmondi (1.2 km):</strong> BRAC's flagship ethical artisan lifestyle center offering exquisite Jamdani weaves, Nakshi Kantha embroidery, and handmade crafts.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🏛️</span>
                <span>
                  <strong>National Museum (3.0 km):</strong> Premier national museum in Shahbagh with 44+ galleries showcasing ancient sculptures, Mughal relics, and 1971 Liberation War history.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🌿</span>
                <span>
                  <strong>Ramna Park (3.8 km):</strong> 68-acre lush botanical sanctuary, serpentine lake, and historic venue of the dawn Pohela Boishakh festival at Ramna Batamul.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">⚖️</span>
                <span>
                  <strong>High Court & Supreme Court (4.2 km):</strong> Grand colonial Indo-Saracenic architectural landmark and seat of Bangladesh's apex judiciary.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🏛️</span>
                <span>
                  <strong>Jatiya Sangsad Bhaban (1.8 km):</strong> World-renowned brutalist parliament house designed by Louis Kahn, framed by scenic water pools.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🏰</span>
                <span>
                  <strong>Lalbagh Kella (Fort) (3.5 km):</strong> Majestic 17th-century Mughal fortress featuring the tomb of Pari Bibi and subterranean gardens.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🌿</span>
                <span>
                  <strong>Dhanmondi Lake Park (200 meters):</strong> Serene waterfront promenade located steps away for morning walks, fresh breeze, and local tea stalls.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-[#d7bd8a] font-bold">🕌</span>
                <span>
                  <strong>Ahsan Manzil & Tara Masjid (4.8–5.8 km):</strong> Explore the iconic Pink Palace on the Buriganga River and the stunning ornate Star Mosque in historic surroundings.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <a 
              href="https://wa.me/8801799148408?text=Hello%20Islamia%20Guest%20House,%20can%20you%20help%20me%20with%20guided%20tour%20directions%20around%20Dhanmondi?" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#d7bd8a] text-[#d7bd8a] hover:bg-[#d7bd8a] hover:text-[#0e2b33] px-6 py-2.5 text-xs font-bold tracking-wider rounded transition-all mt-2"
            >
              <span>Get Guided City Tour Info on WhatsApp</span> →
            </a>
          </div>
        </div>

        {/* Right Column: Grid of Landmark Photo Cards in Previous Style */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANDMARK_PHOTOS.map((landmark) => (
            <div 
              key={landmark.id} 
              className="relative group overflow-hidden rounded shadow-lg h-44 bg-slate-900"
            >
              <img 
                src={landmark.image} 
                alt={landmark.name} 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-2.5 flex flex-col justify-end">
                <span className="text-[11px] font-bold text-white tracking-wide drop-shadow line-clamp-1">
                  {landmark.name}
                </span>
                <span className="text-[10px] text-[#d7bd8a] font-mono font-medium drop-shadow">
                  {landmark.distance} from Islamia
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
