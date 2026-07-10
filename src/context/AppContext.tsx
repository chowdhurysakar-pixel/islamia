/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, Booking, ServiceRequest, UserProfile, UserRole, RoomStatus, BookingStatus, ServiceRequestStatus, ServiceRequestType, ToastInfo, Feedback } from '../types';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_SERVICES } from '../mockData';
import { initFirebase, db, auth, handleFirestoreError, OperationType } from '../firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AppContextType {
  rooms: Room[];
  bookings: Booking[];
  serviceRequests: ServiceRequest[];
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isFirebaseActive: boolean;
  isLoading: boolean;
  toggleRole: () => void;
  // Toast notifications & Automated Email drafted actions
  activeToast: ToastInfo | null;
  showToast: (toast: ToastInfo) => void;
  dismissToast: () => void;
  triggerEmailDraft: (booking: Booking) => void;
  // Auth Functions
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  localLogin: (role: UserRole, email: string, name: string) => void;
  logout: () => Promise<void>;
  sendOtp: (email: string, name?: string, role?: UserRole, isSignUp?: boolean) => Promise<{ success: boolean; otpCode?: string; error?: string }>;
  verifyOtp: (email: string, enteredOtp: string, isSignUp?: boolean, name?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  // Room Actions
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoomStatus: (roomId: string, status: RoomStatus) => Promise<void>;
  editRoomDetails: (roomId: string, updates: Partial<Room>) => Promise<void>;
  // Booking Actions
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<string>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  addBookingNotes: (bookingId: string, notes: string) => Promise<void>;
  // Service Request Actions
  createServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt'>) => Promise<void>;
  updateServiceRequestStatus: (requestId: string, status: ServiceRequestStatus) => Promise<void>;
  // Feedback Actions
  feedbacks: Feedback[];
  submitFeedback: (rating: number, comment: string) => Promise<void>;
  opMode: 'receptionist' | 'hr';
  setOpMode: (mode: 'receptionist' | 'hr') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('staff');
  const [opMode, setOpMode] = useState<'receptionist' | 'hr'>('receptionist');
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const [otps, setOtps] = useState<Record<string, string>>({});

  // Initialize and run connection tests
  useEffect(() => {
    let isConfigured = false;
    try {
      if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'placeholder' && !firebaseConfig.apiKey.includes('MY_')) {
        isConfigured = initFirebase(firebaseConfig);
      }
    } catch (e) {
      console.warn("Firebase config not available or incomplete. Falling back to Local Storage Sandbox.", e);
    }
    
    setIsFirebaseActive(isConfigured);

    if (isConfigured && db && auth) {
      // 1. Validate Connection to Firestore (Skill Requirement)
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration or network status.");
          }
        }
      };
      testConnection();

      // 2. Auth state observer
      const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const emailLower = fbUser.email?.toLowerCase() || '';
          
          // Retrieve pending selected role, or guess based on email / default
          let chosenRole: UserRole = (localStorage.getItem('pending_google_role') as UserRole) || 'guest';
          if (!['admin', 'staff', 'guest'].includes(chosenRole)) {
            chosenRole = (emailLower.includes('admin') || emailLower.includes('hr')) ? 'admin'
                       : (emailLower.includes('staff') || emailLower.includes('reception')) ? 'staff'
                       : 'guest';
          }
          // Clear it now that it is consumed
          localStorage.removeItem('pending_google_role');

          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || (chosenRole === 'admin' ? 'HR Manager' : chosenRole === 'staff' ? 'Front Desk Staff' : 'Guest User'),
            role: chosenRole
          };
          setCurrentUser(profile);
          setCurrentRole(chosenRole);
          
          // Sync profile to database
          const profilePath = `users/${fbUser.uid}`;
          setDoc(doc(db, 'users', fbUser.uid), profile).catch(e => {
            console.error("Failed to sync user profile to Firestore:", e);
          });
        } else {
          setCurrentUser(null);
          setCurrentRole('guest'); // No auth defaults to guest simulator
        }
        setIsLoading(false);
      });

      // 3. Realtime collection sync with full onSnapshot listeners & error handlers (Skill Requirement)
      const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
        const roomsList: Room[] = [];
        snapshot.forEach((docSnap) => {
          roomsList.push({ id: docSnap.id, ...docSnap.data() } as Room);
        });
        
        // Seed if first time and empty
        if (roomsList.length === 0) {
          seedDatabase();
        } else {
          // Sort by room number numerically
          roomsList.sort((a, b) => Number(a.number) - Number(b.number));
          setRooms(roomsList);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'rooms');
      });

      const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        const bookingsList: Booking[] = [];
        snapshot.forEach((docSnap) => {
          bookingsList.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        setBookings(bookingsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      });

      const unsubRequests = onSnapshot(collection(db, 'serviceRequests'), (snapshot) => {
        const requestsList: ServiceRequest[] = [];
        snapshot.forEach((docSnap) => {
          requestsList.push({ id: docSnap.id, ...docSnap.data() } as ServiceRequest);
        });
        setServiceRequests(requestsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'serviceRequests');
      });

      const unsubFeedbacks = onSnapshot(collection(db, 'feedbacks'), (snapshot) => {
        const feedbacksList: Feedback[] = [];
        snapshot.forEach((docSnap) => {
          feedbacksList.push({ id: docSnap.id, ...docSnap.data() } as Feedback);
        });
        feedbacksList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFeedbacks(feedbacksList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'feedbacks');
      });

      const seedDatabase = async () => {
        try {
          for (const room of INITIAL_ROOMS) {
            await setDoc(doc(db, 'rooms', room.id), room);
          }
          for (const booking of INITIAL_BOOKINGS) {
            await setDoc(doc(db, 'bookings', booking.id), booking);
          }
          for (const service of INITIAL_SERVICES) {
            await setDoc(doc(db, 'serviceRequests', service.id), service);
          }
        } catch (e) {
          console.error("Firestore seeding failed:", e);
        }
      };

      return () => {
        unsubscribeAuth();
        unsubRooms();
        unsubBookings();
        unsubRequests();
        unsubFeedbacks();
      };
    } else {
      // Offline Local Storage Sandbox Fallback
      console.log("Using Offline Browser Sandbox Persistence.");
      
      const storedRooms = localStorage.getItem('hotel_rooms');
      const storedBookings = localStorage.getItem('hotel_bookings');
      const storedServices = localStorage.getItem('hotel_services');
      const storedFeedbacks = localStorage.getItem('hotel_feedbacks');
      const storedRole = localStorage.getItem('hotel_current_role');
      const storedUser = localStorage.getItem('hotel_current_user');

      if (storedRooms) {
        setRooms(JSON.parse(storedRooms));
      } else {
        localStorage.setItem('hotel_rooms', JSON.stringify(INITIAL_ROOMS));
        setRooms(INITIAL_ROOMS);
      }

      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        localStorage.setItem('hotel_bookings', JSON.stringify(INITIAL_BOOKINGS));
        setBookings(INITIAL_BOOKINGS);
      }

      if (storedServices) {
        setServiceRequests(JSON.parse(storedServices));
      } else {
        localStorage.setItem('hotel_services', JSON.stringify(INITIAL_SERVICES));
        setServiceRequests(INITIAL_SERVICES);
      }

      if (storedFeedbacks) {
        setFeedbacks(JSON.parse(storedFeedbacks));
      } else {
        const initialFeedbacks: Feedback[] = [
          {
            id: 'F1',
            userId: 'sample-user-1',
            userName: 'Rahat Rahman',
            userEmail: 'rahat@gmail.com',
            rating: 5,
            comment: 'Absolutely love the peace and quiet here! Ibne Sina is right across which was very convenient for us.',
            createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'F2',
            userId: 'sample-user-2',
            userName: 'Sultana Begum',
            userEmail: 'sultana@yahoo.com',
            rating: 4,
            comment: 'Clean rooms and excellent staff. Meena Bazar is very close. Recommended for families.',
            createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
          }
        ];
        localStorage.setItem('hotel_feedbacks', JSON.stringify(initialFeedbacks));
        setFeedbacks(initialFeedbacks);
      }

      // Initialize seed registered users list for simulation testing
      const storedRegistered = localStorage.getItem('hotel_registered_users');
      if (!storedRegistered) {
        const defaultRegistered: UserProfile[] = [
          {
            uid: 'local-admin-1',
            email: 'hr.manager@islamiaguesthouse.com',
            name: 'Sakar Chowdhury (HR Manager)',
            role: 'admin'
          },
          {
            uid: 'local-staff-1',
            email: 'frontdesk.receptionist@islamiaguesthouse.com',
            name: 'Reception Desk Team',
            role: 'staff'
          },
          {
            uid: 'local-guest-1',
            email: 'chowdhurysakar@gmail.com',
            name: 'Sakar Chowdhury',
            role: 'guest'
          }
        ];
        localStorage.setItem('hotel_registered_users', JSON.stringify(defaultRegistered));
      }

      if (storedRole) {
        setCurrentRole(storedRole as UserRole);
      } else {
        setCurrentRole('guest'); // Default is guest until logged in
      }

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        // Everybody starts logged out! No default simulated user is auto-set
        setCurrentUser(null);
      }

      setIsLoading(false);
    }
  }, [isFirebaseActive]);

  // Sync to local storage if running in local sandbox mode
  useEffect(() => {
    if (!isFirebaseActive) {
      localStorage.setItem('hotel_rooms', JSON.stringify(rooms));
    }
  }, [rooms, isFirebaseActive]);

  useEffect(() => {
    if (!isFirebaseActive) {
      localStorage.setItem('hotel_bookings', JSON.stringify(bookings));
    }
  }, [bookings, isFirebaseActive]);

  useEffect(() => {
    if (!isFirebaseActive) {
      localStorage.setItem('hotel_services', JSON.stringify(serviceRequests));
    }
  }, [serviceRequests, isFirebaseActive]);

  // Auth Functions
  const loginWithGoogle = async (role?: UserRole) => {
    const selectedRole = role || 'guest';
    if (isFirebaseActive && auth) {
      const provider = new GoogleAuthProvider();
      try {
        localStorage.setItem('pending_google_role', selectedRole);
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Google authentication error:", error);
      }
    } else {
      // Local Google Login toggle simulation with precise roles requested by user
      const mockEmails: Record<UserRole, string> = {
        admin: 'hr.manager@islamiaguesthouse.com',
        staff: 'frontdesk.receptionist@islamiaguesthouse.com',
        guest: 'chowdhurysakar@gmail.com'
      };
      const mockNames: Record<UserRole, string> = {
        admin: 'Sakar Chowdhury (HR Manager)',
        staff: 'Dhaka Reception Desk Team',
        guest: 'Sakar Chowdhury (Guest)'
      };
      localLogin(selectedRole, mockEmails[selectedRole], mockNames[selectedRole]);
    }
  };

  const localLogin = (role: UserRole, email: string, name: string) => {
    const fakeProfile: UserProfile = {
      uid: `local-${role}-${Date.now().toString().slice(-4)}`,
      email,
      name,
      role
    };
    setCurrentUser(fakeProfile);
    setCurrentRole(role);
    localStorage.setItem('hotel_current_user', JSON.stringify(fakeProfile));
    localStorage.setItem('hotel_current_role', role);
  };

  const logout = async () => {
    if (isFirebaseActive && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Signout failed:", error);
      }
    } else {
      setCurrentUser(null);
      setCurrentRole('guest');
      localStorage.removeItem('hotel_current_user');
      localStorage.setItem('hotel_current_role', 'guest');
    }
  };

  const sendOtp = async (email: string, name?: string, role?: UserRole, isSignUp?: boolean): Promise<{ success: boolean; otpCode?: string; error?: string }> => {
    const emailLower = email.toLowerCase().trim();
    if (!emailLower) {
      return { success: false, error: 'Please enter a valid Gmail address.' };
    }
    if (!emailLower.includes('@gmail.com') && !emailLower.endsWith('@gmail.com')) {
      return { success: false, error: 'Only Gmail addresses are supported for verification.' };
    }

    if (!isSignUp) {
      // Check if user is registered
      const registered = localStorage.getItem('hotel_registered_users');
      const users: UserProfile[] = registered ? JSON.parse(registered) : [];
      const found = users.find(u => u.email.toLowerCase() === emailLower);
      if (!found) {
        return { success: false, error: 'This Gmail address is not registered yet. Please sign up first!' };
      }
    } else {
      // Check if user already exists
      const registered = localStorage.getItem('hotel_registered_users');
      const users: UserProfile[] = registered ? JSON.parse(registered) : [];
      const found = users.find(u => u.email.toLowerCase() === emailLower);
      if (found) {
        return { success: false, error: 'This Gmail address is already registered. Please sign in instead.' };
      }
    }

    // Generate 6 digit numeric code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtps(prev => ({ ...prev, [emailLower]: otpCode }));

    // Show a beautiful simulation toast / email action draft
    const subject = `Your Gmail Verification OTP - Islamia Guest House (${isSignUp ? 'Sign Up' : 'Sign In'})`;
    const body = `Dear User,

To complete your secure authentication request at Islamia Guest House, Dhanmondi, Dhaka, please enter the following 6-digit verification One-Time Password (OTP):

=======================================================
YOUR OTP VERIFICATION CODE: ${otpCode}
=======================================================

This code is private and will expire in 10 minutes. If you did not initiate this request, please disregard this secure alert.

Thank you,
Google Accounts Security Core
Islamia Guest House Dhanmondi System`;

    const mailtoUrl = `mailto:${encodeURIComponent(emailLower)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Update state & trigger toast
    showToast({
      type: 'email',
      message: `🔐 Verification OTP [${otpCode}] sent to ${emailLower}! Click below to view the secure draft.`,
      duration: 15000,
      emailAction: {
        recipient: emailLower,
        subject,
        body,
        mailtoUrl
      }
    });

    return { success: true, otpCode };
  };

  const verifyOtp = async (email: string, enteredOtp: string, isSignUp?: boolean, name?: string, role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    const emailLower = email.toLowerCase().trim();
    const correctOtp = otps[emailLower];

    if (!correctOtp || enteredOtp !== correctOtp) {
      return { success: false, error: 'Invalid or expired OTP code. Please try again.' };
    }

    // OTP verified successfully!
    if (isSignUp) {
      if (!name || !role) {
        return { success: false, error: 'Name and role are required for sign up.' };
      }

      const newUser: UserProfile = {
        uid: `local-${role}-${Date.now().toString().slice(-4)}`,
        email: emailLower,
        name: name.trim(),
        role
      };

      // Save user profile to registered list
      const registered = localStorage.getItem('hotel_registered_users');
      const users: UserProfile[] = registered ? JSON.parse(registered) : [];
      users.push(newUser);
      localStorage.setItem('hotel_registered_users', JSON.stringify(users));

      // Log the user in
      setCurrentUser(newUser);
      setCurrentRole(role);
      localStorage.setItem('hotel_current_user', JSON.stringify(newUser));
      localStorage.setItem('hotel_current_role', role);

      // In Firebase mode, write user to firestore
      if (isFirebaseActive && db) {
        try {
          await setDoc(doc(db, 'users', newUser.uid), newUser);
        } catch (err) {
          console.error("Failed to sync new user to Firestore:", err);
        }
      }

      showToast({
        type: 'success',
        message: `🎉 Welcome ${newUser.name}! Your account has been created successfully with Gmail OTP.`
      });

    } else {
      // Sign In
      const registered = localStorage.getItem('hotel_registered_users');
      const users: UserProfile[] = registered ? JSON.parse(registered) : [];
      const user = users.find(u => u.email.toLowerCase() === emailLower);

      if (!user) {
        return { success: false, error: 'User registration record not found. Please sign up.' };
      }

      // Log the user in
      setCurrentUser(user);
      setCurrentRole(user.role);
      localStorage.setItem('hotel_current_user', JSON.stringify(user));
      localStorage.setItem('hotel_current_role', user.role);

      showToast({
        type: 'success',
        message: `🔑 Welcome back, ${user.name}! Successfully signed in via Gmail OTP.`
      });
    }

    // Clean up OTP
    setOtps(prev => {
      const copy = { ...prev };
      delete copy[emailLower];
      return copy;
    });

    return { success: true };
  };

  const toggleRole = () => {
    const nextRole: UserRole = currentRole === 'staff' ? 'guest' : 'staff';
    setCurrentRole(nextRole);
    if (!isFirebaseActive) {
      localStorage.setItem('hotel_current_role', nextRole);
      // Automatically adjust current simulated profile
      if (nextRole === 'staff') {
        const staffProfile: UserProfile = {
          uid: 'local-staff-1',
          email: 'reception@luxuryhotel.com',
          name: 'Reception Desk',
          role: 'staff'
        };
        setCurrentUser(staffProfile);
        localStorage.setItem('hotel_current_user', JSON.stringify(staffProfile));
      } else {
        const guestProfile: UserProfile = {
          uid: 'local-guest-1',
          email: 'guest@leisure.com',
          name: 'Simulated Guest',
          role: 'guest'
        };
        setCurrentUser(guestProfile);
        localStorage.setItem('hotel_current_user', JSON.stringify(guestProfile));
      }
    }
  };

  // --- CRUD Operational Actions ---

  // Room Actions
  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    const newId = (rooms.length > 0 ? (Math.max(...rooms.map(r => Number(r.id))) + 1).toString() : '101');
    const newRoom: Room = {
      id: newId,
      ...roomData
    };

    if (isFirebaseActive && db) {
      const roomPath = `rooms/${newId}`;
      try {
        await setDoc(doc(db, 'rooms', newId), newRoom);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, roomPath);
      }
    } else {
      setRooms(prev => [...prev, newRoom].sort((a, b) => Number(a.number) - Number(b.number)));
    }
  };

  const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
    if (isFirebaseActive && db) {
      const roomPath = `rooms/${roomId}`;
      try {
        await updateDoc(doc(db, 'rooms', roomId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, roomPath);
      }
    } else {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
    }
  };

  const editRoomDetails = async (roomId: string, updates: Partial<Room>) => {
    if (isFirebaseActive && db) {
      const roomPath = `rooms/${roomId}`;
      try {
        await updateDoc(doc(db, 'rooms', roomId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, roomPath);
      }
    } else {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
    }
  };

  // Toast notifications & Automated Email drafted actions
  const showToast = (toast: ToastInfo) => {
    setActiveToast(toast);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const triggerEmailDraft = (booking: Booking) => {
    const room = rooms.find(r => r.id === booking.roomId);
    const roomNum = booking.roomNumber || room?.number || 'N/A';
    const roomTypeStr = booking.roomType || room?.type || 'Standard';
    const guestEmail = booking.guestEmail || 'customer@islamiaguesthouse.com';
    const guestName = booking.guestName;
    const bookingId = booking.id;
    const checkIn = booking.checkIn;
    const checkOut = booking.checkOut;
    const totalAmount = booking.totalAmount;

    const subject = `Invoice Summary - Islamia Guest House (Booking #${bookingId})`;
    const body = `Dear ${guestName},

Thank you for checking in to Islamia Guest House! We are delighted to host you.

Here is the summary of your booking invoice details:

=======================================================
Booking Reference: #${bookingId}
Room Assigned: Room ${roomNum} (${roomTypeStr.toUpperCase()})
Check-in Date: ${checkIn}
Check-out Date: ${checkOut}
-------------------------------------------------------
Total Invoice Amount: ৳ ${totalAmount}
=======================================================

House Address:
বাড়ি নং ৫৫/সি/১, রোড নং ৯/এ, ধানমন্ডি, ঢাকা - ১২০৯
(House No: 55/C/1, Road No: 9/A, Dhanmondi, Dhaka - 1209)
Landmarks: ইবনে সিনা ৯/এ এর বিপরীতে, মীনা বাজারের পিছনে, নর্দান মেডিকেল কলেজ বিল্ডিং সংলগ্ন

For any support or questions, please reach us on:
- bKash/Hotline: 01832-841818
- Phone Call: 01909-806960
- WhatsApp: 01799-148408

Enjoy your stay!

Warm regards,
Front Desk Management
Islamia Guest House, Dhanmondi, Dhaka`;

    const mailtoUrl = `mailto:${encodeURIComponent(guestEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Automatically try to open the email draft
    try {
      window.location.href = mailtoUrl;
    } catch (err) {
      console.warn("Auto-trigger of mailto blocked or failed, relying on user interaction.", err);
    }

    showToast({
      message: `📧 Automated email draft generated for ${guestName} (${guestEmail}) with invoice summary.`,
      type: 'email',
      emailAction: {
        recipient: guestEmail,
        subject,
        body,
        mailtoUrl
      }
    });
  };

  // Booking Actions
  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
    const bookingId = `B${Date.now().toString().slice(-4)}`;
    const newBooking: Booking = {
      id: bookingId,
      ...bookingData,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const bookingPath = `bookings/${bookingId}`;
      try {
        await setDoc(doc(db, 'bookings', bookingId), newBooking);
        // Automatically put room status as occupied if booking starts today
        const todayStr = new Date().toISOString().split('T')[0];
        if (bookingData.checkIn <= todayStr && bookingData.checkOut >= todayStr) {
          await updateDoc(doc(db, 'rooms', bookingData.roomId), { status: 'occupied' });
        }
        if (bookingData.status === 'checked-in') {
          triggerEmailDraft(newBooking);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, bookingPath);
      }
    } else {
      setBookings(prev => [newBooking, ...prev]);
      // Update room status
      const todayStr = new Date().toISOString().split('T')[0];
      if (bookingData.checkIn <= todayStr && bookingData.checkOut >= todayStr) {
        setRooms(prev => prev.map(r => r.id === bookingData.roomId ? { ...r, status: 'occupied' } : r));
      }
      if (bookingData.status === 'checked-in') {
        triggerEmailDraft(newBooking);
      }
    }
    return bookingId;
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const targetBooking = bookings.find(b => b.id === bookingId);
    
    if (isFirebaseActive && db) {
      const bookingPath = `bookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { status });
        
        if (targetBooking) {
          // If guest checked in, set room status to occupied
          if (status === 'checked-in') {
            await updateDoc(doc(db, 'rooms', targetBooking.roomId), { status: 'occupied' });
            triggerEmailDraft({ ...targetBooking, status: 'checked-in' });
          }
          // If guest checked out, set room status to cleaning
          else if (status === 'checked-out') {
            await updateDoc(doc(db, 'rooms', targetBooking.roomId), { status: 'cleaning' });
          }
          // If booking was cancelled, set room status back to available if it is currently occupied by this guest
          else if (status === 'cancelled') {
            const room = rooms.find(r => r.id === targetBooking.roomId);
            if (room && room.status === 'occupied') {
              await updateDoc(doc(db, 'rooms', targetBooking.roomId), { status: 'available' });
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, bookingPath);
      }
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      
      if (targetBooking) {
        if (status === 'checked-in') {
          setRooms(prev => prev.map(r => r.id === targetBooking.roomId ? { ...r, status: 'occupied' } : r));
          triggerEmailDraft({ ...targetBooking, status: 'checked-in' });
        } else if (status === 'checked-out') {
          setRooms(prev => prev.map(r => r.id === targetBooking.roomId ? { ...r, status: 'cleaning' } : r));
        } else if (status === 'cancelled') {
          setRooms(prev => prev.map(r => r.id === targetBooking.roomId && r.status === 'occupied' ? { ...r, status: 'available' } : r));
        }
      }
    }
  };

  const addBookingNotes = async (bookingId: string, notes: string) => {
    if (isFirebaseActive && db) {
      const bookingPath = `bookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { notes });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, bookingPath);
      }
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, notes } : b));
    }
  };

  // Service Request Actions
  const createServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'createdAt'>) => {
    const reqId = `SR${Date.now().toString().slice(-4)}`;
    const newRequest: ServiceRequest = {
      id: reqId,
      ...requestData,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const requestPath = `serviceRequests/${reqId}`;
      try {
        await setDoc(doc(db, 'serviceRequests', reqId), newRequest);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, requestPath);
      }
    } else {
      setServiceRequests(prev => [newRequest, ...prev]);
    }
  };

  const updateServiceRequestStatus = async (requestId: string, status: ServiceRequestStatus) => {
    if (isFirebaseActive && db) {
      const requestPath = `serviceRequests/${requestId}`;
      try {
        await updateDoc(doc(db, 'serviceRequests', requestId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, requestPath);
      }
    } else {
      setServiceRequests(prev => prev.map(s => s.id === requestId ? { ...s, status } : s));
    }
  };

  const submitFeedback = async (rating: number, comment: string) => {
    if (!currentUser) {
      alert("Please log in to submit feedback.");
      return;
    }

    const feedbackId = `F${Date.now().toString().slice(-4)}`;
    const newFeedback: Feedback = {
      id: feedbackId,
      userId: currentUser.uid,
      userName: currentUser.name || 'Anonymous Guest',
      userEmail: currentUser.email || '',
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const feedbackPath = `feedbacks/${feedbackId}`;
      try {
        await setDoc(doc(db, 'feedbacks', feedbackId), newFeedback);
        showToast({
          message: "⭐ Thank you! Your feedback has been stored in Firestore.",
          type: 'success'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, feedbackPath);
      }
    } else {
      setFeedbacks(prev => {
        const updated = [newFeedback, ...prev];
        localStorage.setItem('hotel_feedbacks', JSON.stringify(updated));
        return updated;
      });
      showToast({
        message: "⭐ Thank you! Your feedback has been saved locally.",
        type: 'success'
      });
    }
  };

  return (
    <AppContext.Provider value={{
      rooms,
      bookings,
      serviceRequests,
      feedbacks,
      currentUser,
      currentRole,
      isFirebaseActive,
      isLoading,
      toggleRole,
      activeToast,
      showToast,
      dismissToast,
      triggerEmailDraft,
      loginWithGoogle,
      localLogin,
      logout,
      sendOtp,
      verifyOtp,
      addRoom,
      updateRoomStatus,
      editRoomDetails,
      createBooking,
      updateBookingStatus,
      addBookingNotes,
      createServiceRequest,
      updateServiceRequestStatus,
      submitFeedback,
      opMode,
      setOpMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
