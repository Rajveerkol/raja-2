import React, { useState } from 'react';
import { Download, ShieldCheck, Check, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppItem } from '../types';
import { buildDownloadUrl, incrementDownloads } from '../apiClient';

interface AppListItemProps {
  app: AppItem;
  onOpenDetails: (app: AppItem) => void;
}

export const AppListItem: React.FC<AppListItemProps> = ({ app, onOpenDetails }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    if (downloading) return;

    setDownloading(true);

    // Fire confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7']
      });
    } catch {}

    // Atomic increment
    incrementDownloads(app.id);

    // Build verified R2 download URL
    const { url, fileName } = buildDownloadUrl(app.downloadUrl, app.apkFileName, app.name);

    // Direct download trigger (no blank tab)
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(false);
    }, 3000);
  };

  return (
    <div className="app-list-row" onClick={() => onOpenDetails(app)}>
      {/* 1. App Logo Icon */}
      <div className="app-icon-wrapper">
        <img
          src={app.logo}
          alt={app.name}
          className="app-icon-img"
          loading="lazy"
          onError={(e) => {
            // Fallback icon if logo fails
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
              <span>Download</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
