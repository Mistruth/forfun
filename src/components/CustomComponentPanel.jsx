import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Eye } from 'lucide-react';
import { customComponents } from './CustomComponentDefinitions';

const CustomComponentPanel = ({ onInsert }) => {
  const [previewComponent, setPreviewComponent] = useState(null);

  // 过滤组件
  const filteredComponents = customComponents.filter(comp => !comp.hidden);

  const handleInsert = (component) => {
    onInsert(component.template, component.id, component.defaultProps);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 组件列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 grid grid-cols-2 gap-2">
          {filteredComponents.map(comp => (
            <Card
              key={comp.id} 
              className="group transition-colors cursor-pointer border shadow-none hover:bg-muted"
            >
              <CardContent className="p-1.5">
                <div className="min-h-[68px] flex flex-col">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight line-clamp-2">{comp.name}</h4>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="min-w-0 truncate text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {comp.category}
                    </span>
                    <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setPreviewComponent(comp)}
                      title="预览"
                    >
                      <Eye size={12} />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleInsert(comp)}
                      title="插入"
                    >
                      <Plus size={12} />
                    </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredComponents.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <p className="text-sm">未找到匹配的组件</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 预览弹窗 */}
      {previewComponent && (
        <div 
          className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50"
          onClick={() => setPreviewComponent(null)}
        >
          <Card 
            className="max-w-lg w-full mx-4 max-h-[80vh] overflow-auto shadow-none"
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-base">{previewComponent.name}</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewComponent(null)}
                >
                  关闭
                </Button>
              </div>
              <div 
                className="bg-background border rounded-lg p-4 min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: previewComponent.template }}
              />
              <div className="mt-4 flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    handleInsert(previewComponent);
                    setPreviewComponent(null);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  插入到编辑器
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomComponentPanel;
