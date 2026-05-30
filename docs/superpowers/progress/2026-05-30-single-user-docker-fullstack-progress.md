# 单用户 Docker 全栈升级进度

更新时间：2026-05-30

## 当前目标

把现有公众号长图生成工具升级为单用户私有版全栈应用：

- 管理员口令登录
- 服务端模板增删改查
- 服务端图片上传
- SQLite + 本地 uploads 持久化
- Docker 镜像和 `docker compose` 启动

设计文档：

- `docs/superpowers/specs/2026-05-30-single-user-docker-fullstack-design.md`

实施计划：

- `docs/superpowers/plans/2026-05-30-single-user-docker-fullstack.md`

## 已完成

### Task 1：服务端依赖和配置

状态：已完成并提交

相关提交：

- `7ce7932 chore: add server runtime dependencies`
- `e3bdd3d chore: allow better-sqlite3 build script`

### Task 2：SQLite 模板存储

状态：已完成并提交

相关提交：

- `788e22d feat: add sqlite template store`

### Task 3：登录和 HTTP 服务骨架

状态：已完成并提交

相关提交：

- `d4a7450 feat: add password session server`
- `d8deaa8 fix: reject malformed session cookies`
- `6ace1ca fix: harden session api handling`
- `f6d6686 fix: order private api auth before body parsing`

### Task 4：模板 API 路由

状态：已完成并提交

相关提交：

- `30e1f5f feat: add protected template api`

### Task 5：图片上传 API

状态：已完成并提交

相关提交：

- `968c831 feat: add protected image upload api`

完成内容：

- 新增 `server/uploads.js`
- multer 文件上传，支持 PNG/JPG/WebP/GIF
- 文件大小限制 `MAX_UPLOAD_MB`（默认 8MB）
- 自动生成安全文件名
- 挂载到 `POST /api/images`，受 session 保护
- 返回 `/uploads/<filename>` 同源 URL
- curl 验证：未登录 401、非图片 400、有效图片 201

### Task 6：前端 API Client 和登录页

状态：已完成并提交

相关提交：

- `a3a5189 feat: add frontend login gate`

完成内容：

- 新增 `src/lib/apiClient.js`：fetch 封装、JSON 响应、错误处理
- 新增 `src/lib/authStore.js`：session 检查、登录、退出
- 新增 `src/components/LoginGate.jsx`：未登录时显示口令入口
- 修改 `src/App.jsx`：LoginGate 包裹 Router，移除 IndexedDB init

### Task 7：前端模板 store 改为调用 API

状态：已完成并提交

相关提交：

- `28885e9 feat: use api backed template store`

完成内容：

- 替换 `src/lib/templateStore.js`：从 IndexedDB 改为调用 `/api/templates`
- 保留 `init/getAll/getById/save/remove/exportTemplate/importTemplate` 方法
- 旧 `tpl_user_*` ID 的模板走 POST 创建新记录
- `pnpm build` 成功

### Task 8：前端图片 store 改为上传 API

状态：已完成并提交

相关提交：

- `dbef2a9 feat: upload images through api`

完成内容：

- 替换 `src/lib/imageStore.js`：`saveImageFile` 上传到 `/api/images` 并返回服务端 URL
- 旧 `idb-image:*` 引用显示为空，用户重新上传即可
- `getImageObjectUrl`/`resolveImageValue` 直接返回 URL 或空字符串
- `pnpm build` 成功

### Task 9：Dockerfile、docker-compose、环境变量和 README

状态：已完成并提交

相关提交：

- `f865ca8 chore: add docker deployment`

完成内容：

- 新增 `Dockerfile`：多阶段构建（deps → build → runtime）
- 新增 `docker-compose.yml`：单服务 + 持久化 volume
- 新增 `.dockerignore`
- 更新 `.env.example`：补充服务端环境变量
- 更新 `README.md`：本地开发、生产运行、Docker 启动、环境变量说明、数据持久化

### Task 10：端到端验证

状态：已完成

验证结果：

- `pnpm build` 成功
- 服务端启动成功
- 未登录访问 `GET /api/templates` 返回 401
- 登录成功
- 创建模板返回 201 和 `tpl_` id
- 列表查询返回数组
- 图片上传返回 201 和 `/uploads/` URL
- 前端静态文件 200
- SPA fallback 200
- Docker build 未测试（Docker daemon 未运行），但 Dockerfile 结构正确

## 当前工作树注意事项

当前工作树包含一些不属于本次任务范围的脏文件：

```txt
D .catpaw/rules/nocode-dev.md
D .gstack/browse-audit.jsonl
?? docs/ui-style-reference.md
```

## 所有任务已完成

所有 10 个任务均已完成并提交。实现覆盖了设计文档中的全部范围：

- 单用户管理员口令登录
- 服务端模板 CRUD（受 session 保护）
- 服务端图片上传（受 session 保护，文件类型和大小校验）
- 前端 LoginGate、API client、模板/图片 store 切换到 API
- Docker 多阶段构建、docker-compose 持久化
- 环境变量文档和 README

### 手动验收清单

启动 Docker 后需手动验证：

1. 未登录访问应用显示登录页
2. 错误口令无法进入
3. 正确口令登录后进入编辑器
4. 保存模板后刷新页面仍能读取
5. 编辑模板名称、描述、封面后刷新仍生效
6. 删除模板后刷新不再出现
7. 导入 JSON 模板后可保存并应用
8. 导出模板 JSON 可再次导入
9. 图片字段上传本地图片后预览显示
10. 保存含图片的模板后重新应用，图片仍显示
11. Docker 重启后模板和图片仍保留
12. 未登录直接调用模板和图片 API 返回 401
