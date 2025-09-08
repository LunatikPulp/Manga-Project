
import React, { useRef, ReactNode } from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';

interface CarouselProps {
    title: string;
    children: ReactNode;
    viewAllLink?: string;
}

const Carousel: React.FC<CarouselProps> = ({ title, children, viewAllLink }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.offsetWidth * 0.8;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                {viewAllLink && (
                    <a href={viewAllLink} className="text-sm text-muted hover:text-brand transition-colors flex items-center gap-1">
                        <span>Смотреть все</span>
                        <ArrowUpRightIcon className="w-4 h-4" />
                    </a>
                )}
            </div>
            <div className="relative group">
                <button 
                    onClick={() => scroll('left')}
                    className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 p-2 bg-surface rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-overlay"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                </button>
                <div 
                    ref={scrollRef} 
                    className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
                    // FIX: CSS properties in React's style object must be camelCased. Converted '-ms-overflow-style' to 'msOverflowStyle'.
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {children}
                </div>
                <button 
                    onClick={() => scroll('right')}
                    className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 p-2 bg-surface rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-overlay"
                >
                    <ChevronRightIcon className="w-6 h-6 text-text-primary" />
                </button>
            </div>
        </div>
    );
};

export default Carousel;