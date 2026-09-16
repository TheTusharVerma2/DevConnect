'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState({ posts: [], profiles: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam]);

  async function performSearch(searchTerm) {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      
      {/* Search Bar Header */}
      <div className="glass-card rounded-3xl p-8 border-slate-800 mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Search DevConnect</h1>
        <p className="text-sm text-slate-400 mb-6">
          Find developers by name, technical skills, bio, or explore community discussions.
        </p>

        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Search keywords (e.g., react, database, alex)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="gradient-button text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Section */}
      {loading ? (
        <p className="text-center py-12 text-slate-400">Searching database...</p>
      ) : error ? (
        <p className="text-center py-12 text-red-400">{error}</p>
      ) : searched ? (
        <div className="flex flex-col gap-8">
          
          {/* Developers Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span>👨‍💻</span> Developers ({results.profiles?.length || 0})
            </h2>

            {results.profiles?.length === 0 ? (
              <p className="text-sm text-slate-500">No developer profiles matched your query.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.profiles.map((prof) => (
                  <Link
                    key={prof.id}
                    href={`/profile/${prof.username}`}
                    className="glass-card glass-card-hover p-4 rounded-xl border-slate-800 flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center">
                      {prof.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                        @{prof.username}
                      </h4>
                      {prof.bio && <p className="text-xs text-slate-400 line-clamp-1">{prof.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Posts Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span>📝</span> Posts ({results.posts?.length || 0})
            </h2>

            {results.posts?.length === 0 ? (
              <p className="text-sm text-slate-500">No posts matched your query.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {results.posts.map((post) => (
                  <div key={post.id} className="glass-card p-5 rounded-xl border-slate-800">
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{post.content}</p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
}
