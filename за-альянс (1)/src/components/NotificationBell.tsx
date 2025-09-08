import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationContext } from '../contexts/NotificationContext';

const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const NotificationBell: React.FC = () => {
    const { notifications, markAsRead, clearNotifications } = useContext(NotificationContext);
    const [isOpen, setIsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if(!isOpen) {
            markAsRead();
        }
    }

    return (
        <div className="relative" ref={notificationRef}>
            <button onClick={handleToggle} className="relative p-2 rounded-full text-muted hover:bg-surface hover:text-brand transition-colors" aria-label="Уведомления">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-brand-accent ring-2 ring-base" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-overlay rounded-md shadow-lg border border-surface"
                    >
                        <div className="p-3 flex justify-between items-center border-b border-surface">
                            <h4 className="font-semibold text-sm">Уведомления</h4>
                            {notifications.length > 0 && (
                                <button onClick={clearNotifications} className="text-xs text-muted hover:text-brand-accent">Очистить все</button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <Link key={notif.id} to={notif.link} onClick={() => setIsOpen(false)} className="block p-3 hover:bg-surface transition-colors">
                                        <p className="text-sm text-text-primary">{notif.message}</p>
                                        <p className="text-xs text-muted mt-1">{new Date(notif.timestamp).toLocaleString('ru-RU')}</p>
                                    </Link>
                                ))
                            ) : (
                                <p className="p-4 text-center text-sm text-muted">Новых уведомлений нет.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;