'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, logout } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        try {
          const data = await apiRequest('/profile/me');
          setCurrentUser(data.profile);
        } catch (e) {
          // Token expired or invalid
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }
    checkAuth();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-mono text-base shadow-lg shadow-blue-500/25">
            &lt;/&gt;
          </span>
          <span className="gradient-text font-mono">DevConnect</span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search developers, skills, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-full px-4 py-2 pl-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/feed"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
          >
            Feed
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
          >
            Explore
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <Link
                href={`/profile/${currentUser.username}`}
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-full py-1 px-3 hover:border-blue-500/50 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-200">@{currentUser.username}</span>
              </Link>

              <Link
                href="/profile/edit"
                className="text-xs text-slate-400 hover:text-blue-400 px-2 py-1 transition-colors"
                title="Edit Profile"
              >
                Edit
              </Link>

              <button
                onClick={logout}
                className="text-xs bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="gradient-button text-sm font-medium text-white px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-3 pb-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 pl-9 text-sm text-slate-100"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          <Link href="/feed" className="text-slate-300 text-sm py-1">Feed</Link>
          <Link href="/search" className="text-slate-300 text-sm py-1">Explore</Link>

          {currentUser ? (
            <>
              <Link href={`/profile/${currentUser.username}`} className="text-blue-400 text-sm py-1">
                Profile (@{currentUser.username})
              </Link>
              <Link href="/profile/edit" className="text-slate-300 text-sm py-1">Edit Profile</Link>
              <button onClick={logout} className="text-left text-red-400 text-sm py-1">Logout</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <Link href="/login" className="flex-1 text-center py-2 bg-slate-800 rounded-lg text-sm">Log In</Link>
              <Link href="/register" className="flex-1 text-center py-2 gradient-button text-sm rounded-lg">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
