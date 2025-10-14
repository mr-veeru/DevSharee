/**
 * LetterAvatar Component
 * 
 * A reusable avatar component that displays user initials in a colored circle.
 * Uses a gradient background based on the first letter of the name.
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - User's name to extract initials from
 * @param {string} [props.size] - Size of the avatar ('small', 'medium', 'large')
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} LetterAvatar component
 */

import React from 'react';
import './LetterAvatar.css';

interface LetterAvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LetterAvatar: React.FC<LetterAvatarProps> = ({ 
  name, 
  size = 'medium', 
  className = '' 
}) => {
  // Extract first letter and convert to uppercase
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  
  // Fixed color palette, mapped by first letter
  const getSolidColor = (letter: string) => {
    const palette = [
      '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
      '#06b6d4', '#a855f7', '#10b981', '#3b82f6',
      '#eab308', '#f43f5e', '#14b8a6', '#8b5cf6'
    ];
    const index = letter.charCodeAt(0) % palette.length;
    return palette[index];
  };

  return (
    <div 
      className={`letter-avatar letter-avatar--${size} ${className}`}
      style={{ background: getSolidColor(initial) }}
    >
      <span className="letter-avatar__initial">{initial}</span>
    </div>
  );
};

export default LetterAvatar;
