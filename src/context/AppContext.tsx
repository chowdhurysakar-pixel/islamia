/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, Booking, ServiceRequest, UserProfile, UserRole, RoomStatus, BookingStatus, ServiceRequestStatus, ServiceRequestType } from '../types';
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
  // Auth Functions
  loginWithGoogle: () => Promise<void>;
  localLogin: (role: UserRole, email: string, name: string) => void;
  logout: () => Promise<void>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('staff');
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          // Check if this UID or email corresponds to an admin
          const emailLower = fbUser.email?.toLowerCase() || '';
          // We can dynamically assign staff/admin based on configuration, default to admin for testing
          const isStaff = emailLower.includes('staff') || emailLower.includes('admin') || true; 
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Guest User',
            role: isStaff ? 'staff' : 'guest'
          };
          setCurrentUser(profile);
          setCurrentRole(profile.role);
          
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
      };
    } else {
      // Offline Local Storage Sandbox Fallback
      console.log("Using Offline Browser Sandbox Persistence.");
      
      const storedRooms = localStorage.getItem('hotel_rooms');
      const storedBookings = localStorage.getItem('hotel_bookings');
      const storedServices = localStorage.getItem('hotel_services');
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

      if (storedRole) {
        setCurrentRole(storedRole as UserRole);
      } else {
        setCurrentRole('staff'); // Default simulation mode
      }

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        const defaultStaffUser: UserProfile = {
          uid: 'local-staff-1',
          email: 'reception@luxuryhotel.com',
          name: 'Reception Desk',
          role: 'staff'
        };
        setCurrentUser(defaultStaffUser);
        localStorage.setItem('hotel_current_user', JSON.stringify(defaultStaffUser));
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
  const loginWithGoogle = async () => {
    if (isFirebaseActive && auth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Google authentication error:", error);
      }
    } else {
      // Local Google Login toggle simulation
      localLogin('staff', 'receptionist@luxuryhotel.com', 'Simulated Receptionist');
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
      loginWithGoogle,
      localLogin,
      logout,
      addRoom,
      updateRoomStatus,
      editRoomDetails,
      createBooking,
      updateBookingStatus,
      addBookingNotes,
      createServiceRequest,
      updateServiceRequestStatus
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
