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
