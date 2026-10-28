import React from 'react';
import { Shield, Send } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-brand-name">
              appvizo<span className="brand-dot">.</span>
            </span>
            <p className="footer-tagline">{settings.siteTagline}</p>
          </div>

          <div className="footer-links">
            {settings.telegramLink && (
              <a
                href={settings.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-btn telegram-btn"
              >
                <Send size={16} />
                <span>Join Telegram</span>
              </a>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">{settings.footerText}</p>
          <div className="footer-disclaimer">
            <Shield size={14} />
            <span>All apps & games are verified malware-free by Appvizo Security Engine.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
