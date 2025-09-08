import os
import re
import json
import requests
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from time import sleep, time
from playwright.async_api import async_playwright
import sys
import asyncio
from tqdm import tqdm
import aiohttp
import aiofiles
from typing import List, Dict, Optional, Tuple
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import uvicorn
from contextlib import asynccontextmanager
import hashlib
from fastapi.staticfiles import StaticFiles

BASE_URL = "https://webfandom.ru"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

# Глобальный кеш для хранения информации о манге
manga_cache = {}
browser_pool = None

class MangaRequest(BaseModel):
    url: HttpUrl
    max_chapters: Optional[int] = None

class MangaResponse(BaseModel):
    title: str
    alternative_titles: Dict[str, str] = {}
    description: str
    genres: List[str] = []
    cover_url: Optional[str] = None
    local_cover_path: Optional[str] = None
    additional_info: Dict = {}
    chapters: List[Dict] = []
    total_chapters: int
    source_url: str
    manga_id: str

class ChapterResponse(BaseModel):
    chapter_id: str
    name: str
    pages: List[str] = []
    total_pages: int
    download_status: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global browser_pool
    print("🚀 Запуск сервера парсера манги...")
    browser_pool = await async_playwright().start()
    yield
    # Shutdown
    print("🛑 Остановка сервера...")
    if browser_pool:
        await browser_pool.stop()

app = FastAPI(
    title="Manga Parser API",
    description="API для парсинга манги с WebFandom.ru",
    version="1.0.0",
    lifespan=lifespan
)

os.makedirs("manga", exist_ok=True)

# Раздаём файлы из папки "manga" по адресу /static
app.mount("/static", StaticFiles(directory="manga"), name="static")

# 👇 Разрешаем фронту обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для отладки — можно потом ограничить ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FastMangaParser:
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        
    def sanitize_filename(self, name: str) -> str:
        """Очистка имени файла от недопустимых символов"""
        return re.sub(r'[\\/*?:"<>|]', "_", name).strip()[:100]
    
    def get_manga_id(self, url: str) -> str:
        """Генерируем уникальный ID для манги на основе URL"""
        return hashlib.md5(url.encode()).hexdigest()
    
    async def download_image_async(self, session: aiohttp.ClientSession, url: str, path: str, retries: int = 3) -> bool:
        """Асинхронное скачивание изображения"""
        if os.path.exists(path):
            return True
        if url.startswith("/"):
             url = urljoin(BASE_URL, url)
        
        headers = {
            **HEADERS,
            "Referer": BASE_URL,
            "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
        
        for attempt in range(retries):
            try:
                async with session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 200:
                        content = await response.read()
                        os.makedirs(os.path.dirname(path), exist_ok=True)
                        async with aiofiles.open(path, 'wb') as f:
                            await f.write(content)
                        return True
            except Exception as e:
                if attempt == retries - 1:
                    print(f"[WARN] Не удалось скачать {url}: {e}")
                await asyncio.sleep(0.5)
        return False
    
    async def download_images_batch(self, img_urls: List[Tuple[str, str]]) -> int:
        """Пакетная загрузка изображений"""
        connector = aiohttp.TCPConnector(limit=self.max_workers, force_close=True)
        timeout = aiohttp.ClientTimeout(total=300)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            tasks = []
            for url, path in img_urls:
                task = self.download_image_async(session, url, path)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks)
            return sum(results)
    
    async def get_full_manga_info(self, page) -> Dict:
        """Получаем полную информацию о манге"""
        print("Извлекаем полную информацию о манге...")
        
        # Ждем появления основного контента
        try:
            await page.wait_for_selector('h1, [data-testid="title"], .title, .manga-title', timeout=10000)
            await asyncio.sleep(2)
        except:
            print("Предупреждение: не удалось дождаться полной загрузки, продолжаем...")
            await asyncio.sleep(1)
        
        # Пробуем развернуть все теги
        try:
            print("Разворачиваем все теги...")
            await page.evaluate("""
                () => {
                    const showMoreButtons = document.querySelectorAll('button, span, div');
                    showMoreButtons.forEach(element => {
                        const text = element.textContent || '';
                        if (text.includes('Показать все') || 
                            text.includes('...') || 
                            element.className.includes('show-more') ||
                            element.className.includes('expand')) {
                            try {
                                element.click();
                            } catch(e) {}
                        }
                    });
                    
                    const badges = document.querySelectorAll('.badge');
                    badges.forEach(badge => {
                        if (badge.textContent && badge.textContent.includes('Показать все')) {
                            try {
                                badge.click();
                            } catch(e) {}
                        }
                    });
                }
            """)
            await asyncio.sleep(1)
        except:
            print("Не удалось развернуть теги, продолжаем...")
        
        # Извлекаем данные
        info = await page.evaluate(r"""
            () => {
                const data = {};
                
                // Название на русском
                const titleEl = document.querySelector('h1, [data-testid="title"], .title, .manga-title');
                data.title = titleEl ? titleEl.textContent.trim() : 'Без названия';
                
                // Альтернативные названия
                data.alternative_titles = {};
                
                // Ищем блок с альтернативными названиями
                const infoBlocks = document.querySelectorAll('.publication-info > div, .manga-info > div, .info-block, div');
                infoBlocks.forEach(block => {
                    const text = block.textContent || '';
                    
                    if (text.includes('Английское название:') || text.includes('English:')) {
                        const match = text.match(/(?:Английское название:|English:)\s*(.+?)(?:\n|$)/);
                        if (match) data.alternative_titles.english = match[1].trim();
                    }
                    
                    if (text.includes('Корейское название:') || text.includes('Korean:')) {
                        const match = text.match(/(?:Корейское название:|Korean:)\s*(.+?)(?:\n|$)/);
                        if (match) data.alternative_titles.korean = match[1].trim();
                    }
                    
                    if (text.includes('Японское название:') || text.includes('Japanese:')) {
                        const match = text.match(/(?:Японское название:|Japanese:)\s*(.+?)(?:\n|$)/);
                        if (match) data.alternative_titles.japanese = match[1].trim();
                    }
                });
                
                // Поиск обложки
                let coverUrl = null;
                
                const pictureElement = document.querySelector('picture');
                if (pictureElement) {
                    const imgInPicture = pictureElement.querySelector('img');
                    if (imgInPicture && imgInPicture.src && !imgInPicture.src.startsWith('data:')) {
                        coverUrl = imgInPicture.src;
                    }
                }
                
                if (!coverUrl) {
                    const imgSelectors = [
                        'img[class*="rounded"]',
                        'img[alt*="обложка"]',
                        'img[alt*="cover"]',
                        '.cover img',
                        '.manga-cover img',
                        'div.relative img',
                        '.publication-cover img',
                        'img.w-full'
                    ];
                    
                    for (const sel of imgSelectors) {
                        try {
                            const el = document.querySelector(sel);
                            if (el && el.src && 
                                !el.src.startsWith('data:') && 
                                !el.src.includes('avatar') && 
                                !el.src.includes('logo') &&
                                !el.src.includes('icon')) {
                                coverUrl = el.src;
                                break;
                            }
                        } catch(e) {}
                    }
                }
                
                if (!coverUrl) {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    const bigImg = imgs.find(img => 
                        img.src && 
                        !img.src.startsWith('data:') &&
                        img.naturalWidth > 200 && 
                        img.naturalHeight > 300 &&
                        !img.src.includes('avatar') &&
                        !img.src.includes('logo')
                    );
                    if (bigImg) coverUrl = bigImg.src;
                }
                
                data.cover_url = coverUrl;
                
                // Описание
                let description = '';
                const descSelectors = [
                    '.publication-description',
                    '.whitespace-pre-wrap',
                    '.description',
                    '.manga-description',
                    '[class*="description"]',
                    'div.font-light'
                ];
                
                for (const sel of descSelectors) {
                    try {
                        const el = document.querySelector(sel);
                        if (el && el.textContent && el.textContent.length > 50) {
                            description = el.textContent.trim();
                            break;
                        }
                    } catch(e) {}
                }
                
                data.description = description || 'Описание отсутствует';
                
                // Собираем ВСЕ теги
                const allTags = new Set();
                
                const tagSelectors = [
                    'a .badge.text-wf-yellow',
                    'a .badge',
                    '.badge',
                    '.genre',
                    '.tag',
                    'a[href*="/catalog?genres"]',
                    'a[href*="/catalog?tags"]',
                    '.genres a',
                    '.tags a',
                    '[class*="badge"]:not([class*="show"])'
                ];
                
                tagSelectors.forEach(sel => {
                    try {
                        document.querySelectorAll(sel).forEach(el => {
                            let text = el.textContent.trim();
                            
                            if (text && 
                                text.length > 1 && 
                                text !== '...' && 
                                !text.includes('Показать все') &&
                                !text.includes('Скрыть') &&
                                !text.includes('Свернуть')) {
                                
                                const parentLink = el.closest('a');
                                if (parentLink && parentLink.href && parentLink.href.includes('/catalog')) {
                                    text = parentLink.textContent.trim();
                                }
                                
                                if (text && !text.includes('Показать')) {
                                    allTags.add(text);
                                }
                            }
                        });
                    } catch(e) {}
                });
                
                try {
                    document.querySelectorAll('a[href*="/catalog"]').forEach(link => {
                        const badge = link.querySelector('.badge');
                        if (badge) {
                            const text = badge.textContent.trim();
                            if (text && !text.includes('Показать') && text !== '...') {
                                allTags.add(text);
                            }
                        }
                    });
                } catch(e) {}
                
                data.genres = Array.from(allTags);
                
                // Дополнительная информация
                data.additional_info = {};
                
                try {
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach(el => {
                        const text = el.textContent || '';
                        if (text.includes('Статус')) {
                            if (text.includes('Завершен')) data.additional_info.status = 'Завершен';
                            else if (text.includes('Продолжается')) data.additional_info.status = 'Продолжается';
                            else if (text.includes('Заморожен')) data.additional_info.status = 'Заморожен';
                        }
                        
                        if (text.includes('Автор')) {
                            const authorMatch = text.match(/Автор[:\s]+(.+?)(?:\n|$)/);
                            if (authorMatch) data.additional_info.author = authorMatch[1].trim();
                        }
                        
                        if (text.includes('Художник')) {
                            const artistMatch = text.match(/Художник[:\s]+(.+?)(?:\n|$)/);
                            if (artistMatch) data.additional_info.artist = artistMatch[1].trim();
                        }
                        
                        if (text.includes('Год выпуска') || text.includes('Год')) {
                            const yearMatch = text.match(/\d{4}/);
                            if (yearMatch) data.additional_info.year = parseInt(yearMatch[0]);
                        }
                    });
                } catch(e) {}
                
                return data;
            }
        """)
        
        return info

    async def extract_images_from_chapter(self, page) -> List[str]:
        """Извлекаем ВСЕ картинки из главы (Nuxt + img + data-* + scroll)"""
        img_urls = await page.evaluate(r"""
            () => {
                const images = [];

                // Проверяем глобальные переменные
                if (window.images) return window.images;
                if (window.chapterImages) return window.chapterImages;
                if (window.pageImages) return window.pageImages;

                // Ищем изображения в Nuxt data
                if (window.__NUXT__ && window.__NUXT__.data) {
                    const findImages = (obj, depth = 0) => {
                        if (depth > 10) return [];
                        const imgs = [];
                        if (typeof obj === 'string' && obj.match(/\.(jpg|jpeg|png|webp)/i)) {
                            imgs.push(obj);
                        } else if (Array.isArray(obj)) {
                            obj.forEach(item => imgs.push(...findImages(item, depth + 1)));
                        } else if (typeof obj === 'object' && obj !== null) {
                            Object.values(obj).forEach(val => imgs.push(...findImages(val, depth + 1)));
                        }
                        return imgs;
                    };
                    const nuxtImages = findImages(window.__NUXT__.data);
                    if (nuxtImages.length > 0) return nuxtImages;
                }

                // Парсим <script> для поиска JSON с картинками
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const text = script.textContent;
                    if (!text) continue;
                    const urlMatches = text.matchAll(/https?:\/\/[^"'\s,\]]+\.(?:jpg|jpeg|png|webp)/gi);
                    for (const match of urlMatches) {
                        images.push(match[0]);
                    }
                }

                // Собираем из DOM (src и data-атрибуты)
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && !img.src.startsWith('data:')) images.push(img.src);
                    ['data-src', 'data-original', 'data-lazy-src'].forEach(attr => {
                        const val = img.getAttribute(attr);
                        if (val) images.push(val);
                    });
                });

                // Убираем дубликаты и системные иконки
                return [...new Set(images)].filter(url =>
                    !url.includes('avatar') &&
                    !url.includes('logo') &&
                    !url.includes('icon') &&
                    !url.includes('button')
                );
            }
        """)

        # ⚡ Прокрутка, чтобы подгрузились ленивые картинки
        if not img_urls or len(img_urls) < 2:
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)
            img_urls = await page.evaluate("""
                () => Array.from(document.querySelectorAll('img'))
                    .map(img => img.src)
                    .filter(u => u && !u.startsWith('data:'))
            """)

        return img_urls
    
    async def process_chapter_async(self, browser, chapter: Dict, ch_idx: int, manga_dir: str, download_images: bool = True) -> Dict:
        """Асинхронная обработка главы"""
        context = await browser.new_context(user_agent=HEADERS["User-Agent"])
        page = await context.new_page()
        page.set_default_timeout(30000)
        
        try:
            await page.goto(chapter['url'], wait_until='domcontentloaded')
            await asyncio.sleep(1)
            
            # Быстрое извлечение изображений
            img_urls = await self.extract_images_from_chapter(page)
            
            chapter_result = {
                **chapter,
                "chapter_id": f"{ch_idx}",
                "total_pages": len(img_urls),
                "pages": [],
                "download_status": "pending"
            }
            
            if not img_urls:
                chapter_result["download_status"] = "no_images"
                await context.close()
                return chapter_result
            
            # Создаем папку для главы
            ch_dir = os.path.join(manga_dir, f"chapter_{ch_idx:03d}_{self.sanitize_filename(chapter['name'])}")
            
            if download_images:
                os.makedirs(ch_dir, exist_ok=True)
                
                # Подготавливаем список для загрузки
                download_list = []
                
                for idx, img_url in enumerate(img_urls, 1):
                    ext = "jpg"
                    if any(x in img_url.lower() for x in ['.png', '.webp', '.jpeg']):
                        ext = img_url.split('.')[-1].split('?')[0].lower()[:4]
                    
                    filename = os.path.join(ch_dir, f"page_{idx:03d}.{ext}")
                    # делаем относительный путь от папки manga
                    relative_path = os.path.relpath(filename, "manga").replace("\\", "/")
                    # теперь фронт будет получать /static/...
                    chapter_result["pages"].append(f"/static/{relative_path}")
                    download_list.append((img_url, filename))

                # Загружаем изображения асинхронно
                downloaded = await self.download_images_batch(download_list)
                chapter_result["download_status"] = "completed" if downloaded > 0 else "failed"
            else:
                # Просто сохраняем URL изображений
                chapter_result["pages"] = img_urls
                chapter_result["download_status"] = "urls_only"
            
            await context.close()
            return chapter_result
            
        except Exception as e:
            print(f"[ERROR] Ошибка при обработке главы {chapter['name']}: {e}")
            chapter_result["download_status"] = "error"
            chapter_result["error"] = str(e)
            await context.close()
            return chapter_result
    
    async def get_manga_info(self, url: str, max_chapters: Optional[int] = None) -> Dict:
        """Получение информации о манге с загрузкой первых глав и картинок"""
        browser = await browser_pool.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )

        def fix_page_url(page_url: str) -> str:
            """Исправляем относительные пути на полные ссылки"""
            if page_url.startswith("http"):
                return page_url
            return f"{BASE_URL}{page_url}"

        try:
            context = await browser.new_context(
                user_agent=HEADERS["User-Agent"],
                viewport={"width": 1920, "height": 1080}
            )

            page = await context.new_page()
            page.set_default_timeout(30000)

            print(f"Переходим на страницу: {url}")

            try:
                await page.goto(url, wait_until='domcontentloaded')
            except Exception as e:
                print(f"Предупреждение при загрузке страницы: {e}")

            # Получаем метаданные манги
            manga_info = await self.get_full_manga_info(page)
            manga_info["source_url"] = url
            manga_info["manga_id"] = self.get_manga_id(url)

            # Создаём структуру папок
            manga_dir = os.path.join("manga", self.sanitize_filename(manga_info["title"]))
            covers_dir = os.path.join(manga_dir, "covers")
            os.makedirs(covers_dir, exist_ok=True)

            # Скачиваем обложку
            if manga_info.get("cover_url") and not manga_info["cover_url"].startswith("data:"):
                cover_path = os.path.join(covers_dir, "main_cover.jpg")
                cover_url = urljoin(BASE_URL, manga_info["cover_url"]) if manga_info["cover_url"].startswith("/") else manga_info["cover_url"]

                try:
                    print(f"Скачиваем обложку: {cover_url}")
                    r = requests.get(cover_url, headers={**HEADERS, "Referer": BASE_URL}, timeout=30)
                    r.raise_for_status()
                    with open(cover_path, "wb") as f:
                        f.write(r.content)
                    manga_info["local_cover_path"] = cover_path
                    print(f"✅ Обложка сохранена: {cover_path}")
                except Exception as e:
                    print(f"[WARN] Не удалось скачать обложку: {e}")

            # Получаем список глав
            chapters = await page.evaluate("""
                () => {
                    const chapters = [];
                    const links = document.querySelectorAll('a[href*="/reader/"]');
                    links.forEach((link, index) => {
                        const href = link.getAttribute('href');
                        if (href && href.includes('/reader/')) {
                            chapters.push({
                                name: link.textContent.trim() || 'Глава без названия',
                                url: href.startsWith('http') ? href : window.location.origin + href,
                                chapter_id: (index + 1).toString()
                            });
                        }
                    });
                    return chapters;
                }
            """)

            print(f"📚 Найдено {len(chapters)} глав")

            if max_chapters:
                chapters = chapters[:max_chapters]
                print(f"📖 Обрабатываем первые {max_chapters} глав")

            # Обрабатываем главы (с картинками)
            manga_info["chapters"] = []
            for idx, chapter in enumerate(chapters, start=1):
                try:
                    chapter_result = await self.process_chapter_async(
                        browser,
                        chapter,
                        idx,
                        manga_dir,
                        download_images=False   # ⚡ только ссылки, без сохранения
                    )

                    # ✅ фиксируем ссылки картинок
                    chapter_result["pages"] = [fix_page_url(p) for p in chapter_result["pages"]]

                    manga_info["chapters"].append(chapter_result)
                    print(f"✅ Глава {chapter_result['name']} загружена ({chapter_result['total_pages']} стр.)")
                except Exception as e:
                    print(f"[ERROR] Не удалось обработать главу {chapter['name']}: {e}")

            manga_info["total_chapters"] = len(manga_info["chapters"])

            # Сохраняем JSON локально
            try:
                json_path = os.path.join(manga_dir, "manga_info.json")
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(manga_info, f, ensure_ascii=False, indent=2)
                print(f"💾 Информация сохранена: {json_path}")
            except Exception as e:
                print(f"[WARN] Не удалось сохранить JSON: {e}")

            await context.close()
            return manga_info

        finally:
            await browser.close()

# Создаем экземпляр парсера
parser = FastMangaParser(max_workers=10)

@app.get("/", summary="Главная страница")
async def root():
    return {
        "message": "Manga Parser API",
        "endpoints": {
            "manga_info": "/manga?url=<manga_url>&max_chapters=<number>",
            "chapter_download": "/chapters/{chapter_id}?manga_url=<url>"
        },
        "example": {
            "manga_info": "/manga?url=https://webfandom.ru/publications/manga-vseveduschij-chitatel",
            "chapter_download": "/chapters/1?manga_url=https://webfandom.ru/publications/manga-vseveduschij-chitatel"
        }
    }

@app.get("/manga", response_model=MangaResponse, summary="Получить информацию о манге")
async def get_manga_info_endpoint(
    url: str = Query(..., description="URL манги с webfandom.ru"),
    max_chapters: Optional[int] = Query(None, description="Максимальное количество глав для обработки")
):
    """
    Получает метаданные манги по URL:
    - Название и альтернативные названия
    - Описание, жанры, теги
    - Список всех глав
    - Обложка
    - Дополнительная информация
    """
    if not url.startswith("https://webfandom.ru"):
        raise HTTPException(status_code=400, detail="URL должен быть с сайта webfandom.ru")
    
    manga_id = parser.get_manga_id(url)
    
    # Проверяем кеш
    if manga_id in manga_cache:
        cached_data = manga_cache[manga_id]
        print(f"📋 Возвращаем данные из кеша для {cached_data['title']}")
        return cached_data
    
    try:
        print(f"🔍 Получение информации о манге: {url}")
        manga_info = await parser.get_manga_info(url, max_chapters)
        
        # Сохраняем в кеш
        manga_cache[manga_id] = manga_info
        
        return manga_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при парсинге: {str(e)}")

@app.get("/chapters/{chapter_id}", response_model=ChapterResponse, summary="Загрузить конкретную главу")
async def download_chapter(
    chapter_id: str,
    manga_url: str = Query(..., description="URL манги"),
    download_images: bool = Query(True, description="Загружать изображения или только URL")
):
    """
    Загружает конкретную главу по ID:
    - Получает все страницы главы
    - Опционально скачивает изображения на сервер
    - Возвращает пути к файлам или URL изображений
    """
    if not manga_url.startswith("https://webfandom.ru"):
        raise HTTPException(status_code=400, detail="URL должен быть с сайта webfandom.ru")
    
    manga_id = parser.get_manga_id(manga_url)

    def fix_page_url(page_url: str) -> str:
        """Исправляем относительные пути на полные ссылки"""
        if page_url.startswith("http"):
            return page_url
        return f"{BASE_URL}{page_url}"
    
    # Проверяем, есть ли информация о манге в кеше
    manga_info = manga_cache.get(manga_id)
    if not manga_info:
        # Если нет в кеше, получаем информацию
        try:
            manga_info = await parser.get_manga_info(manga_url)
            manga_cache[manga_id] = manga_info
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка при получении информации о манге: {str(e)}")
    
    # Находим главу по ID
    chapter_to_download = None
    for chapter in manga_info["chapters"]:
        if chapter.get("chapter_id") == chapter_id:
            chapter_to_download = chapter
            break
    
    if not chapter_to_download:
        raise HTTPException(status_code=404, detail=f"Глава с ID {chapter_id} не найдена")
    
    try:
        print(f"📖 Загрузка главы {chapter_id}: {chapter_to_download['name']}")
        
        manga_dir = os.path.join("manga", parser.sanitize_filename(manga_info["title"]))
        
        browser = await browser_pool.chromium.launch(headless=True, args=['--no-sandbox'])
        
        try:
            chapter_result = await parser.process_chapter_async(
                browser, 
                chapter_to_download, 
                int(chapter_id), 
                manga_dir, 
                download_images
            )

            # ✅ фиксируем все ссылки на страницы
            chapter_result["pages"] = [fix_page_url(p) for p in chapter_result["pages"]]
            
            return ChapterResponse(
                chapter_id=chapter_result["chapter_id"],
                name=chapter_result["name"],
                pages=chapter_result["pages"],
                total_pages=chapter_result["total_pages"],
                download_status=chapter_result["download_status"]
            )
            
        finally:
            await browser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке главы: {str(e)}")

@app.get("/health", summary="Проверка состояния сервера")
async def health_check():
    """Простая проверка состояния сервера"""
    return {
        "status": "healthy",
        "cached_manga": len(manga_cache),
        "message": "Сервер работает нормально"
    }

if __name__ == "__main__":
    print("🚀 Запуск FastAPI сервера для парсинга манги")
    print("📚 Доступные эндпоинты:")
    print("   GET /manga?url=<url> - Получить информацию о манге")
    print("   GET /chapters/{id}?manga_url=<url> - Загрузить главу")
    print("   GET /health - Проверка состояния")
    print("🌐 Swagger UI: http://localhost:8000/docs")
    
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)