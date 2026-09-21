import React, { useMemo, useState } from 'react';
import { AlignLeft, Image as ImageIcon, Layers3, Plus, Search, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { customComponents } from './CustomComponentDefinitions';

const categories = ['全部', ...new Set(customComponents.filter(component => !component.hidden).map(component => component.category))];

const categoryIcon = (category) => {
  if (category === '标题') return Type;
  if (category === '文本') return AlignLeft;
  if (category === '媒体' || category === '视觉') return ImageIcon;
  return Layers3;
};

const CustomComponentPanel = ({ onInsert, onInsertMarkdown }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');

  const filteredComponents = useMemo(() => customComponents.filter(component => {
    if (component.hidden) return false;
    const matchesCategory = category === '全部' || component.category === category;
    const keyword = query.trim().toLowerCase();
    return matchesCategory && (!keyword || `${component.name} ${component.category}`.toLowerCase().includes(keyword));
  }), [category, query]);

  return (
    <div className="flex h-full min-w-0 flex-col bg-card">
      <div className="space-y-3 p-3">
        <div>
          <h2 className="text-sm font-medium">内容装备库</h2>
          <p className="text-xs text-muted-foreground">悬停预览，点击 + 装入文章</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索组件" aria-label="搜索组件" className="h-8 pl-8 text-sm" />
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(item => (
            <button type="button" key={item} onClick={() => setCategory(item)} data-active={category === item || undefined} className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active]:bg-muted data-[active]:font-medium data-[active]:text-foreground data-[active]:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {item}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="min-w-0 flex-1 px-2 pb-2">
        <div className="space-y-1">
          {onInsertMarkdown && (
            <HoverCard openDelay={250} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div tabIndex={0} className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground"><AlignLeft className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Markdown 文本</span><span className="block text-xs text-muted-foreground">文本</span></span>
                  <button type="button" onClick={onInsertMarkdown} className="trail-orange flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="添加 Markdown 文本" title="添加"><Plus className="size-4" /></button>
                </div>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" sideOffset={8} className="w-80 p-0">
                <PreviewFrame name="Markdown 文本"><div className="space-y-2 text-sm"><p className="font-medium">文章正文标题</p><p className="text-muted-foreground">支持 Markdown 标题、列表、引用和链接等常用格式。</p></div></PreviewFrame>
              </HoverCardContent>
            </HoverCard>
          )}
          {filteredComponents.map(component => {
            const Icon = categoryIcon(component.category);
            return (
              <HoverCard key={component.id} openDelay={250} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div tabIndex={0} className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground"><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{component.name}</span><span className="block text-xs text-muted-foreground">{component.category}</span></span>
                    <button type="button" onClick={() => onInsert(component.template, component.id, component.defaultProps)} className="trail-orange flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={`添加${component.name}`} title="添加"><Plus className="size-4" /></button>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="right" align="start" sideOffset={8} className="w-[360px] p-0">
                  <PreviewFrame name={component.name}>
                    <div className="pointer-events-none max-h-[360px] overflow-hidden" dangerouslySetInnerHTML={{ __html: component.renderFn(component.defaultProps) }} />
                  </PreviewFrame>
                </HoverCardContent>
              </HoverCard>
            );
          })}
          {filteredComponents.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted-foreground">没有匹配的组件</div>}
        </div>
      </ScrollArea>
    </div>
  );
};

const PreviewFrame = ({ name, children }) => (
  <div>
    <div className="border-b px-3 py-2"><p className="text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">组件预览</p></div>
    <div className="bg-white p-3 text-foreground">{children}</div>
  </div>
);

export default CustomComponentPanel;
