/**
 * File Utility Functions and Components
 * 
 * Provides shared file handling utilities for icon detection, size formatting,
 * download URLs, and filename extraction. Includes a reusable FilePreview component.
 */

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { API_BASE } from './auth';

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
    case 'txt':
    case 'md':
    case 'readme':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'pdf':
      return '📕';
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
    case 'cpp':
    case 'c':
    case 'h':
    case 'java':
    case 'php':
      return '💡'; 
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'env':
      return '⚙️';
    case 'exe':
    case 'msi':
    case 'sh':
    case 'bat':
      return '💻';
    case 'sql':
      return '🗄️';
    case 'zip':
    case 'rar':
    case '7z':
      return '📦';  
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📽️';
    default:
      return '📁'; // Default fallback
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileDownloadUrl = (postId: string, fileId: string): string => {
  return `${API_BASE}/api/feed/posts/${postId}/files/${fileId}`;
};

export const getDisplayFilename = (filename: string): string => {
  // Handle undefined or null filename
  if (!filename) return 'Unknown File';
  
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

interface FilePreviewProps {
  // File information
  filename: string;
  contentType: string;
  size?: number;
  // Actions
  onDownload?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  filename,
  contentType,
  size,
  onDownload,
  onRemove,
  showRemove = false,
  className = ''
}) => {
  // Handle undefined/null values gracefully
  const safeFilename = filename || 'Unknown File';
  const safeContentType = contentType || 'application/octet-stream';
  const displayName = getDisplayFilename(safeFilename);

  return (
    <div className={`file-preview-container ${className}`}>
      <div className="file-preview-content">
        <div className="file-icon">
          {getFileIcon(safeFilename, safeContentType)}
        </div>
        <div className="file-info">
          <div className="file-name" title={safeFilename}>
            {displayName.length > 30 ? displayName.substring(0, 30) + '...' : displayName}
          </div>
          {size && (
            <div className="file-size">
              {formatFileSize(size)}
            </div>
          )}
        </div>
        {onDownload && (
          <button 
            className="file-download-btn"
            onClick={onDownload}
            title="Download file"
          >
            ⬇️
          </button>
        )}
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
