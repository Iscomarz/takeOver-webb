import { sequence } from '@sveltejs/kit/hooks';
import { json } from '@sveltejs/kit';

// ==========================================
// 1. LISTA NEGRA DE BOTS & SCRAPERS AGRESIVOS
// ==========================================
const BLOCKED_BOTS_REGEX = new RegExp(
  [
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'petalbot',
    'bytespider',
    'gptbot',
    'claudebot',
    'ccbot',
    'dataforseobot',
    'sogou',
    'exabot',
    'zoominfobot',
    'blexbot',
    'yandex',
    'serpstatbot',
    'criteo'
  ].join('|'),
  'i'
);

// ==========================================
// 2. DEFENDER CONTRA TRAVERSAL & ESCÁNERES
// ==========================================
const BLOCKED_PATHS_REGEX = new RegExp(
  [
    '^/\\.env',
    '^/\\.git',
    '^/\\.config',
    '^/wp-',
    '^/xmlrpc\\.php',
    '^/phpmyadmin',
    '^/pma',
    '^/admin\\.php',
    '\\.(php|asp|aspx|jsp|cgi|bak|sql)$',
    '\\.\\.' // Path traversal attempt (../)
  ].join('|'),
  'i'
);

// ==========================================
// 3. CONFIGURACIÓN DE RATE LIMITING POR IP
// ==========================================
const CRITICAL_ROUTES = ['/api/checkout', '/api/login', '/api/registro-invitacion', '/checkout'];

const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 15; // Máximo 15 peticiones por minuto en rutas críticas

// Limpieza periódica de memoria para evitar fugas (Memory Leaks)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      ipRequestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Extrae la IP real del cliente considerando los headers de proxies de Vercel/Cloudflare
 */
function getClientIP(event) {
  const xForwardedFor = event.request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return (
    event.request.headers.get('x-real-ip') ||
    (typeof event.getClientAddress === 'function' ? event.getClientAddress() : '127.0.0.1')
  );
}

// ==========================================
// HOOK 1: BLOQUEO DE BOTS Y ESCÁNERES
// ==========================================
async function botAndScanBlocker({ event, resolve }) {
  const userAgent = event.request.headers.get('user-agent') || '';
  const pathname = event.url.pathname;

  // 1. Validar User-Agent malicioso
  if (userAgent && BLOCKED_BOTS_REGEX.test(userAgent)) {
    console.warn(`[SECURITY] Bot bloqueado: ${userAgent} en IP: ${getClientIP(event)}`);
    return new Response('Access Denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // 2. Validar intentos de Traversal o Escáneres vulnerables
  if (BLOCKED_PATHS_REGEX.test(pathname)) {
    console.warn(`[SECURITY] Escáner bloqueado en ruta: ${pathname} desde IP: ${getClientIP(event)}`);
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return resolve(event);
}

// ==========================================
// HOOK 2: RATE LIMITER EN RUTAS CRÍTICAS
// ==========================================
async function rateLimiter({ event, resolve }) {
  const pathname = event.url.pathname;

  const isCritical = CRITICAL_ROUTES.some((route) => pathname.startsWith(route));

  if (isCritical) {
    const clientIP = getClientIP(event);
    const now = Date.now();
    const currentData = ipRequestCounts.get(clientIP) || { count: 0, startTime: now };

    if (now - currentData.startTime > RATE_LIMIT_WINDOW_MS) {
      currentData.count = 1;
      currentData.startTime = now;
    } else {
      currentData.count += 1;
    }

    ipRequestCounts.set(clientIP, currentData);

    if (currentData.count > MAX_REQUESTS_PER_WINDOW) {
      console.warn(`[RATE LIMIT EXCEEDED] IP: ${clientIP} en ruta: ${pathname}`);
      return json(
        { error: 'Demasiadas solicitudes. Por favor, reintente en un minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }
  }

  return resolve(event);
}

// ==========================================
// HOOK 3: INYECCIÓN DE SECURITY HEADERS
// ==========================================
async function securityHeaders({ event, resolve }) {
  const response = await resolve(event);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const handle = sequence(botAndScanBlocker, rateLimiter, securityHeaders);
