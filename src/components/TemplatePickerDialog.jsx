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
import { LayoutTemplate, CheckCircle2, Pencil, Trash2, History, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import templateStore from '@/lib/templateStore';
import ConfirmActionDialog from '@/components/ConfirmActionDialog';

const EMOJI_OPTIONS = ['📄', '📝', '🎨', '🏔️', '🎉', '📦', '💡', '🚀', '❤️', '🌟'];
const VERSION_PAGE_SIZE = 10;

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
  const [historyTpl, setHistoryTpl] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionPagination, setVersionPagination] = useState({
    page: 1,
    pageSize: VERSION_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadUserTemplates = useCallback(async () => {
    try {
      const list = await templateStore.getAll();
      setUserTemplates(list);
    } catch {
      toast.error('加载模板失败');
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUserTemplates();
    }
  }, [open, loadUserTemplates]);

  const filtered = activeCategory === 'all'
    ? [...templates, ...userTemplates]
    : activeCategory === 'my-templates'
      ? userTemplates
      : templates.filter((t) => t.category === activeCategory);

  const handleApply = (tpl) => {
    let counter = Date.now();
    const freshBlocks = tpl.blocks.map((b) => ({
      ...b,
      id: `block_${counter++}_tpl`,
      props: b.props ? { ...b.props } : undefined,
    }));
    onApply(freshBlocks, {
      id: tpl.id,
      name: tpl.name,
      version: tpl.version,
      source: userTemplates.some((item) => item.id === tpl.id) ? 'user' : 'built-in',
    });
    onClose();
  };

  const deleteTemplate = async (id) => {
    await templateStore.remove(id);
    toast.success('模板已删除');
    loadUserTemplates();
  };

  const handleDelete = (tpl) => {
    setConfirmAction({
      type: 'delete',
      title: '删除模板',
      description: `确定删除「${tpl.name}」吗？删除后该模板及版本历史都会被移除，无法恢复。`,
      confirmText: '删除',
      destructive: true,
      onConfirm: () => deleteTemplate(tpl.id),
    });
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

  const loadVersionsPage = async (templateId, page = 1) => {
    const result = await templateStore.getVersions(templateId, {
      page,
      pageSize: VERSION_PAGE_SIZE,
    });
    setVersions(result.items || []);
    setVersionPagination({
      page: result.page || 1,
      pageSize: result.pageSize || VERSION_PAGE_SIZE,
      total: result.total || 0,
      totalPages: result.totalPages || 1,
    });
  };

  const openVersions = async (tpl) => {
    setHistoryTpl(tpl);
    setVersions([]);
    setLoadingVersions(true);
    try {
      await loadVersionsPage(tpl.id, 1);
    } catch (error) {
      toast.error('加载版本失败：' + error.message);
    } finally {
      setLoadingVersions(false);
    }
  };

  const changeVersionPage = async (page) => {
    if (!historyTpl) return;
    setLoadingVersions(true);
    try {
      await loadVersionsPage(historyTpl.id, page);
    } catch (error) {
      toast.error('加载版本失败：' + error.message);
    } finally {
      setLoadingVersions(false);
    }
  };

  const restoreVersionNow = async (version) => {
    if (!historyTpl) return;
    try {
      const saved = await templateStore.restoreVersion(historyTpl.id, version);
      toast.success(`已恢复到 v${version}`);
      setHistoryTpl(saved);
      await loadVersionsPage(saved.id, versionPagination.page);
      loadUserTemplates();
    } catch (error) {
      toast.error('恢复失败：' + error.message);
    }
  };

  const restoreVersion = (version) => {
    setConfirmAction({
      type: 'restore',
      title: '恢复版本',
      description: `确定将「${historyTpl?.name || '模板'}」恢复到 v${version} 吗？当前内容不会丢失，系统会创建一个新的当前版本。`,
      confirmText: '恢复',
      destructive: false,
      onConfirm: () => restoreVersionNow(version),
    });
  };

  const isUserTemplate = (tpl) => userTemplates.some((item) => item.id === tpl.id);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-lg">
        {/* 头部 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <LayoutTemplate size={20} className="text-brand" />
            选择模板
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            选择一个模板快速开始创作，模板内容将替换当前编辑器中的所有内容
          </DialogDescription>
        </DialogHeader>

        {/* 分类 Tab */}
        <div className="flex gap-2 px-6 pt-4 pb-2">
          {templateCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {editingTpl && (
            <div className="rounded-lg border bg-muted p-4 mb-3">
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
                      className={`w-8 h-8 rounded text-base flex items-center justify-center ${
                        editCover === emoji
                          ? 'bg-background ring-[3px] ring-ring/50'
                          : 'bg-background hover:bg-muted'
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

          {historyTpl && (
            <div className="rounded-lg border bg-muted p-4 mb-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">版本历史：{historyTpl.name}</div>
                  <div className="text-xs text-muted-foreground">
                    共 {versionPagination.total} 个版本，恢复历史版本会创建新的当前版本
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setHistoryTpl(null)}>
                  关闭
                </Button>
              </div>
              {loadingVersions ? (
                <div className="py-6 text-sm text-muted-foreground text-center">加载中...</div>
              ) : versions.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground text-center">暂无版本记录</div>
              ) : (
                <>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {versions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">v{item.version}</span>
                            {item.version === historyTpl.version && (
                              <Badge variant="secondary" className="text-xs border-0">当前</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {item.note && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.note}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreVersion(item.version)}
                          disabled={item.version === historyTpl.version}
                          className="shrink-0"
                        >
                          <RotateCcw size={14} className="mr-1" />
                          恢复
                        </Button>
                      </div>
                    ))}
                  </div>
                  {versionPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeVersionPage(versionPagination.page - 1)}
                        disabled={loadingVersions || versionPagination.page <= 1}
                      >
                        上一页
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {versionPagination.page} / {versionPagination.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeVersionPage(versionPagination.page + 1)}
                        disabled={loadingVersions || versionPagination.page >= versionPagination.totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p>还没有保存过模板</p>
              <p className="mt-1">在编辑器中点击「另存新模板」来保存当前内容</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 mt-2">
              {filtered.map((tpl) => {
                const isHovered = hoveredId === tpl.id;
                const isUser = isUserTemplate(tpl);
                return (
                  <div
                    key={tpl.id}
                    onMouseEnter={() => setHoveredId(tpl.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      isHovered
                        ? 'border-ring bg-muted'
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-3xl flex-shrink-0">
                        {tpl.cover}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-base">{tpl.name}</h3>
                          {tpl.category && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-muted text-muted-foreground border-0"
                            >
                              {tpl.category}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            共 {tpl.blocks.length} 个块
                          </span>
                          {tpl.updatedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(tpl.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                          {tpl.version && (
                            <span className="text-xs text-muted-foreground">
                              v{tpl.version}
                            </span>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {tpl.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getBlockSummary(tpl.blocks).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded bg-background text-muted-foreground"
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
                              ? 'bg-primary hover:bg-primary/80 text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                          }`}
                        >
                          <CheckCircle2 size={14} className="mr-1" />
                          使用
                        </Button>
                        {isUser && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(tpl)}
                              className="h-7 px-2 text-xs"
                              title="编辑"
                            >
                              <Pencil size={14} className="mr-1" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openVersions(tpl)}
                              className="h-7 px-2 text-xs"
                              title="版本历史"
                            >
                              <History size={14} className="mr-1" />
                              版本
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(tpl)}
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="删除"
                            >
                              <Trash2 size={14} className="mr-1" />
                              删除
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
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
