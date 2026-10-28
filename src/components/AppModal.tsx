import React from 'react';
import { X, ShieldCheck, Download, Star, Smartphone, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppItem } from '../types';
import { buildDownloadUrl, incrementDownloads } from '../apiClient';

interface AppModalProps {
  app: AppItem | null;
  onClose: () => void;
}

export const AppModal: React.FC<AppModalProps> = ({ app, onClose }) => {
  if (!app) return null;

  const handleDownload = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#059669', '#34d399']
      });
    } catch {}

    incrementDownloads(app.id);
    const { url, fileName } = buildDownloadUrl(app.downloadUrl, app.apkFileName, app.name);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Top Info */}
        <div className="modal-header-info">
          <img src={app.logo} alt={app.name} className="modal-app-logo" />
          <div className="modal-title-box">
            <h2 className="modal-app-name">{app.name}</h2>
            <div className="modal-tags">
              <span className="modal-tag category">{app.category || 'Games'}</span>
              <span className="modal-tag rating">
                <Star size={12} fill="currentColor" /> {app.rating.toFixed(1)}
              </span>
              <span className="modal-tag verified">
                <ShieldCheck size={12} /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* Big Action CTA */}
        <div className="modal-cta-box">
          <button className="modal-download-btn" onClick={handleDownload}>
            <Download size={20} />
            <span>Download APK ({app.size || '35 MB'})</span>
          </button>
          <span className="modal-safety-note">
            <CheckCircle2 size={14} className="safety-icon" /> 100% Virus-Free • Direct High-Speed Download
          </span>
        </div>

        {/* App Overview & Installation */}
        <div className="modal-body-content">
          <h4 className="section-heading">Overview</h4>
          <p className="app-description">
            {app.description || `${app.name} provides an enhanced and verified mobile experience with zero ads, optimized speed, and smooth gameplay.`}
          </p>

          <h4 className="section-heading">How to Install</h4>
          <div className="install-steps">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-text">Tap the <strong>Download APK</strong> button above to save the file.</div>
            </div>
            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-text">Open the downloaded file from your browser downloads or file manager.</div>
            </div>
            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-text">Allow installation from this source if prompted, and launch the app!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
