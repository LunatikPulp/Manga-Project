import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { HistoryItem } from '../../types';

const getHistoryKey = (userId: string | undefined) => `history_v2_${userId || 'guest'}`; // updated key for new data structure

export const useHistory = () => {
    const { user } = useContext(AuthContext);
    const historyKey = getHistoryKey(user?.email);
    
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const item = window.localStorage.getItem(historyKey);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    });

    useEffect(() => {
      try {
        const item = window.localStorage.getItem(historyKey);
        setHistory(item ? JSON.parse(item) : []);
      } catch (error) {
        console.error(error);
        setHistory([]);
      }
    }, [user, historyKey]);

    const addHistoryItem = useCallback((mangaId: string, chapterId: string) => {
        setHistory(prevHistory => {
            const newHistoryItem: HistoryItem = {
                mangaId,
                chapterId,
                readAt: new Date().toISOString(),
            };
            // Remove previous entry for the same chapter to update its timestamp and position
            const filteredHistory = prevHistory.filter(item => 
                !(item.mangaId === mangaId && item.chapterId === chapterId)
            );
            const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 50); // Keep last 50 items
            
            window.localStorage.setItem(historyKey, JSON.stringify(newHistory));
            return newHistory;
        });
    }, [historyKey]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        window.localStorage.removeItem(historyKey);
    }, [historyKey]);

    return { history, addHistoryItem, clearHistory };
};