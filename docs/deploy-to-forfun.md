# 部署至 forfun 服务器指南

## 目标服务器

- **SSH 别名**: `forfun`
- **系统**: Alibaba Cloud Linux 3 (RHEL 系), x86_64
- **已安装**: Docker 26, Docker Compose v2, Node.js 20, Claude Code
- **npm registry**: 已切换为 `https://registry.npmmirror.com`（国内镜像）
- **项目部署路径**: `~/forfun/`
- **服务端口**: 8080

## 部署流程（本地构建 → 传输镜像 → 服务器启动）

### 1. 本地构建 amd64 镜像

本地 Mac 为 ARM 架构，服务器为 x86_64，**必须指定平台**：

```bash
DOCKER_API_VERSION=1.43 docker build --platform linux/amd64 -t forfun-app .
```

> `DOCKER_API_VERSION=1.43` 是因为本地 Docker Desktop 的 API 版本（1.52）高于服务端支持的最大版本（1.43），不设置会报错。

### 2. 导出镜像

```bash
DOCKER_API_VERSION=1.43 docker save forfun-app | gzip > /tmp/forfun-app.tar.gz
```

### 3. 传输到服务器

```bash
scp /tmp/forfun-app.tar.gz forfun:~/
```

### 4. 加载镜像并启动

```bash
ssh forfun "docker load < forfun-app.tar.gz && cd ~/forfun && docker compose up -d"
```

### 5. 验证

```bash
ssh forfun "docker ps && docker logs forfun-app-1 2>&1 | tail -10"
```

## 服务器上的 docker-compose.yml

位于 `~/forfun/docker-compose.yml`，使用 `image: forfun-app:latest`（非 build 模式）：

```yaml
services:
  app:
    image: forfun-app:latest
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

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `exec format error` | 镜像架构与服务器不匹配 | 构建时加 `--platform linux/amd64` |
| `client version too new` | 本地 Docker API 版本过高 | 前缀加 `DOCKER_API_VERSION=1.43` |
| `SSL_ERROR_SYSCALL` | 服务器访问外网不稳定 | npm 已切换为 npmmirror.com |

## 一键部署命令

```bash
DOCKER_API_VERSION=1.43 docker build --platform linux/amd64 -t forfun-app . \
  && DOCKER_API_VERSION=1.43 docker save forfun-app | gzip > /tmp/forfun-app.tar.gz \
  && scp /tmp/forfun-app.tar.gz forfun:~/ \
  && ssh forfun "docker load < forfun-app.tar.gz && cd ~/forfun && docker compose up -d" \
  && ssh forfun "docker logs forfun-app-1 2>&1 | tail -5"
```
