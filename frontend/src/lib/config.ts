/**
 * API configuration for the application
 */

// Check if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Primary API URL - use environment variable if available, fallback to hardcoded values
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (isDevelopment ? 'http://192.168.1.115:8000' : 'https://api.yourproductionurl.com');

// Base API path
export const API_BASE_PATH = '/api';

/**
 * Gets the full API URL for a specific endpoint
 * @param endpoint - The API endpoint (without leading slash)
 * @returns The complete API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with a slash if not empty
  const formattedEndpoint = endpoint ? 
    (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
  
  return `${API_URL}${API_BASE_PATH}${formattedEndpoint}`;
}; 