// context/UserContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  const logout = async () => {
    const res = await fetch('/api/logout', { method: 'POST' });
    if (!res.ok) return;
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};