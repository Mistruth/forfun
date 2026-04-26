import React, { useRef, useCallback, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronUp, ChevronDown, Settings2, GripVertical } from 'lucide-react';
import { customComponents } from './CustomComponentDefinitions';
import { useResolvedBlocks } from '@/lib/useResolvedBlocks';

/**
 * 块编辑器
 * blocks: Array<{ id, type: 'markdown'|'custom', content?: string, componentId?: string, props?: {} }>
 */
const BlockEditor = ({ blocks, onChange, onSelectBlock, selectedBlockId }) => {
  const dragSrcIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const resolvedBlocks = useResolvedBlocks(blocks);

  const updateBlock = useCallback((id, patch) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id) => {
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const moveBlock = useCallback((id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    onChange(newBlocks);
  }, [blocks, onChange]);

  // ── 拖拽处理 ──────────────────────────────────────────────
  const handleDragStart = useCallback((e, idx) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    // 延迟添加拖拽样式，避免截图时出现问题
    setTimeout(() => {
      e.target.closest('[data-block-wrapper]')?.classList.add('opacity-40');
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.closest('[data-block-wrapper]')?.classList.remove('opacity-40');
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcIdx.current !== null && dragSrcIdx.current !== idx) {
      setDragOverIdx(idx);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIdx(null);
  }, []);

  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault();
    const fromIdx = dragSrcIdx.current;
    if (fromIdx === null || fromIdx === toIdx) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIdx, 1);
    newBlocks.splice(toIdx, 0, moved);
    onChange(newBlocks);
    setDragOverIdx(null);
    dragSrcIdx.current = null;
  }, [blocks, onChange]);

  return (
    <div className="flex flex-col gap-3 p-4 pl-8">
      {blocks.map((block, idx) => {
        const displayBlock = resolvedBlocks[idx] || block;
        const isSelected = selectedBlockId === block.id;
        const isDragOver = dragOverIdx === idx;

        if (block.type === 'markdown') {
          return (
            <div
              key={block.id}
              data-block-wrapper
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, idx)}
              className={`group relative rounded-lg border-2 transition-all ${
                isSelected ? 'border-blue-400 shadow-md' : 'border-transparent hover:border-gray-200'
              } ${isDragOver ? 'border-blue-400 border-dashed bg-blue-50/50 scale-[1.01]' : ''}`}
            >
              {/* 左侧拖拽把手 */}
              <DragHandle />

              {/* 操作栏 */}
              <BlockToolbar
                isSelected={isSelected}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
                canMoveUp={idx > 0}
                canMoveDown={idx < blocks.length - 1}
                showConfig={false}
              />
              <Textarea
                value={block.content}
                onChange={e => updateBlock(block.id, { content: e.target.value })}
                onFocus={() => onSelectBlock(block.id)}
                placeholder="输入 Markdown 文本..."
                className="w-full border-0 rounded-lg font-mono text-sm resize-none focus-visible:ring-0 p-3 min-h-[80px] bg-transparent"
                style={{ minHeight: Math.max(80, (block.content?.split('\n').length || 1) * 22 + 24) + 'px' }}
              />
            </div>
          );
        }

        if (block.type === 'custom') {
          const compDef = customComponents.find(c => c.id === block.componentId);
          if (!compDef) return null;
          const html = compDef.renderFn(displayBlock.props || compDef.defaultProps);

          return (
            <div
              key={block.id}
              data-block-wrapper
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, idx)}
              className={`group relative rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-400 shadow-lg ring-2 ring-blue-100'
                  : 'border-transparent hover:border-blue-200 hover:shadow-md'
              } ${isDragOver ? 'border-blue-400 border-dashed bg-blue-50/50 scale-[1.01]' : ''}`}
              onClick={() => onSelectBlock(block.id)}
            >
              {/* 左侧拖拽把手 */}
              <DragHandle />

              {/* 组件类型标签 */}
              <div className={`absolute -top-3 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                  {compDef.name}
                </span>
              </div>

              {/* 操作栏 */}
              <BlockToolbar
                isSelected={isSelected}
                onDelete={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                onMoveUp={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                onMoveDown={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                onConfig={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                canMoveUp={idx > 0}
                canMoveDown={idx < blocks.length - 1}
                showConfig={true}
              />

              {/* 渲染组件 HTML */}
              <div
                className="pointer-events-none select-none"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* 选中时底部提示 */}
              {isSelected && (
                <div className="absolute bottom-1 right-2 text-xs text-blue-400 flex items-center gap-1">
                  <Settings2 size={11} />
                  <span>右侧配置</span>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}

      {blocks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">编辑器为空，从左侧组件面板插入组件，或直接输入文字</p>
        </div>
      )}
    </div>
  );
};

// ── 左侧拖拽把手 ──────────────────────────────────────────────
const DragHandle = () => (
  <div
    className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
    onMouseDown={e => e.stopPropagation()}
    title="拖拽排序"
  >
    <div className="w-5 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors">
      <GripVertical size={15} />
    </div>
  </div>
);

// ── 右侧操作栏 ──────────────────────────────────────────────
const BlockToolbar = ({ isSelected, onDelete, onMoveUp, onMoveDown, onConfig, canMoveUp, canMoveDown, showConfig }) => (
  <div className={`absolute -right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 transition-opacity ${
    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
  }`}>
    {showConfig && (
      <Button
        variant="default"
        size="sm"
        className="h-7 w-7 p-0 rounded-full shadow-md bg-blue-500 hover:bg-blue-600"
        onClick={onConfig}
        title="配置"
      >
        <Settings2 size={13} />
      </Button>
    )}
    <Button
      variant="outline"
      size="sm"
      className="h-7 w-7 p-0 rounded-full shadow-md bg-white"
      onClick={onMoveUp}
      disabled={!canMoveUp}
      title="上移"
    >
      <ChevronUp size={13} />
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="h-7 w-7 p-0 rounded-full shadow-md bg-white"
      onClick={onMoveDown}
      disabled={!canMoveDown}
      title="下移"
    >
      <ChevronDown size={13} />
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="h-7 w-7 p-0 rounded-full shadow-md bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200"
      onClick={onDelete}
      title="删除"
    >
      <Trash2 size={13} />
    </Button>
  </div>
);

export default BlockEditor;
