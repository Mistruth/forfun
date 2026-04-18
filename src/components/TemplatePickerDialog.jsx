import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templates, templateCategories } from './Templates';
import { LayoutTemplate, CheckCircle2 } from 'lucide-react';

/**
 * 模板选择弹窗
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onApply: (blocks: Block[]) => void  — 应用模板（替换当前 blocks）
 */
const TemplatePickerDialog = ({ open, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  const handleApply = (tpl) => {
    // 深拷贝 blocks，并重新生成 id 避免冲突
    let counter = Date.now();
    const freshBlocks = tpl.blocks.map((b) => ({
      ...b,
      id: `block_${counter++}_tpl`,
      props: b.props ? { ...b.props } : undefined,
    }));
    onApply(freshBlocks);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-2xl">
        {/* 头部 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <LayoutTemplate size={20} className="text-green-600" />
            选择模板
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            选择一个模板快速开始创作，模板内容将替换当前编辑器中的所有内容
          </DialogDescription>
        </DialogHeader>

        {/* 分类 Tab */}
        <div className="flex gap-2 px-6 pt-4 pb-2">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">暂无模板</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 mt-2">
              {filtered.map((tpl) => {
                const isHovered = hoveredId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onMouseEnter={() => setHoveredId(tpl.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      isHovered
                        ? 'border-green-400 shadow-md bg-green-50/40'
                        : 'border-gray-200 hover:border-green-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 封面图标 */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                        {tpl.cover}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800 text-base">{tpl.name}</h3>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700 border-0"
                          >
                            {tpl.category}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            共 {tpl.blocks.length} 个块
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {tpl.description}
                        </p>

                        {/* 块类型预览标签 */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getBlockSummary(tpl.blocks).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 使用按钮 */}
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApply(tpl)}
                          className={`transition-all ${
                            isHovered
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 size={14} className="mr-1" />
                          使用模板
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 统计模板中各类型块的数量，生成摘要标签
function getBlockSummary(blocks) {
  const counts = {};
  const nameMap = {
    'chapter-title': '篇章标题',
    'body-text': '正文',
    'image-block': '图片',
    markdown: 'Markdown',
  };
  blocks.forEach((b) => {
    const key = b.type === 'custom' ? b.componentId : b.type;
    const label = nameMap[key] || key;
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.entries(counts).map(([label, count]) => `${label} ×${count}`);
}

export default TemplatePickerDialog;
