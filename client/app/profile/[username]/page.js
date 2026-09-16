'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function ViewProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState('');
  const [followMsg, setFollowMsg] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/profile/${username}`);
        setProfile(data.profile);
        setIsFollowing(data.profile.is_following || false);
        setFollowersCount(data.profile.followers_count || 0);

        // Extract github username from social_links or fallback to profile username
        let githubUser = username;
        if (data.profile.social_links) {
          const match = data.profile.social_links.match(/github:([a-zA-Z0-9_-]+)/i);
          if (match && match[1]) {
            githubUser = match[1];
          }
        }

        fetchGitHubRepos(githubUser);
      } catch (err) {
        setError(err.message);
      }
    }
    loadProfile();
  }, [username]);

  async function fetchGitHubRepos(githubUsername) {
    setLoadingRepos(true);
    try {
      const data = await apiRequest(`/github/${githubUsername}/repos`);
      if (Array.isArray(data)) {
        setRepos(data);
      }
    } catch (err) {
      console.warn('GitHub repos fetch error:', err.message);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function handleFollowToggle() {
    try {
      if (isFollowing) {
        await apiRequest(`/profile/${username}/follow`, { method: 'DELETE' });
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        setFollowMsg('Unfollowed');
      } else {
        await apiRequest(`/profile/${username}/follow`, { method: 'POST' });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        setFollowMsg('Followed successfully!');
      }
    } catch (err) {
      setFollowMsg(err.message);
    }
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-2xl text-center text-red-400">
        <h2 className="text-xl font-bold mb-2">Profile Error</h2>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20 text-slate-400">Loading developer profile...</div>;
  }

  const skillsList = profile.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8">
      
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-8 border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              {profile.username[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">@{profile.username}</h1>
              {profile.bio && <p className="text-sm text-slate-300 mt-1 max-w-lg">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                <span><strong className="text-white">{followersCount}</strong> Followers</span>
                <span><strong className="text-white">{profile.following_count || 0}</strong> Following</span>
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <div>
            <button
              onClick={handleFollowToggle}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isFollowing
                  ? 'bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-200 border border-slate-700'
                  : 'gradient-button text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isFollowing ? 'Following ✓' : '+ Follow'}
            </button>
            {followMsg && <p className="text-xs text-slate-400 mt-1 text-center">{followMsg}</p>}
          </div>
        </div>

        {/* Skills Pills */}
        {skillsList.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills &amp; Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-300 text-xs font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Experience & Education Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Experience */}
        <div className="glass-card rounded-2xl p-6 border-slate-800">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-3">
            <span>💼</span> Experience
          </h3>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {profile.experience || 'No experience details provided.'}
          </p>
        </div>

        {/* Education */}
        <div className="glass-card rounded-2xl p-6 border-slate-800">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-3">
            <span>🎓</span> Education
          </h3>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {profile.education || 'No education details provided.'}
          </p>
        </div>

      </div>

      {/* GitHub Repositories Showcase */}
      <div className="glass-card rounded-3xl p-8 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="text-2xl">🐙</span> Public GitHub Repositories
          </h2>
          <span className="text-xs text-slate-400 font-mono">Synced from GitHub</span>
        </div>

        {loadingRepos ? (
          <p className="text-sm text-slate-400">Fetching GitHub repositories...</p>
        ) : repos.length === 0 ? (
          <p className="text-sm text-slate-400">No public GitHub repositories found for this user.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card glass-card-hover p-4 rounded-xl border-slate-800 block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-400 group-hover:underline truncate max-w-[200px]">
                    {repo.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    {repo.language && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {repo.language}
                      </span>
                    )}
                    <span>⭐ {repo.stargazers_count}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {repo.description || 'No description provided.'}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}