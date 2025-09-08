import { Manga, Chapter, Page } from "../types";

const API_BASE = "http://127.0.0.1:8000";

/** Достаём номер главы */
function extractChapterNumber(name: string, fallback: string): string {
  if (!name) return fallback;
  const m = name.match(/(?:Глава|Chapter)\s*([0-9]+(?:\.[0-9]+)?)/i);
  return m?.[1] ?? fallback;
}

/** Определяем тип манги по жанрам */
function inferTypeFromGenres(genres: string[] = []): Manga["type"] {
  const g = genres.map((s) => s.toLowerCase());
  if (g.some((x) => x.includes("маньхуа"))) return "Manhua";
  if (g.some((x) => x.includes("манхва"))) return "Manhwa";
  return "Manga";
}

/** Маппинг статуса */
function mapStatus(additional?: any): Manga["status"] {
  const s: string = (additional?.status || "").toLowerCase();
  if (s.includes("заверш")) return "Завершено";
  return "В процессе";
}

/** Нормализация страниц */
function normalizePages(pages: string[], chapterId: string): Page[] {
  return (pages || [])
    .filter((p) => !p.includes("/user_photo/")) // 🚫 убираем мусор
    .map((p, idx) => ({
      id: `${chapterId}-${idx}`,
      url: p.startsWith("http") ? p : undefined,
    }));
}

/** Нормализация главы */
function normalizeChapter(ch: any, idx: number): Chapter {
  const title = ch?.name ?? `Глава ${idx + 1}`;
  const id = ch?.chapter_id?.toString?.() ?? String(idx + 1);
  return {
    id,
    chapterNumber: extractChapterNumber(title, String(idx + 1)),
    title,
    date: new Date().toISOString(),
    views: 0,
    pages: normalizePages(ch?.pages || [], id),
    likes: 0,
  };
}

/** Выбор корректной обложки */
function pickCoverUrl(data: any): string {
  const cover = data?.cover_url ?? "";

  // если cover_url нормальный → берём его
  if (cover && !cover.includes("/user_photo/") && !cover.includes("s_56x56")) {
    return cover;
  }

  // иначе ищем первую страницу с /media/catalog/publication/
  const firstChapter = Array.isArray(data?.chapters) ? data.chapters[0] : null;
  const firstPage = firstChapter?.pages?.find((p: string) =>
    p.includes("/media/catalog/publication/")
  );

  return firstPage || cover || "";
}

/** Нормализация манги */
function normalizeManga(data: any): Manga {
  const genres: string[] = Array.isArray(data?.genres) ? data.genres : [];
  const additional = data?.additional_info ?? {};
  return {
    id: data?.manga_id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
    title: data?.title ?? "Без названия",
    type: inferTypeFromGenres(genres),
    year: Number(additional?.year ?? new Date().getFullYear()),
    rating: 0,
    userRatings: {},
    views: "0",
    cover: pickCoverUrl(data), // ✅ фиксированная обложка
    description: data?.description ?? "",
    chapters: Array.isArray(data?.chapters)
      ? data.chapters.map((ch: any, idx: number) => normalizeChapter(ch, idx))
      : [],
    genres,
    status: mapStatus(additional),
  };
}

/** Загрузка информации о манге */
export async function fetchMangaInfo(url: string): Promise<Manga> {
  const res = await fetch(`${API_BASE}/manga?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ошибка при получении манги: ${res.status} ${res.statusText} ${text}`
    );
  }
  const raw = await res.json();
  return normalizeManga(raw); // ✅ уже с Page[] и правильной обложкой
}
