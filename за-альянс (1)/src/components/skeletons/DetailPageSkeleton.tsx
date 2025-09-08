import React from 'react';

const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
        <div className="relative h-64 md:h-80 rounded-lg bg-surface -mt-6 -mx-4 md:-mx-8"></div>
        <div className="container mx-auto px-4 -mt-48 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left Column Skeleton */}
                <div className="md:col-span-1">
                    <div className="w-full aspect-[2/3] rounded-lg bg-overlay shadow-2xl"></div>
                    <div className="mt-4 space-y-2">
                        <div className="h-12 w-full bg-surface rounded-lg"></div>
                        <div className="h-12 w-full bg-surface rounded-lg"></div>
                    </div>
                    <div className="mt-4 space-y-2">
                         <div className="h-9 w-full bg-surface rounded-lg"></div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="md:col-span-3 pt-32">
                    <div className="bg-surface/50 p-6 rounded-lg">
                        <div className="h-10 w-3/4 bg-overlay rounded-md"></div>
                        <div className="h-5 w-1/2 bg-overlay rounded-md mt-4"></div>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="h-8 w-14 bg-overlay rounded"></div>
                            <div className="h-6 w-32 bg-overlay rounded-md"></div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <div className="h-7 w-20 bg-overlay rounded-full"></div>
                            <div className="h-7 w-24 bg-overlay rounded-full"></div>
                            <div className="h-7 w-16 bg-overlay rounded-full"></div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="h-4 bg-overlay rounded-md"></div>
                            <div className="h-4 bg-overlay rounded-md"></div>
                            <div className="h-4 w-5/6 bg-overlay rounded-md"></div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="h-12 w-full border-b border-surface"></div>
                        <div className="mt-6 space-y-2">
                            <div className="h-16 w-full bg-surface rounded-lg"></div>
                            <div className="h-16 w-full bg-surface rounded-lg"></div>
                            <div className="h-16 w-full bg-surface rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DetailPageSkeleton;
