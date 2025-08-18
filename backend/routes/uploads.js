const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const client = require('../lib/b2');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const allowedTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

router.post('/chat', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;
  const type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
  res.json({ url, type, name: req.file.originalname });
});

router.post('/profile', authenticateToken, profileUpload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const key = `profiles/${Date.now()}-${req.file.originalname}`;

  try {
    await client.send(new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: process.env.B2_PRIVATE === 'true' ? undefined : 'public-read'
    }));

    let url;
    if (process.env.B2_PRIVATE === 'true') {
      const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key });
      url = await getSignedUrl(client, command, { expiresIn: 3600 });
    } else {
      url = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}/${encodeURIComponent(key)}`;
    }

    res.json({ key, url });
  } catch (err) {
    console.error('Profile upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/profile/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;
  const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key });
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  res.json({ url });
});

module.exports = router;
