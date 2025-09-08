import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { demoUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, pass: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  deleteAccount: () => void;
  subscribeToManga: (mangaId: string) => void;
  unsubscribeFromManga: (mangaId: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateUser: () => {},
  deleteAccount: () => {},
  subscribeToManga: () => {},
  unsubscribeFromManga: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useLocalStorage<User[]>('app_users', demoUsers);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateUserGlobally = (updatedUser: User) => {
      // Update state for current user
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update the user in the global user list
      setUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
  }

  const updateUser = (userData: Partial<User>) => {
    if(user) {
      const newUser = { ...user, ...userData };
      updateUserGlobally(newUser);
    }
  }

  const login = async (email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Find a user from our persistent list
        const potentialUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!potentialUser) {
            return reject(new Error('Пользователь не найден.'));
        }
        
        if (potentialUser.status === 'banned') {
            return reject(new Error('Этот аккаунт заблокирован.'));
        }

        // In a real app, you'd verify the password here
        localStorage.setItem('user', JSON.stringify(potentialUser));
        setUser(potentialUser);
        resolve();
      }, 500);
    });
  };
  
  const register = async (username: string, email: string, pass: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return reject(new Error('Аккаунт с такой почтой уже существует.'));
        }
        const newUser: User = { 
            username, 
            email,
            avatar: username,
            status: 'active',
            role: 'user',
            subscribedMangaIds: [],
        };
        // Add new user to the global list
        setUsers(prev => [...prev, newUser]);
        // Log them in
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        resolve();
      }, 500);
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };
  
  const deleteAccount = () => {
      if (user) {
          localStorage.removeItem(`bookmarks_v2_${user.email}`);
          localStorage.removeItem(`history_${user.email}`);
          localStorage.removeItem(`notifications_${user.email}`);
          // Remove user from the global list
          setUsers(prev => prev.filter(u => u.email !== user.email));
          logout();
      }
  }
  
  const subscribeToManga = (mangaId: string) => {
      if (!user) return;
      const currentSubs = user.subscribedMangaIds || [];
      if (!currentSubs.includes(mangaId)) {
          const newUser = { ...user, subscribedMangaIds: [...currentSubs, mangaId] };
          updateUserGlobally(newUser);
      }
  };

  const unsubscribeFromManga = (mangaId: string) => {
      if (!user) return;
      const currentSubs = user.subscribedMangaIds || [];
      const newUser = { ...user, subscribedMangaIds: currentSubs.filter(id => id !== mangaId) };
      updateUserGlobally(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser, deleteAccount, subscribeToManga, unsubscribeFromManga }}>
      {children}
    </AuthContext.Provider>
  );
};