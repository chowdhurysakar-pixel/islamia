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
  getDoc,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';

// Helper function to strip any 'undefined' properties before sending to Firestore
function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestoreData) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

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
  deleteRoom: (roomId: string) => Promise<void>;
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
  opMode: 'receptionist' | 'hr' | 'admin';
  setOpMode: (mode: 'receptionist' | 'hr' | 'admin') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const stored = localStorage.getItem('hotel_rooms');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading initial stored rooms:", e);
    }
    return INITIAL_ROOMS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const stored = localStorage.getItem('hotel_bookings');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading initial stored bookings:", e);
    }
    return INITIAL_BOOKINGS;
  });

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    try {
      const stored = localStorage.getItem('hotel_services');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading initial stored services:", e);
    }
    return INITIAL_SERVICES;
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    try {
      const stored = localStorage.getItem('hotel_feedbacks');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading initial stored feedbacks:", e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('staff');
  const [opMode, setOpMode] = useState<'receptionist' | 'hr' | 'admin'>('receptionist');
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const [otps, setOtps] = useState<Record<string, string>>({});

  // Initialize Firebase Connection
  useEffect(() => {
    let isConfigured = false;
    try {
      isConfigured = initFirebase(firebaseConfig);
    } catch (e) {
      console.warn("Firebase config not available or incomplete. Falling back to Local Storage Sandbox.", e);
    }
    
    setIsFirebaseActive(isConfigured);

    if (isConfigured && db && auth) {
      const testConnection = async () => {
        try {
          await getDoc(doc(db, 'test', 'connection'));
        } catch (error) {
          console.log("Firestore local cache active; network sync pending.");
        }
      };
      testConnection();

      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const emailLower = fbUser.email?.toLowerCase() || '';
          
          if (!fbUser.emailVerified) {
            setCurrentUser(null);
            setCurrentRole('guest');
            setIsLoading(false);
            return;
          }
          
          let chosenRole: UserRole = (localStorage.getItem(`pending_role_${emailLower}`) as UserRole) || (localStorage.getItem('pending_google_role') as UserRole) || 'guest';
          if (!['admin', 'staff', 'guest'].includes(chosenRole)) {
            chosenRole = (emailLower.includes('admin') || emailLower.includes('hr')) ? 'admin'
                       : (emailLower.includes('staff') || emailLower.includes('reception')) ? 'staff'
                       : 'guest';
          }
          localStorage.removeItem('pending_google_role');
          localStorage.removeItem(`pending_role_${emailLower}`);

          const pendingName = localStorage.getItem(`pending_name_${emailLower}`) || fbUser.displayName || (chosenRole === 'admin' ? 'HR Manager' : chosenRole === 'staff' ? 'Front Desk Staff' : 'Guest User');
          localStorage.removeItem(`pending_name_${emailLower}`);

          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: pendingName,
            role: chosenRole
          };
          setCurrentUser(profile);
          setCurrentRole(chosenRole);
          
          setDoc(doc(db, 'users', fbUser.uid), profile).catch(e => {
            console.error("Failed to sync user profile to Firestore:", e);
          });
        } else {
          setCurrentUser(null);
          setCurrentRole('guest');
        }
        setIsLoading(false);
      });

      const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
        if (!snapshot.empty) {
          const firestoreRooms: Room[] = [];
          snapshot.forEach((docSnap) => {
            firestoreRooms.push({ id: docSnap.id, ...docSnap.data() } as Room);
          });

          let mergedRooms = [...firestoreRooms];
          try {
            const storedLocal = localStorage.getItem('hotel_rooms');
            if (storedLocal) {
              const localList: Room[] = JSON.parse(storedLocal);
              if (Array.isArray(localList)) {
                const extraLocalRooms = localList.filter(lr => !firestoreRooms.some(fr => fr.id === lr.id));
                if (extraLocalRooms.length > 0) {
                  mergedRooms = [...mergedRooms, ...extraLocalRooms];
                  extraLocalRooms.forEach(lr => {
                    setDoc(doc(db, 'rooms', lr.id), sanitizeFirestoreData(lr)).catch(() => {});
                  });
                }
              }
            }
          } catch (e) {
            console.warn("Failed merging local rooms with Firestore snapshot:", e);
          }

          mergedRooms.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0) || a.number.localeCompare(b.number));
          setRooms(mergedRooms);
          try {
            localStorage.setItem('hotel_rooms', JSON.stringify(mergedRooms));
          } catch (e) {
            console.error("Failed saving rooms snapshot to localStorage:", e);
          }
        }
      }, (error) => {
        console.warn("Firestore rooms listener warning:", error);
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

      return () => {
        unsubscribeAuth();
        unsubRooms();
        unsubFeedbacks();
      };
    } else {
      setIsLoading(false);
    }
  }, [isFirebaseActive]);

  // Authenticated Firestore Subscriptions
  useEffect(() => {
    if (!isFirebaseActive || !db || !auth) return;

    let unsubBookings: (() => void) | null = null;
    let unsubRequests: (() => void) | null = null;

    if (currentUser) {
      if (currentUser.role === 'staff' || currentUser.role === 'admin') {
        unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
          const bookingsList: Booking[] = [];
          snapshot.forEach((docSnap) => {
            bookingsList.push({ id: docSnap.id, ...docSnap.data() } as Booking);
          });
          setBookings(bookingsList);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'bookings');
        });

        unsubRequests = onSnapshot(collection(db, 'serviceRequests'), (snapshot) => {
          const requestsList: ServiceRequest[] = [];
          snapshot.forEach((docSnap) => {
            requestsList.push({ id: docSnap.id, ...docSnap.data() } as ServiceRequest);
          });
          setServiceRequests(requestsList);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'serviceRequests');
        });
      } else if (currentUser.role === 'guest') {
        const guestBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
        unsubBookings = onSnapshot(guestBookingsQuery, (snapshot) => {
          const bookingsList: Booking[] = [];
          snapshot.forEach((docSnap) => {
            bookingsList.push({ id: docSnap.id, ...docSnap.data() } as Booking);
          });
          setBookings(bookingsList);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'bookings');
        });
        setServiceRequests([]);
      }
    } else {
      setBookings([]);
      setServiceRequests([]);
    }

    return () => {
      if (unsubBookings) unsubBookings();
      if (unsubRequests) unsubRequests();
    };
  }, [currentUser, isFirebaseActive]);

  // Sync state to local storage
  useEffect(() => {
    if (rooms) localStorage.setItem('hotel_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (bookings) localStorage.setItem('hotel_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    if (serviceRequests) localStorage.setItem('hotel_services', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  // Notification Helpers
  const showToast = (toast: ToastInfo) => setActiveToast(toast);
  const dismissToast = () => setActiveToast(null);

  const triggerEmailDraft = (booking: Booking) => {
    const subject = `Booking Confirmation - Islamia Guest House (${booking.id})`;
    const body = `Dear ${booking.guestName},\n\nThank you for choosing Islamia Guest House, Dhanmondi.\n\nBooking ID: ${booking.id}\nRoom: ${booking.roomNumber}\nCheck-In: ${booking.checkInDate}\nCheck-Out: ${booking.checkOutDate}\nTotal Amount: ৳${booking.totalPrice}\n\nWe look forward to welcoming you!`;
    const mailtoUrl = `mailto:${encodeURIComponent(booking.guestEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    showToast({
      type: 'email',
      message: `📧 Email draft prepared for ${booking.guestName}!`,
      duration: 10000,
      emailAction: { recipient: booking.guestEmail || '', subject, body, mailtoUrl }
    });
  };

  const toggleRole = () => {
    const roles: UserRole[] = ['guest', 'staff', 'admin'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    setCurrentRole(nextRole);
  };

  // Auth Actions
  const loginWithGoogle = async (role?: UserRole) => {
    const selectedRole = role || 'guest';
    if (isFirebaseActive && auth) {
      const provider = new GoogleAuthProvider();
      try {
        localStorage.setItem('pending_google_role', selectedRole);
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.warn("Google authentication notice:", error);
      }
    } else {
      localLogin(selectedRole, `${selectedRole}@islamiaguesthouse.com`, `${selectedRole.toUpperCase()} User`);
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
    }
    setCurrentUser(null);
    setCurrentRole('guest');
    localStorage.removeItem('hotel_current_user');
    localStorage.setItem('hotel_current_role', 'guest');
  };

  const sendOtp = async (email: string, name?: string, role?: UserRole, isSignUp?: boolean) => {
    const emailLower = email.toLowerCase().trim();
    if (!emailLower || !emailLower.includes('@gmail.com')) {
      return { success: false, error: 'Please enter a valid Gmail address.' };
    }

    if (isFirebaseActive && auth) {
      const password = 'IslamiaSecure_' + emailLower.replace(/[^a-zA-Z0-9]/g, '') + '_2026!';
      if (isSignUp) {
        try {
          localStorage.setItem(`pending_role_${emailLower}`, role || 'guest');
          localStorage.setItem(`pending_name_${emailLower}`, (name || 'Guest').trim());

          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: name?.trim() });
            await sendEmailVerification(userCredential.user);
            
            showToast({
              type: 'success',
              message: `✉️ Verification link sent to ${emailLower}! Please check your Gmail.`
            });
            return { success: true, otpCode: 'Sent_Live_Email' };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Failed to sign up.' };
        }
      } else {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          if (userCredential.user) {
            if (!userCredential.user.emailVerified) {
              await sendEmailVerification(userCredential.user);
              return { success: true, otpCode: 'Resent_Verification' };
            }
            return { success: true, otpCode: 'Verified' };
          }
        } catch (err: any) {
          return { success: false, error: 'Invalid login credentials or unregistered email.' };
        }
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtps(prev => ({ ...prev, [emailLower]: otpCode }));

    showToast({
      type: 'email',
      message: `🔐 Verification OTP [${otpCode}] generated for ${emailLower}!`,
      duration: 10000
    });

    return { success: true, otpCode };
  };

  const verifyOtp = async (email: string, enteredOtp: string, isSignUp?: boolean, name?: string, role?: UserRole) => {
    const emailLower = email.toLowerCase().trim();

    if (isFirebaseActive && auth) {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (!auth.currentUser.emailVerified) {
            return { success: false, error: 'Email not verified yet. Please click the link in your inbox.' };
          }

          const pendingRole = (localStorage.getItem(`pending_role_${emailLower}`) as UserRole) || role || 'guest';
          const pendingName = localStorage.getItem(`pending_name_${emailLower}`) || name || 'Guest User';

          const newUser: UserProfile = {
            uid: auth.currentUser.uid,
            email: emailLower,
            name: pendingName,
            role: pendingRole
          };

          await setDoc(doc(db, 'users', newUser.uid), newUser);
          setCurrentUser(newUser);
          setCurrentRole(pendingRole);

          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Local simulation verification
    if (otps[emailLower] && otps[emailLower] === enteredOtp) {
      localLogin(role || 'guest', emailLower, name || 'Guest User');
      return { success: true };
    }
    return { success: false, error: 'Invalid OTP code entered.' };
  };

  // Room Actions
  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    const newId = `R${Date.now().toString().slice(-4)}`;
    const newRoom: Room = { id: newId, ...roomData };
    
    setRooms(prev => [...prev, newRoom]);

    if (isFirebaseActive && db) {
      try {
        await setDoc(doc(db, 'rooms', newId), sanitizeFirestoreData(newRoom));
      } catch (e) {
        console.error("Firestore error adding room:", e);
      }
    }
  };

  const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'rooms', roomId), { status });
      } catch (e) {
        console.error("Firestore error updating room status:", e);
      }
    }
  };

  const editRoomDetails = async (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'rooms', roomId), sanitizeFirestoreData(updates));
      } catch (e) {
        console.error("Firestore error updating room:", e);
      }
    }
  };

  const deleteRoom = async (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));

    if (isFirebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'rooms', roomId));
      } catch (e) {
        console.error("Firestore error deleting room:", e);
      }
    }
  };

  // Booking Actions
  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newId = `B${Date.now().toString().slice(-4)}`;
    const newBooking: Booking = {
      id: newId,
      ...bookingData,
      createdAt: new Date().toISOString()
    };

    setBookings(prev => [newBooking, ...prev]);

    if (isFirebaseActive && db) {
      try {
        await setDoc(doc(db, 'bookings', newId), sanitizeFirestoreData(newBooking));
      } catch (e) {
        console.error("Firestore error saving booking:", e);
      }
    }

    triggerEmailDraft(newBooking);
    return newId;
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { status });
      } catch (e) {
        console.error("Firestore error updating booking status:", e);
      }
    }
  };

  const addBookingNotes = async (bookingId: string, notes: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, notes } : b));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { notes });
      } catch (e) {
        console.error("Firestore error updating booking notes:", e);
      }
    }
  };

  // Service Request Actions
  const createServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'createdAt'>) => {
    const newId = `SR${Date.now().toString().slice(-4)}`;
    const newRequest: ServiceRequest = {
      id: newId,
      ...requestData,
      createdAt: new Date().toISOString()
    };

    setServiceRequests(prev => [newRequest, ...prev]);

    if (isFirebaseActive && db) {
      try {
        await setDoc(doc(db, 'serviceRequests', newId), sanitizeFirestoreData(newRequest));
      } catch (e) {
        console.error("Firestore error creating service request:", e);
      }
    }
  };

  const updateServiceRequestStatus = async (requestId: string, status: ServiceRequestStatus) => {
    setServiceRequests(prev => prev.map(s => s.id === requestId ? { ...s, status } : s));

    if (isFirebaseActive && db) {
      try {
        await updateDoc(doc(db, 'serviceRequests', requestId), { status });
      } catch (e) {
        console.error("Firestore error updating service status:", e);
      }
    }
  };

  // Feedback Actions
  const submitFeedback = async (rating: number, comment: string) => {
    const newFeedback: Feedback = {
      id: `F${Date.now().toString().slice(-4)}`,
      userId: currentUser?.uid || 'guest',
      userName: currentUser?.name || 'Guest User',
      userEmail: currentUser?.email || '',
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    setFeedbacks(prev => [newFeedback, ...prev]);

    if (isFirebaseActive && db) {
      try {
        await setDoc(doc(db, 'feedbacks', newFeedback.id), sanitizeFirestoreData(newFeedback));
      } catch (e) {
        console.error("Firestore error submitting feedback:", e);
      }
    }
  };

  return (
    <AppContext.Provider value={{
      rooms,
      bookings,
      serviceRequests,
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
      deleteRoom,
      createBooking,
      updateBookingStatus,
      addBookingNotes,
      createServiceRequest,
      updateServiceRequestStatus,
      feedbacks,
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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
