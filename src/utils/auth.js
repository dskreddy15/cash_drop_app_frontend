import { API_ENDPOINTS } from '../config/api';

/**
 * Utility function to make authenticated fetch requests
 * Automatically includes credentials (cookies) for authentication
 */
export const authenticatedFetch = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // For FormData, remove Content-Type header as browser sets it automatically
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  let response = await fetch(url, { ...defaultOptions, ...options });

  // If access token expired, try to refresh and retry the original request
  if (response.status === 403 || response.status === 401) {
    console.log('Access token expired or invalid, attempting to refresh...');
    const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      console.log('Token refreshed successfully, retrying original request...');
      // Retry the original request with the new access token (which is now in cookies)
      response = await fetch(url, { ...defaultOptions, ...options });
    } else {
      console.error('Failed to refresh token. Logging out.');
      // If refresh fails, clear session and redirect to login
      sessionStorage.clear();
      window.location.href = '/login'; // Redirect to login page
      return response; // Return the failed refresh response
    }
  }

  return response;
};

/**
 * Check if user is authenticated by calling the current user endpoint
 */
export const checkAuth = async () => {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.CURRENT_USER);
    if (response.ok) {
      const data = await response.json();
      return { authenticated: true, user: data };
    }
    return { authenticated: false, user: null };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, user: null };
  }
};
