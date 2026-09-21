import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, GripVertical, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { customComponents } from './CustomComponentDefinitions';
import { useResolvedBlocks } from '@/lib/useResolvedBlocks';

const clone = value => JSON.parse(JSON.stringify(value));

const BlockEditor = ({ blocks, onChange, onSelectBlock, selectedBlockId, scrollToBlockId, onRequestInsert, onOpenTemplates }) => {
  const editorRef = useRef(null);
  const dragSrcIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const resolvedBlocks = useResolvedBlocks(blocks);

  useEffect(() => {
    if (!scrollToBlockId) return;
    const frame = window.requestAnimationFrame(() => {
      const target = [...(editorRef.current?.querySelectorAll('[data-block-id]') || [])]
        .find(element => element.dataset.blockId === scrollToBlockId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scrollToBlockId]);

  const updateBlock = useCallback((id, patch) => onChange(blocks.map(block => block.id === id ? { ...block, ...patch } : block)), [blocks, onChange]);
  const deleteBlock = useCallback(id => onChange(blocks.filter(block => block.id !== id)), [blocks, onChange]);
  const duplicateBlock = useCallback((block, index) => {
    const next = [...blocks];
    next.splice(index + 1, 0, { ...clone(block), id: `block_${Date.now()}_copy` });
    onChange(next);
  }, [blocks, onChange]);
  const moveBlock = useCallback((id, direction) => {
    const index = blocks.findIndex(block => block.id === id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }, [blocks, onChange]);

  const handleDrop = useCallback((event, toIndex) => {
    event.preventDefault();
    const fromIndex = dragSrcIdx.current;
    if (fromIndex === null || fromIndex === toIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  }, [blocks, onChange]);

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"><LayoutTemplate className="size-5" /></span>
        <div><p className="text-sm font-medium">从一个内容块开始</p><p className="mt-1 text-xs text-muted-foreground">选择模板，或插入正文与组件开始创作。</p></div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => onRequestInsert?.(0)}><Plus className="mr-1 size-4" />插入组件</Button>
          {onOpenTemplates && <Button size="sm" variant="outline" onClick={onOpenTemplates}>选择模板</Button>}
        </div>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="flex flex-col px-3 py-6 sm:px-5">
      {blocks.map((block, index) => {
        const displayBlock = resolvedBlocks[index] || block;
        const selected = selectedBlockId === block.id;
        const definition = block.type === 'custom' ? customComponents.find(item => item.id === block.componentId) : null;
        if (block.type === 'custom' && !definition) return null;

        return (
          <React.Fragment key={block.id}>
            <div
              data-block-wrapper
              data-block-id={block.id}
              draggable
              onDragStart={event => { dragSrcIdx.current = index; event.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => { dragSrcIdx.current = null; setDragOverIdx(null); }}
              onDragOver={event => { event.preventDefault(); if (dragSrcIdx.current !== index) setDragOverIdx(index); }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={event => handleDrop(event, index)}
              onClick={() => block.type === 'custom' && onSelectBlock(block.id)}
              data-active={selected || undefined}
              className={`group relative my-1 rounded-lg border border-transparent transition-colors hover:border-border data-[active]:border-ring data-[active]:hover:border-ring ${dragOverIdx === index ? 'border-dashed border-ring bg-muted' : ''}`}
            >
              <BlockToolbar
                name={definition?.name || 'Markdown 文本'}
                selected={selected}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                onMoveUp={event => { event.stopPropagation(); moveBlock(block.id, 'up'); }}
                onMoveDown={event => { event.stopPropagation(); moveBlock(block.id, 'down'); }}
                onDuplicate={event => { event.stopPropagation(); duplicateBlock(block, index); }}
                onDelete={event => { event.stopPropagation(); deleteBlock(block.id); }}
              />
              {block.type === 'markdown' ? (
                <Textarea
                  value={block.content || ''}
                  onChange={event => updateBlock(block.id, { content: event.target.value })}
                  onFocus={() => onSelectBlock(block.id)}
                  placeholder="输入 Markdown 文本..."
                  className="min-h-[88px] w-full resize-none rounded-lg border-0 bg-transparent p-3 font-mono text-sm focus-visible:ring-0"
                  style={{ minHeight: `${Math.max(88, (block.content?.split('\n').length || 1) * 22 + 24)}px` }}
                />
              ) : (
                <div className="pointer-events-none select-none" dangerouslySetInnerHTML={{ __html: definition.renderFn(displayBlock.props || definition.defaultProps) }} />
              )}
            </div>
            <button type="button" onClick={() => onRequestInsert?.(index + 1)} className="group/insert mx-auto flex h-5 items-center text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={`在第 ${index + 1} 个内容块后插入组件`}>
              <span className="flex size-5 items-center justify-center rounded-full border bg-card opacity-0 transition-opacity hover:bg-muted group-hover/insert:opacity-100 group-focus-visible/insert:opacity-100"><Plus className="size-3" /></span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ToolbarButton = ({ label, children, ...props }) => (
  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={label} title={label} {...props}>{children}</Button>
);

const BlockToolbar = ({ name, selected, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDuplicate, onDelete }) => (
  <div data-block-toolbar className={`absolute -top-3 right-2 z-20 items-center gap-0.5 rounded-full border bg-card p-1 shadow-sm transition-all ${selected ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'}`}>
    <span className="flex items-center gap-1.5 pl-1.5 pr-1 text-xs font-medium"><span className="size-1.5 rounded-full bg-current opacity-70" /><GripVertical className="size-3 text-muted-foreground" />{name}</span>
    <ToolbarButton label="上移内容块" onClick={onMoveUp} disabled={!canMoveUp}><ChevronUp className="size-3.5" /></ToolbarButton>
    <ToolbarButton label="下移内容块" onClick={onMoveDown} disabled={!canMoveDown}><ChevronDown className="size-3.5" /></ToolbarButton>
    <ToolbarButton label="复制内容块" onClick={onDuplicate}><Copy className="size-3.5" /></ToolbarButton>
    <ToolbarButton label="删除内容块" onClick={onDelete}><Trash2 className="size-3.5 text-destructive" /></ToolbarButton>
  </div>
);

export default BlockEditor;
