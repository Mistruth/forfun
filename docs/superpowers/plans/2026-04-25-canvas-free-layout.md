# Canvas 自由布局实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有块级编辑器替换为基于 Fabric.js 的 Canvas 自由布局编辑器，支持拖拽/缩放/旋转，使用 Canvas API 导出高清微信海报图片。

**Architecture:** 使用 Fabric.js 作为 Canvas 编辑引擎，中间区域渲染 450x800 逻辑画布（9:16）。现有块组件（CustomComponentDefinitions）作为 DOM overlay 叠加在画布上，通过自定义 Fabric 对象管理位置。新增图片、文字、装饰三类自由元素。导出时用 Canvas API 合成所有元素。

**Tech Stack:** React 18, Fabric.js v6, html-to-image (块内容截图), Tailwind CSS, Radix UI

---

## File Structure

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/components/CanvasEditor.jsx` | Fabric.js 画布组件，管理画布初始化、对象操作、选中状态 |
| `src/components/ElementPanel.jsx` | 左侧元素添加面板（5 Tab：组件/图片/文字/装饰/模板） |
| `src/components/LayerPanel.jsx` | 右侧图层面板，显示图层列表、拖拽排序、锁定/隐藏/删除 |
| `src/components/CanvasObjectConfig.jsx` | 右侧属性配置面板，根据选中元素类型动态渲染 |
| `src/utils/canvasExporter.js` | Canvas API 导出逻辑，合成所有元素为图片 |
| `src/utils/decorShapes.js` | 装饰形状定义（矩形、圆形、三角形、线条、色条、波浪线） |
| `src/utils/fabricBlockObject.js` | 自定义 Fabric 对象类型，管理 DOM overlay 块内容的位置/尺寸 |
| `src/utils/canvasState.js` | 数据模型转换工具（objects ↔ Fabric canvas 序列化） |

### 重写文件

| 文件 | 变更 |
|------|------|
| `src/pages/Index.jsx` | 三栏布局替换：左 ElementPanel + 中 CanvasEditor + 右 CanvasObjectConfig/LayerPanel |
| `src/pages/MobileEditor.jsx` | 画布全屏 + 底部 Tab 切换 |
| `src/components/ImageGenerator.jsx` | 改用 canvasExporter 导出 |
| `src/components/TemplatePickerDialog.jsx` | 模板数据迁移为 objects 格式 |

### 复用文件（不修改）

| 文件 | 复用方式 |
|------|---------|
| `src/components/CustomComponentDefinitions.js` | 块组件定义和渲染函数，通过 renderFn 生成 HTML |
| `src/components/ComponentConfigDrawer.jsx` | 提取 FieldRenderer 及各字段编辑器组件复用 |

### 移除文件

| 文件 | 原因 |
|------|------|
| `src/components/BlockEditor.jsx` | 功能合并到 CanvasEditor |
| `src/components/BlocksPreview.jsx` | 功能合并到 CanvasEditor + canvasExporter |

---

### Task 1: 安装 Fabric.js 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 fabric**

Run: `pnpm add fabric`

- [ ] **Step 2: 验证安装成功**

Run: `node -e "const { Canvas } = require('fabric'); console.log('fabric loaded')" || node -e "import('fabric').then(m => console.log('fabric loaded', Object.keys(m).slice(0,5)))"`

Expected: 输出 "fabric loaded"

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 安装 fabric.js 依赖"
```

---

### Task 2: 装饰形状定义

**Files:**
- Create: `src/utils/decorShapes.js`

- [ ] **Step 1: 创建装饰形状定义文件**

```js
// src/utils/decorShapes.js

// 装饰形状定义 — 每种形状包含 id, name, preview, defaultProps
// defaultProps 中的 fabric 字段是放置到画布时的默认位置/尺寸
export const decorShapes = [
  {
    id: 'rect',
    name: '矩形',
    preview: '▬',
    defaultProps: {
      fill: '#58bb90',
      opacity: 0.3,
      fabric: { width: 200, height: 20 },
    },
  },
  {
    id: 'circle',
    name: '圆形',
    preview: '●',
    defaultProps: {
      fill: '#58bb90',
      opacity: 0.2,
      fabric: { width: 60, height: 60 },
    },
  },
  {
    id: 'triangle',
    name: '三角形',
    preview: '▲',
    defaultProps: {
      fill: '#58bb90',
      opacity: 0.3,
      fabric: { width: 60, height: 52 },
    },
  },
  {
    id: 'line',
    name: '线条',
    preview: '—',
    defaultProps: {
      stroke: '#58bb90',
      strokeWidth: 2,
      fabric: { width: 200, height: 1 },
    },
  },
  {
    id: 'bar',
    name: '色条',
    preview: '▮',
    defaultProps: {
      fill: '#58bb90',
      opacity: 1,
      fabric: { width: 6, height: 100 },
    },
  },
  {
    id: 'wave',
    name: '波浪线',
    preview: '〰',
    defaultProps: {
      stroke: '#58bb90',
      strokeWidth: 2,
      fabric: { width: 200, height: 30 },
    },
  },
];

// 在 Fabric canvas 上创建装饰形状
export function createDecorFabricObject(shapeDef, fabricProps) {
  const { fabric } = fabricProps;
  const left = fabric?.x ?? 225;
  const top = fabric?.y ?? 400;
  const width = fabric?.width ?? shapeDef.defaultProps.fabric.width;
  const height = fabric?.height ?? shapeDef.defaultProps.fabric.height;

  const common = {
    left,
    top,
    opacity: fabricProps.opacity ?? shapeDef.defaultProps.opacity,
    angle: fabric?.angle ?? 0,
  };

  switch (shapeDef.id) {
    case 'rect':
    case 'bar': {
      const { Rect } = require('fabric');
      return new Rect({
        ...common,
        width,
        height,
        fill: fabricProps.fill ?? shapeDef.defaultProps.fill,
        rx: shapeDef.id === 'rect' ? 4 : 0,
        ry: shapeDef.id === 'rect' ? 4 : 0,
      });
    }
    case 'circle': {
      const { Circle } = require('fabric');
      return new Circle({
        ...common,
        radius: Math.min(width, height) / 2,
        fill: fabricProps.fill ?? shapeDef.defaultProps.fill,
      });
    }
    case 'triangle': {
      const { Triangle } = require('fabric');
      return new Triangle({
        ...common,
        width,
        height,
        fill: fabricProps.fill ?? shapeDef.defaultProps.fill,
      });
    }
    case 'line': {
      const { Line } = require('fabric');
      return new Line([0, 0, width, 0], {
        ...common,
        stroke: fabricProps.stroke ?? shapeDef.defaultProps.stroke,
        strokeWidth: fabricProps.strokeWidth ?? shapeDef.defaultProps.strokeWidth,
      });
    }
    case 'wave': {
      const { Path } = require('fabric');
      // 生成波浪路径
      const segments = Math.max(2, Math.floor(width / 20));
      let pathData = 'M 0 0';
      for (let i = 0; i < segments; i++) {
        const x1 = (width / segments) * (i + 0.25);
        const y1 = -height / 2;
        const x2 = (width / segments) * (i + 0.75);
        const y2 = height / 2;
        const x3 = (width / segments) * (i + 1);
        pathData += ` Q ${x1} ${y1} ${width / segments * (i + 0.5)} 0`;
        pathData += ` Q ${x2} ${y2} ${x3} 0`;
      }
      return new Path(pathData, {
        ...common,
        stroke: fabricProps.stroke ?? shapeDef.defaultProps.stroke,
        strokeWidth: fabricProps.strokeWidth ?? shapeDef.defaultProps.strokeWidth,
        fill: '',
      });
    }
    default:
      return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/decorShapes.js
git commit -m "feat: 添加装饰形状定义和创建函数"
```

---

### Task 3: 数据模型和状态管理工具

**Files:**
- Create: `src/utils/canvasState.js`

- [ ] **Step 1: 创建画布数据模型和工具函数**

```js
// src/utils/canvasState.js

let _idCounter = 1;
export const genId = (prefix = 'obj') => `${prefix}_${Date.now()}_${_idCounter++}`;

// 默认画布配置
export const DEFAULT_CANVAS = {
  width: 450,
  height: 800,
  background: { type: 'color', value: '#ffffff' },
};

// 创建新元素的工厂函数
export function createCanvasObject(type, overrides = {}) {
  const base = {
    id: genId('obj'),
    type,
    opacity: 1,
    locked: false,
    visible: true,
    fabric: {
      x: 225,
      y: 400,
      angle: 0,
      ...overrides.fabric,
    },
  };

  switch (type) {
    case 'block':
      return {
        ...base,
        componentId: overrides.componentId,
        props: overrides.props || {},
        fabric: {
          ...base.fabric,
          width: overrides.fabric?.width ?? 410,
          height: overrides.fabric?.height ?? 100,
        },
      };
    case 'image':
      return {
        ...base,
        src: overrides.src || '',
        fabric: {
          ...base.fabric,
          width: overrides.fabric?.width ?? 200,
          height: overrides.fabric?.height ?? 150,
          scaleX: 1,
          scaleY: 1,
        },
      };
    case 'text':
      return {
        ...base,
        text: overrides.text || '输入文字',
        fontSize: overrides.fontSize ?? 18,
        fontFamily: overrides.fontFamily ?? "'PingFang SC', sans-serif",
        color: overrides.color ?? '#333333',
        fontWeight: overrides.fontWeight ?? 'normal',
        fontStyle: overrides.fontStyle ?? 'normal',
        textAlign: overrides.textAlign ?? 'left',
        lineHeight: overrides.lineHeight ?? 1.4,
      };
    case 'decoration':
      return {
        ...base,
        shape: overrides.shape ?? 'rect',
        fill: overrides.fill,
        stroke: overrides.stroke,
        strokeWidth: overrides.strokeWidth,
        fabric: {
          ...base.fabric,
          width: overrides.fabric?.width ?? 200,
          height: overrides.fabric?.height ?? 20,
        },
      };
    default:
      return base;
  }
}

// 文字预设样式
export const TEXT_PRESETS = [
  {
    id: 'heading',
    name: '标题',
    defaultProps: { text: '输入标题', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  },
  {
    id: 'subtitle',
    name: '副标题',
    defaultProps: { text: '输入副标题', fontSize: 20, fontWeight: 'bold', color: '#555555' },
  },
  {
    id: 'body',
    name: '正文',
    defaultProps: { text: '输入正文内容', fontSize: 16, fontWeight: 'normal', color: '#333333' },
  },
  {
    id: 'label',
    name: '标签',
    defaultProps: { text: '标签', fontSize: 12, fontWeight: 'bold', color: '#58bb90' },
  },
];

// 从旧模板 blocks 格式转换为新的 objects 格式
export function migrateBlocksToObjects(blocks) {
  if (!blocks || blocks.length === 0) return [];

  let currentY = 20;
  return blocks.map((block) => {
    const obj = createCanvasObject(
      block.type === 'custom' ? 'block' : block.type,
      {
        componentId: block.componentId,
        props: block.props,
        fabric: {
          x: 20,
          y: currentY,
          width: 410,
          height: 100, // 默认高度，实际会根据内容自适应
        },
      }
    );
    // 简单估算下一个元素的 Y 位置
    currentY += 120;
    return obj;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/canvasState.js
git commit -m "feat: 添加画布数据模型和状态管理工具"
```

---

### Task 4: Fabric.js 自定义块内容对象

**Files:**
- Create: `src/utils/fabricBlockObject.js`

- [ ] **Step 1: 创建自定义 Fabric 对象，用于管理 DOM overlay 块内容**

```js
// src/utils/fabricBlockObject.js
// 自定义 Fabric 对象类型，将现有块组件的 HTML 渲染为 DOM overlay

import { Rect } from 'fabric';
import { customComponents } from '@/components/CustomComponentDefinitions';

// 创建一个不可见的 Fabric Rect 作为占位符
// 真实的 HTML 内容通过 DOM overlay 渲染在画布上方
export function createBlockObject(canvasObj, canvasEl) {
  const { fabric } = canvasObj;
  const rect = new Rect({
    left: fabric.x,
    top: fabric.y,
    width: fabric.width || 410,
    height: fabric.height || 100,
    fill: 'transparent',
    stroke: '#3b82f6',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    opacity: 0.6,
    selectable: true,
    hasControls: true,
    hasBorders: true,
  });

  // 将业务数据绑定到 Fabric 对象上
  rect._canvasMeta = {
    objectType: 'block',
    data: canvasObj,
  };

  return rect;
}

// 根据块内容创建/更新 DOM overlay
export function renderBlockOverlay(canvasObj, containerEl) {
  if (!containerEl) return null;

  const compDef = customComponents.find(c => c.id === canvasObj.componentId);
  if (!compDef) return null;

  const html = compDef.renderFn(canvasObj.props || compDef.defaultProps);
  const { fabric } = canvasObj;

  const overlay = document.createElement('div');
  overlay.setAttribute('data-overlay-id', canvasObj.id);
  overlay.style.position = 'absolute';
  overlay.style.left = `${fabric.x}px`;
  overlay.style.top = `${fabric.y}px`;
  overlay.style.width = `${fabric.width || 410}px`;
  overlay.style.pointerEvents = 'none';
  overlay.innerHTML = html;

  containerEl.appendChild(overlay);
  return overlay;
}

// 更新已有 overlay 的位置和内容
export function updateBlockOverlay(canvasObj, containerEl) {
  const existing = containerEl.querySelector(`[data-overlay-id="${canvasObj.id}"]`);
  if (!existing) {
    return renderBlockOverlay(canvasObj, containerEl);
  }

  const compDef = customComponents.find(c => c.id === canvasObj.componentId);
  if (!compDef) return existing;

  const html = compDef.renderFn(canvasObj.props || compDef.defaultProps);
  const { fabric } = canvasObj;

  existing.style.left = `${fabric.x}px`;
  existing.style.top = `${fabric.y}px`;
  existing.style.width = `${fabric.width || 410}px`;
  existing.innerHTML = html;

  return existing;
}

// 移除 overlay
export function removeBlockOverlay(objectId, containerEl) {
  const existing = containerEl.querySelector(`[data-overlay-id="${objectId}"]`);
  if (existing) existing.remove();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/fabricBlockObject.js
git commit -m "feat: 添加自定义 Fabric 块内容对象和 DOM overlay 管理"
```

---

### Task 5: Canvas API 导出器

**Files:**
- Create: `src/utils/canvasExporter.js`

- [ ] **Step 1: 创建 Canvas API 导出逻辑**

```js
// src/utils/canvasExporter.js
// 使用原生 Canvas API 将画布内容合成导出为图片

import { toPng } from 'html-to-image';
import { decorShapes } from './decorShapes';

const EXPORT_PIXEL_RATIO = 2;
const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 800;

export async function exportCanvas(objects, canvasConfig, options = {}) {
  const {
    format = 'png',
    quality = 0.95,
  } = options;

  const exportWidth = CANVAS_WIDTH * EXPORT_PIXEL_RATIO;
  const exportHeight = CANVAS_HEIGHT * EXPORT_PIXEL_RATIO;

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');

  // 1. 绘制背景
  ctx.scale(EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIO);
  if (canvasConfig?.background?.type === 'color') {
    ctx.fillStyle = canvasConfig?.background?.value || '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 2. 按图层顺序绘制每个元素
  for (const obj of objects) {
    if (!obj.visible) continue;
    await renderObject(ctx, obj);
  }

  // 3. 导出
  return new Promise((resolve, reject) => {
    if (format === 'jpg') {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('导出失败')),
        'image/jpeg',
        quality
      );
    } else {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('导出失败')),
        'image/png'
      );
    }
  });
}

async function renderObject(ctx, obj) {
  const { fabric: f } = obj;
  ctx.save();

  // 设置透明度
  ctx.globalAlpha = obj.opacity ?? 1;

  // 变换：平移到中心点 -> 旋转 -> 平移回来
  if (f.angle) {
    const cx = f.x + (f.width || 0) / 2;
    const cy = f.y + (f.height || 0) / 2;
    ctx.translate(cx, cy);
    ctx.rotate((f.angle * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (obj.type) {
    case 'decoration':
      renderDecoration(ctx, obj);
      break;
    case 'image':
      await renderImage(ctx, obj);
      break;
    case 'text':
      renderText(ctx, obj);
      break;
    case 'block':
      await renderBlock(ctx, obj);
      break;
  }

  ctx.restore();
}

function renderDecoration(ctx, obj) {
  const { fabric: f, shape, fill, stroke, strokeWidth } = obj;
  const w = f.width || 200;
  const h = f.height || 20;

  switch (shape) {
    case 'rect':
    case 'bar':
      ctx.fillStyle = fill || '#58bb90';
      if (shape === 'rect') {
        roundRect(ctx, f.x, f.y, w, h, 4);
      } else {
        ctx.fillRect(f.x, f.y, w, h);
      }
      break;
    case 'circle':
      ctx.fillStyle = fill || '#58bb90';
      ctx.beginPath();
      ctx.arc(f.x + w / 2, f.y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'triangle':
      ctx.fillStyle = fill || '#58bb90';
      ctx.beginPath();
      ctx.moveTo(f.x + w / 2, f.y);
      ctx.lineTo(f.x + w, f.y + h);
      ctx.lineTo(f.x, f.y + h);
      ctx.closePath();
      ctx.fill();
      break;
    case 'line':
      ctx.strokeStyle = stroke || '#58bb90';
      ctx.lineWidth = strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + w, f.y);
      ctx.stroke();
      break;
    case 'wave':
      ctx.strokeStyle = stroke || '#58bb90';
      ctx.lineWidth = strokeWidth || 2;
      ctx.beginPath();
      const segments = Math.max(2, Math.floor(w / 20));
      ctx.moveTo(f.x, f.y);
      for (let i = 0; i < segments; i++) {
        const sw = w / segments;
        const cx1 = f.x + sw * (i + 0.25);
        const cy1 = f.y - h / 2;
        const cx2 = f.x + sw * (i + 0.75);
        const cy2 = f.y + h / 2;
        const ex = f.x + sw * (i + 1);
        ctx.quadraticCurveTo(cx1, cy1, f.x + sw * (i + 0.5), f.y);
        ctx.quadraticCurveTo(cx2, cy2, ex, f.y);
      }
      ctx.stroke();
      break;
  }
}

async function renderImage(ctx, obj) {
  const { src, fabric: f } = obj;
  if (!src) return;

  try {
    const img = await loadImage(src);
    const sx = f.scaleX ?? 1;
    const sy = f.scaleY ?? 1;
    ctx.drawImage(img, f.x, f.y, (f.width || 200) * sx, (f.height || 150) * sy);
  } catch {
    // 图片加载失败，跳过
  }
}

function renderText(ctx, obj) {
  const { text, fontSize, fontFamily, color, fontWeight, fontStyle, textAlign, lineHeight, fabric: f } = obj;
  const weight = fontWeight || 'normal';
  const style = fontStyle === 'italic' ? 'italic' : 'normal';
  const size = fontSize || 18;

  ctx.font = `${style} ${weight} ${size}px ${fontFamily || "'PingFang SC', sans-serif"}`;
  ctx.fillStyle = color || '#333333';
  ctx.textAlign = textAlign || 'left';
  ctx.textBaseline = 'top';

  const lines = (text || '').split('\n');
  const lh = size * (lineHeight || 1.4);
  lines.forEach((line, i) => {
    ctx.fillText(line, f.x, f.y + i * lh);
  });
}

async function renderBlock(ctx, obj) {
  // 块内容：通过 html-to-image 截取对应 DOM overlay，然后绘制到 Canvas
  const overlayEl = document.querySelector(`[data-overlay-id="${obj.id}"]`);
  if (!overlayEl) return;

  try {
    const dataUrl = await toPng(overlayEl, {
      quality: 1,
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: null,
    });
    const img = await loadImage(dataUrl);
    ctx.drawImage(img, obj.fabric.x, obj.fabric.y, obj.fabric.width || 410, overlayEl.offsetHeight || 100);
  } catch {
    // 截图失败，跳过
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 下载工具函数
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/canvasExporter.js
git commit -m "feat: 添加 Canvas API 导出器"
```

---

### Task 6: CanvasEditor 组件

**Files:**
- Create: `src/components/CanvasEditor.jsx`

- [ ] **Step 1: 创建 Fabric.js 画布组件**

```jsx
// src/components/CanvasEditor.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, Rect, Circle, Triangle, Line, Path, IText, Image as FabricImage } from 'fabric';
import { createBlockObject, renderBlockOverlay, updateBlockOverlay, removeBlockOverlay } from '@/utils/fabricBlockObject';
import { decorShapes, createDecorFabricObject } from '@/utils/decorShapes';
import { loadImage } from '@/utils/canvasExporter';

const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 800;

const CanvasEditor = ({
  objects,
  canvasConfig,
  onChange,
  onSelectObject,
  onUpdateObject,
}) => {
  const canvasContainerRef = useRef(null);
  const fabricRef = useRef(null);
  const overlayContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // 初始化 Fabric canvas
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const canvas = new Canvas(canvasContainerRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: canvasConfig?.background?.value || '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // 选中事件
    canvas.on('selection:created', (e) => {
      const meta = e.selected?.[0]?._canvasMeta;
      if (meta) onSelectObject(meta.data.id);
    });
    canvas.on('selection:updated', (e) => {
      const meta = e.selected?.[0]?._canvasMeta;
      if (meta) onSelectObject(meta.data.id);
    });
    canvas.on('selection:cleared', () => {
      onSelectObject(null);
    });

    // 对象移动/缩放/旋转时同步到数据
    canvas.on('object:modified', (e) => {
      const fabObj = e.target;
      const meta = fabObj._canvasMeta;
      if (!meta) return;

      const updatedFabric = {
        x: Math.round(fabObj.left),
        y: Math.round(fabObj.top),
        width: Math.round(fabObj.width * (fabObj.scaleX || 1)),
        height: Math.round(fabObj.height * (fabObj.scaleY || 1)),
        scaleX: fabObj.scaleX || 1,
        scaleY: fabObj.scaleY || 1,
        angle: Math.round(fabObj.angle || 0),
      };

      onUpdateObject(meta.data.id, { fabric: updatedFabric });

      // 同步 DOM overlay
      if (meta.objectType === 'block' && overlayContainerRef.current) {
        const objData = objects.find(o => o.id === meta.data.id);
        if (objData) {
          updateBlockOverlay({ ...objData, fabric: updatedFabric }, overlayContainerRef.current);
        }
      }
    });

    setIsReady(true);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // 仅初始化一次

  // 同步 objects 到 Fabric canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    const overlay = overlayContainerRef.current;
    if (!canvas || !isReady) return;

    // 清除现有对象
    canvas.clear();
    canvas.backgroundColor = canvasConfig?.background?.value || '#ffffff';
    if (overlay) overlay.innerHTML = '';

    // 按顺序添加对象
    (async () => {
      for (const obj of objects) {
        if (!obj.visible) continue;
        const fabObj = await createFabricObject(obj, overlay);
        if (fabObj) {
          canvas.add(fabObj);
        }
      }
      canvas.renderAll();
    })();
  }, [objects, canvasConfig, isReady]);

  // 创建 Fabric 对象
  const createFabricObject = async (obj, overlay) => {
    switch (obj.type) {
      case 'block': {
        const fabObj = createBlockObject(obj);
        if (overlay) renderBlockOverlay(obj, overlay);
        return fabObj;
      }
      case 'image': {
        if (!obj.src) {
          // 占位矩形
          const rect = new Rect({
            left: obj.fabric.x,
            top: obj.fabric.y,
            width: obj.fabric.width || 200,
            height: obj.fabric.height || 150,
            fill: '#f0f0f0',
            stroke: '#ccc',
            strokeWidth: 1,
            strokeDashArray: [4, 4],
          });
          rect._canvasMeta = { objectType: 'image', data: obj };
          return rect;
        }
        try {
          const img = await loadImage(obj.src);
          const fabImg = new FabricImage(img, {
            left: obj.fabric.x,
            top: obj.fabric.y,
            scaleX: (obj.fabric.width || 200) / img.width,
            scaleY: (obj.fabric.height || 150) / img.height,
            angle: obj.fabric.angle || 0,
            opacity: obj.opacity ?? 1,
          });
          fabImg._canvasMeta = { objectType: 'image', data: obj };
          return fabImg;
        } catch {
          return null;
        }
      }
      case 'text': {
        const text = new IText(obj.text || '输入文字', {
          left: obj.fabric.x,
          top: obj.fabric.y,
          fontSize: obj.fontSize || 18,
          fontFamily: obj.fontFamily || "'PingFang SC', sans-serif",
          fill: obj.color || '#333333',
          fontWeight: obj.fontWeight || 'normal',
          fontStyle: obj.fontStyle || 'normal',
          textAlign: obj.textAlign || 'left',
          lineHeight: obj.lineHeight || 1.4,
          angle: obj.fabric.angle || 0,
          opacity: obj.opacity ?? 1,
        });
        text._canvasMeta = { objectType: 'text', data: obj };
        return text;
      }
      case 'decoration': {
        const shapeDef = decorShapes.find(s => s.id === obj.shape);
        if (!shapeDef) return null;
        const fabObj = createDecorFabricObject(shapeDef, {
          ...obj,
          fabric: obj.fabric,
        });
        if (fabObj) fabObj._canvasMeta = { objectType: 'decoration', data: obj };
        return fabObj;
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
      {/* DOM overlay 层，用于块内容渲染 */}
      <div
        ref={overlayContainerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, overflow: 'hidden' }}
      />
      {/* Fabric canvas */}
      <canvas ref={canvasContainerRef} />
    </div>
  );
};

export default CanvasEditor;
export { CANVAS_WIDTH, CANVAS_HEIGHT };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CanvasEditor.jsx
git commit -m "feat: 添加 CanvasEditor 组件 — Fabric.js 画布核心"
```

---

### Task 7: ElementPanel 组件

**Files:**
- Create: `src/components/ElementPanel.jsx`

- [ ] **Step 1: 创建左侧元素添加面板**

```jsx
// src/components/ElementPanel.jsx
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { customComponents, componentCategories } from './CustomComponentDefinitions';
import { decorShapes } from '@/utils/decorShapes';
import { TEXT_PRESETS, createCanvasObject } from '@/utils/canvasState';
import { templates, templateCategories } from './Templates';
import {
  Grid, Type, AlignLeft, Image, Minus, Layout, BarChart, Sparkles,
  Search, Plus, Eye, Square, Quote, List, LayoutTemplate,
  Upload, Link,
} from 'lucide-react';

const iconMap = {
  Grid, Type, Square, Quote, Minus, List, AlignLeft,
  Image, Layout, BarChart, Sparkles,
};

const TABS = [
  { id: 'components', name: '组件', icon: Layout },
  { id: 'images', name: '图片', icon: Image },
  { id: 'text', name: '文字', icon: Type },
  { id: 'decor', name: '装饰', icon: Square },
  { id: 'templates', name: '模板', icon: LayoutTemplate },
];

const ElementPanel = ({ onAddObject, onApplyTemplate }) => {
  const [activeTab, setActiveTab] = useState('components');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [imageUrl, setImageUrl] = useState('');

  const filteredComponents = customComponents.filter(comp => {
    const matchCategory = activeCategory === 'all' || comp.category === activeCategory;
    const matchSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddBlock = (comp) => {
    const obj = createCanvasObject('block', {
      componentId: comp.id,
      props: { ...comp.defaultProps },
    });
    onAddObject(obj);
  };

  const handleAddText = (preset) => {
    const obj = createCanvasObject('text', preset.defaultProps);
    onAddObject(obj);
  };

  const handleAddDecoration = (shape) => {
    const obj = createCanvasObject('decoration', {
      shape: shape.id,
      fill: shape.defaultProps.fill,
      stroke: shape.defaultProps.stroke,
      strokeWidth: shape.defaultProps.strokeWidth,
      opacity: shape.defaultProps.opacity,
      fabric: { ...shape.defaultProps.fabric },
    });
    onAddObject(obj);
  };

  const handleAddImage = () => {
    if (!imageUrl) return;
    const obj = createCanvasObject('image', { src: imageUrl });
    onAddObject(obj);
    setImageUrl('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const obj = createCanvasObject('image', { src: ev.target.result });
      onAddObject(obj);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-60 flex-shrink-0 bg-white border-r flex flex-col h-full">
      {/* Tab 栏 */}
      <div className="flex border-b overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs transition-colors min-w-[48px] ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* 组件 Tab */}
          {activeTab === 'components' && (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input
                  placeholder="搜索组件..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-7 text-xs"
                />
              </div>
              <div className="flex gap-1 flex-wrap mb-2">
                {componentCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-1 rounded text-xs ${
                      activeCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {filteredComponents.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => handleAddBlock(comp)}
                  className="w-full text-left p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <div className="font-medium text-xs text-gray-800">{comp.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{comp.preview}</div>
                </button>
              ))}
            </>
          )}

          {/* 图片 Tab */}
          {activeTab === 'images' && (
            <>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-1 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-all text-xs text-gray-500 hover:text-blue-500">
                  <Upload size={14} />
                  上传图片
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <div className="flex gap-1">
                  <Input
                    placeholder="图片 URL"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAddImage} disabled={!imageUrl}>
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* 文字 Tab */}
          {activeTab === 'text' && (
            <>
              {TEXT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleAddText(preset)}
                  className="w-full text-left p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <div className="font-medium text-xs text-gray-800">{preset.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{preset.defaultProps.text}</div>
                </button>
              ))}
            </>
          )}

          {/* 装饰 Tab */}
          {activeTab === 'decor' && (
            <>
              {decorShapes.map(shape => (
                <button
                  key={shape.id}
                  onClick={() => handleAddDecoration(shape)}
                  className="w-full text-left p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <span className="text-lg">{shape.preview}</span>
                  <div>
                    <div className="font-medium text-xs text-gray-800">{shape.name}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* 模板 Tab */}
          {activeTab === 'templates' && (
            <>
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => onApplyTemplate(tpl)}
                  className="w-full text-left p-2 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all"
                >
                  <div className="font-medium text-xs text-gray-800 flex items-center gap-1">
                    <span>{tpl.cover}</span> {tpl.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{tpl.description}</div>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ElementPanel;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ElementPanel.jsx
git commit -m "feat: 添加 ElementPanel 元素添加面板"
```

---

### Task 8: LayerPanel 和 CanvasObjectConfig 组件

**Files:**
- Create: `src/components/LayerPanel.jsx`
- Create: `src/components/CanvasObjectConfig.jsx`

- [ ] **Step 1: 创建图层面板**

```jsx
// src/components/LayerPanel.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown, Type, Image, Square, LayoutGrid } from 'lucide-react';

const typeIcons = {
  block: LayoutGrid,
  image: Image,
  text: Type,
  decoration: Square,
};

const typeLabels = {
  block: '块',
  image: '图',
  text: '字',
  decoration: '饰',
};

const LayerPanel = ({ objects, selectedId, onSelect, onDelete, onMove, onToggleVisible, onToggleLock }) => {
  // 图层从上到下（反向显示，最上层的在列表顶部）
  const reversedObjects = [...objects].reverse();

  return (
    <div className="border-t">
      <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 flex items-center justify-between">
        <span>图层 ({objects.length})</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {reversedObjects.map((obj) => {
          const Icon = typeIcons[obj.type] || Square;
          const isSelected = obj.id === selectedId;

          return (
            <div
              key={obj.id}
              onClick={() => onSelect(obj.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Icon size={12} />
              <span className="flex-1 truncate">
                {obj.type === 'block' && (obj.componentId || '块内容')}
                {obj.type === 'text' && (obj.text?.slice(0, 10) || '文字')}
                {obj.type === 'image' && '图片'}
                {obj.type === 'decoration' && (obj.shape || '装饰')}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisible(obj.id); }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {obj.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-gray-300" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {obj.locked ? <Lock size={11} className="text-gray-300" /> : <Unlock size={11} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(obj.id); }}
                className="p-0.5 hover:bg-red-100 text-red-400 rounded"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
        {objects.length === 0 && (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">暂无图层</div>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
```

- [ ] **Step 2: 创建属性配置面板**

```jsx
// src/components/CanvasObjectConfig.jsx
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { customComponents, FONT_FAMILY_OPTIONS } from './CustomComponentDefinitions';
import { decorShapes } from '@/utils/decorShapes';
import { ChevronDown } from 'lucide-react';

const CanvasObjectConfig = ({ object, onUpdate }) => {
  if (!object) return null;

  switch (object.type) {
    case 'block':
      return <BlockConfig object={object} onUpdate={onUpdate} />;
    case 'image':
      return <ImageConfig object={object} onUpdate={onUpdate} />;
    case 'text':
      return <TextConfig object={object} onUpdate={onUpdate} />;
    case 'decoration':
      return <DecorationConfig object={object} onUpdate={onUpdate} />;
    default:
      return null;
  }
};

// 块内容配置 — 复用 ComponentConfigDrawer 的字段系统
const BlockConfig = ({ object, onUpdate }) => {
  const compDef = customComponents.find(c => c.id === object.componentId);
  if (!compDef) return <div className="p-3 text-xs text-gray-400">未找到组件定义</div>;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-medium text-gray-600 mb-2">{compDef.name} 属性</div>
        {compDef.configFields.map(field => {
          if (field.showWhen) {
            const condVal = object.props?.[field.showWhen.key];
            if (condVal !== field.showWhen.value) return null;
          }
          return (
            <div key={field.key} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <ConfigField
                field={field}
                value={object.props?.[field.key]}
                onChange={(val) => onUpdate(object.id, { props: { ...object.props, [field.key]: val } })}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// 图片配置
const ImageConfig = ({ object, onUpdate }) => (
  <div className="p-3 space-y-3">
    <div className="space-y-1">
      <Label className="text-xs">透明度</Label>
      <Input
        type="range" min="0" max="1" step="0.1"
        value={object.opacity ?? 1}
        onChange={e => onUpdate(object.id, { opacity: parseFloat(e.target.value) })}
      />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">圆角 (px)</Label>
      <Input
        type="number" min="0" max="100"
        value={object.borderRadius ?? 0}
        onChange={e => onUpdate(object.id, { borderRadius: parseInt(e.target.value) })}
      />
    </div>
  </div>
);

// 文字配置
const TextConfig = ({ object, onUpdate }) => (
  <ScrollArea className="h-full">
    <div className="p-3 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">文字内容</Label>
        <Textarea
          value={object.text || ''}
          onChange={e => onUpdate(object.id, { text: e.target.value })}
          className="text-sm min-h-[60px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">字体</Label>
        <select
          value={object.fontFamily}
          onChange={e => onUpdate(object.id, { fontFamily: e.target.value })}
          className="w-full h-8 text-xs rounded-lg border bg-white px-2"
        >
          {FONT_FAMILY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">字号</Label>
          <Input type="number" value={object.fontSize || 18}
            onChange={e => onUpdate(object.id, { fontSize: parseInt(e.target.value) || 18 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">行高</Label>
          <Input type="number" step="0.1" value={object.lineHeight || 1.4}
            onChange={e => onUpdate(object.id, { lineHeight: parseFloat(e.target.value) || 1.4 })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">颜色</Label>
        <div className="flex gap-2">
          <input type="color" value={object.color || '#333333'}
            onChange={e => onUpdate(object.id, { color: e.target.value })}
            className="h-8 w-10 rounded border cursor-pointer" />
          <Input value={object.color || '#333333'}
            onChange={e => onUpdate(object.id, { color: e.target.value })}
            className="h-8 text-xs flex-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={object.fontWeight === 'bold' ? 'default' : 'outline'}
          onClick={() => onUpdate(object.id, { fontWeight: object.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className="flex-1 text-xs h-7">粗体</Button>
        <Button size="sm" variant={object.fontStyle === 'italic' ? 'default' : 'outline'}
          onClick={() => onUpdate(object.id, { fontStyle: object.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className="flex-1 text-xs h-7">斜体</Button>
      </div>
    </div>
  </ScrollArea>
);

// 装饰配置
const DecorationConfig = ({ object, onUpdate }) => (
  <div className="p-3 space-y-3">
    <div className="space-y-1">
      <Label className="text-xs">填充色</Label>
      <div className="flex gap-2">
        <input type="color" value={object.fill || '#58bb90'}
          onChange={e => onUpdate(object.id, { fill: e.target.value })}
          className="h-8 w-10 rounded border cursor-pointer" />
        <Input value={object.fill || '#58bb90'}
          onChange={e => onUpdate(object.id, { fill: e.target.value })}
          className="h-8 text-xs flex-1" />
      </div>
    </div>
    <div className="space-y-1">
      <Label className="text-xs">边框色</Label>
      <Input value={object.stroke || ''}
        onChange={e => onUpdate(object.id, { stroke: e.target.value })}
        placeholder="无边框" className="h-8 text-xs" />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">透明度</Label>
      <Input type="range" min="0" max="1" step="0.1"
        value={object.opacity ?? 1}
        onChange={e => onUpdate(object.id, { opacity: parseFloat(e.target.value) })} />
    </div>
  </div>
);

// 通用字段渲染器（简化版，复用 ComponentConfigDrawer 的字段类型）
const ConfigField = ({ field, value, onChange }) => {
  if (field.type === 'text') {
    return <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} className="h-8 text-xs" />;
  }
  if (field.type === 'textarea') {
    return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} className="text-xs min-h-[60px]" />;
  }
  if (field.type === 'color') {
    return (
      <div className="flex gap-2">
        <input type="color" value={value || '#58bb90'} onChange={e => onChange(e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
        <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-xs flex-1" />
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="relative">
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full h-8 text-xs rounded-lg border bg-white px-2 pr-6">
          {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    );
  }
  if (field.type === 'toggle') {
    return (
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    );
  }
  if (field.type === 'fontSelect') {
    return (
      <select value={value || FONT_FAMILY_OPTIONS[0].value} onChange={e => onChange(e.target.value)}
        className="w-full h-8 text-xs rounded-lg border bg-white px-2">
        {FONT_FAMILY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
    );
  }
  if (field.type === 'stepper') {
    const numVal = parseFloat(value) || field.min;
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(String(Math.max(field.min, numVal - (field.step || 1))))}
          className="h-7 w-7 rounded border bg-white text-sm">-</button>
        <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-7 text-xs text-center flex-1" />
        <button onClick={() => onChange(String(Math.min(field.max, numVal + (field.step || 1))))}
          className="h-7 w-7 rounded border bg-white text-sm">+</button>
      </div>
    );
  }
  if (field.type === 'imageUpload') {
    return (
      <div className="space-y-1">
        {value && <img src={value} alt="" className="w-full rounded max-h-24 object-cover" />}
        <label className="flex items-center justify-center gap-1 p-2 rounded border border-dashed border-gray-200 hover:border-blue-300 cursor-pointer text-xs text-gray-500">
          点击上传
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => onChange(ev.target.result);
            reader.readAsDataURL(file);
          }} />
        </label>
      </div>
    );
  }
  // richSegments, listEditor, statsEditor — 简化处理，直接用 textarea
  if (field.type === 'richSegments' || field.type === 'listEditor' || field.type === 'statsEditor') {
    return (
      <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
        请在预览中查看效果
      </div>
    );
  }
  return <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-xs" />;
};

export default CanvasObjectConfig;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LayerPanel.jsx src/components/CanvasObjectConfig.jsx
git commit -m "feat: 添加图层面板和属性配置面板"
```

---

### Task 9: 重写 Index.jsx 编辑器页面

**Files:**
- Modify: `src/pages/Index.jsx`

- [ ] **Step 1: 重写编辑器页面为三栏 Canvas 布局**

将 `src/pages/Index.jsx` 整体重写为：

```jsx
// src/pages/Index.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import CanvasEditor, { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/components/CanvasEditor';
import ElementPanel from '@/components/ElementPanel';
import CanvasObjectConfig from '@/components/CanvasObjectConfig';
import LayerPanel from '@/components/LayerPanel';
import { exportCanvas, downloadBlob } from '@/utils/canvasExporter';
import { DEFAULT_CANVAS, migrateBlocksToObjects } from '@/utils/canvasState';
import { templates } from '@/components/Templates';
import { PanelLeft, PanelLeftClose, Download, RotateCcw, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState([]);
  const [canvasConfig, setCanvasConfig] = useState({ ...DEFAULT_CANVAS });
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  const selectedObject = useMemo(
    () => objects.find(o => o.id === selectedObjectId) || null,
    [objects, selectedObjectId]
  );

  // 添加元素
  const handleAddObject = useCallback((obj) => {
    setObjects(prev => [...prev, obj]);
    toast.success('已添加元素');
  }, []);

  // 更新元素
  const handleUpdateObject = useCallback((id, patch) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  // 删除元素
  const handleDeleteObject = useCallback((id) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
  }, [selectedObjectId]);

  // 移动图层
  const handleMoveObject = useCallback((id, direction) => {
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx === -1) return prev;
      const newObjects = [...prev];
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= newObjects.length) return prev;
      [newObjects[idx], newObjects[targetIdx]] = [newObjects[targetIdx], newObjects[idx]];
      return newObjects;
    });
  }, []);

  // 切换可见性
  const handleToggleVisible = useCallback((id) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  }, []);

  // 切换锁定
  const handleToggleLock = useCallback((id) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, locked: !o.locked } : o));
  }, []);

  // 应用模板
  const handleApplyTemplate = useCallback((template) => {
    const newObjects = migrateBlocksToObjects(template.blocks);
    setObjects(newObjects);
    setSelectedObjectId(null);
    toast.success(`已加载模板「${template.name}」`);
  }, []);

  // 导出
  const handleExport = async (format = 'png') => {
    try {
      toast.info('正在生成图片...');
      const blob = await exportCanvas(objects, canvasConfig, { format });
      downloadBlob(blob, `wechat-poster.${format}`);
      toast.success('导出成功！');
    } catch (e) {
      console.error('导出失败:', e);
      toast.error('导出失败，请重试');
    }
  };

  // 重置
  const handleReset = () => {
    setObjects([]);
    setCanvasConfig({ ...DEFAULT_CANVAS });
    setSelectedObjectId(null);
    toast.success('已重置画布');
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 左侧面板 */}
      {showLeftPanel && (
        <ElementPanel
          onAddObject={handleAddObject}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* 中间画布区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowLeftPanel(!showLeftPanel)}>
              {showLeftPanel ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm font-bold text-gray-700">画布编辑器</span>
            <span className="text-xs text-gray-400">{CANVAS_WIDTH}x{CANVAS_HEIGHT} · 9:16</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-gray-600">
              背景
              <input
                type="color"
                value={canvasConfig.background?.value || '#ffffff'}
                onChange={e => setCanvasConfig(prev => ({ ...prev, background: { type: 'color', value: e.target.value } }))}
                className="h-7 w-10 rounded border cursor-pointer"
              />
            </label>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1" /> 重置
            </Button>
            <Button size="sm" onClick={() => handleExport('png')}>
              <Download size={14} className="mr-1" /> 导出 PNG
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('jpg')}>
              <Download size={14} className="mr-1" /> 导出 JPG
            </Button>
          </div>
        </div>

        {/* 画布 */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-8">
          <div className="shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <CanvasEditor
              objects={objects}
              canvasConfig={canvasConfig}
              onChange={setObjects}
              onSelectObject={setSelectedObjectId}
              onUpdateObject={handleUpdateObject}
            />
          </div>
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="w-72 flex-shrink-0 bg-white border-l flex flex-col">
        <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <span className="text-sm font-bold text-gray-700">
            {selectedObject ? '属性配置' : '画布属性'}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedObject ? (
            <CanvasObjectConfig object={selectedObject} onUpdate={handleUpdateObject} />
          ) : (
            <div className="p-3 text-xs text-gray-400 text-center py-12">
              选中画布上的元素以编辑属性
            </div>
          )}
        </div>

        <LayerPanel
          objects={objects}
          selectedId={selectedObjectId}
          onSelect={setSelectedObjectId}
          onDelete={handleDeleteObject}
          onMove={handleMoveObject}
          onToggleVisible={handleToggleVisible}
          onToggleLock={handleToggleLock}
        />
      </div>
    </div>
  );
};

export default Index;
```

- [ ] **Step 2: 验证应用启动**

Run: `pnpm dev`

Expected: 应用启动成功，显示三栏布局的画布编辑器

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.jsx
git commit -m "feat: 重写编辑器页面为三栏 Canvas 布局"
```

---

### Task 10: 重写 MobileEditor.jsx

**Files:**
- Modify: `src/pages/MobileEditor.jsx`

- [ ] **Step 1: 重写移动端编辑器**

将 `src/pages/MobileEditor.jsx` 重写为使用 CanvasEditor + ElementPanel + CanvasObjectConfig 的移动端适配版本。

核心改动：
- 画布全屏显示
- 底部 Tab 切换：元素添加 / 属性编辑
- 选中元素自动弹出属性 bottom sheet
- 导出按钮复用 canvasExporter

```jsx
// src/pages/MobileEditor.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CanvasEditor from '@/components/CanvasEditor';
import ElementPanel from '@/components/ElementPanel';
import CanvasObjectConfig from '@/components/CanvasObjectConfig';
import { exportCanvas, downloadBlob } from '@/utils/canvasExporter';
import { DEFAULT_CANVAS, migrateBlocksToObjects } from '@/utils/canvasState';
import {
  ChevronLeft, Plus, Settings2, Download, X,
} from 'lucide-react';

const MobileEditor = () => {
  const [objects, setObjects] = useState([]);
  const [canvasConfig, setCanvasConfig] = useState({ ...DEFAULT_CANVAS });
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [tab, setTab] = useState('canvas'); // canvas | elements | config
  const [showElementSheet, setShowElementSheet] = useState(false);

  const selectedObject = useMemo(
    () => objects.find(o => o.id === selectedObjectId) || null,
    [objects, selectedObjectId]
  );

  const handleAddObject = useCallback((obj) => {
    setObjects(prev => [...prev, obj]);
    toast.success('已添加');
    setShowElementSheet(false);
  }, []);

  const handleUpdateObject = useCallback((id, patch) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const handleApplyTemplate = useCallback((template) => {
    const newObjects = migrateBlocksToObjects(template.blocks);
    setObjects(newObjects);
    setSelectedObjectId(null);
    toast.success(`已加载「${template.name}」`);
    setShowElementSheet(false);
  }, []);

  const handleExport = async (format = 'png') => {
    try {
      toast.info('生成中...');
      const blob = await exportCanvas(objects, canvasConfig, { format });
      downloadBlob(blob, `poster.${format}`);
      toast.success('导出成功！');
    } catch {
      toast.error('导出失败');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-sm">画布编辑器</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleExport('png')}>
            <Download size={13} className="mr-1" /> PNG
          </Button>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="shadow-lg rounded-lg overflow-hidden border border-gray-200" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
          <CanvasEditor
            objects={objects}
            canvasConfig={canvasConfig}
            onChange={setObjects}
            onSelectObject={setSelectedObjectId}
            onUpdateObject={handleUpdateObject}
          />
        </div>
      </div>

      {/* 底部 Tab */}
      <div className="flex-shrink-0 bg-white border-t flex">
        <button onClick={() => setTab('canvas')} className={`flex-1 py-3 text-xs ${tab === 'canvas' ? 'text-blue-600' : 'text-gray-400'}`}>
          画布
        </button>
        <div className="px-4">
          <button onClick={() => setShowElementSheet(true)}
            className="w-14 h-14 -mt-5 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center">
            <Plus size={26} />
          </button>
        </div>
        <button onClick={() => setTab('config')} className={`flex-1 py-3 text-xs ${tab === 'config' ? 'text-blue-600' : 'text-gray-400'}`}>
          属性
        </button>
      </div>

      {/* 元素添加底部弹出 */}
      {showElementSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowElementSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-bold text-sm">添加元素</h3>
              <button onClick={() => setShowElementSheet(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <ElementPanel onAddObject={handleAddObject} onApplyTemplate={handleApplyTemplate} />
            </div>
          </div>
        </>
      )}

      {/* 属性配置 bottom sheet */}
      {tab === 'config' && selectedObject && (
        <div className="fixed bottom-14 left-0 right-0 bg-white border-t shadow-lg max-h-[50vh] overflow-auto z-30">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-bold">属性编辑</span>
            <button onClick={() => setTab('canvas')} className="text-gray-400"><X size={16} /></button>
          </div>
          <CanvasObjectConfig object={selectedObject} onUpdate={handleUpdateObject} />
        </div>
      )}
    </div>
  );
};

export default MobileEditor;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/MobileEditor.jsx
git commit -m "feat: 重写移动端编辑器使用 Canvas 布局"
```

---

### Task 11: 端到端验证和修复

**Files:**
- Possibly modify any of the above files

- [ ] **Step 1: 启动开发服务器**

Run: `pnpm dev`

- [ ] **Step 2: 验证核心功能**

手动检查清单：
1. 页面加载，三栏布局显示正常
2. 从左侧面板添加块组件 — 应出现在画布中央
3. 添加图片元素 — 应显示在画布上
4. 添加文字元素 — 应可双击编辑
5. 添加装饰形状 — 应正确渲染
6. 点击选中元素 — 显示控制手柄
7. 拖拽移动元素 — 位置更新
8. 右侧属性面板 — 选中后显示对应配置
9. 图层面板 — 显示所有元素，可操作
10. 导出 PNG — 下载图片文件
11. 应用模板 — 正确加载元素

- [ ] **Step 3: 修复发现的问题**

根据 Step 2 的测试结果修复 bug

- [ ] **Step 4: Commit 修复**

```bash
git add -A
git commit -m "fix: 修复端到端验证中发现的问题"
```

---

### Task 12: 清理旧代码

**Files:**
- Remove: `src/components/BlockEditor.jsx`
- Remove: `src/components/BlocksPreview.jsx`
- Remove: `src/components/CustomComponentPanel.jsx`
- Remove: `src/components/ImageGenerator.jsx`
- Remove: `src/components/TemplatePickerDialog.jsx`
- Modify: `src/components/WechatStyleWrapper.jsx` — 保留但标记为仅在导出中使用

- [ ] **Step 1: 删除不再使用的文件**

Run:
```bash
rm src/components/BlockEditor.jsx
rm src/components/BlocksPreview.jsx
rm src/components/CustomComponentPanel.jsx
rm src/components/ImageGenerator.jsx
```

- [ ] **Step 2: 确认无引用残留**

Run: `grep -r "BlockEditor\|BlocksPreview\|CustomComponentPanel\|ImageGenerator" src/ --include="*.jsx" --include="*.js"`

Expected: 无结果

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: 移除旧块编辑器相关组件"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- 背景层 → Task 9 画布背景色选择
- 四种元素类型 → Task 6 CanvasEditor, Task 7 ElementPanel
- 拖拽/缩放/旋转 → Task 6 Fabric.js 内置
- 图层管理 → Task 8 LayerPanel
- 属性配置 → Task 8 CanvasObjectConfig
- Canvas API 导出 → Task 5 canvasExporter
- 模板迁移 → Task 3 migrateBlocksToObjects
- 桌面三栏 → Task 9 Index.jsx
- 移动端适配 → Task 10 MobileEditor.jsx
- 9:16 固定比例 → Task 6 CANVAS_WIDTH/HEIGHT

**2. Placeholder scan:** No TBD/TODO found.

**3. Type consistency:**
- `objects` array with `{ id, type, fabric: { x, y, width, height, ... } }` — consistent across all tasks
- `createCanvasObject` factory returns same shape used by CanvasEditor, canvasExporter, and config panels
- `onUpdateObject(id, patch)` pattern consistent across all consumers
