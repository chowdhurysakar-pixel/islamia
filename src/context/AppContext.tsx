/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, User, ToastConfig } from '../types';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  opMode: 'receptionist' | 'admin' | 'hr';
  setOpMode: (mode: 'receptionist' | 'admin' | 'hr') => void;
  isLoading: boolean;
  activeToast: ToastConfig | null;
  showToast: (toast: ToastConfig) => void;
  dismissToast: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Synchronous LocalStorage Initialization
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'staff' || storedRole === 'admin') {
        return storedRole as UserRole;
      }
    } catch (e) {
      console.error('Failed to read from localStorage', e);
    }
    return 'guest';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [opMode, setOpMode] = useState<'receptionist' | 'admin' | 'hr'>('receptionist');
  const [isLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<ToastConfig | null>(null);

  // Synchronize Role Changes
  const setCurrentRole = (role: UserRole) => {
    const validRole = (role === 'staff' || role === 'admin') ? role : 'guest';
    try {
      localStorage.setItem('userRole', validRole);
    } catch (e) {
      console.error('Failed to write userRole to localStorage', e);
    }
    setCurrentRoleState(validRole);
  };

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const showToast = (toast: ToastConfig) => setActiveToast(toast);
  const dismissToast = () => setActiveToast(null);

  // Logout Cleanup
  const logout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('admin_authorized');
    setCurrentUser(null);
    setCurrentRoleState('guest');
    setOpMode('receptionist');
    showToast({
      type: 'success',
      message: 'Signed out successfully.'
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        opMode,
        setOpMode,
        isLoading,
        activeToast,
        showToast,
        dismissToast,
        logout,
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
