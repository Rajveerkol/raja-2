import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { AppListItem } from './components/AppListItem';
import { AppModal } from './components/AppModal';
import { Footer } from './components/Footer';
import { AppItem, SiteSettings } from './types';
import { fetchApps, fetchSettings } from './apiClient';
import './App.css';

export function App() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Appvizo',
    siteTagline: 'Discover & Download Verified Apps & Games',
    siteDescription: 'Direct verified APK downloads with fast servers.',
    footerText: '© 2026 Appvizo. All rights reserved.',
    telegramLink: 'https://t.me/appvizo_official'
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalApp, setActiveModalApp] = useState<AppItem | null>(null);

  // Theme state: defaults to light mode as shown in the screenshot
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

  // Load live data from shared D1 database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [appsData, settingsData] = await Promise.all([
        fetchApps(),
        fetchSettings()
      ]);
      setApps(appsData);
      setSettings(settingsData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered Apps List
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter((app) => {
      return (
        app.name.toLowerCase().includes(q) ||
        (app.category && app.category.toLowerCase().includes(q)) ||
        (app.badge && app.badge.toLowerCase().includes(q))
      );
    });
  }, [apps, searchQuery]);

  return (
    <div className="app-container">
      {/* 1. Brand Header */}
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* 2. Main Hero / Search Section */}
      <main className="main-content">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalApps={apps.length}
        />

        {/* 3. The Core App List Card (Matching the user screenshot + Tagda Upgrade) */}
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
          ) : filteredApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">🔍</div>
              <h3>No Apps Found</h3>
              <p>No results match "{searchQuery}". Try searching for another name or reset search.</p>
              <button 
                className="reset-search-btn"
                onClick={() => setSearchQuery('')}
              >
                Show All Apps
              </button>
            </div>
          ) : (
            <div className="app-items-list">
              {filteredApps.map((app) => (
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

      {/* 4. Quick Details Modal */}
      <AppModal
        app={activeModalApp}
        onClose={() => setActiveModalApp(null)}
      />

      {/* 5. Minimal Footer */}
      <Footer settings={settings} />
    </div>
  );
}
