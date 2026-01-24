/**
 * Footer component.
 *
 * Shared footer with disclaimer text.
 */

import React from 'react';
import { colors, spacing, typography } from '../styles/theme';

export interface FooterProps {
  /** Disclaimer text to display */
  disclaimer?: string;
  /** Additional CSS class */
  className?: string;
}

const DEFAULT_DISCLAIMER =
  '본 서비스에서 제공하는 정보는 투자 참고용이며, 매매 권유나 투자 조언이 아닙니다. ' +
  '투자에 대한 최종 결정과 책임은 이용자 본인에게 있습니다.';

export const Footer: React.FC<FooterProps> = ({
  disclaimer = DEFAULT_DISCLAIMER,
  className = '',
}) => {
  const footerStyle: React.CSSProperties = {
    backgroundColor: colors.background.default,
    borderTop: `1px solid ${colors.border.light}`,
    padding: `${spacing[6]} ${spacing[6]}`,
    marginTop: 'auto',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    textAlign: 'center',
  };

  const disclaimerStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
    maxWidth: '600px',
    margin: '0 auto',
  };

  const copyrightStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    marginTop: spacing[4],
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer style={footerStyle} className={className}>
      <div style={containerStyle}>
        <p style={disclaimerStyle}>{disclaimer}</p>
        <p style={copyrightStyle}>
          © {currentYear} Trading Wizard. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
