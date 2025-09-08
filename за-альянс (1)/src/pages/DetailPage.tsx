import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Manga, Chapter, CharacterInfo } from '../types';
import MangaCard from '../components/MangaCard';
import { generateMangaSummary, isGeminiAvailable, generateAIRecommendations, generateCharacterInfo, isGeminiThrottled } from '../services/geminiService';
import ReportIcon from '../components/icons/ReportIcon';
import { useHistory } from '../hooks/useHistory';
import CommentSection from '../components/CommentSection';
import Modal from '../components/Modal';
import { MangaContext } from '../contexts/MangaContext';
import { AuthContext } from '../contexts/AuthContext';
import StarRating from '../components/StarRating';
import { ToasterContext } from '../contexts/ToasterContext';
import BookmarkButton from '../components/BookmarkButton';
import { useReports } from '../hooks/useReports';
import { demoComments } from '../data/mockData';
import SubscribeButton from '../components/SubscribeButton';

interface DetailPageProps {
    manga: Manga;
}

const AIRecommendations: React.FC<{ manga: Manga }> = ({ manga }) => {
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (isGeminiAvailable()) {
                const cacheKey = `gemini-recs-${manga.id}`;
                try {
                    const cachedData = sessionStorage.getItem(cacheKey);
                    if (cachedData) {
                        setRecommendations(JSON.parse(cachedData));
                        return;
                    }
                } catch (e) {
                    console.warn("Corrupted recommendations cache, fetching again.", e);
                    sessionStorage.removeItem(cacheKey);
                }

                setLoading(true);
                const recs = await generateAIRecommendations(manga);
                if (recs.length > 0) {
                    setRecommendations(recs);
                    sessionStorage.setItem(cacheKey, JSON.stringify(recs));
                }
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [manga]);

    if (!isGeminiAvailable() || (!loading && recommendations.length === 0)) {
        return null;
    }

    return (
        <div className="mt-6 bg-surface/50 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-purple-300">✨ AI Рекомендации</h3>
            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-overlay rounded w-3/4"></div>
                    <div className="h-4 bg-overlay rounded w-1/2"></div>
                    <div className="h-4 bg-overlay rounded w-2/3"></div>
                </div>
            ) : (
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                    {recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const DetailPage: React.FC<DetailPageProps> = ({ manga }) => {
    const [activeTab, setActiveTab] = useState('chapters');
    const [aiSummary, setAiSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [characters, setCharacters] = useState<CharacterInfo[]>([]);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const { mangaList, rateManga } = useContext(MangaContext);
    const { history } = useHistory();
    const { showToaster } = useContext(ToasterContext);
    const { addReport } = useReports();

    useEffect(() => {
        // Periodically check the throttle status to re-enable buttons
        const interval = setInterval(() => {
            setIsThrottled(isGeminiThrottled());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchCharacters = async () => {
            if (isGeminiAvailable()) {
                const cacheKey = `gemini-chars-${manga.id}`;
                try {
                    const cachedData = sessionStorage.getItem(cacheKey);
                    if (cachedData) {
                        setCharacters(JSON.parse(cachedData));
                        return;
                    }
                } catch (e) {
                    console.warn("Corrupted characters cache, fetching again.", e);
                    sessionStorage.removeItem(cacheKey);
                }
                
                setIsLoadingCharacters(true);
                const chars = await generateCharacterInfo(manga);
                if (chars.length > 0) {
                    setCharacters(chars);
                    sessionStorage.setItem(cacheKey, JSON.stringify(chars));
                }
                setIsLoadingCharacters(false);
            }
        };

        if (activeTab === 'characters' && characters.length === 0) {
            fetchCharacters();
        }
    }, [activeTab, manga, characters.length]);

    const handleGenerateSummary = async () => {
        if (isGeminiThrottled()) {
            showToaster("AI-функции временно недоступны. Попробуйте позже.");
            setIsThrottled(true);
            return;
        }

        const cacheKey = `gemini-summary-${manga.id}`;
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                setAiSummary(cachedData);
                return;
            }
        } catch (e) {
            console.warn("Could not read summary from cache", e);
            sessionStorage.removeItem(cacheKey);
        }

        setIsLoadingSummary(true);
        const summary = await generateMangaSummary(manga.title, manga.description);
        setAiSummary(summary);
        sessionStorage.setItem(cacheKey, summary);
        setIsLoadingSummary(false);
        setIsThrottled(isGeminiThrottled()); // Update throttle state after call
    };
    
    const handleReport = () => {
        if (!user) {
            showToaster("Пожалуйста, войдите, чтобы отправить жалобу.");
            return;
        }
        addReport({ mangaId: manga.id, mangaTitle: manga.title });
        setReportModalOpen(false);
        showToaster("Жалоба отправлена. Спасибо!");
    }
    
    const handleRating = (rating: number) => {
        if (!user) {
            showToaster("Пожалуйста, войдите, чтобы оценить.");
            return;
        }
        rateManga(manga.id, user.email, rating);
        showToaster(`Вы оценили "${manga.title}" на ${rating} звезд!`);
    }

    const { lastReadChapterId, readChapterIds, continueChapterId } = useMemo(() => {
        const mangaHistory = history.filter(h => h.mangaId === manga.id);
        const readChapterIds = new Set(mangaHistory.map(h => h.chapterId));
        const lastReadItem = mangaHistory.sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())[0];

        const sortedChaptersAsc = [...manga.chapters].sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));

        let continueChapterId = sortedChaptersAsc[0]?.id || ''; 
        if (lastReadItem) {
            const lastReadIndex = sortedChaptersAsc.findIndex(c => c.id === lastReadItem.chapterId);
            if (lastReadIndex > -1 && lastReadIndex < sortedChaptersAsc.length - 1) {
                continueChapterId = sortedChaptersAsc[lastReadIndex + 1].id;
            } else {
                continueChapterId = lastReadItem.chapterId;
            }
        }

        return {
            lastReadChapterId: lastReadItem?.chapterId,
            readChapterIds,
            continueChapterId,
        };
    }, [history, manga.id, manga.chapters]);

    const similarManga = useMemo(() => {
        if (!mangaList || mangaList.length === 0) return [];
        return mangaList
            .filter(m => m.id !== manga.id)
            .map(m => {
                const commonGenres = m.genres.filter(g => manga.genres.includes(g));
                return { manga: m, score: commonGenres.length };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.manga);
    }, [manga, mangaList]);
    
    const userRating = user ? manga.userRatings[user.email] : undefined;
    const sortedChapters = useMemo(() => [...manga.chapters].sort((a, b) => parseFloat(b.chapterNumber) - parseFloat(a.chapterNumber)), [manga.chapters]);

    const CharacterTabContent: React.FC = () => {
        if (!isGeminiAvailable()) return null;

        if (isLoadingCharacters) {
            return (
                 <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                             <div className="w-12 h-12 rounded-full bg-overlay"></div>
                             <div className="flex-1 space-y-2 pt-2">
                                 <div className="h-4 w-1/3 bg-overlay rounded"></div>
                                 <div className="h-3 w-full bg-overlay rounded"></div>
                             </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (characters.length === 0) {
            return <p className="text-muted text-center py-4">Не удалось загрузить информацию о персонажах.</p>;
        }

        return (
            <div className="space-y-4">
                {characters.map((char, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-surface rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-overlay flex-shrink-0 flex items-center justify-center font-bold text-muted text-lg">
                            {char.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-text-primary">{char.name}</h4>
                            <p className="text-sm text-text-secondary mt-1">{char.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="text-text-primary">
            <div className="relative h-64 md:h-80 rounded-lg overflow-hidden -mt-6 -mx-4 md:-mx-8">
                 <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover blur-lg scale-125" />
                 <div className="absolute inset-0 bg-gradient-to-t from-base via-base/80 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 -mt-48 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Left Column */}
                    <div className="md:col-span-1">
                        <img src={manga.cover} alt={manga.title} className="w-full aspect-[2/3] rounded-lg shadow-2xl" />
                        <div className="mt-4 space-y-2">
                             <button onClick={() => navigate(`/manga/${manga.id}/chapter/${continueChapterId}`)} className="w-full bg-brand hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Продолжить
                            </button>
                            <div className="flex gap-2">
                                <BookmarkButton mangaId={manga.id} />
                                <SubscribeButton mangaId={manga.id} />
                            </div>
                        </div>
                         <div className="mt-4 flex flex-col space-y-2 text-sm">
                            {user?.role === 'admin' && (
                                <Link to={`/manga/${manga.id}/edit`} className="w-full text-center bg-surface hover:bg-overlay text-text-primary font-medium py-2 px-4 rounded-lg transition-colors">
                                    Редактировать
                                </Link>
                            )}
                            {user && user.role !== 'admin' && (
                                <Link to={`/manga/${manga.id}/suggest-edit`} className="w-full text-center bg-surface hover:bg-overlay text-text-primary font-medium py-2 px-4 rounded-lg transition-colors">
                                    Предложить правку
                                </Link>
                            )}
                            <button onClick={() => setReportModalOpen(true)} className="w-full bg-surface hover:bg-overlay text-text-primary font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                Пожаловаться
                                <ReportIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="md:col-span-3 pt-32">
                        <div className="bg-surface/50 backdrop-blur-sm p-6 rounded-lg">
                            <h1 className="text-4xl font-bold">{manga.title}</h1>
                            <div className="flex items-center gap-4 mt-2 text-text-secondary">
                                <span>{manga.type}</span>
                                <span>·</span>
                                <span>{manga.year}</span>
                                <span>·</span>
                                <span>{manga.status}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="bg-green-500 text-white font-bold px-3 py-1 rounded text-lg">
                                    {manga.rating.toFixed(1)}
                                </div>
                                <StarRating onRate={handleRating} rating={userRating} />
                                <span className="text-text-secondary text-sm">{manga.views} views</span>
                            </div>
                             <div className="mt-4 flex flex-wrap gap-2">
                                {manga.genres.map(genre => (
                                    <Link 
                                        key={genre} 
                                        to={`/genre/${genre}`} 
                                        className="bg-overlay text-brand text-xs font-bold px-3 py-1.5 rounded-full hover:bg-brand hover:text-white transition-colors"
                                    >
                                        {genre}
                                    </Link>
                                ))}
                            </div>
                            <p className="mt-4 text-text-secondary leading-relaxed">{manga.description}</p>
                            {isGeminiAvailable() && (
                                <div className="mt-4">
                                    <button 
                                        onClick={handleGenerateSummary} 
                                        disabled={isLoadingSummary || isThrottled} 
                                        title={isThrottled ? "AI-функции временно недоступны из-за превышения лимитов. Попробуйте позже." : ""}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                                    >
                                        {isLoadingSummary ? 'Генерация...' : '✨ Сгенерировать AI-саммари'}
                                    </button>
                                    {aiSummary && (
                                        <div className="mt-3 p-3 bg-base rounded-lg border border-surface text-sm">
                                            <p className="font-bold mb-1">AI-саммари:</p>
                                            <p className="text-text-secondary">{aiSummary}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <AIRecommendations manga={manga} />

                        <div className="mt-8">
                            <div className="border-b border-surface flex items-center space-x-4">
                                <TabButton name="chapters" activeTab={activeTab} setActiveTab={setActiveTab}>
                                    Главная ({manga.chapters.length})
                                </TabButton>
                                {isGeminiAvailable() && (
                                    <TabButton name="characters" activeTab={activeTab} setActiveTab={setActiveTab}>
                                        Персонажи
                                    </TabButton>
                                )}
                                <TabButton name="discussion" activeTab={activeTab} setActiveTab={setActiveTab}>
                                    Обсуждение
                                </TabButton>
                            </div>
                            
                            <div className="mt-6">
                                {activeTab === 'chapters' && (
                                    <div className="space-y-2">
                                        {sortedChapters.length > 0 ? sortedChapters.map(chapter => (
                                            <Link 
                                                key={chapter.id} 
                                                to={`/manga/${manga.id}/chapter/${chapter.id}`}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                                                    lastReadChapterId === chapter.id ? 'bg-brand/20' : 'bg-surface hover:bg-overlay'
                                                }`}
                                            >
                                                <div>
                                                    <p className={`font-medium ${readChapterIds.has(chapter.id) ? 'text-muted' : 'text-text-primary'}`}>Глава {chapter.chapterNumber}</p>
                                                    <p className="text-xs text-muted">{chapter.title}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-muted">{chapter.date}</p>
                                                    <p className="text-xs text-subtle">{chapter.views} просмотров</p>
                                                </div>
                                            </Link>
                                        )) : <p className="text-muted text-center py-4">Главы еще не добавлены.</p>}
                                    </div>
                                )}
                                {activeTab === 'characters' && <CharacterTabContent />}
                                {activeTab === 'discussion' && <CommentSection mangaId={manga.id} initialComments={demoComments} />}
                            </div>
                        </div>

                        {similarManga.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-2xl font-bold mb-4">Похожее</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {similarManga.map(m => <MangaCard key={m.id} manga={m} />)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                title="Пожаловаться на контент"
                onConfirm={handleReport}
                confirmText="Отправить жалобу"
            >
                <p className="text-text-secondary">Вы уверены, что хотите пожаловаться на "{manga.title}"? Это действие уведомит модераторов о возможном нарушении.</p>
            </Modal>
        </div>
    );
};

const TabButton: React.FC<{ name: string; activeTab: string; setActiveTab: (name: string) => void; children: React.ReactNode }> = ({ name, activeTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`py-3 px-1 text-md font-medium transition-colors border-b-2 ${
            activeTab === name
                ? 'border-brand text-text-primary'
                : 'border-transparent text-muted hover:text-text-primary'
        }`}
    >
        {children}
    </button>
);

export default DetailPage;