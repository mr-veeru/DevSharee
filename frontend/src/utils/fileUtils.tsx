/**
 * File Utility Functions and Components
 * 
 * Shared file handling utilities and components used across multiple pages.
 * Eliminates code duplication between CreatePost and Feed components.
 * All file-related functionality is centralized here.
 */

import React from 'react';
import { FaTimes } from 'react-icons/fa';


/**
 * Get appropriate file icon based on filename and content type
 */
export const getFileIcon = (filename: string, contentType: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Check by content type first for more reliable detection
  if (contentType.includes('image')) return '🖼️';
  if (contentType.includes('video')) return '🎥';
  if (contentType.includes('audio')) return '🎵';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
  if (contentType.includes('text')) return '📝';
  
  // Fallback to file extension
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'txt':
    case 'md':
    case 'readme':
      return '📝';
    case 'json':
    case 'xml':
      return '📋';
    case 'zip':
    case 'rar':
    case '7z':
      return '📦';
    case 'py':
      return '🐍';
    case 'js':
    case 'jsx':
      return '📜';
    case 'ts':
    case 'tsx':
      return '📘';
    case 'html':
      return '🌐';
    case 'css':
      return '🎨';
    case 'java':
      return '☕';
    case 'cpp':
    case 'c':
    case 'h':
      return '⚙️';
    case 'php':
      return '🐘';
    case 'sql':
      return '🗄️';
    case 'yaml':
    case 'yml':
      return '⚙️';
    case 'sh':
    case 'bat':
      return '💻';
    case 'exe':
    case 'msi':
      return '⚙️';
    case 'doc':
    case 'docx':
      return '📄';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📊';
    default:
      return '📁';
  }
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Extract original filename from stored filename
 * Handles cases where filename is stored as "UUID_originalname.ext"
 */
export const getDisplayFilename = (filename: string): string => {
  // Check if filename contains UUID prefix (36 chars + underscore)
  if (filename.includes('_') && filename.length > 36) {
    // Check if the first part looks like a UUID (36 characters)
    const potentialUuid = filename.substring(0, 36);
    if (potentialUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return filename.substring(37); // Remove UUID_ prefix
    }
  }
  return filename;
};

/**
 * File Preview Component Interface
 */
interface FilePreviewProps {
  // File information
  filename: string;
  contentType: string;
  size?: number;
  // Actions
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

/**
 * Simple File Preview Component
 * 
 * Simple file preview component based on CreatePost pattern.
 * Shows file icon and basic info without complex loading states.
 * 
 * Features:
 * - File icon based on file type
 * - File name and size display
 * - Remove functionality (optional)
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  filename,
  contentType,
  size,
  onRemove,
  showRemove = false,
  className = ''
}) => {
  const displayName = getDisplayFilename(filename);

  return (
    <div className={`file-preview-container ${className}`}>
      <div className="file-preview-content">
        <div className="file-icon">
          {getFileIcon(filename, contentType)}
        </div>
        <div className="file-info">
          <div className="file-name" title={filename}>
            {displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName}
          </div>
          {size && (
            <div className="file-size">
              {formatFileSize(size)}
            </div>
          )}
        </div>
      </div>

      {showRemove && onRemove && (
        <button
          className="file-remove"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          title="Remove file"
        >
          {React.createElement(FaTimes as any, { className: "icon" })}
        </button>
      )}
    </div>
  );
};
