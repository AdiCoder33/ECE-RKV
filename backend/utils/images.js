function resolveProfileImage(keyOrUrl) {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith('http')) return keyOrUrl;
  const base = process.env.API_BASE_URL || '';
  return `${base}/uploads/profile/${encodeURIComponent(keyOrUrl)}`;
}

module.exports = { resolveProfileImage };

