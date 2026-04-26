# Lowdb 模板存储实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为编辑器添加用户自定义模板的持久化存储，支持保存/管理/导入/导出模板，图片以 base64 内嵌。

**Architecture:** lowdb v7 + 自定义 IndexedDB Adapter，templateStore 单例封装 CRUD 操作。UI 层在现有 TemplatePickerDialog 中新增「我的模板」Tab，编辑器顶栏新增「保存为模板」按钮。

**Tech Stack:** lowdb v7, IndexedDB API, React 18, shadcn/ui Dialog/Button/Input

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `src/lib/templateStore.js` | IndexedDB adapter + templateStore 单例，提供 CRUD / 导入导出 |
| Modify | `src/components/Templates.js` | templateCategories 新增「我的模板」分类 |
| Modify | `src/components/TemplatePickerDialog.jsx` | 新增「我的模板」Tab UI（列表、编辑、删除、导入） |
| Create | `src/components/SaveTemplateDialog.jsx` | 「保存为模板」弹窗 |
| Modify | `src/pages/Index.jsx` | 顶栏新增「保存为模板」按钮，挂载 SaveTemplateDialog |
| Modify | `src/pages/MobileEditor.jsx` | 同步支持「保存为模板」功能 |
| Modify | `src/App.jsx` | 启动时调用 templateStore.init() |

---

### Task 1: 安装 lowdb 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 lowdb**

```bash
pnpm add lowdb
```

- [ ] **Step 2: 验证安装成功**

```bash
pnpm ls lowdb
```

Expected: 显示 lowdb 版本号（v7.x）

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 添加 lowdb 依赖"
```

---

### Task 2: 创建 templateStore 数据层

**Files:**
- Create: `src/lib/templateStore.js`

- [ ] **Step 1: 创建 templateStore.js**

```js
import { Low } from 'lowdb';

// ─── IndexedDB Adapter for lowdb ────────────────────────────
class IndexedDBAdapter {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async _openDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.storeName);
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async read() {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get('data');
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async write(data) {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(data, 'data');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

const defaultData = { templates: [] };
const adapter = new IndexedDBAdapter('weixin-editor', 'templates');
const db = new Low(adapter, defaultData);

let ready = false;

const ensureReady = async () => {
  if (!ready) {
    await db.read();
    ready = true;
  }
};

const templateStore = {
  async init() {
    await ensureReady();
  },

  async getAll() {
    await ensureReady();
    return db.data.templates;
  },

  async getById(id) {
    await ensureReady();
    return db.data.templates.find((t) => t.id === id) || null;
  },

  async save(template) {
    await ensureReady();
    const idx = db.data.templates.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      db.data.templates[idx] = { ...template, updatedAt: Date.now() };
    } else {
      db.data.templates.push({
        ...template,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await db.write();
    return template;
  },

  async remove(id) {
    await ensureReady();
    db.data.templates = db.data.templates.filter((t) => t.id !== id);
    await db.write();
  },

  async exportTemplate(id) {
    const tpl = await this.getById(id);
    if (!tpl) throw new Error('模板不存在');
    const exportData = {
      version: 1,
      name: tpl.name,
      description: tpl.description,
      cover: tpl.cover,
      blocks: tpl.blocks,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${tpl.name}-template.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  },

  async importTemplate(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || data.version !== 1 || !Array.isArray(data.blocks)) {
      throw new Error('模板文件格式不正确');
    }
    const tpl = {
      id: `tpl_user_${Date.now()}`,
      name: data.name || '导入模板',
      description: data.description || '',
      category: '我的模板',
      cover: data.cover || '📄',
      blocks: data.blocks,
    };
    await this.save(tpl);
    return tpl;
  },
};

export default templateStore;
```

- [ ] **Step 2: 验证文件语法正确**

```bash
pnpm build 2>&1 | head -20
```

Expected: 构建成功或仅有其他文件的 warning，无 templateStore 相关错误

- [ ] **Step 3: Commit**

```bash
git add src/lib/templateStore.js
git commit -m "feat: 添加 templateStore 数据层（lowdb + IndexedDB adapter）"
```

---

### Task 3: 在 App.jsx 中初始化 templateStore

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 添加 init 调用**

在 `src/App.jsx` 中：

在 import 区域末尾添加：
```js
import templateStore from './lib/templateStore';
```

在 `const App` 组件函数体开头（`const queryClient` 下方，return 之前）添加：
```js
templateStore.init();
```

完整的 App.jsx 应变为：
```jsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import templateStore from './lib/templateStore';

const queryClient = new QueryClient();

const App = () => {
  templateStore.init();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Routes>
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to} element={page} />
            ))}
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: App 启动时初始化 templateStore"
```

---

### Task 4: Templates.js 新增「我的模板」分类

**Files:**
- Modify: `src/components/Templates.js`

- [ ] **Step 1: 在 templateCategories 数组中添加新分类**

找到 `src/components/Templates.js` 末尾的 `templateCategories` 数组，将：

```js
export const templateCategories = [
  { id: 'all', name: '全部模板' },
  { id: '活动推文', name: '活动推文' },
];
```

改为：

```js
export const templateCategories = [
  { id: 'all', name: '全部模板' },
  { id: '活动推文', name: '活动推文' },
  { id: 'my-templates', name: '我的模板' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Templates.js
git commit -m "feat: 模板分类新增「我的模板」"
```

---

### Task 5: 创建 SaveTemplateDialog 组件

**Files:**
- Create: `src/components/SaveTemplateDialog.jsx`

- [ ] **Step 1: 创建保存为模板弹窗组件**

```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, SmilePlus } from 'lucide-react';
import templateStore from '@/lib/templateStore';

const EMOJI_OPTIONS = ['📄', '📝', '🎨', '🏔️', '🎉', '📦', '💡', '🚀', '❤️', '🌟'];

const SaveTemplateDialog = ({ open, onClose, blocks }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('📄');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('请输入模板名称');
      return;
    }
    setSaving(true);
    try {
      await templateStore.save({
        id: `tpl_user_${Date.now()}`,
        name: trimmedName,
        description: description.trim(),
        category: '我的模板',
        cover,
        blocks: JSON.parse(JSON.stringify(blocks)),
      });
      toast.success(`模板「${trimmedName}」已保存`);
      setName('');
      setDescription('');
      setCover('📄');
      onClose();
    } catch (e) {
      toast.error('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save size={18} />
            保存为模板
          </DialogTitle>
          <DialogDescription>将当前编辑内容保存为可复用的模板</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：周末活动推文模板"
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">模板描述</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述模板用途（可选）"
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">封面图标</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setCover(emoji)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                    cover === emoji
                      ? 'bg-green-100 ring-2 ring-green-400 scale-110'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? '保存中...' : '保存模板'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateDialog;
```

- [ ] **Step 2: 验证构建**

```bash
pnpm build 2>&1 | tail -5
```

Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add src/components/SaveTemplateDialog.jsx
git commit -m "feat: 添加 SaveTemplateDialog 保存为模板弹窗"
```

---

### Task 6: Index.jsx 集成「保存为模板」按钮

**Files:**
- Modify: `src/pages/Index.jsx`

- [ ] **Step 1: 添加 import**

在 `Index.jsx` 文件顶部的 import 区域添加：

```js
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import { BookmarkPlus } from 'lucide-react';
```

在 lucide-react 的 import 行中，现有的 import 行是：
```js
  RotateCcw, Copy, PanelLeftClose, Sparkles, PanelLeft, ChevronLeft,
  Smartphone, LayoutTemplate, Eye, X, Undo2, Redo2, Save,
```

将其改为（添加 BookmarkPlus）：
```js
  RotateCcw, Copy, PanelLeftClose, Sparkles, PanelLeft, ChevronLeft,
  Smartphone, LayoutTemplate, Eye, X, Undo2, Redo2, Save, BookmarkPlus,
```

- [ ] **Step 2: 添加 state**

在 Index 组件内部，`const [showPreview, setShowPreview] = useState(false);` 之后添加：

```js
const [showSaveTemplate, setShowSaveTemplate] = useState(false);
```

- [ ] **Step 3: 在顶栏添加按钮**

找到「模板」按钮（约第 278-283 行），在它后面添加一个新按钮。找到这段代码：

```jsx
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <LayoutTemplate size={14} />
              <span className="hidden sm:inline">模板</span>
            </Button>
```

在其后添加：

```jsx
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSaveTemplate(true)}
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={blocks.length === 0}
            >
              <BookmarkPlus size={14} />
              <span className="hidden sm:inline">存为模板</span>
            </Button>
```

- [ ] **Step 4: 在 return JSX 末尾挂载 SaveTemplateDialog**

找到 `<TemplatePickerDialog` 组件（约第 435-439 行），在其后面添加：

```jsx
      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        blocks={blocks}
      />
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Index.jsx
git commit -m "feat: 桌面端编辑器集成「保存为模板」按钮"
```

---

### Task 7: 改造 TemplatePickerDialog 支持用户模板管理

**Files:**
- Modify: `src/components/TemplatePickerDialog.jsx`

这是最大的改动。需要：
1. 当 `activeCategory === 'my-templates'` 时，从 templateStore 加载用户模板
2. 用户模板卡片增加编辑/删除/导出按钮
3. 添加「导入模板」按钮

- [ ] **Step 1: 替换整个 TemplatePickerDialog.jsx**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { templates, templateCategories } from './Templates';
import { LayoutTemplate, CheckCircle2, Pencil, Trash2, Download, Upload, SmilePlus } from 'lucide-react';
import { toast } from 'sonner';
import templateStore from '@/lib/templateStore';

const EMOJI_OPTIONS = ['📄', '📝', '🎨', '🏔️', '🎉', '📦', '💡', '🚀', '❤️', '🌟'];

/**
 * 模板选择弹窗
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onApply: (blocks: Block[]) => void
 */
const TemplatePickerDialog = ({ open, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [userTemplates, setUserTemplates] = useState([]);
  const [editingTpl, setEditingTpl] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCover, setEditCover] = useState('📄');

  const loadUserTemplates = useCallback(async () => {
    try {
      const list = await templateStore.getAll();
      setUserTemplates(list);
    } catch {
      toast.error('加载模板失败');
    }
  }, []);

  useEffect(() => {
    if (open && activeCategory === 'my-templates') {
      loadUserTemplates();
    }
  }, [open, activeCategory, loadUserTemplates]);

  const filtered =
    activeCategory === 'all'
      ? templates
      : activeCategory === 'my-templates'
        ? []
        : templates.filter((t) => t.category === activeCategory);

  const handleApply = (tpl) => {
    let counter = Date.now();
    const freshBlocks = tpl.blocks.map((b) => ({
      ...b,
      id: `block_${counter++}_tpl`,
      props: b.props ? { ...b.props } : undefined,
    }));
    onApply(freshBlocks);
    onClose();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该模板？')) return;
    await templateStore.remove(id);
    toast.success('模板已删除');
    loadUserTemplates();
  };

  const handleExport = async (id) => {
    try {
      await templateStore.exportTemplate(id);
      toast.success('模板已导出');
    } catch {
      toast.error('导出失败');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await templateStore.importTemplate(text);
        toast.success('模板导入成功');
        loadUserTemplates();
      } catch (err) {
        toast.error(err.message || '导入失败');
      }
    };
    input.click();
  };

  const startEdit = (tpl) => {
    setEditingTpl(tpl.id);
    setEditName(tpl.name);
    setEditDesc(tpl.description);
    setEditCover(tpl.cover);
  };

  const saveEdit = async () => {
    const tpl = userTemplates.find((t) => t.id === editingTpl);
    if (!tpl) return;
    await templateStore.save({
      ...tpl,
      name: editName.trim() || tpl.name,
      description: editDesc.trim(),
      cover: editCover,
    });
    setEditingTpl(null);
    toast.success('模板已更新');
    loadUserTemplates();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl">
        {/* 头部 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <LayoutTemplate size={20} className="text-green-600" />
            选择模板
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            选择一个模板快速开始创作，模板内容将替换当前编辑器中的所有内容
          </DialogDescription>
        </DialogHeader>

        {/* 分类 Tab */}
        <div className="flex gap-2 px-6 pt-4 pb-2">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {/* 我的模板 - 特殊渲染 */}
          {activeCategory === 'my-templates' ? (
            <>
              <div className="flex items-center justify-between mt-2 mb-3">
                <span className="text-sm text-gray-500">
                  共 {userTemplates.length} 个模板
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImport}
                  className="flex items-center gap-1"
                >
                  <Upload size={14} />
                  导入模板
                </Button>
              </div>

              {editingTpl && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4 mb-3">
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="模板名称"
                    />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="模板描述（可选）"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setEditCover(emoji)}
                          className={`w-8 h-8 rounded text-lg flex items-center justify-center ${
                            editCover === emoji
                              ? 'bg-blue-100 ring-2 ring-blue-400'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingTpl(null)}>
                        取消
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {userTemplates.length === 0 && !editingTpl ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>还没有保存过模板</p>
                  <p className="mt-1">在编辑器中点击「存为模板」来保存当前内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {userTemplates.map((tpl) => {
                    const isHovered = hoveredId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onMouseEnter={() => setHoveredId(tpl.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          isHovered
                            ? 'border-green-400 shadow-md bg-green-50/40'
                            : 'border-gray-200 hover:border-green-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                            {tpl.cover}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-800 text-base">{tpl.name}</h3>
                              <span className="text-xs text-gray-400">
                                共 {tpl.blocks.length} 个块
                              </span>
                              {tpl.updatedAt && (
                                <span className="text-xs text-gray-300">
                                  {new Date(tpl.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {tpl.description && (
                              <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                {tpl.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getBlockSummary(tpl.blocks).map((item, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleApply(tpl)}
                              className={`transition-all ${
                                isHovered
                                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-500 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 size={14} className="mr-1" />
                              使用
                            </Button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEdit(tpl)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                                title="编辑"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleExport(tpl.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-500 transition-colors"
                                title="导出"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(tpl.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                                title="删除"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* 内置模板列表（保持原有逻辑） */
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">暂无模板</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {filtered.map((tpl) => {
                    const isHovered = hoveredId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onMouseEnter={() => setHoveredId(tpl.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          isHovered
                            ? 'border-green-400 shadow-md bg-green-50/40'
                            : 'border-gray-200 hover:border-green-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                            {tpl.cover}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-800 text-base">{tpl.name}</h3>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700 border-0"
                              >
                                {tpl.category}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                共 {tpl.blocks.length} 个块
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                              {tpl.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getBlockSummary(tpl.blocks).map((item, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleApply(tpl)}
                              className={`transition-all ${
                                isHovered
                                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-500 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 size={14} className="mr-1" />
                              使用模板
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getBlockSummary(blocks) {
  const counts = {};
  const nameMap = {
    'chapter-title': '篇章标题',
    'body-text': '正文',
    'image-block': '图片',
    markdown: 'Markdown',
    'image-text-card': '图文卡片',
    'info-card': '信息卡片',
    'checklist': '清单',
    'quote-block': '引用',
    'tip-box': '提示框',
    'stats-bar': '数据指标',
    'divider': '分隔线',
  };
  blocks.forEach((b) => {
    const key = b.type === 'custom' ? b.componentId : b.type;
    const label = nameMap[key] || key;
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.entries(counts).map(([label, count]) => `${label} x${count}`);
}

export default TemplatePickerDialog;
```

- [ ] **Step 2: 验证构建**

```bash
pnpm build 2>&1 | tail -5
```

Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add src/components/TemplatePickerDialog.jsx
git commit -m "feat: TemplatePickerDialog 支持用户模板管理（编辑/删除/导入/导出）"
```

---

### Task 8: MobileEditor.jsx 集成「保存为模板」

**Files:**
- Modify: `src/pages/MobileEditor.jsx`

- [ ] **Step 1: 添加 import**

在 `MobileEditor.jsx` 顶部 import 区域添加：

```js
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
```

在 lucide-react import 中，现有行是：
```js
  LayoutTemplate, Eye, Plus, Settings2, X, ChevronLeft,
  Trash2, ChevronUp, ChevronDown, Download, Image as ImageIcon,
  Type, AlignLeft, Grid, ChevronDown as ChevronDownIcon, Scissors,
```

添加 `BookmarkPlus`：
```js
  LayoutTemplate, Eye, Plus, Settings2, X, ChevronLeft,
  Trash2, ChevronUp, ChevronDown, Download, Image as ImageIcon,
  Type, AlignLeft, Grid, ChevronDown as ChevronDownIcon, Scissors, BookmarkPlus,
```

- [ ] **Step 2: 添加 state**

在 MobileEditor 组件内部，`const [showSliceDialog, setShowSliceDialog] = useState(false);` 之后添加：

```js
const [showSaveTemplate, setShowSaveTemplate] = useState(false);
```

- [ ] **Step 3: 在顶部导航栏添加按钮**

找到清空按钮前（约第 169 行），添加保存模板按钮。找到：

```jsx
          {blocks.length > 0 && (
```

在其前面（`tab === 'preview'` 的 `</>` 结束后）添加：

```jsx
          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-blue-600 border-blue-200"
            onClick={() => setShowSaveTemplate(true)} disabled={blocks.length === 0}>
            <BookmarkPlus size={13} className="mr-1" /> 存为模板
          </Button>
```

- [ ] **Step 4: 在组件 return 末尾挂载 SaveTemplateDialog**

在 `MobileEditor` 组件 return 的 JSX 末尾（最后一个 `</>` 闭合标签之前，即分段导出弹窗的 `</>` 之后），添加：

```jsx
      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        blocks={blocks}
      />
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/MobileEditor.jsx
git commit -m "feat: 移动端编辑器集成「保存为模板」功能"
```

---

### Task 9: 手动集成测试

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 测试「保存为模板」流程**
1. 在编辑器中添加几个组件（标题、正文等）
2. 点击「存为模板」按钮
3. 输入模板名称和描述，选择封面 emoji，点击保存
4. 验证 toast 提示保存成功

- [ ] **Step 3: 测试「我的模板」Tab**
1. 点击「模板」按钮打开弹窗
2. 切换到「我的模板」Tab
3. 验证刚保存的模板显示正确
4. 点击「使用」验证模板加载正确

- [ ] **Step 4: 测试编辑模板**
1. 在「我的模板」中点击编辑图标
2. 修改名称/描述/封面
3. 保存后验证信息已更新

- [ ] **Step 5: 测试导出和导入**
1. 点击导出图标，验证 JSON 文件下载
2. 删除该模板
3. 点击「导入模板」，选择刚才下载的 JSON 文件
4. 验证模板恢复成功

- [ ] **Step 6: 测试删除模板**
1. 点击删除图标
2. 确认弹窗点击确定
3. 验证模板已从列表移除

- [ ] **Step 7: 测试移动端**
1. 访问 `/#/mobile`
2. 添加组件后点击「存为模板」
3. 验证移动端保存模板功能正常

- [ ] **Step 8: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix: 集成测试后的修复"
```
