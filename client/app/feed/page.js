'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'following'
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Post composer state
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [error, setError] = useState('');

  // Comment state
  const [openComments, setOpenComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  useEffect(() => {
    loadInitialFeed(activeTab);
  }, [activeTab]);

  async function loadInitialFeed(tab) {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'following' ? '/posts/feed' : '/posts';
      const data = await apiRequest(endpoint);
      setPosts(data.posts || []);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const endpoint = activeTab === 'following'
        ? `/posts/feed?cursor=${encodeURIComponent(nextCursor)}`
        : `/posts?cursor=${encodeURIComponent(nextCursor)}`;
      const data = await apiRequest(endpoint);
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmittingPost(true);

    try {
      let image_url = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadData = await apiRequest('/posts/upload-image', {
          method: 'POST',
          body: formData,
        });
        image_url = uploadData.imageUrl;
      }

      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ content, image_url }),
      });

      setContent('');
      clearImage();
      loadInitialFeed(activeTab);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleToggleLike(postId, currentlyLiked) {
    try {
      if (currentlyLiked) {
        await apiRequest(`/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await apiRequest(`/posts/${postId}/like`, { method: 'POST' });
      }

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              is_liked: !currentlyLiked,
              likes_count: currentlyLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
            };
          }
          return p;
        })
      );
    } catch (err) {
      // ignore
    }
  }

  async function toggleComments(postId) {
    const isOpen = openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }));

    if (!isOpen && !commentsMap[postId]) {
      try {
        const data = await apiRequest(`/posts/${postId}/comments`);
        setCommentsMap((prev) => ({ ...prev, [postId]: data.comments || [] }));
      } catch (err) {
        setError(err.message);
      }
    }
  }

  async function handleAddComment(postId, parentCommentId = null) {
    const text = parentCommentId ? replyInputs[parentCommentId] : commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      await apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim(), parent_comment_id: parentCommentId }),
      });

      if (parentCommentId) {
        setReplyInputs((prev) => ({ ...prev, [parentCommentId]: '' }));
        setActiveReplyId(null);
      } else {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }

      // Refresh comments
      const data = await apiRequest(`/posts/${postId}/comments`);
      setCommentsMap((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (err) {
      setError(err.message);
    }
  }

  function renderComments(list, postId) {
    return list.map((c) => (
      <div key={c.id} className="ml-3 mt-3 border-l-2 border-slate-800 pl-3 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/profile/${c.username}`} className="font-semibold text-blue-400 hover:underline">
            @{c.username}
          </Link>
          <span className="text-[10px] text-slate-500">
            {new Date(c.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-slate-200">{c.content}</p>

        {/* Reply Trigger */}
        <button
          onClick={() => setActiveReplyId(activeReplyId === c.id ? null : c.id)}
          className="text-xs text-slate-400 hover:text-slate-200 mt-1 font-medium"
        >
          Reply
        </button>

        {/* Reply input box */}
        {activeReplyId === c.id && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder={`Reply to @${c.username}...`}
              value={replyInputs[c.id] || ''}
              onChange={(e) => setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-100"
            />
            <button
              onClick={() => handleAddComment(postId, c.id)}
              className="gradient-button text-xs text-white px-3 py-1 rounded-lg"
            >
              Send
            </button>
          </div>
        )}

        {/* Nested replies */}
        {c.replies?.length > 0 && renderComments(c.replies, postId)}
      </div>
    ));
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      
      {/* Feed Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('global')}
            className={`text-sm font-semibold pb-1.5 transition-all ${
              activeTab === 'global'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Global Feed
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`text-sm font-semibold pb-1.5 transition-all ${
              activeTab === 'following'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Post Composer Card */}
      <div className="glass-card rounded-2xl p-5 mb-8 border-slate-800">
        <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
          <textarea
            placeholder="What code or technical update are you working on today?"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            required
          />

          {imagePreview && (
            <div className="relative inline-block mt-1">
              <img src={imagePreview} alt="upload preview" className="max-h-48 rounded-xl border border-slate-700" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-900 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              <span className="text-base">🖼️</span>
              <span>{imageFile ? imageFile.name : 'Attach Image'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={submittingPost}
              className="gradient-button text-xs font-semibold text-white px-5 py-2 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submittingPost ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed Posts List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-slate-400">
          <p className="text-lg font-medium text-slate-300">No posts found</p>
          <p className="text-xs mt-1">
            {activeTab === 'following'
              ? 'You are not following anyone yet or they have not posted.'
              : 'Be the first developer to share something on DevConnect!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <div key={post.id} className="glass-card glass-card-hover rounded-2xl p-6 border-slate-800">
              
              {/* User Header */}
              <div className="flex items-center justify-between mb-3">
                <Link href={`/profile/${post.username}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm flex items-center justify-center">
                    {post.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                      @{post.username}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Post Content */}
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">
                {post.content}
              </p>

              {/* Attached Image */}
              {post.image_url && (
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-800">
                  <img src={post.image_url} alt="post media" className="w-full max-h-96 object-cover" />
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <button
                  onClick={() => handleToggleLike(post.id, post.is_liked)}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    post.is_liked ? 'text-red-400' : 'hover:text-red-400'
                  }`}
                >
                  <span>{post.is_liked ? '❤️' : '🤍'}</span>
                  <span>{post.likes_count || 0} Likes</span>
                </button>

                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 hover:text-blue-400 font-medium transition-colors"
                >
                  <span>💬</span>
                  <span>Comments</span>
                </button>
              </div>

              {/* Comments Section Drawer */}
              {openComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {commentsMap[post.id]?.length > 0 ? (
                    renderComments(commentsMap[post.id], post.id)
                  ) : (
                    <p className="text-xs text-slate-500 mb-3">No comments yet. Start the conversation!</p>
                  )}

                  {/* Add top-level comment input */}
                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="gradient-button text-xs text-white font-medium px-4 py-1.5 rounded-xl"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}

          {/* Cursor Load More */}
          {nextCursor && (
            <div className="text-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="glass-card hover:bg-slate-800 text-slate-300 text-xs font-semibold px-6 py-2.5 rounded-xl border border-slate-700 transition-all"
              >
                {loadingMore ? 'Loading older posts...' : 'Load More Posts'}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}