import { API_ENDPOINTS } from '../config/api';

/**
 * Utility function to make authenticated fetch requests
 * Automatically includes Authorization header with token from localStorage
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add Authorization header if token exists
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  // For FormData, remove Content-Type header as browser sets it automatically
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  let response = await fetch(url, { ...defaultOptions, ...options });

  // If access token expired, try to refresh and retry the original request
  if (response.status === 403 || response.status === 401) {
    console.log('Access token expired or invalid, attempting to refresh...');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = '/login';
      return response;
    }

    const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('access_token', data.access);
      console.log('Token refreshed successfully, retrying original request...');
      
      // Retry the original request with the new access token
      defaultOptions.headers['Authorization'] = `Bearer ${data.access}`;
      response = await fetch(url, { ...defaultOptions, ...options });
    } else {
      console.error('Failed to refresh token. Logging out.');
      localStorage.clear();
      window.location.href = '/login';
      return response;
    }
  }

  return response;
};

/**
 * Check if user is authenticated by calling the current user endpoint
 */
export const checkAuth = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { authenticated: false, user: null };
    }
    
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
