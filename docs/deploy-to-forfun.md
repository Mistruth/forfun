# 部署至 forfun 生产服务器

## 生产环境

- **SSH**: `admin@8.137.80.234`
- **架构**: `linux/amd64`
- **部署配置**: `/root/forfun/docker-compose.yml`
- **容器**: `forfun-app-1`
- **镜像**: `forfun-app:latest`
- **数据卷**: `app-data`（部署时不删除）
- **容器端口**: `8080`
- **公网入口**: Nginx `80/443` 反向代理到 `127.0.0.1:8080`

Docker 需要通过 `sudo` 执行。生产机的 `8080` 端口不直接对公网开放，验证公网服务时使用 HTTP/HTTPS 入口。

## 标准部署流程

以下流程会部署当前工作区的全部内容，包括未提交的修改和新增文件。`.dockerignore` 中的 `node_modules`、`dist`、`data`、`.git` 等不会上传。

### 1. 检查本地工作区

```bash
git status --short
git diff --stat
```

确认当前修改都应该进入本次部署。

### 2. 检查生产环境

```bash
ssh -o BatchMode=yes admin@8.137.80.234 '
  hostname
  uname -m
  sudo docker ps -a --format "{{.Names}} {{.Image}} {{.Status}} {{.Ports}}" | grep forfun
  sudo docker image inspect forfun-app:latest --format "{{.Id}} {{.Architecture}} {{.Created}}"
'
```

应确认服务器架构为 `x86_64`，现有容器处于运行状态。

### 3. 上传当前工作区

为每次部署选择一个唯一标识，例如 `20260921-1400`，并在下面的 `<deploy-id>` 处统一替换。

```bash
ssh -o BatchMode=yes admin@8.137.80.234 \
  'mkdir -p /home/admin/forfun-build-<deploy-id>'

tar --exclude-from=.dockerignore --exclude=.git -cf - . \
  | ssh -o BatchMode=yes admin@8.137.80.234 \
      'tar -xf - -C /home/admin/forfun-build-<deploy-id>'
```

检查上传结果：

```bash
ssh -o BatchMode=yes admin@8.137.80.234 '
  cd /home/admin/forfun-build-<deploy-id>
  find . -type f | wc -l
  du -sh .
  ls -la
'
```

### 4. 为现有镜像创建回滚标签

```bash
ssh -o BatchMode=yes admin@8.137.80.234 \
  'sudo docker tag forfun-app:latest forfun-app:rollback-<deploy-id>'
```

在新镜像构建成功之前，不重启当前容器。

### 5. 在生产机构建 amd64 镜像

```bash
ssh -t -o BatchMode=yes admin@8.137.80.234 '
  cd /home/admin/forfun-build-<deploy-id>
  sudo docker build --platform linux/amd64 \
    -t forfun-app:latest \
    -t forfun-app:deploy-<deploy-id> \
    .
'
```

构建过程会执行 `pnpm build`。只有 Docker 构建完全成功后才继续上线。

### 6. 重建生产容器

```bash
ssh -o BatchMode=yes admin@8.137.80.234 \
  "sudo bash -lc 'cd /root/forfun && docker compose up -d --force-recreate'"
```

Compose 会继续挂载原有 `app-data` 数据卷，不会删除 SQLite 数据和上传图片。

### 7. 验证容器和 HTTP 服务

```bash
ssh -o BatchMode=yes admin@8.137.80.234 '
  sleep 3
  sudo docker inspect forfun-app-1 \
    --format "image={{.Image}} status={{.State.Status}} started={{.State.StartedAt}} restart_count={{.RestartCount}}"
  sudo docker compose -f /root/forfun/docker-compose.yml ps
  sudo docker logs --tail 30 forfun-app-1
  curl -fsS -o /dev/null -w "index=%{http_code} %{content_type}\n" http://127.0.0.1:8080/
  curl -fsS -o /dev/null -w "session=%{http_code} %{content_type}\n" http://127.0.0.1:8080/api/session
'
```

预期结果：

- 容器状态为 `running`
- `restart_count=0`
- 日志包含 `Wechat editor server listening on 8080`
- 首页和 session API 均返回 `200`
- session API 的 Content-Type 为 `application/json`

### 8. 验证模板接口

在容器内使用生产环境口令登录，再检查模板接口。输出中不包含管理员口令。

```bash
ssh -o BatchMode=yes admin@8.137.80.234 \
  "sudo docker exec forfun-app-1 node --input-type=module -e '
    const login = await fetch(\"http://127.0.0.1:8080/api/session\", {
      method: \"POST\",
      headers: { \"content-type\": \"application/json\" },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
    });
    if (!login.ok) throw new Error(\"login status \" + login.status);
    const cookie = login.headers.get(\"set-cookie\").split(\";\")[0];
    const response = await fetch(\"http://127.0.0.1:8080/api/templates\", { headers: { cookie } });
    const payload = await response.json();
    console.log(JSON.stringify({
      loginStatus: login.status,
      templatesStatus: response.status,
      dataIsArray: Array.isArray(payload.data),
      templateCount: Array.isArray(payload.data) ? payload.data.length : null,
    }));
    if (!response.ok || !Array.isArray(payload.data)) process.exit(1);
  '"
```

### 9. 验证公网入口

```bash
curl -fsS -o /dev/null \
  -w 'http=%{http_code} remote=%{remote_ip} content_type=%{content_type}\n' \
  http://8.137.80.234/

curl -kfsS -o /dev/null \
  -w 'https=%{http_code} remote=%{remote_ip} content_type=%{content_type}\n' \
  https://8.137.80.234/
```

HTTP 通常返回 `301` 并跳转 HTTPS，HTTPS 应返回 `200`。不要把“公网无法直接访问 8080”判定为部署失败。

## 回滚

```bash
ssh -o BatchMode=yes admin@8.137.80.234 '
  sudo docker tag forfun-app:rollback-<deploy-id> forfun-app:latest
  sudo bash -lc "cd /root/forfun && docker compose up -d --force-recreate"
  sudo docker compose -f /root/forfun/docker-compose.yml ps
  sudo docker logs --tail 30 forfun-app-1
'
```

## 注意事项

- 不要删除 `app-data` 卷，也不要执行 `docker compose down -v`。
- 不要在新镜像构建失败时重启生产容器。
- 每次发布保留至少一个明确的 `rollback-<deploy-id>` 标签。
- 构建源使用 Node 基础镜像默认的 Debian 官方源。
- 部署完成后记录新镜像 ID、回滚标签、容器状态和接口验证结果。
