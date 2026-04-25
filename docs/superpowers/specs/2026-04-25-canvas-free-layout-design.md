# Canvas 自由布局设计

将现有的块级编辑器升级为基于 Fabric.js 的 Canvas 自由布局编辑器，支持拖拽定位、缩放旋转，用于生成更丰富的微信海报图片。

## 目标

- 从垂直块列表布局升级为 9:16 固定画布上的自由布局
- 支持图片、文字、装饰元素的自由放置、缩放、旋转
- 保留现有块组件（标题、卡片、列表等）作为画布上的可定位元素
- 使用 Canvas API 导出高清图片（900x1600）
- 保留模板系统和移动端适配

## 架构

```
编辑器页面
├── 左侧面板 (ElementPanel) — 5个Tab：组件/图片/文字/装饰/模板
├── 中间画布 (CanvasEditor) — Fabric.js Canvas, 450x800 逻辑尺寸, 9:16
└── 右侧面板
    ├── 属性配置 (CanvasObjectConfig) — 选中元素的属性编辑
    └── 图层列表 (LayerPanel) — 拖拽排序/锁定/隐藏/删除
```

画布分为两个逻辑层：
1. **背景层**：画布背景色/渐变/图案
2. **自由元素层**：所有元素都是 Fabric 对象，可自由定位

## 数据模型

```js
{
  canvas: {
    width: 450,
    height: 800,
    background: { type: 'color', value: '#ffffff' }
  },
  objects: [
    {
      id: string,
      type: 'block' | 'image' | 'text' | 'decoration',
      // block 类型
      componentId?: string,
      props?: {},
      // image 类型
      src?: string,
      // text 类型
      text?: string,
      fontSize?: number,
      fontFamily?: string,
      color?: string,
      fontWeight?: string,
      fontStyle?: string,
      textAlign?: string,
      lineHeight?: number,
      // decoration 类型
      shape?: 'rect' | 'circle' | 'triangle' | 'line' | 'bar' | 'wave',
      fill?: string,
      stroke?: string,
      strokeWidth?: number,
      // 通用
      opacity?: number,
      locked?: boolean,
      visible?: boolean,
      fabric: {
        x: number,
        y: number,
        width?: number,
        height?: number,
        scaleX?: number,
        scaleY?: number,
        angle?: number
      }
    }
  ]
}
```

## 元素系统

### 四种元素类型

| 类型 | 来源 | 操作 | 配置项 |
|------|------|------|--------|
| 块内容 (block) | 现有 CustomComponentDefinitions | 拖拽定位、缩放宽高 | 现有组件 props |
| 图片 (image) | 上传/URL | 拖拽、缩放、旋转 | 圆角、透明度 |
| 文字 (text) | 新建 | 拖拽、缩放、旋转 | 字体、字号、颜色、粗体/斜体、对齐、行高 |
| 装饰 (decoration) | 预置形状库 | 拖拽、缩放、旋转 | 形状类型、填充色、边框、透明度 |

### 装饰形状

矩形、圆形、三角形、线条、色条、波浪线。

### 交互设计

1. **添加元素**：从左侧面板点击添加，元素出现在画布中央
2. **选中元素**：点击画布元素，显示 Fabric 控制手柄（缩放+旋转）
3. **编辑属性**：选中后右侧面板展示配置项
4. **图层管理**：右侧底部图层列表，支持拖拽排序、锁定、隐藏、删除
5. **删除元素**：Delete 键或面板删除按钮
6. **双击块内容**：进入块内容属性编辑

### 块内容的 Fabric 集成

- 编辑时：块内容渲染为 DOM 元素，叠加在 Canvas 上对应位置
- 通过 Fabric 自定义对象类型管理位置/尺寸
- 导出时：html-to-image 截图转为图片，合成到 Canvas

## 导出系统

### Canvas API 导出流程

1. 创建离屏 Canvas (900x1600, 2x 高清)
2. 绘制背景层（纯色/渐变/图案）
3. 按图层顺序遍历 objects：
   - 装饰元素 → Canvas API 直接绘制（fillRect、arc、path）
   - 图片元素 → drawImage，应用变换矩阵
   - 文字元素 → fillText，应用字体/颜色/变换
   - 块内容 → html-to-image 截图 → drawImage 合成
4. canvas.toBlob() → 下载文件

### 导出配置

- format: png | jpg（默认 png）
- quality: 0.95（JPG 质量）
- pixelRatio: 2（高清倍率）
- 输出尺寸: 900x1600（逻辑 450x800 的 2x）

## UI 布局

### 桌面端

- 三栏布局：左侧面板 240px + 中间画布自适应 + 右侧面板 280px
- 顶部工具栏：撤销/重做、画布背景色、导出按钮

### 左侧面板 Tab

1. 组件 — 现有块组件列表
2. 图片 — 上传/URL 输入
3. 文字 — 新建文本（预设标题/副标题/正文/标签样式）
4. 装饰 — 预置形状库
5. 模板 — 现有模板选择

### 右侧面板

- 未选中：画布属性 + 图层列表
- 选中元素：元素属性配置 + 图层列表
- 图层列表始终在底部

### 移动端

- 画布全屏
- 底部 Tab 切换组件/属性
- 选中元素弹出属性 bottom sheet

## 文件变更

### 新增

- `src/components/CanvasEditor.jsx` — Fabric 画布组件
- `src/components/CanvasObjectConfig.jsx` — 元素属性配置面板
- `src/components/ElementPanel.jsx` — 元素添加面板（5 Tab）
- `src/components/LayerPanel.jsx` — 图层管理面板
- `src/utils/canvasExporter.js` — Canvas API 导出逻辑
- `src/utils/decorShapes.js` — 装饰形状定义
- `src/utils/canvasUtils.js` — Fabric 自定义对象、数据转换工具

### 重写

- `src/pages/Index.jsx` — 编辑器页面布局（三栏）
- `src/pages/MobileEditor.jsx` — 移动端编辑器

### 复用

- `src/components/CustomComponentDefinitions.js` — 块组件定义（不修改）
- `src/components/ComponentConfigDrawer.jsx` — 属性字段渲染逻辑（提取复用）
- `src/components/Templates.js` — 模板数据（迁移为 objects 格式）

### 移除

- `src/components/BlockEditor.jsx` — 功能合并到 CanvasEditor
- `src/components/BlocksPreview.jsx` — 功能合并到 CanvasEditor + canvasExporter

## 依赖

- `fabric` (^6.x) — Canvas 编辑引擎
- 保留现有 `html-to-image` 用于块内容截图合成
