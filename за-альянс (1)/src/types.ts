export interface Manga {
  id: string;
  title: string;
  type: 'Manhwa' | 'Manga' | 'Manhua';
  year: number;
  rating: number;
  userRatings: { [userEmail: string]: number };
  views: string;
  cover: string;
  description: string;
  chapters: Chapter[];
  genres: string[];
  status: 'В процессе' | 'Завершено';
}

export type MangaFormData = Omit<
  Manga,
  'id' | 'chapters' | 'rating' | 'views' | 'userRatings'
>;

export interface Page {
  id: string;
  url?: string;   // для http/https
  file?: File;    // для загруженных
}


export interface Chapter {
  id: string;
  chapterNumber: string;
  title: string;
  date: string;
  views: number;
  pages: Page[];   // ✅ теперь массив Page
  likes?: number;
}



export interface ReadingProgress {
  mangaId: string;
  currentChapter: number;
  totalChapters: number;
}

export type BookmarkStatus =
  | 'Читаю'
  | 'Буду читать'
  | 'Прочитано'
  | 'Брошено'
  | 'Отложено'
  | 'Не интересно';

export interface Bookmark {
  mangaId: string;
  status: BookmarkStatus;
  addedAt: string; // ISO
}

export interface User {
  username: string;
  email: string;
  avatar: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'banned';
  subscribedMangaIds?: string[];
}

export interface Comment {
  id: number;
  userId: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  likedBy: string[];
  replies?: Comment[];
}

export interface HistoryItem {
  mangaId: string;
  chapterId: string;
  readAt: string;
}

export interface Notification {
  id: number;
  message: string;
  link: string;
  read: boolean;
  timestamp: string;
}

export interface Report {
  id: number;
  mangaId: string;
  mangaTitle: string;
  reportedBy: string;
  timestamp: string;
  status: 'pending' | 'resolved';
}

export interface EditSuggestion {
  id: number;
  mangaId: string;
  mangaTitle: string;
  suggestedBy: string;
  timestamp: string;
  data: MangaFormData;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AIRecommendation {
  title: string;
  reason: string;
  manga?: Manga;
}

export interface CharacterInfo {
  name: string;
  description: string;
}
