import { useCallback, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Report } from '../../types';
import { AuthContext } from '../contexts/AuthContext';

const REPORTS_KEY = 'app_reports_v2';

export const useReports = () => {
    const [reports, setReports] = useLocalStorage<Report[]>(REPORTS_KEY, []);
    const { user } = useContext(AuthContext);

    const addReport = useCallback(({ mangaId, mangaTitle }: { mangaId: string; mangaTitle: string; }) => {
        if (!user) return;

        const newReport: Report = {
            id: Date.now(),
            mangaId,
            mangaTitle,
            reportedBy: user.email,
            timestamp: new Date().toISOString(),
            status: 'pending',
        };
        setReports(prev => [newReport, ...prev]);
    }, [setReports, user]);

    const resolveReport = useCallback((reportId: number) => {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    }, [setReports]);

    return { reports, addReport, resolveReport };
};
