import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import LinkExtension from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2, Settings2, Bold, Italic, Underline, Upload, ImageIcon, Link as LinkIcon, ChevronDown, Highlighter, RemoveFormatting } from 'lucide-react';
import { customComponents, FONT_FAMILY_OPTIONS } from './CustomComponentDefinitions';
import { getImageObjectUrl, isImageRef, saveImageFile } from '@/lib/imageStore';
import { toast } from 'sonner';

/**
 * 右侧抽屉配置面板
 * block: 当前选中的自定义组件块
 * onUpdate: (blockId, newProps) => void
 * onClose: () => void
 */
const ComponentConfigDrawer = ({ block, onUpdate, onClose }) => {
  const compDef = block ? customComponents.find(c => c.id === block.componentId) : null;
  const [localProps, setLocalProps] = useState({});

  useEffect(() => {
    if (block && compDef) {
      const props = { ...compDef.defaultProps, ...(block.props || {}) };
      setLocalProps(props);
    }
  }, [block?.id]);

  const handleChange = (key, value) => {
    const newProps = { ...localProps, [key]: value };
    setLocalProps(newProps);
    onUpdate(block.id, newProps);
  };

  if (!block || !compDef) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />

      {/* 抽屉主体 */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slide-in-right">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-blue-600" />
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{compDef.name}</h3>
              <p className="text-xs text-gray-500">实时配置，即时生效</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/60" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* 配置表单 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {compDef.configFields.map(field => {
            // showWhen 条件控制显隐
            if (field.showWhen) {
              const condVal = localProps[field.showWhen.key];
              if (condVal !== field.showWhen.value) return null;
            }
            return (
              <FieldRenderer
                key={field.key}
                field={field}
                value={localProps[field.key]}
                onChange={(val) => handleChange(field.key, val)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

// ─── 字段渲染器 ────────────────────────────────────────────────

const FieldRenderer = ({ field, value, onChange }) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">{field.label}</Label>

      {field.type === 'text' && (
        <Input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-8 text-sm"
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="text-sm resize-none min-h-[80px]"
        />
      )}

      {field.type === 'color' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={rgbaToHex(value || '#58bb90')}
            onChange={e => onChange(e.target.value)}
            className="h-8 w-12 rounded border cursor-pointer"
          />
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="rgba(88,187,144,1) 或 #58bb90"
            className="h-8 text-sm flex-1"
          />
        </div>
      )}

      {field.type === 'colorSelect' && (
        <div className="flex gap-2">
          {field.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-1.5 text-xs rounded-lg border-2 transition-all font-medium ${
                value === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: colorDotMap[opt.value] }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.type === 'stepper' && (
        <StepperField
          value={value}
          min={field.min}
          max={field.max}
          step={field.step}
          decimals={field.decimals}
          onChange={onChange}
        />
      )}

      {field.type === 'toggle' && (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}

      {field.type === 'select' && (
        <SelectField value={value} options={field.options} onChange={onChange} />
      )}

      {field.type === 'fontSelect' && (
        <FontSelectField value={value} onChange={onChange} />
      )}

      {field.type === 'imageUpload' && (
        <ImageUploadField value={value || ''} onChange={onChange} />
      )}

      {field.type === 'richText' && (
        <RichTextEditor value={value || ''} onChange={onChange} />
      )}

      {field.type === 'listEditor' && (
        <ListEditor value={value || []} onChange={onChange} />
      )}

      {field.type === 'statsEditor' && (
        <StatsEditor value={value || []} onChange={onChange} />
      )}
    </div>
  );
};

// ─── 通用下拉选择器 ────────────────────────────────────────────────

const SelectField = ({ value, options = [], onChange }) => {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full h-8 text-sm rounded-lg border border-gray-200 bg-white px-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
};

// ─── 字体选择器 ────────────────────────────────────────────────

const FontSelectField = ({ value, onChange }) => {
  const current = FONT_FAMILY_OPTIONS.find(f => f.value === value) || FONT_FAMILY_OPTIONS[0];
  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={value || FONT_FAMILY_OPTIONS[0].value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-8 text-sm rounded-lg border border-gray-200 bg-white px-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
        >
          {FONT_FAMILY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {/* 字体预览 */}
      <div
        className="text-sm px-3 py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-600 leading-relaxed"
        style={{ fontFamily: current.value }}
      >
        山野没有信号，但有更好的连接 ✨
      </div>
    </div>
  );
};

// ─── 图片上传字段 ────────────────────────────────────────────────

const ImageUploadField = ({ value, onChange }) => {
  const [tab, setTab] = React.useState(value && value.startsWith('http') ? 'url' : 'upload');
  const [urlInput, setUrlInput] = React.useState(value && value.startsWith('http') ? value : '');
  const [localPreview, setLocalPreview] = React.useState('');
  const fileInputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // value 外部变化时同步（如切换 block 时）
  React.useEffect(() => {
    let cancelled = false;

    if (isImageRef(value)) {
      setTab('upload');
      getImageObjectUrl(value).then((url) => {
        if (!cancelled) setLocalPreview(url);
      });
    } else if (value && (value.startsWith('data:') || value.startsWith('blob:'))) {
      setLocalPreview(value);
      setTab('upload');
    } else if (value && value.startsWith('http')) {
      setUrlInput(value);
      setTab('url');
      setLocalPreview('');
    } else {
      setLocalPreview('');
    }

    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setUploading(true);

    try {
      const imageRef = await saveImageFile(file);
      onChange(imageRef);
    } catch (e) {
      console.error('图片保存失败:', e);
      toast.error('图片保存失败，请重试');
      URL.revokeObjectURL(previewUrl);
      setLocalPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const hasPreview = !!localPreview;
  const isUrl = value && value.startsWith('http');

  return (
    <div className="space-y-2">
      {/* Tab 切换 */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
        <button
          onClick={() => setTab('upload')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
            tab === 'upload' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Upload size={11} />
          本地上传
        </button>
        <button
          onClick={() => setTab('url')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
            tab === 'url' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <LinkIcon size={11} />
          图片链接
        </button>
      </div>

      {/* 本地上传区域 */}
      {tab === 'upload' && (
        <div
          className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {hasPreview ? (
            <div className="relative">
              <img
                src={localPreview}
                alt="已上传"
                className="w-full rounded-xl object-cover max-h-40"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 rounded-xl transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg">
                  {uploading ? '保存中...' : '点击更换图片'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center gap-2 text-gray-400">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon size={20} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">点击或拖拽上传图片</p>
                <p className="text-xs text-gray-400 mt-0.5">支持 JPG、PNG、GIF、WebP</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onClick={e => e.stopPropagation()}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* URL 输入 */}
      {tab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              className="h-8 px-3 text-xs shrink-0"
              onClick={() => { if (urlInput) onChange(urlInput); }}
            >
              确认
            </Button>
          </div>
          {isUrl && (
            <img
              src={value}
              alt="预览"
              className="w-full rounded-xl object-cover max-h-32 border"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      )}

      {/* 清除按钮 */}
      {value && (
        <button
          onClick={() => { onChange(''); setUrlInput(''); setLocalPreview(''); }}
          className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
        >
          清除图片
        </button>
      )}
    </div>
  );
};

// ─── 步进器组件 ────────────────────────────────────────────────

const StepperField = ({ value, min, max, step, decimals, onChange }) => {
  const numVal = parseFloat(value) || min;
  const dec = decimals || 0;

  const clamp = (v) => Math.min(max, Math.max(min, parseFloat(v.toFixed(dec + 2))));

  const decrease = () => onChange(String(clamp(numVal - step).toFixed(dec)));
  const increase = () => onChange(String(clamp(numVal + step).toFixed(dec)));

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={decrease}
        disabled={numVal <= min}
        className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center text-lg font-medium transition-all"
      >
        −
      </button>
      <Input
        value={value || String(min)}
        onChange={e => onChange(e.target.value)}
        className="h-8 text-sm text-center flex-1"
      />
      <button
        onClick={increase}
        disabled={numVal >= max}
        className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center text-lg font-medium transition-all"
      >
        +
      </button>
    </div>
  );
};

// ─── Tiptap 富文本编辑器 ────────────────────────────────────────

const DEFAULT_RICH_TEXT = '这是一段适合移动端阅读的正文。您可以直接选中文字设置<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、高亮和链接。';

const HIGHLIGHT_PRESETS = [
  { label: '绿', color: '#dff4ea' },
  { label: '黄', color: '#fff3bf' },
  { label: '蓝', color: '#dbeafe' },
  { label: '红', color: '#fee2e2' },
];

const toolbarButtonClass = (active = false) => `h-8 w-8 rounded-md border flex items-center justify-center transition-all ${
  active
    ? 'border-gray-800 bg-gray-800 text-white'
    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
}`;

const RichTextToolbarButton = ({ active, title, onClick, children }) => (
  <button
    type="button"
    className={toolbarButtonClass(active)}
    title={title}
    onClick={onClick}
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Highlight.configure({ multicolor: true }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value || DEFAULT_RICH_TEXT,
    editorProps: {
      attributes: {
        class: 'min-h-[180px] px-3 py-2 text-sm leading-relaxed text-gray-700 outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const nextValue = value || DEFAULT_RICH_TEXT;
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('请输入链接地址', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap rounded-lg border border-gray-200 bg-gray-50 p-2">
        <RichTextToolbarButton active={editor.isActive('bold')} title="加粗" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </RichTextToolbarButton>
        <RichTextToolbarButton active={editor.isActive('italic')} title="斜体" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </RichTextToolbarButton>
        <RichTextToolbarButton active={editor.isActive('underline')} title="下划线" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={14} />
        </RichTextToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <RichTextToolbarButton active={editor.isActive('highlight')} title="高亮" onClick={() => editor.chain().focus().toggleHighlight({ color: '#dff4ea' }).run()}>
          <Highlighter size={14} />
        </RichTextToolbarButton>
        {HIGHLIGHT_PRESETS.map(preset => (
          <button
            key={preset.label}
            type="button"
            className="h-8 w-8 rounded-md border border-gray-200 text-xs font-bold text-gray-700 transition-all hover:border-gray-400"
            style={{ background: preset.color }}
            title={`${preset.label}色高亮`}
            onClick={() => editor.chain().focus().setHighlight({ color: preset.color }).run()}
          >
            {preset.label}
          </button>
        ))}
        <input
          type="color"
          className="h-8 w-8 rounded-md border border-gray-200 bg-white p-1 cursor-pointer"
          title="自定义高亮色"
          onChange={(event) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
        />
        <RichTextToolbarButton active={editor.isActive('link')} title="插入链接" onClick={setLink}>
          <LinkIcon size={14} />
        </RichTextToolbarButton>
        <RichTextToolbarButton title="清除格式" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting size={14} />
        </RichTextToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="rounded-xl border border-gray-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror]:whitespace-pre-wrap"
      />

      <p className="text-xs text-gray-400">基于 Tiptap 开源编辑器，预览和导出会保留富文本样式</p>
    </div>
  );
};

// ─── 列表编辑器 ────────────────────────────────────────────────

const ListEditor = ({ value, onChange }) => {
  const items = value && value.length > 0 ? value : [''];

  const update = (idx, text) => {
    const next = items.map((item, i) => i === idx ? text : item);
    onChange(next);
  };

  const add = () => onChange([...items, '']);

  const remove = (idx) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
          <Input
            value={item}
            onChange={e => update(idx, e.target.value)}
            placeholder={`列表项 ${idx + 1}`}
            className="h-8 text-sm flex-1"
          />
          <button
            onClick={() => remove(idx)}
            disabled={items.length === 1}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-30 flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={add}>
        <Plus size={12} className="mr-1" />
        添加项目
      </Button>
    </div>
  );
};

// ─── 数据指标编辑器 ────────────────────────────────────────────────

const StatsEditor = ({ value, onChange }) => {
  const items = value && value.length > 0 ? value : [{ value: '', label: '' }];

  const update = (idx, patch) => {
    const next = items.map((item, i) => i === idx ? { ...item, ...patch } : item);
    onChange(next);
  };

  const add = () => onChange([...items, { value: '', label: '' }]);

  const remove = (idx) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-2 space-y-1.5 border border-gray-100">
          <div className="flex items-center gap-2">
            <Input
              value={item.value}
              onChange={e => update(idx, { value: e.target.value })}
              placeholder="数值（如 15km）"
              className="h-7 text-sm flex-1"
            />
            <button
              onClick={() => remove(idx)}
              disabled={items.length === 1}
              className="h-6 w-6 rounded flex items-center justify-center text-gray-300 hover:text-red-400 transition-all disabled:opacity-30 flex-shrink-0"
            >
              <Trash2 size={11} />
            </button>
          </div>
          <Input
            value={item.label}
            onChange={e => update(idx, { label: e.target.value })}
            placeholder="标签（如 距离）"
            className="h-7 text-sm"
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashed" onClick={add}>
        <Plus size={12} className="mr-1" />
        添加数据项
      </Button>
    </div>
  );
};

// ─── 工具函数 ────────────────────────────────────────────────

const colorDotMap = {
  green: 'rgba(124,248,203,0.8)',
  yellow: 'rgba(255,193,7,0.8)',
  purple: 'rgba(99,102,241,0.6)',
};

function rgbaToHex(rgba) {
  if (!rgba) return '#ffffff';
  if (rgba.startsWith('#')) return rgba;
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ffffff';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// ─── 内联配置面板（用于桌面端编辑器和预览区之间） ──────────────

export const ComponentConfigPanel = ({ block, onUpdate, onClose }) => {
  const compDef = block ? customComponents.find(c => c.id === block.componentId) : null;
  const [localProps, setLocalProps] = useState({});

  useEffect(() => {
    if (block && compDef) {
      setLocalProps({ ...compDef.defaultProps, ...(block.props || {}) });
    }
  }, [block?.id]);

  const handleChange = (key, value) => {
    const newProps = { ...localProps, [key]: value };
    setLocalProps(newProps);
    onUpdate(block.id, newProps);
  };

  if (!block || !compDef) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-blue-600" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{compDef.name}</h3>
            <p className="text-xs text-gray-500">实时配置，即时生效</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/60" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {compDef.configFields.map(field => {
          if (field.showWhen) {
            const condVal = localProps[field.showWhen.key];
            if (condVal !== field.showWhen.value) return null;
          }
          return (
            <FieldRenderer
              key={field.key}
              field={field}
              value={localProps[field.key]}
              onChange={(val) => handleChange(field.key, val)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ComponentConfigDrawer;
