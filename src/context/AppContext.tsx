import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Adjust your relative import path as needed

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Always default initial role to 'guest' for security
  const [currentRole, setCurrentRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);

      if (fbUser) {
        setUser(fbUser);

        try {
          // Fetch user details strictly from trusted Firestore records
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          let chosenRole: UserRole = 'guest';

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            
            // Only assign higher roles if explicitly HR approved
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

  return (
    <AppContext.Provider value={{ user, userProfile, currentRole, loading }}>
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
