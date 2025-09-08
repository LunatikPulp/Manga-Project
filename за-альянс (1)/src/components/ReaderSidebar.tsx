import React from 'react';
import ListIcon from './icons/ListIcon';
import CommentIcon from './icons/CommentIcon';
import SettingsIcon from './icons/SettingsIcon';
import ReportIcon from './icons/ReportIcon';
import HeartIcon from './icons/HeartIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';

interface ReaderSidebarProps {
    onChapterListClick: () => void;
    onCommentsClick: () => void;
    onSettingsClick: () => void;
    onReportClick: () => void;
    onLikeClick: () => void;
    isLiked: boolean;
    onAutoScrollToggle: () => void;
    isAutoScrolling: boolean;
    currentPage: number;
    totalPages: number;
}

const SidebarButton: React.FC<{ onClick: () => void; 'aria-label': string; children: React.ReactNode }> = ({ onClick, children, ...props }) => (
    <button onClick={onClick} className="p-3 bg-surface rounded-lg text-muted hover:bg-overlay hover:text-brand transition-colors" {...props}>
        {children}
    </button>
);

const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
    onChapterListClick,
    onCommentsClick,
    onSettingsClick,
    onReportClick,
    onLikeClick,
    isLiked,
    onAutoScrollToggle,
    isAutoScrolling,
    currentPage,
    totalPages,
}) => {
    return (
        <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col items-center gap-3 bg-base/80 backdrop-blur-md p-2 rounded-xl border border-surface">
            <div className="text-center font-mono text-sm bg-surface px-2 py-1 rounded-md">
                <span className="text-text-primary">{currentPage}</span>
                <span className="text-muted">/</span>
                <span className="text-muted">{totalPages}</span>
            </div>

            <div className="w-8 h-px bg-surface"></div>
            
            <SidebarButton onClick={onChapterListClick} aria-label="Список глав">
                <ListIcon className="w-6 h-6" />
            </SidebarButton>

            <SidebarButton onClick={onCommentsClick} aria-label="Комментарии">
                <CommentIcon className="w-6 h-6" />
            </SidebarButton>

            <SidebarButton onClick={onLikeClick} aria-label="Поблагодарить">
                <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-brand-accent' : ''}`} isFilled={isLiked} />
            </SidebarButton>

            <div className="w-8 h-px bg-surface"></div>

            <SidebarButton onClick={onAutoScrollToggle} aria-label={isAutoScrolling ? "Остановить прокрутку" : "Начать прокрутку"}>
                {isAutoScrolling ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </SidebarButton>

            <SidebarButton onClick={onSettingsClick} aria-label="Настройки">
                <SettingsIcon className="w-6 h-6" />
            </SidebarButton>
            
            <SidebarButton onClick={onReportClick} aria-label="Пожаловаться">
                <ReportIcon className="w-6 h-6" />
            </SidebarButton>

        </div>
    );
};

export default ReaderSidebar;