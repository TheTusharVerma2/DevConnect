'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function ViewProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/profile/${username}`);
        setProfile(data.profile);
      } catch (err) {
        setError(err.message);
      }
    }
    loadProfile();
  }, [username]);

  if (error) return <p className="text-red-500 text-center mt-20">{error}</p>;
  if (!profile) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold">@{profile.username}</h1>
      {profile.bio && <p className="mt-2">{profile.bio}</p>}
      {profile.skills && (
        <p className="mt-2 text-sm text-gray-600">Skills: {profile.skills}</p>
      )}
    </div>
  );
}