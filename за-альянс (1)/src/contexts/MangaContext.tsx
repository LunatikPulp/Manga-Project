import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Manga, Chapter } from '../types';
import { mangaData } from '../data/mockData';

interface MangaContextType {
  mangaList: Manga[];
  loading: boolean;
  addManga: (manga: Manga) => void;
  updateManga: (id: string, updatedManga: Partial<Omit<Manga, 'id' | 'userRatings'>>) => void;
  deleteManga: (id: string) => void;
  getMangaById: (id: string) => Manga | undefined;
  updateChapters: (mangaId: string, chapters: Chapter[]) => void;
  updateChapterContent: (mangaId: string, chapterId: string, content: string[]) => void;
  rateManga: (mangaId: string, userEmail: string, rating: number) => void;
  likeChapter: (mangaId: string, chapterId: string) => void;
}

const MANGA_STORAGE_KEY = 'manga_data_local_v1';

export const MangaContext = createContext<MangaContextType>({
  mangaList: [],
  loading: true,
  addManga: () => {},
  updateManga: () => {},
  deleteManga: () => {},
  getMangaById: () => undefined,
  updateChapters: () => {},
  updateChapterContent: () => {},
  rateManga: () => {},
  likeChapter: () => {},
});

const calculateAverageRating = (userRatings: { [userEmail: string]: number }): number => {
    const ratings = Object.values(userRatings);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
}

export const MangaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  const persistMangaList = useCallback((newList: Manga[]) => {
    try {
      localStorage.setItem(MANGA_STORAGE_KEY, JSON.stringify(newList));
    } catch (error) {
      console.error("Не удалось сохранить данные манги в localStorage (вероятно, из-за превышения лимита):", error);
    }
  }, []);

  useEffect(() => {
    try {
      const storedManga = localStorage.getItem(MANGA_STORAGE_KEY);
      if (storedManga) {
        setMangaList(JSON.parse(storedManga));
      } else {
        setMangaList(mangaData);
        persistMangaList(mangaData);
      }
    } catch (error) {
      console.error("Не удалось загрузить данные манги из localStorage", error);
      setMangaList(mangaData);
    } finally {
      setLoading(false);
    }
  }, [persistMangaList]);

  const addManga = (newManga: Manga) => {
    setMangaList(prevMangaList => {
      if (prevMangaList.some(m => m.id === newManga.id)) {
        console.warn(`Manga with id ${newManga.id} already exists.`);
        return prevMangaList;
      }
      const newList = [newManga, ...prevMangaList];
      persistMangaList(newList);
      return newList;
    });
  };

  const updateManga = (id: string, updatedMangaData: Partial<Omit<Manga, 'id' | 'userRatings'>>) => {
    setMangaList(prevMangaList => {
      const newList = prevMangaList.map(manga =>
        manga.id === id ? { ...manga, ...updatedMangaData } : manga
      );
      persistMangaList(newList);
      return newList;
    });
  };
  
  const updateChapters = (mangaId: string, chapters: Chapter[]) => {
    setMangaList(prevMangaList => {
      const newList = prevMangaList.map(manga =>
        manga.id === mangaId ? { ...manga, chapters } : manga
      );
      persistMangaList(newList);
      return newList;
    });
  };
  
    const updateChapterContent = (mangaId: string, chapterId: string, content: string[]) => {
        setMangaList(prevMangaList => {
            const newList = prevMangaList.map(manga => {
                if (manga.id === mangaId) {
                    const updatedChapters = manga.chapters.map(chapter => {
                        if (chapter.id === chapterId) {
                            return { ...chapter, content };
                        }
                        return chapter;
                    });
                    return { ...manga, chapters: updatedChapters };
                }
                return manga;
            });
            persistMangaList(newList);
            return newList;
        });
    };

  const rateManga = (mangaId: string, userEmail: string, rating: number) => {
    setMangaList(prevMangaList => {
      const newList = prevMangaList.map(manga => {
          if (manga.id === mangaId) {
              const newUserRatings = { ...manga.userRatings, [userEmail]: rating };
              const newAverageRating = calculateAverageRating(newUserRatings);
              return { ...manga, userRatings: newUserRatings, rating: newAverageRating };
          }
          return manga;
      });
      persistMangaList(newList);
      return newList;
    });
  }
  
    const likeChapter = (mangaId: string, chapterId: string) => {
        setMangaList(prevMangaList => {
            const newList = prevMangaList.map(manga => {
                if (manga.id === mangaId) {
                    const updatedChapters = manga.chapters.map(chapter => {
                        if (chapter.id === chapterId) {
                            return { ...chapter, likes: (chapter.likes || 0) + 1 };
                        }
                        return chapter;
                    });
                    return { ...manga, chapters: updatedChapters };
                }
                return manga;
            });
            persistMangaList(newList);
            return newList;
        });
    };

  const deleteManga = (id: string) => {
    setMangaList(prevMangaList => {
      const newList = prevMangaList.filter(manga => manga.id !== id);
      persistMangaList(newList);
      return newList;
    });
  };
  
  const getMangaById = (id: string): Manga | undefined => {
    return mangaList.find(manga => manga.id === id);
  }

  return (
    <MangaContext.Provider value={{ mangaList, loading, addManga, updateManga, deleteManga, getMangaById, updateChapters, updateChapterContent, rateManga, likeChapter }}>
      {children}
    </MangaContext.Provider>
  );
};