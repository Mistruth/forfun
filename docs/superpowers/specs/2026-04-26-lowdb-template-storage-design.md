# Lowdb 模板存储设计

## 概述

为公众号长图编辑器添加用户自定义模板的持久化存储功能。用户可以将当前编辑内容保存为模板、管理本地模板库、导入导出模板 JSON 文件。使用 lowdb + IndexedDB 方案，图片以 base64 内嵌。

## 技术方案

- **依赖**：`lowdb` + 自写 `IndexedDBAdapter`
- **存储后端**：IndexedDB（数据库名 `weixin-editor`，store 名 `templates`）
- **数据格式**：JSON，blocks 中的图片 URL（含 base64）原样保留

## 数据层

### 新增文件：`src/lib/templateStore.js`

`IndexedDBAdapter` 实现：
- 打开 `weixin-editor` 数据库，version 1
- 创建 object store `templates`，key path 为 `'key'`
- 单条记录：`{ key: 'templates', value: [] }`，value 为模板数组

`templateStore` 单例方法：

| 方法 | 说明 |
|------|------|
| `init()` | 初始化 DB 连接，创建默认数据 |
| `getAll()` | 获取所有用户模板 |
| `getById(id)` | 按 ID 获取 |
| `save(template)` | 新增或更新模板（按 id 判断） |
| `remove(id)` | 删除模板 |
| `exportTemplate(id)` | 导出为 JSON 文件下载 |
| `importTemplate(jsonString)` | 从 JSON 字符串导入 |

### 模板数据模型

```jsonc
{
  "id": "tpl_user_<timestamp>",
  "name": "我的模板名",
  "description": "模板描述",
  "category": "我的模板",
  "cover": "📄",
  "blocks": [ /* 标准 blocks 数组 */ ],
  "createdAt": 1714000000000,
  "updatedAt": 1714000000000
}
```

## UI 变更

### 修改文件

- `src/components/Templates.js`：`templateCategories` 新增 `{ id: 'my-templates', name: '我的模板' }`
- `src/components/TemplatePickerDialog.jsx`：扩展「我的模板」Tab 的交互

### 分类 Tab 扩展

在 `templateCategories` 新增 `{ id: 'my-templates', name: '我的模板' }`，该 Tab 显示用户存储的模板。

### 「我的模板」Tab 卡片

每个用户模板卡片右侧增加：
- **编辑**按钮（笔图标）：弹窗修改模板名/描述/封面 emoji
- **删除**按钮（垃圾桶图标）：确认后删除

Tab 空白区域显示「导入模板」按钮，选择 `.json` 文件导入。

### 保存为模板入口

在编辑器顶栏新增「保存为模板」按钮，点击后弹窗：
- 模板名称（必填）
- 模板描述（可选）
- 封面 emoji（可选，默认 📄）

确认后将当前 `blocks` 深拷贝存入 IndexedDB。

## 导入导出

### 导出格式

文件名：`模板名-template.json`

```jsonc
{
  "version": 1,
  "name": "我的模板名",
  "description": "模板描述",
  "cover": "📄",
  "blocks": [ /* blocks 数组 */ ]
}
```

不导出 `id` 和时间戳，导入时重新生成。

### 导入流程

1. 用户点击「导入模板」→ 文件选择器（仅 `.json`）
2. 读取文件，校验 `version` 和 `blocks` 结构
3. 校验通过：生成 id 和时间戳，存入 IndexedDB，刷新列表
4. 校验失败：toast 提示「模板文件格式不正确」

## 边界处理

- **图片大小**：不限制（IndexedDB 容量充足），base64 方案的已知代价
- **模板名重复**：允许，不做唯一性校验
- **初始化时机**：`templateStore.init()` 在 `App.jsx` 启动时调用一次
- **内置模板**：`Templates.js` 硬编码模板不受影响，用户模板存 IndexedDB，UI 层按分类 Tab 分别展示
