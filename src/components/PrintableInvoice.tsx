import React, { useState, useMemo } from 'react';
import { Booking, Room } from '../types';
import { 
  Printer, X, Receipt, Sparkles, AlertCircle, 
  Check, Minimize, Eye, ToggleLeft, ToggleRight, 
  FileText, Calendar, User, Phone, MapPin, CreditCard,
  Hash, ShieldCheck, HelpCircle, Info
} from 'lucide-react';

interface PrintableInvoiceProps {
  booking: Booking;
  rooms: Room[];
  onClose: () => void;
}

type PaperFormat = 'standard' | 'thermal-80' | 'thermal-58';
type FontSize = 'xs' | 'sm' | 'base';

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ booking, rooms, onClose }) => {
  // Configurable states
  const [format, setFormat] = useState<PaperFormat>('thermal-80');
  const [fontSize, setFontSize] = useState<FontSize>('sm');
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showStamp, setShowStamp] = useState<boolean>(true);
  const [cashierName, setCashierName] = useState<string>('Reception Desk 1');

  // Find corresponding room if available
  const associatedRoom = useMemo(() => {
    return rooms.find(r => r.id === booking.roomId || r.number === booking.roomNumber);
  }, [rooms, booking]);

  // Helpers
  const calcNights = (inD: string, outD: string) => {
    const start = new Date(inD);
    const end = new Date(outD);
    const diff = end.getTime() - start.getTime();
    if (isNaN(diff)) return 1;
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = useMemo(() => {
    return calcNights(booking.checkIn, booking.checkOut);
  }, [booking.checkIn, booking.checkOut]);

  // BDT calculations matching Dhaka rules
  const billing = useMemo(() => {
    const totalBDT = booking.totalAmount * 10;
    const vat = Math.round(totalBDT * 0.15);
    const serviceFee = Math.round(totalBDT * 0.05);
    const subtotal = totalBDT - vat - serviceFee;
    return {
      subtotal: subtotal > 0 ? subtotal : totalBDT,
      vat: subtotal > 0 ? vat : 0,
      serviceFee: subtotal > 0 ? serviceFee : 0,
      grandTotal: totalBDT,
      ratePerNight: Math.round(totalBDT / nights)
    };
  }, [booking.totalAmount, nights]);

  // Dynamic Print stylesheet injection to handle Page-setup, Margins, and thermal width boundaries perfectly.
  const printStyles = `
    @media print {
      /* Hide everything except the printable container */
      body * {
        visibility: hidden;
        background: none !important;
      }
      #print-area-wrapper, #print-area-wrapper * {
        visibility: visible;
      }
      #print-area-wrapper {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print {
        display: none !important;
      }
      
      /* Specific settings depending on selected paper size */
      @page {
        margin: 0;
        size: auto;
      }
      
      ${format === 'thermal-80' ? `
        @page {
          size: 80mm auto;
          margin: 0mm;
        }
        #printable-slip {
          width: 76mm !important;
          max-width: 76mm !important;
          padding: 2mm !important;
          margin: 0 auto !important;
          font-size: ${fontSize === 'xs' ? '10px' : fontSize === 'sm' ? '12px' : '14px'} !important;
        }
      ` : ''}

      ${format === 'thermal-58' ? `
        @page {
          size: 58mm auto;
          margin: 0mm;
        }
        #printable-slip {
          width: 54mm !important;
          max-width: 54mm !important;
          padding: 1mm !important;
          margin: 0 auto !important;
          font-size: ${fontSize === 'xs' ? '8px' : fontSize === 'sm' ? '10px' : '12px'} !important;
        }
      ` : ''}

      ${format === 'standard' ? `
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        #printable-slip {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      ` : ''}
    }
  `;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <style>{printStyles}</style>

      {/* Main Container */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col lg:flex-row overflow-hidden my-8 h-[90vh] lg:h-[85vh]">
        
        {/* LEFT COLUMN: CONTROL & ADJUSTMENT TOOLBAR PANEL */}
        <div className="lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col justify-between overflow-y-auto no-print">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-teal-50 p-2 rounded-xl border border-teal-100">
                  <Receipt className="w-5 h-5 text-teal-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-800">Invoice Workshop</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Customize thermal & laser outputs</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="lg:hidden p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Config options */}
            <div className="space-y-4">
              {/* Paper Format */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Paper Slip Layout
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'thermal-80', label: '80mm POS', desc: 'Standard slip' },
                    { id: 'thermal-58', label: '58mm POS', desc: 'Mini receipt' },
                    { id: 'standard', label: 'A4 Page', desc: 'Laser invoice' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id as PaperFormat)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        format === f.id 
                          ? 'border-teal-600 bg-teal-50/50 text-teal-900 ring-1 ring-teal-600' 
                          : 'border-slate-200 hover:border-slate-350 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="font-semibold text-xs block truncate">{f.label}</span>
                      <span className="text-[8px] text-slate-400 font-mono block mt-0.5">{f.desc}</span>
                      {format === f.id && (
                        <div className="absolute right-1 top-1 bg-teal-600 text-white rounded-full p-0.5 scale-75">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Adjust */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Receipt Font Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'xs', label: 'Compact' },
                    { id: 'sm', label: 'Regular' },
                    { id: 'base', label: 'Large' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setFontSize(sz.id as FontSize)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                        fontSize === sz.id 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cashier input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Cashier / Terminal Name
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white transition-all focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Front Desk Terminal 1"
                />
              </div>

              {/* Toggle Utilities */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Visual Features
                </label>

                {/* Barcode toggle */}
                <div className="flex justify-between items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">Print Barcode</span>
                    <p className="text-[9px] text-slate-400 font-mono">Unique code for automated scans</p>
                  </div>
                  <button 
                    onClick={() => setShowBarcode(!showBarcode)}
                    className="text-slate-500 hover:text-slate-800 transition"
                  >
                    {showBarcode ? (
                      <ToggleRight className="w-8 h-8 text-teal-600 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* QR Code toggle */}
                <div className="flex justify-between items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">Verification QR Code</span>
                    <p className="text-[9px] text-slate-400 font-mono">Encodes suite verify links</p>
                  </div>
                  <button 
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-slate-500 hover:text-slate-800 transition"
                  >
                    {showQrCode ? (
                      <ToggleRight className="w-8 h-8 text-teal-600 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* Stamp toggle */}
                <div className="flex justify-between items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">Islamia Official Stamp</span>
                    <p className="text-[9px] text-slate-400 font-mono">Paid badge & check-out signature</p>
                  </div>
                  <button 
                    onClick={() => setShowStamp(!showStamp)}
                    className="text-slate-500 hover:text-slate-800 transition"
                  >
                    {showStamp ? (
                      <ToggleRight className="w-8 h-8 text-teal-600 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-2 mt-4 lg:mt-0">
            <button
              id="re-print-btn"
              onClick={() => window.print()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/10 active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Send to Print Spooler</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition text-center"
            >
              Back to Operations
            </button>
            
            {/* Quick Helper Tip */}
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200/50 flex items-start gap-2 text-[10px] text-amber-800">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Printer Tip:</strong> In your browser print window, select <em>"Save as PDF"</em> or your active Thermal Printer. Disable <em>Headers and Footers</em> in "More Settings" for a perfect clean edge.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE VISUAL LIVE PREVIEW PAPER */}
        <div className="flex-1 bg-slate-150 p-4 sm:p-8 flex items-center justify-center overflow-y-auto relative h-full">
          
          {/* Header overlay close button */}
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 bg-white hover:bg-slate-50 p-2.5 rounded-full shadow-lg border border-slate-200/80 hover:scale-105 active:scale-95 transition-all no-print hidden lg:block"
            title="Close Invoice Panel"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          {/* Wrapper to target ONLY printable material via CSS media selector */}
          <div id="print-area-wrapper" className="w-full flex items-center justify-center py-6">
            
            {/* Interactive Paper Slip Container simulating real roll paper */}
            <div 
              id="printable-slip"
              className={`bg-white text-slate-900 border border-slate-300 shadow-xl transition-all duration-300 ${
                format === 'thermal-80' ? 'w-[80mm] min-h-[160mm] p-6 rounded-md font-mono' :
                format === 'thermal-58' ? 'w-[58mm] min-h-[140mm] p-4 rounded-sm font-mono text-[10px]' :
                'w-[210mm] min-h-[297mm] p-12 rounded-3xl font-sans' // standard A4 size simulation
              }`}
            >
              
              {/* ==============================================================
                  LAYOUT A: THERMAL SLIPS (80mm and 58mm)
                  ============================================================== */}
              {(format === 'thermal-80' || format === 'thermal-58') && (
                <div className="space-y-4 text-[11px] leading-relaxed select-all">
                  
                  {/* Header Store Label */}
                  <div className="text-center space-y-1">
                    <h2 className="text-sm font-black tracking-tight text-slate-950 font-sans">
                      ISLAMIA GUEST HOUSE
                    </h2>
                    <p className="text-[9px] uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded inline-block font-sans font-bold">
                      Dhaka Front Desk
                    </p>
                    <div className="text-[9px] text-slate-600 space-y-0.5 font-mono">
                      <p>House 12, Road 27, Dhanmondi, Dhaka</p>
                      <p>Tel: +880-1712-445588</p>
                      <p>BIN/VAT: 1993478512-VAT</p>
                    </div>
                  </div>

                  {/* Dot separator line */}
                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Key Invoice Meta information */}
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span>INVOICE NO:</span>
                      <span className="font-bold">{booking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span>{new Date(booking.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TIME:</span>
                      <span>{new Date(booking.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TERMINAL:</span>
                      <span>{cashierName}</span>
                    </div>
                    <div className="flex justify-between text-teal-800 font-bold">
                      <span>STATUS:</span>
                      <span className="uppercase">{booking.status}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Guest Profile Details */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-[9px] uppercase tracking-wider font-sans">
                      [GUEST DETAILS]
                    </span>
                    <div className="space-y-0.5 text-[10px] font-mono">
                      <p className="font-bold text-slate-950">NAME: {booking.guestName}</p>
                      <p>PHONE: {booking.guestPhone}</p>
                      {booking.referenceName && <p className="text-teal-700">REF BY: {booking.referenceName}</p>}
                      {booking.nidNumber && <p>NID/PASSPORT: {booking.nidNumber}</p>}
                      <p>ORIGIN: {booking.upazila || 'Dhanmondi'}, {booking.zila || 'Dhaka'}</p>
                      
                      {/* Additional Adult Passengers in POS */}
                      {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                        <div className="pt-1 mt-1 border-t border-dotted border-slate-200">
                          <p className="font-bold text-slate-700 text-[9px]">EXTRAS:</p>
                          {booking.additionalGuests.map((g, idx) => (
                            <p key={idx} className="pl-2">+{g.name} ({g.phone})</p>
                          ))}
                        </div>
                      )}

                      {/* Kids list in POS */}
                      {booking.kids && booking.kids.length > 0 && (
                        <div className="pt-1 mt-1 border-t border-dotted border-slate-200">
                          <p className="font-bold text-sky-700 text-[9px]">CHILDREN:</p>
                          {booking.kids.map((k, idx) => (
                            <p key={idx} className="pl-2 text-sky-900">+{k.name} (Age: {k.age} yrs)</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Accommodation Reservation Breakdown */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-900 block text-[9px] uppercase tracking-wider font-sans">
                      [ACCOMMODATION BREAKDOWN]
                    </span>
                    
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between font-bold">
                        <span>SUITE / CHAMBER:</span>
                        <span>Room {booking.roomNumber || booking.roomId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CHAMBER TYPE:</span>
                        <span className="capitalize">{booking.roomType || associatedRoom?.type || 'Standard'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CHECK-IN:</span>
                        <span>{booking.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CHECK-OUT:</span>
                        <span>{booking.checkOut}</span>
                      </div>
                      <div className="flex justify-between text-teal-800 font-bold">
                        <span>TOTAL DURATION:</span>
                        <span>{nights} NIGHTS</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Financial Itemized list */}
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>ITEM DESC</span>
                      <span>QTY</span>
                      <span>TOTAL</span>
                    </div>
                    
                    <div className="border-b border-dotted border-slate-200 my-1" />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="max-w-[70%] truncate">Room Rent (Net Room Charge)</span>
                        <span>{nights}N</span>
                        <span>৳{billing.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Dhanmondi VAT (15%)</span>
                        <span>15%</span>
                        <span>৳{billing.vat}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Service Charge (5%)</span>
                        <span>5%</span>
                        <span>৳{billing.serviceFee}</span>
                      </div>
                    </div>

                    <div className="border-b border-dashed border-slate-300 my-2" />

                    {/* Grand Total banner */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-black text-slate-950">
                        <span>GRAND TOTAL BDT</span>
                        <span>৳{billing.grandTotal} BDT</span>
                      </div>
                      <p className="text-[8px] text-slate-400 font-sans italic text-right">
                        Inclusive of all local tourism duties
                      </p>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Custom Barcode Design representation in thermal POS */}
                  {showBarcode && (
                    <div className="flex flex-col items-center justify-center py-2 space-y-1 font-mono text-center">
                      <svg className="w-11/12 h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <g fill="black">
                          {/* Emulated stylized lines of barcode */}
                          <rect x="2" y="0" width="1.5" height="20" />
                          <rect x="5" y="0" width="0.5" height="20" />
                          <rect x="7" y="0" width="2" height="20" />
                          <rect x="10" y="0" width="0.5" height="20" />
                          <rect x="12" y="0" width="1.5" height="20" />
                          <rect x="15" y="0" width="1" height="20" />
                          <rect x="18" y="0" width="0.5" height="20" />
                          <rect x="20" y="0" width="2" height="20" />
                          <rect x="24" y="0" width="0.5" height="20" />
                          <rect x="26" y="0" width="1" height="20" />
                          <rect x="28" y="0" width="1.5" height="20" />
                          <rect x="31" y="0" width="0.5" height="20" />
                          <rect x="33" y="0" width="2" height="20" />
                          <rect x="37" y="0" width="1" height="20" />
                          <rect x="40" y="0" width="0.5" height="20" />
                          <rect x="42" y="0" width="1.5" height="20" />
                          <rect x="45" y="0" width="2" height="20" />
                          <rect x="49" y="0" width="0.5" height="20" />
                          <rect x="51" y="0" width="1" height="20" />
                          <rect x="53" y="0" width="1.5" height="20" />
                          <rect x="56" y="0" width="0.5" height="20" />
                          <rect x="58" y="0" width="2" height="20" />
                          <rect x="61" y="0" width="1" height="20" />
                          <rect x="64" y="0" width="0.5" height="20" />
                          <rect x="66" y="0" width="1.5" height="20" />
                          <rect x="69" y="0" width="2" height="20" />
                          <rect x="73" y="0" width="0.5" height="20" />
                          <rect x="75" y="0" width="1" height="20" />
                          <rect x="77" y="0" width="1.5" height="20" />
                          <rect x="80" y="0" width="0.5" height="20" />
                          <rect x="82" y="0" width="2" height="20" />
                          <rect x="86" y="0" width="1" height="20" />
                          <rect x="89" y="0" width="0.5" height="20" />
                          <rect x="91" y="0" width="1.5" height="20" />
                          <rect x="94" y="0" width="2" height="20" />
                          <rect x="97" y="0" width="1" height="20" />
                        </g>
                      </svg>
                      <span className="text-[8px] tracking-widest uppercase">*{booking.id}*</span>
                    </div>
                  )}

                  {/* QR code design in POS */}
                  {showQrCode && (
                    <div className="flex flex-col items-center justify-center py-2 space-y-1.5 font-sans">
                      <div className="p-1.5 bg-white border-2 border-slate-900 rounded inline-block">
                        {/* High quality visual QR simulation with SVGs */}
                        <svg className="w-16 h-16 text-slate-950" viewBox="0 0 25 25" shapeRendering="crispEdges">
                          <path d="M0 0h5v5H0zm20 0h5v5h-5zM0 20h5v5H0zm9-20h7v1H9zm0 2h1v3H9zm3 0h1v1h-1zm2 1h1v2h-1zm-4 3h1v1h-1zm2 0h2v1h-2zm-3 2h1v1h-1zm4 0h1v1h-1zm2 0h1v2h-1zm-6 2h1v1h-1zm2 0h1v2h-1zm5 0h1v1h-1zm2 1h1v2h-1zm-9 2h1v1h-1zm2 0h2v1h-2zm-3 1h1v1h-1zm5 0h1v2h-1zm3 0h1v1h-1zm-7 2h1v1h-1zm3 0h2v1h-2zm4 0h1v1h-1zm1-13h1v3h-1zm2 0h1v2h-1zm1 1h1v2h-1zm-3 3h2v1h-2z" fill="currentColor" />
                          <path d="M1 1h3v3H1zm21 0h3v3h-3zM1 21h3v3H1zM7 7h1v1H7zm1 1h1v1H8zm2-2h1v1h-1zm1 2h1v1h-1zm4-3h1v1h-1zm1 2h1v1h-1zm-3 3h1v1h-1zm3 1h1v1h-1zm-8 4h1v1H7zm2 1h1v1H9zm1-2h1v1h-1zm3 3h1v1h-1zm1-1h1v1h-1zm2-2h1v1h-1zm-2 4h1v1h-1zm4-2h1v1h-1z" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase">SCAN FOR AUTHENTICATION</span>
                    </div>
                  )}

                  {/* Stamp of Confirmation */}
                  {showStamp && (
                    <div className="flex justify-center py-2 no-print">
                      <div className="border-4 border-emerald-600/80 rounded-2xl px-4 py-2 font-black text-center text-xs text-emerald-600 uppercase tracking-widest transform -rotate-3 select-none font-sans bg-white shadow-xs">
                        PAID - ISLAMIA
                        <span className="block text-[8px] tracking-normal font-medium capitalize font-mono text-emerald-500 mt-0.5">Verified checkout</span>
                      </div>
                    </div>
                  )}

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  {/* Footer Terms */}
                  <div className="text-center text-[9px] text-slate-500 space-y-1 font-sans">
                    <p className="font-bold font-mono">=== THANK YOU ===</p>
                    <p className="leading-snug">Hope your voyage is serene. Keep your checkout ticket for security gate release.</p>
                    <p className="font-mono text-[8px] text-slate-400 mt-2">Powered by Antigravity OS v4.2</p>
                  </div>

                </div>
              )}

              {/* ==============================================================
                  LAYOUT B: STANDARD A4 CORPORATE INVOICE (standard)
                  ============================================================== */}
              {format === 'standard' && (
                <div className="space-y-8 text-sm">
                  
                  {/* Top brand header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl font-black text-slate-900 tracking-tight">
                          ISLAMIA GUEST HOUSE
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-teal-600 text-white rounded">
                          OFFICIAL
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-mono">
                        House 12, Road 27, Dhanmondi, Dhaka-1209, Bangladesh<br/>
                        Email: accounting@islamiaguesthouse.com | Tel: +880-1712-445588
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-slate-400 text-xs font-mono block uppercase">Tax Registration</span>
                      <span className="font-mono font-bold text-slate-800 text-xs block">VAT No: BIN-1993478512-TIN</span>
                      <span className="font-mono font-semibold text-slate-800 text-xs block">Invoice: #IGH-{booking.id}</span>
                    </div>
                  </div>

                  {/* Title banner */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="font-serif text-xl font-bold text-slate-800">Accommodation Tax Invoice</h1>
                      <p className="text-xs text-slate-400">Transaction record for guests and corporate accounting</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-slate-500">Stamp Status:</span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs uppercase">
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Core Meta Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left: Guest profile */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <User className="w-4 h-4 text-teal-600" />
                        <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Primary Guest Profile
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Full Name</span>
                          <span className="font-bold text-slate-800">{booking.guestName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Mobile Register</span>
                          <span className="font-bold text-slate-800">{booking.guestPhone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">National ID (NID)</span>
                          <span className="font-semibold text-slate-700">{booking.nidNumber || '199321456182'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">District (Origin)</span>
                          <span className="font-semibold text-slate-700 capitalize">
                            {booking.upazila || 'Dhanmondi'}, {booking.zila || 'Dhaka'}
                          </span>
                        </div>
                        {booking.referenceName && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 uppercase block font-mono">Reference Person</span>
                            <span className="font-bold text-teal-700">{booking.referenceName}</span>
                          </div>
                        )}
                        {booking.additionalGuests && booking.additionalGuests.length > 0 && (
                          <div className="col-span-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase block font-mono">Adult Companions</span>
                            <span className="font-medium text-slate-600">
                              {booking.additionalGuests.map(g => `${g.name} (${g.phone})`).join(', ')}
                            </span>
                          </div>
                        )}
                        {booking.kids && booking.kids.length > 0 && (
                          <div className="col-span-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-sky-500 uppercase block font-mono font-bold">Registered Kids</span>
                            <span className="font-medium text-sky-800">
                              {booking.kids.map(k => `${k.name} (Age: ${k.age})`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Stay info */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider">
                          Accommodation Span
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Suite Allocated</span>
                          <span className="font-bold text-slate-800">Room {booking.roomNumber || booking.roomId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Chamber Type</span>
                          <span className="font-bold text-slate-850 capitalize">
                            {booking.roomType || associatedRoom?.type || 'Standard Suite'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Check-In Date</span>
                          <span className="font-semibold text-slate-800">{booking.checkIn}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Check-Out Date</span>
                          <span className="font-semibold text-slate-800">{booking.checkOut}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">Stay Duration</span>
                          <span className="font-bold text-teal-700 font-serif">
                            {nights} Night{nights > 1 ? 's' : ''} Stay
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Item details</th>
                          <th className="py-3 px-4 text-center">Nights</th>
                          <th className="py-3 px-4 text-right">Standard Night Rate</th>
                          <th className="py-3 px-4 text-right">Total Net Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="text-slate-700">
                          <td className="py-4 px-4 font-medium">
                            Chamber Room {booking.roomNumber || booking.roomId} Rent
                            <span className="block text-[10px] text-slate-400 mt-0.5">Complementary Wi-Fi, Breakfast & Mini-fridge</span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono">{nights}</td>
                          <td className="py-4 px-4 text-right font-mono">৳{billing.ratePerNight}</td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">৳{billing.subtotal}</td>
                        </tr>
                        <tr className="text-slate-500 text-[11px] bg-slate-50/30">
                          <td className="py-3 px-4 pl-8" colSpan={3}>Dhanmondi Tourism VAT (15%)</td>
                          <td className="py-3 px-4 text-right font-mono">+ ৳{billing.vat}</td>
                        </tr>
                        <tr className="text-slate-500 text-[11px] bg-slate-50/30">
                          <td className="py-3 px-4 pl-8" colSpan={3}>Front Desk Service Charge (5%)</td>
                          <td className="py-3 px-4 text-right font-mono">+ ৳{billing.serviceFee}</td>
                        </tr>
                        <tr className="bg-slate-50/80 font-bold text-slate-900 border-t-2 border-slate-200">
                          <td className="py-4 px-4 text-sm font-serif" colSpan={3}>Grand Total Amount (BDT)</td>
                          <td className="py-4 px-4 text-right font-mono text-sm text-teal-700">৳{billing.grandTotal} BDT</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures & Stamper */}
                  <div className="pt-8 flex flex-col md:flex-row justify-between items-end gap-8">
                    
                    {/* Left: Barcodes & stamp */}
                    <div className="flex gap-4 items-center">
                      {showQrCode && (
                        <div className="p-2 border border-slate-200 rounded-2xl bg-white shadow-xs">
                          {/* Emulating beautifully generated QR */}
                          <svg className="w-16 h-16 text-slate-900" viewBox="0 0 25 25" shapeRendering="crispEdges">
                            <path d="M0 0h5v5H0zm20 0h5v5h-5zM0 20h5v5H0zm9-20h7v1H9zm0 2h1v3H9zm3 0h1v1h-1zm2 1h1v2h-1zm-4 3h1v1h-1zm2 0h2v1h-2zm-3 2h1v1h-1zm4 0h1v1h-1zm2 0h1v2h-1zm-6 2h1v1h-1zm2 0h1v2h-1zm5 0h1v1h-1zm2 1h1v2h-1zm-9 2h1v1h-1zm2 0h2v1h-2zm-3 1h1v1h-1zm5 0h1v2h-1zm3 0h1v1h-1zm-7 2h1v1h-1zm3 0h2v1h-2zm4 0h1v1h-1zm1-13h1v3h-1zm2 0h1v2h-1zm1 1h1v2h-1zm-3 3h2v1h-2z" fill="currentColor" />
                            <path d="M1 1h3v3H1zm21 0h3v3h-3zM1 21h3v3H1zM7 7h1v1H7zm1 1h1v1H8zm2-2h1v1h-1zm1 2h1v1h-1zm4-3h1v1h-1zm1 2h1v1h-1zm-3 3h1v1h-1zm3 1h1v1h-1zm-8 4h1v1H7zm2 1h1v1H9zm1-2h1v1h-1zm3 3h1v1h-1zm1-1h1v1h-1zm2-2h1v1h-1zm-2 4h1v1h-1zm4-2h1v1h-1z" fill="currentColor" />
                          </svg>
                        </div>
                      )}
                      
                      {showStamp && (
                        <div className="border-4 border-emerald-600 text-emerald-600 rounded-3xl px-5 py-2.5 font-sans font-black text-xs uppercase tracking-widest transform -rotate-6 select-none bg-emerald-50/10">
                          PAID &amp; INVOICED
                          <span className="block text-[9px] tracking-normal font-mono font-bold text-emerald-500 text-center">Islamia Guest House</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Signature Blocks */}
                    <div className="flex gap-8 text-xs font-mono">
                      <div className="space-y-12 text-center w-36">
                        <div className="h-px bg-slate-300" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Guest Signature</span>
                      </div>
                      <div className="space-y-12 text-center w-36">
                        <div className="h-px bg-teal-600" />
                        <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">Desk Authorized</span>
                      </div>
                    </div>

                  </div>

                  {/* Separator */}
                  <div className="border-b border-dashed border-slate-200 pt-6" />

                  {/* Terms & Conditions Laser Invoice footer */}
                  <div className="text-[10px] text-slate-400 space-y-1 leading-normal italic text-center">
                    <p className="font-bold text-slate-500 font-sans">Accommodation & Liability Terms</p>
                    <p>1. Check-out time is strictly 12:00 PM (Noon). Extension requests are subject to room availability.</p>
                    <p>2. Guests are kindly requested to verify all personal belongings and return the electronic key to the front desk receptionist.</p>
                    <p>3. This is an official tax invoice generated in Dhaka, Bangladesh. Any disputes are governed under local tourism division rules.</p>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
