import React, { useState, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MangaCard from '../components/MangaCard';
import { useBookmarks } from '../hooks/useBookmarks';
import { MangaContext } from '../contexts/MangaContext';
import { BookmarkStatus } from '../../types';
import MangaCardSkeleton from '../components/skeletons/MangaCardSkeleton';

const tabs: { name: 'Все' | BookmarkStatus }[] = [
    { name: 'Все' },
    { name: 'Читаю' },
    { name: 'Буду читать' },
    { name: 'Прочитано' },
    { name: 'Брошено' },
    { name: 'Отложено' },
    { name: 'Не интересно' },
];

const BookmarksPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Все' | BookmarkStatus>('Читаю');
    const { bookmarks } = useBookmarks();
    const { mangaList, loading } = useContext(MangaContext);

    const bookmarkedManga = useMemo(() => {
        const mangaMap = new Map(mangaList.map(m => [m.id, m]));
        return bookmarks
            .filter(b => activeTab === 'Все' || b.status === activeTab)
            .map(b => mangaMap.get(b.mangaId))
            .filter((m): m is import('../../types').Manga => !!m);
    }, [bookmarks, mangaList, activeTab]);
    
    const getCountForTab = (tabName: 'Все' | BookmarkStatus) => {
        if (tabName === 'Все') return bookmarks.length;
        return bookmarks.filter(b => b.status === tabName).length;
    };
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">Закладки</h1>

            <div className="border-b border-surface mb-6">
                <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.name}
                            name={tab.name}
                            count={getCountForTab(tab.name)}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    ))}
                </div>
            </div>

            {loading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                    {Array.from({ length: 6 }).map((_, i) => <MangaCardSkeleton key={i} />)}
                </div>
            ) : bookmarkedManga.length > 0 ? (
                <motion.div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {bookmarkedManga.map(manga => (
                        <motion.div key={manga.id} variants={itemVariants}>
                            <MangaCard manga={manga} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-text-primary">Здесь пока пусто</h2>
                    <p className="text-muted mt-2">Добавляйте мангу в закладки, чтобы она появилась здесь.</p>
                    <Link to="/catalog" className="mt-6 inline-block bg-brand hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Перейти в каталог
                    </Link>
                </div>
            )}
        </div>
    );
};

const TabButton: React.FC<{ name: 'Все' | BookmarkStatus; count: number; activeTab: 'Все' | BookmarkStatus; setActiveTab: (name: 'Все' | BookmarkStatus) => void; }> = ({ name, count, activeTab, setActiveTab }) => {
    const isActive = name === activeTab;
    return (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                isActive
                    ? 'border-brand text-text-primary'
                    : 'border-transparent text-muted hover:text-text-primary'
            }`}
        >
            {name} <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-brand text-white' : 'bg-surface text-text-secondary'}`}>{count}</span>
        </button>
    );
};

export default BookmarksPage;