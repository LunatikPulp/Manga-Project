import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import MangaCard from '../components/MangaCard';
import { MangaContext } from '../contexts/MangaContext';
import { useHistory } from '../hooks/useHistory';
import ArrowUpRightIcon from '../components/icons/ArrowUpRightIcon';
import StarIcon from '../components/icons/StarIcon';
import { Manga, AIRecommendation, Chapter } from '../../types';
import HeroCarousel from '../components/HeroCarousel';
import MangaCardSkeleton from '../components/skeletons/MangaCardSkeleton';
import { AuthContext } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { isGeminiAvailable, generatePersonalizedRecommendations } from '../services/geminiService';
import AIRecommendationCard from '../components/AIRecommendationCard';

const ContinueReadingCard: React.FC<{ manga: Manga, chapterId: number }> = ({ manga, chapterId }) => {
    const percentage = manga.chapters.length > 0 ? (chapterId / manga.chapters.length) * 100 : 0;

    return (
        <Link to={`/manga/${manga.id}`} className="block group bg-surface p-3 rounded-lg flex items-center gap-4 hover:bg-overlay transition-colors">
            <img src={manga.cover} alt={manga.title} className="w-12 h-16 object-cover rounded-md" />
            <div className="flex-1 overflow-hidden">
                <h4 className="text-md font-semibold truncate text-text-primary group-hover:text-brand">{manga.title}</h4>
                <p className="text-sm text-text-secondary mt-1">
                    Глава {chapterId} из {manga.chapters.length}
                </p>
                <div className="w-full bg-base rounded-full h-1.5 mt-2">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        </Link>
    );
};

const GridSkeleton: React.FC<{ count: number }> = ({ count }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
        {Array.from({ length: count }).map((_, i) => <MangaCardSkeleton key={i} />)}
    </div>
);

const ForYouCarousel: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { mangaList } = useContext(MangaContext);
    const { bookmarks } = useBookmarks();
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (user && bookmarks.length > 0 && isGeminiAvailable()) {
                const cacheKey = `gemini-foryou-recs-${user.email}`;
                
                try {
                    const cachedRecs = sessionStorage.getItem(cacheKey);
                    if (cachedRecs) {
                        setRecommendations(JSON.parse(cachedRecs));
                        return;
                    }
                } catch (e) {
                    console.warn("Corrupted recommendations cache, fetching again.", e);
                    sessionStorage.removeItem(cacheKey);
                }

                setLoadingRecs(true);
                const bookmarkedManga = bookmarks
                    .slice(0, 3)
                    .map(b => mangaList.find(m => m.id === b.mangaId))
                    .filter((m): m is Manga => !!m);
                
                if (bookmarkedManga.length > 0) {
                    const recs = await generatePersonalizedRecommendations(bookmarkedManga);
                    const matchedRecs = recs.map(rec => {
                        const foundManga = mangaList.find(m => m.title.toLowerCase() === rec.title.toLowerCase());
                        return { ...rec, manga: foundManga };
                    }).filter(rec => rec.manga);
                    
                    if (matchedRecs.length > 0) {
                        setRecommendations(matchedRecs);
                        sessionStorage.setItem(cacheKey, JSON.stringify(matchedRecs));
                    }
                }
                setLoadingRecs(false);
            }
        };

        if (mangaList.length > 0) {
             fetchRecommendations();
        }
    }, [user, bookmarks, mangaList]);
    
    if (!user || (!loadingRecs && recommendations.length === 0)) {
        return null;
    }

    if (loadingRecs) {
        return (
             <Carousel title="✨ Для вас">
                 {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-40 md:w-48">
                        <MangaCardSkeleton />
                    </div>
                ))}
             </Carousel>
        )
    }

    return (
        <Carousel title="✨ Для вас">
            {recommendations.map((rec) => (
                <div key={rec.manga!.id} className="flex-shrink-0 w-40 md:w-48">
                    <AIRecommendationCard recommendation={rec} />
                </div>
            ))}
        </Carousel>
    );
};


const HomePage: React.FC = () => {
    const { mangaList, loading } = useContext(MangaContext);
    const { history } = useHistory();

    const continueReadingData = history.slice(0, 4).map(item => {
        const manga = mangaList.find(m => m.id === item.mangaId);
        const chapter = manga?.chapters.find(c => c.id === item.chapterId);
        return { ...item, manga, chapter };
    }).filter((item): item is typeof item & { manga: Manga, chapter: Chapter } => !!item.manga && !!item.chapter);
    
    const featuredManga = [...mangaList].sort((a,b) => b.rating - a.rating).slice(0, 5);
    const hotUpdates = [...mangaList].sort((a, b) => {
        const dateA = a.chapters[0]?.date ? new Date(a.chapters[0].date.split('.').reverse().join('-')) : new Date(0);
        const dateB = b.chapters[0]?.date ? new Date(b.chapters[0].date.split('.').reverse().join('-')) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    }).slice(0, 10);
    const newSeason = mangaList.filter(m => m.year >= 2024).slice(0, 5);
    const trending = [...mangaList].sort((a,b) => parseFloat(b.views) - parseFloat(a.views)).slice(0, 5);
    const popularToday = [...mangaList].sort((a,b) => b.rating - a.rating).slice(0, 5);
    
    if (loading) {
        return <GridSkeleton count={10} />;
    }

    return (
        <div className="space-y-8">

            <HeroCarousel featuredManga={featuredManga} />

            <ForYouCarousel />

            <Carousel title="Горячие новинки" viewAllLink="#">
                {hotUpdates.map(manga => (
                    <div key={manga.id} className="flex-shrink-0 w-40 md:w-48">
                        <MangaCard manga={manga} />
                    </div>
                ))}
            </Carousel>
            
            {continueReadingData.length > 0 && (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-text-primary">Продолжить</h2>
                        <Link to="/history" className="text-sm text-muted hover:text-brand transition-colors flex items-center gap-1">
                            <span>Вся история</span>
                            <ArrowUpRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {continueReadingData.map(item => {
                            const chapterNumber = parseInt(item.chapter.chapterNumber, 10);
                            if (isNaN(chapterNumber)) return null; // Defensive check
                            return <ContinueReadingCard key={item.mangaId} manga={item.manga} chapterId={chapterNumber} />
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <VerticalMangaList title="Новый сезон" mangaList={newSeason} />
                <VerticalMangaList title="В тренде" mangaList={trending} />
                <VerticalMangaList title="Популярно сегодня" mangaList={popularToday} />
            </div>

            <Carousel title="Популярное" viewAllLink="#">
                {[...mangaList].sort((a, b) => parseFloat(b.views) - parseFloat(a.views)).slice(0, 10).map(manga => (
                    <div key={manga.id} className="flex-shrink-0 w-40 md:w-48">
                        <MangaCard manga={manga} />
                    </div>
                ))}
            </Carousel>
        </div>
    );
};


const VerticalMangaList: React.FC<{ title: string, mangaList: Manga[] }> = ({ title, mangaList }) => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{title}</h3>
            <a href="#" className="text-sm text-muted hover:text-brand transition-colors">
                <ArrowUpRightIcon className="w-5 h-5" />
            </a>
        </div>
        <div className="space-y-4">
            {mangaList.map(manga => (
                <Link to={`/manga/${manga.id}`} key={manga.id} className="flex items-center gap-4 group p-2 rounded-lg hover:bg-surface transition-colors">
                    <img src={manga.cover} alt={manga.title} className="w-16 h-20 object-cover rounded-md" />
                    <div className="flex-1">
                        <p className="text-xs text-text-secondary">{manga.type} {manga.year}</p>
                        <h4 className="font-semibold text-text-primary group-hover:text-brand transition-colors leading-tight">{manga.title}</h4>
                        <div className="flex items-center text-xs text-muted mt-1">
                            <StarIcon className="w-3 h-3 text-yellow-400 mr-1"/>
                            <span>{manga.rating}</span>
                            <span className="mx-1.5">·</span>
                            <span>{manga.views}</span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
);

export default HomePage;