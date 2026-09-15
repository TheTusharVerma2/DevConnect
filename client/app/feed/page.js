'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // Runs once when the page loads, to fetch the initial feed
  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const data = await apiRequest('/posts');
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    setError('');

    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setContent('');
      loadFeed(); // refresh the feed to show the new post
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-4">Feed</h1>

      <form onSubmit={handleCreatePost} className="flex flex-col gap-2 mb-6">
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Post
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div key={post.id} className="border p-4 rounded">
            <p className="font-semibold">@{post.username}</p>
            <p>{post.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}