'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function EditProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [githubUsernameInput, setGithubUsernameInput] = useState('');
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [githubSyncMsg, setGithubSyncMsg] = useState('');

  const [isExisting, setIsExisting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest('/profile/me');
        if (data.profile) {
          setIsExisting(true);
          setUsername(data.profile.username || '');
          setBio(data.profile.bio || '');
          setSkills(data.profile.skills || '');
          setExperience(data.profile.experience || '');
          setEducation(data.profile.education || '');
          setSocialLinks(data.profile.social_links || '');

          if (data.profile.social_links) {
            const match = data.profile.social_links.match(/github:([a-zA-Z0-9_-]+)/i);
            if (match && match[1]) {
              setGithubUsernameInput(match[1]);
            }
          }
        }
      } catch (err) {
        setIsExisting(false);
      }
    }
    loadProfile();
  }, []);

  async function handleGithubSync() {
    const rawInput = githubUsernameInput.trim();
    if (!rawInput) {
      setGithubSyncMsg('⚠️ Please enter a GitHub username first.');
      return;
    }

    // Strip URL prefixes if user pasted full profile link or @
    const cleanUsername = rawInput
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^@/, '')
      .replace(/\/$/, '')
      .trim();

    setGithubSyncMsg('');
    setSyncingGithub(true);
    try {
      let data;
      try {
        data = await apiRequest('/github/sync', {
          method: 'POST',
          body: JSON.stringify({ 
            githubUsername: cleanUsername,
            username: username.trim() || undefined
          }),
        });
      } catch (serverErr) {
        // If server failed (e.g. rate limit on shared cloud IP), fetch directly from GitHub via client browser as fallback
        try {
          const ghUserRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
          if (!ghUserRes.ok) {
            if (ghUserRes.status === 404) {
              throw new Error(`GitHub user "@${cleanUsername}" not found.`);
            }
            throw new Error(serverErr.message || `GitHub returned status ${ghUserRes.status}`);
          }
          const githubData = await ghUserRes.json();

          let repos = [];
          try {
            const ghReposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=15`);
            if (ghReposRes.ok) {
              repos = await ghReposRes.json();
            }
          } catch {
            // Repos fetch is non-fatal
          }

          data = await apiRequest('/github/sync', {
            method: 'POST',
            body: JSON.stringify({
              githubUsername: cleanUsername,
              username: username.trim() || undefined,
              githubData,
              repos
            }),
          });
        } catch (fallbackErr) {
          throw new Error(fallbackErr.message || serverErr.message);
        }
      }

      if (data.profile) {
        setBio(data.profile.bio || '');
        setSkills(data.profile.skills || '');
        setSocialLinks(data.profile.social_links || '');
        if (data.profile.username && !username.trim()) {
          setUsername(data.profile.username);
        }
        setIsExisting(true);
      }

      setGithubSyncMsg(`✅ GitHub profile & repositories synced successfully for GitHub user @${cleanUsername}!`);
    } catch (err) {
      setGithubSyncMsg(`⚠️ GitHub sync failed: ${err.message}`);
    } finally {
      setSyncingGithub(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmedUsername = username.trim();

    try {
      if (isExisting) {
        await apiRequest('/profile', {
          method: 'PUT',
          body: JSON.stringify({
            username: trimmedUsername,
            bio,
            skills,
            experience,
            education,
            social_links: socialLinks,
          }),
        });
        setSuccess('Profile updated successfully!');
      } else {
        await apiRequest('/profile', {
          method: 'POST',
          body: JSON.stringify({
            username: trimmedUsername,
            bio,
            skills,
            experience,
            education,
            social_links: socialLinks,
          }),
        });
        setSuccess('Profile created successfully!');
        setIsExisting(true);
      }
      setTimeout(() => {
        router.push(`/profile/${trimmedUsername}`);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-8 glass-card rounded-2xl border-slate-800 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isExisting ? 'Edit Developer Profile' : 'Create Developer Profile'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Build your public developer resume, skills showcase, and GitHub links.
        </p>
      </div>

      {/* GitHub Sync Feature Card */}
      <div id="github" className="mb-8 p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🐙</span>
          <div>
            <h3 className="text-base font-semibold text-white">Sync Profile with GitHub</h3>
            <p className="text-xs text-slate-400">
              Auto-import bio, tech stack languages, and top repositories directly from your GitHub profile.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">github.com/</span>
            <input
              type="text"
              placeholder="username"
              value={githubUsernameInput}
              onChange={(e) => setGithubUsernameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-24 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleGithubSync}
            disabled={syncingGithub}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {syncingGithub ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              '⚡ Sync GitHub Data'
            )}
          </button>
        </div>

        {githubSyncMsg && (
          <p className="text-xs mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            {githubSyncMsg}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            DevConnect Username <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-mono">@</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            You can change your DevConnect username anytime. It is independent of your GitHub profile handle.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Bio / Headline
          </label>
          <textarea
            rows={3}
            placeholder="Full Stack Engineer passionate about React, Node.js, and high performance databases."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Technical Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Technical Skills (comma separated)
          </label>
          <input
            type="text"
            placeholder="JavaScript, TypeScript, React, Node.js, PostgreSQL, Redis, Docker"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Experience &amp; Work History
          </label>
          <textarea
            rows={3}
            placeholder="Senior Software Engineer @ Acme Corp (2024-Present) | Software Developer @ TechLabs (2022-2024)"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Education */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Education
          </label>
          <input
            type="text"
            placeholder="B.S. in Computer Science, Stanford University (2020-2024)"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Social & GitHub Links */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Social &amp; GitHub Profile
          </label>
          <input
            type="text"
            placeholder="github:octocat, twitter:octocat, linkedin:in/octocat"
            value={socialLinks}
            onChange={(e) => setSocialLinks(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Tip: Include <code className="text-cyan-400">github:yourusername</code> so your GitHub repositories automatically load on your profile page!
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
            ✅ {success}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="gradient-button flex-1 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isExisting ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>

      </form>
    </div>
  );
}
