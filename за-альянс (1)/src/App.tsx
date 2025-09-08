import React, { useContext } from 'react';
import { HashRouter, Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import TopsPage from './pages/TopsPage';
import BookmarksPage from './pages/BookmarksPage';
import HistoryPage from './pages/HistoryPage';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import { MangaContext } from './contexts/MangaContext';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CreateMangaPage from './pages/admin/CreateMangaPage';
import AdminRoute from './components/AdminRoute';
import GenrePage from './pages/GenrePage';
import ReaderPage from './pages/ReaderPage';
import DetailPageSkeleton from './components/skeletons/DetailPageSkeleton';
import SuggestEditPage from './pages/SuggestEditPage';
import CatalogPage from './pages/CatalogPage';
import ModeratorDashboardPage from './pages/moderator/ModeratorDashboardPage';
import ModeratorRoute from './components/ModeratorRoute';
import ImportMangaPage from './pages/admin/ImportMangaPage';
import ManageMangaPage from './pages/admin/ManageMangaPage';

const DetailPageWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getMangaById, loading } = useContext(MangaContext);
    const mangaId = id || '';
    const manga = getMangaById(mangaId);

    if (loading) {
        return <PageTransition><DetailPageSkeleton /></PageTransition>;
    }
    if (!manga) {
        return <PageTransition><div className="text-center p-8">Manga not found.</div></PageTransition>;
    }
    return <PageTransition><DetailPage manga={manga} /></PageTransition>;
};

const ManageMangaPageWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getMangaById, loading } = useContext(MangaContext);
    const mangaId = id || '';
    const manga = getMangaById(mangaId);

    if (loading) {
         return <PageTransition><DetailPageSkeleton /></PageTransition>;
    }
    if (!manga) {
        return <PageTransition><div className="text-center p-8">Manga not found.</div></PageTransition>;
    }
    return <PageTransition><ManageMangaPage manga={manga} /></PageTransition>;
};

const SuggestEditPageWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getMangaById, loading } = useContext(MangaContext);
    const mangaId = id || '';
    const manga = getMangaById(mangaId);

    if (loading) {
         return <PageTransition><DetailPageSkeleton /></PageTransition>;
    }
    if (!manga) {
        return <PageTransition><div className="text-center p-8">Manga not found.</div></PageTransition>;
    }
    return <PageTransition><SuggestEditPage manga={manga} /></PageTransition>;
};


const GenrePageWrapper: React.FC = () => {
    const { genreName } = useParams<{ genreName: string }>();
    return <PageTransition><GenrePage genreName={genreName || ''} /></PageTransition>;
};

const ReaderPageWrapper: React.FC = () => {
    const { id, chapterId } = useParams<{ id: string; chapterId: string; }>();
    const mangaId = id || '';
    const chapId = chapterId || '';
    return <PageTransition><ReaderPage mangaId={mangaId} chapterId={chapId} /></PageTransition>;
}


const AppRoutes: React.FC = () => {
  const location = useLocation();
  return (
     <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/catalog" element={<PageTransition><CatalogPage /></PageTransition>} />
            <Route path="/manga/:id" element={<DetailPageWrapper />} />
            <Route path="/tops" element={<PageTransition><TopsPage /></PageTransition>} />
            <Route path="/genre/:genreName" element={<GenrePageWrapper />} />
            
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            
            {/* User Routes */}
            <Route path="/bookmarks" element={<ProtectedRoute><PageTransition><BookmarksPage /></PageTransition></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><PageTransition><HistoryPage /></PageTransition></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
            <Route path="/manga/:id/chapter/:chapterId" element={<ProtectedRoute><ReaderPageWrapper /></ProtectedRoute>} />
            <Route path="/manga/:id/suggest-edit" element={<ProtectedRoute><SuggestEditPageWrapper /></ProtectedRoute>} />

            {/* Admin & Moderator Routes */}
            <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboardPage /></PageTransition></AdminRoute>} />
            <Route path="/admin/create" element={<AdminRoute><PageTransition><CreateMangaPage /></PageTransition></AdminRoute>} />
            <Route path="/admin/import" element={<AdminRoute><PageTransition><ImportMangaPage /></PageTransition></AdminRoute>} />
            <Route path="/admin/manga/:id/manage" element={<AdminRoute><ManageMangaPageWrapper /></AdminRoute>} />
            <Route path="/manga/:id/edit" element={<AdminRoute><ManageMangaPageWrapper /></AdminRoute>} />
            <Route path="/moderator" element={<ModeratorRoute><PageTransition><ModeratorDashboardPage /></PageTransition></ModeratorRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </AnimatePresence>
  )
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-base flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 md:px-8 py-6">
          <AppRoutes />
        </main>
      </div>
    </HashRouter>
  );
};

export default App;