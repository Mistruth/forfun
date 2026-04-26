import React, { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { customComponents, componentCategories } from '@/components/CustomComponentDefinitions';
import BlockEditor from '@/components/BlockEditor';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import BlocksPreview from '@/components/BlocksPreview';
import ComponentConfigDrawer from '@/components/ComponentConfigDrawer';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import {
  LayoutTemplate, Eye, Plus, Settings2, X, ChevronLeft,
  Trash2, ChevronUp, ChevronDown, Download, Image as ImageIcon,
  Type, AlignLeft, Grid, ChevronDown as ChevronDownIcon, Scissors, BookmarkPlus,
} from 'lucide-react';

// ── id 生成 ──────────────────────────────────────────────────
let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;

// ── icon 映射 ────────────────────────────────────────────────
const iconMap = { Grid, Type, AlignLeft, Image: ImageIcon };

// ── 主页面 ───────────────────────────────────────────────────
const MobileEditor = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  // tab: 'edit' | 'preview' | 'components'
  const [tab, setTab] = useState('edit');
  const [showComponentSheet, setShowComponentSheet] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sliceHeight, setSliceHeight] = useState(2000);
  const [showSliceDialog, setShowSliceDialog] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const previewRef = useRef(null);

  // 当前选中的自定义块（用于配置抽屉）
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId && b.type === 'custom') || null,
    [blocks, selectedBlockId]
  );

  // 插入组件（若有选中块则插入到其下方，否则追加到末尾）
  const handleInsertComponent = useCallback((componentId, defaultProps) => {
    const newBlock = { id: genId(), type: 'custom', componentId, props: { ...defaultProps } };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === selectedBlockId);
      if (idx !== -1) {
        const next = [...prev];
        next.splice(idx + 1, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    setShowComponentSheet(false);
    toast.success(`已插入「${customComponents.find(c => c.id === componentId)?.name || '组件'}」`);
  }, [selectedBlockId]);

  // 插入 Markdown 文本块
  const handleInsertMarkdown = useCallback(() => {
    const newBlock = { id: genId(), type: 'markdown', content: '' };
    setBlocks(prev => [...prev, newBlock]);
    setShowComponentSheet(false);
    setTab('edit');
    toast.success('已插入文本块');
  }, []);

  // 更新 props
  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: newProps } : b));
  }, []);

  // 选中块
  const handleSelectBlock = useCallback((blockId) => {
    setSelectedBlockId(prev => prev === blockId ? null : blockId);
  }, []);

  // 导出图片
  const handleExport = async (format = 'png') => {
    const el = document.querySelector('.mobile-preview-export');
    if (!el) { toast.error('预览区未准备好'); return; }
    try {
      const opts = { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' };
      const dataUrl = format === 'png' ? await toPng(el, opts) : await toJpeg(el, { ...opts, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `article.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success('图片导出成功！');
    } catch (e) {
      toast.error('导出失败，请重试');
    }
  };

  // 分段导出图片
  const handleSliceExport = async (format = 'png') => {
    const el = document.querySelector('.mobile-preview-export');
    if (!el) { toast.error('预览区未准备好'); return; }
    try {
      const opts = { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' };
      const blob = await toBlob(el, {
        ...opts,
        type: format === 'png' ? 'image/png' : 'image/jpeg',
        ...(format === 'jpg' ? { quality: 0.95 } : {}),
      });
      const url = URL.createObjectURL(blob);
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = () => { URL.revokeObjectURL(url); resolve(); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      });
      const { width, height } = img;
      const pixelSlice = sliceHeight * 2;
      const sliceCount = Math.ceil(height / pixelSlice);
      for (let i = 0; i < sliceCount; i++) {
        const startY = i * pixelSlice;
        const h = Math.min(pixelSlice, height - startY);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, startY, width, h, 0, 0, width, h);
        const ext = format === 'png' ? 'png' : 'jpg';
        const quality = format === 'png' ? undefined : 0.95;
        const segDataUrl = quality ? canvas.toDataURL(`image/${ext}`, quality) : canvas.toDataURL(`image/${ext}`);
        const link = document.createElement('a');
        link.download = `article_${i + 1}.${ext}`;
        link.href = segDataUrl;
        link.click();
      }
      toast.success(`已切成 ${sliceCount} 段并导出！`);
      setShowSliceDialog(false);
    } catch (e) {
      console.error('分段导出失败:', e);
      toast.error('分段导出失败，请重试');
    }
  };

  // 过滤组件
  const filteredComponents = customComponents.filter(c =>
    activeCategory === 'all' || c.category === activeCategory
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── 顶部导航栏 ── */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-gray-800 text-sm">移动端编辑器</span>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'preview' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleExport('png')}>
                <ImageIcon size={13} className="mr-1" /> PNG
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleExport('jpg')}>
                <Download size={13} className="mr-1" /> JPG
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setShowSliceDialog(true)}>
                <Scissors size={13} className="mr-1" /> 分段
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-blue-600 border-blue-200"
            onClick={() => setShowSaveTemplate(true)} disabled={blocks.length === 0}>
            <BookmarkPlus size={13} className="mr-1" /> 存为模板
          </Button>
          {blocks.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 px-2"
              onClick={() => { setBlocks([]); setSelectedBlockId(null); toast.success('已清空'); }}>
              清空
            </Button>
          )}
        </div>
      </div>

      {/* ── 主内容区 ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* 编辑 Tab */}
        {tab === 'edit' && (
          <div className="h-full overflow-auto">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 px-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <LayoutTemplate size={28} className="text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">编辑器为空</p>
                  <p className="text-xs text-gray-400 mt-1">点击下方「+」按钮添加组件</p>
                </div>
                <Button
                  className="mt-2 rounded-full px-6"
                  onClick={() => setShowComponentSheet(true)}
                >
                  <Plus size={16} className="mr-1" /> 添加组件
                </Button>
              </div>
            ) : (
              <BlockEditor
                blocks={blocks}
                onChange={setBlocks}
                onSelectBlock={handleSelectBlock}
                selectedBlockId={selectedBlockId}
              />
            )}
          </div>
        )}

        {/* 预览 Tab */}
        {tab === 'preview' && (
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mobile-preview-export overflow-hidden">
                <div className="p-4">
                  <WechatStyleWrapper>
                    <BlocksPreview blocks={blocks} />
                  </WechatStyleWrapper>
                  {blocks.length === 0 && (
                    <div className="py-12 text-center text-gray-300 text-sm">暂无内容</div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* ── 底部 Tab 导航 ── */}
      <div className="flex-shrink-0 bg-white border-t shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              tab === 'edit' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <LayoutTemplate size={20} />
            <span className="text-xs">编辑</span>
          </button>

          {/* 中间大按钮 */}
          <div className="px-4">
            <button
              onClick={() => setShowComponentSheet(true)}
              className="w-14 h-14 -mt-5 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all"
            >
              <Plus size={26} />
            </button>
          </div>

          <button
            onClick={() => setTab('preview')}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              tab === 'preview' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Eye size={20} />
            <span className="text-xs">预览</span>
          </button>
        </div>
      </div>

      {/* ── 组件选择底部弹出层 ── */}
      {showComponentSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowComponentSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up">
            {/* 弹层头部 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-bold text-gray-800">选择组件</h3>
              <button
                onClick={() => setShowComponentSheet(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={15} />
              </button>
            </div>

            {/* 分类 Tab */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {/* 文本块特殊入口 */}
              <button
                onClick={handleInsertMarkdown}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all"
              >
                + 文本块
              </button>
              {componentCategories.map(cat => {
                const Icon = iconMap[cat.icon] || Grid;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      activeCategory === cat.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={11} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* 组件列表 */}
            <div className="px-4 pb-6 grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {filteredComponents.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => handleInsertComponent(comp.id, comp.defaultProps)}
                  className="text-left p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition-all"
                >
                  <div className="font-medium text-sm text-gray-800">{comp.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{comp.preview}</div>
                  <span className="inline-block mt-1.5 text-xs bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                    {comp.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── 配置抽屉（复用现有组件） ── */}
      {selectedBlock && (
        <ComponentConfigDrawer
          block={selectedBlock}
          onUpdate={handleUpdateBlockProps}
          onClose={() => setSelectedBlockId(null)}
        />
      )}

      {/* ── 分段导出弹窗 ── */}
      {showSliceDialog && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSliceDialog(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Scissors size={16} /> 分段导出
              </h3>
              <button onClick={() => setShowSliceDialog(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <X size={15} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">每段高度（px）</label>
                <input
                  type="number"
                  min={500}
                  max={20000}
                  step={100}
                  value={sliceHeight}
                  onChange={(e) => setSliceHeight(Math.max(500, Number(e.target.value) || 2000))}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full" onClick={() => handleSliceExport('png')}>
                  <ImageIcon size={14} className="mr-1" /> 分段 PNG
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleSliceExport('jpg')}>
                  <Download size={14} className="mr-1" /> 分段 JPG
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        blocks={blocks}
      />
    </div>
  );
};

export default MobileEditor;
