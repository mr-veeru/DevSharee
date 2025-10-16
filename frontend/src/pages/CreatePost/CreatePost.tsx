/**
 * Create Post Page Component
 * 
 * Page for creating and sharing new posts with the developer community.
 * Features project title, description, tags, GitHub URL, and media uploads.
 * 
 * @returns {JSX.Element} Create post page component
 */

import React, { useState, useRef } from 'react';
import { FaImage, FaHashtag, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './CreatePost.css';

interface PostData {
  title: string;
  description: string;
  tags: string[];
  githubUrl: string;
  mediaFiles: File[];
}

const CreatePost: React.FC = () => {
  const [postData, setPostData] = useState<PostData>({
    title: '',
    description: '',
    tags: [],
    githubUrl: '',
    mediaFiles: []
  });
  
  const [currentTech, setCurrentTech] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const handleInputChange = (field: keyof PostData, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTech = () => {
    if (currentTech.trim() && !postData.tags.includes(currentTech.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTech.trim()]
      }));
      setCurrentTech('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Store files for upload with the post
    const newFiles = Array.from(files);
    setPostData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...newFiles]
    }));
    
    showSuccess('Files selected! They will be uploaded when you create the post.');
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        showError('Please log in to create a post');
        return;
      }

      // Prepare form data for backend (multipart/form-data)
      const formData = new FormData();
      formData.append('title', postData.title.trim());
      formData.append('description', postData.description.trim());
      formData.append('github_link', postData.githubUrl.trim() || '');
      
      // Add tech_stack (technologies) as comma-separated string
      if (postData.tags.length === 0) {
        showError('Please add at least one technology to the tech stack');
        setIsSubmitting(false);
        return;
      }
      formData.append('tech_stack', postData.tags.join(','));
      
      // Add files
      postData.mediaFiles.forEach(file => {
        formData.append('files', file);
      });

      // Call backend API to create post
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        // Backend validation errors
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat();
          showError(errorMessages.join(', '));
        } else {
          showError(result.message || 'Failed to create post. Please try again.');
        }
        return;
      }
      
      showSuccess('Project posted successfully! 🎉');
      
      // Reset form
      setPostData({
        title: '',
        description: '',
        tags: [],
        githubUrl: '',
        mediaFiles: []
      });
      setCurrentTech('');
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      showError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
        <div className="page-container page-container--narrow">
          <div className="page-header">
            <div className="page-title">
              <span className="code-icon">&lt;/&gt;</span>
              <h1>Create Post</h1>
            </div>
            <p className="page-subtitle">Share your amazing projects with the developer community</p>
          </div>

      <div className="create-post-container">
        <form onSubmit={handleSubmit} className="create-post-form">

          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="post-title">Title *</label>
            <input
              id="post-title"
              type="text"
              placeholder="What's your post about?"
              value={postData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="title-input"
              maxLength={100}
            />
            <div className="char-count">{postData.title.length}/100</div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="post-description">Description *</label>
            <textarea
              id="post-description"
              placeholder="Describe your project, what it does, technologies used, and what makes it special..."
              value={postData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="content-textarea"
              rows={6}
            />
          </div>

          {/* GitHub URL */}
          <div className="form-group">
            <label htmlFor="github-url">GitHub URL</label>
            <input
              id="github-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={postData.githubUrl}
              onChange={(e) => handleInputChange('githubUrl', e.target.value)}
              className="title-input"
            />
          </div>

          {/* Tech Stack Input */}
          <div className="form-group">
            <label htmlFor="post-tags">Tech Stack *</label>
            <div className="tags-input-container">
              <div className="tags-display">
                {postData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {React.createElement(FaHashtag as any, { className: "tag-icon" })}
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      {React.createElement(FaTimes as any)}
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="post-tags"
                type="text"
                placeholder="Add technologies (press Enter or comma to add)"
                value={currentTech}
                onChange={(e) => setCurrentTech(e.target.value)}
                onKeyPress={handleKeyPress}
                className="tags-input"
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="form-group">
            <label>Media (Optional)</label>
            <div className="media-upload">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
                disabled={isSubmitting}
              >
                {React.createElement(FaImage as any, { className: "icon" })}
                {isSubmitting ? 'Uploading...' : 'Upload Images/Videos'}
              </button>
              
              {postData.mediaFiles.length > 0 && (
                <div className="media-preview">
                  {postData.mediaFiles.map((file, index) => (
                    <div key={index} className="media-item">
                      <img src={URL.createObjectURL(file)} alt={`Upload ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = postData.mediaFiles.filter((_, i) => i !== index);
                          handleInputChange('mediaFiles', newFiles);
                        }}
                        className="media-remove"
                        disabled={isSubmitting}
                      >
                        {React.createElement(FaTimes as any)}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Creating Post...
                </>
              ) : (
                <>
                  {React.createElement(FaPaperPlane as any, { className: "icon" })}
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;