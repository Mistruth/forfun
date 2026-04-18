import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ImageGenerator from '@/components/ImageGenerator';
import { CardContent, Card } from '@/components/ui/card';
import { toast } from 'sonner';
import CustomComponentPanel from '@/components/CustomComponentPanel';
import BlockEditor from '@/components/BlockEditor';
import ComponentConfigDrawer from '@/components/ComponentConfigDrawer';
import { RotateCcw, Copy, PanelLeftClose, Sparkles, PanelLeft, ChevronLeft, Smartphone, LayoutTemplate } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatePickerDialog from '@/components/TemplatePickerDialog';
import MarkdownPreview from '@/components/MarkdownPreview';
import BlocksPreview from '@/components/BlocksPreview';
import WechatStyleWrapper from '@/components/WechatStyleWrapper';
import { Button } from '@/components/ui/button';
import { customComponents } from '@/components/CustomComponentDefinitions';

// 生成唯一 id
let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;

const defaultBlocks = [];

// 将 blocks 转换为用于预览/导出的 HTML+Markdown 混合字符串
const blocksToContent = (blocks) => {
  return blocks.map(block => {
    if (block.type === 'markdown') return block.content || '';
    if (block.type === 'custom') {
      const compDef = customComponents.find(c => c.id === block.componentId);
      if (!compDef) return '';
      return compDef.renderFn(block.props || compDef.defaultProps);
    }
    return '';
  }).join('\n\n');
};

const Index = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [showComponentPanel, setShowComponentPanel] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // 当前选中的块
  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId && b.type === 'custom') || null,
    [blocks, selectedBlockId]
  );

  // 预览内容（仅用于复制文本）
  const previewContent = useMemo(() => blocksToContent(blocks), [blocks]);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    toast.success('内容已复制到剪贴板');
  };

  const handleReset = () => {
    setBlocks(defaultBlocks);
    setSelectedBlockId(null);
    toast.success('已重置为默认内容');
  };

  // 应用模板
  const handleApplyTemplate = useCallback((templateBlocks) => {
    setBlocks(templateBlocks);
    setSelectedBlockId(null);
    toast.success('模板已加载，开始编辑吧！');
  }, []);

  const handleClear = () => {
    setBlocks([]);
    setSelectedBlockId(null);
    toast.success('内容已清空');
  };

  // 插入自定义组件块
  const handleInsertComponent = useCallback((template, componentId, defaultProps) => {
    const newBlock = {
      id: genId(),
      type: 'custom',
      componentId,
      props: { ...defaultProps },
    };
    setBlocks(prev => [...prev, newBlock]);
    toast.success(`已插入「${customComponents.find(c => c.id === componentId)?.name || '组件'}」`);
  }, []);

  // 更新组件 props（来自抽屉配置）
  const handleUpdateBlockProps = useCallback((blockId, newProps) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: newProps } : b));
  }, []);

  // 选中块
  const handleSelectBlock = useCallback((blockId) => {
    setSelectedBlockId(prev => prev === blockId ? null : blockId);
  }, []);

  // 关闭抽屉
  const handleCloseDrawer = useCallback(() => {
    setSelectedBlockId(null);
  }, []);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 最左侧：组件面板 */}
      {showComponentPanel && (
        <div className="w-72 flex-shrink-0 bg-white border-r shadow-sm flex flex-col">
          <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                组件面板
              </h2>
              <p className="text-xs text-gray-500 mt-1">点击插入到编辑器</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComponentPanel(false)}
              className="h-8 w-8 p-0 hover:bg-white/50"
              title="收起面板"
            >
              <ChevronLeft size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CustomComponentPanel onInsert={handleInsertComponent} />
          </div>
        </div>
      )}

      {/* 中间：块编辑器 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 编辑器头部 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={showComponentPanel ? 'outline' : 'default'}
              size="sm"
              onClick={() => setShowComponentPanel(!showComponentPanel)}
              title={showComponentPanel ? '收起组件面板' : '展开组件面板'}
              className="flex items-center gap-1"
            >
              {showComponentPanel ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              <span className="hidden sm:inline">{showComponentPanel ? '收起面板' : '组件面板'}</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h2 className="font-bold text-gray-800">块编辑器</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <LayoutTemplate size={14} />
              <span className="hidden sm:inline">模板</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/mobile')}
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">移动端</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-1"
            >
              <Copy size={14} />
              复制
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <RotateCcw size={14} />
              重置
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
            >
              清空
            </Button>
          </div>
        </div>

        {/* 编辑器内容 */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full shadow-lg rounded-none border-0">
            <CardContent className="p-0 h-full overflow-auto">
              <BlockEditor
                blocks={blocks}
                onChange={setBlocks}
                onSelectBlock={handleSelectBlock}
                selectedBlockId={selectedBlockId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右侧：预览区 */}
      <div className="w-[520px] flex-shrink-0 bg-white border-l shadow-sm flex flex-col">
        {/* 预览区头部 */}
        <div className="p-3 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={18} className="text-green-600" />
            实时预览
          </h2>
          <ImageGenerator>
            <WechatStyleWrapper>
              <BlocksPreview blocks={blocks} />
            </WechatStyleWrapper>
          </ImageGenerator>
        </div>

        {/* 预览内容 */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="preview-content-for-export overflow-hidden">
              <div className="p-6">
                <WechatStyleWrapper>
                  <BlocksPreview blocks={blocks} />
                </WechatStyleWrapper>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* 底部提示 */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            💡 点击右上角按钮生成高清图片
          </p>
        </div>
      </div>

      {/* 右侧抽屉配置面板 */}
      {selectedBlock && (
        <ComponentConfigDrawer
          block={selectedBlock}
          onUpdate={handleUpdateBlockProps}
          onClose={handleCloseDrawer}
        />
      )}

      {/* 模板选择弹窗 */}
      <TemplatePickerDialog
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onApply={handleApplyTemplate}
      />
    </div>
  );
};

export default Index;
