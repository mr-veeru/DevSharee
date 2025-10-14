/**
 * Feed Page Component
 * 
 * Main feed page displaying posts from the developer community.
 * Currently shows placeholder content.
 * 
 * @returns {JSX.Element} Feed page component
 */

import React from 'react';
import './Feed.css';

const Feed: React.FC = () => {
  return (
        <div className="page-container">
          <div className="page-header">
            <div className="page-title">
              <span className="code-icon">&lt;/&gt;</span>
              <h1>DevShare Feed</h1>
            </div>
            <p className="page-subtitle">Discover amazing projects from the developer community</p>
          </div>

      <div className="coming-soon">
        <h2>Feed Coming Soon</h2>
        <p>This page will display posts from the developer community.</p>
      </div>
    </div>
  );
};

export default Feed;
