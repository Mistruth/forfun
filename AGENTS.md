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

## 组件描述清单（AI 生成长图参考）

> 以下内容供 AI 读取，用于根据用户需求智能生成公众号长图的 blocks 数组。
> 输出格式为 JSON `blocks` 数组，可直接导入编辑器渲染。

### 共享类型

#### Segment（富文本片段）

正文组件 `body-text` 的 `segments` 数组中每一项：

```jsonc
{
  "text": "文本内容",      // string，必填
  "bold": false,          // boolean
  "italic": false,        // boolean
  "underline": false,     // boolean
  "bgColor": ""           // string，高亮背景色，如 "rgba(62,207,142,0.25)"，空字符串表示无背景
}
```

多个 segment 按顺序拼接成一段完整的正文。常见用法：
- 普通文本：`{ "text": "...", "bold": false, "italic": false, "underline": false, "bgColor": "" }`
- 强调关键词：`{ "text": "重要内容", "bold": true, "italic": false, "underline": false, "bgColor": "rgba(62,207,142,0.25)" }`
- 金句引用：`{ "text": "...", "bold": true, "italic": true, "underline": false, "bgColor": "rgba(62,207,142,0.12)" }`

#### StatsItem（数据指标项）

数据指标组件 `stats-bar` 的 `items` 数组中每一项：

```jsonc
{
  "value": "15km",    // string，大号数字/数值显示
  "label": "距离"      // string，小号标签
}
```

#### FontFamily（字体）

所有组件的 `fontFamily` 字段，可选值：

| 标签 | 值 | 适用场景 |
|------|-----|---------|
| 默认 | `'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif` | 通用 |
| 阿里妈妈方圆体 | `'AlimamaFangYuanTi', 'PingFang SC', sans-serif` | 圆润可爱，年轻活泼 |
| 阿里妈妈敏捷体 | `'AlimamaAgile', 'PingFang SC', sans-serif` | 现代活力 |
| 幼圆 | `'YouYuan', '幼圆', 'PingFang SC', sans-serif` | 可爱圆润 |
| 圆体 | `'Noto Sans SC', 'PingFang SC', 'HanHei SC', sans-serif` | 圆润现代 |
| 楷体 | `'KaiTi', '楷体', 'STKaiti', 'PingFang SC', serif` | 文艺复古 |
| 宋体 | `'SimSun', '宋体', 'STSong', 'PingFang SC', serif` | 正式典雅 |
| 黑体 | `'SimHei', '黑体', 'STHeiti', 'PingFang SC', sans-serif` | 简洁有力 |

### 10 种组件 Schema

#### 1. chapter-title（篇章标题）

醒目的章节标题，带序号徽章、下划线、卡片或渐变背景风格。用于文章分段。

```jsonc
{
  "componentId": "chapter-title",
  "props": {
    "number": "01",                          // string，篇章序号，如 "01"、"02"、"一"、"PART 1"
    "title": "在这里输入您的标题内容",         // string，标题文字
    "titleStyle": "badge",                   // "badge" | "underline" | "card" | "default"
    "fontSize": "26",                        // string，标题字号 px，范围 16-40
    "numberColor": "#58bb90",                // string，主题色/序号颜色，支持 #hex 和 rgba
    "bgColor": "rgba(88,187,144,0.12)",      // string，背景色（仅 titleStyle="card" 或 "default" 时生效）
    "fontFamily": "..."                      // FontFamily
  }
}
```

**titleStyle 视觉说明**：
- `badge`：圆形数字徽章 + 标题文字 + 短渐变下划线，最常用
- `underline`：序号 + 标题文字 + 全宽渐变下划线
- `card`：卡片容器 + 左侧色条 + 序号 + 标题
- `default`：渐变背景容器 + 序号 + 标题

#### 2. body-text（正文）

支持富文本片段拼接的正文段落。是文章中最常用的内容块。

```jsonc
{
  "componentId": "body-text",
  "props": {
    "segments": [                            // Segment[]，富文本片段数组
      {
        "text": "普通正文内容",
        "bold": false,
        "italic": false,
        "underline": false,
        "bgColor": ""
      }
    ],
    "fontSize": "17",                        // string，字号 px，范围 10-28
    "lineHeight": "1.85",                    // string，行高倍数，范围 1.0-3.0
    "hasBg": false,                          // boolean，是否显示背景卡片
    "bgCardColor": "#fafafa",               // string，背景卡片颜色（hasBg=true 时生效）
    "fontFamily": "..."                      // FontFamily
  }
}
```

**常用片段拼接模式**：

```jsonc
// 模式 A：普通段落
"segments": [
  { "text": "这是一段普通正文。", "bold": false, "italic": false, "underline": false, "bgColor": "" }
]

// 模式 B：关键词高亮
"segments": [
  { "text": "我们策划了 ", "bold": false, "italic": false, "underline": false, "bgColor": "" },
  { "text": "[重要活动]", "bold": true, "italic": false, "underline": false, "bgColor": "rgba(62,207,142,0.25)" },
  { "text": " 欢迎参加。", "bold": false, "italic": false, "underline": false, "bgColor": "" }
]

// 模式 C：时间轴/行程（用加粗时间 + 高亮背景）
"segments": [
  { "text": "🚌  08:30", "bold": true, "italic": false, "underline": false, "bgColor": "rgba(62,207,142,0.2)" },
  { "text": "  集合出发\n", "bold": false, "italic": false, "underline": false, "bgColor": "" },
  { "text": "🥾  10:30", "bold": true, "italic": false, "underline": false, "bgColor": "rgba(62,207,142,0.2)" },
  { "text": "  到达起点，热身破冰", "bold": false, "italic": false, "underline": false, "bgColor": "" }
]

// 模式 D：金句/引用式正文
"segments": [
  { "text": "\"山野没有信号，但有更好的连接。\"", "bold": true, "italic": true, "underline": false, "bgColor": "rgba(62,207,142,0.12)" }
]
```

**技巧**：text 中可以使用 `\n` 换行；使用 emoji 增加视觉效果。

#### 3. image-block（图片）

单张图片，支持宽度、圆角、说明文字。无图片时显示灰色占位。

```jsonc
{
  "componentId": "image-block",
  "props": {
    "url": "",                               // string，图片 URL（网络地址或 base64 data URL）
    "alt": "图片",                           // string，图片描述
    "width": "100%",                         // string，宽度，如 "100%"、"300px"、"80%"
    "borderRadius": "8px",                   // string，圆角，如 "0px"、"8px"、"16px"
    "caption": "",                           // string，图片下方说明文字（可选）
    "captionFontFamily": "..."               // FontFamily，说明文字字体
  }
}
```

> 图片 URL 留空时会显示灰色占位区域。生成时如果用户未提供图片 URL，可以留空并设置 caption 提示用户后续上传。

#### 4. divider（分隔线）

章节之间的视觉分隔。用于长文章中的段落过渡。

```jsonc
{
  "componentId": "divider",
  "props": {
    "dividerStyle": "line",                  // "line" | "dashed" | "ornament"
    "ornament": "✦",                         // string，装饰符号（dividerStyle="ornament" 时生效）
    "lineColor": "#e0e0e0",                  // string，线条颜色
    "marginY": "24"                          // string，上下间距 px，范围 8-60
  }
}
```

**dividerStyle 视觉说明**：
- `line`：实线
- `dashed`：虚线
- `ornament`：两侧线条 + 中间装饰符号（默认 ✦，可改为 · ※ ★ ✿ 等）

#### 5. image-text-card（图文卡片）

图片与文字的组合卡片，两种布局。

```jsonc
{
  "componentId": "image-text-card",
  "props": {
    "layout": "top-bottom",                  // "top-bottom" | "left-right"
    "imageUrl": "",                          // string，图片 URL
    "title": "卡片标题",                      // string
    "description": "这里是卡片描述文字。",     // string
    "tag": "",                               // string，标签（可选），如 "推荐"、"新品"
    "accentColor": "#58bb90",                // string，主题色
    "borderRadius": "10px",                  // string，圆角
    "fontFamily": "..."                      // FontFamily
  }
}
```

**layout 视觉说明**：
- `top-bottom`：上方图片 + 下方标题和描述
- `left-right`：左侧 40% 图片 + 右侧标题和描述

#### 6. info-card（信息卡片）

白底圆角卡片，用于展示单个知识点、要点、说明。

```jsonc
{
  "componentId": "info-card",
  "props": {
    "title": "知识点标题",                    // string
    "content": "这里是详细说明内容。",        // string
    "icon": "",                              // string，标题前图标 emoji（可选），如 📌 💡 📖 ⚡
    "showBorder": true,                      // boolean，是否显示左侧色条
    "borderColor": "#58bb90",                // string，色条颜色（showBorder=true 时生效）
    "bgColor": "#ffffff",                    // string，背景色
    "fontFamily": "..."                      // FontFamily
  }
}
```

#### 7. checklist（清单）

带图标前缀的纵向列表。适合展示装备清单、步骤列表、注意事项等。

```jsonc
{
  "componentId": "checklist",
  "props": {
    "items": [                               // string[]，列表项
      "列表项目一",
      "列表项目二",
      "列表项目三"
    ],
    "icon": "📍",                            // string，每项前的图标符号
    "showLine": true,                        // boolean，是否显示左侧竖线
    "accentColor": "#58bb90",                // string，主题色（影响竖线颜色）
    "fontFamily": "..."                      // FontFamily
  }
}
```

**常见 icon 选择**：📍 📌 ✓ ✅ ☑ ● ○ → ➤ ▸ ★ ✦

#### 8. quote-block（引用块）

浅底色 + 左侧色条，突出金句、名言或重要引用。

```jsonc
{
  "componentId": "quote-block",
  "props": {
    "text": "这里是一段引用文字或金句内容。",  // string
    "showQuotes": true,                       // boolean，是否在开头显示引号
    "accentColor": "#58bb90",                 // string，主题色（影响左侧色条和背景色）
    "fontFamily": "..."                       // FontFamily
  }
}
```

#### 9. tip-box（提示框）

带图标的彩色提示框，三种预设类型。

```jsonc
{
  "componentId": "tip-box",
  "props": {
    "type": "tip",                           // "tip" | "warning" | "info"
    "content": "这是一条提示信息。",           // string
    "customIcon": "",                        // string，自定义图标 emoji（可选，覆盖默认图标）
    "fontFamily": "..."                      // FontFamily
  }
}
```

**type 视觉说明**：
- `tip`：蓝色底 💡，用于提示和建议
- `warning`：黄色底 ⚠️，用于警告和注意
- `info`：灰色底 ℹ️，用于补充说明

#### 10. stats-bar（数据指标）

多数据项横排展示，大号数字 + 小号标签。适合展示关键数据、行程概要等。

```jsonc
{
  "componentId": "stats-bar",
  "props": {
    "items": [                               // StatsItem[]
      { "value": "15km", "label": "距离" },
      { "value": "800m", "label": "爬升" },
      { "value": "6h", "label": "时长" }
    ],
    "accentColor": "#58bb90",                // string，数字颜色
    "itemBg": "#f5f5f5",                     // string，每项背景色
    "fontFamily": "..."                      // FontFamily
  }
}
```

### markdown 类型块

除了自定义组件，还支持原始 Markdown 文本块：

```jsonc
{
  "id": "block_x_x",
  "type": "markdown",
  "content": "支持 **加粗**、*斜体*、[链接](url)、`代码`、表格等 GFM 语法"
}
```

> markdown 块由编辑器通过 react-markdown + remark-gfm + rehype-raw 渲染，支持标准 GFM 语法和原始 HTML。

### 组装指南

#### 文章结构模板

一篇典型的公众号长图文章结构：

```
chapter-title    → 文章标题/开篇
body-text        → 引导语/摘要
divider          → 分隔
chapter-title    → 第一章标题
body-text        → 章节正文
image-block      → 配图
body-text        → 继续正文
divider          → 分隔
chapter-title    → 第二章标题
body-text        → 章节正文
...
quote-block      → 金句/总结
tip-box          → 行动号召/注意事项
```

#### 配色方案

常用主题色搭配（用于 `numberColor`、`accentColor`、`borderColor` 等）：

| 风格 | 主色 | 背景色 | 适合场景 |
|------|------|--------|---------|
| 清新绿 | `#58bb90` | `rgba(88,187,144,0.12)` | 户外、自然、健康 |
| 活力橙 | `#f59e0b` | `rgba(245,158,11,0.12)` | 活动、促销、美食 |
| 沉稳蓝 | `#3b82f6` | `rgba(59,130,246,0.12)` | 科技、商务、教育 |
| 温柔粉 | `#ec4899` | `rgba(236,72,153,0.12)` | 生活方式、美妆 |
| 经典红 | `#ef4444` | `rgba(239,68,68,0.12)` | 紧急、重要、节日 |
| 优雅紫 | `#8b5cf6` | `rgba(139,92,246,0.12)` | 创意、设计 |

> 同一篇文章建议统一使用一套配色，所有组件的 accentColor/numberColor 保持一致。

#### 输出格式示例

用户给出需求后，AI 应输出完整的 `blocks` JSON 数组：

```json
{
  "blocks": [
    {
      "id": "block_1_1",
      "type": "custom",
      "componentId": "chapter-title",
      "props": {
        "number": "01",
        "title": "探索未知的世界",
        "titleStyle": "badge",
        "fontSize": "26",
        "numberColor": "#58bb90",
        "bgColor": "rgba(88,187,144,0.12)",
        "fontFamily": "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
      }
    },
    {
      "id": "block_1_2",
      "type": "custom",
      "componentId": "body-text",
      "props": {
        "segments": [
          { "text": "每一次出发，都是对未知的拥抱。", "bold": false, "italic": false, "underline": false, "bgColor": "" }
        ],
        "fontSize": "17",
        "lineHeight": "1.85",
        "hasBg": false,
        "bgCardColor": "#fafafa",
        "fontFamily": "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
      }
    }
  ]
}
```

---

## 开发命令

```bash
pnpm dev       # 启动开发服务器（端口 8080）
pnpm build     # 生产构建
pnpm preview   # 预览生产构建
```
