import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Notification } from '../types';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: () => void;
  clearNotifications: () => void;
}

const getNotificationKey = (userId: string | undefined) => `notifications_${userId || 'guest'}`;

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useContext(AuthContext);
  const notificationKey = getNotificationKey(user?.email);

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(notificationKey);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotifications([]);
    }
  }, [user, notificationKey]);

  const persistNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem(notificationKey, JSON.stringify(newNotifications));
  };
  
  const addNotification = (notificationData: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
      const newNotification: Notification = {
          ...notificationData,
          id: Date.now(),
          read: false,
          timestamp: new Date().toISOString(),
      };
      persistNotifications([newNotification, ...notifications].slice(0, 20)); // Keep last 20 notifications
  };

  const markAsRead = () => {
    const updatedNotifications = notifications.map(n => ({...n, read: true}));
    persistNotifications(updatedNotifications);
  };
  
  const clearNotifications = () => {
    persistNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};