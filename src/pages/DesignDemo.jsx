import React, { useMemo, useState } from 'react';
import {
  AlignLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LayoutPanelLeft,
  LayoutTemplate,
  Menu,
  MoreHorizontal,
  Plus,
  Redo2,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customComponents } from '@/components/CustomComponentDefinitions';
import { templates } from '@/components/Templates';
import BlocksPreview from '@/components/BlocksPreview';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';

const clone = (value) => JSON.parse(JSON.stringify(value));
const initialBlocks = clone(templates[0].blocks.slice(0, 6));
const categories = ['全部', ...new Set(customComponents.filter((item) => !item.hidden).map((item) => item.category))];

const iconForCategory = (category) => {
  if (category === '标题') return Type;
  if (category === '文本') return AlignLeft;
  if (category === '媒体' || category === '视觉') return ImageIcon;
  return Layers3;
};

const DemoIconButton = ({ label, children, ...props }) => (
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={label} title={label} {...props}>
    {children}
  </Button>
);

const ComponentLibrary = ({ onInsert }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const list = customComponents.filter((item) => {
    if (item.hidden) return false;
    const matchesCategory = category === '全部' || item.category === category;
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-card">
      <div className="space-y-3 p-3">
        <div>
          <h2 className="text-sm font-medium">组件库</h2>
          <p className="text-xs text-muted-foreground">点击插入到当前内容之后</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索组件"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              data-active={category === item || undefined}
              className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active]:bg-muted data-[active]:font-medium data-[active]:text-foreground data-[active]:hover:bg-muted"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="min-w-0 flex-1 px-2 pb-2">
        <div className="space-y-1">
          {list.map((component) => {
            const Icon = iconForCategory(component.category);
            return (
              <button
                type="button"
                key={component.id}
                onClick={() => onInsert(component)}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{component.name}</span>
                  <span className="block text-xs text-muted-foreground">{component.category}</span>
                </span>
                <Plus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
          {list.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">没有匹配的组件</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const CanvasBlock = ({ block, selected, onSelect, onMove, onDuplicate, onDelete }) => {
  const definition = customComponents.find((item) => item.id === block.componentId);
  if (!definition) return null;

  return (
    <div className="group relative px-3 py-1">
      <button
        type="button"
        onClick={onSelect}
        data-active={selected || undefined}
        className="relative block w-full rounded-lg border border-transparent text-left transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[active]:border-ring data-[active]:hover:border-ring"
      >
        <div className="pointer-events-none select-none" dangerouslySetInnerHTML={{ __html: definition.renderFn(block.props || definition.defaultProps) }} />
      </button>
      <div className={`absolute -top-7 left-3 z-10 items-center gap-0.5 rounded-md border bg-card p-0.5 ${selected ? 'flex' : 'hidden group-hover:flex'}`}>
        <span className="flex items-center gap-1 px-1.5 text-xs font-medium">
          <GripVertical className="size-3 text-muted-foreground" />
          {definition.name}
        </span>
        <DemoIconButton label="上移组件" onClick={() => onMove(-1)}><ChevronLeft className="size-3.5 rotate-90" /></DemoIconButton>
        <DemoIconButton label="下移组件" onClick={() => onMove(1)}><ChevronRight className="size-3.5 rotate-90" /></DemoIconButton>
        <DemoIconButton label="复制组件" onClick={onDuplicate}><Copy className="size-3.5" /></DemoIconButton>
        <DemoIconButton label="删除组件" onClick={onDelete}><Trash2 className="size-3.5 text-destructive" /></DemoIconButton>
      </div>
      <button
        type="button"
        className="absolute -bottom-3 left-1/2 z-10 hidden size-6 -translate-x-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:flex"
        aria-label="在此处插入组件"
        title="在此处插入组件"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
};

const Inspector = ({ block, onUpdate }) => {
  const definition = customComponents.find((item) => item.id === block?.componentId);
  const fields = definition?.configFields || [];
  const simpleFields = fields.filter((field) => ['text', 'textarea', 'color', 'select', 'fontSelect', 'stepper', 'toggle'].includes(field.type));

  if (!block || !definition) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><SlidersHorizontal className="size-4" /></span>
        <p className="text-sm font-medium">选择一个内容块</p>
        <p className="text-xs text-muted-foreground">在画布中点击组件后，可在这里调整内容和样式。</p>
      </div>
    );
  }

  const setValue = (key, value) => onUpdate({ ...block.props, [key]: value });
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-muted"><Settings2 className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">{definition.name}</h2>
          <p className="text-xs text-muted-foreground">属性调整会实时显示在画布中</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><DemoIconButton label="组件更多操作"><MoreHorizontal className="size-4" /></DemoIconButton></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>恢复默认设置</DropdownMenuItem>
            <DropdownMenuItem>复制组件</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['content', 'style']} className="px-4">
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm font-medium">内容</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {simpleFields.slice(0, 3).map((field) => (
                <DemoField key={field.key} field={field} value={block.props?.[field.key]} onChange={(value) => setValue(field.key, value)} />
              ))}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="style">
            <AccordionTrigger className="text-sm font-medium">样式与排版</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {simpleFields.slice(3, 7).map((field) => (
                <DemoField key={field.key} field={field} value={block.props?.[field.key]} onChange={(value) => setValue(field.key, value)} />
              ))}
              {simpleFields.slice(3, 7).length === 0 && <p className="text-xs text-muted-foreground">当前组件没有额外样式选项。</p>}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="spacing">
            <AccordionTrigger className="text-sm font-medium">间距与布局</AccordionTrigger>
            <AccordionContent>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">高级布局参数可以收纳在这里，降低默认表单密度。</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      <div className="border-t p-3">
        <Button variant="outline" size="sm" className="w-full">恢复组件默认设置</Button>
      </div>
    </div>
  );
};

const DemoField = ({ field, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{field.label}</Label>
    {field.type === 'select' ? (
      <select
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
      >
        {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    ) : field.type === 'toggle' ? (
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute left-1 top-1 size-4 rounded-full bg-background transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    ) : (
      <Input
        type={field.type === 'color' ? 'text' : 'text'}
        className="h-8 text-sm"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </div>
);

const DesignDemo = () => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id || null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('canvas');
  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedId) || null, [blocks, selectedId]);

  const insertComponent = (component) => {
    const block = { id: `demo_${Date.now()}`, type: 'custom', componentId: component.id, props: clone(component.defaultProps) };
    setBlocks((current) => [...current, block]);
    setSelectedId(block.id);
    setMobileTab('canvas');
    toast.success(`已插入「${component.name}」`);
  };

  const moveBlock = (id, direction) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const duplicateBlock = (id) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      if (index < 0) return current;
      const copy = { ...clone(current[index]), id: `demo_${Date.now()}` };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      setSelectedId(copy.id);
      return next;
    });
  };

  const deleteBlock = (id) => {
    setBlocks((current) => current.filter((block) => block.id !== id));
    setSelectedId(null);
    toast('组件已删除', { action: { label: '撤销', onClick: () => setBlocks(initialBlocks) } });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-3">
        <div className="flex min-w-0 items-center gap-2">
          <DemoIconButton label="打开菜单"><Menu className="size-4" /></DemoIconButton>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand"><Sparkles className="size-4" /></span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">楠木溪徒步活动</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3" /> 已自动保存</div>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          <DemoIconButton label="撤销"><Undo2 className="size-4" /></DemoIconButton>
          <DemoIconButton label="重做" disabled><Redo2 className="size-4" /></DemoIconButton>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-8 text-xs">适应宽度 <ChevronDown className="ml-1 size-3" /></Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="hidden h-8 sm:flex"><LayoutTemplate className="mr-1.5 size-4" />模板</Button>
          <Button variant="outline" size="sm" className="h-8" aria-label="预览" onClick={() => setPreviewOpen(true)}><Eye className="mr-1.5 size-4" /><span className="hidden sm:inline">预览</span></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 bg-brand text-brand-foreground hover:bg-brand/80"><Download className="mr-1.5 size-4" />导出图片<ChevronDown className="ml-1 size-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success('Demo：已开始导出 PNG')}>快速导出 PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Demo：已开始导出 JPG')}>导出 JPG</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>高级导出设置</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden md:flex">
        <aside className={`${mobileTab === 'library' ? 'flex' : 'hidden'} h-full w-full min-w-0 shrink-0 overflow-hidden border-r md:flex md:w-60 ${leftOpen ? '' : 'md:hidden'}`}>
          <ComponentLibrary onInsert={insertComponent} />
        </aside>

        <main className={`${mobileTab === 'canvas' ? 'flex' : 'hidden'} relative min-w-0 flex-1 flex-col bg-muted/40 md:flex`}>
          <div className="absolute left-3 top-3 z-20 hidden md:block">
            <DemoIconButton label={leftOpen ? '收起组件库' : '展开组件库'} onClick={() => setLeftOpen((value) => !value)}>
              <LayoutPanelLeft className="size-4" />
            </DemoIconButton>
          </div>
          <ScrollArea className="h-full">
            <div className="mx-auto min-h-full max-w-md px-3 py-8 md:py-12">
              <div className="rounded-lg border bg-card px-2 py-6">
                {blocks.map((block) => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    selected={block.id === selectedId}
                    onSelect={() => setSelectedId(block.id)}
                    onMove={(direction) => moveBlock(block.id, direction)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </main>

        <aside className={`${mobileTab === 'settings' ? 'flex' : 'hidden'} h-full w-full shrink-0 border-l bg-card xl:flex xl:w-80`}>
          <Inspector
            block={selectedBlock}
            onUpdate={(props) => setBlocks((current) => current.map((block) => block.id === selectedId ? { ...block, props } : block))}
          />
        </aside>
      </div>

      <nav className="relative z-30 grid h-14 shrink-0 grid-cols-3 border-t bg-card md:hidden" aria-label="移动端工作区">
        {[
          ['library', Layers3, '组件'],
          ['canvas', Eye, '画布'],
          ['settings', SlidersHorizontal, '配置'],
        ].map(([id, Icon, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setMobileTab(id)}
            data-active={mobileTab === id || undefined}
            className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground data-[active]:font-medium data-[active]:text-foreground"
          >
            <Icon className="size-4" />{label}
          </button>
        ))}
      </nav>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl grid-cols-none flex-col gap-0 overflow-hidden p-0 shadow-none">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base font-medium">文章预览</DialogTitle>
            <DialogDescription className="text-xs">微信文章宽度 · 导出前最终检查</DialogDescription>
          </DialogHeader>
          <ScrollArea className="bg-muted/60 p-6">
            <div className="mx-auto max-w-md border bg-card p-3">
              <WechatStyleWrapper><BlocksPreview blocks={blocks} /></WechatStyleWrapper>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-between border-t bg-card px-5 py-3">
            <span className="text-xs text-muted-foreground">预计导出宽度 1440px · 自动高清分段</span>
            <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/80" onClick={() => toast.success('Demo：导出任务已创建')}><Download className="mr-1.5 size-4" />导出 PNG</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignDemo;
