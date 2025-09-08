import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chapter } from '../../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface PagedChapterViewProps {
    chapter: Chapter;
    onNextChapter: () => void;
    onPrevChapter: () => void;
    onPageChange: (page: number, total: number) => void;
}

const PagedChapterView: React.FC<PagedChapterViewProps> = ({ chapter, onNextChapter, onPrevChapter, onPageChange }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [imageHeight, setImageHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(window.innerHeight);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const imageUrl = chapter.content && chapter.content.length > 0 ? chapter.content[0] : null;

    const calculatePages = useCallback(() => {
        if (imageRef.current && imageRef.current.naturalHeight > 0 && containerRef.current) {
            const imgHeight = imageRef.current.naturalHeight;
            const contHeight = containerRef.current.clientHeight;
            setImageHeight(imgHeight);
            setContainerHeight(contHeight);
            setTotalPages(Math.ceil(imgHeight / contHeight));
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        onPageChange(currentPage, totalPages);
    }, [currentPage, totalPages, onPageChange]);

    const handleImageLoad = () => {
        calculatePages();
    };
    
    useEffect(() => {
        const handleResize = () => calculatePages();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculatePages]);


    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(p => p + 1);
        } else {
            onNextChapter();
        }
    }, [currentPage, totalPages, onNextChapter]);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(p => p - 1);
        } else {
            onPrevChapter();
        }
    }, [currentPage, onPrevChapter]);
    
     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                goToNextPage();
            } else if (e.key === 'ArrowLeft') {
                goToPrevPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextPage, goToPrevPage]);

    if (!imageUrl) {
        return <div className="text-center p-8">В этой главе нет страниц.</div>;
    }

    const yOffset = (currentPage - 1) * containerHeight;

    return (
        <div ref={containerRef} className="relative w-full h-[calc(100vh-8rem)] overflow-hidden select-none cursor-pointer">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                </div>
            )}
            <div 
                className="absolute inset-0 flex"
                style={{ visibility: isLoading ? 'hidden' : 'visible' }}
            >
                <div className="w-1/3 h-full" onClick={goToPrevPage} />
                <div className="w-1/3 h-full" />
                <div className="w-1/3 h-full" onClick={goToNextPage} />
            </div>

            <img
                ref={imageRef}
                src={imageUrl}
                alt={`Страница главы ${chapter.chapterNumber}`}
                onLoad={handleImageLoad}
                className="absolute top-0 left-1/2 -translate-x-1/2 max-w-none w-auto h-auto transition-transform duration-200 ease-in-out"
                style={{
                    transform: `translate3d(-50%, -${yOffset}px, 0)`,
                    visibility: isLoading ? 'hidden' : 'visible'
                }}
            />

            {!isLoading && (
                 <>
                    <button onClick={goToPrevPage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/60 transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button onClick={goToNextPage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/60 transition-colors">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full font-mono">
                        {currentPage} / {totalPages}
                    </div>
                </>
            )}
        </div>
    );
};

export default PagedChapterView;