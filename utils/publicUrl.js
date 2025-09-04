const STATIC_MODE = process.env.STATIC_MODE || 'app';
const STATIC_PREFIX = process.env.STATIC_PREFIX || '/uploads';
const STATIC_HOST = process.env.STATIC_HOST || '';

function ensureLeadingSlash(p) {
  return p.startsWith('/') ? p : `/${p}`;
}

module.exports = function buildPublicUrl(req, relativePath) {
  if (!relativePath) return null;

  const pathWithPrefix = ensureLeadingSlash(
    `${STATIC_PREFIX.replace(/\/+$/, '')}/${relativePath}`.replace(/\/+/g, '/')
  );

  if (STATIC_MODE === 'app') {
    // La app sirve /uploads
    return pathWithPrefix; // URL relativa (sirve para EJS y JSON)
  }

  // Modo proxy. Intentamos construir absoluta.
  const protoHdr = req.headers['x-forwarded-proto'];
  const hostHdr = req.headers['x-forwarded-host'];

  const proto = (protoHdr || req.protocol || 'http').toString().split(',')[0].trim();
  const host = (STATIC_HOST || hostHdr || req.get('host') || '').toString().split(',')[0].trim();

  if (!host) {
    // fallback a relativa si no tenemos host
    return pathWithPrefix;
  }
  return `${proto}://${host}${pathWithPrefix}`;
};
