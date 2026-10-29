import React, { useState, useRef, useEffect } from 'react';
import { 
  Rocket, Plus, Edit2, Trash2, ExternalLink, ShieldCheck, 
  Settings as SettingsIcon, Key, RotateCcw, Image as ImageIcon, 
  Check, AlertCircle, Database, RefreshCw, ArrowLeft, LogOut, 
  Search, Eye, EyeOff, Layers, Download, CheckCircle2, Upload, Package 
} from 'lucide-react';
import { AppItem, SiteSettings } from '../types';
import { INITIAL_APPS, changeAdminPassword, verifyAdminPassword } from '../data';
import { 
  getSupabaseCredentials, saveSupabaseCredentials, 
  isCloudflareConfigured as isSupabaseConfigured,
  fetchCloudflareApps as fetchSupabaseApps, 
  upsertCloudflareApp as upsertSupabaseApp, 
  deleteCloudflareApp as deleteSupabaseApp, 
  fetchCloudflareSettings as fetchSupabaseSettings, 
  updateCloudflareSettings as updateSupabaseSettings, 
  uploadCloudflareApk as uploadSupabaseApk,
  uploadCloudflareLogo,
  buildCloudflareDownloadUrl as buildDownloadUrl,
  loginAdmin, logoutAdmin, checkAdminSession
} from '../cloudflareClient';
import './AdminPage.css';

interface AdminPageProps {
  apps: AppItem[];
  setApps: (apps: AppItem[]) => void;
  settings: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
  onNavigateHome: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  apps,
  setApps,
  settings,
  setSettings,
  onNavigateHome
}) => {
  // Session authentication state - verified directly with server
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<'apps' | 'add' | 'supabase' | 'settings' | 'password'>('apps');

  // Form State for Add / Edit
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [downloadSource, setDownloadSource] = useState<'upload' | 'link'>('upload');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [rating, setRating] = useState(4.9);
  const [badge, setBadge] = useState('Verified');
  const [category, setCategory] = useState('Games');
  const [size, setSize] = useState('45 MB');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [description, setDescription] = useState('');
  const [apkFileName, setApkFileName] = useState('');
  const [originalApkName, setOriginalApkName] = useState('');
  const [buttonText, setButtonText] = useState('Download APK');
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const apkFileInputRef = useRef<HTMLInputElement>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Settings form state
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteTagline, setSiteTagline] = useState(settings.siteTagline);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [footerText, setFooterText] = useState(settings.footerText);
  const [telegramLink, setTelegramLink] = useState(settings.telegramLink);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Supabase tab state
  const initialCreds = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(initialCreds.url);
  const [sbKey, setSbKey] = useState(initialCreds.key);
  const [sbStatus, setSbStatus] = useState<string | null>(null);
  const [sbLoading, setSbLoading] = useState(false);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verify server-side HttpOnly session cookie on mount
  useEffect(() => {
    let isMounted = true;
    checkAdminSession().then(valid => {
      if (!isMounted) return;
      setIsAuthenticated(valid);
      if (!valid) {
        sessionStorage.removeItem('appvizo_admin_auth');
        sessionStorage.removeItem('raxo_admin_auth');
      }
      setIsCheckingAuth(false);
    }).catch(() => {
      if (isMounted) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Save auth to sessionStorage for fallback UI state
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('raxo_admin_auth', 'true');
      sessionStorage.setItem('appvizo_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('appvizo_admin_auth');
      sessionStorage.removeItem('raxo_admin_auth');
    }
  }, [isAuthenticated]);

  // Handle Login via Cloudflare Pages Function (Server-verified HttpOnly cookie session)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await loginAdmin(passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('raxo_admin_auth', 'true');
        sessionStorage.setItem('appvizo_admin_auth', 'true');
        setPasswordInput('');
        const fresh = await fetchSupabaseApps(5000, true);
        if (fresh && fresh.length > 0) {
          setApps(fresh);
        }
      } else {
        setLoginError(res.error || 'Invalid password. Please try again.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    sessionStorage.removeItem('appvizo_admin_auth');
    sessionStorage.removeItem('raxo_admin_auth');
  };

  // Handle Logo Upload (Upload to Cloudflare R2)
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Logo image is too large (max 10MB)');
        return;
      }
      try {
        const localPreview = URL.createObjectURL(file);
        setLogoPreview(localPreview);
      } catch (err) {}

      setIsUploadingLogo(true);
      setFormError('');
      setFormSuccess('Uploading logo to Cloudflare R2 storage...');

      try {
        const result = await uploadCloudflareLogo(file);
        if (result.url) {
          setLogo(result.url);
          setLogoPreview(result.url);
          setFormSuccess('Logo uploaded to Cloudflare R2 successfully!');
        } else {
          setFormError(result.error || 'Failed to upload logo to R2');
        }
      } catch (err: any) {
        setFormError(err?.message || 'Error uploading logo');
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  // Clean default APK file name derived from app name
  const getDefaultApkName = (customName?: string) => {
    const raw = (customName || name).trim() || 'app';
    const safe = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${safe || 'app'}.apk`;
  };

  const handleUseDefaultApkName = () => {
    setApkFileName(getDefaultApkName());
  };

  const handleUseOriginalApkName = () => {
    if (originalApkName) {
      setApkFileName(originalApkName);
    }
  };

  // Helper to sanitize any raw filename by removing random affiliate/hash suffixes
  const cleanRawApkName = (rawName: string) => {
    let clean = (rawName || '').replace(/\.apk$/i, '');
    // Strip random trailing codes like _P4C61LFDRVH, _7V9C7R2PJKM__1_, _SDN7T6U1V81, __1_
    clean = clean.replace(/_[A-Za-z0-9]{8,15}$/, '').replace(/__\d+_$/, '').replace(/__\d+$/, '');
    return `${clean}.apk`;
  };

  // Handle APK File Upload
  const handleApkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can re-select file if needed
    e.target.value = '';

    setIsUploadingApk(true);
    setFormError('');
    setFormSuccess('');

    // Auto-calculate size in MB
    const calculatedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setSize(calculatedSize);

    // Clean device filename: remove any random affiliate hashes
    const cleanOriginal = cleanRawApkName(file.name);
    setOriginalApkName(cleanOriginal);

    // Set default clean download filename (use app name if present, else cleaned uploaded name)
    const defaultName = name.trim() ? getDefaultApkName() : cleanOriginal;
    setApkFileName(defaultName);

    // Try Supabase Storage upload
    if (isSupabaseConfigured()) {
      try {
        const result = await uploadSupabaseApk(file, defaultName);
        if (result.url) {
          setDownloadUrl(result.url);
          setIsUploadingApk(false);
          setFormSuccess(`APK file "${defaultName}" (${calculatedSize}) uploaded to Cloud Storage successfully! Permanent download link ready.`);
          return;
        } else {
          setIsUploadingApk(false);
          setDownloadUrl('');
          const isBucketMissing = result.error?.includes('Bucket not found') || result.error?.includes('NoSuchBucket') || result.error?.includes('not found');
          if (isBucketMissing) {
            setFormError('⚠️ Storage bucket "apks" is not created in Supabase yet! Create a public bucket named "apks" in Supabase Dashboard (Storage > New Bucket > "apks" with Public ON), OR switch to "Provide Download Link" to enter your external APK URL.');
          } else {
            setFormError(`⚠️ Cloud upload error: ${result.error || 'Check storage permissions'}. You can switch to "Provide Download Link" to enter an external URL.`);
          }
          return;
        }
      } catch (err: any) {
        setIsUploadingApk(false);
        setFormError(`Upload failed: ${err.message}. Switch to "Provide Download Link" to enter an external URL.`);
        return;
      }
    } else {
      setIsUploadingApk(false);
      setFormError('Cloud Database is not configured. Please switch to "Provide Download Link" to enter an external URL.');
    }
  };

  // Start Editing App
  const handleEditClick = (app: AppItem) => {
    setEditingAppId(app.id);
    setName(app.name);
    setDownloadUrl(app.downloadUrl);

    // Clean APK name (removing any random numbers or affiliate hashes from older uploads)
    const cleanApk = cleanRawApkName(app.apkFileName || app.name || '');
    setApkFileName(cleanApk);
    setOriginalApkName(cleanApk);

    setButtonText(app.buttonText || 'Download APK');
    setLogo(app.logo);
    setLogoPreview(app.logo);
    setRating(app.rating);
    setBadge(app.badge);
    setCategory(app.category);
    setSize(app.size);
    setSortOrder(app.sortOrder);
    setStatus(app.status === 'inactive' ? 'inactive' : 'active');
    setDescription(app.description || '');

    // Detect if current downloadUrl is an uploaded APK file or an external URL link
    const isUploadedFile = 
      app.downloadUrl.startsWith('blob:') || 
      app.downloadUrl.startsWith('data:') ||
      app.downloadUrl.includes('/storage/v1/object/public/apks/') ||
      app.downloadUrl.includes('/uploads/') ||
      (!app.downloadUrl.startsWith('http://') && !app.downloadUrl.startsWith('https://'));

    setDownloadSource(isUploadedFile ? 'upload' : 'link');

    setActiveTab('add');
    setFormSuccess('');
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Add Form
  const resetAppForm = () => {
    setEditingAppId(null);
    setName('');
    setDownloadSource('upload');
    setDownloadUrl('');
    setApkFileName('');
    setOriginalApkName('');
    setButtonText('Download APK');
    setLogo('');
    setLogoPreview('');
    setRating(4.9);
    setBadge('Verified');
    setCategory('Games');
    setSize('45 MB');
    setSortOrder(apps.length + 1);
    setStatus('active');
    setDescription('');
    setFormSuccess('');
    setFormError('');
  };

  // Save App (Add or Update)
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingLogo) {
      setFormError('Please wait for the logo upload to finish before saving.');
      return;
    }
    if (isUploadingApk) {
      setFormError('Please wait for the APK upload to finish before saving.');
      return;
    }
    if (!name.trim()) {
      setFormError('App name is required.');
      return;
    }

    if (downloadUrl.startsWith('blob:')) {
      setFormError('Cannot save a temporary browser blob URL. The APK must be uploaded to Cloud Storage or entered as an external download link (e.g. Google Drive, Mediafire).');
      return;
    }

    if (downloadSource === 'upload') {
      if (!downloadUrl.trim()) {
        setFormError('APK file has not been uploaded to Cloud Storage yet. Please select an APK file to upload, or switch to "Provide Download Link" to enter a direct download link.');
        return;
      }
    } else {
      if (!downloadUrl.trim()) {
        setFormError('Please enter a valid external download link or switch to "Upload Full APK".');
        return;
      }
    }

    const { url: resolvedDownloadUrl, fileName: resolvedApkFileName } = buildDownloadUrl(
      downloadUrl,
      apkFileName,
      name
    );

    if (editingAppId) {
      // Update existing
      const updatedItem: AppItem = {
        id: editingAppId,
        name: name.trim(),
        downloadUrl: resolvedDownloadUrl,
        apkFileName: resolvedApkFileName,
        buttonText: buttonText.trim() || 'Download APK',
        logo: logo.trim() || `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%236366f1'/><text x='50' y='58' font-size='34' font-weight='bold' fill='%23ffffff' text-anchor='middle'>${encodeURIComponent(name.trim().slice(0, 2).toUpperCase() || 'AP')}</text></svg>`,
        rating: Number(rating) || 4.9,
        badge: badge.trim() || 'Verified',
        category: category.trim() || 'Games',
        size: size.trim() || '45 MB',
        downloads: apps.find(a => a.id === editingAppId)?.downloads || 0,
        sortOrder: Number(sortOrder) || 0,
        status,
        description: description.trim()
      };

      const res = await upsertSupabaseApp(updatedItem);
      if (!res.success) {
        if (res.status === 401 || res.error?.includes('Unauthorized')) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('appvizo_admin_auth');
          sessionStorage.removeItem('raxo_admin_auth');
          setLoginError('Your admin session has expired. Please enter password to log in again.');
          return;
        }
        setFormError(res.error || 'Failed to save application to database.');
        return;
      }

      const updated = apps.map(app => (app.id === editingAppId ? updatedItem : app));
      setApps(updated);

      setFormSuccess(`App "${name}" updated & saved to Database successfully!`);
      setTimeout(() => {
        setActiveTab('apps');
        resetAppForm();
      }, 900);
    } else {
      // Create new
      const newApp: AppItem = {
        id: 'app-' + Date.now(),
        name: name.trim(),
        downloadUrl: resolvedDownloadUrl,
        apkFileName: resolvedApkFileName,
        buttonText: buttonText.trim() || 'Download APK',
        logo: logo.trim() || `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%236366f1'/><text x='50' y='58' font-size='34' font-weight='bold' fill='%23ffffff' text-anchor='middle'>${encodeURIComponent(name.trim().slice(0, 2).toUpperCase() || 'AP')}</text></svg>`,
        rating: Number(rating) || 4.9,
        badge: badge.trim() || 'Verified',
        category: category.trim() || 'Games',
        size: size.trim() || '45 MB',
        downloads: 0,
        sortOrder: Number(sortOrder) || (apps.length + 1),
        status,
        description: description.trim()
      };

      const res = await upsertSupabaseApp(newApp);
      if (!res.success) {
        if (res.status === 401 || res.error?.includes('Unauthorized')) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('appvizo_admin_auth');
          sessionStorage.removeItem('raxo_admin_auth');
          setLoginError('Your admin session has expired. Please enter password to log in again.');
          return;
        }
        setFormError(res.error || 'Failed to save application to database.');
        return;
      }

      setApps([newApp, ...apps]);

      setFormSuccess(`App "${name}" published & saved to Database successfully!`);
      setTimeout(() => {
        setActiveTab('apps');
        resetAppForm();
      }, 900);
    }
  };

  // Delete App
  const handleDeleteApp = async (id: string, appName: string) => {
    if (window.confirm(`Are you sure you want to delete "${appName}"?`)) {
      const res = await deleteSupabaseApp(id);
      if (!res.success) {
        if (res.status === 401 || res.error?.includes('Unauthorized')) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('appvizo_admin_auth');
          sessionStorage.removeItem('raxo_admin_auth');
          alert('Your admin session has expired. Please log in again.');
          return;
        }
        alert(`Failed to delete "${appName}": ${res.error || 'Server error'}`);
        return;
      }
      setApps(apps.filter(a => a.id !== id));
    }
  };

  // Clear All Applications
  const handleClearAllApps = async () => {
    if (window.confirm('Are you sure you want to delete all listed applications? This will clear them from both the website and database.')) {
      const appsToDelete = [...apps];
      let hasError = false;
      for (const app of appsToDelete) {
        const res = await deleteSupabaseApp(app.id);
        if (!res.success) {
          hasError = true;
          if (res.status === 401) {
            setIsAuthenticated(false);
            alert('Your session has expired. Please log in again.');
            return;
          }
        }
      }
      if (!hasError) {
        setApps([]);
      } else {
        const fresh = await fetchSupabaseApps(5000, true);
        if (fresh) setApps(fresh);
      }
    }
  };

  // Sync Apps from Cloud Database
  const handleResetApps = async () => {
    if (window.confirm('Re-sync and fetch latest apps from Cloud Database?')) {
      const fresh = await fetchSupabaseApps(5000, true);
      if (fresh && fresh.length > 0) {
        setApps(fresh);
        setFormSuccess('Apps synchronized from Cloud Database successfully!');
        return;
      }
      alert('Cloud Database is up to date.');
    }
  };

  // Save Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings = {
      siteName,
      siteTagline,
      siteDescription,
      footerText,
      telegramLink
    };

    const res = await updateSupabaseSettings(newSettings);
    if (!res.success) {
      if (res.status === 401 || res.error?.includes('Unauthorized')) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('appvizo_admin_auth');
        sessionStorage.removeItem('raxo_admin_auth');
        alert('Your admin session has expired. Please log in again.');
        return;
      }
      alert(`Failed to update settings: ${res.error || 'Unknown error'}`);
      return;
    }

    setSettings(newSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Save & Test Supabase Credentials
  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSbLoading(true);
    setSbStatus(null);

    saveSupabaseCredentials(sbUrl, sbKey);

    try {
      const data = await fetchSupabaseApps();
      if (data !== null) {
        setSbStatus('Connected successfully to Supabase! Loaded ' + data.length + ' apps.');
        if (data.length > 0) {
          setApps(data);
        }
      } else {
        setSbStatus('Connection failed. Make sure you have created the tables using supabase_schema.sql.');
      }
    } catch (err: any) {
      setSbStatus('Error: ' + err.message);
    } finally {
      setSbLoading(false);
    }
  };

  // Push all local apps to Supabase
  const handleSyncLocalToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      alert('Please configure your Supabase URL and Anon Key first.');
      return;
    }
    setSbLoading(true);
    let count = 0;
    for (const app of apps) {
      const ok = await upsertSupabaseApp(app);
      if (ok) count++;
    }
    await updateSupabaseSettings(settings);
    setSbLoading(false);
    setSbStatus(`Uploaded ${count} of ${apps.length} apps to Supabase!`);
  };

  // Handle Change Password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPassword(currentPass)) {
      setPassMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    changeAdminPassword(newPass);
    setPassMsg({ type: 'success', text: 'Password successfully changed!' });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  // Filtered Apps
  const filteredApps = apps.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloads || 0), 0);
  const activeCount = apps.filter(a => a.status === 'active').length;

  // =========================================================================
  // VIEW 0: Session Checking Spinner
  // =========================================================================
  if (isCheckingAuth) {
    return (
      <div className="admin-page-root admin-login-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 600 }}>
          <RefreshCw className="animate-spin" size={20} />
          <span>Verifying administrator session...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: Dedicated Full Page Login Screen
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-page-root admin-login-wrapper">
        <div className="admin-login-box">
          <div className="login-brand-icon">
            <Rocket size={28} />
          </div>
          <h1 className="login-title">{settings.siteName || 'Raxo'} Admin Portal</h1>
          <p className="login-subtitle">
            Sign in with your administrator password to manage applications, download links, and database settings.
          </p>

          {loginError && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                className="field-input" 
                placeholder="Enter admin password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                style={{ paddingRight: '44px' }}
                autoFocus
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn-primary-purple" style={{ width: '100%', padding: '13px' }}>
              Unlock Admin Dashboard
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <button 
              type="button" 
              className="btn-secondary-light" 
              onClick={onNavigateHome}
              style={{ width: '100%' }}
            >
              <ArrowLeft size={16} /> Back to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Dedicated Full Page Admin Dashboard
  // =========================================================================
  return (
    <div className="admin-page-root">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-brand" onClick={onNavigateHome}>
            <div className="admin-brand-icon">
              <Rocket size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="admin-brand-title">{settings.siteName || 'Raxo'}</span>
                <span className="admin-badge-role">Admin Console</span>
                {isSupabaseConfigured() && (
                  <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} /> Cloud DB
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-nav-actions">
            <button 
              type="button" 
              className="btn-nav-action" 
              onClick={onNavigateHome}
              title="Return to Public Website"
            >
              <ArrowLeft size={15} />
              <span>View Site</span>
            </button>
            <button 
              type="button" 
              className="btn-nav-action logout" 
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="admin-main-body">
        {/* Navigation Tabs Bar */}
        <div className="admin-tabs-bar">
          <button 
            type="button" 
            className={`admin-tab-item ${activeTab === 'apps' ? 'active' : ''}`}
            onClick={() => { setActiveTab('apps'); resetAppForm(); }}
          >
            <Layers size={17} />
            <span>Applications ({apps.length})</span>
          </button>
          <button 
            type="button" 
            className={`admin-tab-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => { setActiveTab('add'); if (!editingAppId) resetAppForm(); }}
          >
            <Plus size={17} />
            <span>{editingAppId ? 'Edit App' : 'Add New App'}</span>
          </button>
          <button 
            type="button" 
            className={`admin-tab-item ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            <Database size={17} />
            <span>Cloud Database</span>
          </button>
          <button 
            type="button" 
            className={`admin-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={17} />
            <span>Site Settings</span>
          </button>
          <button 
            type="button" 
            className={`admin-tab-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Key size={17} />
            <span>Change Password</span>
          </button>
        </div>

        {/* =================================================================
            TAB 1: All Applications Directory
            ================================================================= */}
        {activeTab === 'apps' && (
          <div>
            {/* Stats Overview */}
            <div className="admin-stats-row">
              <div className="admin-stat-card">
                <div>
                  <div className="stat-label">Total Listed Apps</div>
                  <div className="stat-value">{apps.length}</div>
                </div>
                <div className="stat-icon-wrap indigo">
                  <Layers size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <div className="stat-label">Active on Site</div>
                  <div className="stat-value">{activeCount}</div>
                </div>
                <div className="stat-icon-wrap emerald">
                  <CheckCircle2 size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <div className="stat-label">Total Downloads</div>
                  <div className="stat-value">{totalDownloads.toLocaleString()}</div>
                </div>
                <div className="stat-icon-wrap amber">
                  <Download size={22} />
                </div>
              </div>

              <div className="admin-stat-card">
                <div>
                  <div className="stat-label">Database Sync</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isSupabaseConfigured() ? 'Supabase Live' : 'Local Storage'}
                  </div>
                </div>
                <div className="stat-icon-wrap cyan">
                  <Database size={22} />
                </div>
              </div>
            </div>

            {/* Apps Card */}
            <div className="admin-content-card">
              <div className="card-topbar">
                <div className="card-topbar-title">
                  <span>Listed Applications</span>
                  <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px' }}>
                    {filteredApps.length} Apps
                  </span>
                </div>

                <div className="card-topbar-actions">
                  <div className="admin-search-box">
                    <Search size={16} className="admin-search-icon" />
                    <input 
                      type="text" 
                      className="admin-search-input"
                      placeholder="Search apps by name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn-primary-purple"
                    onClick={() => { resetAppForm(); setActiveTab('add'); }}
                  >
                    <Plus size={16} /> Add App
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-light"
                    style={{ color: '#dc2626', borderColor: '#fecaca' }}
                    onClick={handleClearAllApps}
                    title="Delete all applications from database"
                  >
                    <Trash2 size={15} /> Clear All Apps
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary-light"
                    onClick={handleResetApps}
                    title="Re-sync apps from Cloud Database"
                  >
                    <RotateCcw size={15} /> Sync DB
                  </button>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Application</th>
                      <th>Category</th>
                      <th>Rating &amp; Badge</th>
                      <th>Downloads</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                          No applications found matching &ldquo;{searchQuery}&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map(app => (
                        <tr key={app.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                <img 
                                  src={app.logo} 
                                  alt={app.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>{app.name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  Size: {app.size} • Order: #{app.sortOrder}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{app.category}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#d97706', fontWeight: 800 }}>★ {app.rating.toFixed(1)}</span>
                              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                {app.badge}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700 }}>{app.downloads.toLocaleString()}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              background: app.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                              color: app.status === 'active' ? '#059669' : '#64748b'
                            }}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <a 
                                href={buildDownloadUrl(app.downloadUrl, app.apkFileName, app.name).url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-secondary-light" 
                                style={{ padding: '7px 10px' }}
                                title="Test Download Link"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button 
                                type="button" 
                                className="btn-secondary-light" 
                                style={{ padding: '7px 12px' }}
                                onClick={() => handleEditClick(app)}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button 
                                type="button" 
                                className="btn-secondary-light" 
                                style={{ padding: '7px 10px', color: '#dc2626', borderColor: '#fecaca' }}
                                onClick={() => handleDeleteApp(app.id, app.name)}
                                title="Delete App"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (Completely eliminates squishing on phones) */}
              <div className="admin-mobile-cards">
                {filteredApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No apps found.
                  </div>
                ) : (
                  filteredApps.map(app => (
                    <div key={app.id} className="admin-mobile-item">
                      <div className="mobile-item-header">
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                          <img src={app.logo} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{app.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {app.category} • {app.size}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          background: app.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                          color: app.status === 'active' ? '#059669' : '#64748b'
                        }}>
                          {app.status}
                        </span>
                      </div>

                      <div className="mobile-item-details">
                        <div>
                          <span style={{ color: '#94a3b8' }}>Rating:</span> <strong>★ {app.rating.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Badge:</span> <strong>{app.badge}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Downloads:</span> <strong>{app.downloads}</strong>
                        </div>
                      </div>

                      <div className="mobile-item-actions">
                        <a 
                          href={buildDownloadUrl(app.downloadUrl, app.apkFileName, app.name).url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-secondary-light" 
                          style={{ flex: 1 }}
                        >
                          <ExternalLink size={14} /> Link
                        </a>
                        <button 
                          type="button" 
                          className="btn-secondary-light" 
                          style={{ flex: 1 }}
                          onClick={() => handleEditClick(app)}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn-secondary-light" 
                          style={{ color: '#dc2626', borderColor: '#fecaca', padding: '10px 14px' }}
                          onClick={() => handleDeleteApp(app.id, app.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: Add or Edit Application Form
            ================================================================= */}
        {activeTab === 'add' && (
          <div className="admin-content-card">
            <div className="card-topbar">
              <h2 className="card-topbar-title">
                {editingAppId ? `Edit Application: ${name}` : 'Add New Application'}
              </h2>
              <button 
                type="button" 
                className="btn-secondary-light"
                onClick={() => { resetAppForm(); setActiveTab('apps'); }}
              >
                Back to Apps
              </button>
            </div>

            <div className="admin-form-container">
              {formError && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveApp}>
                <div className="form-grid-layout">
                  {/* App Name */}
                  <div className="form-col-full">
                    <label className="field-label">Application Name *</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      placeholder="e.g. Nexo 45, Classic 200, Fifa 202"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* APK Package & Download Setup (Dual-Option Toggle) */}
                  <div className="form-col-full apk-setup-container">
                    <div className="apk-setup-header">
                      <div>
                        <label className="field-label" style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={20} color="#4f46e5" />
                          <span>Download Source &amp; Configuration *</span>
                        </label>
                        <span className="field-help" style={{ margin: '4px 0 0 0', display: 'block' }}>
                          Choose whether to upload an .APK file directly from your device or provide an external download link.
                        </span>
                      </div>
                    </div>

                    {/* Mode Toggle Switch */}
                    <div className="download-source-tabs">
                      <button
                        type="button"
                        className={`download-source-tab-btn ${downloadSource === 'upload' ? 'active' : ''}`}
                        onClick={() => {
                          setDownloadSource('upload');
                          setFormError('');
                        }}
                      >
                        <Upload size={17} />
                        <span>Upload Full APK File</span>
                      </button>
                      <button
                        type="button"
                        className={`download-source-tab-btn ${downloadSource === 'link' ? 'active' : ''}`}
                        onClick={() => {
                          setDownloadSource('link');
                          setFormError('');
                        }}
                      >
                        <ExternalLink size={17} />
                        <span>Provide Download Link</span>
                      </button>
                    </div>

                    {/* Hidden APK File Input */}
                    <input 
                      type="file" 
                      ref={apkFileInputRef} 
                      accept=".apk,application/vnd.android.package-archive" 
                      onChange={handleApkFileChange} 
                      style={{ display: 'none' }} 
                    />

                    {/* OPTION 1: Upload Full APK File */}
                    {downloadSource === 'upload' && (
                      <div className="source-content-panel">
                        {!(apkFileName || originalApkName || downloadUrl.startsWith('blob:') || downloadUrl.includes('.apk') || downloadUrl.includes('/storage/')) ? (
                          /* Empty State / Drag & Drop Upload Dropzone */
                          <div 
                            className="apk-dropzone"
                            onClick={() => apkFileInputRef.current?.click()}
                          >
                            <div className="dropzone-icon-circle">
                              <Upload size={28} />
                            </div>
                            <div className="dropzone-title">
                              {isUploadingApk ? 'Attaching & Uploading APK...' : 'Click to Upload .APK File'}
                            </div>
                            <div className="dropzone-subtitle">
                              Supports Android package files (.apk). File size and download package name will be auto-configured.
                            </div>
                            <button 
                              type="button" 
                              className="btn-primary-purple dropzone-btn"
                              disabled={isUploadingApk}
                            >
                              <Upload size={15} />
                              <span>{isUploadingApk ? 'Uploading...' : 'Select APK from Computer'}</span>
                            </button>
                          </div>
                        ) : (
                          /* Attached APK Box & Filename Customizer */
                          <div className="attached-apk-card">
                            <div className="attached-apk-header">
                              <div className="attached-apk-info">
                                <div className="attached-apk-icon">
                                  <CheckCircle2 size={22} color="#059669" />
                                </div>
                                <div>
                                  <div className="attached-apk-name">
                                    {originalApkName || apkFileName || 'Android APK Package'}
                                  </div>
                                  <div className="attached-apk-meta">
                                    <span className="apk-badge-size">{size || 'Ready'}</span>
                                    <span>• Package Ready for Direct Installation</span>
                                  </div>
                                </div>
                              </div>
                              <div className="attached-apk-actions">
                                <button 
                                  type="button" 
                                  onClick={() => apkFileInputRef.current?.click()}
                                  className="btn-secondary-light apk-action-btn"
                                  title="Replace with another APK file"
                                >
                                  <RefreshCw size={13} /> Replace APK
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => { 
                                    setApkFileName(''); 
                                    setOriginalApkName(''); 
                                    setDownloadUrl(''); 
                                  }}
                                  className="apk-action-btn-remove"
                                  title="Remove attached APK"
                                >
                                  <Trash2 size={13} /> Remove
                                </button>
                              </div>
                            </div>

                            {/* Download Filename Customizer */}
                            <div className="apk-filename-box">
                              <div className="apk-filename-top">
                                <label className="field-label" style={{ fontSize: '0.84rem', margin: 0, fontWeight: 700, color: '#1e293b' }}>
                                  Download File Name (What user&apos;s Android phone saves &amp; installs as)
                                </label>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <button 
                                    type="button" 
                                    onClick={handleUseDefaultApkName}
                                    className="btn-pill-choice"
                                    title="Reset to clean default name based on app title"
                                  >
                                    Use Default ({getDefaultApkName()})
                                  </button>
                                  {originalApkName && originalApkName !== getDefaultApkName() && (
                                    <button 
                                      type="button" 
                                      onClick={handleUseOriginalApkName}
                                      className="btn-pill-choice neutral"
                                      title="Use original file name as uploaded"
                                    >
                                      Use Uploaded Name
                                    </button>
                                  )}
                                </div>
                              </div>
                              <input 
                                type="text" 
                                className="field-input" 
                                placeholder={getDefaultApkName()}
                                value={apkFileName}
                                onChange={e => setApkFileName(e.target.value)}
                                style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.92rem' }}
                              />
                              <div className="field-help" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                <span>Android will prompt user to install with this file name. Keep default or customize.</span>
                                {downloadUrl && (
                                  <a 
                                    href={buildDownloadUrl(downloadUrl, apkFileName, name).url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                  >
                                    <ExternalLink size={13} /> Test Download
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OPTION 2: External Download Link */}
                    {downloadSource === 'link' && (
                      <div className="source-content-panel">
                        <div className="external-link-card">
                          <label className="field-label" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                            External Download Link / URL *
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="url" 
                              className="field-input" 
                              placeholder="https://drive.google.com/..., Mediafire, or direct APK link"
                              value={downloadUrl}
                              onChange={e => setDownloadUrl(e.target.value)}
                              required={downloadSource === 'link'}
                              style={{ flex: 1 }}
                            />
                            {downloadUrl && (
                              <a 
                                href={downloadUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-secondary-light"
                                style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <ExternalLink size={15} /> Test Link
                              </a>
                            )}
                          </div>
                          <span className="field-help" style={{ display: 'block', marginTop: '6px' }}>
                            Visitors clicking &quot;Download APK&quot; will be routed directly to this link.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Download Button Text & Optional Details (Applies to both) */}
                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                        <div>
                          <label className="field-label" style={{ fontSize: '0.84rem' }}>
                            Download Button Text
                          </label>
                          <input 
                            type="text" 
                            className="field-input" 
                            placeholder="Download APK" 
                            value={buttonText}
                            onChange={e => setButtonText(e.target.value)}
                          />
                          <span className="field-help">Default is &quot;Download APK&quot;. You can also set &quot;Install Now&quot;, &quot;Get App&quot;, etc.</span>
                        </div>

                        {downloadSource === 'link' && (
                          <div>
                            <label className="field-label" style={{ fontSize: '0.84rem' }}>
                              Package File Name (Optional)
                            </label>
                            <input 
                              type="text" 
                              className="field-input" 
                              placeholder={getDefaultApkName()}
                              value={apkFileName}
                              onChange={e => setApkFileName(e.target.value)}
                              style={{ fontFamily: 'monospace' }}
                            />
                            <span className="field-help">Optional suggested filename when downloaded.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload Box */}
                  <div className="form-col-full">
                    <label className="field-label">Application Logo / Icon</label>
                    <div className="logo-uploader-card">
                      <div className="logo-preview-box">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Preview" className="logo-preview-img" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon size={26} color="#ffffff" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          style={{ fontSize: '0.88rem' }}
                        />
                        <div className="field-help">
                          Upload image file from your device (PNG, JPG, SVG, WEBP). Or enter an image URL below.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* External Logo URL or R2 Key */}
                  <div className="form-col-full">
                    <label className="field-label">Or External Image URL / Storage Path</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      placeholder="https://example.com/logo.png or /assets/logos/..."
                      value={logo.startsWith('data:') ? '' : logo}
                      onChange={e => {
                        setLogo(e.target.value);
                        setLogoPreview(e.target.value);
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div className="form-col-full">
                    <label className="field-label">Visibility Status</label>
                    <select 
                      className="field-select"
                      value={status}
                      onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                    >
                      <option value="active">Active (Visible on Website)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="form-col-full">
                    <label className="field-label">Description (Optional)</label>
                    <textarea 
                      className="field-textarea"
                      rows={3}
                      placeholder="Short description or changelog for this application..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary-purple" style={{ padding: '12px 28px' }} disabled={isUploadingApk || isUploadingLogo}>
                    {isUploadingLogo ? 'Uploading Logo...' : isUploadingApk ? 'Uploading APK File...' : (editingAppId ? 'Update Application' : 'Publish Application')}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary-light"
                    onClick={() => { resetAppForm(); setActiveTab('apps'); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: Cloudflare Database & Storage Status
            ================================================================= */}
        {activeTab === 'supabase' && (
          <div className="admin-content-card">
            <div className="card-topbar">
              <h2 className="card-topbar-title">
                <Database size={20} color="#059669" />
                <span>Cloudflare D1 &amp; R2 Architecture</span>
              </h2>
            </div>

            <div className="admin-form-container">
              <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '20px' }}>
                Your Appvizo application runs on a fully isolated, production-grade Cloudflare stack. Database and file storage are completely integrated with Cloudflare D1 and R2.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>D1 Database</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>appvizo-db</div>
                  <div style={{ fontSize: '0.82rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Active &amp; Bound (apps &amp; settings)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>R2 Object Storage</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>appvizo-assets</div>
                  <div style={{ fontSize: '0.82rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Active &amp; Bound (logos/ &amp; apks/)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Edge Worker</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>appvizo-portal</div>
                  <div style={{ fontSize: '0.82rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Live on Cloudflare Global Edge
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn-primary-purple"
                  onClick={handleResetApps}
                >
                  <RefreshCw size={15} /> Re-Sync Applications from D1
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: Website Branding & SEO Settings
            ================================================================= */}
        {activeTab === 'settings' && (
          <div className="admin-content-card">
            <div className="card-topbar">
              <h2 className="card-topbar-title">Website Settings &amp; SEO</h2>
            </div>

            <div className="admin-form-container">
              {settingsSaved && (
                <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} /> Settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="field-label">Website Name</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={siteName}
                      onChange={e => setSiteName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Site Tagline</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={siteTagline}
                      onChange={e => setSiteTagline(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="field-label">SEO Description</label>
                    <textarea 
                      className="field-textarea" 
                      rows={3}
                      value={siteDescription}
                      onChange={e => setSiteDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="field-label">Telegram Channel Link</label>
                    <input 
                      type="url" 
                      className="field-input" 
                      placeholder="https://t.me/appvizo_official"
                      value={telegramLink}
                      onChange={e => setTelegramLink(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="field-label">Footer Copyright Text</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary-purple" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 5: Change Password
            ================================================================= */}
        {activeTab === 'password' && (
          <div className="admin-content-card">
            <div className="card-topbar">
              <h2 className="card-topbar-title">Change Administrator Password</h2>
            </div>

            <div className="admin-form-container" style={{ maxWidth: '480px' }}>
              {passMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  marginBottom: '18px',
                  background: passMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${passMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: passMsg.type === 'success' ? '#065f46' : '#dc2626'
                }}>
                  {passMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="field-label">Current Password</label>
                  <input 
                    type="password" 
                    className="field-input" 
                    placeholder="Enter current password"
                    value={currentPass}
                    onChange={e => setCurrentPass(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">New Password</label>
                  <input 
                    type="password" 
                    className="field-input" 
                    placeholder="At least 6 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="field-input" 
                    placeholder="Re-enter new password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary-purple" style={{ marginTop: '8px' }}>
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
