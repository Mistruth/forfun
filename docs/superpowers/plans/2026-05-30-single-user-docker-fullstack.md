# Single-User Docker Fullstack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user private fullstack version of the WeChat long-image editor with password login, server-backed template CRUD, image upload, and Docker startup.

**Architecture:** Add a Node/Express server that serves the Vite `dist/` build, protects `/api/*` with a signed HttpOnly session cookie, stores templates in SQLite, and stores uploaded images under `/data/uploads`. Keep the React editor mostly unchanged by replacing the existing `templateStore` and `imageStore` implementations with API-backed versions.

**Tech Stack:** React 18, Vite 5, Express, better-sqlite3, multer, cookie, nanoid, Docker multi-stage build, Docker Compose volume persistence.

---

## File Structure

- Create `server/index.js`: starts Express, mounts auth/template/image APIs, serves `/uploads/*`, and falls back to `dist/index.html`.
- Create `server/config.js`: reads `PORT`, `DATA_DIR`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `MAX_UPLOAD_MB`, and computes paths.
- Create `server/auth.js`: signs/verifies session cookies, exposes auth middleware and session handlers.
- Create `server/db.js`: initializes SQLite and provides template CRUD helpers.
- Create `server/templates.js`: validates template payloads and exposes template routes.
- Create `server/uploads.js`: handles image upload validation and safe filenames.
- Create `src/lib/apiClient.js`: shared browser fetch wrapper for same-origin API calls.
- Create `src/lib/authStore.js`: browser auth calls for session check, login, logout.
- Create `src/components/LoginGate.jsx`: blocks the editor until authenticated.
- Modify `src/App.jsx`: wrap app routes in `LoginGate` and remove direct template IndexedDB initialization.
- Replace `src/lib/templateStore.js`: call `/api/templates` instead of IndexedDB while preserving current method names.
- Replace `src/lib/imageStore.js`: upload images to `/api/images`; leave existing `idb-image:*` helpers as compatibility no-ops where needed.
- Modify `src/components/BlocksPreview.jsx` if needed: ensure unresolved legacy image refs render as empty strings instead of throwing.
- Modify `package.json`: add server dependencies and start script.
- Create `Dockerfile`, `docker-compose.yml`, `.dockerignore`.
- Modify `.env.example`: document server env vars.
- Modify `README.md`: document local dev, production start, Docker start, and data persistence.

---

### Task 1: Server Dependencies and Configuration

**Files:**
- Modify: `package.json`
- Create: `server/config.js`

- [ ] **Step 1: Add server dependencies and scripts**

Edit `package.json` so the `scripts` object includes:

```json
{
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "export:image": "node scripts/export-image.mjs",
  "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview",
  "start": "node server/index.js"
}
```

Add these dependencies under `dependencies`:

```json
{
  "better-sqlite3": "^11.10.0",
  "cookie": "^1.0.2",
  "express": "^4.21.2",
  "mime-types": "^2.1.35",
  "multer": "^1.4.5-lts.2",
  "nanoid": "^5.1.5"
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` updates and install exits with code 0.

- [ ] **Step 3: Create config module**

Create `server/config.js`:

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  rootDir,
  distDir: path.join(rootDir, 'dist'),
  port: toPositiveInteger(process.env.PORT, 8080),
  dataDir: process.env.DATA_DIR || path.join(rootDir, 'data'),
  adminPassword: process.env.ADMIN_PASSWORD || 'change-me',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  maxUploadMb: toPositiveInteger(process.env.MAX_UPLOAD_MB, 8),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const dbPath = path.join(config.dataDir, 'app.db');
export const uploadsDir = path.join(config.dataDir, 'uploads');
```

- [ ] **Step 4: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml server/config.js
git commit -m "chore: add server runtime dependencies"
```

Expected: commit succeeds.

---

### Task 2: SQLite Template Store

**Files:**
- Create: `server/db.js`

- [ ] **Step 1: Create SQLite helper**

Create `server/db.js`:

```js
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { config, dbPath } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  create table if not exists templates (
    id text primary key,
    name text not null,
    description text not null default '',
    category text not null default '我的模板',
    cover text not null default '📄',
    blocks text not null,
    created_at integer not null,
    updated_at integer not null
  );
`);

const rowToTemplate = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  cover: row.cover,
  blocks: JSON.parse(row.blocks),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listStmt = db.prepare('select * from templates order by updated_at desc');
const getStmt = db.prepare('select * from templates where id = ?');
const insertStmt = db.prepare(`
  insert into templates (id, name, description, category, cover, blocks, created_at, updated_at)
  values (@id, @name, @description, @category, @cover, @blocks, @createdAt, @updatedAt)
`);
const updateStmt = db.prepare(`
  update templates
  set name = @name,
      description = @description,
      category = @category,
      cover = @cover,
      blocks = @blocks,
      updated_at = @updatedAt
  where id = @id
`);
const deleteStmt = db.prepare('delete from templates where id = ?');

export const templateDb = {
  list() {
    return listStmt.all().map(rowToTemplate);
  },

  get(id) {
    const row = getStmt.get(id);
    return row ? rowToTemplate(row) : null;
  },

  save(template) {
    const now = Date.now();
    const id = template.id || `tpl_${nanoid(12)}`;
    const existing = getStmt.get(id);
    const record = {
      id,
      name: template.name,
      description: template.description || '',
      category: template.category || '我的模板',
      cover: template.cover || '📄',
      blocks: JSON.stringify(template.blocks),
      createdAt: existing?.created_at || now,
      updatedAt: now,
    };

    if (existing) {
      updateStmt.run(record);
    } else {
      insertStmt.run(record);
    }

    return this.get(id);
  },

  remove(id) {
    const result = deleteStmt.run(id);
    return result.changes > 0;
  },
};
```

- [ ] **Step 2: Smoke test DB module**

Run:

```bash
node -e "import('./server/db.js').then(({ templateDb }) => console.log(Array.isArray(templateDb.list())))"
```

Expected output includes:

```txt
true
```

- [ ] **Step 3: Commit**

Run:

```bash
git add server/db.js data
git reset data || true
git commit -m "feat: add sqlite template store"
```

Expected: only `server/db.js` is committed. The local `data/` directory, if created by the smoke test, is not committed.

---

### Task 3: Auth and HTTP Server

**Files:**
- Create: `server/auth.js`
- Create: `server/index.js`

- [ ] **Step 1: Create auth module**

Create `server/auth.js`:

```js
import crypto from 'node:crypto';
import cookie from 'cookie';
import { config } from './config.js';

const COOKIE_NAME = 'wechat_editor_session';
const SESSION_VALUE = 'authenticated';

const sign = (value) => {
  return crypto
    .createHmac('sha256', config.sessionSecret)
    .update(value)
    .digest('base64url');
};

const createCookieValue = () => {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`;
};

const isValidCookieValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  const [payload, signature] = value.split('.');
  if (payload !== SESSION_VALUE || !signature) return false;
  const expected = sign(payload);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export const isAuthenticated = (req) => {
  const parsed = cookie.parse(req.headers.cookie || '');
  return isValidCookieValue(parsed[COOKIE_NAME]);
};

export const requireAuth = (req, res, next) => {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  res.status(401).json({ error: '未登录' });
};

export const getSession = (req, res) => {
  res.json({ data: { authenticated: isAuthenticated(req) } });
};

export const createSession = (req, res) => {
  const password = String(req.body?.password || '');
  if (!password || password !== config.adminPassword) {
    res.status(401).json({ error: '口令不正确' });
    return;
  }

  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, createCookieValue(), {
    ...cookieOptions,
    secure: config.nodeEnv === 'production',
  }));
  res.json({ data: { authenticated: true } });
};

export const destroySession = (req, res) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    ...cookieOptions,
    maxAge: 0,
    secure: config.nodeEnv === 'production',
  }));
  res.json({ data: { authenticated: false } });
};
```

- [ ] **Step 2: Create Express server skeleton**

Create `server/index.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config, uploadsDir } from './config.js';
import { createSession, destroySession, getSession } from './auth.js';

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(express.json({ limit: '2mb' }));

app.get('/api/session', getSession);
app.post('/api/session', createSession);
app.delete('/api/session', destroySession);

app.use('/uploads', express.static(uploadsDir, {
  immutable: true,
  maxAge: '30d',
}));

if (fs.existsSync(config.distDir)) {
  app.use(express.static(config.distDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: '接口不存在' });
      return;
    }
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
```

- [ ] **Step 3: Verify session endpoints**

Run:

```bash
ADMIN_PASSWORD=test SESSION_SECRET=secret PORT=8090 node server/index.js
```

In a second shell, run:

```bash
curl -s http://localhost:8090/api/session
curl -i -s -X POST http://localhost:8090/api/session -H 'content-type: application/json' -d '{"password":"bad"}'
curl -i -s -X POST http://localhost:8090/api/session -H 'content-type: application/json' -d '{"password":"test"}'
```

Expected:

```txt
{"data":{"authenticated":false}}
HTTP/1.1 401 Unauthorized
HTTP/1.1 200 OK
Set-Cookie: wechat_editor_session=...
```

Stop the server with `Ctrl+C`.

- [ ] **Step 4: Commit**

Run:

```bash
git add server/auth.js server/index.js
git commit -m "feat: add password session server"
```

Expected: commit succeeds.

---

### Task 4: Template API Routes

**Files:**
- Create: `server/templates.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create template routes**

Create `server/templates.js`:

```js
import express from 'express';
import { templateDb } from './db.js';

const router = express.Router();

const assertStringLength = (value, label, max) => {
  const text = String(value || '').trim();
  if (!text) {
    const error = new Error(`${label}不能为空`);
    error.status = 400;
    throw error;
  }
  if (text.length > max) {
    const error = new Error(`${label}不能超过 ${max} 个字符`);
    error.status = 400;
    throw error;
  }
  return text;
};

const normalizeTemplatePayload = (body, existing = {}) => {
  const name = assertStringLength(body.name ?? existing.name, '模板名称', 50);
  const description = String(body.description ?? existing.description ?? '').trim();
  if (description.length > 200) {
    const error = new Error('模板描述不能超过 200 个字符');
    error.status = 400;
    throw error;
  }

  const blocks = body.blocks ?? existing.blocks;
  if (!Array.isArray(blocks)) {
    const error = new Error('blocks 必须是数组');
    error.status = 400;
    throw error;
  }

  return {
    id: body.id || existing.id,
    name,
    description,
    category: String(body.category || existing.category || '我的模板'),
    cover: String(body.cover || existing.cover || '📄'),
    blocks,
  };
};

router.get('/', (req, res) => {
  res.json({ data: templateDb.list() });
});

router.post('/', (req, res, next) => {
  try {
    const payload = normalizeTemplatePayload(req.body || {});
    const saved = templateDb.save(payload);
    res.status(201).json({ data: saved });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res) => {
  const template = templateDb.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json({ data: template });
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = templateDb.get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: '模板不存在' });
      return;
    }
    const payload = normalizeTemplatePayload({ ...req.body, id: req.params.id }, existing);
    const saved = templateDb.save(payload);
    res.json({ data: saved });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res) => {
  const removed = templateDb.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: '模板不存在' });
    return;
  }
  res.json({ data: { id: req.params.id } });
});

export default router;
```

- [ ] **Step 2: Mount protected template routes**

Modify `server/index.js` imports:

```js
import { createSession, destroySession, getSession, requireAuth } from './auth.js';
import templateRoutes from './templates.js';
```

Add after session routes:

```js
app.use('/api/templates', requireAuth, templateRoutes);
```

- [ ] **Step 3: Verify template auth and CRUD**

Run:

```bash
ADMIN_PASSWORD=test SESSION_SECRET=secret PORT=8090 node server/index.js
```

In a second shell, run:

```bash
curl -i -s http://localhost:8090/api/templates
curl -c /tmp/wechat-editor.cookies -s -X POST http://localhost:8090/api/session -H 'content-type: application/json' -d '{"password":"test"}'
curl -b /tmp/wechat-editor.cookies -s -X POST http://localhost:8090/api/templates -H 'content-type: application/json' -d '{"name":"测试模板","description":"","cover":"📄","blocks":[]}'
curl -b /tmp/wechat-editor.cookies -s http://localhost:8090/api/templates
```

Expected:

```txt
HTTP/1.1 401 Unauthorized
{"data":{"authenticated":true}}
{"data":{"id":"tpl_...
{"data":[{"id":"tpl_...
```

Stop the server.

- [ ] **Step 4: Commit**

Run:

```bash
git add server/templates.js server/index.js
git commit -m "feat: add protected template api"
```

Expected: commit succeeds.

---

### Task 5: Image Upload API

**Files:**
- Create: `server/uploads.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create upload route**

Create `server/uploads.js`:

```js
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
```

- [ ] **Step 2: Mount protected image route**

Modify `server/index.js` imports:

```js
import uploadRoutes from './uploads.js';
```

Add after template route mounting:

```js
app.use('/api/images', requireAuth, uploadRoutes);
```

- [ ] **Step 3: Verify upload auth**

Run:

```bash
ADMIN_PASSWORD=test SESSION_SECRET=secret PORT=8090 node server/index.js
```

In a second shell, run:

```bash
curl -i -s -X POST http://localhost:8090/api/images
curl -c /tmp/wechat-editor.cookies -s -X POST http://localhost:8090/api/session -H 'content-type: application/json' -d '{"password":"test"}'
printf 'not-image' > /tmp/not-image.txt
curl -i -s -b /tmp/wechat-editor.cookies -F image=@/tmp/not-image.txt http://localhost:8090/api/images
```

Expected:

```txt
HTTP/1.1 401 Unauthorized
HTTP/1.1 400 Bad Request
```

Stop the server.

- [ ] **Step 4: Commit**

Run:

```bash
git add server/uploads.js server/index.js
git commit -m "feat: add protected image upload api"
```

Expected: commit succeeds.

---

### Task 6: Frontend API Client and Login Gate

**Files:**
- Create: `src/lib/apiClient.js`
- Create: `src/lib/authStore.js`
- Create: `src/components/LoginGate.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create API client**

Create `src/lib/apiClient.js`:

```js
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : {
          'content-type': 'application/json',
          ...(options.headers || {}),
        },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(payload?.error || '请求失败', response.status);
  }

  return payload?.data;
};
```

- [ ] **Step 2: Create auth store**

Create `src/lib/authStore.js`:

```js
import { apiRequest } from './apiClient';

export const authStore = {
  async getSession() {
    return apiRequest('/api/session');
  },

  async login(password) {
    return apiRequest('/api/session', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async logout() {
    return apiRequest('/api/session', {
      method: 'DELETE',
    });
  },
};
```

- [ ] **Step 3: Create LoginGate component**

Create `src/components/LoginGate.jsx`:

```jsx
import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authStore } from '@/lib/authStore';

const LoginGate = ({ children }) => {
  const [checking, setChecking] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    authStore.getSession()
      .then((session) => {
        if (mounted) setAuthenticated(Boolean(session.authenticated));
      })
      .catch(() => {
        if (mounted) setAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      toast.error('请输入访问口令');
      return;
    }
    setSubmitting(true);
    try {
      await authStore.login(password);
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      toast.error(error.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        正在检查登录状态...
      </div>
    );
  }

  if (authenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="text-base font-medium">公众号长图工具</h1>
            <p className="text-sm text-muted-foreground">请输入管理员口令继续</p>
          </div>
        </div>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="访问口令"
          autoFocus
        />
        <Button type="submit" className="mt-4 w-full" disabled={submitting}>
          {submitting ? '登录中...' : '登录'}
        </Button>
      </form>
    </div>
  );
};

export default LoginGate;
```

- [ ] **Step 4: Wrap app with LoginGate**

Modify `src/App.jsx` to:

```jsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import LoginGate from "@/components/LoginGate";
import { navItems } from "./nav-items";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <LoginGate>
          <HashRouter>
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
            </Routes>
          </HashRouter>
        </LoginGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
```

- [ ] **Step 5: Build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/apiClient.js src/lib/authStore.js src/components/LoginGate.jsx src/App.jsx
git commit -m "feat: add frontend login gate"
```

Expected: commit succeeds.

---

### Task 7: API-Backed Template Store

**Files:**
- Replace: `src/lib/templateStore.js`

- [ ] **Step 1: Replace template store implementation**

Replace `src/lib/templateStore.js` with:

```js
import { apiRequest } from './apiClient';

const downloadJson = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

const templateStore = {
  async init() {
    return undefined;
  },

  async getAll() {
    return apiRequest('/api/templates');
  },

  async getById(id) {
    return apiRequest(`/api/templates/${encodeURIComponent(id)}`);
  },

  async save(template) {
    const hasServerId = template.id && !String(template.id).startsWith('tpl_user_');
    const method = hasServerId ? 'PUT' : 'POST';
    const url = hasServerId
      ? `/api/templates/${encodeURIComponent(template.id)}`
      : '/api/templates';

    return apiRequest(url, {
      method,
      body: JSON.stringify(template),
    });
  },

  async remove(id) {
    return apiRequest(`/api/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async exportTemplate(id) {
    const tpl = await this.getById(id);
    if (!tpl) throw new Error('模板不存在');
    downloadJson(`${tpl.name}-template.json`, {
      version: 1,
      name: tpl.name,
      description: tpl.description,
      cover: tpl.cover,
      blocks: tpl.blocks,
    });
  },

  async importTemplate(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || data.version !== 1 || !Array.isArray(data.blocks)) {
      throw new Error('模板文件格式不正确');
    }

    return this.save({
      name: data.name || '导入模板',
      description: data.description || '',
      category: '我的模板',
      cover: data.cover || '📄',
      blocks: data.blocks,
    });
  },
};

export default templateStore;
```

- [ ] **Step 2: Build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/lib/templateStore.js
git commit -m "feat: use api backed template store"
```

Expected: commit succeeds.

---

### Task 8: API-Backed Image Store

**Files:**
- Replace: `src/lib/imageStore.js`

- [ ] **Step 1: Replace image store implementation**

Replace `src/lib/imageStore.js` with:

```js
import { apiRequest } from './apiClient';

const IMAGE_REF_PREFIX = 'idb-image:';

export const toImageRef = (id) => `${IMAGE_REF_PREFIX}${id}`;

export const isImageRef = (value) => (
  typeof value === 'string' && value.startsWith(IMAGE_REF_PREFIX)
);

export const getImageIdFromRef = (ref) => (
  isImageRef(ref) ? ref.slice(IMAGE_REF_PREFIX.length) : null
);

export const saveImageFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const uploaded = await apiRequest('/api/images', {
    method: 'POST',
    body: formData,
  });
  return uploaded.url;
};

export const getImageObjectUrl = async (refOrId) => {
  if (isImageRef(refOrId)) return '';
  return refOrId || '';
};

export const resolveImageValue = async (value) => {
  if (isImageRef(value)) return '';
  return value || '';
};
```

- [ ] **Step 2: Build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/lib/imageStore.js
git commit -m "feat: upload images through api"
```

Expected: commit succeeds.

---

### Task 9: Docker and Environment Docs

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build
RUN pnpm prune --prod

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
RUN mkdir -p /data/uploads
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "server/index.js"]
```

- [ ] **Step 2: Create compose file**

Create `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      ADMIN_PASSWORD: "${ADMIN_PASSWORD:-change-me}"
      SESSION_SECRET: "${SESSION_SECRET:-replace-with-random-long-secret}"
      DATA_DIR: "/data"
      MAX_UPLOAD_MB: "${MAX_UPLOAD_MB:-8}"
    volumes:
      - app-data:/data
    restart: unless-stopped

volumes:
  app-data:
```

- [ ] **Step 3: Create dockerignore**

Create `.dockerignore`:

```txt
node_modules
dist
data
.git
.DS_Store
exports
*.log
```

- [ ] **Step 4: Update env example**

Append to `.env.example`:

```env
# Server / Docker
ADMIN_PASSWORD=change-me
SESSION_SECRET=replace-with-a-random-long-secret
PORT=8080
DATA_DIR=/data
MAX_UPLOAD_MB=8
```

- [ ] **Step 5: Update README**

Replace `README.md` with:

```md
# 公众号长图生成工具

微信公众号文章可视化编辑器，通过块编辑器组装内容组件，实时预览并导出高清长图。

## 本地前端开发

```bash
pnpm install
pnpm dev
```

开发服务器默认监听 `8080`。

## 本地生产运行

```bash
pnpm install
pnpm build
ADMIN_PASSWORD=change-me SESSION_SECRET=replace-with-random-long-secret pnpm start
```

打开 `http://localhost:8080`，输入 `ADMIN_PASSWORD` 进入系统。

## Docker 启动

```bash
ADMIN_PASSWORD=your-password SESSION_SECRET=your-random-secret docker compose up --build
```

默认访问地址：

```txt
http://localhost:8080
```

## 环境变量

| 名称 | 默认值 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `change-me` | 管理员访问口令 |
| `SESSION_SECRET` | `replace-with-random-long-secret` | session cookie 签名密钥 |
| `PORT` | `8080` | Node 服务端口 |
| `DATA_DIR` | `/data` | SQLite 和上传图片目录 |
| `MAX_UPLOAD_MB` | `8` | 单张上传图片大小上限 |

## 数据持久化

Docker Compose 使用 `app-data` volume 持久化：

- SQLite: `/data/app.db`
- 上传图片: `/data/uploads`

只要不删除该 volume，容器重建后模板和图片会保留。

## 常用命令

```bash
pnpm build
pnpm lint
docker compose build
docker compose up
docker compose down
```
```

- [ ] **Step 6: Build Docker image**

Run:

```bash
docker compose build
```

Expected: image builds successfully.

- [ ] **Step 7: Commit**

Run:

```bash
git add Dockerfile docker-compose.yml .dockerignore .env.example README.md
git commit -m "chore: add docker deployment"
```

Expected: commit succeeds.

---

### Task 10: End-to-End Verification and Fixes

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: Run production build**

Run:

```bash
pnpm build
```

Expected: build exits with code 0.

- [ ] **Step 2: Run server against built frontend**

Run:

```bash
ADMIN_PASSWORD=test SESSION_SECRET=secret PORT=8090 DATA_DIR=/tmp/wechat-editor-data pnpm start
```

Expected output:

```txt
Wechat editor server listening on 8090
```

- [ ] **Step 3: Verify API contract**

In a second shell, run:

```bash
curl -i -s http://localhost:8090/api/templates
curl -c /tmp/wechat-editor.cookies -s -X POST http://localhost:8090/api/session -H 'content-type: application/json' -d '{"password":"test"}'
curl -b /tmp/wechat-editor.cookies -s -X POST http://localhost:8090/api/templates -H 'content-type: application/json' -d '{"name":"验收模板","description":"验收","cover":"📄","blocks":[]}'
curl -b /tmp/wechat-editor.cookies -s http://localhost:8090/api/templates
```

Expected:

```txt
HTTP/1.1 401 Unauthorized
{"data":{"authenticated":true}}
{"data":{"id":"tpl_...
{"data":[{"id":"tpl_...
```

- [ ] **Step 4: Verify Docker runtime**

Stop local `pnpm start`, then run:

```bash
ADMIN_PASSWORD=test SESSION_SECRET=secret docker compose up --build
```

Expected: app listens on `http://localhost:8080`.

- [ ] **Step 5: Manual browser acceptance**

Open `http://localhost:8080` and verify:

```txt
1. Login page appears before editor.
2. Wrong password shows an error.
3. Password "test" enters the editor.
4. Create a simple block.
5. Save as template.
6. Open templates -> 我的模板 and apply the saved template.
7. Edit the template name or description.
8. Delete the template.
9. Upload an image in an image field and confirm preview renders it.
10. Restart docker compose and confirm saved template/image data remains.
```

- [ ] **Step 6: Commit fixes if any**

If verification required code changes, run:

```bash
git add <changed-files>
git commit -m "fix: complete fullstack docker verification"
```

Expected: no commit is needed if all checks passed without fixes.

---

## Self-Review

- Spec coverage: login, protected APIs, template CRUD, image upload, Docker build/start, SQLite/uploads persistence, README/env docs, and verification all have tasks.
- Placeholder scan: no unfinished-marker instructions remain.
- Type consistency: frontend stores use `{ data }` API envelope through `apiRequest`; server template fields match existing UI `id/name/description/category/cover/blocks/createdAt/updatedAt`.
