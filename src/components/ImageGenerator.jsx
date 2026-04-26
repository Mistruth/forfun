import React, { useState } from 'react';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, ChevronDown, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadImageSlices,
  getExportElementHeight,
  getNonBreakingSliceRanges,
} from '@/lib/exportSlices';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DEFAULT_SLICE_HEIGHT = 2000;

const ImageGenerator = () => {
  const [sliceHeight, setSliceHeight] = useState(DEFAULT_SLICE_HEIGHT);

  const generateImage = async (format = 'png') => {
    const previewElement = document.querySelector('.preview-content-for-export');
    if (!previewElement) {
      toast.error('内容未准备好');
      return;
    }

    try {
      const element = previewElement;
      const options = {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      };

      let dataUrl;
      let filename;

      if (format === 'png') {
        dataUrl = await toPng(element, options);
        filename = 'wechat-article.png';
      } else {
        dataUrl = await toJpeg(element, { ...options, quality: 0.95 });
        filename = 'wechat-article.jpg';
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('图片生成成功！');
    } catch (error) {
      console.error('生成图片失败:', error);
      toast.error('生成图片失败，请重试');
    }
  };

  const generateSlicedImage = async (format = 'png') => {
    const previewElement = document.querySelector('.preview-content-for-export');
    if (!previewElement) {
      toast.error('内容未准备好');
      return;
    }

    try {
      const options = { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' };
      const blob = await toBlob(previewElement, {
        ...options,
        type: format === 'png' ? 'image/png' : 'image/jpeg',
        ...(format === 'jpg' ? { quality: 0.95 } : {}),
      });

      const ranges = getNonBreakingSliceRanges(previewElement, sliceHeight);
      const count = await downloadImageSlices(
        blob,
        format,
        ranges,
        getExportElementHeight(previewElement)
      );
      toast.success(`已切成 ${count} 段并导出！`);
    } catch (error) {
      console.error('分段导出失败:', error);
      toast.error('分段导出失败，请重试');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <ImageIcon size={14} />
          导出图片
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => generateImage('png')}>
          <ImageIcon size={14} className="mr-2" />
          导出 PNG 格式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateImage('jpg')}>
          <Download size={14} className="mr-2" />
          导出 JPG 格式
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Scissors size={14} />
          分段导出（每段 {sliceHeight}px）
          <input
            type="number"
            min={500}
            max={20000}
            step={100}
            value={sliceHeight}
            onChange={(e) => setSliceHeight(Math.max(500, Number(e.target.value) || DEFAULT_SLICE_HEIGHT))}
            onClick={(e) => e.stopPropagation()}
            className="w-16 h-6 text-xs border rounded px-1 ml-auto"
          />
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generateSlicedImage('png')}>
          <Scissors size={14} className="mr-2" />
          分段导出 PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateSlicedImage('jpg')}>
          <Scissors size={14} className="mr-2" />
          分段导出 JPG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ImageGenerator;
