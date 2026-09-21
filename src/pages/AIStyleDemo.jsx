import React, { useMemo, useState } from 'react';
import {
  AlignLeft, ArrowUp, Backpack, ChevronDown, Compass, Download, Eye, Footprints,
  Image as ImageIcon, LayoutTemplate, Map, MapPin, MoreHorizontal, Mountain,
  Navigation, Plus, Redo2, Search, Settings2, Sparkles, TentTree, Undo2,
} from 'lucide-react';
import BlocksPreview from '@/components/BlocksPreview';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { customComponents } from '@/components/CustomComponentDefinitions';
import { templates } from '@/components/Templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/styles/trail-theme.css';

const demoBlocks = templates[0].blocks.slice(0, 5);

const AIStyleDemo = () => {
  const [query, setQuery] = useState('');
  const list = useMemo(() => customComponents.filter(item => !item.hidden && item.name.includes(query)), [query]);

  return (
    <div className="trail-studio relative flex h-screen min-w-0 flex-col overflow-hidden text-[#26362d]">
      <header className="trail-dark relative z-20 flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-3"><div className="trail-orange trail-badge flex size-9 rotate-[-3deg] items-center justify-center rounded-md"><Mountain className="size-5" /></div><div><div className="flex items-center gap-2"><p className="truncate text-sm font-medium tracking-wide">TRAIL STORY STUDIO</p><span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/60">BETA</span></div><p className="text-xs text-white/50">楠木溪徒步活动 · Route 03</p></div></div>
        <div className="hidden items-center gap-1 md:flex"><TopButton label="撤销"><Undo2 className="size-4" /></TopButton><TopButton label="重做"><Redo2 className="size-4" /></TopButton><span className="mx-2 h-4 w-px bg-white/15" /><button className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/60">100% <ChevronDown className="ml-1 inline size-3" /></button></div>
        <div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="h-8 gap-1 text-white/70 hover:bg-white/10 hover:text-white"><Eye className="size-4" /><span className="hidden sm:inline">预览</span></Button><Button size="sm" className="trail-orange h-8 gap-1 rounded-md hover:opacity-90"><Download className="size-4" />导出路线长图</Button><TopButton label="更多"><MoreHorizontal className="size-4" /></TopButton></div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1">
        <aside className="trail-dark hidden w-60 shrink-0 flex-col border-r lg:flex">
          <div className="space-y-3 p-4"><div className="flex items-start justify-between"><div><p className="text-sm font-medium">内容装备库</p><p className="text-xs text-white/45">为文章装上需要的模块</p></div><Backpack className="size-5 text-[#f18a3d]" /></div><div className="relative"><Search className="absolute left-2.5 top-2.5 size-3.5 text-white/40" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索装备" className="h-9 border-white/10 bg-white/[0.06] pl-8 text-white placeholder:text-white/35" /></div><div className="flex gap-1"><span className="trail-orange rounded-md px-2 py-1 text-xs font-medium">全部</span><span className="px-2 py-1 text-xs text-white/45">文字</span><span className="px-2 py-1 text-xs text-white/45">地图</span><span className="px-2 py-1 text-xs text-white/45">数据</span></div></div>
          <ScrollArea className="flex-1 px-2 pb-3"><div className="space-y-1">{list.map(component => { const Icon = component.category === '媒体' || component.category === '视觉' ? ImageIcon : AlignLeft; return <div key={component.id} className="trail-card group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-all hover:bg-white/[0.06]"><span className="flex size-8 items-center justify-center rounded-md bg-white/[0.07] text-white/60"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/85">{component.name}</span><span className="block text-xs text-white/35">{component.category}</span></span><button className="trail-orange flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100"><Plus className="size-3.5" /></button></div>; })}</div></ScrollArea>
          <div className="m-3 rounded-lg border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center gap-2 text-xs text-white/50"><Compass className="size-4 text-[#f18a3d]" />今日创作里程</div><div className="mt-2 flex items-end gap-1"><span className="text-base font-medium text-white">2,840</span><span className="pb-0.5 text-xs text-white/40">字</span></div></div>
        </aside>

        <section className="trail-map relative min-w-0 flex-1 overflow-auto">
          <div className="trail-path pointer-events-none" />
          <div className="sticky left-0 top-0 z-10 flex h-10 items-center justify-between border-b border-[#bdb6a8]/50 bg-[#ece5d7]/80 px-4 backdrop-blur"><span className="flex items-center gap-1.5 text-xs text-[#667369]"><Map className="size-3.5" />文章路线图 · 420px</span><div className="flex gap-2"><span className="rounded-md bg-white/70 px-2 py-1 text-xs">海拔 680m</span><span className="rounded-md bg-white/70 px-2 py-1 text-xs">5 个路标</span></div></div>
          <div className="mx-auto my-8 flex w-fit items-start gap-4 px-4">
            <div className="sticky top-16 hidden flex-col items-center xl:flex"><RouteMarker number="01" label="开场" /><RouteLine /><RouteMarker number="02" label="目的地" /><RouteLine /><RouteMarker number="03" label="行程" /></div>
            <div className="trail-paper relative w-[420px] max-w-[calc(100vw_-_2rem)] rounded-sm border border-[#b9b09e] p-1"><div className="absolute -right-3 -top-4 rotate-6 rounded-md bg-[#f18a3d] px-2 py-1 text-xs font-medium text-[#24392d] shadow">TRAIL LOG</div><div className="flex h-10 items-center justify-between border-b border-dashed border-[#c9c0af] px-3 text-xs text-[#7d776d]"><span className="flex items-center gap-1.5"><Navigation className="size-3.5" />30.413°N · 103.468°E</span><span>PAGE 01</span></div><div className="p-3"><WechatStyleWrapper><BlocksPreview blocks={demoBlocks} /></WechatStyleWrapper></div><div className="flex items-center justify-between border-t border-dashed border-[#c9c0af] px-3 py-2 text-xs text-[#7d776d]"><span>KEEP EXPLORING</span><Footprints className="size-4" /></div></div>
          </div>
        </section>

        <aside className="trail-dark hidden w-[340px] shrink-0 flex-col border-l xl:flex">
          <div className="border-b border-white/10 p-4"><div className="flex items-center gap-2"><span className="trail-orange flex size-9 items-center justify-center rounded-md"><TentTree className="size-5" /></span><div><p className="text-sm font-medium">Trail Guide AI</p><p className="text-xs text-white/45">你的户外内容向导</p></div><span className="ml-auto flex items-center gap-1 text-xs text-white/45"><span className="size-1.5 rounded-full bg-[#80c995]" />在线</span></div></div>
          <ScrollArea className="flex-1"><div className="space-y-4 p-4"><div className="trail-stitch rounded-xl bg-white/[0.05] p-3"><div className="mb-2 flex items-center gap-1.5 text-xs text-[#f18a3d]"><Sparkles className="size-3.5" />路线建议</div><p className="text-sm leading-relaxed text-white/80">建议在开头加入“4 公里轻徒步”和“夏季均温 23℃”，读者能更快判断这条路线是否适合自己。</p><div className="mt-3 flex gap-2"><Button size="sm" className="trail-orange h-7 px-3 text-xs">应用建议</Button><Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/55 hover:bg-white/10 hover:text-white">稍后</Button></div></div><div className="grid grid-cols-3 gap-2"><DataCard value="4.0" unit="km" label="路线长度" /><DataCard value="180" unit="m" label="累计爬升" /><DataCard value="2.5" unit="h" label="预计用时" /></div><p className="text-xs uppercase tracking-[0.2em] text-white/35">Quick Actions</p><div className="grid grid-cols-2 gap-2"><GuideCard icon={<MapPin />} title="补全路线" /><GuideCard icon={<Mountain />} title="优化氛围" /><GuideCard icon={<Backpack />} title="生成清单" /><GuideCard icon={<LayoutTemplate />} title="整理攻略" /></div><div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs text-white/40">当前路标</p><p className="mt-1 text-sm font-medium text-white">01 · 序 THE VIBE</p><div className="mt-3 space-y-2"><Field label="标题文字" value="序 · THE VIBE" /><Field label="字体大小" value="26 px" /></div></div></div></ScrollArea>
          <div className="border-t border-white/10 p-4"><div className="rounded-xl border border-white/10 bg-white/[0.06] p-2"><textarea rows={2} placeholder="问问路线向导…" className="w-full resize-none bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/30" /><div className="flex items-center justify-between pt-1"><button className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/45">@ 当前路标</button><button className="trail-orange flex size-8 items-center justify-center rounded-md"><ArrowUp className="size-4" /></button></div></div></div>
        </aside>
      </main>
    </div>
  );
};

const TopButton = ({ label, children }) => <Button title={label} aria-label={label} variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/60 hover:bg-white/10 hover:text-white">{children}</Button>;
const RouteMarker = ({ number, label }) => <div className="flex flex-col items-center"><span className="trail-orange trail-badge flex size-9 items-center justify-center rounded-full text-xs font-medium">{number}</span><span className="mt-2 text-xs font-medium text-[#526057]">{label}</span></div>;
const RouteLine = () => <div className="my-2 h-10 border-l-2 border-dashed border-[#de7d38]" />;
const DataCard = ({ value, unit, label }) => <div className="rounded-lg bg-white/[0.06] p-2 text-center"><div><span className="text-sm font-medium text-white">{value}</span><span className="ml-0.5 text-xs text-white/40">{unit}</span></div><p className="mt-1 text-xs text-white/35">{label}</p></div>;
const GuideCard = ({ icon, title }) => <button className="trail-card flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-left text-sm text-white/75 transition-all">{React.cloneElement(icon, { className: 'size-4 text-[#f18a3d]' })}{title}</button>;
const Field = ({ label, value }) => <div><p className="mb-1 text-xs text-white/35">{label}</p><div className="rounded-md border border-white/10 bg-black/10 px-2.5 py-1.5 text-sm text-white/75">{value}</div></div>;

export default AIStyleDemo;
