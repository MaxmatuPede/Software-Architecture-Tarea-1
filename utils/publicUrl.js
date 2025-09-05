const { STATIC_PREFIX } = require('../config/static');

function ensureLeadingSlash(p) {
  return p.startsWith('/') ? p : `/${p}`;
}

module.exports = function buildPublicUrl(relativePath) {
  if (!relativePath) return null;

  const pathWithPrefix = ensureLeadingSlash(
    `${STATIC_PREFIX.replace(/\/+$/, '')}/${relativePath}`.replace(/\/+/g, '/')
  );

  return pathWithPrefix;
};
