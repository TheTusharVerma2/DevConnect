'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, logout } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        try {
          const data = await apiRequest('/profile/me');
          setCurrentUser(data.profile);
        } catch (e) {
          try {
            const test = await apiRequest('/protected-test');
            setCurrentUser({ username: 'developer', email: 'Logged in developer', isNew: true });
          } catch {
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
      }
    }
    checkAuth();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  // Extract GitHub username for avatar if available
  let githubHandle = null;
  if (currentUser?.social_links) {
    const match = currentUser.social_links.match(/github:([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      githubHandle = match[1];
    }
  }
  const avatarSrc = githubHandle ? `https://github.com/${githubHandle}.png` : null;

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
            /* Logged In State: NO Get Started button. Show Profile Icon with Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 transition-all focus:outline-none"
                aria-label="User menu"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full object-cover border border-cyan-500/50"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-sm flex items-center justify-center ${
                    avatarSrc ? 'hidden' : 'flex'
                  }`}
                >
                  {currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-200 pr-1.5 hidden lg:inline">
                  @{currentUser.username}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 pr-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border-slate-800 shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">@{currentUser.username}</p>
                    {currentUser.email && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href={`/profile/${currentUser.username}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800/70 hover:text-white transition-colors"
                    >
                      <span>👤</span> View Profile
                    </Link>

                    <Link
                      href="/profile/edit"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800/70 hover:text-white transition-colors"
                    >
                      <span>⚙️</span> Profile Settings
                    </Link>

                    <Link
                      href="/profile/edit#github"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-cyan-400 hover:bg-slate-800/70 transition-colors"
                    >
                      <span>🐙</span> GitHub Profile Sync
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors text-left"
                    >
                      <span>🚪</span> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out State: Show Log In & Get Started buttons */
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
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
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
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm text-blue-400 font-semibold py-1">
                <span>👤</span> @{currentUser.username}
              </div>
              <Link href={`/profile/${currentUser.username}`} className="text-slate-300 text-sm py-1">View Profile</Link>
              <Link href="/profile/edit" className="text-slate-300 text-sm py-1">Profile Settings</Link>
              <button onClick={logout} className="text-left text-red-400 text-sm py-1">Log Out</button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <Link href="/login" className="flex-1 text-center py-2 bg-slate-800 rounded-lg text-sm">Log In</Link>
              <Link href="/register" className="flex-1 text-center py-2 gradient-button text-sm rounded-lg">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
