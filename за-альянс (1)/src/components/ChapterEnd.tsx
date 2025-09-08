import React from 'react';
import CommentSection from './CommentSection';

interface ChapterEndProps {
    mangaId: string;
    chapterId: string; // The last loaded chapter ID for context
}

const ChapterEnd: React.FC<ChapterEndProps> = ({ mangaId, chapterId }) => {
    return (
        <div className="py-12 border-t-2 border-dashed border-surface mt-4">
             <div className="max-w-4xl mx-auto">
                 <h2 className="text-xl font-bold mb-4">Комментарии</h2>
                <CommentSection mangaId={mangaId} />
            </div>
        </div>
    );
};

export default ChapterEnd;
