/**
 * Session Guard component for protecting authenticated routes.
 * Shows a loading state while checking session, then renders children if authenticated.
 */

import React from 'react';
import { useSessionGuard } from '../hooks/useSessionGuard';

interface SessionGuardProps {
  /** Content to render when authenticated */
  children: React.ReactNode;
  /** Content to show while checking session (default: loading spinner) */
  loadingComponent?: React.ReactNode;
  /** Skip the session check (useful for public pages) */
  skip?: boolean;
}

/**
 * Default loading component shown during session check.
 */
function DefaultLoadingComponent() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: '#64748b', fontSize: 14 }}>세션 확인 중...</p>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}

/**
 * Component that guards its children behind authentication.
 * Redirects to login portal if no valid session exists.
 */
export function SessionGuard({
  children,
  loadingComponent,
  skip = false,
}: SessionGuardProps): React.ReactElement | null {
  const { isChecking, isAuthenticated } = useSessionGuard({ skip });

  if (isChecking) {
    return <>{loadingComponent ?? <DefaultLoadingComponent />}</>;
  }

  if (!isAuthenticated && !skip) {
    // Redirect is happening, show nothing
    return null;
  }

  return <>{children}</>;
}

export default SessionGuard;
