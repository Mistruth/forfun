# Agent Skill：公众号长图 Schema 生成设计

## 概述

新增一个 Codex agent skill，用于把用户的自然语言诉求转成当前公众号长图编辑器可消费的 `blocks` schema，并在无图形界面环境中调用导出脚本生成 PNG 长图。该 skill 不直接手写 HTML 或自行绘图；JSON 是内部中间产物，最终交付优先是图片文件。

目标链路：

```
用户诉求
  → agent skill 理解内容目标、受众、风格、素材约束
  → 生成标准 blocks / template JSON
  → 无头浏览器加载页面搭建引擎并写入草稿
  → 截取预览 DOM
  → 输出 PNG 长图
```

## 设计目标

- 让 AI 稳定输出当前编辑器可渲染的 `blocks` 数组，而不是自由发挥 HTML。
- 让输出优先成为 PNG 长图，同时保留模板 JSON 作为可复现、可编辑的中间产物。
- 让中间 JSON 可以直接通过「模板导入」进入页面，也可以作为草稿写入 `localStorage.editor_draft`。
- 把组件 schema、风格策略、校验逻辑沉淀为 skill 资源，降低每次生成时的上下文成本。
- 对图片、日期、价格、报名方式等不确定信息采用占位或显式标注，避免伪造。

## Skill 定位

### Skill 名称

`wechat-long-image-composer`

### 触发描述

```yaml
name: wechat-long-image-composer
description: Generate validated WeChat official-account long-image editor schemas from user content requirements. Use when the user wants Codex to create, adapt, polish, or package a WeChat article poster/long-image as blocks JSON or an importable template for the React block editor in this repository.
```

### 推荐安装位置

开发期先放在仓库内便于版本管理：

```
skills/wechat-long-image-composer/
```

稳定后复制到：

```
${CODEX_HOME:-~/.codex}/skills/wechat-long-image-composer/
```

## Skill 文件结构

```
skills/wechat-long-image-composer/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── block-schema.md
│   ├── composition-recipes.md
│   └── output-contract.md
└── scripts/
    ├── validate-blocks.mjs
    ├── package-template.mjs
    └── export-image.mjs
```

### `SKILL.md`

只保留核心工作流：

1. 读取用户诉求，抽取 `contentBrief`
2. 选择文章类型、结构、配色、字体、组件组合
3. 生成 `blocks`
4. 调用 `scripts/validate-blocks.mjs` 校验
5. 调用仓库的 `scripts/export-image.mjs` 生成 PNG
6. 输出图片路径，并可选保留模板 JSON 文件

### `references/block-schema.md`

保存当前 10 个 custom component 的精简 schema：

- `chapter-title`
- `body-text`
- `image-block`
- `divider`
- `image-text-card`
- `info-card`
- `checklist`
- `quote-block`
- `tip-box`
- `stats-bar`

来源以 `AGENTS.md` 和 `src/components/CustomComponentDefinitions.js` 为准。后续组件变更时只更新该引用文件，不让 `SKILL.md` 膨胀。

### `references/composition-recipes.md`

保存高频文章结构配方：

| 场景 | 推荐结构 |
|------|----------|
| 活动招募 | 标题 → 引导语 → stats-bar → 亮点 → 行程 → 费用/须知 → 报名 CTA |
| 知识科普 | 标题 → 问题引入 → 3-5 个章节 → checklist 总结 → quote-block |
| 产品介绍 | 标题 → 痛点 → 卖点卡片 → 参数/权益 → 适用人群 → CTA |
| 复盘总结 | 标题 → 核心数据 → 过程回顾 → 照片占位 → 收获 → 下次预告 |
| 通知公告 | 标题 → 关键信息 → checklist 事项 → warning tip-box → 联系方式 |

### `references/output-contract.md`

定义输出格式、导入方式、字段约束和质量门槛。

### `scripts/validate-blocks.mjs`

校验生成结果是否能被页面引擎消费：

- 顶层必须是 `{ "blocks": [...] }` 或 `{ "version": 1, "blocks": [...] }`
- `blocks` 必须非空数组
- 每个 block 必须有唯一 `id`
- `type` 只能是 `markdown` 或 `custom`
- `custom.componentId` 必须属于注册组件
- `props` 必须是对象
- `body-text.segments` 必须是数组，且每项有 `text`
- `stats-bar.items` 必须是数组，且每项有 `value` / `label`
- 图片字段 `url` / `imageUrl` 没有用户素材时允许为空字符串，不生成虚假 URL

### `scripts/package-template.mjs`

把裸 `blocks` 包装成页面模板导入格式：

```json
{
  "version": 1,
  "name": "模板名称",
  "description": "模板说明",
  "cover": "📄",
  "blocks": []
}
```

### `scripts/export-image.mjs`

把模板 JSON 或裸 `blocks` 输入转换成图片：

1. 读取 JSON 并提取 `blocks`
2. 启动本地 Vite 页面，或连接用户指定的编辑器 URL
3. 将 `blocks` 写入 `localStorage.editor_draft`
4. 刷新页面，让现有 React 预览区渲染草稿
5. 用 headless Chrome 截取 `.preview-content-for-export`
6. 输出 PNG 文件

示例：

```bash
pnpm export:image --input out/template.json
```

默认输出到 `~/Desktop/wechat-article.png`。该脚本复用现有页面渲染逻辑，因此图片效果与用户在编辑器预览区看到的效果一致。

## 中间语义模型

Skill 不应直接从用户一句话跳到 blocks。先在内部形成 `contentBrief`：

```jsonc
{
  "topic": "五一川西三日徒步活动招募",
  "articleType": "活动招募",
  "audience": "成都年轻户外爱好者",
  "tone": "年轻、自然、有召唤感",
  "mustInclude": ["时间", "路线", "费用", "集合点", "报名方式"],
  "knownFacts": {
    "date": "2026年5月2-4日",
    "price": "580元/人"
  },
  "unknowns": ["集合点", "报名二维码"],
  "visual": {
    "palette": "清新绿",
    "primaryColor": "#58bb90",
    "fontFamily": "'AlimamaFangYuanTi', 'PingFang SC', sans-serif"
  },
  "assets": {
    "images": []
  }
}
```

该模型不需要输出给页面，但可在最终回复中简短说明设计取向。

## Blocks 生成规则

### ID 规则

使用稳定递增 ID：

```text
block_ai_001
block_ai_002
block_ai_003
```

不要使用运行时 `Date.now()`，避免同一份模板 diff 不稳定。

### 组件选择规则

- 大标题和章节标题优先用 `chapter-title`
- 正文优先用 `body-text`，通过 `segments` 做关键词高亮
- 重要提醒用 `tip-box`
- 关键数据用 `stats-bar`
- 费用、装备、注意事项用 `checklist` 或 `info-card`
- 金句、开场钩子、结尾号召用 `quote-block`
- 没有明确图片 URL 时，`image-block.url` 留空，并用 `caption` 写清图片建议

### 风格一致性

同一篇长图只选一套主色：

```jsonc
{
  "primaryColor": "#58bb90",
  "softBg": "rgba(88,187,144,0.12)",
  "highlightBg": "rgba(88,187,144,0.25)"
}
```

所有 `numberColor`、`accentColor`、`borderColor` 尽量复用主色。避免每个组件随机换色。

### 内容密度

MVP 推荐：

- 短公告：6-10 个 block
- 标准活动推文：10-18 个 block
- 深度文章：16-28 个 block

单个 `body-text` 不宜塞入过长内容。超过 250 中文字符时拆成多个 block。

## 页面引擎接入

### 当前可用接入方式

#### 方式 A：无头图片导出（默认）

Skill 默认生成临时模板 JSON，然后调用：

```bash
pnpm export:image --input <template-json>
```

这是“没有图形界面但直接拿到图片”的主链路，默认输出到桌面。页面仍然作为渲染引擎存在，只是由 headless Chrome 打开，不需要用户手动操作浏览器。

#### 方式 B：模板导入

生成 `version: 1` 的模板 JSON，用户在「模板选择 → 我的模板 → 导入模板」中导入。

这是可编辑兜底方式，因为 `src/lib/templateStore.js` 已支持：

```json
{
  "version": 1,
  "name": "AI 生成模板",
  "description": "由 wechat-long-image-composer 生成",
  "cover": "✨",
  "blocks": []
}
```

#### 方式 C：草稿注入

开发调试时可把 blocks 写入：

```js
localStorage.setItem('editor_draft', JSON.stringify({
  blocks,
  savedAt: Date.now()
}));
```

刷新页面后 `src/lib/draftStore.js` 会恢复草稿。

### 后续产品化接入

新增一个「AI 生成」入口：

```
src/components/AiGenerateDialog.jsx
src/lib/aiSchemaGenerator.js
```

流程：

1. 用户输入主题、场景、必要信息、风格偏好
2. 后端或本地 agent 生成模板 JSON
3. 前端校验 JSON
4. `setBlocksWithHistory(generatedBlocks)`
5. 自动打开预览

该功能不应阻塞 skill MVP；skill 先服务于离线生成图片，并保留模板导入作为用户微调入口。

## 输出契约

Skill 最终输出优先使用图片文件路径：

```json
{
  "imagePath": "~/Desktop/wechat-article.png",
  "templatePath": "out/wechat-article.template.json",
  "placeholders": ["[集合点]", "[报名二维码]"]
}
```

其中 `templatePath` 是可选的复现/二次编辑产物。模板 JSON 格式如下：

```json
{
  "version": 1,
  "name": "五一川西三日徒步活动招募",
  "description": "适合公众号长图编辑器导入的活动招募模板",
  "cover": "🏔️",
  "blocks": [
    {
      "id": "block_ai_001",
      "type": "custom",
      "componentId": "chapter-title",
      "props": {
        "number": "01",
        "title": "五一去川西，把春天走成诗",
        "titleStyle": "badge",
        "fontSize": "26",
        "numberColor": "#58bb90",
        "bgColor": "rgba(88,187,144,0.12)",
        "fontFamily": "'AlimamaFangYuanTi', 'PingFang SC', sans-serif"
      }
    }
  ]
}
```

如用户明确要求“只要 JSON”或需要页面导入，则输出：

```json
{
  "blocks": []
}
```

## 质量门槛

生成前：

- 明确用户想要的是活动、科普、产品、通知还是总结。
- 明确是否有必须保留的事实信息。
- 不确定事实不能补造，必须使用占位。

生成后：

- 运行 `validate-blocks.mjs`
- 运行 `export-image.mjs` 并确认输出 PNG 文件存在且非空
- 检查所有图片字段是否为空或来自用户提供素材
- 检查所有 block ID 唯一
- 检查色彩和字体是否统一
- 检查文章结构是否有开头、主体、结尾

## 错误处理

| 问题 | 处理 |
|------|------|
| 用户信息太少 | 生成通用模板，占位关键事实，如 `[活动时间]` |
| 用户要求图片但未给素材 | 插入 `image-block` 空 URL，占位 caption 写图片建议 |
| 用户给了长段文本 | 自动拆段，保留原意并做标题/重点重组 |
| 用户给了不适合公开传播的敏感内容 | 不编造背书，不输出营销夸大结论 |
| 组件 schema 不匹配 | 校验失败后修复 props，而不是让用户手动排错 |

## 示例 Skill 核心工作流

`SKILL.md` 主体建议：

```markdown
# WeChat Long Image Composer

## Workflow

1. Build a concise content brief from the user request: topic, article type, audience, required facts, unknown facts, tone, palette, and image assets.
2. Read `references/block-schema.md` when component props are needed.
3. Read `references/composition-recipes.md` to choose a structure for the article type.
4. Generate importable template JSON by default: `{ version, name, description, cover, blocks }`.
5. Use empty image URLs unless the user supplied real URLs or local assets.
6. Validate with `scripts/validate-blocks.mjs <json-file>` when writing a file.
7. Export PNG with `pnpm export:image --input <json-file>`; default output is `~/Desktop/wechat-article.png`.
8. Return the PNG path, optional template JSON path, plus a short note describing unresolved placeholders.
```

## 实施计划

1. 创建 `skills/wechat-long-image-composer/` 目录并用 `skill-creator` 初始化。
2. 从 `AGENTS.md` 抽取组件协议到 `references/block-schema.md`。
3. 新增 `composition-recipes.md` 和 `output-contract.md`。
4. 实现 `validate-blocks.mjs`，先覆盖结构校验和组件字段校验。
5. 实现 `package-template.mjs`，支持从裸 blocks 包装模板 JSON。
6. 实现或复用 `scripts/export-image.mjs`，支持无头 Chrome 直接导出 PNG。
7. 用 3 个样例请求验收：
   - “生成一篇户外徒步活动招募长图”
   - “把这段产品介绍改成公众号长图”
   - “生成一个会议通知长图模板”
8. 稳定后复制到 `~/.codex/skills` 并运行 `quick_validate.py`。

## MVP 边界

本设计完成 agent skill、页面 schema 契约和无头图片导出链路，不引入在线 LLM API，不改变现有用户侧页面导出流程。

页面侧新增“AI 生成”按钮属于下一阶段产品化工作；MVP 通过 CLI/headless 导出 PNG 即可闭环，模板 JSON 导入作为可编辑兜底。
