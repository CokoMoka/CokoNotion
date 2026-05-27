import React, { createContext, ReactNode, useContext } from 'react';
import { useUser } from '../../hooks/useUser';
import { UserData } from '../../services/auth';

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const userData = useUser();
  
  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};