import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle inactivity logout after specified time
 * @param {number} timeout - Milliseconds of inactivity before logout (default: 10 minutes)
 * @param {function} onTimeout - Callback function to execute on timeout
 */
const useInactivityTimer = (timeout, onTimeout) => {
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => onTimeoutRef.current(), timeout);
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    // Set up initial timer
    resetTimer();

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Clean up event listeners and timer on component unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [timeout]); // Re-run effect if timeout changes

  // Expose a way to manually reset the timer if needed
  return resetTimer;
};

export default useInactivityTimer;
