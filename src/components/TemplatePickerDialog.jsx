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
import { LayoutTemplate, Pencil, Trash2, History, RotateCcw } from 'lucide-react';
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
      if (!Array.isArray(list)) {
        throw new TypeError('模板列表响应格式不正确');
      }
      setUserTemplates(list);
    } catch (error) {
      setUserTemplates([]);
      console.error('加载模板失败', error);
      toast.error('加载模板失败');
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUserTemplates();
    }
  }, [open, loadUserTemplates]);

  const filtered = (activeCategory === 'all'
    ? [...templates, ...userTemplates]
    : activeCategory === 'my-templates'
      ? userTemplates
      : templates.filter((t) => t.category === activeCategory))
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl p-0 overflow-hidden rounded-lg">
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

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p>还没有保存过模板</p>
              <p className="mt-1">在编辑器中点击「另存新模板」来保存当前内容</p>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[820px] table-fixed text-left">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-[25%] px-4 py-2.5 font-medium">模板</th>
                    <th className="w-[27%] px-4 py-2.5 font-medium">描述</th>
                    <th className="w-[18%] px-4 py-2.5 font-medium">内容</th>
                    <th className="w-[13%] px-4 py-2.5 font-medium">创建时间</th>
                    <th className="w-[17%] px-4 py-2.5 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((tpl) => {
                    const isUser = isUserTemplate(tpl);
                    return (
                      <tr key={tpl.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 align-top">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-base">{tpl.cover}</span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{tpl.name}</div>
                              <div className="mt-1 flex items-center gap-1.5">
                                {tpl.category && <Badge variant="secondary" className="border-0 text-xs font-normal">{tpl.category}</Badge>}
                                <span className="text-xs text-muted-foreground">{tpl.blocks.length} 个块</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                          <p className="line-clamp-2 leading-relaxed">{tpl.description || '暂无描述'}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {getBlockSummary(tpl.blocks).slice(0, 3).map((item) => <span key={item} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{item}</span>)}
                            {getBlockSummary(tpl.blocks).length > 3 && <span className="px-1 py-0.5 text-xs text-muted-foreground">+{getBlockSummary(tpl.blocks).length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                          {tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString() : '内置模板'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {tpl.version && <span className="mr-1 text-xs text-muted-foreground">v{tpl.version}</span>}
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleApply(tpl)}>使用</Button>
                            {isUser && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(tpl)} aria-label={`编辑${tpl.name}`} title="编辑"><Pencil size={14} /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openVersions(tpl)} aria-label={`查看${tpl.name}版本历史`} title="版本历史"><History size={14} /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(tpl)} aria-label={`删除${tpl.name}`} title="删除"><Trash2 size={14} /></Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
      <Dialog open={Boolean(historyTpl)} onOpenChange={(nextOpen) => !nextOpen && setHistoryTpl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">版本历史：{historyTpl?.name}</DialogTitle>
            <DialogDescription>
              共 {versionPagination.total} 个版本，恢复历史版本会创建一个新的当前版本。
            </DialogDescription>
          </DialogHeader>
          {loadingVersions ? (
            <div className="py-12 text-center text-sm text-muted-foreground">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">暂无版本记录</div>
          ) : (
            <>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
                <div className="divide-y divide-border">
                  {versions.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">v{item.version}</span>
                          {item.version === historyTpl?.version && <Badge variant="secondary" className="border-0 text-xs">当前</Badge>}
                          <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        {item.note && <p className="mt-1 truncate text-xs text-muted-foreground">{item.note}</p>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => restoreVersion(item.version)} disabled={item.version === historyTpl?.version} className="shrink-0">
                        <RotateCcw size={14} className="mr-1" />恢复
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              {versionPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={() => changeVersionPage(versionPagination.page - 1)} disabled={loadingVersions || versionPagination.page <= 1}>上一页</Button>
                  <span className="text-xs text-muted-foreground">{versionPagination.page} / {versionPagination.totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => changeVersionPage(versionPagination.page + 1)} disabled={loadingVersions || versionPagination.page >= versionPagination.totalPages}>下一页</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
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
