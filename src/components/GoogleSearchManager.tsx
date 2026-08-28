import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Globe, Search, CheckCircle2, Sparkles, ExternalLink, Star, MapPin, Phone, RefreshCw, AlertCircle, Save, Eye, Layers } from 'lucide-react';

export const GoogleSearchManager: React.FC = () => {
  const { seoSettings, updateSeoSettings, feedbacks } = useApp();

  const [metaTitle, setMetaTitle] = useState(seoSettings.metaTitle);
  const [metaDescription, setMetaDescription] = useState(seoSettings.metaDescription);
  const [keywords, setKeywords] = useState(seoSettings.keywords);
  const [canonicalUrl, setCanonicalUrl] = useState(seoSettings.canonicalUrl);
  const [ogImageUrl, setOgImageUrl] = useState(seoSettings.ogImageUrl);
  const [hotelName, setHotelName] = useState(seoSettings.hotelName);
  const [address, setAddress] = useState(seoSettings.address);
  const [phone, setPhone] = useState(seoSettings.phone);
  const [googleMapUrl, setGoogleMapUrl] = useState(seoSettings.googleMapUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [activePreviewDevice, setActivePreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    setMetaTitle(seoSettings.metaTitle || '');
    setMetaDescription(seoSettings.metaDescription || '');
    setKeywords(seoSettings.keywords || '');
    setCanonicalUrl(seoSettings.canonicalUrl || 'https://islamiaguesthouse.com/');
    setOgImageUrl(seoSettings.ogImageUrl || '');
    setHotelName(seoSettings.hotelName || 'Islamia Guest House Dhanmondi');
    setAddress(seoSettings.address || '');
    setPhone(seoSettings.phone || '');
    setGoogleMapUrl(seoSettings.googleMapUrl || '');
  }, [seoSettings]);

  // Compute live review metrics
  const totalReviews = feedbacks.length;
  const avgRating = totalReviews > 0
    ? Number((feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalReviews).toFixed(1))
    : 4.8;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSeoSettings({
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        keywords: keywords.trim(),
        canonicalUrl: canonicalUrl.trim(),
        ogImageUrl: ogImageUrl.trim(),
        hotelName: hotelName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        googleMapUrl: googleMapUrl.trim()
      });
    } catch (err) {
      console.error("Error saving SEO settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setMetaTitle("Islamia Guest House Dhanmondi - Premium Rooms & Suites in Dhaka");
    setMetaDescription("Book air-conditioned executive chambers & guest suites at Islamia Guest House, Road 9/A, Dhanmondi, Dhaka. Opposite Ibne Sina Hospital & behind Meena Bazar. 24/7 front desk & instant booking.");
    setKeywords("Islamia Guest House, Dhanmondi guest house, hotel Dhanmondi, Ibne Sina hospital room, Dhanmondi 9/A room, Dhaka guest house, room booking Dhanmondi");
    setCanonicalUrl("https://islamiaguesthouse.com/");
    setOgImageUrl("https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200");
    setHotelName("Islamia Guest House Dhanmondi");
    setAddress("House #39, Road #9/A, Dhanmondi R/A (Opposite Ibne Sina Hospital & behind Meena Bazar), Dhaka - 1209, Bangladesh");
    setPhone("+880 1711-542745");
    setGoogleMapUrl("https://maps.google.com/?q=Islamia+Guest+House+Dhanmondi+Dhaka");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Google Search Engine &amp; Rich Snippet Live Manager</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider font-mono">
                  Real-time SEO
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Customize how Islamia Guest House appears on Google Search results, mobile rich snippets, and social sharing cards. Changes update live in the site HTML head &amp; Schema.org JSON-LD.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Google Schema.org Active</span>
          </span>
        </div>
      </div>

      {/* Interactive Google Search Snippet Live Simulator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Live Google Search Result Preview (google.com/search)
            </span>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActivePreviewDevice('desktop')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                activePreviewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewDevice('mobile')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                activePreviewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Google Browser Shell Simulation */}
        <div className={`border border-slate-300 rounded-2xl bg-white shadow-md overflow-hidden transition-all ${
          activePreviewDevice === 'mobile' ? 'max-w-md mx-auto' : 'w-full'
        }`}>
          {/* Top Address Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-mono text-slate-600 flex items-center gap-2 shadow-inner">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">https://google.com/search?q=islamia+guest+house</span>
            </div>
          </div>

          {/* Google Search Page Content */}
          <div className="p-4 sm:p-6 bg-white space-y-4 font-sans">
            {/* Google Search Bar Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="text-xl font-bold font-serif text-blue-600 tracking-tight">
                <span className="text-blue-500">G</span>
                <span className="text-rose-500">o</span>
                <span className="text-amber-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-emerald-500">l</span>
                <span className="text-rose-500">e</span>
              </span>
              <div className="flex-1 max-w-lg bg-white border border-slate-300 rounded-full px-4 py-1.5 text-xs text-slate-800 flex items-center justify-between shadow-xs">
                <span>islamia guest house</span>
                <Search className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>

            {/* Google Search Result Card (Exact Match of Screenshot_12.png) */}
            <div className="p-4 rounded-xl hover:bg-slate-50/80 transition border border-transparent hover:border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  {/* Favicon & Domain */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-sans">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] shrink-0">
                      🏢
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 leading-none">islamiaguesthouse.com</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs">{canonicalUrl}</span>
                    </div>
                  </div>

                  {/* Title Link */}
                  <a
                    href={canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg sm:text-xl font-medium text-indigo-700 hover:underline block leading-snug cursor-pointer pt-0.5"
                  >
                    {metaTitle || 'Islamia Guest House Dhanmondi - Premium Rooms & Suites'}
                  </a>

                  {/* Rating Stars Badge & Review Aggregate */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                    <div className="flex items-center text-amber-500 font-bold gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <span>{avgRating}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-slate-600 font-medium">
                      ({totalReviews} Verified Guest {totalReviews === 1 ? 'Review' : 'Reviews'})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-sans">Dhanmondi, Dhaka</span>
                  </div>

                  {/* Snippet Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans pt-1">
                    {metaDescription || 'Book air-conditioned executive chambers & guest suites at Islamia Guest House, Road 9/A, Dhanmondi, Dhaka.'}
                  </p>

                  {/* Action Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {googleMapUrl && (
                      <a
                        href={googleMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Directions</span>
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call Front Desk</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Thumbnail Image */}
                {ogImageUrl && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100">
                    <img
                      src={ogImageUrl}
                      alt="Islamia Guest House Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Edit Form */}
      <form onSubmit={handleSave} className="space-y-6 border-t border-slate-100 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meta Title */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Google Search Title Tag (&lt;title&gt;)
              </label>
              <span className={`text-[11px] font-mono font-semibold ${
                metaTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {metaTitle.length} / 60 Chars (Recommended)
              </span>
            </div>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Islamia Guest House Dhanmondi - Premium Rooms & Suites in Dhaka"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
              required
            />
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Google Snippet Meta Description
              </label>
              <span className={`text-[11px] font-mono font-semibold ${
                metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {metaDescription.length} / 160 Chars (Recommended)
              </span>
            </div>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Book air-conditioned executive chambers & guest suites at Islamia Guest House, Road 9/A, Dhanmondi, Dhaka. Opposite Ibne Sina Hospital & behind Meena Bazar."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
              required
            />
          </div>

          {/* Keywords */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              SEO Keywords (Comma Separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Islamia Guest House, Dhanmondi guest house, hotel Dhanmondi, Ibne Sina hospital room, Dhaka room booking"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Hotel Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Official Property Name (Schema.org)
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Islamia Guest House Dhanmondi"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Canonical Website URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Canonical Domain URL
            </label>
            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://islamiaguesthouse.com/"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Featured Thumbnail Image URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Google Search &amp; Open Graph Preview Thumbnail URL
            </label>
            <input
              type="text"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-1590490360182-c33d57733427..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Property Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Property Location &amp; Landmark Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #39, Road #9/A, Dhanmondi R/A (Opposite Ibne Sina Hospital & behind Meena Bazar), Dhaka"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Google Call Action Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1711-542745"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Google Maps Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Google Maps Location Link
            </label>
            <input
              type="url"
              value={googleMapUrl}
              onChange={(e) => setGoogleMapUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=Islamia+Guest+House+Dhanmondi+Dhaka"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={resetToDefault}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default Meta Tags</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Google Index & Head Meta...' : 'Save & Publish Live to Google Search'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
