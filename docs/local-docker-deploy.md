# 本地 Docker 部署指南

本文档记录本机使用 Docker Compose 构建并运行公众号长图工具的流程。

## 端口约定

- 容器内服务端口：`8080`
- 本机访问端口：`9090`
- 访问地址：`http://127.0.0.1:9090/`

`docker-compose.yml` 使用如下端口映射：

```yaml
ports:
  - "${PORT:-9090}:8080"
```

因此默认本机端口是 `9090`。如需临时改端口，可在命令前覆盖 `PORT`。

## Docker API 兼容

当前本机 Docker CLI 可能比 Docker daemon 新，直接执行 Docker 命令可能出现：

```text
client version 1.52 is too new. Maximum supported API version is 1.43
```

本项目本地 Docker 命令统一加：

```bash
DOCKER_API_VERSION=1.43
```

## 构建并启动

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose up -d --build
```

该命令会：

1. 使用 `Dockerfile` 多阶段构建前端 `dist`
2. 打包 Express 后端和生产依赖
3. 创建/更新镜像 `forfun-app`
4. 启动容器 `forfun-app-1`
5. 将本机 `9090` 映射到容器 `8080`

## 验证部署

查看容器状态：

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose ps
```

检查首页响应：

```bash
curl -I http://127.0.0.1:9090/
```

检查登录会话接口：

```bash
curl -sS http://127.0.0.1:9090/api/session
```

正常返回示例：

```json
{"data":{"authenticated":false}}
```

## 查看日志

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose logs -f app
```

只看最近日志：

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose logs --tail=80 app
```

## 停止服务

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose down
```

这不会删除命名卷 `app-data`，模板、上传图片和 SQLite 数据会保留。

## 数据持久化

Compose 使用命名卷：

```yaml
volumes:
  - app-data:/data
```

容器内数据目录：

```text
/data
```

主要包含：

- SQLite 数据库：`/data/app.db`
- 上传图片：`/data/uploads`

如需完全清空本地数据，先停止服务，再删除卷：

```bash
DOCKER_API_VERSION=1.43 PORT=9090 docker compose down -v
```

谨慎使用 `-v`，它会删除本地模板和上传图片数据。

## 常用命令速查

```bash
# 构建并启动
DOCKER_API_VERSION=1.43 PORT=9090 docker compose up -d --build

# 查看状态
DOCKER_API_VERSION=1.43 PORT=9090 docker compose ps

# 查看日志
DOCKER_API_VERSION=1.43 PORT=9090 docker compose logs -f app

# 验证 HTTP
curl -I http://127.0.0.1:9090/
curl -sS http://127.0.0.1:9090/api/session

# 停止服务
DOCKER_API_VERSION=1.43 PORT=9090 docker compose down
```
