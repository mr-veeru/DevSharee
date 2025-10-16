/**
 * Create Post Page Component
 * 
 * Page for creating and sharing new posts with the developer community.
 * Currently shows placeholder content.
 * 
 * @returns {JSX.Element} Create post page component
 */

import React from 'react';
import './CreatePost.css';

const CreatePost: React.FC = () => {
  return (
        <div className="page-container page-container--narrow">
          <div className="page-header">
            <div className="page-title">
              <span className="code-icon">&lt;/&gt;</span>
              <h1>Create Post</h1>
            </div>
            <p className="page-subtitle">Share your amazing projects with the developer community</p>
          </div>

      <div className="coming-soon">
        <h2>Create Post Coming Soon</h2>
        <p>This page will allow you to create and share new posts.</p>
      </div>
    </div>
  );
};

export default CreatePost;