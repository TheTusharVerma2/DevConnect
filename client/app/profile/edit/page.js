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
        }
      } catch (err) {
        setIsExisting(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isExisting) {
        await apiRequest('/profile', {
          method: 'PUT',
          body: JSON.stringify({
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
            username,
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
        router.push(`/profile/${username}`);
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Username {!isExisting && <span className="text-red-400">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-mono">@</span>
            <input
              type="text"
              placeholder="octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isExisting}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-60"
              required
            />
          </div>
          {isExisting && (
            <p className="text-[11px] text-slate-500 mt-1">Username cannot be changed once created.</p>
          )}
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
