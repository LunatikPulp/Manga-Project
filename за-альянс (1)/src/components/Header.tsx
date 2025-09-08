import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import { MangaContext } from '../contexts/MangaContext';
import { Manga } from '../../types';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import Logo from './icons/Logo';

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const BookmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

const NavItem: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => {
  const activeClassName = "bg-overlay text-text-primary";
  const inactiveClassName = "text-text-secondary hover:bg-surface hover:text-text-primary";

  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `${isActive ? activeClassName : inactiveClassName} px-4 py-2 rounded-md transition-colors font-medium`}
    >
      {children}
    </NavLink>
  );
};

const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const { mangaList } = useContext(MangaContext);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = mangaList.filter(manga => 
      manga.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results.slice(0, 5)); // Limit to 5 results
  }, [searchQuery, mangaList]);
  
  useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchQuery('');
            }
             if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  return (
    <header className="sticky top-0 z-50 bg-base bg-opacity-80 backdrop-blur-md border-b border-surface">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <NavLink to="/" className="flex items-center space-x-2">
               <Logo />
            </NavLink>
            <nav className="hidden md:flex items-center space-x-2">
              <NavItem to="/catalog">Каталог</NavItem>
              <NavItem to="/tops">Топы</NavItem>
              <NavItem to="/history">История</NavItem>
            </nav>
          </div>

          <div className="flex-1 max-w-sm ml-6" ref={searchRef}>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Что ищем, сенпай?"
                className="w-full bg-surface border border-overlay rounded-md pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
               {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-overlay rounded-md shadow-lg overflow-hidden border border-surface">
                  <ul>
                    {searchResults.map(manga => (
                      <li key={manga.id}>
                        <Link 
                          to={`/manga/${manga.id}`} 
                          onClick={() => setSearchQuery('')}
                          className="flex items-center gap-3 p-2 hover:bg-surface transition-colors"
                        >
                          <img src={manga.cover} alt={manga.title} className="w-10 h-14 object-cover rounded" />
                          <span className="font-medium text-sm">{manga.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-6">
            <NavLink to="/bookmarks" className="p-2 rounded-full text-muted hover:bg-surface hover:text-brand transition-colors" aria-label="Закладки">
              <BookmarkIcon className="w-6 h-6" />
            </NavLink>
            <NotificationBell />
            
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!isProfileOpen)} aria-label="Меню профиля">
                  <Avatar name={user.username} size={36} />
                </button>
                <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-overlay rounded-md shadow-lg py-1 border border-surface"
                   >
                    <Link to="/profile" className="block px-4 py-2 text-sm text-text-primary hover:bg-surface" onClick={() => setProfileOpen(false)}>Профиль</Link>
                    {user.role === 'admin' && (
                       <>
                        <Link to="/admin" className="block px-4 py-2 text-sm text-text-primary hover:bg-surface" onClick={() => setProfileOpen(false)}>Панель</Link>
                        <Link to="/admin/import" className="block px-4 py-2 text-sm text-text-primary hover:bg-surface" onClick={() => setProfileOpen(false)}>Импорт</Link>
                       </>
                    )}
                     {user.role === 'moderator' && (
                       <Link to="/moderator" className="block px-4 py-2 text-sm text-text-primary hover:bg-surface" onClick={() => setProfileOpen(false)}>Панель Модератора</Link>
                    )}
                    <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-accent hover:bg-surface">Выйти</button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Войти</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-md hover:bg-blue-600 transition-colors">Регистрация</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;