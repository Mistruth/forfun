import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customComponents, componentCategories } from '@/components/CustomComponentDefinitions';
import BlockEditor from '@/components/BlockEditor';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import ConfirmActionDialog from '@/components/ConfirmActionDialog';
import { getExportPixelRatio, getFontEmbedCSS } from '@/components/ImageGenerator';
import BlocksPreview from '@/components/BlocksPreview';
import ComponentConfigDrawer from '@/components/ComponentConfigDrawer';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import {
  downloadImageSlices,
  getExportElementHeight,
  getNonBreakingSliceRanges,
} from '@/lib/exportSlices';
import {
  LayoutTemplate, Eye, Plus, Settings2, X, ChevronLeft,
  Trash2, ChevronUp, ChevronDown, Download, Image as ImageIcon,
  Type, AlignLeft, Grid, ChevronDown as ChevronDownIcon, Scissors, BookmarkPlus,
  MoreHorizontal, RefreshCw,
} from 'lucide-react';
import { loadDraft, saveDraft } from '@/lib/draftStore';
import templateStore from '@/lib/templateStore';

// ── id 生成 ──────────────────────────────────────────────────
let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;

// ── icon 映射 ────────────────────────────────────────────────
const iconMap = { Grid, Type, AlignLeft, Image: ImageIcon };

// ── 主页面 ───────────────────────────────────────────────────
const MobileEditor = () => {
  const [blocks, setBlocks] = useState(() => loadDraft()?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  // tab: 'edit' | 'preview' | 'components'
  const [tab, setTab] = useState('edit');
  const [showComponentSheet, setShowComponentSheet] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sliceHeight, setSliceHeight] = useState(2000);
  const [showSliceDialog, setShowSliceDialog] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        saveDraft(blocks);
      } catch (e) {
        console.warn('自动保存草稿失败:', e);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [blocks]);

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
      const pixelRatio = getExportPixelRatio(el);
      const opts = {
        quality: 1,
        pixelRatio,
        backgroundColor: '#ffffff',
        fontEmbedCSS: await getFontEmbedCSS(),
      };
      const dataUrl = format === 'png' ? await toPng(el, opts) : await toJpeg(el, { ...opts, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `article.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success(`图片导出成功，宽度约 ${Math.round(el.getBoundingClientRect().width * pixelRatio)}px`);
    } catch (e) {
      toast.error('导出失败，请重试');
    }
  };

  // 分段导出图片
  const handleSliceExport = async (format = 'png') => {
    const el = document.querySelector('.mobile-preview-export');
    if (!el) { toast.error('预览区未准备好'); return; }
    try {
      const opts = {
        quality: 1,
        pixelRatio: getExportPixelRatio(el),
        backgroundColor: '#ffffff',
        fontEmbedCSS: await getFontEmbedCSS(),
      };
      const blob = await toBlob(el, {
        ...opts,
        type: format === 'png' ? 'image/png' : 'image/jpeg',
        ...(format === 'jpg' ? { quality: 0.95 } : {}),
      });
      const ranges = getNonBreakingSliceRanges(el, sliceHeight);
      const sliceCount = await downloadImageSlices(blob, format, ranges, getExportElementHeight(el));
      toast.success(`已切成 ${sliceCount} 段并导出！`);
      setShowSliceDialog(false);
    } catch (e) {
      console.error('分段导出失败:', e);
      toast.error('分段导出失败，请重试');
    }
  };

  const handleUpdateCurrentTemplate = async () => {
    if (!currentTemplate?.id) return;
    setUpdatingTemplate(true);
    try {
      const saved = await templateStore.updateBlocks(
        currentTemplate.id,
        JSON.parse(JSON.stringify(blocks)),
        '更新原模板',
      );
      setCurrentTemplate({
        id: saved.id,
        name: saved.name,
        version: saved.version,
      });
      toast.success(`模板已更新到 v${saved.version}`);
    } catch (error) {
      toast.error('更新失败：' + error.message);
    } finally {
      setUpdatingTemplate(false);
    }
  };

  const handleTemplateSaved = (saved) => {
    setCurrentTemplate({
      id: saved.id,
      name: saved.name,
      version: saved.version,
    });
  };

  const clearContent = () => {
    setBlocks([]);
    setSelectedBlockId(null);
    setCurrentTemplate(null);
    toast.success('已清空');
  };

  const handleClearContent = () => {
    setConfirmAction({
      title: '清空内容',
      description: '确定清空当前编辑器里的所有内容吗？该操作不会删除已保存的模板，但当前草稿内容会被清空。',
      confirmText: '清空',
      destructive: true,
      onConfirm: clearContent,
    });
  };

  // 过滤组件
  const filteredComponents = customComponents.filter(c =>
    !c.hidden && (activeCategory === 'all' || c.category === activeCategory)
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* ── 顶部导航栏 ── */}
      <div className="flex-shrink-0 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-sm">移动端编辑器</span>
        </div>
        <div className="flex items-center gap-1">
          {tab === 'preview' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 text-xs px-3">
                  <Download size={13} className="mr-1" /> 导出
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleExport('png')}>
                  <ImageIcon size={14} className="mr-2" />
                  PNG 图片
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('jpg')}>
                  <Download size={14} className="mr-2" />
                  JPG 图片
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSliceDialog(true)}>
                  <Scissors size={14} className="mr-2" />
                  分段导出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="更多操作">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {currentTemplate && (
                <DropdownMenuItem onClick={handleUpdateCurrentTemplate} disabled={blocks.length === 0 || updatingTemplate}>
                  <RefreshCw size={14} className="mr-2" />
                  更新原模板
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowSaveTemplate(true)} disabled={blocks.length === 0}>
                <BookmarkPlus size={14} className="mr-2" />
                另存新模板
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={blocks.length === 0}
                className="text-destructive focus:text-destructive"
                onClick={handleClearContent}
              >
                清空内容
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 主内容区 ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* 编辑 Tab */}
        {tab === 'edit' && (
          <div className="h-full overflow-auto">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground px-8">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <LayoutTemplate size={28} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">编辑器为空</p>
                  <p className="text-xs text-muted-foreground mt-1">点击下方「+」按钮添加组件</p>
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
                    <div className="py-12 text-center text-muted-foreground text-sm">暂无内容</div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* ── 底部 Tab 导航 ── */}
      <div className="flex-shrink-0 bg-card border-t">
        <div className="flex items-center">
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              tab === 'edit' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutTemplate size={20} />
            <span className="text-xs">编辑</span>
          </button>

          {/* 中间大按钮 */}
          <div className="px-4">
            <button
              onClick={() => setShowComponentSheet(true)}
              className="w-14 h-14 -mt-5 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground flex items-center justify-center transition-colors"
            >
              <Plus size={26} />
            </button>
          </div>

          <button
            onClick={() => setTab('preview')}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              tab === 'preview' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
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
            className="fixed inset-0 bg-foreground/40 z-40"
            onClick={() => setShowComponentSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t rounded-t-lg animate-slide-up">
            {/* 弹层头部 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-medium text-base">选择组件</h3>
              <button
                onClick={() => setShowComponentSheet(false)}
                className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* 分类 Tab */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {/* 文本块特殊入口 */}
              <button
                onClick={handleInsertMarkdown}
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border border-dashed border-input text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    <Icon size={11} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* 组件列表 */}
            <div className="px-4 pb-6 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredComponents.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => handleInsertComponent(comp.id, comp.defaultProps)}
                  className="text-left p-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                >
                  <div className="font-medium text-sm">{comp.name}</div>
                  <span className="inline-block mt-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
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
          <div className="fixed inset-0 bg-foreground/40 z-40" onClick={() => setShowSliceDialog(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t rounded-t-lg animate-slide-up">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-medium text-base flex items-center gap-2">
                <Scissors size={16} /> 分段导出
              </h3>
              <button onClick={() => setShowSliceDialog(false)} className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">每段高度（px）</label>
                <input
                  type="number"
                  min={500}
                  max={20000}
                  step={100}
                  value={sliceHeight}
                  onChange={(e) => setSliceHeight(Math.max(500, Number(e.target.value) || 2000))}
                  className="w-full h-10 border border-input bg-background rounded-md px-3 text-sm focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        onSaved={handleTemplateSaved}
      />
      <ConfirmActionDialog
        open={Boolean(confirmAction)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setConfirmAction(null);
        }}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmText={confirmAction?.confirmText}
        destructive={confirmAction?.destructive}
        onConfirm={() => {
          confirmAction?.onConfirm?.();
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

export default MobileEditor;
