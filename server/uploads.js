import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { config, uploadsDir } from './config.js';

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const extensionByMime = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, cb) {
    const ext = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${nanoid(10)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('仅支持 PNG、JPG、WebP、GIF 图片'));
      return;
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) {
      error.status = 400;
      next(error);
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: '请选择图片文件' });
      return;
    }

    res.status(201).json({
      data: {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      },
    });
  });
});

export default router;
