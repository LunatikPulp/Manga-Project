import React, { useState, useContext, useMemo } from 'react';
import { MangaContext } from '../contexts/MangaContext';
import MangaCard from '../components/MangaCard';
import FilterSidebar from '../components/FilterSidebar';
import MangaCardSkeleton from '../components/skeletons/MangaCardSkeleton';
import { motion } from 'framer-motion';
import { Manga } from '../types';

export type SortKey = 'rating' | 'views' | 'year' | 'title';

const CatalogPage: React.FC = () => {
    const { mangaList, loading } = useContext(MangaContext);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        genres: [] as string[],
        year: 'all',
    });
    const [sortKey, setSortKey] = useState<SortKey>('rating');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const filteredAndSortedManga = useMemo(() => {
        let result = [...mangaList];

        // Filtering
        result = result.filter(manga => {
            if (filters.type !== 'all' && manga.type !== filters.type) return false;
            if (filters.status !== 'all' && manga.status !== filters.status) return false;
            if (filters.year !== 'all' && manga.year.toString() !== filters.year) return false;
            if (filters.genres.length > 0 && !filters.genres.every(g => manga.genres.includes(g))) return false;
            return true;
        });

        // Sorting
        result.sort((a, b) => {
            switch (sortKey) {
                case 'rating': return b.rating - a.rating;
                case 'views': return parseFloat(b.views) - parseFloat(a.views);
                case 'year': return b.year - a.year;
                case 'title': return a.title.localeCompare(b.title);
                default: return 0;
            }
        });

        return result;
    }, [mangaList, filters, sortKey]);

    const allGenres = useMemo(() => {
        const genres = new Set<string>();
        mangaList.forEach(manga => manga.genres.forEach(g => genres.add(g)));
        return Array.from(genres).sort();
    }, [mangaList]);
    
    const allYears = useMemo(() => {
        const years = new Set<number>();
        mangaList.forEach(m => years.add(m.year));
        return Array.from(years).sort((a, b) => b - a).map(String);
    }, [mangaList]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="flex gap-8">
            <FilterSidebar 
                allGenres={allGenres}
                allYears={allYears}
                filters={filters}
                setFilters={setFilters}
                sortKey={sortKey}
                setSortKey={setSortKey}
                resultsCount={filteredAndSortedManga.length}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Каталог</h1>
                     <button 
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden bg-surface p-2 rounded-md"
                    >
                        Фильтры
                    </button>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                        {Array.from({ length: 10 }).map((_, i) => <MangaCardSkeleton key={i} />)}
                    </div>
                ) : (
                    filteredAndSortedManga.length > 0 ? (
                        <motion.div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredAndSortedManga.map(manga => (
                                 <motion.div key={manga.id} variants={itemVariants}>
                                    <MangaCard manga={manga} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-bold text-text-primary">Ничего не найдено</h2>
                            <p className="text-muted mt-2">Попробуйте изменить или сбросить фильтры.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default CatalogPage;
