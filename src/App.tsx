import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AppListItem } from './components/AppListItem';
import { AppModal } from './components/AppModal';
import { Footer } from './components/Footer';
import { LegalModals, LegalModalType } from './components/LegalModals';
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
  const [activeModalApp, setActiveModalApp] = useState<AppItem | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalType>(null);

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

  return (
    <div className="app-container">
      {/* 1. Brand Header */}
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* 2. Main Content (No Search Button / Bar) */}
      <main className="main-content">
        {/* Core App List Card (Matching user reference + Raxo style meta) */}
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
              {apps.map((app) => (
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
      />

      {/* 5. Legal & Contact Modals (Privacy Policy, Terms of Service, Contact Us) */}
      <LegalModals 
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        settings={settings}
      />
    </div>
  );
}
