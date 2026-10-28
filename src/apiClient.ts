import { AppItem, SiteSettings } from './types';

export async function fetchApps(): Promise<AppItem[]> {
  try {
    const res = await fetch('/api/apps');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Failed to fetch apps:', err);
    return [];
  }
}

export async function fetchSettings(): Promise<SiteSettings> {
  const fallback: SiteSettings = {
    siteName: 'Appvizo',
    siteTagline: 'Discover & Download Verified Apps & Games',
    siteDescription: 'Direct verified APK downloads with fast servers.',
    footerText: '© 2026 Appvizo. All rights reserved.',
    telegramLink: 'https://t.me/appvizo_official'
  };

  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return fallback;
    const data = await res.json();
    return { ...fallback, ...data };
  } catch {
    return fallback;
  }
}

export async function incrementDownloads(id: string): Promise<void> {
  try {
    await fetch(`/api/apps/${encodeURIComponent(id)}/download`, {
      method: 'POST'
    });
  } catch (err) {
    console.error('Failed to increment download count:', err);
  }
}

export function buildDownloadUrl(rawUrl: string, rawFileName?: string, appName?: string): { url: string; fileName: string } {
  let fileName = (rawFileName || '').trim();
  if (!fileName && appName) {
    fileName = `${appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.apk`;
  }
  if (!fileName) {
    fileName = 'app.apk';
  }
  if (!fileName.toLowerCase().endsWith('.apk')) {
    fileName += '.apk';
  }

  let finalUrl = rawUrl;
  if (finalUrl.startsWith('/assets/apks/')) {
    finalUrl = `${finalUrl}?download=${encodeURIComponent(fileName)}`;
  }
  return { url: finalUrl, fileName };
}
