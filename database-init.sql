-- =============================================================================
-- Cloudflare D1 Database Schema and Seed Data for Appvizo
-- Database Name: appvizo-db
-- Database ID: 8bde1967-babd-4fb1-80c3-2ed550766207
-- =============================================================================

CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '',
    download_url TEXT NOT NULL,
    rating REAL DEFAULT 4.9,
    badge TEXT DEFAULT 'Verified',
    category TEXT DEFAULT 'Games',
    size TEXT DEFAULT '45 MB',
    downloads INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_sort_order ON apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
    site_name TEXT DEFAULT 'Appvizo',
    site_tagline TEXT DEFAULT 'Discover & Download Verified Apps & Games',
    site_description TEXT DEFAULT 'Appvizo provides fast, safe and verified direct download links for top trending games and utilities.',
    footer_text TEXT DEFAULT '© 2026 Appvizo. All rights reserved.',
    telegram_link TEXT DEFAULT 'https://t.me/appvizo_official'
);

-- Seed Settings
INSERT OR IGNORE INTO settings (id, site_name, site_tagline, site_description, footer_text, telegram_link) 
VALUES (1, 'Appvizo', 'Discover & Download Verified Apps & Games', 'Appvizo provides fast, safe and verified direct download links for top trending games and utilities.', '© 2026 Appvizo. All rights reserved.', 'https://t.me/appvizo_official');

-- Seed 14 Active Apps
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792605939512', 'Classic 500', 'logos/classic-500_app-1792605939512.png', 'apks/1793095148056_classic-500.apk', 4.9, 'Verified', 'Games', '34.0 MB', 3745, 'active', 1, '<!--METADATA:{"apkFileName":"classic-500.apk","buttonText":"Download APK"}-->', '2026-10-21T18:05:39.734936+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606006328', 'Fifa 202', 'logos/fifa-202_app-1792606006328.jpg', 'apks/1792942209412_fifa-202.apk', 4.9, 'Verified', 'Games', '34.0 MB', 2251, 'active', 2, '<!--METADATA:{"apkFileName":"fifa-202.apk","buttonText":"Download APK"}-->', '2026-10-21T18:06:46.996455+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606045386', 'Nexo 45', 'logos/nexo-45_app-1792606045386.jpg', 'apks/1792950844255_nexo-45.apk', 4.9, 'Verified', 'Games', '33.8 MB', 1824, 'active', 3, '<!--METADATA:{"apkFileName":"nexo-45.apk","buttonText":"Download APK"}-->', '2026-10-21T18:07:25.732963+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606096790', 'Grok 24', 'logos/grok-24_app-1792606096790.png', 'apks/1792942284347_grok-24.apk', 4.9, 'Verified', 'Games', '34.0 MB', 1760, 'active', 4, '<!--METADATA:{"apkFileName":"grok-24.apk","buttonText":"Download APK"}-->', '2026-10-21T18:08:17.245104+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606196485', 'Lemon 27', 'logos/lemon-27_app-1792606196485.jpg', 'apks/1792942318680_lemon-27.apk', 4.9, 'Verified', 'Games', '33.8 MB', 1143, 'active', 6, '<!--METADATA:{"apkFileName":"lemon-27.apk","buttonText":"Download APK"}-->', '2026-10-21T18:09:56.656054+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606257946', 'Tic Tac Toe', 'logos/tic-tac-toe_app-1792606257946.jpg', 'apks/1792942353291_tic-tac-toe.apk', 4.9, 'Verified', 'Games', '29.9 MB', 3093, 'active', 7, '<!--METADATA:{"apkFileName":"tic-tac-toe.apk","buttonText":"Download APK"}-->', '2026-10-21T18:10:58.335955+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792909070889', 'Pop 101', 'logos/pop-101_app-1792909070889.webp', 'apks/1792942385761_pop-101.apk', 4.9, 'Verified', 'Games', '33.9 MB', 1312, 'active', 8, '<!--METADATA:{"apkFileName":"pop-101.apk","buttonText":"Download APK"}-->', '2026-10-25T06:17:51.491583+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792909116091', 'Dora 121', 'logos/dora-121_app-1792909116091.webp', 'apks/1792942415928_dora-121.apk', 4.9, 'Verified', 'Games', '33.8 MB', 1397, 'active', 9, '<!--METADATA:{"apkFileName":"dora-121.apk","buttonText":"Download APK"}-->', '2026-10-25T06:18:36.699034+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792909147647', 'Ram 404', 'logos/ram-404_app-1792909147647.webp', 'apks/1792974595135_ram-404.apk', 4.9, 'Verified', 'Games', '30.0 MB', 995, 'active', 10, '<!--METADATA:{"apkFileName":"ram-404.apk","buttonText":"Download APK"}-->', '2026-10-25T06:19:08.235837+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792606630210', 'Zivo 67', 'logos/zivo-67_app-1792606630210.jpg', 'apks/1792951141632_zivo-67.apk', 4.9, 'Verified', 'Games', '33.6 MB', 2356, 'active', 11, '<!--METADATA:{"apkFileName":"zivo-67.apk","buttonText":"Download APK"}-->', '2026-10-21T18:17:11.222546+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1792909191083', 'Wish 789', 'logos/wish-789_app-1792909191083.webp', 'apks/1792942471818_wish-789.apk', 4.9, 'Verified', 'Games', '34.1 MB', 1698, 'active', 11, '<!--METADATA:{"apkFileName":"wish-789.apk","buttonText":"Download APK"}-->', '2026-10-25T06:19:51.863418+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1793030055293', 'Fomo Go Vip', 'logos/fomo-go-vip_app-1793030055293.jpg', 'apks/1793030025976_rummyzip.apk', 4.9, 'Verified', 'Games', '34.0 MB', 491, 'active', 12, '<!--METADATA:{"apkFileName":"fomo-go-vip.apk","buttonText":"Download APK"}-->', '2026-10-26T15:54:15.561217+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1793030542073', 'Fomo Go', 'logos/fomo-go_app-1793030542073.png', 'apks/1793030517350_viprummy.apk', 4.9, 'Verified', 'Games', '33.6 MB', 485, 'active', 13, '<!--METADATA:{"apkFileName":"fomo-go.apk","buttonText":"Download APK"}-->', '2026-10-26T16:02:23.094053+00:00');
INSERT OR IGNORE INTO apps (id, name, logo, download_url, rating, badge, category, size, downloads, status, sort_order, description, created_at) VALUES ('app-1793030632147', 'BOOMBAM MUST', 'logos/boombam-must_app-1793030632147.png', 'apks/1793095619806_boombam-must.apk', 4.9, 'Verified', 'Games', '33.9 MB', 673, 'active', 14, '<!--METADATA:{"apkFileName":"boombam-must.apk","buttonText":"Download APK"}-->', '2026-10-26T16:03:53.626901+00:00');
