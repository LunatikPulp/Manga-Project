import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Bookmark, BookmarkStatus } from '../../types';

const BOOKMARKS_STORAGE_KEY_PREFIX = 'bookmarks_v3_'; // updated key for new data structure
const getBookmarksKey = (userId: string | undefined) => `${BOOKMARKS_STORAGE_KEY_PREFIX}${userId || 'guest'}`;

export const useBookmarks = () => {
    const { user } = useContext(AuthContext);
    const bookmarksKey = getBookmarksKey(user?.email);
    
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
        try {
            const item = window.localStorage.getItem(bookmarksKey);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    });

    useEffect(() => {
      try {
        const item = window.localStorage.getItem(bookmarksKey);
        setBookmarks(item ? JSON.parse(item) : []);
      } catch (error) {
        console.error(error);
        setBookmarks([]);
      }
    }, [user, bookmarksKey]);

    const persistBookmarks = useCallback((newBookmarks: Bookmark[]) => {
        setBookmarks(newBookmarks);
        window.localStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
    }, [bookmarksKey]);

    const updateBookmarkStatus = useCallback((mangaId: string, status: BookmarkStatus) => {
        setBookmarks(prev => {
            const existingBookmarkIndex = prev.findIndex(b => b.mangaId === mangaId);
            const newBookmarks = [...prev];
            if (existingBookmarkIndex > -1) {
                newBookmarks[existingBookmarkIndex] = { ...newBookmarks[existingBookmarkIndex], status };
            } else {
                newBookmarks.push({ mangaId, status, addedAt: new Date().toISOString() });
            }
            window.localStorage.setItem(bookmarksKey, JSON.stringify(newBookmarks));
            return newBookmarks;
        });
    }, [bookmarksKey]);

    const removeBookmark = useCallback((mangaId: string) => {
        const newBookmarks = bookmarks.filter(b => b.mangaId !== mangaId);
        persistBookmarks(newBookmarks);
    }, [bookmarks, persistBookmarks]);

    const getBookmarkStatus = useCallback((mangaId: string): BookmarkStatus | null => {
        return bookmarks.find(b => b.mangaId === mangaId)?.status || null;
    }, [bookmarks]);

    return { bookmarks, updateBookmarkStatus, removeBookmark, getBookmarkStatus };
};
