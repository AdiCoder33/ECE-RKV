const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const profileDir = path.join(__dirname, '..', 'uploads', 'profile');
fs.mkdirSync(profileDir, { recursive: true });
const profileStorage = multer.diskStorage({
  destination: profileDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const profileUpload = multer({
  storage: profileStorage,
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

router.post('/profile', authenticateToken, profileUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const key = req.file.filename;
  const url = `${req.protocol}://${req.get('host')}/uploads/profile/${key}`;
  res.json({ key, url });
});

router.get('/profile/:key', authenticateToken, (req, res) => {
  const { key } = req.params;
  const url = `${req.protocol}://${req.get('host')}/uploads/profile/${key}`;
  res.json({ url });
});

module.exports = router;
