/**
 * React hook for session guard functionality.
 * Checks if user is authenticated and redirects to login portal if not.
 */

import { useEffect, useState } from 'react';
import { hasValidSession, redirectToLogin } from '../services/sessionService';

interface UseSessionGuardOptions {
  /** Skip the session check (useful for public pages) */
  skip?: boolean;
  /** Callback when session check completes */
  onChecked?: (isValid: boolean) => void;
}

interface UseSessionGuardResult {
  /** Whether the session check is in progress */
  isChecking: boolean;
  /** Whether the session is valid */
  isAuthenticated: boolean;
}

/**
 * Hook to guard pages that require authentication.
 * Automatically redirects to login portal if no valid session exists.
 */
export function useSessionGuard(options: UseSessionGuardOptions = {}): UseSessionGuardResult {
  const { skip = false, onChecked } = options;
  const [isChecking, setIsChecking] = useState(!skip);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (skip) {
      setIsChecking(false);
      setIsAuthenticated(true);
      return;
    }

    const checkSession = () => {
      const isValid = hasValidSession();

      if (!isValid) {
        // Redirect to login portal
        redirectToLogin();
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
      onChecked?.(true);
    };

    checkSession();
  }, [skip, onChecked]);

  return { isChecking, isAuthenticated };
}

export default useSessionGuard;
