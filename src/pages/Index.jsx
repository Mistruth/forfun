import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy, Download, Eye, LayoutTemplate, Menu, MoreHorizontal, Mountain, PanelLeftClose, PanelLeftOpen,
  Redo2, RefreshCw, Save, Settings2, Undo2, Upload, X, BookmarkPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import BlockEditor from '@/components/BlockEditor';
import BlocksPreview from '@/components/BlocksPreview';
import CustomComponentPanel from '@/components/CustomComponentPanel';
import ComponentConfigDrawer, { ComponentConfigPanel } from '@/components/ComponentConfigDrawer';
import ConfirmActionDialog from '@/components/ConfirmActionDialog';
import ImageGenerator from '@/components/ImageGenerator';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import TemplatePickerDialog from '@/components/TemplatePickerDialog';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { customComponents } from '@/components/CustomComponentDefinitions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { loadDraft, saveDraft } from '@/lib/draftStore';
import templateStore from '@/lib/templateStore';
import '@/styles/trail-theme.css';

let idCounter = 1;
const genId = () => `block_${Date.now()}_${idCounter++}`;
const clone = value => JSON.parse(JSON.stringify(value));

const useMediaQuery = query => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = event => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

const IconButton = ({ label, children, ...props }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex" tabIndex={props.disabled ? 0 : undefined}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={label} {...props}>{children}</Button>
      </span>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

const normalizeImportedBlocks = data => {
  const imported = Array.isArray(data) ? data : data?.blocks;
  if (!Array.isArray(imported)) throw new Error('JSON 中未找到 blocks 数组');
  return imported.map((block, index) => {
    if (!block || typeof block !== 'object') throw new Error(`第 ${index + 1} 个块格式不正确`);
    if (block.type === 'markdown') return { id: block.id || genId(), type: 'markdown', content: typeof block.content === 'string' ? block.content : '' };
    if (block.type === 'custom' && typeof block.componentId === 'string') return { id: block.id || genId(), type: 'custom', componentId: block.componentId, props: block.props && typeof block.props === 'object' ? block.props : {} };
    throw new Error(`第 ${index + 1} 个块类型不支持`);
  });
};

const Index = () => {
  const initialDraft = useRef(loadDraft());
  const [blocks, setBlocks] = useState(() => initialDraft.current?.blocks || []);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [scrollToBlockId, setScrollToBlockId] = useState(null);
  const [showComponentPanel, setShowComponentPanel] = useState(true);
  const [mobileTab, setMobileTab] = useState('canvas');
  const [insertIndex, setInsertIndex] = useState(null);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [schemaDialogMode, setSchemaDialogMode] = useState(null);
  const [schemaDraft, setSchemaDraft] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(() => initialDraft.current?.currentTemplate || null);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState(() => initialDraft.current?.savedAt || null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isWide = useMediaQuery('(min-width: 1280px)');

  const commitBlocks = useCallback(updater => {
    setBlocks(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current || JSON.stringify(next) === JSON.stringify(current)) return current;
      setPast(items => [...items, clone(current)].slice(-80));
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast(items => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setBlocks(current => { setFuture(next => [clone(current), ...next].slice(0, 80)); return previous; });
      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(items => {
      if (!items.length) return items;
      const next = items[0];
      setBlocks(current => { setPast(previous => [...previous, clone(current)].slice(-80)); return next; });
      return items.slice(1);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setDraftSavedAt(saveDraft(blocks, { currentTemplate })); } catch (error) { console.warn('自动保存草稿失败:', error); }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [blocks, currentTemplate]);

  useEffect(() => {
    const handler = event => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 's') { event.preventDefault(); try { setDraftSavedAt(saveDraft(blocks, { currentTemplate })); toast.success('草稿已保存'); } catch { toast.error('保存失败，内容过大'); } }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [blocks, currentTemplate, redo, undo]);

  const selectedBlock = useMemo(() => blocks.find(block => block.id === selectedBlockId && block.type === 'custom') || null, [blocks, selectedBlockId]);
  const schemaText = useMemo(() => JSON.stringify({ blocks }, null, 2), [blocks]);
  const draftTime = useMemo(() => draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : null, [draftSavedAt]);

  const requestInsert = useCallback(index => {
    setInsertIndex(index);
    if (isDesktop) setShowComponentPanel(true);
    else setMobileTab('components');
  }, [isDesktop]);

  const handleInsertComponent = useCallback((template, componentId, defaultProps) => {
    const newBlock = { id: genId(), type: 'custom', componentId, props: clone(defaultProps) };
    commitBlocks(current => {
      const selectedIndex = current.findIndex(block => block.id === selectedBlockId);
      const target = insertIndex ?? (selectedIndex >= 0 ? selectedIndex + 1 : current.length);
      const next = [...current]; next.splice(target, 0, newBlock); return next;
    });
    setSelectedBlockId(newBlock.id);
    setScrollToBlockId(newBlock.id);
    setInsertIndex(null);
    if (!isDesktop) setMobileTab('canvas');
    toast.success(`已插入「${customComponents.find(item => item.id === componentId)?.name || '组件'}」`);
  }, [commitBlocks, insertIndex, isDesktop, selectedBlockId]);

  const handleInsertMarkdown = useCallback(() => {
    const newBlock = { id: genId(), type: 'markdown', content: '' };
    commitBlocks(current => { const next = [...current]; next.splice(insertIndex ?? current.length, 0, newBlock); return next; });
    setInsertIndex(null); setSelectedBlockId(newBlock.id); setScrollToBlockId(newBlock.id); if (!isDesktop) setMobileTab('canvas');
  }, [commitBlocks, insertIndex, isDesktop]);

  const handleSelectBlock = useCallback(id => {
    setSelectedBlockId(current => current === id ? null : id);
  }, []);
  const handleUpdateBlockProps = useCallback((id, props) => commitBlocks(current => current.map(block => block.id === id ? { ...block, props } : block)), [commitBlocks]);

  const applyTemplate = useCallback((templateBlocks, meta) => {
    commitBlocks(clone(templateBlocks)); setSelectedBlockId(null); setCurrentTemplate(meta || null); toast.success('模板已加载');
  }, [commitBlocks]);

  const importSchema = useCallback(() => {
    try { const imported = normalizeImportedBlocks(JSON.parse(schemaDraft)); commitBlocks(imported); setSelectedBlockId(null); setCurrentTemplate(null); setSchemaDialogMode(null); toast.success(`已导入 ${imported.length} 个块`); }
    catch (error) { toast.error(error.message || '导入失败，请检查 JSON 格式'); }
  }, [commitBlocks, schemaDraft]);

  const clearContent = useCallback(() => { commitBlocks([]); setSelectedBlockId(null); setCurrentTemplate(null); toast.success('内容已清空，可使用撤销恢复'); }, [commitBlocks]);
  const askClear = () => setConfirmAction({ title: '清空内容', description: '确定清空当前编辑器里的所有内容吗？清空后仍可立即撤销。', confirmText: '清空', destructive: true, onConfirm: clearContent });

  const updateTemplate = async () => {
    if (!currentTemplate?.id || currentTemplate.source !== 'user') return;
    setUpdatingTemplate(true);
    try { const saved = await templateStore.updateBlocks(currentTemplate.id, clone(blocks), '更新原模板'); setCurrentTemplate({ id: saved.id, name: saved.name, version: saved.version, source: 'user' }); toast.success(`模板已更新到 v${saved.version}`); }
    catch (error) { toast.error(`更新失败：${error.message}`); }
    finally { setUpdatingTemplate(false); }
  };

  const library = <CustomComponentPanel onInsert={handleInsertComponent} onInsertMarkdown={handleInsertMarkdown} />;
  const canvas = (
    <div className="trail-map trail-workspace h-full overflow-auto p-3 sm:p-5">
      <div className="trail-paper mx-auto min-h-full w-[420px] max-w-full overflow-visible rounded-sm border border-[#b9b09e] text-[#26362d]" style={{ zoom: `${canvasZoom}%` }}>
        <BlockEditor blocks={blocks} onChange={commitBlocks} onSelectBlock={handleSelectBlock} selectedBlockId={selectedBlockId} scrollToBlockId={scrollToBlockId} onRequestInsert={requestInsert} onOpenTemplates={() => setShowTemplatePicker(true)} />
      </div>
    </div>
  );
  const inspector = selectedBlock ? <ComponentConfigPanel block={selectedBlock} onUpdate={handleUpdateBlockProps} onClose={() => setSelectedBlockId(null)} /> : (
    <div className="flex h-full flex-col bg-card"><div className="flex items-center gap-2 border-b px-4 py-3"><Settings2 className="size-4 text-muted-foreground" /><div><h2 className="text-sm font-medium">配置面板</h2><p className="text-xs text-muted-foreground">选择画布中的组件后编辑</p></div></div><div className="flex flex-1 items-center justify-center px-8 text-center text-sm text-muted-foreground">尚未选择可配置组件</div></div>
  );

  return (
    <div className="trail-studio dark flex h-screen min-w-0 flex-col overflow-hidden text-foreground">
      <header className="trail-dark flex h-14 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton label={showComponentPanel ? '收起组件库' : '展开组件库'} onClick={() => setShowComponentPanel(value => !value)}><span className="hidden md:block">{showComponentPanel ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}</span><Menu className="size-4 md:hidden" /></IconButton>
          <span className="trail-orange trail-badge hidden size-8 -rotate-3 items-center justify-center rounded-md sm:flex"><Mountain className="size-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-wide">TRAIL STORY STUDIO</p>
            <p className="hidden max-w-[360px] truncate text-xs text-muted-foreground sm:block">
              模板：{currentTemplate?.name || '未使用模板'}{currentTemplate?.version ? ` v${currentTemplate.version}` : ''}
              <span className="mx-1">·</span>
              {draftTime ? `${draftTime} 已自动保存` : '正在准备自动保存'}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-0.5 md:flex">
          <IconButton label="撤销 (Ctrl+Z)" onClick={undo} disabled={!past.length}><Undo2 className="size-4" /></IconButton>
          <IconButton label="重做 (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length}><Redo2 className="size-4" /></IconButton>
          <div className="ml-2 flex items-center rounded-md bg-muted p-0.5">
            {[75, 100].map(value => <button key={value} type="button" onClick={() => setCanvasZoom(value)} data-active={canvasZoom === value || undefined} className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground data-[active]:bg-card data-[active]:font-medium data-[active]:text-foreground">{value}%</button>)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="hidden h-8 gap-1 sm:flex" onClick={() => setShowTemplatePicker(true)}><LayoutTemplate className="size-4" />模板</Button>
          <IconButton label="预览" onClick={() => setShowPreview(true)}><Eye className="size-4" /></IconButton>
          <div className="hidden items-center gap-1 sm:flex">
            <IconButton label="另存为模板：将当前内容保存为一个新模板" onClick={() => setShowSaveTemplate(true)} disabled={!blocks.length}><BookmarkPlus className="size-4" /></IconButton>
            <IconButton label={currentTemplate?.source === 'user' ? '更新原模板：用当前内容创建该模板的新版本' : '更新原模板：请先应用一个我的模板'} onClick={updateTemplate} disabled={!blocks.length || updatingTemplate || currentTemplate?.source !== 'user'}><RefreshCw className={`size-4 ${updatingTemplate ? 'animate-spin' : ''}`} /></IconButton>
            <IconButton label="保存草稿：立即保存当前编辑内容" onClick={() => { try { setDraftSavedAt(saveDraft(blocks, { currentTemplate })); toast.success('草稿已保存'); } catch { toast.error('保存失败'); } }}><Save className="size-4" /></IconButton>
          </div>
          <Button size="sm" className="trail-orange h-8 gap-1 hover:opacity-90" onClick={() => setShowPreview(true)} disabled={!blocks.length}><Download className="size-4" /><span className="hidden sm:inline">导出图片</span></Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="更多操作"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="sm:hidden" onClick={() => setShowSaveTemplate(true)} disabled={!blocks.length}><BookmarkPlus className="mr-2 size-4" />另存为模板</DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={updateTemplate} disabled={!blocks.length || updatingTemplate || currentTemplate?.source !== 'user'}><RefreshCw className={`mr-2 size-4 ${updatingTemplate ? 'animate-spin' : ''}`} />更新原模板</DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => { try { setDraftSavedAt(saveDraft(blocks, { currentTemplate })); toast.success('草稿已保存'); } catch { toast.error('保存失败'); } }}><Save className="mr-2 size-4" />保存草稿</DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem onClick={() => { setSchemaDraft(''); setSchemaDialogMode('import'); }}><Upload className="mr-2 size-4" />导入 Schema</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSchemaDialogMode('export')} disabled={!blocks.length}><Download className="mr-2 size-4" />导出 Schema</DropdownMenuItem>
            <DropdownMenuSeparator /><DropdownMenuItem onClick={askClear} disabled={!blocks.length} className="text-destructive focus:text-destructive">清空内容</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu>
        </div>
      </header>

      <main className="hidden min-h-0 flex-1 gap-3 p-3 md:flex">
        {showComponentPanel && <aside className="trail-dark w-60 shrink-0 overflow-hidden rounded-xl border">{library}</aside>}
        <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#b9b09e]">{canvas}</section>
        <aside className="trail-dark hidden w-[360px] shrink-0 overflow-hidden rounded-xl border xl:block">{inspector}</aside>
      </main>

      <main className="min-h-0 flex-1 md:hidden">
        {mobileTab === 'components' && library}
        {mobileTab === 'canvas' && canvas}
        {mobileTab === 'config' && inspector}
      </main>
      <nav className="trail-dark grid h-14 shrink-0 grid-cols-3 border-t md:hidden" aria-label="移动端工作区">
        {[['components', '组件', LayoutTemplate], ['canvas', '画布', Menu], ['config', '配置', Settings2]].map(([id, label, Icon]) => <button type="button" key={id} onClick={() => setMobileTab(id)} data-active={mobileTab === id || undefined} className="flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground hover:text-foreground data-[active]:font-medium data-[active]:text-foreground"><Icon className="size-4" />{label}</button>)}
      </nav>

      {isDesktop && !isWide && selectedBlock && <ComponentConfigDrawer block={selectedBlock} onUpdate={handleUpdateBlockProps} onClose={() => setSelectedBlockId(null)} />}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="flex h-[calc(100vh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between border-b px-4 py-3 text-left"><div><DialogTitle className="text-base font-medium">预览与导出</DialogTitle><DialogDescription className="text-xs">文章宽度 420px，导出时自动生成高清图片并保护完整内容块。</DialogDescription></div><div className="mr-8"><ImageGenerator /></div></DialogHeader>
          <ScrollArea className="flex-1 bg-muted/40"><div className="flex justify-center p-4 sm:p-8"><div className="w-[420px] max-w-full border bg-white"><div className="preview-content-for-export overflow-hidden"><div className="p-[0.8rem]"><WechatStyleWrapper><BlocksPreview blocks={blocks} /></WechatStyleWrapper></div></div>{!blocks.length && <div className="py-16 text-center text-sm text-muted-foreground">暂无可预览内容</div>}</div></div></ScrollArea>
        </DialogContent>
      </Dialog>

      <TemplatePickerDialog open={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} onApply={applyTemplate} />
      <SaveTemplateDialog open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} blocks={blocks} onSaved={saved => setCurrentTemplate({ id: saved.id, name: saved.name, version: saved.version, source: 'user' })} />
      <Dialog open={Boolean(schemaDialogMode)} onOpenChange={open => !open && setSchemaDialogMode(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{schemaDialogMode === 'import' ? '导入 Schema' : '导出 Schema'}</DialogTitle><DialogDescription>{schemaDialogMode === 'import' ? '粘贴 blocks 数组或包含 blocks 的对象，导入会替换当前内容。' : '复制当前文章结构，用于备份或在其他环境导入。'}</DialogDescription></DialogHeader><Textarea value={schemaDialogMode === 'import' ? schemaDraft : schemaText} onChange={event => setSchemaDraft(event.target.value)} readOnly={schemaDialogMode !== 'import'} className="min-h-[420px] resize-none font-mono text-xs" /><DialogFooter><Button variant="outline" onClick={() => setSchemaDialogMode(null)}>关闭</Button>{schemaDialogMode === 'import' ? <Button onClick={importSchema} disabled={!schemaDraft.trim()}>导入</Button> : <Button onClick={async () => { try { await navigator.clipboard.writeText(schemaText); toast.success('Schema 已复制'); } catch { toast.error('复制失败'); } }}><Copy className="mr-1 size-4" />复制 Schema</Button>}</DialogFooter></DialogContent></Dialog>
      <ConfirmActionDialog open={Boolean(confirmAction)} onOpenChange={open => !open && setConfirmAction(null)} title={confirmAction?.title} description={confirmAction?.description} confirmText={confirmAction?.confirmText} destructive={confirmAction?.destructive} onConfirm={() => { confirmAction?.onConfirm?.(); setConfirmAction(null); }} />
    </div>
  );
};

export default Index;
