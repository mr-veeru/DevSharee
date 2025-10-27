/**
 * Feed Page
 * 
 * Main feed displaying all posts from the developer community.
 * Features search with text highlighting, tech stack filtering, 
 * infinite scroll pagination, and post discovery.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaTimes, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import PostCard from '../../components/common/PostCard';
import { authenticatedFetch, API_BASE } from '../../utils/auth';
import './Feed.css';

// Import Post type from PostCard
type Post = Parameters<typeof PostCard>[0]['post'];

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [techFilters, setTechFilters] = useState<string[]>(['All']);
  const [currentOccurrence, setCurrentOccurrence] = useState(0);
  const [totalOccurrences, setTotalOccurrences] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showError } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Highlight search text in content
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : part
    );
  };

  // Count actual highlighted elements in DOM
  const countActualHighlights = (): number => {
    const highlights = document.querySelectorAll('.search-highlight');
    return highlights.length;
  };

  // Navigate to next/previous occurrence
  const navigateOccurrence = (direction: 'next' | 'prev') => {
    // Update count from actual DOM elements
    const actualCount = countActualHighlights();
    if (actualCount === 0) return;
    
    // Update total occurrences if it changed
    if (actualCount !== totalOccurrences) {
      setTotalOccurrences(actualCount);
    }
    
    let newIndex = currentOccurrence;
    if (direction === 'next') {
      newIndex = (currentOccurrence + 1) % actualCount;
    } else {
      newIndex = currentOccurrence === 0 ? actualCount - 1 : currentOccurrence - 1;
    }
    
    setCurrentOccurrence(newIndex);
    scrollToOccurrence(newIndex);
  };

  // Scroll to specific occurrence
  const scrollToOccurrence = (index: number) => {
    const highlights = document.querySelectorAll('.search-highlight');
    if (highlights[index]) {
      // Remove active class from all highlights first
      highlights.forEach(highlight => {
        highlight.classList.remove('search-highlight-active');
      });

      // Add active class to current highlight
      highlights[index].classList.add('search-highlight-active');

      // Scroll to the highlight
      highlights[index].scrollIntoView({
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Keep the active highlight permanently (no timeout)
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      navigateOccurrence('next');
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setCurrentOccurrence(0);
      setTotalOccurrences(0);
    }
  };

  // Fetch posts from backend with pagination
  const fetchPosts = useCallback(async (page: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await authenticatedFetch(`${API_BASE}/api/feed?page=${page}&limit=10`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            showError('Session expired. Please log in again.');
            return;
          }
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        const fetchedPosts = data.posts || [];
      
      if (reset) {
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
        
        // Generate tech filters from actual posts
        const allTechs = new Set<string>();
        fetchedPosts.forEach((post: Post) => {
          if (post.tech_stack) {
            post.tech_stack.forEach(tech => allTechs.add(tech));
          }
        });
        setTechFilters(['All', ...Array.from(allTechs).sort()]);
      } else {
        setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
        setFilteredPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      }
      
      setCurrentPage(page);
      setHasMore(page < (data.pagination?.pages || 1));
      } catch (error: any) {
        showError('Failed to load posts. Please try again.');
      if (reset) {
        setPosts([]);
        setFilteredPosts([]);
      }
      } finally {
        setLoading(false);
      setLoadingMore(false);
    }
  }, [showError]);

  // Get current user ID once to avoid multiple profile calls
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE}/api/profile`);
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (error) {
      }
    };
    
    getCurrentUserId();
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!loadingMore && hasMore && 
          window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        fetchPosts(currentPage + 1, false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, currentPage, fetchPosts]);

  // Filter posts based on search and technology filter
  useEffect(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        // Check title
        const titleMatch = post.title.toLowerCase().includes(query);
        
        // Check visible description (first 200 characters)
        const visibleDescription = post.description.substring(0, 200).toLowerCase();
        const descMatch = visibleDescription.includes(query);
        
        // Check tech stack
        const techMatch = post.tech_stack ? post.tech_stack.some(tech => tech.toLowerCase().includes(query)) : false;
        
        // Only include if there's a real match in visible content
        return titleMatch || descMatch || techMatch;
      });
    }

    // Apply technology filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(post => 
        post.tech_stack ? post.tech_stack.some(tech => 
          tech.toLowerCase().includes(selectedFilter.toLowerCase())
        ) : false
      );
    }

    setFilteredPosts(filtered);
    
    // Reset pagination when filters change
    if (selectedFilter !== 'All' || searchQuery.trim()) {
      setCurrentPage(1);
      setHasMore(false); // Disable infinite scroll for filtered results
    } else {
      setHasMore(true); // Re-enable infinite scroll for all posts
    }
  }, [posts, searchQuery, selectedFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentOccurrence(0);
  };

  // Update occurrence count when search query or filtered posts change
  useEffect(() => {
    if (searchQuery.trim()) {
      // Use a longer delay to ensure DOM is fully updated with highlights
      const timer = setTimeout(() => {
        const actualCount = countActualHighlights();
        setTotalOccurrences(actualCount);
        setCurrentOccurrence(0);
        
      }, 300); // Increased delay
      
      return () => clearTimeout(timer);
    } else {
      setTotalOccurrences(0);
      setCurrentOccurrence(0);
    }
  }, [searchQuery, filteredPosts]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFileDownload = async (post: Post, file: { file_id: string; filename: string; content_type: string }) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/feed/posts/${post.id}/files/${file.file_id}`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <span className="code-icon">&lt;/&gt;</span>
            <h1>DevShare Feed</h1>
          </div>
          <p className="page-subtitle">Discover amazing projects from the developer community</p>
        </div>
        <div className="loading-container">
          <div className="spinner spinner--large"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <span className="code-icon">&lt;/&gt;</span>
          <h1>DevShare Feed</h1>
        </div>
        <p className="page-subtitle">Discover amazing projects from the developer community</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          {React.createElement(FaSearch as any, { className: "search-icon" })}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by title, description, or skills... (Press Enter to navigate)"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              {React.createElement(FaTimes as any, { className: "search-clear-icon" })}
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="search-results-info">
            <span className="search-count">
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found
            </span>
            <span className="search-query">
              for "{searchQuery}"
            </span>
          </div>
        )}
        
        {searchQuery && totalOccurrences > 0 && (
          <div className="search-navigation">
            <button
              className="search-nav-btn"
              onClick={() => navigateOccurrence('prev')}
              disabled={totalOccurrences <= 1}
              title="Previous occurrence"
            >
              {React.createElement(FaChevronUp as any, { className: "search-nav-icon" })}
              Prev
            </button>
            
            <div className="search-occurrence-info">
              {currentOccurrence + 1}/{totalOccurrences}
            </div>
            
            <button
              className="search-nav-btn"
              onClick={() => navigateOccurrence('next')}
              disabled={totalOccurrences <= 1}
              title="Next occurrence"
            >
              Next
              {React.createElement(FaChevronDown as any, { className: "search-nav-icon" })}
            </button>
            
          </div>
        )}
      </div>

      {/* Filter Tags */}
      <div className="filter-container">
        <div className="filter-tags">
          {techFilters.map((filter) => (
            <button
              key={filter}
              className={`filter-tag ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-container">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={`${post.id}-${searchQuery}`}
              post={post} 
              onFileDownload={handleFileDownload}
              searchQuery={searchQuery}
              highlightText={highlightText}
              currentUserId={currentUserId || undefined}
            />
          ))
        )}
        
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="loading-more-indicator">
            <div className="spinner spinner--small"></div>
            <p>Loading more posts...</p>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Feed;
