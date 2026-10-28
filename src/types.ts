export interface AppItem {
  id: string;
  name: string;
  logo: string;
  downloadUrl: string;
  rating: number;
  badge: string;
  category: string;
  size: string;
  downloads: number;
  status: string;
  sortOrder: number;
  description: string;
  apkFileName?: string;
  buttonText?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  footerText: string;
  telegramLink: string;
}
