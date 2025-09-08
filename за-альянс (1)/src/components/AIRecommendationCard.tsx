import React from 'react';
import { Link } from 'react-router-dom';
import { AIRecommendation } from '../../types';
import StarIcon from './icons/StarIcon';

interface AIRecommendationCardProps {
    recommendation: AIRecommendation;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ recommendation }) => {
    const { manga, reason } = recommendation;

    if (!manga) {
        return null;
    }

    return (
        <Link to={`/manga/${manga.id}`} className="block group w-full">
            <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-surface">
                <img 
                    src={manga.cover} 
                    alt={manga.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                     <p className="text-xs italic text-gray-300 bg-black/30 backdrop-blur-sm p-2 rounded-md mb-2 line-clamp-3">"{reason}"</p>
                    <h3 className="text-md font-bold truncate">
                        {manga.title}
                    </h3>
                </div>
                 <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                    <StarIcon className="w-3 h-3 text-yellow-400" />
                    <span>{manga.rating.toFixed(1)}</span>
                </div>
            </div>
        </Link>
    );
};

export default AIRecommendationCard;
