import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook to handle inactivity logout after specified time
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 10)
 * @param {function} onLogout - Callback function to execute on logout
 */
export const useInactivityTimer = (timeoutMinutes = 10, onLogout) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds

  const resetTimer = () => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        // Default logout behavior
        handleLogout();
      }
    }, timeoutMs);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok || !response.ok) {
        // Navigate to login regardless of response
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [timeoutMinutes]);

  return { resetTimer };
};
