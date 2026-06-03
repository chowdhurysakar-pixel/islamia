# Security Specification - Hotel Booking and Management System

This document outlines the zero-trust data access policies and data validation specifications designed to prevent privilege escalation, data poisoning, PII leaks, and denial-of-wallet resource exhaustion.

## 1. Core Data Invariants

1. **Staff Privilege Isolation**: Only users certified as `staff` or `admin` in the user document lookup or trusted directory can modify general room details (e.g. status, pricing, capacity). Guests can only view rooms.
2. **Booking Integrity**: A booking cannot be updated or created without confirming that the guest UID or guest session owns the booking, unless it's managed by `staff` or `admin`.
3. **Temporal Timestamp Integrity**: Handlers cannot supply arbitrary client timestamps for `createdAt` and `updatedAt`. These must be validated against `request.time`.
4. **Room Status Atomic Guarding**: Room status changes must associate atomically with changes in reservation statuses. For instance, check-in sets status to `occupied`, and check-out sets status to `cleaning`.
5. **No Blind Global Reads**: Global reads for custom customer list searches must restrict to users belonging to the `staff` group. Guests can only query their own specific client-side reservation objects.

---

## 2. The "Dirty Dozen" Target Attack Payloads

The following specific JSON payloads are designed to challenge our Firestore matching rules and must be strictly blocked:

1. **Payload 01: Shadow Room Modification (Spoofing Admin)**
   - *Attack*: A guest attempts to set the price of a lux room to $1.
   - *Path*: `/rooms/301`
   - *Content*: `{ "price": 1, "type": "deluxe" }`
   - *Expected Action*: `PERMISSION_DENIED`

2. **Payload 02: Shadow Field Injection (Ghost Fields)**
   - *Attack*: Injecting unsanctioned system-generated elements (e.g. `isVerified: true`) to a user profile to claim admin credentials.
   - *Path*: `/users/attackerId`
   - *Content*: `{ "name": "Hack", "email": "hacker@example.com", "role": "admin", "shadowField": true }`
   - *Expected Action*: `PERMISSION_DENIED` (Keys length and exact keys mismatch)

3. **Payload 03: Temporal Spoofing (Client Timestamps)**
   - *Attack*: Setting booking creation date to 10 years ago to override billing rates.
   - *Path*: `/bookings/B999`
   - *Content*: `{ "createdAt": "2016-01-01T00:00:00Z", "status": "confirmed" }`
   - *Expected Action*: `PERMISSION_DENIED`

4. **Payload 04: Rogue Resource Reservation (Identity Spoofing)**
   - *Attack*: Guest `hacker1` attempts to reserve a luxury suite on behalf of client `victim2`.
   - *Path*: `/bookings/B124`
   - *Content*: `{ "userId": "victim2", "roomId": "101", "guestName": "Victim", "guestEmail": "victim@example.com" }`
   - *Expected Action*: `PERMISSION_DENIED`

5. **Payload 05: Room ID Poisoning**
   - *Attack*: Attempt to write a room document with a 2MB giant string ID to exhaust database read-wallet.
   - *Path*: `/rooms/[GiantStr...]`
   - *Expected Action*: `PERMISSION_DENIED` (Blocked by ID structure length limits)

6. **Payload 06: Status Shortcut (Terminal Lockout bypass)**
   - *Attack*: Trying to change a cancelled or fully completed reservation back to "pending" to bypass refund charges.
   - *Path*: `/bookings/b_cancelled`
   - *Content*: `{ "status": "pending" }`
   - *Expected Action*: `PERMISSION_DENIED`

7. **Payload 07: Unchecked Service Escalation**
   - *Attack*: Booking a concierge ride but changing the service type to mock admin overrides.
   - *Path*: `/serviceRequests/SR01`
   - *Content*: `{ "type": "staff-admin-overrule", "description": "Free bar keys", "status": "pending" }`
   - *Expected Action*: `PERMISSION_DENIED` (Mismatched enum list)

8. **Payload 08: Global Query Scraping (PII Blanket)**
   - *Attack*: Guest tries to issue a `getDocs` list query on booking registrations without filtering by their own `userId`.
   - *Path*: `/bookings` (List all)
   - *Expected Action*: `PERMISSION_DENIED`

9. **Payload 09: Room Status Hijacking**
   - *Attack*: Guest marks their checked-in room as `available` in the database to prevent billing checks.
   - *Path*: `/rooms/201`
   - *Content*: `{ "status": "available" }`
   - *Expected Action*: `PERMISSION_DENIED`

10. **Payload 10: Guest Profile Swapping**
    - *Attack*: User edits their registered Google Email to match a registered staff email inside their Firestore profile.
    - *Path*: `/users/attackerId`
    - *Content*: `{ "email": "staff@hotel.com" }`
    - *Expected Action*: `PERMISSION_DENIED`

11. **Payload 11: Mass Service Request Purging**
    - *Attack*: Threat actor tries to call `delete` on active housekeeper service tickets.
    - *Path*: `/serviceRequests/SR_active`
    - *Expected Action*: `PERMISSION_DENIED`

12. **Payload 12: Nil Amount Payment Spoof**
    - *Attack*: Guest creates reservation and overrides `totalAmount` to negative values.
    - *Path*: `/bookings/B442`
    - *Content*: `{ "totalAmount": -500, "status": "confirmed" }`
    - *Expected Action*: `PERMISSION_DENIED`
