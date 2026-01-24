/**
 * Header component.
 *
 * Shared header with navigation links and data freshness indicator.
 */

import React from 'react';
import { colors, spacing, typography, shadows } from '../styles/theme';

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface HeaderProps {
  /** Application title */
  title: string;
  /** Navigation links */
  navLinks?: NavLink[];
  /** Data freshness timestamp */
  dataFreshness?: Date;
  /** Additional CSS class */
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  navLinks = [],
  dataFreshness,
  className = '',
}) => {
  const headerStyle: React.CSSProperties = {
    backgroundColor: colors.background.paper,
    borderBottom: `1px solid ${colors.border.light}`,
    padding: `${spacing[3]} ${spacing[6]}`,
    boxShadow: shadows.sm,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1280px',
    margin: '0 auto',
  };

  const leftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    textDecoration: 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
  };

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: typography.fontSize.sm,
    fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: active ? colors.primary.main : colors.text.secondary,
    textDecoration: 'none',
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  });

  const freshnessStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: dataFreshness ? colors.success.main : colors.neutral,
  };

  const formatFreshness = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 업데이트';
    if (diffMins < 60) return `${diffMins}분 전 업데이트`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전 업데이트`;

    return date.toLocaleDateString('ko-KR');
  };

  return (
    <header style={headerStyle} className={className}>
      <div style={containerStyle}>
        <div style={leftStyle}>
          <a href="/" style={titleStyle}>{title}</a>
          {navLinks.length > 0 && (
            <nav style={navStyle}>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={linkStyle(link.active ?? false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {dataFreshness && (
          <div style={freshnessStyle}>
            <span style={dotStyle} />
            <span>{formatFreshness(dataFreshness)}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
