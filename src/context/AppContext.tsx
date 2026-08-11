import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Adjust relative path if needed

export type UserRole = 'admin' | 'staff' | 'guest';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  hrApproved?: boolean;
}

interface AppContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  currentRole: UserRole;
  loading: boolean;
  // Added safe array states with [] defaults to prevent .filter() white screen errors
  bookings: any[];
  rooms: any[];
  usersList: UserProfile[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize all arrays with [] to guarantee .filter() never operates on undefined
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);

      if (fbUser) {
        setUser(fbUser);

        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          let chosenRole: UserRole = 'guest';

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            
            if (data.role === 'guest' || data.hrApproved === true) {
              chosenRole = data.role;
            }

            setUserProfile({
              ...data,
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: chosenRole,
            });
          } else {
            setUserProfile(null);
          }

          setCurrentRole(chosenRole);
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setCurrentRole('guest');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setCurrentRole('guest');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscriptions with empty array fallback
  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, 'bookings'), 
      (snapshot) => setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => setBookings([])
    );

    const unsubRooms = onSnapshot(collection(db, 'rooms'), 
      (snapshot) => setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      () => setRooms([])
    );

    return () => {
      unsubBookings();
      unsubRooms();
    };
  }, []);

  return (
    <AppContext.Provider 
      value={{ 
        user, 
        userProfile, 
        currentRole, 
        loading, 
        bookings, 
        rooms, 
        usersList 
      }}
    >
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
