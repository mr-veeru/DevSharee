/**
 * Profile Page Component
 * 
 * Comprehensive user profile page displaying user information and their posts.
 * Features user stats, bio, and a feed of their posts using PostCard component.
 * 
 * @returns {JSX.Element} Profile page component
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaCalendarAlt, FaCode, FaHeart, FaPlus, FaHashtag, FaTimes, FaImage, FaPaperPlane } from 'react-icons/fa';
import LetterAvatar from '../../components/common/LetterAvatar';
import PostCard from '../../components/common/PostCard';
import { FilePreview } from '../../utils/fileUtils';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tech_stack: [] as string[],
    github_link: '',
    files: [] as File[],
    existingFiles: [] as Array<{ file_id: string; filename: string; content_type: string; size: number }>
  });
  const [currentTech, setCurrentTech] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshProfileData = async () => {
    try {
      const response = await authenticatedFetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000'}/api/profile`);
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000'}/api/profile`);
        
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
        const response = await authenticatedFetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000'}/api/profile/posts`);
        
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
    window.open(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000'}/api/files/${file.file_id}/download`, '_blank');
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditData({
      title: post.title,
      description: post.description,
      tech_stack: post.tech_stack || [],
      github_link: post.github_link || '',
      files: [],
      existingFiles: post.files || []
    });
    setCurrentTech('');
    setShowEditModal(true);
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
      const response = await authenticatedFetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000'}/api/profile/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove the deleted post from the local state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        // Refresh profile data to update stats
        await refreshProfileData();
        showSuccess('Post deleted successfully!');
      } else {
        showError('Failed to delete post');
      }
    } catch (error) {
      showError('Error deleting post');
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

  // Edit modal handlers
  const handleEditInputChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTech = () => {
    if (currentTech.trim() && !editData.tech_stack.includes(currentTech.trim())) {
      setEditData(prev => ({
        ...prev,
        tech_stack: [...prev.tech_stack, currentTech.trim()]
      }));
      setCurrentTech('');
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.filter(tech => tech !== techToRemove)
    }));
  };

  const handleTechKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setEditData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles]
    }));
    
    showSuccess('Files selected! They will be uploaded when you update the post.');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setEditData(prev => ({
      ...prev,
      existingFiles: prev.existingFiles.filter(file => file.file_id !== fileId)
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing || !editingPost) return;
    
    setIsEditing(true);
    
    try {
      const formData = new FormData();
      formData.append('title', editData.title.trim());
      formData.append('description', editData.description.trim());
      formData.append('github_link', editData.github_link.trim() || '');
      
      if (editData.tech_stack.length === 0) {
        showError('Please add at least one technology to the tech stack');
        setIsEditing(false);
        return;
      }
      // Send tech_stack as individual array items
      editData.tech_stack.forEach(tech => {
        formData.append('tech_stack', tech);
      });
      
      editData.files.forEach(file => {
        formData.append('files', file);
      });

      editData.existingFiles.forEach(file => {
        formData.append('existing_files', file.file_id);
      });

      const response = await authenticatedFetch(`${API_BASE}/api/profile/posts/${editingPost.id}`, {
        method: 'PUT',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat();
          showError(errorMessages.join(', '));
        } else {
          showError(result.message || 'Failed to update post. Please try again.');
        }
        return;
      }
      
      showSuccess('Post updated successfully! 🎉');
      setShowEditModal(false);
      
      // Refresh posts and profile data
      await refreshProfileData();
      const postsResponse = await authenticatedFetch(`${API_BASE}/api/profile/posts`);
      if (postsResponse.ok) {
        const data = await postsResponse.json();
        setPosts(data.posts || []);
      }
      
    } catch (error) {
      showError('An error occurred while updating the post. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditData({
      title: '',
      description: '',
      tech_stack: [],
      github_link: '',
      files: [],
      existingFiles: []
    });
    setCurrentTech('');
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
                onLikeToggle={handleLikeToggle}
                currentUserId={currentUserId || undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPost && (
        <div className="edit-modal-overlay" onClick={handleCloseEditModal}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Edit Post</h3>
              <button className="close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="edit-modal-content">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="edit-title">Project Title *</label>
                <input
                  type="text"
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) => handleEditInputChange('title', e.target.value)}
                  placeholder="Enter your project title..."
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="edit-description">Project Description *</label>
                <textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  placeholder="Describe your project..."
                  required
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {/* Tech Stack */}
              <div className="form-group">
                <label htmlFor="edit-tech">Tech Stack *</label>
                <div className="tech-input-container">
                  <input
                    type="text"
                    id="edit-tech"
                    value={currentTech}
                    onChange={(e) => setCurrentTech(e.target.value)}
                    onKeyPress={handleTechKeyPress}
                    placeholder="Add technologies..."
                  />
                  <button type="button" onClick={handleAddTech} className="add-tech-btn">
                    {React.createElement(FaHashtag as any)}
                  </button>
                </div>
                <div className="tech-tags">
                  {editData.tech_stack.map((tech, index) => (
                    <span key={index} className="tech-tag">
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="remove-tag"
                      >
                        {React.createElement(FaTimes as any)}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* GitHub URL */}
              <div className="form-group">
                <label htmlFor="edit-github">GitHub Repository (Optional)</label>
                <input
                  type="url"
                  id="edit-github"
                  value={editData.github_link}
                  onChange={(e) => handleEditInputChange('github_link', e.target.value)}
                  placeholder="https://github.com/username/repository"
                />
              </div>

              {/* Existing Files */}
              {editData.existingFiles.length > 0 && (
                <div className="form-group">
                  <label>Current Files</label>
                  <div className="existing-files">
                    {editData.existingFiles.map((file) => (
                      <div key={file.file_id} className="existing-file-item">
                        <FilePreview
                          filename={file.filename}
                          contentType={file.content_type}
                          size={file.size}
                          onRemove={() => handleRemoveExistingFile(file.file_id)}
                          showRemove={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files */}
              <div className="form-group">
                <label htmlFor="edit-files">Add New Files (Optional)</label>
                <div className="file-upload-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="edit-files"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    className="file-input"
                  />
                  <label htmlFor="edit-files" className="file-upload-btn">
                    {React.createElement(FaImage as any)}
                    Choose Files
                  </label>
                </div>
                {editData.files.length > 0 && (
                  <div className="selected-files">
                    {editData.files.map((file, index) => (
                      <div key={index} className="selected-file">
                        <FilePreview
                          filename={file.name}
                          contentType={file.type}
                          size={file.size}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="edit-modal-actions">
                <button type="button" onClick={handleCloseEditModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={isEditing} className="submit-btn">
                  {isEditing ? (
                    <>
                      <div className="spinner"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      {React.createElement(FaPaperPlane as any)}
                      Update Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
