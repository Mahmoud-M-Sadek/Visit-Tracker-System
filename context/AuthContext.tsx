import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { getSession, logout as apiLogout } from '../services/mockBackend';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData: User) => {
    setUser(userData);
  };

  const logoutUser = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginUser, 
      logoutUser, 
      isAuthenticated: !!user,
      isAdmin: user?.role === UserRole.ADMIN
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);