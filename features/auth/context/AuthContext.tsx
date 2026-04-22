import { UserAccount } from '@/features/auth/types/auth.types';
import React, { createContext, ReactNode, useCallback, useState } from 'react';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: UserAccount | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserAccount | null>(null);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.ISADMIN ?? user?.USERLEVEL === 'ADMINISTRATOR',
    setUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    // Return default context for users without provider
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      setUser: () => {},
      logout: () => {},
    };
  }
  return context;
}
