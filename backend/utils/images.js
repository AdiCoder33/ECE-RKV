const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const client = require('../lib/b2');

async function resolveProfileImage(keyOrUrl) {
  if (!keyOrUrl) return null;

  const isPrivate = process.env.B2_PRIVATE === 'true' || process.env.VITE_B2_PRIVATE === 'true';

  if (isPrivate) {
    if (keyOrUrl.startsWith('http')) {
      return keyOrUrl;
    }
    try {
      const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET, Key: keyOrUrl });
      return await getSignedUrl(client, command, { expiresIn: 3600 });
    } catch (err) {
      console.error('resolveProfileImage error:', err);
      return null;
    }
  }

  if (keyOrUrl.startsWith('http')) {
    return keyOrUrl;
  }
  if (process.env.B2_ENDPOINT && process.env.B2_BUCKET) {
    return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}/${encodeURIComponent(keyOrUrl)}`;
  }
  return keyOrUrl;
}

module.exports = { resolveProfileImage };
