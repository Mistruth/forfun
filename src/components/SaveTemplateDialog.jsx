import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import templateStore from '@/lib/templateStore';

const EMOJI_OPTIONS = ['📄', '📝', '🎨', '🏔️', '🎉', '📦', '💡', '🚀', '❤️', '🌟'];

const SaveTemplateDialog = ({ open, onClose, blocks }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState('📄');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('请输入模板名称');
      return;
    }
    setSaving(true);
    try {
      await templateStore.save({
        id: `tpl_user_${Date.now()}`,
        name: trimmedName,
        description: description.trim(),
        category: '我的模板',
        cover,
        blocks: JSON.parse(JSON.stringify(blocks)),
      });
      toast.success(`模板「${trimmedName}」已保存`);
      setName('');
      setDescription('');
      setCover('📄');
      onClose();
    } catch (e) {
      toast.error('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save size={18} />
            保存为模板
          </DialogTitle>
          <DialogDescription>将当前编辑内容保存为可复用的模板</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：周末活动推文模板"
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">模板描述</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述模板用途（可选）"
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">封面图标</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setCover(emoji)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                    cover === emoji
                      ? 'bg-green-100 ring-2 ring-green-400 scale-110'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? '保存中...' : '保存模板'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateDialog;
