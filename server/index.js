import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config, uploadsDir } from './config.js';
import { createSession, destroySession, getSession, requireAuth } from './auth.js';

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(express.json({ limit: '2mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ error: '请求 JSON 格式不正确' });
    return;
  }
  next(err);
});

app.get('/api/session', getSession);
app.post('/api/session', createSession);
app.delete('/api/session', destroySession);

app.use('/api', requireAuth);

app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use('/uploads', express.static(uploadsDir, {
  immutable: true,
  maxAge: '30d',
}));

if (fs.existsSync(config.distDir)) {
  app.use(express.static(config.distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || '服务器错误' });
});

app.listen(config.port, () => {
  console.log(`Wechat editor server listening on ${config.port}`);
});
