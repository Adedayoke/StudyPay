import BigNumber from 'bignumber.js';

/**
 * Format SOL amount for display
 */
export function formatSOL(amount: BigNumber | number | string): string {
  const bn = new BigNumber(amount);
  
  // For very small amounts, show more decimals
  if (bn.isLessThan(0.001)) {
    return bn.toFixed(6);
  }
  
  // For normal amounts, show 4 decimals max
  if (bn.isLessThan(1)) {
    return bn.toFixed(4);
  }
  
  // For larger amounts, show 2-3 decimals
  return bn.toFixed(3);
}

/**
 * Format USD amount for display
 */
export function formatUSD(amount: BigNumber | number | string): string {
  const bn = new BigNumber(amount);
  return `$${bn.toFixed(2)}`;
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string, chars: number = 8): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format transaction signature for display
 */
export function formatSignature(signature: string, chars: number = 12): string {
  if (signature.length <= chars * 2) return signature;
  return `${signature.slice(0, chars)}...${signature.slice(-chars)}`;
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
