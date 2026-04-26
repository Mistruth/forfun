import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { templates, templateCategories } from './Templates';
import { LayoutTemplate, CheckCircle2, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import templateStore from '@/lib/templateStore';

const EMOJI_OPTIONS = ['📄', '📝', '🎨', '🏔️', '🎉', '📦', '💡', '🚀', '❤️', '🌟'];

/**
 * 模板选择弹窗
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onApply: (blocks: Block[]) => void
 */
const TemplatePickerDialog = ({ open, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [userTemplates, setUserTemplates] = useState([]);
  const [editingTpl, setEditingTpl] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCover, setEditCover] = useState('📄');

  const loadUserTemplates = useCallback(async () => {
    try {
      const list = await templateStore.getAll();
      setUserTemplates(list);
    } catch {
      toast.error('加载模板失败');
    }
  }, []);

  useEffect(() => {
    if (open && activeCategory === 'my-templates') {
      loadUserTemplates();
    }
  }, [open, activeCategory, loadUserTemplates]);

  const filtered =
    activeCategory === 'all'
      ? templates
      : activeCategory === 'my-templates'
        ? []
        : templates.filter((t) => t.category === activeCategory);

  const handleApply = (tpl) => {
    let counter = Date.now();
    const freshBlocks = tpl.blocks.map((b) => ({
      ...b,
      id: `block_${counter++}_tpl`,
      props: b.props ? { ...b.props } : undefined,
    }));
    onApply(freshBlocks);
    onClose();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该模板？')) return;
    await templateStore.remove(id);
    toast.success('模板已删除');
    loadUserTemplates();
  };

  const handleExport = async (id) => {
    try {
      await templateStore.exportTemplate(id);
      toast.success('模板已导出');
    } catch {
      toast.error('导出失败');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await templateStore.importTemplate(text);
        toast.success('模板导入成功');
        loadUserTemplates();
      } catch (err) {
        toast.error(err.message || '导入失败');
      }
    };
    input.click();
  };

  const startEdit = (tpl) => {
    setEditingTpl(tpl.id);
    setEditName(tpl.name);
    setEditDesc(tpl.description);
    setEditCover(tpl.cover);
  };

  const saveEdit = async () => {
    const tpl = userTemplates.find((t) => t.id === editingTpl);
    if (!tpl) return;
    await templateStore.save({
      ...tpl,
      name: editName.trim() || tpl.name,
      description: editDesc.trim(),
      cover: editCover,
    });
    setEditingTpl(null);
    toast.success('模板已更新');
    loadUserTemplates();
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
          {/* 我的模板 - 特殊渲染 */}
          {activeCategory === 'my-templates' ? (
            <>
              <div className="flex items-center justify-between mt-2 mb-3">
                <span className="text-sm text-gray-500">
                  共 {userTemplates.length} 个模板
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImport}
                  className="flex items-center gap-1"
                >
                  <Upload size={14} />
                  导入模板
                </Button>
              </div>

              {editingTpl && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4 mb-3">
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="模板名称"
                    />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="模板描述（可选）"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setEditCover(emoji)}
                          className={`w-8 h-8 rounded text-lg flex items-center justify-center ${
                            editCover === emoji
                              ? 'bg-blue-100 ring-2 ring-blue-400'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingTpl(null)}>
                        取消
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {userTemplates.length === 0 && !editingTpl ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>还没有保存过模板</p>
                  <p className="mt-1">在编辑器中点击「存为模板」来保存当前内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {userTemplates.map((tpl) => {
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
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                            {tpl.cover}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-800 text-base">{tpl.name}</h3>
                              <span className="text-xs text-gray-400">
                                共 {tpl.blocks.length} 个块
                              </span>
                              {tpl.updatedAt && (
                                <span className="text-xs text-gray-300">
                                  {new Date(tpl.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {tpl.description && (
                              <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                {tpl.description}
                              </p>
                            )}
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
                          <div className="flex flex-col gap-1 flex-shrink-0">
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
                              使用
                            </Button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEdit(tpl)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                                title="编辑"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleExport(tpl.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-500 transition-colors"
                                title="导出"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(tpl.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                                title="删除"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* 内置模板列表（保持原有逻辑） */
            <>
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
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                            {tpl.cover}
                          </div>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getBlockSummary(blocks) {
  const counts = {};
  const nameMap = {
    'chapter-title': '篇章标题',
    'body-text': '正文',
    'image-block': '图片',
    markdown: 'Markdown',
    'image-text-card': '图文卡片',
    'info-card': '信息卡片',
    'checklist': '清单',
    'quote-block': '引用',
    'tip-box': '提示框',
    'stats-bar': '数据指标',
    'divider': '分隔线',
  };
  blocks.forEach((b) => {
    const key = b.type === 'custom' ? b.componentId : b.type;
    const label = nameMap[key] || key;
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.entries(counts).map(([label, count]) => `${label} x${count}`);
}

export default TemplatePickerDialog;
