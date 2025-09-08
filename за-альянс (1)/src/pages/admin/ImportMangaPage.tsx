// src/pages/admin/ImportMangaPage.tsx
import React, { useState, useContext } from "react";
import { fetchMangaInfo } from "../../services/externalApiService";
import { MangaContext } from "../../contexts/MangaContext";
import { Manga } from "../../types";

const ImportMangaPage: React.FC = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { addManga } = useContext(MangaContext);

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Введите URL манги с webfandom.ru");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const manga: Manga = await fetchMangaInfo(url.trim());
      addManga(manga);

      setSuccess(`Манга "${manga.title}" успешно импортирована!`);
      setUrl("");
    } catch (err: any) {
      console.error("Ошибка импорта:", err);
      setError(err.message || "Не удалось загрузить мангу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">📥 Импорт манги</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Вставьте ссылку на мангу с webfandom.ru"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Загрузка..." : "Загрузить"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </div>
  );
};

export default ImportMangaPage;
