import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // Common bot user agents
  const botAgents = [
    'googlebot',
    'yahoo! slurp',
    'bingbot',
    'yandex',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest/0.',
    'developers.google.com/+/web/snippet',
    'slackbot',
    'vkshare',
    'w3c_validator',
    'redditbot',
    'applebot',
    'whatsapp',
    'flipboard',
    'tumblr',
    'bitlybot',
    'skypeuripreview',
    'nuzzel',
    'discordbot',
    'google page speed',
    'qwantify',
    'pinterestbot',
    'bitrix link preview',
    'xing-contenttabreceiver',
    'chrome-lighthouse',
    'telegrambot',
    'prerender'
  ];

  // Static file extensions to ignore
  const ignoreExtensions = [
    '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg',
    '.gif', '.pdf', '.doc', '.txt', '.ico', '.rss', '.zip', '.mp3', '.rar',
    '.exe', '.wmv', '.doc', '.avi', '.ppt', '.mpg', '.mpeg', '.tif',
    '.wav', '.mov', '.psd', '.ai', '.xls', '.mp4', '.m4a', '.swf', '.dat',
    '.dmg', '.iso', '.flv', '.m4v', '.torrent', '.ttf', '.woff', '.woff2', '.svg', '.eot'
  ];

  const isBot = botAgents.some(bot => userAgent.includes(bot));
  const url = new URL(request.url);
  const fullActualUrl = request.url;

  const hasIgnoredExtension = ignoreExtensions.some(ext => 
    url.pathname.toLowerCase().endsWith(ext)
  );

  console.log('Middleware URL check:', {
    requestUrl: request.url,
    fullActualUrl,
    isBot
  });

  if (isBot && !hasIgnoredExtension) {
    const prerenderUrl = `https://service.prerender.io/${fullActualUrl}`;

    try {
      const res = await fetch(prerenderUrl, {
        headers: {
          'X-Prerender-Token': process.env.PRERENDER_TOKEN || 'wgMBw0rqHPP2mdE5TXLV',
          'User-Agent': request.headers.get('user-agent') || ''
        }
      });
      
      if (res.ok) {
        return new NextResponse(res.body, {
          status: res.status,
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'text/html',
          }
        });
      }
    } catch (err) {
      console.error('Prerender fetch error:', err);
      // Fallback below
    }
  }

  return NextResponse.next();
}

export const config = {
  // Add matchers to prevent matching API routes, static assets, etc.
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
