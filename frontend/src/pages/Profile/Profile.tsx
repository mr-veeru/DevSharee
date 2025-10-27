/**
 * Profile Page
 * 
 * User profile displaying user information, statistics, and their posts.
 * Allows post editing and deletion with inline modal forms.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaCalendarAlt, FaCode, FaHeart, FaPlus } from 'react-icons/fa';
import LetterAvatar from '../../components/common/LetterAvatar';
import PostCard from '../../components/common/PostCard';
import { authenticatedFetch, API_BASE } from '../../utils/auth';
import { useToast } from '../../components/common/Toast';
import { User, Post } from '../../types';
import './Profile.css';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const refreshProfileData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/profile`);
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {
      showError('Error refreshing profile data');
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`${API_BASE}/api/profile`);
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setCurrentUserId(userData.id);
        } else {
          showError('Failed to load profile data');
        }
      } catch (error) {
        showError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [showError]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id) return;

      try {
        setPostsLoading(true);
        const response = await authenticatedFetch(`${API_BASE}/api/profile/posts`);
        
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        } else {
          showError('Failed to load user posts');
        }
      } catch (error) {
        showError('Error loading posts');
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [user?.id, showError]);

  const handleFileDownload = (post: Post, file: { file_id: string; filename: string; content_type: string }) => {
    window.open(`${API_BASE}/api/files/${file.file_id}/download`, '_blank');
  };

  const handleEditPost = (post: Post) => {
    // No-op - inline editing is handled in PostCard
  };

  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + (isLiked ? 1 : -1) }
          : post
      )
    );
    await refreshProfileData();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/profile/posts/${postId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove the deleted post from the local state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        // Refresh profile data to update stats
        await refreshProfileData();
        // Use success message from backend
        showSuccess(result.message || 'Post deleted successfully!');
      } else {
        showError(result.message || 'Failed to delete post');
      }
    } catch (error) {
      showError('Error deleting post');
    }
  };

  const handlePostUpdated = async (updatedPost: Post) => {
    // Update local state immediately
    setPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
    
    // Refresh posts from backend to ensure we have the latest data
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/profile/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      // Silently fail - we already updated the UI with the response
    }
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const handleCreatePost = () => {
    navigate('/create');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
  return (
    <div className="profile-container">
        <div className="error-state">
          <h2>Profile Not Found</h2>
          <p>Unable to load profile data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* User Info Section */}
      <div className="profile-info-section">
        <div className="profile-main-info">
          <LetterAvatar name={user.username} size="large" />
          <div className="profile-details">
            <h2 className="profile-username">{user.username}</h2>
                  <p className="profile-email">
                    {React.createElement(FaEnvelope as any, { className: "profile-icon" })}
                    {user.email}
                  </p>
                  <p className="profile-join-date">
                    {React.createElement(FaCalendarAlt as any, { className: "profile-icon" })}
                    Joined {formatDate(user.created_at)}
                  </p>
          </div>
        </div>

        {/* User Stats */}
        <div className="profile-stats">
        <div className="stat-item">
          {React.createElement(FaCode as any, { className: "stat-icon" })}
          <div className="stat-content">
            <span className="stat-number">{user.posts_count || posts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
        </div>
        <div className="stat-item">
          {React.createElement(FaHeart as any, { className: "stat-icon" })}
          <div className="stat-content">
            <span className="stat-number">{user.likes_received || 0}</span>
            <span className="stat-label">Likes Received</span>
          </div>
        </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-posts-section">
        <div className="posts-header">
          <div className="posts-title-section">
          <h3>
            {React.createElement(FaCode as any, { className: "posts-icon" })}
            My Posts
          </h3>
            <span className="posts-count">{posts.length} posts</span>
          </div>
          <button className="create-post-btn" onClick={handleCreatePost}>
            {React.createElement(FaPlus as any, { className: "create-icon" })}
            Create New Post
          </button>
        </div>

        {postsLoading ? (
          <div className="posts-loading">
            <div className="loading-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
        <div className="no-posts">
          {React.createElement(FaCode as any, { className: "no-posts-icon" })}
          <h4>No Posts Yet</h4>
          <p>You haven't created any posts yet. Start sharing your projects!</p>
          <button className="create-post-btn no-posts-btn" onClick={handleCreatePost}>
            {React.createElement(FaPlus as any, { className: "create-icon" })}
            Create Your First Post
          </button>
        </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onFileDownload={handleFileDownload}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onPostUpdated={handlePostUpdated}
                onLikeToggle={handleLikeToggle}
                currentUserId={currentUserId || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
