'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function CreateProfilePage() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await apiRequest('/profile', {
        method: 'POST',
        body: JSON.stringify({ username, bio, skills }),
      });
      router.push(`/profile/${username}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Create Your Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Skills (e.g. JS, React, Node)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="border p-2 rounded"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Create Profile
        </button>
      </form>
    </div>
  );
}