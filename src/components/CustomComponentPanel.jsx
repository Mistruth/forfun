import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Grid, Type, Square, Quote, Minus, List, AlignLeft, 
  Image, MousePointer, Layout, BarChart, Sparkles,
  Search, Plus, Eye
} from 'lucide-react';
import { customComponents, componentCategories } from './CustomComponentDefinitions';

const iconMap = {
  Grid, Type, Square, Quote, Minus, List, AlignLeft, 
  Image, MousePointer, Layout, BarChart, Sparkles
};

const CustomComponentPanel = ({ onInsert }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewComponent, setPreviewComponent] = useState(null);

  // 过滤组件
  const filteredComponents = customComponents.filter(comp => {
    const matchCategory = activeCategory === 'all' || comp.category === activeCategory;
    const matchSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       comp.preview.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleInsert = (component) => {
    onInsert(component.template, component.id, component.defaultProps);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="搜索组件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-3 py-2 border-b">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex gap-2">
            {componentCategories.map(cat => {
              const IconComponent = iconMap[cat.icon] || Grid;
              return (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="h-7 px-3 text-xs shrink-0"
                >
                  <IconComponent size={12} className="mr-1" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 组件列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3 grid grid-cols-1 gap-2">
          {filteredComponents.map(comp => (
            <Card 
              key={comp.id} 
              className="group hover:shadow-md transition-all cursor-pointer border"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-800 truncate">{comp.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">{comp.preview}</p>
                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {comp.category}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setPreviewComponent(comp)}
                      title="预览"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleInsert(comp)}
                      title="插入"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredComponents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">未找到匹配的组件</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 预览弹窗 */}
      {previewComponent && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPreviewComponent(null)}
        >
          <Card 
            className="max-w-lg w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{previewComponent.name}</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewComponent(null)}
                >
                  关闭
                </Button>
              </div>
              <div 
                className="bg-white border rounded-lg p-4 min-h-[100px]"
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
