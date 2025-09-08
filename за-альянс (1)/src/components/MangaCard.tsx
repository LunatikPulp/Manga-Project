
import React from 'react';
import { Link } from 'react-router-dom';
import { Manga } from '../../types';
import StarIcon from './icons/StarIcon';

interface MangaCardProps {
    manga: Manga;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga }) => {
    return (
        <Link to={`/manga/${manga.id}`} className="block group">
            <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-surface">
                <img 
                    src={manga.cover} 
                    alt={manga.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                    <StarIcon className="w-3 h-3 text-yellow-400" />
                    <span>{manga.rating.toFixed(1)}</span>
                </div>
            </div>
            <div className="mt-2">
                <p className="text-sm text-text-secondary">{manga.type} {manga.year}</p>
                <h3 className="text-md font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                    {manga.title}
                </h3>
            </div>
        </Link>
    );
};

export default MangaCard;