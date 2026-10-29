// =============================================================================
// Cloudflare Client Adapter for Appvizo / Raxo
// Connects the React application directly to Cloudflare Pages Functions
// backed by Cloudflare D1 (raxo-db) and Cloudflare R2 (raxo-assets).
//
// Replaces @supabase/supabase-js with native same-origin fetch calls.
// Zero third-party dependencies, zero exposed secrets, and zero CORS issues.
// =============================================================================

import { AppItem, SiteSettings } from './types';

export function isCloudflareConfigured(): boolean {
  return true;
}

export interface UploadAssetResult {
  url: string | null;
  key?: string;
  error?: string;
  fileName?: string;
}

/**
 * Fetch all apps from Cloudflare D1 with timeout guard
 */
export async function fetchCloudflareApps(timeoutMs = 5000, all = false): Promise<AppItem[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = all ? '/api/apps?all=true' : '/api/apps';
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Cloudflare apps fetch returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data as AppItem[];
    }
    return [];
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name !== 'AbortError') {
      console.error('Failed to fetch apps from Cloudflare D1:', err);
    }
    return null;
  }
}

/**
 * Fetch site settings from Cloudflare D1 with timeout guard
 */
export async function fetchCloudflareSettings(timeoutMs = 4000): Promise<SiteSettings | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/settings', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      siteName: data.siteName || 'Appvizo',
      siteTagline: data.siteTagline || 'Discover & Download Verified Apps & Games',
      siteDescription: data.siteDescription || 'Appvizo provides fast, safe and verified direct download links for top trending games and utilities.',
      footerText: data.footerText || '© 2026 Appvizo. All rights reserved.',
      telegramLink: data.telegramLink || 'https://t.me/appvizo_official'
    };
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Atomically increment download counter in Cloudflare D1
 */
export async function incrementCloudflareDownloads(id: string): Promise<void> {
  if (!id) return;

  try {
    await fetch(`/api/apps/${encodeURIComponent(id)}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error incrementing download in Cloudflare D1:', err);
  }
}

export interface MutationResult {
  success: boolean;
  error?: string;
  status?: number;
}

/**
 * Insert or Update an App in Cloudflare D1 (Admin protected)
 */
export async function upsertCloudflareApp(app: AppItem): Promise<MutationResult> {
  try {
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(app)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || `Server error (${res.status})`, status: res.status };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to upsert app to Cloudflare D1:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Delete an App from Cloudflare D1 (Admin protected)
 */
export async function deleteCloudflareApp(id: string): Promise<MutationResult> {
  try {
    const res = await fetch(`/api/apps/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || `Server error (${res.status})`, status: res.status };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete app from Cloudflare D1:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Update Site Settings in Cloudflare D1 (Admin protected)
 */
export async function updateCloudflareSettings(settings: SiteSettings): Promise<MutationResult> {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(settings)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || `Server error (${res.status})`, status: res.status };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update settings in Cloudflare D1:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Upload an APK file directly to Cloudflare R2 bucket (Admin protected)
 */
export async function uploadCloudflareApk(file: File, preferredName?: string): Promise<UploadAssetResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (preferredName) {
      formData.append('preferredName', preferredName.trim());
    }

    const res = await fetch('/api/admin/upload-apk', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: formData
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { url: null, error: data?.error || `Upload failed with status ${res.status}` };
    }

    return {
      url: data.url,
      key: data.key,
      fileName: data.fileName
    };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Network error during APK upload' };
  }
}

/**
 * Upload a Logo image file directly to Cloudflare R2 bucket (Admin protected)
 * Stored as a binary file under logos/ rather than huge Base64 strings.
 */
export async function uploadCloudflareLogo(file: File): Promise<UploadAssetResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload-logo', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: formData
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { url: null, error: data?.error || `Logo upload failed with status ${res.status}` };
    }

    return {
      url: data.url,
      key: data.key
    };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Network error during logo upload' };
  }
}

/**
 * Check whether the user currently has an authenticated admin session on the server
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/session', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.authenticated);
  } catch (e) {
    return false;
  }
}

/**
 * Log into admin panel (Server-verified HttpOnly cookie session)
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || 'Invalid admin password' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login request failed' };
  }
}

/**
 * Log out of admin panel (Clears HttpOnly session cookie)
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (err) {
    console.error('Failed to log out:', err);
  }
}

/**
 * Construct a clean, direct download URL and filename for Cloudflare R2 assets.
 * Supports /assets/apks/... with ?download=fileName to enforce Content-Disposition: attachment
 * without triggering browser blank tabs.
 */
export function buildCloudflareDownloadUrl(
  rawUrl: string,
  rawFileName?: string,
  appName?: string
): {
  url: string;
  fileName: string;
  isDirect: boolean;
} {
  const url = (rawUrl || '').trim();
  let fileName = (rawFileName || '').trim();

  // If no filename provided, generate a clean one from app name
  if (!fileName) {
    const safe = (appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    fileName = `${safe || 'app'}.apk`;
  }

  // Ensure clean filename: strip random device/affiliate hash suffixes
  fileName = fileName.replace(/\.apk$/i, '');
  fileName = fileName.replace(/_[A-Za-z0-9]{8,15}$/, '').replace(/__\d+_$/, '').replace(/__\d+$/, '');
  if (!fileName.toLowerCase().endsWith('.apk')) {
    fileName = `${fileName}.apk`;
  }

  const isCloudflareAsset = url.startsWith('/assets/apks/') || url.startsWith('apks/');
  const isDirect = isCloudflareAsset || url.toLowerCase().endsWith('.apk') || url.includes('?download=');

  if (isCloudflareAsset) {
    // Normalize path to /assets/apks/...
    let assetPath = url.startsWith('/assets/') ? url : `/assets/${url}`;
    const baseUrl = assetPath.split('?')[0];
    return {
      url: `${baseUrl}?download=${encodeURIComponent(fileName)}`,
      fileName,
      isDirect: true
    };
  }

  return {
    url,
    fileName,
    isDirect
  };
}

/**
 * Compatibility stubs for legacy credentials management
 */
export function getSupabaseCredentials(): { url: string; key: string } {
  return { url: '', key: '' };
}

export function saveSupabaseCredentials(_url: string, _key: string): void {
  // No-op in Cloudflare mode
}
