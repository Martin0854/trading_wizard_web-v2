/**
 * ErrorMessage component.
 *
 * Displays error messages with appropriate styling.
 */

import React from 'react';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Optional title */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = '오류가 발생했습니다',
  onRetry,
  className = '',
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.error.light + '20', // 20% opacity
    border: `1px solid ${colors.error.main}`,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    color: colors.error.dark,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const messageStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed,
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: spacing[3],
    padding: `${spacing[2]} ${spacing[4]}`,
    backgroundColor: colors.error.main,
    color: colors.error.contrast,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle} className={className} role="alert">
      <div style={titleStyle}>
        <span aria-hidden="true">⚠️</span>
        {title}
      </div>
      <div style={messageStyle}>{message}</div>
      {onRetry && (
        <button style={buttonStyle} onClick={onRetry} type="button">
          다시 시도
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
