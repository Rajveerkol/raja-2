import React from 'react';
import { SiteSettings } from '../types';
import { LegalModalType } from './LegalModals';

interface FooterProps {
  settings: SiteSettings;
  onOpenLegal: (type: LegalModalType) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenLegal }) => {
  return (
    <footer className="site-footer">
      <div className="footer-layout">
        {/* Row 1: Home   Privacy Policy   Terms of Service */}
        <nav className="footer-links-row" aria-label="Footer Navigation">
          <button 
            type="button" 
            className="footer-nav-link"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Home
          </button>
          <button 
            type="button" 
            className="footer-nav-link"
            onClick={() => onOpenLegal('privacy')}
          >
            Privacy Policy
          </button>
          <button 
            type="button" 
            className="footer-nav-link"
            onClick={() => onOpenLegal('terms')}
          >
            Terms of Service
          </button>
        </nav>

        {/* Row 2: Contact Us */}
        <div className="footer-contact-row">
          <button 
            type="button" 
            className="footer-nav-link"
            onClick={() => onOpenLegal('contact')}
          >
            Contact Us
          </button>
        </div>

        {/* Row 3: © 2026 Appvizo. All rights reserved. */}
        <div className="footer-copy-row">
          <p className="footer-copy-text">
            {settings.footerText || `© 2026 ${settings.siteName || 'Appvizo'}. All rights reserved.`}
          </p>
        </div>

        {/* Row 4: Meta / Facebook Disclaimer */}
        <div className="footer-disclaimer-row">
          <p className="footer-disclaimer-text">
            Disclaimer: This website is not part of the Facebook website or Meta Platforms, Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of META PLATFORMS, INC.
          </p>
        </div>
      </div>
    </footer>
  );
};
