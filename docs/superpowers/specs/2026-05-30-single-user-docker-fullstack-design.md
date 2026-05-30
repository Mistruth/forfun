# 单用户 Docker 全栈升级设计

## 背景

当前公众号长图编辑器是 Vite + React 单页应用。模板存储主要在浏览器 IndexedDB，图片也使用浏览器本地存储引用。这适合单机使用，但无法满足长期部署后的登录保护、模板集中管理、图片持久化和 Docker 一键启动。

本设计将项目升级为单用户私有版全栈应用。目标是让使用者通过一个管理员口令进入系统，登录后可以管理全局模板、上传图片，并通过 Docker 镜像启动完整工程。

## 范围

第一版交付：

- 单用户管理员口令登录。
- 登录 session 保护编辑器、模板 API 和图片上传 API。
- 完整模板增删改查。
- 模板 JSON 导入导出继续可用。
- 图片上传到服务端本地目录，并在预览、模板、导出图片中复用。
- Docker 镜像构建和 `docker compose up` 启动。
- SQLite 数据库和 uploads 目录通过 Docker volume 持久化。

第一版不做：

- 注册、找回密码、多用户账号体系。
- 用户级模板隔离和角色权限。
- 图片库、图片删除 UI、孤儿文件自动清理。
- 云对象存储。
- 旧浏览器 IndexedDB 图片引用自动迁移。
- 模板版本历史。

## 推荐架构

采用单容器 Node 全栈架构：

- React/Vite 继续作为前端编辑器。
- 新增 `server/` Node API。
- 生产构建时先运行 `pnpm build` 生成 `dist/`。
- Node 服务同时提供 `dist/` 静态文件和 `/api/*` 接口。
- SQLite 文件放在 `/data/app.db`。
- 上传图片放在 `/data/uploads`。
- Docker Compose 将 `/data` 挂载为持久化 volume。

选择单容器的原因：

- 当前是单用户私有工具，部署简单比服务拆分更重要。
- 前端和 API 同源，cookie session、图片 URL、导出流程更直接。
- SQLite 足以承载模板 JSON 和少量元数据，减少运维成本。

未采用方案：

- 前后端双容器：边界更清晰，但部署和跨容器静态资源配置更复杂。
- Postgres：更适合多人协作和大数据量，但当前场景维护成本偏高。
- 云存储：跨机器迁移方便，但不符合“所有工程 Docker 启动”的优先目标。

## 登录设计

环境变量：

```env
ADMIN_PASSWORD=change-me
SESSION_SECRET=replace-with-random-long-secret
PORT=8080
DATA_DIR=/data
MAX_UPLOAD_MB=8
```

登录流程：

1. 前端启动时请求 `GET /api/session`。
2. 未登录时显示登录页，不渲染编辑器。
3. 用户提交口令到 `POST /api/session`。
4. 服务端对比 `ADMIN_PASSWORD`。
5. 验证成功后设置签名的 `HttpOnly` cookie。
6. 后续 `/api/templates*` 和 `/api/images` 校验 cookie。
7. `DELETE /api/session` 清除 cookie 并退出。

cookie 属性：

- `HttpOnly`
- `SameSite=Lax`
- 生产 HTTPS 下启用 `Secure`
- 使用 `SESSION_SECRET` 签名，避免客户端伪造

## 数据模型

SQLite 表 `templates`：

```sql
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
```

`blocks` 使用 JSON 字符串保存，读写 API 时解析为数组返回。

图片文件不进入数据库。上传后服务端生成安全文件名，保存到 `/data/uploads`，返回公开同源 URL：

```txt
/uploads/<generated-filename>
```

## API 设计

统一成功响应：

```json
{ "data": {} }
```

统一错误响应：

```json
{ "error": "错误信息" }
```

端点：

```txt
GET    /api/session
POST   /api/session
DELETE /api/session

GET    /api/templates
POST   /api/templates
GET    /api/templates/:id
PUT    /api/templates/:id
DELETE /api/templates/:id

POST   /api/images
```

模板创建和更新校验：

- `name` 必填，最多 50 字符。
- `description` 最多 200 字符。
- `cover` 为空时使用 `📄`。
- `blocks` 必须是数组。
- `category` 默认 `我的模板`。

图片上传校验：

- 只接受 `image/png`、`image/jpeg`、`image/webp`、`image/gif`。
- 默认最大 `8MB`，可通过 `MAX_UPLOAD_MB` 调整。
- 返回的 URL 可直接写入 block props。

## 前端改造

保留现有编辑器布局、blocks schema 和组件配置方式，优先通过 store 层替换存储后端。

新增或修改：

- `src/lib/apiClient.js`：封装 fetch、JSON 响应、错误处理。
- `src/lib/authStore.js`：检查登录、登录、退出。
- `src/lib/templateStore.js`：从 IndexedDB 改为调用 `/api/templates`，保留 `init/getAll/getById/save/remove/exportTemplate/importTemplate` 方法名。
- `src/lib/imageStore.js`：`saveImageFile(file)` 改为上传到 `/api/images` 并返回服务端 URL。
- `src/components/LoginGate.jsx`：未登录时显示口令入口，登录后渲染应用。
- `src/App.jsx`：在 Router 外层或内层接入 `LoginGate`。
- `TemplatePickerDialog.jsx` 和 `SaveTemplateDialog.jsx`：尽量复用现有 UI，只处理 API 错误提示。
- `ComponentConfigDrawer.jsx`：继续调用 `saveImageFile`，不直接关心后端实现。

兼容策略：

- 普通外链 URL、base64 图片、服务端 `/uploads/*` URL 继续可渲染。
- 旧 `idb-image:*` 引用无法在新服务端解析，第一版显示为空或占位，用户重新上传图片即可。
- 模板导入导出格式保持现有 `version/name/description/cover/blocks`。

## 服务端文件边界

建议新增：

```txt
server/
  index.js
  db.js
  auth.js
  http.js
  templates.js
  uploads.js
```

职责：

- `index.js`：启动 HTTP 服务、挂载 API、静态文件和 uploads。
- `db.js`：初始化 SQLite、提供模板 CRUD。
- `auth.js`：cookie 签名、验签、登录校验 middleware。
- `http.js`：JSON 响应、错误响应、body 解析。
- `templates.js`：模板路由。
- `uploads.js`：图片上传路由和文件校验。

可以使用 Express 或 Node 原生 HTTP。若引入 Express，应保持依赖克制，并使用成熟中间件处理 multipart 上传。

## Docker 设计

新增：

```txt
Dockerfile
docker-compose.yml
.dockerignore
```

Dockerfile 使用多阶段构建：

1. 安装依赖。
2. 构建 Vite 前端。
3. 复制生产依赖、`server/`、`dist/`。
4. 以 Node 启动 `server/index.js`。

Compose 默认：

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      ADMIN_PASSWORD: "change-me"
      SESSION_SECRET: "replace-with-random-long-secret"
      DATA_DIR: "/data"
    volumes:
      - app-data:/data

volumes:
  app-data:
```

README 需要补充：

- 本地开发命令。
- Docker 构建和启动命令。
- 环境变量说明。
- 数据持久化位置。
- 修改口令和 session secret 的方式。

## 验收标准

自动验证：

- `pnpm build` 成功。
- `docker compose build` 成功。

手动验收：

- 未登录访问应用显示登录页。
- 错误口令无法进入。
- 正确口令登录后进入编辑器。
- 保存模板后刷新页面仍能读取。
- 编辑模板名称、描述、封面后刷新仍生效。
- 删除模板后刷新不再出现。
- 导入 JSON 模板后可保存并应用。
- 导出模板 JSON 可再次导入。
- 图片字段上传本地图片后预览显示。
- 保存含图片的模板后重新应用，图片仍显示。
- Docker 重启后模板和图片仍保留。
- 未登录直接调用模板和图片 API 返回 401。

## 风险与处理

- SQLite 写入是单机本地文件方案，不适合多人高并发；本项目定位为单用户私有版，接受该约束。
- `/uploads/*` 是同源公开路径。登录用户保存进文章的图片 URL 可直接访问，便于预览和 html-to-image 导出。
- 文件上传需要限制大小和类型，避免无限占用磁盘。
- 旧 IndexedDB 模板不会自动迁移；继续提供 JSON 导入路径。
- session secret 修改会让旧 cookie 失效，这是预期行为。
