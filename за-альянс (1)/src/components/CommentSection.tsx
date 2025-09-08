import React, { useState, useContext, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Comment } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import { ToasterContext } from '../contexts/ToasterContext';
import Avatar from './Avatar';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CommentSectionProps {
  mangaId: string;
  chapterId?: string;
  initialComments?: Comment[];
}

const CommentView: React.FC<{ 
    comment: Comment; 
    onReply: (commentId: number, text: string) => void;
    onDelete: (commentId: number) => void;
    onLike: (commentId: number) => void;
}> = ({ comment, onReply, onDelete, onLike }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const { user } = useContext(AuthContext);

    const handleReplySubmit = () => {
        if (replyText.trim() && user) {
            onReply(comment.id, replyText);
            setReplyText('');
            setShowReply(false);
        }
    }
    
    const isLiked = user ? comment.likedBy.includes(user.email) : false;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-4"
        >
            <div className="flex-shrink-0 mt-1">
                <Avatar name={comment.user.avatar} size={32} />
            </div>
            <div className="flex-1">
                <div className="bg-surface p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">{comment.user.name}</span>
                        <span className="text-xs text-muted">{comment.timestamp}</span>
                    </div>
                    <p className="text-text-secondary mt-2 text-sm">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                        <button onClick={() => setShowReply(!showReply)} className="hover:text-brand">Ответить</button>
                        <span>·</span>
                        <button onClick={() => onLike(comment.id)} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-brand-accent' : 'hover:text-brand'}`}>
                            <span>❤️</span> {comment.likedBy.length}
                        </button>
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <>
                                <span>·</span>
                                <button onClick={() => onDelete(comment.id)} className="hover:text-brand-accent">Удалить</button>
                            </>
                        )}
                    </div>
                </div>
                 {showReply && user && (
                    <div className="mt-3 flex items-start gap-2">
                        <div className="flex-shrink-0 mt-1">
                            <Avatar name={user.avatar} size={28} />
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Ответ ${comment.user.name}...`}
                                className="w-full bg-base border border-surface rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-1">
                                <button onClick={() => setShowReply(false)} className="text-xs text-muted hover:text-text-primary">Отмена</button>
                                <button onClick={handleReplySubmit} className="bg-brand text-white font-semibold px-3 py-1 rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50" disabled={!replyText.trim()}>Отправить</button>
                            </div>
                        </div>
                    </div>
                )}

                 <div className="mt-4 pl-6 border-l-2 border-surface/50 space-y-4">
                    {comment.replies?.map(reply => (
                        <CommentView key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} onLike={onLike}/>
                    ))}
                 </div>
            </div>
        </motion.div>
    );
};


const CommentSection: React.FC<CommentSectionProps> = ({ mangaId, chapterId, initialComments }) => {
  const storageKey = `comments_${chapterId || mangaId}`;
  const [comments, setComments] = useLocalStorage<Comment[]>(storageKey, initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const { user } = useContext(AuthContext);
  const { showToaster } = useContext(ToasterContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
        if (!user) showToaster("Пожалуйста, войдите, чтобы оставить комментарий");
        return;
    };

    const addedComment: Comment = {
      id: Date.now(),
      userId: user.email,
      user: {
        name: user.username,
        avatar: user.avatar,
      },
      text: newComment,
      timestamp: 'Только что',
      likedBy: [],
      replies: [],
    };
    setComments(prev => [addedComment, ...prev]);
    setNewComment('');
    showToaster('Комментарий добавлен!');
  };
  
  const handleReply = (commentId: number, text: string) => {
    if (!user) return;
    const newReply: Comment = {
        id: Date.now(),
        userId: user.email,
        user: { name: user.username, avatar: user.avatar },
        text: text,
        timestamp: 'Только что',
        likedBy: [],
        replies: []
    };
    
    const addReplyToComment = (commentsList: Comment[]): Comment[] => {
        return commentsList.map(comment => {
            if (comment.id === commentId) {
                return { ...comment, replies: [newReply, ...(comment.replies || [])] };
            }
            if (comment.replies) {
                return { ...comment, replies: addReplyToComment(comment.replies) };
            }
            return comment;
        });
    }
    
    setComments(addReplyToComment);
  };

  const handleDelete = (commentId: number) => {
    const removeRecursively = (list: Comment[]): Comment[] => {
        return list
            .filter(c => c.id !== commentId)
            .map(c => ({
                ...c,
                replies: c.replies ? removeRecursively(c.replies) : [],
            }));
    };
    setComments(removeRecursively);
    showToaster('Комментарий удален.');
  }

  const handleLike = (commentId: number) => {
      if (!user) {
          showToaster("Пожалуйста, войдите, чтобы поставить лайк");
          return;
      }
      
      const likeRecursively = (list: Comment[]): Comment[] => {
          return list.map(c => {
              if (c.id === commentId) {
                  const isLiked = c.likedBy.includes(user.email);
                  const newLikedBy = isLiked
                      ? c.likedBy.filter(email => email !== user.email)
                      : [...c.likedBy, user.email];
                  return { ...c, likedBy: newLikedBy };
              }
              return { ...c, replies: c.replies ? likeRecursively(c.replies) : [] };
          });
      };
      setComments(likeRecursively);
  };

  const sortedComments = useMemo(() => {
      const commentsCopy = [...comments];
      if (sortBy === 'popular') {
          return commentsCopy.sort((a, b) => b.likedBy.length - a.likedBy.length);
      }
      return commentsCopy; // 'newest' is default order (prepended)
  }, [comments, sortBy]);

  return (
    <div className="space-y-6">
        {user && (
            <form onSubmit={handleSubmit} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <Avatar name={user.avatar} size={40} />
                </div>
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Оставить комментарий..."
                        className="w-full bg-base border border-surface rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        rows={3}
                    />
                    <div className="flex justify-end mt-2">
                        <button type="submit" className="bg-brand text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50" disabled={!newComment.trim()}>
                            Отправить
                        </button>
                    </div>
                </div>
            </form>
        )}
      
      <div className="flex items-center gap-4 border-b border-surface pb-4">
          <h3 className="text-lg font-bold">Комментарии ({comments.length})</h3>
          <div className="flex items-center gap-2">
            <SortButton name="popular" currentSort={sortBy} setSort={setSortBy}>Популярные</SortButton>
            <SortButton name="newest" currentSort={sortBy} setSort={setSortBy}>Новые</SortButton>
          </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
            {sortedComments.map((comment) => (
                <CommentView key={comment.id} comment={comment} onReply={handleReply} onDelete={handleDelete} onLike={handleLike}/>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SortButton: React.FC<{name: 'popular' | 'newest', currentSort: string, setSort: (s: 'popular' | 'newest') => void, children: React.ReactNode}> = ({ name, currentSort, setSort, children }) => (
    <button onClick={() => setSort(name)} className={`px-3 py-1 text-xs font-semibold rounded-full ${currentSort === name ? 'bg-brand text-white' : 'bg-surface text-muted hover:bg-overlay'}`}>
        {children}
    </button>
);


export default CommentSection;