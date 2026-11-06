import React, { useState } from 'react';
import { Download, ShieldCheck, Check, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppItem } from '../types';
import { buildCloudflareDownloadUrl, incrementCloudflareDownloads } from '../cloudflareClient';
import { incrementDownloadCount } from '../data';

interface AppListItemProps {
  app: AppItem;
  onOpenDetails?: (app: AppItem) => void;
}

export const AppListItem: React.FC<AppListItemProps> = ({ app }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);

    // Fire confetti celebration from click position
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7'],
        disableForReducedMotion: true
      });
    } catch {}

    // Atomic increments (Local storage + Cloudflare D1)
    incrementDownloadCount(app.id);
    incrementCloudflareDownloads(app.id);

    if (!app.downloadUrl || !app.downloadUrl.trim() || app.downloadUrl === '#') {
      alert(`The download link for "${app.name}" is currently being updated.`);
      setDownloading(false);
      return;
    }

    if (app.downloadUrl.startsWith('blob:')) {
      alert(`The temporary session link for "${app.name}" has expired. Please update it in the Admin Panel with a permanent Cloud Storage or external download link.`);
      setDownloading(false);
      return;
    }

    // Direct APK file download & trigger Android package installer (identical to raja-1)
    const { url: finalDownloadUrl, fileName, isDirect } = buildCloudflareDownloadUrl(
      app.downloadUrl,
      app.apkFileName,
      app.name
    );

    const link = document.createElement('a');
    link.href = finalDownloadUrl;
    link.setAttribute('download', fileName);

    // CRITICAL: Do NOT set target="_blank" for direct APK downloads!
    // Leaves target unset so Chrome & Android stay on the website and download directly in background.
    if (!isDirect) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <div className="app-list-row" onClick={handleDownload} title={`Download ${app.name} APK`}>
      {/* 1. App Logo Icon */}
      <div className="app-icon-wrapper">
        <img
          src={app.logo}
          alt={app.name}
          className="app-icon-img"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2310b981"><rect width="100" height="100" rx="24"/><text x="50" y="55" font-size="28" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">APK</text></svg>';
          }}
        />
      </div>

      {/* 2. App Meta Information (Matching Raxo: ★ 4.9 • Verified) */}
      <div className="app-info-col">
        <h3 className="app-title">{app.name}</h3>
        <div className="card-meta">
          <span className="rating-badge">
            <Star size={13} className="star-icon" fill="currentColor" />
            <span>{app.rating.toFixed(1)}</span>
          </span>
          <span className="meta-bullet">•</span>
          <span className="verified-badge">
            <ShieldCheck size={13} className="verified-icon" />
            <span>{app.badge || 'Verified'}</span>
          </span>
        </div>
      </div>

      {/* 3. Action Download Button */}
      <div className="app-action-col">
        <button
          type="button"
          className={`download-btn ${downloadSuccess ? 'downloaded' : ''}`}
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Download ${app.name}`}
        >
          {downloadSuccess ? (
            <>
              <Check size={16} className="btn-icon" />
              <span>Starting</span>
            </>
          ) : downloading ? (
            <>
              <span className="spinner-dot" />
              <span>Ready</span>
            </>
          ) : (
            <>
              <Download size={16} className="btn-icon" />
              <span>{app.buttonText || 'Download'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
