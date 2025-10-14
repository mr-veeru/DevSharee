/**
 * Profile Page Component
 * 
 * User profile page for viewing and managing account information.
 * Currently shows placeholder content.
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.user] - User data object (optional)
 * @param {string} [props.user.username] - User's username
 * @param {string} [props.user.email] - User's email address
 * @returns {JSX.Element} Profile page component
 */

import React from 'react';
import LetterAvatar from '../../common/LetterAvatar';
import './Profile.css';

interface User {
  username: string;
  email: string;
}

interface ProfileProps {
  user?: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user = null }) => {
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-title">
          <span className="code-icon">&lt;/&gt;</span>
          <h1>Profile</h1>
        </div>
        <p className="profile-subtitle">Manage your profile and account settings</p>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <LetterAvatar name={user?.username || 'User'} size="large" />
          <div className="profile-details">
            <h2>{user?.username || 'User'}</h2>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <div className="coming-soon">
          <h2>Profile Settings Coming Soon</h2>
          <p>This page will allow you to manage your profile and account settings.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
