import { ScrollArea } from '@/components/ui/scroll-area';
import ImageGenerator from '@/components/ImageGenerator';
import { CardContent, Card } from '@/components/ui/card';
import { toast } from 'sonner';
import CustomComponentPanel from '@/components/CustomComponentPanel';
import BlockEditor from '@/components/BlockEditor';
import { ComponentConfigPanel } from '@/components/ComponentConfigDrawer';
import {
  Copy, PanelLeftClose, Sparkles, PanelLeft,
  LayoutTemplate, Eye, X, Save, BookmarkPlus, Download, Upload,
  MoreHorizontal, Settings2, RefreshCw,
} from 'lucide-react';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import TemplatePickerDialog from '@/components/TemplatePickerDialog';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import ConfirmActionDialog from '@/components/ConfirmActionDialog';
import BlocksPreview from '@/components/BlocksPreview';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { customComponents } from '@/components/CustomComponentDefinitions';
import { loadDraft, saveDraft } from '@/lib/draftStore';
import templateStore from '@/lib/templateStore';

let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;

const HeaderTooltip = ({ label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

const normalizeImportedBlocks = (data) => {
  const importedBlocks = Array.isArray(data) ? data : data?.blocks;
  if (!Array.isArray(importedBlocks)) {
    throw new Error('JSON 中未找到 blocks 数组');
  }

  return importedBlocks.map((block, index) => {
    if (!block || typeof block !== 'object') {
      throw new Error(`第 ${index + 1} 个块格式不正确`);
    }

    if (block.type === 'markdown') {
      return {
        id: block.id || genId(),
        type: 'markdown',
        content: typeof block.content === 'string' ? block.content : '',
      };
    }

    if (block.type === 'custom') {
      if (!block.componentId || typeof block.componentId !== 'string') {
        throw new Error(`第 ${index + 1} 个自定义块缺少 componentId`);
      }
      return {
        id: block.id || genId(),
        type: 'custom',
        componentId: block.componentId,
        props: block.props && typeof block.props === 'object' ? block.props : {},
      };
    }

    throw new Error(`第 ${index + 1} 个块类型不支持`);
  });
};

// ─── 主页面 ────────────────────────────────────────────────
const Index = () => {
  const [showComponentPanel, setShowComponentPanel] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [schemaDialogMode, setSchemaDialogMode] = useState(null);
  const [schemaDraft, setSchemaDraft] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // 草稿：启动时尝试恢复
  const [draftSavedAt, setDraftSavedAt] = useState(() => loadDraft()?.savedAt || null);

  // blocks 初始化：有草稿则恢复
  const [blocks, setBlocks] = useState(() => loadDraft()?.blocks || []);


  // ─── 保存草稿 ─────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    try {
      const at = saveDraft(blocks);
      setDraftSavedAt(at);
      toast.success('草稿已保存');
    } catch {
      toast.error('保存失败，内容过大');
    }
  }, [blocks]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const at = saveDraft(blocks);
        setDraftSavedAt(at);
      } catch (e) {
        console.warn('自动保存草稿失败:', e);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [blocks]);

  // ─── 键盘快捷键 ────────────────────────────────────────
  const saveDraftRef = useRef(handleSaveDraft);
  saveDraftRef.current = handleSaveDraft;

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraftRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── 现有业务逻辑 ──────────────────────────────────────
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId && b.type === 'custom') || null,
    [blocks, selectedBlockId],
  );

  const schemaText = useMemo(() => JSON.stringify({ blocks }, null, 2), [blocks]);

  const handleApplyTemplate = useCallback((templateBlocks, templateMeta) => {
    setBlocks(templateBlocks);
    setSelectedBlockId(null);
    setCurrentTemplate(templateMeta || null);
    toast.success('模板已加载，开始编辑吧！');
  }, [setBlocks]);

  const clearContent = () => {
    setBlocks([]);
    setSelectedBlockId(null);
    setCurrentTemplate(null);
    toast.success('内容已清空');
  };

  const handleClear = () => {
    setConfirmAction({
      title: '清空内容',
      description: '确定清空当前编辑器里的所有内容吗？该操作不会删除已保存的模板，但当前草稿内容会被清空。',
      confirmText: '清空',
      destructive: true,
      onConfirm: clearContent,
    });
  };

  const handleOpenImportSchema = useCallback(() => {
    setSchemaDraft('');
    setSchemaDialogMode('import');
  }, []);

  const handleOpenExportSchema = useCallback(() => {
    setSchemaDialogMode('export');
  }, []);

  const handleImportSchema = useCallback(() => {
    try {
      const data = JSON.parse(schemaDraft);
      const importedBlocks = normalizeImportedBlocks(data);
      setBlocks(importedBlocks);
      setSelectedBlockId(null);
      setCurrentTemplate(null);
      setSchemaDialogMode(null);
      toast.success(`已导入 ${importedBlocks.length} 个块`);
    } catch (error) {
      toast.error(error.message || '导入失败，请检查 JSON 格式');
    }
  }, [schemaDraft, setBlocks]);

  const handleCopySchema = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(schemaText);
      toast.success('Schema 已复制');
    } catch {
      toast.error('复制失败');
    }
  }, [schemaText]);

  const handleInsertComponent = useCallback((template, componentId, defaultProps) => {
    const newBlock = {
      id: genId(),
      type: 'custom',
      componentId,
      props: { ...defaultProps },
    };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === selectedBlockId);
      if (idx !== -1) {
        const next = [...prev];
        next.splice(idx + 1, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    toast.success(`已插入「${customComponents.find(c => c.id === componentId)?.name || '组件'}」`);
  }, [selectedBlockId, setBlocks]);

  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: newProps } : b));
  }, [setBlocks]);

  const handleSelectBlock = useCallback((blockId) => {
    setSelectedBlockId(prev => prev === blockId ? null : blockId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedBlockId(null);
  }, []);

  const handleUpdateCurrentTemplate = useCallback(async () => {
    if (!currentTemplate?.id || currentTemplate.source !== 'user') return;
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
        source: 'user',
      });
      toast.success(`模板「${saved.name}」已更新到 v${saved.version}`);
    } catch (error) {
      toast.error('更新失败：' + error.message);
    } finally {
      setUpdatingTemplate(false);
    }
  }, [blocks, currentTemplate]);

  const handleTemplateSaved = useCallback((saved) => {
    setCurrentTemplate({
      id: saved.id,
      name: saved.name,
      version: saved.version,
      source: 'user',
    });
  }, []);

  // 草稿保存时间格式化
  const draftTimeStr = useMemo(() => {
    if (!draftSavedAt) return null;
    const d = new Date(draftSavedAt);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }, [draftSavedAt]);

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground">
      {/* 最左侧：组件面板 */}
      {showComponentPanel && (
        <div className="w-[clamp(240px,18vw,288px)] flex-shrink-0 bg-card border-r flex flex-col">
          <div className="flex-1 overflow-hidden">
            <CustomComponentPanel onInsert={handleInsertComponent} />
          </div>
        </div>
      )}

      {/* 中间：块编辑器 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 编辑器头部 */}
        <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant={showComponentPanel ? 'outline' : 'default'}
              size="sm"
              onClick={() => setShowComponentPanel(!showComponentPanel)}
              title={showComponentPanel ? '收起组件面板' : '展开组件面板'}
              className="flex items-center gap-1"
            >
              {showComponentPanel ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              <span className="hidden sm:inline">{showComponentPanel ? '收起面板' : '组件面板'}</span>
            </Button>
            {currentTemplate && (
              <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[220px]">
                来源：{currentTemplate.name}
                {currentTemplate.version ? ` v${currentTemplate.version}` : ''}
                {currentTemplate.source === 'built-in' ? '（内置模板需另存后更新）' : ''}
              </span>
            )}
            {draftTimeStr && (
              <span className="hidden md:inline text-xs text-muted-foreground whitespace-nowrap">
                {draftTimeStr} 已保存
              </span>
            )}
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2">
              <HeaderTooltip label="模板">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTemplatePicker(true)}
                  className="h-8 w-8 p-0"
                  aria-label="模板"
                >
                  <LayoutTemplate size={14} />
                </Button>
              </HeaderTooltip>
              <HeaderTooltip label="预览">
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-brand text-brand-foreground hover:bg-brand/80"
                  onClick={() => setShowPreview(true)}
                  aria-label="预览"
                >
                  <Eye size={14} />
                  <span className="hidden sm:inline">预览</span>
                </Button>
              </HeaderTooltip>
              <HeaderTooltip label="保存草稿 (Ctrl+S)">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="h-8 w-8 p-0"
                  aria-label="保存草稿"
                >
                  <Save size={14} />
                </Button>
              </HeaderTooltip>
              {currentTemplate?.source === 'user' && (
                <HeaderTooltip label={updatingTemplate ? '更新中...' : '更新原模板'}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUpdateCurrentTemplate}
                    disabled={blocks.length === 0 || updatingTemplate}
                    className="h-8 w-8 p-0"
                    aria-label="更新原模板"
                  >
                    <RefreshCw size={14} className={updatingTemplate ? 'animate-spin' : ''} />
                  </Button>
                </HeaderTooltip>
              )}
              <HeaderTooltip label="另存为新模板">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={blocks.length === 0}
                  className="h-8 w-8 p-0"
                  aria-label="另存为新模板"
                >
                  <BookmarkPlus size={14} />
                </Button>
              </HeaderTooltip>
              <DropdownMenu>
                <HeaderTooltip label="更多操作">
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="更多操作">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                </HeaderTooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOpenImportSchema}>
                    <Upload size={14} className="mr-2" />
                    导入 Schema
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenExportSchema} disabled={blocks.length === 0}>
                    <Download size={14} className="mr-2" />
                    导出 Schema
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleClear}
                    disabled={blocks.length === 0}
                    className="text-destructive focus:text-destructive"
                  >
                    清空
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        </div>

        {/* 编辑器内容 */}
        <div className="flex-1 overflow-hidden bg-muted/40">
          <div className="h-full flex justify-center p-4">
          <Card className="h-full w-[420px] max-w-full rounded-lg border overflow-hidden shadow-none">
            <CardContent className="p-0 h-full overflow-auto">
              <BlockEditor
                blocks={blocks}
                onChange={setBlocks}
                onSelectBlock={handleSelectBlock}
                selectedBlockId={selectedBlockId}
              />
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* 配置区：常驻显示 */}
      <div className="w-[clamp(340px,28vw,420px)] flex-shrink-0 border-l bg-card">
        {selectedBlock ? (
          <ComponentConfigPanel
            block={selectedBlock}
            onUpdate={handleUpdateBlockProps}
            onClose={handleCloseDrawer}
          />
        ) : (
          <div className="h-full flex flex-col bg-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Settings2 size={18} className="text-muted-foreground" />
              <div>
                <h3 className="font-medium text-sm">配置面板</h3>
                <p className="text-xs text-muted-foreground">选择中间组件后编辑样式和内容</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-8 text-center text-sm text-muted-foreground">
              从中间编辑区选择一个组件
            </div>
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      {showPreview && (
        <>
          <div className="fixed inset-0 bg-foreground/50 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-4 z-50 bg-card rounded-lg border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-medium text-base flex items-center gap-2">
                <Sparkles size={18} className="text-brand" />
                实时预览
              </h2>
              <div className="flex items-center gap-2">
                <ImageGenerator>
                  <WechatStyleWrapper>
                    <BlocksPreview blocks={blocks} />
                  </WechatStyleWrapper>
                </ImageGenerator>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowPreview(false)}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex justify-center p-8">
                <div className="w-[420px] bg-white border">
                  <div className="preview-content-for-export overflow-hidden">
                    <div className="p-[0.8rem]">
                      <WechatStyleWrapper>
                        <BlocksPreview blocks={blocks} />
                      </WechatStyleWrapper>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* 模板选择弹窗 */}
      <TemplatePickerDialog
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onApply={handleApplyTemplate}
      />
      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        blocks={blocks}
        onSaved={handleTemplateSaved}
      />
      <Dialog open={Boolean(schemaDialogMode)} onOpenChange={(open) => !open && setSchemaDialogMode(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{schemaDialogMode === 'import' ? '导入 Schema' : '导出 Schema'}</DialogTitle>
            <DialogDescription>
              {schemaDialogMode === 'import'
                ? '粘贴 blocks schema，支持 { "blocks": [...] } 或直接粘贴 blocks 数组。导入后会替换当前编辑器内容。'
                : '当前文章的 blocks schema，可直接复制后交给 AI 修改或在其他环境导入。'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={schemaDialogMode === 'import' ? schemaDraft : schemaText}
            onChange={(event) => setSchemaDraft(event.target.value)}
            readOnly={schemaDialogMode !== 'import'}
            placeholder='{"blocks":[...]}'
            className="min-h-[420px] resize-none font-mono text-xs leading-relaxed"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchemaDialogMode(null)}>
              关闭
            </Button>
            {schemaDialogMode === 'import' ? (
              <Button onClick={handleImportSchema} disabled={!schemaDraft.trim()}>
                导入
              </Button>
            ) : (
              <Button onClick={handleCopySchema}>
                <Copy size={14} className="mr-1" />
                复制 Schema
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export default Index;
