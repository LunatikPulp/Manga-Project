import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MangaContext } from '../contexts/MangaContext';
import { Chapter, Page } from '../types';
import { useHistory } from '../hooks/useHistory';
import { useIntersection } from '../hooks/useIntersection';
import ReaderSidebar from '../components/ReaderSidebar';
import ChapterListModal from '../components/ChapterListModal';
import ReaderSettingsModal, { ReaderSettings } from '../components/ReaderSettingsModal';
import Modal from '../components/Modal';
import ChapterEnd from '../components/ChapterEnd';
import { ToasterContext } from '../contexts/ToasterContext';
import { useReports } from '../hooks/useReports';
import { AuthContext } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PagedChapterView from '../components/PagedChapterView';

/** ---------- Helpers ---------- */
const getPageSrc = (p: Page): string => {
  if (p.file) return URL.createObjectURL(p.file);
  if (p.url) return p.url.startsWith('//') ? 'https:' + p.url : p.url;
  return '';
};

const getChapterImages = (ch: Chapter): string[] => {
  if (!Array.isArray(ch.pages)) return [];
  return ch.pages.map(getPageSrc).filter(Boolean);
};
/** ----------------------------- */

const ScrollChapterView: React.FC<{
  chapters: Chapter[];
  onImageVisible: (chapterId: string, page: number) => void;
  containerWidth: number;
}> = React.memo(({ chapters, onImageVisible, containerWidth }) => {
  return (
    <div>
      {chapters.map((chapter) => (
        <ChapterContent
          key={chapter.id}
          chapter={chapter}
          onImageVisible={onImageVisible}
          containerWidth={containerWidth}
        />
      ))}
    </div>
  );
});

const ChapterContent: React.FC<{
  chapter: Chapter;
  onImageVisible: (chapterId: string, page: number) => void;
  containerWidth: number;
}> = React.memo(({ chapter, onImageVisible, containerWidth }) => {
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const images = useMemo(() => getChapterImages(chapter), [chapter]);

  const intersectionCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-page-num') || '0', 10);
          onImageVisible(chapter.id, pageNum);
        }
      }
    },
    [chapter.id, onImageVisible]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(intersectionCallback, { threshold: 0.5 });
    const currentRefs = imageRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [intersectionCallback, images.length]);

  if (!images || images.length === 0) {
    return (
      <p className="text-center text-muted py-8 bg-surface rounded-md">
        В главе {chapter.chapterNumber} нет страниц.
      </p>
    );
  }

  return (
    <div
      id={`chapter-${chapter.id}`}
      className="chapter-container mb-8"
      style={{ width: `${containerWidth}%`, margin: '0 auto' }}
    >
      <h2 className="text-center text-muted text-lg font-semibold my-4">
        Глава {chapter.chapterNumber}
      </h2>
      {images.map((src, idx) => (
        <img
          key={`${chapter.id}-${idx}`}
          ref={(el) => {
            imageRefs.current[idx] = el;
          }}
          src={src}
          alt={`Страница ${idx + 1}`}
          className="max-w-full h-auto mx-auto block"
          loading="lazy"
          data-page-num={idx + 1}
        />
      ))}
    </div>
  );
});

const ReaderPage: React.FC<{ mangaId: string; chapterId: string }> = ({
  mangaId: initialMangaId,
  chapterId: initialChapterId,
}) => {
  const { getMangaById, likeChapter } = useContext(MangaContext);
  const { addHistoryItem } = useHistory();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { showToaster } = useContext(ToasterContext);
  const { addReport } = useReports();

  // Common State
  const [settings, setSettings] = useLocalStorage<ReaderSettings>('reader_settings', {
    readerType: 'scroll',
    containerWidth: 100,
    imageServer: 'main',
    autoLoadNextChapter: true,
    showNotes: false,
    showPageIndicator: true,
  });
  const [visibleChapterId, setVisibleChapterId] = useState<string>(initialChapterId);
  const [visiblePageInfo, setVisiblePageInfo] = useState<{ page: number; total: number }>({
    page: 1,
    total: 1,
  });
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [likedChapterIds, setLikedChapterIds] = useLocalStorage<string[]>(
    `liked_chapters_${user?.email || 'guest'}`,
    []
  );

  // Modal States
  const [isChapterListOpen, setChapterListOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  // Scroll Mode State
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([]);

  // Paged Mode State
  const [currentPagedChapterId, setCurrentPagedChapterId] = useState(initialChapterId);

  const manga = getMangaById(initialMangaId);

  // Auto-scrolling logic
  useEffect(() => {
    let scrollInterval: number | null = null;
    if (isAutoScrolling) {
      scrollInterval = window.setInterval(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          setIsAutoScrolling(false);
        } else {
          window.scrollBy(0, 2);
        }
      }, 15);
    }
    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [isAutoScrolling]);

  const sortedChapters = useMemo(() => {
    if (!manga) return [];
    return [...manga.chapters].sort(
      (a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber)
    );
  }, [manga]);

  // === Paged Mode Logic ===
  const { currentPagedChapter, pagedPrevChapter, pagedNextChapter } = useMemo(() => {
    const currentIndex = sortedChapters.findIndex((c) => c.id === currentPagedChapterId);
    if (currentIndex === -1)
      return { currentPagedChapter: null, pagedPrevChapter: null, pagedNextChapter: null };
    return {
      currentPagedChapter: sortedChapters[currentIndex],
      pagedPrevChapter: currentIndex > 0 ? sortedChapters[currentIndex - 1] : null,
      pagedNextChapter:
        currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null,
    };
  }, [sortedChapters, currentPagedChapterId]);

  const handleNavigateChapter = (chapterId: string | null) => {
    if (chapterId) {
      setCurrentPagedChapterId(chapterId);
      setVisibleChapterId(chapterId);
      navigate(`/manga/${initialMangaId}/chapter/${chapterId}`, { replace: true });
      addHistoryItem(initialMangaId, chapterId);
    }
  };

  useEffect(() => {
    setCurrentPagedChapterId(initialChapterId);
  }, [initialChapterId]);

  // === Scroll Mode Logic ===
  const isLastChapterLoaded = useMemo(() => {
    if (loadedChapters.length === 0 || sortedChapters.length === 0) return false;
    const lastLoadedChapterId = loadedChapters[loadedChapters.length - 1].id;
    const lastAvailableChapterId = sortedChapters[sortedChapters.length - 1].id;
    return lastLoadedChapterId === lastAvailableChapterId;
  }, [loadedChapters, sortedChapters]);

  useEffect(() => {
    const startingChapter = sortedChapters.find((c) => c.id === initialChapterId);
    if (startingChapter) {
      setLoadedChapters([startingChapter]);
      addHistoryItem(initialMangaId, initialChapterId);
    }
  }, [initialChapterId, sortedChapters, initialMangaId, addHistoryItem]);

  useEffect(() => {
    if (settings.readerType === 'scroll' && visibleChapterId) {
      navigate(`/manga/${initialMangaId}/chapter/${visibleChapterId}`, { replace: true });
      addHistoryItem(initialMangaId, visibleChapterId);
    }
  }, [visibleChapterId, settings.readerType, initialMangaId, addHistoryItem, navigate]);

  const loadNextChapter = useCallback(() => {
    if (isLastChapterLoaded || loadedChapters.length === 0 || !settings.autoLoadNextChapter) return;
    const lastLoadedChapter = loadedChapters[loadedChapters.length - 1];
    const lastLoadedIndex = sortedChapters.findIndex((c) => c.id === lastLoadedChapter.id);
    if (lastLoadedIndex !== -1 && lastLoadedIndex < sortedChapters.length - 1) {
      const nextRaw = sortedChapters[lastLoadedIndex + 1];
      setLoadedChapters((prev) => [...prev, nextRaw]);
    }
  }, [loadedChapters, sortedChapters, isLastChapterLoaded, settings.autoLoadNextChapter]);

  const intersectionRef = useIntersection(loadNextChapter, { rootMargin: '500px' });

  // === Common Logic ===
  const handleImageVisible = useCallback(
    (chapterId: string, page: number) => {
      setVisibleChapterId(chapterId);
      const ch = sortedChapters.find((c) => c.id === chapterId);
      if (ch) {
        const total = getChapterImages(ch).length;
        setVisiblePageInfo({ page, total });
      }
    },
    [sortedChapters]
  );

  const handlePagedPageChange = useCallback((page: number, total: number) => {
    setVisiblePageInfo({ page, total });
  }, []);

  const handleReport = () => {
    if (!user || !manga) return;
    addReport({ mangaId: manga.id, mangaTitle: manga.title });
    setReportModalOpen(false);
    showToaster('Жалоба отправлена. Спасибо!');
  };

  const handleLike = () => {
    if (!user || !manga) {
      showToaster('Пожалуйста, войдите, чтобы поблагодарить.');
      return;
    }
    if (likedChapterIds.includes(visibleChapterId)) {
      showToaster('Вы уже поблагодарили за эту главу.');
      return;
    }
    likeChapter(manga.id, visibleChapterId);
    setLikedChapterIds((prev) => [...prev, visibleChapterId]);
    showToaster('Спасибо за поддержку!');
  };

  const commentsRef = useRef<HTMLDivElement>(null);
  const handleCommentsClick = () => commentsRef.current?.scrollIntoView({ behavior: 'smooth' });

  if (!manga) return <div className="text-center p-8">Манга не найдена.</div>;
  if (sortedChapters.length === 0) return <div className="text-center p-8">В этой манге пока нет глав.</div>;

  return (
    <div className="mx-auto">
      <ReaderSidebar
        currentPage={visiblePageInfo.page}
        totalPages={visiblePageInfo.total}
        onChapterListClick={() => setChapterListOpen(true)}
        onCommentsClick={handleCommentsClick}
        onSettingsClick={() => setSettingsOpen(true)}
        onReportClick={() => setReportModalOpen(true)}
        onLikeClick={handleLike}
        isLiked={likedChapterIds.includes(visibleChapterId)}
        onAutoScrollToggle={() => setIsAutoScrolling((prev) => !prev)}
        isAutoScrolling={isAutoScrolling}
      />

      <ChapterListModal
        isOpen={isChapterListOpen}
        onClose={() => setChapterListOpen(false)}
        chapters={manga.chapters}
        mangaId={manga.id}
        currentChapterId={visibleChapterId}
      />
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Пожаловаться на контент"
        onConfirm={handleReport}
        confirmText="Отправить жалобу"
      >
        <p className="text-text-secondary">Вы уверены, что хотите пожаловаться на "{manga.title}"?</p>
      </Modal>

      {settings.readerType === 'scroll' ? (
        <>
          <ScrollChapterView
            chapters={loadedChapters}
            onImageVisible={handleImageVisible}
            containerWidth={settings.containerWidth}
          />
          {!isLastChapterLoaded && settings.autoLoadNextChapter && (
            <div ref={intersectionRef} className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          )}
          {(isLastChapterLoaded || !settings.autoLoadNextChapter) && (
            <div ref={commentsRef}>
              <ChapterEnd
                mangaId={manga.id}
                chapterId={loadedChapters.length > 0 ? loadedChapters[loadedChapters.length - 1].id : ''}
              />
            </div>
          )}
        </>
      ) : currentPagedChapter ? (
        <PagedChapterView
          key={currentPagedChapterId}
          chapter={currentPagedChapter}
          onNextChapter={() => handleNavigateChapter(pagedNextChapter?.id || null)}
          onPrevChapter={() => handleNavigateChapter(pagedPrevChapter?.id || null)}
          onPageChange={handlePagedPageChange}
        />
      ) : (
        <div className="text-center p-8">Глава не найдена.</div>
      )}
    </div>
  );
};

export default ReaderPage;
