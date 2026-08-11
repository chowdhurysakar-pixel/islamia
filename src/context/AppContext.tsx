import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface Booking {
  id: string;
  guestName?: string;
  roomNumber?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

interface AppContextType {
  user: FirebaseUser | null;
  bookings: Booking[];
  loading: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ১. ইউজার লগইন স্টেট লিসেনার
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // ২. রিয়েল-টাইম ফায়ারস্টোর লিসেনার (onSnapshot)
  useEffect(() => {
    const bookingsRef = collection(db, 'bookings');

    // ডাটাবেজে কোনো পরিবর্তন হলে রিফ্রেস ছাড়াই স্ক্রিন আপডেট হবে
    const unsubscribeBookings = onSnapshot(
      bookingsRef,
      (snapshot) => {
        const bookingsData: Booking[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBookings(bookingsData);
      },
      (error) => {
        console.error("Real-time bookings fetch error:", error);
      }
    );

    return () => unsubscribeBookings();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, bookings, loading, logout }}>
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
