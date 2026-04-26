# Vercel Supabase Fullstack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current Vite React editor into a Vercel-deployable fullstack app with simple password access, Supabase-backed templates, and Supabase Storage image uploads.

**Architecture:** Keep the React editor as a Vite SPA. Add Vercel Functions under `api/` for password session, template CRUD, and image upload. Replace browser IndexedDB template/image persistence with same-origin API clients while keeping local draft autosave in `localStorage`.

**Tech Stack:** React 18, Vite 5, Vercel Functions, Supabase JS client, Supabase Postgres, Supabase Storage, Vitest for pure helper tests, html-to-image for export.

---

## File Structure

Create:

- `api/_lib/auth.js`: sign and verify the private-tool session cookie.
- `api/_lib/http.js`: parse JSON bodies and send normalized JSON/error responses.
- `api/_lib/supabase.js`: create the Supabase service-role client from environment variables.
- `api/_lib/templatePayload.js`: normalize database rows and validate template payloads.
- `api/_lib/imageUpload.js`: parse multipart uploads and validate image files.
- `api/session.js`: password login and session check endpoint.
- `api/templates/index.js`: list and create templates.
- `api/templates/[id].js`: update and delete templates.
- `api/images/index.js`: upload images to Supabase Storage and insert image metadata.
- `src/lib/apiClient.js`: browser fetch wrapper for same-origin API calls.
- `src/lib/sessionStore.js`: browser session check and login helpers.
- `src/components/AccessGate.jsx`: password gate that wraps the app routes.
- `supabase/schema.sql`: database schema, trigger, indexes, and storage notes.
- `api/_lib/auth.test.js`: Vitest tests for cookie signing and verification.
- `api/_lib/templatePayload.test.js`: Vitest tests for template validation and row mapping.

Modify:

- `package.json`: add API dependencies, Vitest scripts, and Vercel local dev script.
- `.env.example`: add private access and Supabase variables.
- `README.md`: document local development, Supabase setup, and Vercel deployment.
- `src/App.jsx`: wrap existing router with `AccessGate`.
- `src/lib/templateStore.js`: replace IndexedDB lowdb implementation with API-backed implementation while preserving the public methods.
- `src/lib/imageStore.js`: replace IndexedDB image storage with API upload and URL passthrough.
- `src/components/ComponentConfigDrawer.jsx`: make image upload preview handle returned HTTP URLs cleanly.
- `src/components/TemplatePickerDialog.jsx`: handle unauthenticated/API errors through existing toasts.
- `src/components/SaveTemplateDialog.jsx`: let backend assign template IDs for new cloud templates.

Do not modify:

- `src/lib/draftStore.js`: current `localStorage` draft autosave remains the local-only draft mechanism.
- Blocks schema in `CustomComponentDefinitions.js`: existing AI-generated blocks must remain valid.

---

### Task 1: Add Dependencies And Environment Shape

**Files:**

- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Add dependencies and scripts**

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:vercel": "vercel dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "export:image": "node scripts/export-image.mjs",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4",
    "busboy": "^1.6.0"
  },
  "devDependencies": {
    "vitest": "^3.1.2"
  }
}
```

Preserve every existing dependency already present in the file; only add the listed dependencies and scripts.

- [ ] **Step 2: Update environment example**

Replace `.env.example` with:

```env
# Browser-visible app mode only.
VITE_APP_ENV=development

# Private access password checked only by Vercel Functions.
PRIVATE_ACCESS_PASSWORD=change-this-password

# Long random secret used to sign HttpOnly session cookies.
SESSION_SECRET=replace-with-at-least-32-random-characters

# Supabase service configuration. Never prefix service role key with VITE_.
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_IMAGE_BUCKET=article-images
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` updates and exits successfully.

- [ ] **Step 4: Verify scripts are readable**

Run:

```bash
pnpm test -- --runInBand
```

Expected before tests exist: Vitest exits with no test files or a no-test warning. If Vitest exits non-zero because no tests exist, continue to Task 2 and verify after adding tests.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: add cloud backend dependencies"
```

---

### Task 2: Implement Tested Session Cookie Helpers

**Files:**

- Create: `api/_lib/auth.js`
- Create: `api/_lib/auth.test.js`

- [ ] **Step 1: Write failing tests**

Create `api/_lib/auth.test.js`:

```js
import { describe, expect, it } from 'vitest';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  readCookie,
  verifySessionToken,
} from './auth.js';

describe('auth helpers', () => {
  it('creates and verifies a signed session token', async () => {
    const token = await createSessionToken('secret-123');
    await expect(verifySessionToken(token, 'secret-123')).resolves.toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken('secret-123');
    await expect(verifySessionToken(token, 'wrong-secret')).resolves.toBe(false);
  });

  it('reads a named cookie from a cookie header', () => {
    const value = readCookie(`${SESSION_COOKIE_NAME}=abc.def; theme=dark`, SESSION_COOKIE_NAME);
    expect(value).toBe('abc.def');
  });

  it('returns an empty string when the cookie is missing', () => {
    expect(readCookie('theme=dark', SESSION_COOKIE_NAME)).toBe('');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm test api/_lib/auth.test.js
```

Expected: FAIL because `api/_lib/auth.js` does not exist.

- [ ] **Step 3: Implement auth helpers**

Create `api/_lib/auth.js`:

```js
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'weixin_editor_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const toBase64Url = (value) => Buffer.from(value).toString('base64url');

const sign = (payload, secret) => (
  createHmac('sha256', secret).update(payload).digest('base64url')
);

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const readCookie = (cookieHeader = '', name) => {
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const prefix = `${name}=`;
  const match = parts.find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
};

export const createSessionToken = async (secret) => {
  const payload = JSON.stringify({
    nonce: randomBytes(16).toString('base64url'),
    createdAt: Date.now(),
  });
  const encodedPayload = toBase64Url(payload);
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
};

export const verifySessionToken = async (token, secret) => {
  if (!token || !secret || !token.includes('.')) return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;
  const expectedSignature = sign(encodedPayload, secret);
  return safeEqual(signature, expectedSignature);
};

export const createSessionCookie = (token, isProduction = process.env.NODE_ENV === 'production') => {
  const secure = isProduction ? '; Secure' : '';
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure,
  ].filter(Boolean).join('; ');
};

export const hasValidSession = async (req) => {
  const token = readCookie(req.headers.cookie || '', SESSION_COOKIE_NAME);
  return verifySessionToken(token, process.env.SESSION_SECRET || '');
};

export const requireSession = async (req) => {
  const valid = await hasValidSession(req);
  if (!valid) {
    const error = new Error('未登录或会话已失效');
    error.statusCode = 401;
    throw error;
  }
};
```

- [ ] **Step 4: Run auth tests**

Run:

```bash
pnpm test api/_lib/auth.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/auth.js api/_lib/auth.test.js
git commit -m "test: add session cookie helpers"
```

---

### Task 3: Add HTTP And Template Payload Helpers

**Files:**

- Create: `api/_lib/http.js`
- Create: `api/_lib/templatePayload.js`
- Create: `api/_lib/templatePayload.test.js`

- [ ] **Step 1: Write failing template helper tests**

Create `api/_lib/templatePayload.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { normalizeTemplatePayload, toTemplateView } from './templatePayload.js';

describe('template payload helpers', () => {
  it('normalizes a valid template payload', () => {
    const payload = normalizeTemplatePayload({
      name: '活动模板',
      description: '周末活动',
      cover: '📄',
      blocks: [{ id: 'block_1', type: 'markdown', content: '# Hi' }],
    });

    expect(payload).toEqual({
      name: '活动模板',
      description: '周末活动',
      category: '我的模板',
      cover: '📄',
      blocks: [{ id: 'block_1', type: 'markdown', content: '# Hi' }],
    });
  });

  it('rejects payloads without a name', () => {
    expect(() => normalizeTemplatePayload({ name: '', blocks: [] })).toThrow('模板名称不能为空');
  });

  it('rejects payloads without block arrays', () => {
    expect(() => normalizeTemplatePayload({ name: '模板', blocks: {} })).toThrow('模板 blocks 必须是数组');
  });

  it('maps database rows to existing frontend field names', () => {
    const view = toTemplateView({
      id: '7d1b3f0a-0000-4000-8000-000000000000',
      name: '模板',
      description: '',
      category: '我的模板',
      cover: '📄',
      blocks: [],
      created_at: '2026-04-26T00:00:00.000Z',
      updated_at: '2026-04-26T01:00:00.000Z',
    });

    expect(view.createdAt).toBe(Date.parse('2026-04-26T00:00:00.000Z'));
    expect(view.updatedAt).toBe(Date.parse('2026-04-26T01:00:00.000Z'));
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm test api/_lib/templatePayload.test.js
```

Expected: FAIL because `api/_lib/templatePayload.js` does not exist.

- [ ] **Step 3: Implement HTTP helper**

Create `api/_lib/http.js`:

```js
export const sendJson = (res, statusCode, body, headers = {}) => {
  res.statusCode = statusCode;
  Object.entries({
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
};

export const sendData = (res, data, statusCode = 200, headers = {}) => {
  sendJson(res, statusCode, { data }, headers);
};

export const sendError = (res, error, fallbackStatus = 500) => {
  const statusCode = error.statusCode || fallbackStatus;
  const message = error.expose === false ? '服务器内部错误' : error.message || '请求失败';
  sendJson(res, statusCode, { error: message });
};

export const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('请求 JSON 格式不正确');
    error.statusCode = 400;
    throw error;
  }
};

export const assertMethod = (req, methods) => {
  if (methods.includes(req.method)) return;
  const error = new Error('请求方法不支持');
  error.statusCode = 405;
  throw error;
};
```

- [ ] **Step 4: Implement template payload helper**

Create `api/_lib/templatePayload.js`:

```js
const DEFAULT_CATEGORY = '我的模板';
const DEFAULT_COVER = '📄';

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

export const normalizeTemplatePayload = (input = {}) => {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) badRequest('模板名称不能为空');
  if (!Array.isArray(input.blocks)) badRequest('模板 blocks 必须是数组');

  return {
    name,
    description: typeof input.description === 'string' ? input.description.trim() : '',
    category: typeof input.category === 'string' && input.category.trim()
      ? input.category.trim()
      : DEFAULT_CATEGORY,
    cover: typeof input.cover === 'string' && input.cover.trim()
      ? input.cover.trim()
      : DEFAULT_COVER,
    blocks: JSON.parse(JSON.stringify(input.blocks)),
  };
};

export const toTemplateView = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  category: row.category || DEFAULT_CATEGORY,
  cover: row.cover || DEFAULT_COVER,
  blocks: Array.isArray(row.blocks) ? row.blocks : [],
  createdAt: row.created_at ? Date.parse(row.created_at) : null,
  updatedAt: row.updated_at ? Date.parse(row.updated_at) : null,
});

export const toTemplateInsert = (payload) => ({
  name: payload.name,
  description: payload.description,
  category: payload.category,
  cover: payload.cover,
  blocks: payload.blocks,
});

export const toTemplateUpdate = (payload) => ({
  ...toTemplateInsert(payload),
  updated_at: new Date().toISOString(),
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm test api/_lib/templatePayload.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/http.js api/_lib/templatePayload.js api/_lib/templatePayload.test.js
git commit -m "test: add template API helpers"
```

---

### Task 4: Add Supabase Client And Schema

**Files:**

- Create: `api/_lib/supabase.js`
- Create: `supabase/schema.sql`

- [ ] **Step 1: Implement Supabase service client**

Create `api/_lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

let client = null;

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`${name} 未配置`);
    error.statusCode = 500;
    error.expose = false;
    throw error;
  }
  return value;
};

export const getSupabase = () => {
  if (client) return client;
  client = createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return client;
};

export const getImageBucketName = () => (
  process.env.SUPABASE_IMAGE_BUCKET || 'article-images'
);
```

- [ ] **Step 2: Add Supabase schema**

Create `supabase/schema.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default '我的模板',
  cover text not null default '📄',
  blocks jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  url text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

create index if not exists templates_updated_at_idx on public.templates (updated_at desc);
create index if not exists images_created_at_idx on public.images (created_at desc);

alter table public.templates enable row level security;
alter table public.images enable row level security;

-- This app uses the Supabase service role only from Vercel Functions.
-- No anon policies are required for table reads or writes.
-- Create a public Storage bucket named "article-images" in the Supabase dashboard.
```

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm test
```

Expected: PASS for helper tests from Tasks 2 and 3.

- [ ] **Step 4: Commit**

```bash
git add api/_lib/supabase.js supabase/schema.sql
git commit -m "feat: add Supabase schema and client"
```

---

### Task 5: Implement Session And Template API Routes

**Files:**

- Create: `api/session.js`
- Create: `api/templates/index.js`
- Create: `api/templates/[id].js`

- [ ] **Step 1: Implement session endpoint**

Create `api/session.js`:

```js
import {
  createSessionCookie,
  createSessionToken,
  hasValidSession,
} from './_lib/auth.js';
import { assertMethod, readJsonBody, sendData, sendError } from './_lib/http.js';

export default async function handler(req, res) {
  try {
    assertMethod(req, ['GET', 'POST']);

    if (req.method === 'GET') {
      sendData(res, { authenticated: await hasValidSession(req) });
      return;
    }

    const body = await readJsonBody(req);
    const expected = process.env.PRIVATE_ACCESS_PASSWORD || '';
    if (!expected || body.password !== expected) {
      const error = new Error('访问口令不正确');
      error.statusCode = 401;
      throw error;
    }

    const token = await createSessionToken(process.env.SESSION_SECRET || '');
    sendData(res, { authenticated: true }, 200, {
      'Set-Cookie': createSessionCookie(token),
    });
  } catch (error) {
    sendError(res, error);
  }
}
```

- [ ] **Step 2: Implement template list/create endpoint**

Create `api/templates/index.js`:

```js
import { requireSession } from '../_lib/auth.js';
import { assertMethod, readJsonBody, sendData, sendError } from '../_lib/http.js';
import { getSupabase } from '../_lib/supabase.js';
import {
  normalizeTemplatePayload,
  toTemplateInsert,
  toTemplateView,
} from '../_lib/templatePayload.js';

export default async function handler(req, res) {
  try {
    assertMethod(req, ['GET', 'POST']);
    await requireSession(req);
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      sendData(res, (data || []).map(toTemplateView));
      return;
    }

    const payload = normalizeTemplatePayload(await readJsonBody(req));
    const { data, error } = await supabase
      .from('templates')
      .insert(toTemplateInsert(payload))
      .select('*')
      .single();
    if (error) throw error;
    sendData(res, toTemplateView(data), 201);
  } catch (error) {
    sendError(res, error);
  }
}
```

- [ ] **Step 3: Implement template update/delete endpoint**

Create `api/templates/[id].js`:

```js
import { requireSession } from '../_lib/auth.js';
import { assertMethod, readJsonBody, sendData, sendError } from '../_lib/http.js';
import { getSupabase } from '../_lib/supabase.js';
import {
  normalizeTemplatePayload,
  toTemplateUpdate,
  toTemplateView,
} from '../_lib/templatePayload.js';

const getId = (req) => {
  const id = req.query?.id;
  if (typeof id === 'string' && id.trim()) return id.trim();
  const error = new Error('模板 ID 缺失');
  error.statusCode = 400;
  throw error;
};

export default async function handler(req, res) {
  try {
    assertMethod(req, ['PUT', 'DELETE']);
    await requireSession(req);
    const id = getId(req);
    const supabase = getSupabase();

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      sendData(res, { id });
      return;
    }

    const payload = normalizeTemplatePayload(await readJsonBody(req));
    const { data, error } = await supabase
      .from('templates')
      .update(toTemplateUpdate(payload))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    sendData(res, toTemplateView(data));
  } catch (error) {
    sendError(res, error);
  }
}
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
pnpm test
pnpm build
```

Expected: tests pass and Vite build succeeds. The build does not execute Vercel Functions.

- [ ] **Step 5: Commit**

```bash
git add api/session.js api/templates/index.js api/templates/[id].js
git commit -m "feat: add password and template APIs"
```

---

### Task 6: Implement Image Upload API

**Files:**

- Create: `api/_lib/imageUpload.js`
- Create: `api/images/index.js`

- [ ] **Step 1: Implement multipart parser**

Create `api/_lib/imageUpload.js`:

```js
import Busboy from 'busboy';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const extensionFor = (filename, mimeType) => {
  const ext = path.extname(filename || '').toLowerCase();
  if (ext) return ext;
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/webp') return '.webp';
  return '';
};

export const parseImageUpload = (req) => new Promise((resolve, reject) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: MAX_IMAGE_BYTES,
    },
  });

  let resolved = false;
  let fileRecord = null;

  busboy.on('file', (_fieldName, file, info) => {
    const chunks = [];
    const mimeType = info.mimeType || '';
    if (!mimeType.startsWith('image/')) {
      file.resume();
      reject(Object.assign(new Error('只能上传图片文件'), { statusCode: 400 }));
      return;
    }

    file.on('data', (chunk) => chunks.push(chunk));
    file.on('limit', () => {
      reject(Object.assign(new Error('图片不能超过 10MB'), { statusCode: 413 }));
    });
    file.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fileRecord = {
        buffer,
        originalName: info.filename || 'image',
        mimeType,
        size: buffer.length,
        storagePath: `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extensionFor(info.filename, mimeType)}`,
      };
    });
  });

  busboy.on('error', reject);
  busboy.on('finish', () => {
    if (resolved) return;
    resolved = true;
    if (!fileRecord) {
      try {
        badRequest('未找到图片文件');
      } catch (error) {
        reject(error);
      }
      return;
    }
    resolve(fileRecord);
  });

  req.pipe(busboy);
});
```

- [ ] **Step 2: Implement upload endpoint**

Create `api/images/index.js`:

```js
import { requireSession } from '../_lib/auth.js';
import { assertMethod, sendData, sendError } from '../_lib/http.js';
import { getImageBucketName, getSupabase } from '../_lib/supabase.js';
import { parseImageUpload } from '../_lib/imageUpload.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    assertMethod(req, ['POST']);
    await requireSession(req);

    const file = await parseImageUpload(req);
    const supabase = getSupabase();
    const bucket = getImageBucketName();

    const upload = await supabase.storage
      .from(bucket)
      .upload(file.storagePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });
    if (upload.error) throw upload.error;

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(file.storagePath);
    const url = publicData.publicUrl;

    const { data, error } = await supabase
      .from('images')
      .insert({
        storage_path: file.storagePath,
        url,
        name: file.originalName,
        mime_type: file.mimeType,
        size_bytes: file.size,
      })
      .select('*')
      .single();
    if (error) throw error;

    sendData(res, {
      id: data.id,
      url: data.url,
      name: data.name,
      mimeType: data.mime_type,
      size: Number(data.size_bytes),
      createdAt: data.created_at ? Date.parse(data.created_at) : null,
    }, 201);
  } catch (error) {
    sendError(res, error);
  }
}
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
pnpm test
pnpm build
```

Expected: tests pass and build succeeds.

- [ ] **Step 4: Commit**

```bash
git add api/_lib/imageUpload.js api/images/index.js
git commit -m "feat: add image upload API"
```

---

### Task 7: Add Browser API Clients And Access Gate

**Files:**

- Create: `src/lib/apiClient.js`
- Create: `src/lib/sessionStore.js`
- Create: `src/components/AccessGate.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add API client**

Create `src/lib/apiClient.js`:

```js
export const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || '请求失败');
    error.status = response.status;
    throw error;
  }

  return payload.data;
};
```

- [ ] **Step 2: Add session store**

Create `src/lib/sessionStore.js`:

```js
import { apiRequest } from './apiClient';

export const checkSession = async () => (
  apiRequest('/api/session').then((data) => Boolean(data.authenticated))
);

export const loginWithPassword = async (password) => (
  apiRequest('/api/session', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }).then((data) => Boolean(data.authenticated))
);
```

- [ ] **Step 3: Add access gate**

Create `src/components/AccessGate.jsx`:

```jsx
import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkSession, loginWithPassword } from '@/lib/sessionStore';

const AccessGate = ({ children }) => {
  const [checking, setChecking] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    checkSession()
      .then((ok) => {
        if (!cancelled) setAuthenticated(ok);
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
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
      const ok = await loginWithPassword(password);
      setAuthenticated(ok);
      setPassword('');
    } catch (error) {
      toast.error(error.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen grid place-items-center text-sm text-gray-400">正在检查访问权限...</div>;
  }

  if (authenticated) return children;

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-gray-600">
            <LockKeyhole size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">私人工具访问</h1>
            <p className="text-xs text-gray-500">请输入访问口令后继续</p>
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
          {submitting ? '验证中...' : '进入编辑器'}
        </Button>
      </form>
    </div>
  );
};

export default AccessGate;
```

- [ ] **Step 4: Wrap app routes**

Modify `src/App.jsx`:

```jsx
import AccessGate from './components/AccessGate';
```

Wrap the existing `HashRouter` block:

```jsx
<AccessGate>
  <HashRouter>
    <Routes>
      {navItems.map(({ to, page }) => (
        <Route key={to} path={to} element={page} />
      ))}
    </Routes>
  </HashRouter>
</AccessGate>
```

- [ ] **Step 5: Run build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/apiClient.js src/lib/sessionStore.js src/components/AccessGate.jsx src/App.jsx
git commit -m "feat: add private access gate"
```

---

### Task 8: Replace Template Store With Cloud API

**Files:**

- Modify: `src/lib/templateStore.js`
- Modify: `src/components/SaveTemplateDialog.jsx`
- Modify: `src/components/TemplatePickerDialog.jsx`

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

const normalizeImport = (jsonString) => {
  const data = JSON.parse(jsonString);
  if (!data || data.version !== 1 || !Array.isArray(data.blocks)) {
    throw new Error('模板文件格式不正确');
  }

  return {
    name: data.name || '导入模板',
    description: data.description || '',
    category: '我的模板',
    cover: data.cover || '📄',
    blocks: data.blocks,
  };
};

const templateStore = {
  async init() {
    return undefined;
  },

  async getAll() {
    return apiRequest('/api/templates');
  },

  async getById(id) {
    const templates = await this.getAll();
    return templates.find((template) => template.id === id) || null;
  },

  async save(template) {
    const payload = {
      name: template.name,
      description: template.description || '',
      category: template.category || '我的模板',
      cover: template.cover || '📄',
      blocks: template.blocks || [],
    };

    if (template.id && !String(template.id).startsWith('tpl_user_')) {
      return apiRequest(`/api/templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }

    return apiRequest('/api/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async remove(id) {
    await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
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
    return this.save(normalizeImport(jsonString));
  },
};

export default templateStore;
```

- [ ] **Step 2: Let cloud API assign IDs for new templates**

In `src/components/SaveTemplateDialog.jsx`, remove `id: \`tpl_user_${Date.now()}\`,` from the object passed to `templateStore.save`.

The saved object should be:

```js
await templateStore.save({
  name: trimmedName,
  description: description.trim(),
  category: '我的模板',
  cover,
  blocks: JSON.parse(JSON.stringify(blocks)),
});
```

- [ ] **Step 3: Improve template dialog API error messages**

In `src/components/TemplatePickerDialog.jsx`, update `loadUserTemplates` catch:

```js
} catch (error) {
  toast.error(error.message || '加载模板失败');
}
```

Update `handleDelete`:

```js
const handleDelete = async (id) => {
  if (!confirm('确定删除该模板？')) return;
  try {
    await templateStore.remove(id);
    toast.success('模板已删除');
    loadUserTemplates();
  } catch (error) {
    toast.error(error.message || '删除失败');
  }
};
```

- [ ] **Step 4: Run build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/templateStore.js src/components/SaveTemplateDialog.jsx src/components/TemplatePickerDialog.jsx
git commit -m "feat: use cloud templates"
```

---

### Task 9: Replace Image Store With Cloud Uploads

**Files:**

- Modify: `src/lib/imageStore.js`
- Modify: `src/components/ComponentConfigDrawer.jsx`

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
  formData.append('file', file);
  const uploaded = await apiRequest('/api/images', {
    method: 'POST',
    body: formData,
  });
  return uploaded.url;
};

export const getImageObjectUrl = async (refOrUrl) => {
  if (isImageRef(refOrUrl)) return '';
  return refOrUrl || '';
};

export const resolveImageValue = async (value) => {
  if (isImageRef(value)) return '';
  return value || '';
};
```

- [ ] **Step 2: Make upload preview keep the uploaded URL**

In `src/components/ComponentConfigDrawer.jsx`, change the success path inside `handleFile`:

```js
const imageUrl = await saveImageFile(file);
onChange(imageUrl);
setLocalPreview(imageUrl);
setUrlInput(imageUrl);
```

Keep the optimistic object URL before upload, and keep the existing error handling.

- [ ] **Step 3: Treat cloud URLs as URL tab values**

In `ImageUploadField`, keep `value && value.startsWith('http')` logic. Supabase public URLs are HTTP URLs, so no new branch is needed.

- [ ] **Step 4: Run build**

Run:

```bash
pnpm build
```

Expected: Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imageStore.js src/components/ComponentConfigDrawer.jsx
git commit -m "feat: upload images to cloud storage"
```

---

### Task 10: Add Deployment Documentation

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-04-26-vercel-supabase-fullstack-design.md` only if implementation discoveries require a design correction.

- [ ] **Step 1: Update README**

Replace `README.md` with:

```md
# 公众号长图生成工具

Vite + React 微信公众号长图编辑器，支持块编辑、实时预览、高清导出、云端模板和图片上传。

## 本地开发

```bash
pnpm install
pnpm dev
```

仅调试前端时使用 `pnpm dev`。

调试 Vercel API 时使用：

```bash
pnpm dev:vercel
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填写：

```env
PRIVATE_ACCESS_PASSWORD=change-this-password
SESSION_SECRET=replace-with-at-least-32-random-characters
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_IMAGE_BUCKET=article-images
```

不要把 `SUPABASE_SERVICE_ROLE_KEY` 改成 `VITE_` 前缀。

## Supabase 初始化

1. 创建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 创建 public Storage bucket：`article-images`。
4. 确认表读写不开放给 anon，应用通过 Vercel Functions 的 service role 访问。

## Vercel 部署

1. 导入仓库到 Vercel。
2. Framework Preset 选择 Vite。
3. Build Command 使用 `pnpm build`。
4. Output Directory 使用 `dist`。
5. 在 Vercel Project Settings 配置 `.env.example` 中的服务端环境变量。
6. 部署完成后打开站点，输入 `PRIVATE_ACCESS_PASSWORD`。

## 验证

```bash
pnpm test
pnpm build
```

手动检查：

- 无口令时不能进入编辑器。
- 输入口令后可以进入编辑器。
- 保存模板后刷新仍能读取。
- 图片上传后预览显示。
- 导出 PNG 时上传图片出现在长图中。
```

- [ ] **Step 2: Run verification**

Run:

```bash
pnpm test
pnpm build
```

Expected: tests pass and build succeeds.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-04-26-vercel-supabase-fullstack-design.md
git commit -m "docs: document Vercel Supabase deployment"
```

If the spec file did not change, run:

```bash
git add README.md
git commit -m "docs: document Vercel Supabase deployment"
```

---

### Task 11: Local API Smoke Test

**Files:**

- No source changes expected unless this task finds a bug.

- [ ] **Step 1: Prepare local environment**

Create `.env.local` from `.env.example` with real Supabase values.

- [ ] **Step 2: Start Vercel dev**

Run:

```bash
pnpm dev:vercel
```

Expected: Vercel dev starts, serves the Vite app, and exposes `/api/session`.

- [ ] **Step 3: Check unauthenticated API behavior**

Run in a separate terminal:

```bash
curl -i http://localhost:3000/api/templates
```

Expected: HTTP 401 with JSON body:

```json
{"error":"未登录或会话已失效"}
```

- [ ] **Step 4: Check login**

Run:

```bash
curl -i -c /tmp/weixin-editor-cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"password":"change-this-password"}' \
  http://localhost:3000/api/session
```

Expected: HTTP 200, `Set-Cookie` header, and body:

```json
{"data":{"authenticated":true}}
```

- [ ] **Step 5: Check template create/list/delete**

Create:

```bash
curl -s -b /tmp/weixin-editor-cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","description":"","cover":"📄","blocks":[]}' \
  http://localhost:3000/api/templates
```

Expected: JSON `data.id` is a UUID.

List:

```bash
curl -s -b /tmp/weixin-editor-cookies.txt http://localhost:3000/api/templates
```

Expected: response contains `"name":"Smoke Test"`.

Delete using the returned UUID:

```bash
curl -s -X DELETE -b /tmp/weixin-editor-cookies.txt http://localhost:3000/api/templates/RETURNED_UUID
```

Expected: response contains `"id":"RETURNED_UUID"`.

- [ ] **Step 6: Manual browser acceptance**

Open the Vercel dev URL and verify:

- Password gate appears.
- Correct password opens the editor.
- Save template writes to Supabase and reloads in “我的模板”.
- Image upload writes to Supabase Storage and renders in preview.
- PNG export includes uploaded image.

- [ ] **Step 7: Commit bug fixes or record no changes**

If fixes were needed:

```bash
git add api src README.md supabase
git commit -m "fix: pass local cloud smoke test"
```

If no fixes were needed:

```bash
git status --short
```

Expected: no uncommitted source changes.
