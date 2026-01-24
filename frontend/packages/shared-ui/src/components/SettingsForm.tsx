/**
 * SettingsForm base component.
 *
 * Provides common form structure for settings pages.
 */

import React from 'react';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export interface SettingsFormProps {
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form children */
  children: React.ReactNode;
  /** Submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Reset handler */
  onReset?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  title,
  description,
  children,
  onSubmit,
  onReset,
  loading = false,
  className = '',
}) => {
  const formStyle: React.CSSProperties = {
    backgroundColor: colors.background.paper,
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    boxShadow: shadows.sm,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[3],
    marginTop: spacing[6],
    paddingTop: spacing[6],
    borderTop: `1px solid ${colors.border.light}`,
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, opacity 0.2s',
    opacity: loading ? 0.6 : 1,
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: colors.primary.main,
    color: colors.primary.contrast,
    border: 'none',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: 'transparent',
    color: colors.text.secondary,
    border: `1px solid ${colors.border.main}`,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form style={formStyle} className={className} onSubmit={handleSubmit}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {description && <p style={descriptionStyle}>{description}</p>}
      </div>

      <div style={contentStyle}>{children}</div>

      {(onSubmit || onReset) && (
        <div style={actionsStyle}>
          {onReset && (
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={onReset}
              disabled={loading}
            >
              초기화
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              style={primaryButtonStyle}
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      )}
    </form>
  );
};

// Form field component for consistent styling
export interface FormFieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  description,
  error,
  children,
}) => {
  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  };

  const descStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    marginTop: spacing[1],
  };

  return (
    <div style={fieldStyle}>
      <label htmlFor={htmlFor} style={labelStyle}>
        {label}
      </label>
      {description && <span style={descStyle}>{description}</span>}
      {children}
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default SettingsForm;
