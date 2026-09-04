import * as XLSX from 'xlsx';
import { Booking, UserProfile } from '../types';

/**
 * Exports booking records into an Excel (.xlsx) spreadsheet with proper column widths and formatted types.
 */
export const exportBookingsToExcel = (
  dataToExport: Booking[],
  filenamePrefix: string = 'Hotel_Guest_Reservations_Ledger'
): boolean => {
  if (!dataToExport || dataToExport.length === 0) {
    return false;
  }

  const headers = [
    'Booking ID',
    'Guest Name',
    'Phone Number',
    'Email Address',
    'NID Number',
    'Room Number',
    'Room Type',
    'Check In Date',
    'Check Out Date',
    'Booking Status',
    'District (Zila)',
    'Sub-District (Upazila)',
    'Reference Name',
    'Additional Guests',
    'Kids',
    'Total Tariff (BDT)',
    'Created Date',
    'Notes & Incidents'
  ];

  const rows = dataToExport.map(b => {
    const extraGuestsStr = b.additionalGuests?.map(g => `${g.name}${g.phone ? ' (' + g.phone + ')' : ''}`).join('; ') || 'None';
    const kidsStr = b.kids?.map(k => `${k.name}${k.age ? ' (' + k.age + 'y)' : ''}`).join('; ') || 'None';

    return [
      b.id || '',
      b.guestName || '',
      b.guestPhone || '',
      b.guestEmail || '',
      b.nidNumber || '',
      b.roomNumber || b.roomId || '',
      b.roomType || '',
      b.checkIn || '',
      b.checkOut || '',
      (b.status || '').toUpperCase(),
      b.zila || '',
      b.upazila || '',
      b.referenceName || '',
      extraGuestsStr,
      kidsStr,
      typeof b.totalAmount === 'number' ? b.totalAmount : Number(b.totalAmount) || 0,
      b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
      b.notes || ''
    ];
  });

  // Create worksheet from Array of Arrays
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set explicit column widths to ensure clean visual layout in Microsoft Excel / Google Sheets
  worksheet['!cols'] = [
    { wch: 14 }, // Booking ID
    { wch: 22 }, // Guest Name
    { wch: 18 }, // Phone Number
    { wch: 24 }, // Email Address
    { wch: 18 }, // NID Number
    { wch: 14 }, // Room Number
    { wch: 18 }, // Room Type
    { wch: 14 }, // Check In Date
    { wch: 14 }, // Check Out Date
    { wch: 16 }, // Booking Status
    { wch: 18 }, // District (Zila)
    { wch: 20 }, // Sub-District (Upazila)
    { wch: 18 }, // Reference Name
    { wch: 26 }, // Additional Guests
    { wch: 20 }, // Kids
    { wch: 18 }, // Total Tariff (BDT)
    { wch: 22 }, // Created Date
    { wch: 30 }  // Notes & Incidents
  ];

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservations');

  // Trigger browser download with .xlsx extension
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedPrefix = filenamePrefix.replace(/[^\w-]/g, '_');
  const filename = `${sanitizedPrefix}_${dateStr}.xlsx`;

  // Write file via XLSX
  XLSX.writeFile(workbook, filename);
  return true;
};

/**
 * Generic helper to export guest feedback/reviews to Excel (.xlsx)
 */
export const exportReviewsToExcel = (
  reviewsToExport: Array<{
    id: string;
    userName: string;
    userEmail?: string;
    userRating: number;
    userComment: string;
    createdAt?: string;
  }>,
  filenamePrefix: string = 'Hotel_Guest_Reviews'
): boolean => {
  if (!reviewsToExport || reviewsToExport.length === 0) {
    return false;
  }

  const headers = [
    'Review ID',
    'Guest Name',
    'Guest Contact / Email',
    'Star Rating (1-5)',
    'Review Comments',
    'Submitted Date'
  ];

  const rows = reviewsToExport.map(r => [
    r.id,
    r.userName || 'Verified Guest',
    r.userEmail || 'N/A',
    r.userRating,
    r.userComment || '',
    r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 45 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix.replace(/[^\w-]/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return true;
};

/**
 * Generic helper to export staff roster / personnel records to Excel (.xlsx)
 */
export const exportStaffToExcel = (
  staffToExport: UserProfile[],
  filenamePrefix: string = 'Hotel_Staff_Personnel_Roster'
): boolean => {
  if (!staffToExport || staffToExport.length === 0) return false;

  const headers = [
    'Staff UID',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Assigned Role',
    'HR Approval Status',
    'Login Method',
    'Last Active Date/Time',
    'Registration Date'
  ];

  const rows = staffToExport.map(u => [
    u.uid,
    u.name || 'Unnamed Staff',
    u.email || '',
    u.phone || '',
    (u.role || '').toUpperCase(),
    u.hrApproved ? 'Approved' : 'Pending Approval',
    u.loginMethod || 'passcode',
    u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : '',
    u.registeredAt ? new Date(u.registeredAt).toLocaleString() : ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 24 },
    { wch: 26 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Roster');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix.replace(/[^\w-]/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return true;
};

