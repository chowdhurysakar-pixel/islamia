import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup, 
  signOut as firebaseSignOut 
} from '../firebase';

export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  price: number;
}

export interface Booking {
  id: string;
  roomId: string;
  roomNumber?: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalBill: number;
  status: 'CHECKED-IN' | 'CHECKED-OUT' | 'CANCELLED';
  createdAt?: any;
}

interface ToastInfo {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Auth & Header State
  user: any;
  currentUser: any;
  currentRole: 'guest' | 'staff';
  toggleRole: () => void;
  opMode: 'admin' | 'receptionist' | 'hr';
  setOpMode: (mode: 'admin' | 'receptionist' | 'hr') => void;
  showToast: (toast: ToastInfo) => void;
  
  // Auth Modals & Actions
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Firestore Database Data
  rooms: Room[];
  bookings: Booking[];
  addRoom: (room: Room) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
  checkoutBooking: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth & UI States required by Header
  const [user, setUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<'guest' | 'staff'>('guest');
  const [opMode, setOpMode] = useState<'admin' | 'receptionist' | 'hr'>('receptionist');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
  // Database States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Rooms Sync
  useEffect(() => {
    if (!db) return;
    const roomsRef = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const roomList: Room[] = [];
      snapshot.forEach((doc) => {
        roomList.push({ id: doc.id, ...doc.data() } as Room);
      });
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Bookings Sync
  useEffect(() => {
    if (!db) return;
    const bookingsRef = collection(db, 'bookings');
    const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
      const bookingList: Booking[] = [];
      snapshot.forEach((doc) => {
        bookingList.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingList);
    });
    return () => unsubscribe();
  }, []);

  // Header State Controllers
  const toggleRole = () => {
    setCurrentRole((prev) => (prev === 'guest' ? 'staff' : 'guest'));
  };

  const showToast = (toast: ToastInfo) => {
    console.log(`[${toast.type.toUpperCase()}] ${toast.message}`);
  };

  // Auth Functions
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Database CRUD Functions
  const addRoom = async (room: Room) => {
    if (!db) return;
    await setDoc(doc(db, 'rooms', room.id), room);
  };

  const updateRoom = async (id: string, updatedFields: Partial<Room>) => {
    if (!db) return;
    await updateDoc(doc(db, 'rooms', id), updatedFields);
  };

  const deleteRoom = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'rooms', id));
  };

  const addBooking = async (bookingData: Omit<Booking, 'id'>) => {
    if (!db) return;
    const bookingId = 'B' + Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      ...bookingData,
      id: bookingId,
      status: 'CHECKED-IN',
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'bookings', bookingId), newBooking);
    if (bookingData.roomId) {
      await updateDoc(doc(db, 'rooms', bookingData.roomId), { status: 'occupied' });
    }
  };

  const checkoutBooking = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bookings', id), { status: 'CHECKED-OUT' });
    const target = bookings.find(b => b.id === id);
    if (target?.roomId) {
      await updateDoc(doc(db, 'rooms', target.roomId), { status: 'cleaning' });
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      currentUser: user ? { ...user, role: 'admin' } : null,
      currentRole,
      toggleRole,
      opMode,
      setOpMode,
      showToast,
      isAuthModalOpen,
      setIsAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      logout,
      rooms,
      bookings,
      addRoom,
      updateRoom,
      deleteRoom,
      addBooking,
      checkoutBooking
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
