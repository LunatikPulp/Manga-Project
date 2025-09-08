import React, { useContext, useState, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useHistory } from '../hooks/useHistory';
import { MangaContext } from '../contexts/MangaContext';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import MangaCard from '../components/MangaCard';
import Modal from '../components/Modal';
import { ToasterContext } from '../contexts/ToasterContext';
import ProfilePageSkeleton from '../components/skeletons/ProfilePageSkeleton';
import { BookmarkStatus } from '../../types';

const ProfilePage: React.FC = () => {
    const { user, updateUser, deleteAccount, loading: authLoading } = useContext(AuthContext);
    const { bookmarks } = useBookmarks();
    const { history } = useHistory();
    const { mangaList, getMangaById, loading: mangaLoading } = useContext(MangaContext);
    const { showToaster } = useContext(ToasterContext);
    const navigate = useNavigate();

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [newUsername, setNewUsername] = useState(user?.username || '');

    const totalChaptersRead = history.length;
    
    const bookmarkStats = useMemo(() => bookmarks.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
    }, {} as Record<BookmarkStatus, number>), [bookmarks]);

    const favoriteGenres = useMemo(() => {
        const genreCounts = bookmarks.reduce((acc, b) => {
            const manga = getMangaById(b.mangaId);
            if (manga) {
                manga.genres.forEach(genre => {
                    acc[genre] = (acc[genre] || 0) + 1;
                });
            }
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
    }, [bookmarks, getMangaById]);

    if (authLoading || mangaLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!user) {
        return <div className="text-center p-8">Пользователь не найден.</div>;
    }

    const handleProfileUpdate = () => {
        if (newUsername.trim()) {
            updateUser({ username: newUsername });
            setEditModalOpen(false);
            showToaster('Профиль обновлен!');
        }
    };

    const handleAccountDelete = () => {
        deleteAccount();
        setDeleteModalOpen(false);
        showToaster('Аккаунт удален.');
        navigate('/');
    };

    const recentHistory = history.slice(0, 4).map(h => {
        const manga = getMangaById(h.mangaId);
        return { ...h, manga };
    }).filter(item => item.manga);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-surface p-8 rounded-lg flex flex-col md:flex-row items-center gap-6 mb-8">
                <Avatar name={user.avatar} size={96} />
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-text-primary">{user.username}</h1>
                    <p className="text-muted">{user.email}</p>
                     <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                        <button onClick={() => setEditModalOpen(true)} className="text-sm bg-overlay px-3 py-1 rounded-md text-text-secondary hover:text-text-primary transition-colors">
                            Редактировать
                        </button>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="text-sm bg-brand px-3 py-1 rounded-md text-white hover:bg-blue-600 transition-colors">
                                Панель Администратора
                            </Link>
                        )}
                        {user.role === 'moderator' && (
                            <Link to="/moderator" className="text-sm bg-brand px-3 py-1 rounded-md text-white hover:bg-blue-600 transition-colors">
                                Панель Модератора
                            </Link>
                        )}
                         <button onClick={() => setDeleteModalOpen(true)} className="text-sm bg-red-900/50 px-3 py-1 rounded-md text-brand-accent hover:bg-red-900/80 transition-colors">
                            Удалить аккаунт
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Прочитано глав" value={totalChaptersRead} />
                <StatCard title="Всего в закладках" value={bookmarks.length} />
                <StatCard title="Любимые жанры" value={favoriteGenres.join(', ') || 'Нет данных'} />
            </div>

            <div className="bg-surface p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Статистика закладок</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(bookmarkStats).map(([status, count]) => (
                        <div key={status} className="bg-overlay p-3 rounded-lg flex-1 min-w-[120px]">
                            <p className="text-sm text-muted">{status}</p>
                            <p className="text-2xl font-bold">{count}</p>
                        </div>
                    ))}
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-bold mb-4">Недавняя активность</h2>
                {recentHistory.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentHistory.map(item => (
                            <Link to={`/manga/${item.manga!.id}`} key={item.readAt} className="flex items-center gap-4 p-3 bg-surface rounded-lg hover:bg-overlay transition-colors">
                                <img src={item.manga!.cover} alt={item.manga!.title} className="w-12 h-16 object-cover rounded-md" />
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-semibold text-text-primary text-sm truncate">{item.manga!.title}</h4>
                                    <p className="text-xs text-text-secondary mt-0.5">Прочитана Глава {item.chapterId}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted p-4 bg-surface rounded-lg">Нет недавней активности.</p>
                )}
            </section>
            
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Редактировать профиль"
                onConfirm={handleProfileUpdate}
                confirmText="Сохранить"
            >
                <div>
                    <label className="text-sm text-muted block mb-1.5">Имя пользователя</label>
                    <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-base border border-overlay rounded-md p-2"
                    />
                </div>
            </Modal>

             <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Удалить аккаунт"
                onConfirm={handleAccountDelete}
                confirmText="Да, удалить"
            >
                <p className="text-text-secondary">Вы уверены? Все ваши данные, включая историю и закладки, будут удалены. Это действие нельзя будет отменить.</p>
            </Modal>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-surface p-4 rounded-lg">
        <h4 className="text-sm text-muted font-medium">{title}</h4>
        <p className="text-2xl font-bold text-text-primary mt-1 truncate">{value}</p>
    </div>
);


export default ProfilePage;