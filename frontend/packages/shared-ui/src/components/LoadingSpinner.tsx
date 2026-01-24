/**
 * LoadingSpinner component.
 *
 * Displays a spinning loading indicator.
 */

import React from 'react';
import { colors } from '../styles/theme';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Color of the spinner */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

const sizeMap = {
  sm: { width: '1rem', borderWidth: '2px' },
  md: { width: '1.5rem', borderWidth: '2px' },
  lg: { width: '2.5rem', borderWidth: '3px' },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = colors.primary.main,
  className = '',
}) => {
  const { width, borderWidth } = sizeMap[size];

  const spinnerStyle: React.CSSProperties = {
    width,
    height: width,
    border: `${borderWidth} solid ${colors.border.light}`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={spinnerStyle}
        className={className}
        role="status"
        aria-label="로딩 중"
      />
    </>
  );
};

export default LoadingSpinner;
