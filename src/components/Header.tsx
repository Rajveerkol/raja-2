import React from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Logo matching the screenshot */}
        <div className="brand-logo">
          <div className="logo-icon-box">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 3L2 19h20L12 3zm0 4.8l6.2 10.4H5.8L12 7.8z" />
            </svg>
          </div>
          <span className="brand-text">
            appvizo<span className="brand-dot">.</span>
          </span>
        </div>

        {/* Right Header Actions */}
        <div className="header-actions">
          <div className="trust-badge">
            <ShieldCheck size={16} className="trust-icon" />
            <span>100% Virus-Free</span>
          </div>

          <button 
            className="theme-toggle-btn" 
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
