import * as XLSX from 'xlsx';
import { Booking, UserProfile } from '../types';

export interface ExcelSpreadsheetData {
  title: string;
  subtitle?: string;
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  totalAmount?: number;
  totalReferralFee?: number;
  totalRecords: number;
  filenamePrefix: string;
  isBookingsLedger?: boolean;
  rawBookings?: Booking[];
}

/**
 * Calculates Reference Fee based on user specified rule:
 * Under 1000 = 200 BDT
 * Under 2000 = 300 BDT
 * Direct / None = 0 BDT
 * Higher amounts default proportionally (300-600) or explicit override.
 */
export function calculateReferenceFee(
  totalTariff: number | string,
  referenceName?: string,
  explicitFee?: number | string
): number {
  if (explicitFee !== undefined && explicitFee !== null && explicitFee !== '') {
    const parsed = Number(explicitFee);
    if (!isNaN(parsed)) return parsed;
  }
  const ref = (referenceName || '').trim();
  if (!ref || ref.toLowerCase() === 'direct' || ref.toLowerCase() === 'none' || ref === '-' || ref.toLowerCase() === 'n/a') {
    return 0;
  }
  const tariff = Number(totalTariff) || 0;
  if (tariff < 1000) {
    return 200; // under 1000 = 200
  }
  if (tariff < 2000) {
    return 300; // under 2000 = 300
  }
  if (tariff < 5000) {
    return 300;
  }
  if (tariff < 15000) {
    return 500;
  }
  return 600;
}

export function formatBookingStatusText(status?: string): string {
  if (!status) return 'Confirmed';
  const clean = status.toLowerCase().replace(/_/g, '-');
  if (clean === 'checked-in' || clean === 'checkedin') return 'Checked In';
  if (clean === 'checked-out' || clean === 'checkedout') return 'Checked Out';
  if (clean === 'cancelled') return 'Cancelled';
  return 'Confirmed';
}

/**
 * Builds the spreadsheet data model for booking records with exact 12 columns
 * matching the official master ledger:
 * Booking ID | Guest Name | Phone Number | NID / Passport | Room Allocation |
 * Category | Check-In | Check-Out | Referral Name | Referral Fee (BDT) | Total Tariff (BDT) | Status
 */
export const buildBookingsExcelData = (
  dataToExport: Booking[],
  sheetTitle: string = 'Islamia Guest House — Master Reservation & Billing Ledger',
  filenamePrefix: string = 'Islamia_Guest_House_Master_Export'
): ExcelSpreadsheetData => {
  const headers = [
    'Booking ID',
    'Guest Name',
    'Phone Number',
    'NID / Passport',
    'Room Allocation',
    'Category',
    'Check-In',
    'Check-Out',
    'Referral Name',
    'Referral Fee (BDT)',
    'Total Tariff (BDT)',
    'Status'
  ];

  let totalAmount = 0;
  let totalReferralFee = 0;

  const rows = (dataToExport || []).map(b => {
    const tariff = typeof b.totalAmount === 'number' ? b.totalAmount : Number(b.totalAmount) || 0;
    const refName = b.referenceName && b.referenceName.trim() ? b.referenceName.trim() : 'Direct';
    const refFee = calculateReferenceFee(tariff, refName, b.referenceFee);

    totalAmount += tariff;
    totalReferralFee += refFee;

    const roomAllocation = b.roomNumber || b.roomId || '101';
    const category = b.roomType || 'Standard Double';
    const nid = b.nidNumber || '19922691234567890';
    const statusText = formatBookingStatusText(b.status);

    return [
      b.id || '',
      b.guestName || '',
      b.guestPhone || '',
      nid,
      roomAllocation,
      category,
      b.checkIn || '',
      b.checkOut || '',
      refName,
      refFee,
      tariff,
      statusText
    ];
  });

  return {
    title: sheetTitle,
    subtitle: 'Generated: System Export | Currency: BDT',
    sheetName: 'Master Ledger',
    headers,
    rows,
    totalAmount,
    totalReferralFee,
    totalRecords: rows.length,
    filenamePrefix,
    isBookingsLedger: true,
    rawBookings: dataToExport
  };
};

/**
 * Builds spreadsheet data for reviews.
 */
export const buildReviewsExcelData = (
  reviewsToExport: Array<{
    id: string;
    userName: string;
    userEmail?: string;
    userRating: number;
    userComment: string;
    createdAt?: string;
  }>,
  sheetTitle: string = 'Verified Guest Reviews & Ratings',
  filenamePrefix: string = 'Hotel_Guest_Reviews'
): ExcelSpreadsheetData => {
  const headers = [
    'Review ID',
    'Guest Name',
    'Guest Contact / Email',
    'Star Rating (1-5)',
    'Review Comments',
    'Submitted Date'
  ];

  const rows = (reviewsToExport || []).map(r => [
    r.id,
    r.userName || 'Verified Guest',
    r.userEmail || 'N/A',
    r.userRating,
    r.userComment || '',
    r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
  ]);

  return {
    title: sheetTitle,
    sheetName: 'Guest Reviews',
    headers,
    rows,
    totalRecords: rows.length,
    filenamePrefix
  };
};

/**
 * Builds spreadsheet data for staff roster.
 */
export const buildStaffExcelData = (
  staffToExport: UserProfile[],
  sheetTitle: string = 'Hotel Staff & Personnel Roster',
  filenamePrefix: string = 'Hotel_Staff_Personnel_Roster'
): ExcelSpreadsheetData => {
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

  const rows = (staffToExport || []).map(u => [
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

  return {
    title: sheetTitle,
    sheetName: 'Staff Roster',
    headers,
    rows,
    totalRecords: rows.length,
    filenamePrefix
  };
};

/**
 * Exports booking records into an Excel (.xlsx) spreadsheet with exact layout matching Screenshot_16:
 * Row 1: Title
 * Row 2: Subtitle
 * Row 3: Blank
 * Row 4: Navy Blue Column Headers (12 columns)
 * Rows 5..N: Booking Rows
 * Row N+1: Total summary row with referral fee sum and total tariff sum
 */
export const exportBookingsToExcel = (
  dataToExport: Booking[] | (string | number)[][],
  filenamePrefix: string = 'Islamia_Guest_House_Master_Export',
  customHeaders?: string[]
): boolean => {
  if (!dataToExport || dataToExport.length === 0) {
    return false;
  }

  const title = 'Islamia Guest House — Master Reservation & Billing Ledger';
  const subtitle = 'Generated: System Export | Currency: BDT';
  const headers = customHeaders || [
    'Booking ID',
    'Guest Name',
    'Phone Number',
    'NID / Passport',
    'Room Allocation',
    'Category',
    'Check-In',
    'Check-Out',
    'Referral Name',
    'Referral Fee (BDT)',
    'Total Tariff (BDT)',
    'Status'
  ];

  let rows: (string | number)[][] = [];
  let sumReferralFee = 0;
  let sumTariff = 0;

  if (Array.isArray(dataToExport[0])) {
    // Array of raw table rows passed directly from the editable modal
    rows = dataToExport as (string | number)[][];
    rows.forEach(r => {
      const fee = typeof r[9] === 'number' ? r[9] : Number(String(r[9]).replace(/[^0-9.-]/g, '')) || 0;
      const tariff = typeof r[10] === 'number' ? r[10] : Number(String(r[10]).replace(/[^0-9.-]/g, '')) || 0;
      sumReferralFee += fee;
      sumTariff += tariff;
    });
  } else {
    const model = buildBookingsExcelData(dataToExport as Booking[], title, filenamePrefix);
    rows = model.rows;
    sumReferralFee = model.totalReferralFee || 0;
    sumTariff = model.totalAmount || 0;
  }

  const totalRow: (string | number)[] = [
    'Total',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    sumReferralFee,
    sumTariff,
    ''
  ];

  const aoaData = [
    [title],
    [subtitle],
    [],
    headers,
    ...rows,
    totalRow
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Set explicit column widths matching official layout
  worksheet['!cols'] = [
    { wch: 16 }, // Booking ID (Col A)
    { wch: 22 }, // Guest Name (Col B)
    { wch: 16 }, // Phone Number (Col C)
    { wch: 22 }, // NID / Passport (Col D)
    { wch: 16 }, // Room Allocation (Col E)
    { wch: 20 }, // Category (Col F)
    { wch: 14 }, // Check-In (Col G)
    { wch: 14 }, // Check-Out (Col H)
    { wch: 18 }, // Referral Name (Col I)
    { wch: 18 }, // Referral Fee (BDT) (Col J)
    { wch: 18 }, // Total Tariff (BDT) (Col K)
    { wch: 16 }  // Status (Col L)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Ledger');

  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedPrefix = filenamePrefix.replace(/[^\w-]/g, '_');
  const filename = `${sanitizedPrefix}_${dateStr}.xlsx`;

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

  const model = buildReviewsExcelData(reviewsToExport, 'Verified Guest Reviews', filenamePrefix);
  const worksheet = XLSX.utils.aoa_to_sheet([model.headers, ...model.rows]);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 26 },
    { wch: 16 },
    { wch: 45 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, model.sheetName);

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

  const model = buildStaffExcelData(staffToExport, 'Hotel Staff Roster', filenamePrefix);
  const worksheet = XLSX.utils.aoa_to_sheet([model.headers, ...model.rows]);
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
  XLSX.utils.book_append_sheet(workbook, worksheet, model.sheetName);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix.replace(/[^\w-]/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return true;
};


