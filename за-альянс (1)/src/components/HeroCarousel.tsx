import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Manga } from '../../types';
import StarIcon from './icons/StarIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface HeroCarouselProps {
    featuredManga: Manga[];
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
};

const HeroCarousel: React.FC<HeroCarouselProps> = ({ featuredManga }) => {
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        setPage([(page + newDirection + featuredManga.length) % featuredManga.length, newDirection]);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            paginate(1);
        }, 5000);
        return () => clearInterval(interval);
    }, [page]);

    if (!featuredManga || featuredManga.length === 0) {
        return null;
    }

    const currentManga = featuredManga[page];

    return (
        <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden flex items-center justify-center mb-8">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={page}
                    className="absolute w-full h-full"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                >
                    <img
                        src={currentManga.cover}
                        alt={currentManga.title}
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-brightness-75"></div>

                    <div className="relative h-full container mx-auto px-8 md:px-16 flex items-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <motion.img
                                src={currentManga.cover}
                                alt={currentManga.title}
                                className="w-48 aspect-[2/3] rounded-lg shadow-2xl hidden md:block"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                            />
                            <div className="md:col-span-2 text-white">
                                <motion.h1
                                    className="text-3xl md:text-5xl font-black uppercase tracking-wide text-shadow"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {currentManga.title}
                                </motion.h1>
                                <motion.div
                                    className="flex items-center gap-4 mt-3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="flex items-center gap-1 text-yellow-300">
                                        <StarIcon className="w-5 h-5" />
                                        <span className="font-bold text-lg">{currentManga.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-gray-300">{currentManga.year}</span>
                                    <span className="text-gray-300">{currentManga.status}</span>
                                </motion.div>
                                <motion.p
                                    className="mt-4 text-gray-200 leading-relaxed max-w-2xl line-clamp-3 text-shadow-sm"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {currentManga.description}
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Link
                                        to={`/manga/${currentManga.id}`}
                                        className="mt-6 inline-block bg-brand hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105"
                                    >
                                        Читать
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

             <button
                onClick={() => paginate(-1)}
                className="absolute top-1/2 -translate-y-1/2 left-4 z-10 p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors"
            >
                <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button
                onClick={() => paginate(1)}
                className="absolute top-1/2 -translate-y-1/2 right-4 z-10 p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors"
            >
                <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
                {featuredManga.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage([i, i > page ? 1 : -1])}
                        className={`w-2 h-2 rounded-full transition-colors ${
                            i === page ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Перейти к слайду ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;