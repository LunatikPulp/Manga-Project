import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SortKey } from '../pages/CatalogPage';

interface FilterSidebarProps {
    allGenres: string[];
    allYears: string[];
    filters: any;
    setFilters: (filters: any) => void;
    sortKey: SortKey;
    setSortKey: (key: SortKey) => void;
    resultsCount: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-4 border-b border-surface">
        <h3 className="font-semibold text-text-primary px-4">{title}</h3>
        <div className="mt-2">{children}</div>
    </div>
);

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
    allGenres, 
    allYears,
    filters, 
    setFilters,
    sortKey,
    setSortKey,
    resultsCount,
    isOpen,
    setIsOpen,
}) => {

    const handleGenreChange = (genre: string) => {
        const newGenres = filters.genres.includes(genre)
            ? filters.genres.filter((g: string) => g !== genre)
            : [...filters.genres, genre];
        setFilters({ ...filters, genres: newGenres });
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
    };
    
    const resetFilters = () => {
        setFilters({ type: 'all', status: 'all', genres: [], year: 'all' });
        setSortKey('rating');
    };

    const sidebarContent = (
         <div className="flex flex-col h-full">
            <div className="p-4 border-b border-surface flex justify-between items-center">
                <h2 className="text-xl font-bold">Фильтры</h2>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-muted hover:text-text-primary"
                >&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <FilterSection title="Сортировка">
                    <div className="px-4 py-2">
                         <select 
                            value={sortKey} 
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                            className="w-full bg-base border border-overlay rounded-md p-2 text-sm"
                        >
                            <option value="rating">По рейтингу</option>
                            <option value="views">По популярности</option>
                            <option value="year">По новизне</option>
                            <option value="title">По названию</option>
                        </select>
                    </div>
                </FilterSection>

                <FilterSection title="Тип">
                    {['all', 'Manhwa', 'Manga', 'Manhua'].map(type => (
                        <button key={type} onClick={() => handleFilterChange('type', type)} className={`w-full text-left px-4 py-1.5 text-sm rounded ${filters.type === type ? 'bg-brand/20 text-brand' : 'hover:bg-overlay text-text-secondary'}`}>{type === 'all' ? 'Все' : type}</button>
                    ))}
                </FilterSection>
                
                 <FilterSection title="Статус">
                    {['all', 'В процессе', 'Завершено'].map(status => (
                        <button key={status} onClick={() => handleFilterChange('status', status)} className={`w-full text-left px-4 py-1.5 text-sm rounded ${filters.status === status ? 'bg-brand/20 text-brand' : 'hover:bg-overlay text-text-secondary'}`}>{status === 'all' ? 'Все' : status}</button>
                    ))}
                </FilterSection>

                 <FilterSection title="Год">
                    <div className="px-4 py-2">
                        <select
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            className="w-full bg-base border border-overlay rounded-md p-2 text-sm"
                        >
                            <option value="all">Все года</option>
                            {allYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </FilterSection>

                <FilterSection title="Жанры">
                    <div className="max-h-60 overflow-y-auto px-4 space-y-1">
                        {allGenres.map(genre => (
                             <label key={genre} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-overlay">
                                <input 
                                    type="checkbox"
                                    checked={filters.genres.includes(genre)}
                                    onChange={() => handleGenreChange(genre)}
                                    className="h-4 w-4 rounded bg-base border-muted text-brand focus:ring-brand"
                                />
                                <span className="text-sm text-text-secondary">{genre}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            </div>

            <div className="p-4 border-t border-surface mt-auto">
                 <button 
                    onClick={resetFilters}
                    className="w-full text-center bg-surface hover:bg-overlay text-text-primary font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                   Сбросить ({resultsCount} найдено)
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0 bg-surface rounded-lg sticky top-20 self-start">
                {sidebarContent}
            </aside>
            
            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-[998] lg:hidden"
                    >
                         <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-72 bg-surface h-full"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FilterSidebar;