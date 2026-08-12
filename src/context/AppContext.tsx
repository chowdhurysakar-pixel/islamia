import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

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

interface AppContextType {
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // ১. রুমের জন্য রিয়েল-টাইম সিঙ্ক
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const roomList: Room[] = [];
      snapshot.forEach((doc) => {
        roomList.push({ id: doc.id, ...doc.data() } as Room);
      });
      setRooms(roomList);
    }, (error) => {
      console.error("Firestore Rooms Sync Error:", error);
    });

    return () => unsubscribe();
  }, []);

  // ২. বুকিংয়ের জন্য রিয়েল-টাইম সিঙ্ক (আজীবন ডাটা সেভ থাকবে, মোবাইল এবং ল্যাপটপ একসাথে আপডেট হবে)
  useEffect(() => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingList: Booking[] = [];
      snapshot.forEach((doc) => {
        bookingList.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingList);
    }, (error) => {
      console.error("Firestore Bookings Sync Error:", error);
    });

    return () => unsubscribe();
  }, []);

  // রুম অ্যাকশনসমূহ
  const addRoom = async (room: Room) => {
    try {
      await setDoc(doc(db, 'rooms', room.id), room);
    } catch (err) {
      console.error("Error adding room:", err);
    }
  };

  const updateRoom = async (id: string, updatedFields: Partial<Room>) => {
    try {
      await updateDoc(doc(db, 'rooms', id), updatedFields);
    } catch (err) {
      console.error("Error updating room:", err);
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', id));
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  // বুকিং অ্যাকশনসমূহ (চেক-ইন / চেক-আউট ডাটা চিরস্থায়ীভাবে সেভ হবে)
  const addBooking = async (bookingData: Omit<Booking, 'id'>) => {
    try {
      const bookingId = 'B' + Math.floor(1000 + Math.random() * 9000);
      const newBooking = {
        ...bookingData,
        id: bookingId,
        status: 'CHECKED-IN',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'bookings', bookingId), newBooking);

      // স্বয়ংক্রিয়ভাবে রুমের স্ট্যাটাস occupied করা হবে
      if (bookingData.roomId) {
        await updateDoc(doc(db, 'rooms', bookingData.roomId), { status: 'occupied' });
      }
    } catch (err) {
      console.error("Error creating booking:", err);
    }
  };

  const checkoutBooking = async (id: string) => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { status: 'CHECKED-OUT' });

      const targetBooking = bookings.find(b => b.id === id);
      if (targetBooking?.roomId) {
        await updateDoc(doc(db, 'rooms', targetBooking.roomId), { status: 'cleaning' });
      }
    } catch (err) {
      console.error("Error checking out booking:", err);
    }
  };

  return (
    <AppContext.Provider value={{
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
