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

完成内容：

- `package.json` 新增 `start: node server/index.js`
- 新增服务端依赖：`express`、`better-sqlite3`、`multer`、`cookie`、`mime-types`、`nanoid`
- 新增 `server/config.js`
- 配置 `pnpm.onlyBuiltDependencies`，允许 `better-sqlite3` 构建 native binding
- 已验证 `better-sqlite3` 可打开内存数据库

### Task 2：SQLite 模板存储

状态：已完成并提交

相关提交：

- `788e22d feat: add sqlite template store`

完成内容：

- 新增 `server/db.js`
- 初始化 SQLite 数据库
- 创建 `templates` 表
- 提供 `templateDb.list/get/save/remove`
- 已通过基础 smoke test：`templateDb.list()` 返回数组

### Task 3：登录和 HTTP 服务骨架

状态：已完成并提交

相关提交：

- `d4a7450 feat: add password session server`
- `d8deaa8 fix: reject malformed session cookies`
- `6ace1ca fix: harden session api handling`
- `f6d6686 fix: order private api auth before body parsing`

完成内容：

- 新增 `server/auth.js`
- 新增 `server/index.js`
- 支持 `GET/POST/DELETE /api/session`
- 使用 `HttpOnly` signed cookie 保存登录状态
- 错误口令返回 `401`
- 非字符串 password 返回 `401`
- malformed session cookie 不会抛 500
- `/api/session` malformed JSON 返回稳定 `400`
- 私有 `/api/*` 先鉴权再解析 body
- 已预留私有 API router 挂载点
- `/uploads` 静态目录已挂载
- `dist` 存在时服务前端静态文件和 SPA fallback
- 5xx 错误不再向客户端暴露内部错误信息

### Task 4：模板 API 路由

状态：已完成并提交

相关提交：

- `30e1f5f feat: add protected template api`

完成内容：

- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/:id`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- 模板名称、描述、`blocks` 校验
- 所有模板 API 受 session 保护
- curl 验证完整 CRUD

验证结果：

- 未登录访问 `GET /api/templates` 返回 `401`
- 登录成功后可创建模板，返回 `201` 和 `tpl_...` id
- 列表、详情、更新、删除均通过
- 删除后再次查询返回 `404`
- 空模板名称创建返回 `400`
- 验证后确认 `8090` 端口无残留服务进程

备注：

- 当前全局错误处理会把 400 校验错误也输出到服务端 stderr；API 响应正确，但后续可考虑降低 4xx 日志噪音。

## 未开始

- Task 5：图片上传 API
- Task 6：前端 API client 和登录页
- Task 7：前端模板 store 改为调用 API
- Task 8：前端图片 store 改为上传 API
- Task 9：Dockerfile、docker-compose、环境变量和 README
- Task 10：端到端验证和修复

## 当前工作树注意事项

当前工作树包含一些不属于本次任务范围的脏文件：

```txt
D .catpaw/rules/nocode-dev.md
D .gstack/browse-audit.jsonl
?? docs/ui-style-reference.md
```

这些文件未纳入当前全栈升级任务，后续实现时应继续避免误提交。

当前没有业务代码的未提交改动；Task 4 已提交。

## 下一步

1. 继续 Task 5 图片上传 API。
2. 接入前端登录、模板 store、图片 store。
3. 补齐 Dockerfile、docker-compose、环境变量和 README。
4. 后续不再执行逐任务 review 循环，改为完成实现后通过 `pnpm build`、API smoke test、Docker build 和手动验收统一验证。
