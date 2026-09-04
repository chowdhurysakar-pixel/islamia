import { Booking } from '../types';

/**
 * Normalizes a phone number for guest identity matching.
 * - Strips all non-digit characters
 * - Normalizes local Bangladesh prefix (+88 / 8801... -> 01...)
 * - Rejects empty values and common placeholder strings
 */
export const normalizeGuestPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const trimmed = phone.trim().toLowerCase();
  if (
    !trimmed ||
    ['n/a', 'na', 'none', 'not specified', 'not provided', 'null', 'undefined', 'not given', '-', '0', 'no phone'].includes(trimmed)
  ) {
    return '';
  }

  // Strip non-digit characters
  const digits = trimmed.replace(/\D/g, '');

  // If local Bangladesh number starting with country code 8801... (13 digits), convert to standard 01... (11 digits)
  if (digits.startsWith('880') && digits.length === 13) {
    return digits.slice(2);
  }

  // A phone number should have at least 7 digits to be a legitimate identifier
  return digits.length >= 7 ? digits : '';
};

/**
 * Normalizes a National ID (NID) or Passport number for guest identity matching.
 * - Strips whitespace, hyphens, slashes, and dots
 * - Converts to uppercase
 * - Rejects empty values and common placeholder strings
 */
export const normalizeGuestNid = (nid?: string | null): string => {
  if (!nid) return '';
  const trimmed = nid.trim().toLowerCase();
  if (
    !trimmed ||
    ['n/a', 'na', 'none', 'not specified', 'not provided', 'null', 'undefined', 'not given', '-', '0', 'no nid'].includes(trimmed)
  ) {
    return '';
  }

  // Strip spaces, dashes, slashes, and dots
  const cleaned = trimmed.replace(/[\s\-_./]/g, '').toUpperCase();

  // A valid NID or passport number should be at least 4 alphanumeric characters
  return cleaned.length >= 4 ? cleaned : '';
};

/**
 * Determines whether two bookings belong to the same guest based strictly on
 * matching NID/Passport or Phone Number (NEVER by name).
 */
export const doBookingsMatchGuestIdentity = (b1: Booking, b2: Booking): boolean => {
  if (!b1 || !b2) return false;

  const phone1 = normalizeGuestPhone(b1.guestPhone);
  const phone2 = normalizeGuestPhone(b2.guestPhone);
  if (phone1 && phone2 && phone1 === phone2) {
    return true;
  }

  const nid1 = normalizeGuestNid(b1.nidNumber);
  const nid2 = normalizeGuestNid(b2.nidNumber);
  if (nid1 && nid2 && nid1 === nid2) {
    return true;
  }

  return false;
};

/**
 * Computes a Set of booking IDs that qualify as repeat guests strictly by
 * phone number or NID/Passport number (excluding name).
 */
export const computeRepeatGuestBookingIds = (bookings: Booking[]): Set<string> => {
  const phoneMap = new Map<string, string[]>();
  const nidMap = new Map<string, string[]>();

  bookings.forEach(b => {
    const phone = normalizeGuestPhone(b.guestPhone);
    const nid = normalizeGuestNid(b.nidNumber);

    if (phone) {
      const existing = phoneMap.get(phone) || [];
      existing.push(b.id);
      phoneMap.set(phone, existing);
    }

    if (nid) {
      const existing = nidMap.get(nid) || [];
      existing.push(b.id);
      nidMap.set(nid, existing);
    }
  });

  const repeatIds = new Set<string>();

  phoneMap.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => repeatIds.add(id));
    }
  });

  nidMap.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => repeatIds.add(id));
    }
  });

  return repeatIds;
};

/**
 * Checks if a booking belongs to a repeat guest in the given booking list.
 *
 * Strict Requirement:
 * A guest is marked as a "Repeat Guest" ONLY if there is at least one other distinct booking
 * in the system with the SAME phone number OR the SAME NID/Passport number.
 * Matching by guest name is STRICTLY excluded.
 */
export const checkIsRepeatGuest = (
  targetBooking: Booking,
  allBookings: Booking[],
  precomputedRepeatIds?: Set<string>
): boolean => {
  if (!targetBooking || !allBookings || allBookings.length < 2) return false;

  if (precomputedRepeatIds) {
    return precomputedRepeatIds.has(targetBooking.id);
  }

  const phone = normalizeGuestPhone(targetBooking.guestPhone);
  const nid = normalizeGuestNid(targetBooking.nidNumber);

  // If target booking has neither a valid phone nor a valid NID/passport, cannot be verified as repeat
  if (!phone && !nid) {
    return false;
  }

  return allBookings.some(other => {
    if (other.id === targetBooking.id) return false;

    const otherPhone = normalizeGuestPhone(other.guestPhone);
    if (phone && otherPhone && phone === otherPhone) {
      return true;
    }

    const otherNid = normalizeGuestNid(other.nidNumber);
    if (nid && otherNid && nid === otherNid) {
      return true;
    }

    return false;
  });
};
