/**
 * Date/time utilities
 */

export const formatRelative = (iso: string): string => {
  try {
    const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const now = new Date();
    const diff = Math.max(0, now.getTime() - date.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return 'just now';
  }
};

/**
 * Format as UI date like "20-oct-2025" used in likes list.
 */
export const formatUiDate = (iso: string): string => {
  try {
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z')
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/\s/g, '-')
      .toLowerCase();
  } catch {
    return '';
  }
};


