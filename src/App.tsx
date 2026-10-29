import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AppListItem } from './components/AppListItem';
import { AppModal } from './components/AppModal';
import { Footer } from './components/Footer';
import { LegalModals, LegalModalType } from './components/LegalModals';
import { AdminPage } from './components/AdminPage';
import { AppItem, SiteSettings } from './types';
import { loadStoredApps, saveStoredApps, loadStoredSettings, saveStoredSettings, INITIAL_APPS } from './data';
import { fetchCloudflareApps, fetchCloudflareSettings } from './cloudflareClient';
import './App.css';

export function App() {
  const [apps, setApps] = useState<AppItem[]>(() => {
    const cached = loadStoredApps();
    return Array.isArray(cached) && cached.length > 0 ? cached : INITIAL_APPS;
  });
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Appvizo',
    siteTagline: 'Discover & Download Verified Apps & Games',
    siteDescription: 'Direct verified APK downloads with fast servers.',
    footerText: '© 2026 Appvizo. All rights reserved.',
    telegramLink: 'https://t.me/appvizo_official'
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = loadStoredApps();
    return !cached || cached.length === 0;
  });
  const [activeModalApp, setActiveModalApp] = useState<AppItem | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalType>(null);
  const [secretClicks, setSecretClicks] = useState(0);

  // Admin route detection
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return p === '/admin' || p.startsWith('/admin/') || h === '#admin';
  });

  // Theme state: defaults to light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('appvizo_theme');
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try {
      localStorage.setItem('appvizo_theme', darkMode ? 'dark' : 'light');
    } catch {}
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Check URL hash for modal opening on load / change
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#privacy') setActiveLegalModal('privacy');
      else if (h === '#terms') setActiveLegalModal('terms');
      else if (h === '#contact') setActiveLegalModal('contact');
      else if (h === '#admin') setIsAdminRoute(true);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Route listener: listen to popstate and hashchange
  useEffect(() => {
    const checkRoute = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      const isAdmin = p === '/admin' || p.startsWith('/admin/') || h === '#admin';
      setIsAdminRoute(isAdmin);
    };

    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // Dynamic document title update
  useEffect(() => {
    if (isAdminRoute) {
      document.title = `Admin Dashboard - ${settings.siteName}`;
    } else {
      document.title = `${settings.siteName} - ${settings.siteTagline}`;
    }
  }, [settings, isAdminRoute]);

  // Navigate helpers
  const navigateToAdmin = () => {
    setIsAdminRoute(true);
    if (window.location.pathname.toLowerCase() !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
  };

  const navigateToHome = () => {
    setIsAdminRoute(false);
    if (window.location.pathname.toLowerCase().startsWith('/admin') || window.location.hash === '#admin') {
      window.history.pushState({}, '', '/');
    }
  };

  // Keyboard shortcut listener: 'Ctrl + Shift + A' toggles admin page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdminRoute) navigateToHome();
        else navigateToAdmin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminRoute]);

  // Secret footer click to open admin
  const handleSecretFooterClick = () => {
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        navigateToAdmin();
        return 0;
      }
      return next;
    });
  };

  // Load live data with graceful offline/CDN fallback
  useEffect(() => {
    async function loadData() {
      try {
        const [appsData, settingsData] = await Promise.all([
          fetchCloudflareApps(7000, isAdminRoute),
          fetchCloudflareSettings(4000)
        ]);
        if (appsData && appsData.length > 0) {
          setApps(appsData);
          saveStoredApps(appsData);
        } else {
          const fallback = loadStoredApps();
          if (fallback && fallback.length > 0) setApps(fallback);
        }
        if (settingsData) {
          setSettings(settingsData);
          saveStoredSettings(settingsData);
        }
      } catch (err) {
        console.error('Data load error:', err);
        const fallback = loadStoredApps();
        if (fallback && fallback.length > 0) setApps(fallback);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdminRoute]);

  // If on admin route -> Render Dedicated Full-Page Admin Dashboard
  if (isAdminRoute) {
    return (
      <AdminPage
        apps={apps}
        setApps={setApps}
        settings={settings}
        setSettings={setSettings}
        onNavigateHome={navigateToHome}
      />
    );
  }

  // Public visitor view
  return (
    <div className="app-container">
      {/* 1. Brand Header */}
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* 2. Main Content */}
      <main className="main-content">
        <section className="app-card-container">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="skeleton-row">
                  <div className="skeleton-icon" />
                  <div className="skeleton-text-col">
                    <div className="skeleton-title" />
                    <div className="skeleton-sub" />
                  </div>
                  <div className="skeleton-btn" />
                </div>
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">📱</div>
              <h3>Apps Updating</h3>
              <p>Applications are currently being prepared. Please check back shortly.</p>
            </div>
          ) : (
            <div className="app-items-list">
              {apps
                .filter((app) => app.status === 'active')
                .map((app) => (
                  <AppListItem
                    key={app.id}
                    app={app}
                    onOpenDetails={(selected) => setActiveModalApp(selected)}
                  />
                ))}
            </div>
          )}
        </section>
      </main>

      {/* 3. Quick Details Modal */}
      <AppModal
        app={activeModalApp}
        onClose={() => setActiveModalApp(null)}
      />

      {/* 4. Footer Matching Raxo */}
      <Footer 
        settings={settings} 
        onOpenLegal={(type) => setActiveLegalModal(type)}
        onSecretClick={handleSecretFooterClick}
      />

      {/* 5. Legal & Contact Modals (Privacy Policy, Terms of Service, Contact Us) */}
      <LegalModals 
        activeModal={activeLegalModal}
        onClose={() => {
          setActiveLegalModal(null);
          if (window.location.hash.startsWith('#')) {
            window.history.pushState(null, '', window.location.pathname);
          }
        }}
        settings={settings}
      />
    </div>
  );
}
export default App;
