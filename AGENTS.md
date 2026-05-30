# 公众号长图生成工具

微信公众号文章可视化编辑器，通过块（Block）编辑器组装内容组件，实时预览并导出为高清长图（PNG/JPG）。

## 技术栈

- **框架**: React 18 + Vite 5
- **样式**: Tailwind CSS 3 + shadcn/ui（基于 Radix UI 原语）
- **路由**: react-router-dom v6（HashRouter）
- **图片导出**: html-to-image（toPng / toJpeg，pixelRatio: 2）
- **Markdown 渲染**: react-markdown + remark-gfm + rehype-raw
- **状态管理**: React useState/useCallback/useMemo，无外部状态库
- **数据请求**: @tanstack/react-query（已接入但当前页面未大量使用）
- **图标**: lucide-react
- **通知**: sonner（toast）
- **自定义字体**: 阿里妈妈方圆体（AlimamaFangYuanTi）、阿里妈妈敏捷体（AlimamaAgile）

## 目录结构

```
├── index.html                  # 入口 HTML
├── vite.config.js              # Vite 配置，端口 8080，@ 路径别名
├── tailwind.config.js          # Tailwind 配置
├── components.json             # shadcn/ui 组件配置
├── hmr-client.js               # HMR 客户端
├── src/
│   ├── main.jsx                # ReactDOM.createRoot 入口
│   ├── App.jsx                 # 根组件：QueryClientProvider + HashRouter + Routes
│   ├── nav-items.jsx           # 路由表定义（/ → 桌面编辑器，/mobile → 移动端编辑器）
│   ├── index.css               # Tailwind 指令 + @font-face 字体声明 + CSS 变量 + 动画
│   ├── lib/
│   │   └── utils.js            # cn() 工具函数（clsx + tailwind-merge）
│   ├── assets/
│   │   ├── AlimamaAgileVF/     # 阿里妈妈敏捷体字体文件
│   │   └── AlimamaFangYuanTiVF/ # 阿里妈妈方圆体字体文件
│   ├── pages/
│   │   ├── Index.jsx           # 桌面端编辑器页面（三栏布局：组件面板 + 块编辑器 + 预览区）
│   │   └── MobileEditor.jsx    # 移动端编辑器页面（底部 Tab 切换编辑/预览）
│   └── components/
│       ├── BlockEditor.jsx               # 块编辑器：渲染 blocks 列表，支持拖拽排序、上下移动、删除
│       ├── BlocksPreview.jsx             # 块预览：按类型渲染每个 block（Markdown 用 ReactMarkdown，自定义组件用 renderFn）
│       ├── WechatStyleWrapper.jsx        # 微信公众号样式包装器：注入微信文章的 CSS 样式
│       ├── ImageGenerator.jsx            # 图片导出：将预览区 DOM 转为 PNG/JPG 下载
│       ├── CustomComponentDefinitions.js # 核心：自定义组件注册表（10 种组件）+ 分类 + 渲染函数 + 配置字段
│       ├── CustomComponentPanel.jsx      # 左侧组件面板：搜索、分类筛选、预览、插入
│       ├── ComponentConfigDrawer.jsx     # 右侧配置抽屉：根据 configFields 动态渲染表单控件
│       ├── TemplatePickerDialog.jsx      # 模板选择弹窗
│       ├── Templates.js                  # 模板定义（目前包含「户外徒步活动推文」模板）
│       ├── MarkdownPreview.jsx           # Markdown 预览组件
│       └── ui/                           # shadcn/ui 基础组件（~50 个）
```

## 核心架构

### Block 数据模型

编辑器接收一个 `blocks` 数组，每个 block 结构如下：

```jsonc
{
  "id": "block_<timestamp>_<counter>",  // 唯一 ID，生成时用递增计数器即可，如 block_1_1, block_1_2
  "type": "markdown" | "custom",        // markdown 为原始文本块，custom 为自定义组件
  "content": "...",                      // type=markdown 时有效，Markdown 文本内容
  "componentId": "...",                  // type=custom 时有效，对应下方组件 ID
  "props": {}                            // type=custom 时有效，组件属性
}
```

### 页面布局

**桌面端（Index.jsx）**：三栏布局
- 左侧：CustomComponentPanel 组件面板（可收起）
- 中间：BlockEditor 块编辑器
- 右侧：实时预览区 + ImageGenerator 导出按钮
- 右侧浮层：ComponentConfigDrawer 配置抽屉

**移动端（MobileEditor.jsx）**：底部 Tab 切换
- 编辑 Tab：BlockEditor
- 预览 Tab：预览区 + 导出按钮
- 底部弹出层：组件选择面板

### 图片导出流程

1. 用户点击导出按钮（ImageGenerator 或 MobileEditor 中的导出）
2. 通过 `document.querySelector` 找到预览区 DOM（`.preview-content-for-export` 或 `.mobile-preview-export`）
3. 调用 `html-to-image` 的 `toPng()` 或 `toJpeg()`，pixelRatio: 2 生成高清图
4. 创建 `<a>` 标签自动下载

### 模板系统（Templates.js）

模板是预定义的 blocks 数组，包含完整的组件配置。用户通过 TemplatePickerDialog 选择模板后，深拷贝并重新生成 block id 后替换当前编辑器内容。

---

## 开发与部署命令

### 本地开发

```bash
pnpm dev       # 启动开发服务器（端口 8080）
pnpm build     # 生产构建
pnpm preview   # 预览生产构建
```

### 容器化部署

项目使用多阶段 Docker 构建（node:20），本地 `docker-compose.yml` 使用 `build:` 模式用于开发调试。

```bash
# 本地构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

部署到 forfun 服务器时使用预构建镜像模式（`image: forfun-app:latest`），需指定 `--platform linux/amd64`（本地 Mac 为 ARM）。完整流程见 [部署指南](docs/deploy-to-forfun.md)。

---

## 参考文档

- **[部署指南](docs/deploy-to-forfun.md)** — 本地构建 Docker 镜像 → 传输到 forfun 服务器 → 启动容器的完整流程，含一键部署命令和常见问题排查。
- **[UI 修改必看](docs/ui-style-reference.md)** — 视觉语言与交互规范。所有 UI 开发必须遵守：颜色 token、字号纪律、交互状态（hover/active/focus）、反模式清单、提交前检查清单。
