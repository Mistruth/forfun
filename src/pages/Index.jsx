import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ImageGenerator from '@/components/ImageGenerator';
import { CardContent, Card } from '@/components/ui/card';
import { toast } from 'sonner';
import CustomComponentPanel from '@/components/CustomComponentPanel';
import BlockEditor from '@/components/BlockEditor';
import { ComponentConfigPanel } from '@/components/ComponentConfigDrawer';
import {
  RotateCcw, Copy, PanelLeftClose, Sparkles, PanelLeft, ChevronLeft,
  Smartphone, LayoutTemplate, Eye, X, Undo2, Redo2, Save, BookmarkPlus,
} from 'lucide-react';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatePickerDialog from '@/components/TemplatePickerDialog';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import BlocksPreview from '@/components/BlocksPreview';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { Button } from '@/components/ui/button';
import { customComponents } from '@/components/CustomComponentDefinitions';

let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;

const DRAFT_KEY = 'editor_draft';
const MAX_HISTORY = 50;

const blocksToContent = (blocks) => {
  return blocks.map(block => {
    if (block.type === 'markdown') return block.content || '';
    if (block.type === 'custom') {
      const compDef = customComponents.find(c => c.id === block.componentId);
      if (!compDef) return '';
      return compDef.renderFn(block.props || compDef.defaultProps);
    }
    return '';
  }).join('\n\n');
};

// ─── 草稿读写 ──────────────────────────────────────────────
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const { blocks, savedAt } = JSON.parse(raw);
    if (Array.isArray(blocks)) return { blocks, savedAt };
  } catch { /* ignore */ }
  return null;
};

const saveDraft = (blocks) => {
  const data = { blocks, savedAt: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  return data.savedAt;
};

// ─── 主页面 ────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [showComponentPanel, setShowComponentPanel] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // 草稿：启动时尝试恢复
  const [draftSavedAt, setDraftSavedAt] = useState(() => loadDraft()?.savedAt || null);

  // blocks 初始化：有草稿则恢复
  const [blocks, setBlocks] = useState(() => loadDraft()?.blocks || []);

  // ─── 撤销/重做历史 ─────────────────────────────────────
  const historyRef = useRef({ stack: [], index: -1 });
  const skipHistoryRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newBlocks) => {
    const h = historyRef.current;
    const stack = h.stack.slice(0, h.index + 1);
    stack.push(JSON.parse(JSON.stringify(newBlocks)));
    if (stack.length > MAX_HISTORY) stack.shift();
    const newIndex = stack.length - 1;
    historyRef.current = { stack, index: newIndex };
    setCanUndo(newIndex > 0);
    setCanRedo(false);
  }, []);

  // 组件挂载时记录初始状态
  useEffect(() => {
    pushHistory(blocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 包装 setBlocks，自动记录历史
  const setBlocksWithHistory = useCallback((updater) => {
    setBlocks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipHistoryRef.current) {
        pushHistory(next);
      }
      skipHistoryRef.current = false;
      return next;
    });
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    const newIndex = h.index - 1;
    historyRef.current = { ...h, index: newIndex };
    skipHistoryRef.current = true;
    setBlocks(h.stack[newIndex]);
    setCanUndo(newIndex > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    const newIndex = h.index + 1;
    historyRef.current = { ...h, index: newIndex };
    skipHistoryRef.current = true;
    setBlocks(h.stack[newIndex]);
    setCanUndo(true);
    setCanRedo(newIndex < h.stack.length - 1);
  }, []);

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

  // ─── 键盘快捷键 ────────────────────────────────────────
  const saveDraftRef = useRef(handleSaveDraft);
  saveDraftRef.current = handleSaveDraft;

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraftRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ─── 现有业务逻辑 ──────────────────────────────────────
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId && b.type === 'custom') || null,
    [blocks, selectedBlockId],
  );

  const previewContent = useMemo(() => blocksToContent(blocks), [blocks]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    toast.success('内容已复制到剪贴板');
  };

  const handleReset = () => {
    setBlocksWithHistory([]);
    setSelectedBlockId(null);
    toast.success('已重置');
  };

  const handleApplyTemplate = useCallback((templateBlocks) => {
    setBlocksWithHistory(templateBlocks);
    setSelectedBlockId(null);
    toast.success('模板已加载，开始编辑吧！');
  }, [setBlocksWithHistory]);

  const handleClear = () => {
    setBlocksWithHistory([]);
    setSelectedBlockId(null);
    toast.success('内容已清空');
  };

  const handleInsertComponent = useCallback((template, componentId, defaultProps) => {
    const newBlock = {
      id: genId(),
      type: 'custom',
      componentId,
      props: { ...defaultProps },
    };
    setBlocksWithHistory(prev => {
      const idx = prev.findIndex(b => b.id === selectedBlockId);
      if (idx !== -1) {
        const next = [...prev];
        next.splice(idx + 1, 0, newBlock);
        return next;
      }
      return [...prev, newBlock];
    });
    toast.success(`已插入「${customComponents.find(c => c.id === componentId)?.name || '组件'}」`);
  }, [selectedBlockId, setBlocksWithHistory]);

  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setBlocksWithHistory(prev => prev.map(b => b.id === blockId ? { ...b, props: newProps } : b));
  }, [setBlocksWithHistory]);

  const handleSelectBlock = useCallback((blockId) => {
    setSelectedBlockId(prev => prev === blockId ? null : blockId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedBlockId(null);
  }, []);

  // 草稿保存时间格式化
  const draftTimeStr = useMemo(() => {
    if (!draftSavedAt) return null;
    const d = new Date(draftSavedAt);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }, [draftSavedAt]);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 最左侧：组件面板 */}
      {showComponentPanel && (
        <div className="w-72 flex-shrink-0 bg-white border-r shadow-sm flex flex-col">
          <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                组件面板
              </h2>
              <p className="text-xs text-gray-500 mt-1">点击插入到编辑器</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComponentPanel(false)}
              className="h-8 w-8 p-0 hover:bg-white/50"
              title="收起面板"
            >
              <ChevronLeft size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CustomComponentPanel onInsert={handleInsertComponent} />
          </div>
        </div>
      )}

      {/* 中间：块编辑器 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 编辑器头部 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <Separator orientation="vertical" className="h-6" />
            <h2 className="font-bold text-gray-800">块编辑器</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <LayoutTemplate size={14} />
              <span className="hidden sm:inline">模板</span>
            </Button>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/mobile')}
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">移动端</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {/* 预览 */}
            <Button
              size="sm"
              className="flex items-center gap-1 text-white bg-green-500 hover:bg-green-600"
              onClick={() => setShowPreview(true)}
            >
              <Eye size={14} />
              <span className="hidden sm:inline">预览</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {/* 撤销 / 重做 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo2 size={15} />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {/* 复制 / 保存 / 重置 / 清空 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-1"
            >
              <Copy size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDraft}
              className="flex items-center gap-1"
              title="保存草稿 (Ctrl+S)"
            >
              <Save size={14} />
              <span className="hidden sm:inline">保存</span>
            </Button>
            {draftTimeStr && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{draftTimeStr} 已保存</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <RotateCcw size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
            >
              清空
            </Button>
          </div>
        </div>

        {/* 编辑器内容 */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full shadow-lg rounded-none border-0">
            <CardContent className="p-0 h-full overflow-auto">
              <BlockEditor
                blocks={blocks}
                onChange={setBlocksWithHistory}
                onSelectBlock={handleSelectBlock}
                selectedBlockId={selectedBlockId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 配置区：选中自定义组件时显示 */}
      {selectedBlock && (
        <div className="w-80 flex-shrink-0 border-l border-r border-gray-200 shadow-sm">
          <ComponentConfigPanel
            block={selectedBlock}
            onUpdate={handleUpdateBlockProps}
            onClose={handleCloseDrawer}
          />
        </div>
      )}

      {/* 预览弹窗 */}
      {showPreview && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-green-600" />
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
                  className="h-8 w-8 p-0 hover:bg-white/60"
                  onClick={() => setShowPreview(false)}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex justify-center p-8">
                <div className="w-[420px] bg-white" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
                  <div className="preview-content-for-export overflow-hidden">
                    <div className="p-6">
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
      />
    </div>
  );
};

export default Index;
