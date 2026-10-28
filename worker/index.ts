// =============================================================================
// Cloudflare Worker for Appvizo
// Connects directly to shared D1 (raxo-db) and shared private R2 (raxo-assets)
// =============================================================================

export interface Env {
  DB: D1Database;
  RAXO_ASSETS: R2Bucket;
  ASSETS: {
    fetch: (request: Request | string) => Promise<Response>;
  };
}

function jsonResponse(data: unknown, status = 200, customHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...customHeaders
    }
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message, success: false }, status, {
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // 1. Private R2 Asset Delivery (/assets/logos/* or /assets/apks/*)
    if (pathname.startsWith('/assets/logos/') || pathname.startsWith('/assets/apks/')) {
      if (method !== 'GET' && method !== 'HEAD') {
        return errorResponse('Method Not Allowed', 405);
      }

      let assetKey = pathname.replace(/^\/assets\//, '');
      if (!assetKey || assetKey.includes('..') || assetKey.includes('\\') || assetKey.includes('\0')) {
        return errorResponse('Invalid asset path', 400);
      }

      assetKey = assetKey.replace(/^\/+/, '');
      const isLogo = assetKey.startsWith('logos/');
      const isApk = assetKey.startsWith('apks/');

      const filename = assetKey.split('/').pop() || '';
      let contentType = 'application/octet-stream';

      if (isLogo) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'webp') contentType = 'image/webp';
        else return errorResponse('Unsupported image format', 400);
      } else if (isApk) {
        if (!filename.toLowerCase().endsWith('.apk')) {
          return errorResponse('Only .apk packages are permitted', 400);
        }
        contentType = 'application/vnd.android.package-archive';
      }

      try {
        const object = await env.RAXO_ASSETS.get(assetKey);
        if (!object) {
          return errorResponse('Asset not found', 404);
        }

        const clientEtag = request.headers.get('if-none-match');
        if (clientEtag && clientEtag === object.httpEtag) {
          return new Response(null, {
            status: 304,
            headers: {
              'ETag': object.httpEtag,
              'Cache-Control': isLogo ? 'public, max-age=604800' : 'public, max-age=86400'
            }
          });
        }

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Length', object.size.toString());
        headers.set('ETag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');

        if (isLogo) {
          headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        } else if (isApk) {
          let downloadName = url.searchParams.get('download') || filename;
          downloadName = downloadName.replace(/[^a-zA-Z0-9.-]/g, '_');
          if (!downloadName.toLowerCase().endsWith('.apk')) downloadName += '.apk';
          headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
          headers.set('Cache-Control', 'public, max-age=86400');
        }

        return new Response(object.body as ReadableStream, { status: 200, headers });
      } catch (err: any) {
        return errorResponse(`Failed to stream asset: ${err?.message || 'Storage error'}`, 500);
      }
    }

    // 2. Apps Listing: /api/apps
    if (pathname === '/api/apps' || pathname === '/api/apps/') {
      if (method !== 'GET') return errorResponse('Method Not Allowed', 405);
      try {
        const { results } = await env.DB
          .prepare('SELECT * FROM apps WHERE status = "active" ORDER BY sort_order ASC, created_at DESC')
          .all<any>();

        const apps = (results || []).map((row: any) => {
          let description = row.description || '';
          let apkFileName: string | undefined;
          let buttonText: string | undefined;

          const metaMatch = description.match(/<!--METADATA:({.*?})-->/s);
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1]);
              apkFileName = meta.apkFileName;
              buttonText = meta.buttonText;
              description = description.replace(metaMatch[0], '').trim();
            } catch (e) {}
          }

          let logoUrl = row.logo || '';
          if (logoUrl.startsWith('logos/')) logoUrl = `/assets/${logoUrl}`;

          let downloadUrl = row.download_url || '';
          if (downloadUrl.startsWith('apks/')) downloadUrl = `/assets/${downloadUrl}`;

          return {
            id: String(row.id),
            name: row.name,
            logo: logoUrl,
            downloadUrl,
            rating: Number(row.rating) || 4.9,
            badge: row.badge || 'Verified',
            category: row.category || 'Games',
            size: row.size || '35 MB',
            downloads: Number(row.downloads) || 0,
            status: row.status,
            sortOrder: Number(row.sort_order) || 0,
            description,
            apkFileName,
            buttonText
          };
        });

        return jsonResponse(apps, 200, {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        });
      } catch (err: any) {
        return errorResponse(`Database error: ${err?.message}`, 500);
      }
    }

    // 3. Atomic Download Counter: /api/apps/:id/download
    const downloadMatch = pathname.match(/^\/api\/apps\/([^/]+)\/download$/);
    if (downloadMatch) {
      if (method !== 'POST') return errorResponse('Method Not Allowed', 405);
      const id = decodeURIComponent(downloadMatch[1]);
      try {
        const result = await env.DB
          .prepare('UPDATE apps SET downloads = downloads + 1 WHERE id = ?')
          .bind(id)
          .run();

        return jsonResponse({ success: true, id, downloadsIncremented: (result.meta?.changes ?? 0) > 0 });
      } catch (err: any) {
        return errorResponse(`Download counter failed: ${err?.message}`, 500);
      }
    }

    // 4. Site Settings: /api/settings
    if (pathname === '/api/settings' || pathname === '/api/settings/') {
      if (method !== 'GET') return errorResponse('Method Not Allowed', 405);
      try {
        const row = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<any>();
        return jsonResponse({
          siteName: row?.site_name || 'Appvizo',
          siteTagline: row?.site_tagline || 'Discover & Download Verified Apps & Games',
          siteDescription: row?.site_description || 'Direct verified APK downloads.',
          footerText: row?.footer_text || '© 2026 Appvizo. All rights reserved.',
          telegramLink: row?.telegram_link || 'https://t.me/appvizo_official'
        });
      } catch (err: any) {
        return errorResponse(`Settings error: ${err?.message}`, 500);
      }
    }

    // Fallback: 404 for unknown /api/*
    if (pathname.startsWith('/api/')) {
      return errorResponse(`Endpoint not found: ${pathname}`, 404);
    }

    // 5. Static Assets & SPA Routing
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
