const express = require('express');
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const client = require('../lib/b2');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function generateKey(originalName) {
  return `${Date.now()}-${originalName}`;
}

function getPublicUrl(key) {
  return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}/${key}`;
}

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const key = generateKey(req.file.originalname);

  try {
    await client.send(new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    let url;
    if (process.env.B2_PRIVATE === 'true') {
      const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key });
      url = await getSignedUrl(client, command, { expiresIn: 3600 });
    } else {
      url = getPublicUrl(key);
    }

    res.json({ key, url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    if (process.env.B2_PRIVATE === 'true') {
      const command = new GetObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key });
      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      return res.json({ url });
    }

    return res.redirect(getPublicUrl(key));
  } catch (err) {
    console.error('Get file error:', err);
    res.status(500).json({ message: 'Could not generate file URL' });
  }
});

router.delete('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: key,
    }));
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Deletion failed' });
  }
});

module.exports = router;
