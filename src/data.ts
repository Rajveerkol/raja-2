import { AppItem, SiteSettings } from './types';

export const INITIAL_APPS: AppItem[] = [];

export const INITIAL_SETTINGS: SiteSettings = {
  siteName: 'Appvizo',
  siteTagline: 'Discover & Download Verified Apps & Games',
  siteDescription: 'Appvizo provides fast, safe and verified direct download links for top trending games, utilities, and apps.',
  footerText: '© 2026 Appvizo. All rights reserved.',
  telegramLink: 'https://t.me/appvizo_official'
};

const APPS_STORAGE_KEY = 'appvizo_apps_data';
const SETTINGS_STORAGE_KEY = 'appvizo_site_settings';
const PASSWORD_STORAGE_KEY = 'appvizo_admin_password';

// Legacy keys for migration
const LEGACY_APPS_STORAGE_KEY = 'raxo_apps_data';
const LEGACY_SETTINGS_STORAGE_KEY = 'raxo_site_settings';
const LEGACY_PASSWORD_STORAGE_KEY = 'raxo_admin_password';

export function loadStoredApps(): AppItem[] {
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY) ?? localStorage.getItem(LEGACY_APPS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Detect and purge old mock dummy apps (Classic 200, Khelo 567, Mkm Vex, Aqua 888, or app-1..12 IDs)
        const hasLegacyDummy = parsed.some(
          a => (typeof a.id === 'string' && /^app-(1[0-2]|[1-9])$/.test(a.id)) ||
               a.name === 'Classic 200' || a.name === 'Khelo 567' || a.name === 'Mkm Vex' ||
               a.name === 'Aqua 888' || a.name === 'Yoho 888' || a.name === 'Monkey games' || a.name === 'Ludo 567'
        );
        if (hasLegacyDummy) {
          localStorage.removeItem(APPS_STORAGE_KEY);
          localStorage.removeItem(LEGACY_APPS_STORAGE_KEY);
          return [];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored apps', err);
  }
  return [];
}

export function saveStoredApps(apps: AppItem[]): void {
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error('Error saving apps', err);
  }
}

export function loadStoredSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: SiteSettings = { ...INITIAL_SETTINGS, ...parsed };
      // Migrate legacy name if present
      if (merged.siteName === 'Raxo') {
        merged.siteName = 'Appvizo';
      }
      if (merged.footerText?.includes('Raxo')) {
        merged.footerText = '© 2026 Appvizo. All rights reserved.';
      }
      if (merged.telegramLink?.includes('raxo')) {
        merged.telegramLink = 'https://t.me/appvizo_official';
      }
      return merged;
    }
  } catch (err) {
    console.error('Error loading stored settings', err);
  }
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

export function verifyAdminPassword(inputPassword: string): boolean {
  try {
    const savedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY) || localStorage.getItem(LEGACY_PASSWORD_STORAGE_KEY);
    if (savedPassword) {
      return inputPassword.trim() === savedPassword.trim();
    }
  } catch (e) {
    // fallback
  }
  return false;
}

export function changeAdminPassword(newPassword: string): void {
  localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword.trim());
}

export function incrementDownloadCount(appId: string): void {
  const apps = loadStoredApps();
  const updated = apps.map(app => {
    if (app.id === appId) {
      return { ...app, downloads: (app.downloads || 0) + 1 };
    }
    return app;
  });
  saveStoredApps(updated);
}
