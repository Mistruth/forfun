# Vercel + Supabase 全栈改造设计

## 背景

当前公众号长图编辑器是 Vite + React 单页应用。模板存储使用 `lowdb` + IndexedDB，图片存储使用浏览器 IndexedDB，草稿使用 `localStorage`。这些能力适合本地单机使用，但无法在部署后跨设备保留模板和上传图片。

本设计将仓库改造成可部署到 Vercel 的轻量全栈应用，使用 Supabase 保存云端模板和图片。目标用户是单用户私人工具，不引入多用户账号体系。

## 范围

第一版交付以下能力：

- 使用简单口令保护私人工具访问。
- 云端保存、读取、编辑、删除模板。
- 在图片字段中上传本地图片到 Supabase Storage。
- 模板中的 blocks 保存图片 URL，可跨设备预览和导出。
- 保留当前编辑器 UI、blocks schema、AI 生成 blocks 的导入导出流程。
- 本地只保留当前编辑草稿自动保存。
- 提供一次性导入路径：从旧版本导出 JSON，在新版本导入后保存为云端模板。

第一版不做：

- 多用户登录和权限分组。
- 图片库、搜索、删除 UI。
- 自动迁移 IndexedDB 模板。
- 自动清理 Storage 孤儿图片。
- 模板版本历史。
- 私有 bucket 签名 URL。

## 推荐方案

采用 Vercel API 作为后端代理，Supabase 只在服务端访问。

保留现有 Vite + React 编辑器。新增 `api/` 目录作为 Vercel Functions，前端调用同源 `/api/*`。API 校验简单口令 session 后，通过 Supabase service role 操作 Postgres 和 Storage。浏览器端不暴露 Supabase service role key。

未采用的方案：

- 前端直连 Supabase：代码少，但简单口令和写权限边界不清晰。
- 迁移到 Next.js：Vercel 原生体验好，但当前 Vite SPA 没有必要为模板和图片存储做框架迁移。

## 架构

模块边界：

- React 编辑器：负责编辑、预览、导出、草稿自动保存、调用云端 store。
- Vercel API：负责 session 校验、模板 API、图片上传 API、Supabase service role 访问。
- Supabase Postgres：保存模板和图片 metadata。
- Supabase Storage：保存上传图片文件。

前端不直接写 Supabase。所有云端写操作必须通过 Vercel API。

## 访问控制

环境变量：

```env
PRIVATE_ACCESS_PASSWORD=<your-private-password>
SESSION_SECRET=<random-long-secret>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SUPABASE_IMAGE_BUCKET=article-images
```

访问流程：

1. 前端启动时检查 session。
2. 无有效 session 时显示口令入口。
3. 用户提交口令到 `POST /api/session`。
4. API 对比 `PRIVATE_ACCESS_PASSWORD`。
5. 成功后设置 `HttpOnly` cookie。
6. 后续模板和图片 API 只校验 cookie。

session cookie 由 `SESSION_SECRET` 签名。生产环境 cookie 使用 `HttpOnly`、`SameSite=Lax`、`Secure`。

## Supabase 数据模型

`templates` 表：

```sql
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default '我的模板',
  cover text not null default '📄',
  blocks jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`images` 表：

```sql
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  url text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
```

Storage bucket：

- 名称：`article-images`
- 策略：public read + server-only write

public read 的理由：图片 URL 可直接用于预览和 `html-to-image` 导出，不需要每次生成签名 URL。对单用户私人工具，交互成本低。代价是拿到图片 URL 的人可以访问该图片。

## API 设计

统一返回：

```json
{ "data": {} }
```

统一错误：

```json
{ "error": "错误信息" }
```

端点：

```txt
POST   /api/session
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id
POST   /api/images
```

后端文件建议：

- `api/_lib/auth.js`：cookie 签名、验签、鉴权。
- `api/_lib/http.js`：JSON 响应、错误响应、请求 body 解析。
- `api/_lib/supabase.js`：创建 Supabase service role client。
- `api/session.js`：处理口令登录。
- `api/templates/index.js`：处理模板列表和创建。
- `api/templates/[id].js`：处理模板更新和删除。
- `api/images/index.js`：处理图片上传。

不引入 Express，使用 Vercel Functions 原生 request/response。

## 前端改造

保留现有页面和组件结构，优先通过 store 层替换持久化后端。

文件边界：

- `src/lib/draftStore.js`：保持 `localStorage`，继续保存当前草稿。
- `src/lib/templateStore.js`：改为调用 `/api/templates`，保留现有 `getAll`、`getById`、`save`、`remove`、`exportTemplate`、`importTemplate` 方法名。
- `src/lib/imageStore.js`：上传文件到 `/api/images`，返回 Supabase 图片 URL；普通 URL 原样返回。
- `TemplatePickerDialog.jsx`：继续显示“我的模板”，数据来自 Supabase。
- `SaveTemplateDialog.jsx`：保存到 Supabase。
- `ComponentConfigDrawer.jsx`：图片字段上传走新的 `saveImageFile`。
- `Index.jsx` 和 `MobileEditor.jsx`：启动时检查 session，未登录时显示口令入口。

兼容策略：

- blocks schema 不改。
- 普通 URL、Supabase URL、base64 图片继续可渲染。
- 旧的 `idb-image:xxx` 引用无法跨设备解析，第一版显示占位或提示用户重新上传。

## 一次性导入

不自动读取旧浏览器 IndexedDB。

迁移路径：

1. 在旧版本导出模板 JSON，或复制当前 schema。
2. 在新版本导入 JSON。
3. 导入后编辑或保存为云端模板。

这保持实现简单，也避免在首次打开时隐式上传大量本地数据。

## 部署

Vercel：

- 构建命令：`pnpm build`
- 输出目录：`dist`
- API：仓库根目录 `api/`

Supabase：

- 创建项目。
- 执行 `supabase/schema.sql`。
- 创建 public bucket `article-images`。
- 配置 Storage 写入只通过 service role。

仓库文档：

- `.env.example` 补充必要变量。
- `README.md` 补充本地开发、Supabase 初始化、Vercel 部署步骤。
- `supabase/schema.sql` 提供建表 SQL、updated_at trigger、bucket 说明。

## 测试与验收

自动验证：

- `pnpm build`
- API 关键路径在本地环境变量下验证。

手动验收：

- 无 session 打开应用时显示口令入口。
- 输入口令后进入编辑器。
- 保存模板后刷新仍可读取。
- 更新和删除云端模板生效。
- 导入 JSON 后可保存为云端模板。
- 图片字段选择本地图片后上传成功，预览显示。
- 导出 PNG 时上传图片正常出现在长图中。
- 无 cookie 调用模板或图片 API 返回 401。
- Supabase 配置错误时前端 toast 可见。

## 风险

- public bucket 会让知道图片 URL 的人访问图片。第一版接受该权衡，以换取稳定预览和导出。
- service role 权限很高，必须只放在 Vercel 服务端环境变量，不能暴露到 Vite `VITE_*` 变量。
- Vercel Functions 处理 multipart 上传需要控制文件大小和错误提示。
- 旧 `idb-image:xxx` 图片引用不能自动迁移，用户需要重新上传或通过 JSON/base64 自行导入。
