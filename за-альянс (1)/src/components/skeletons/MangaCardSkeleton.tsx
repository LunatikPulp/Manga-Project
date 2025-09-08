import React from 'react';

const MangaCardSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <div className="relative aspect-[2/3] w-full rounded-md bg-surface"></div>
            <div className="mt-2 space-y-2">
                <div className="h-4 bg-surface rounded w-1/2"></div>
                <div className="h-5 bg-surface rounded w-full"></div>
            </div>
        </div>
    );
};

export default MangaCardSkeleton;