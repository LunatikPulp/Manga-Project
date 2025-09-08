import { useLocalStorage } from './useLocalStorage';
import { User } from '../../types';
import { demoUsers } from '../data/mockData';
import { useCallback } from 'react';

const USERS_KEY = 'app_users';

export const useUsers = () => {
    const [users, setUsers] = useLocalStorage<User[]>(USERS_KEY, demoUsers);

    const addUser = useCallback((user: User) => {
        setUsers(prev => {
            if (prev.some(u => u.email === user.email)) {
                return prev; // Don't add if exists
            }
            return [...prev, user];
        });
    }, [setUsers]);

    const updateUserStatus = useCallback((email: string, status: 'active' | 'banned') => {
        setUsers(prev => prev.map(u => u.email === email ? { ...u, status } : u));
    }, [setUsers]);

    const updateUserRole = useCallback((email: string, role: User['role']) => {
        setUsers(prev => prev.map(u => u.email === email ? { ...u, role } : u));
    }, [setUsers]);

    const getUserByEmail = useCallback((email: string) => {
        return users.find(u => u.email === email);
    }, [users]);

    return { users, addUser, updateUserStatus, getUserByEmail, updateUserRole };
};