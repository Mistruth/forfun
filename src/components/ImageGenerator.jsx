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

import fangYuanUrl from '@/assets/AlimamaFangYuanTiVF/AlimamaFangYuanTiVF-Thin.woff2?url';
import agileUrl from '@/assets/AlimamaAgileVF/AlimamaAgileVF-Thin.woff2?url';

const toDataUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

let _fontEmbedCSSCache = null;
const getFontEmbedCSS = async () => {
  if (_fontEmbedCSSCache) return _fontEmbedCSSCache;
  const [fangYuanData, agileData] = await Promise.all([
    toDataUrl(fangYuanUrl),
    toDataUrl(agileUrl),
  ]);
  _fontEmbedCSSCache = `
@font-face {
  font-family: 'AlimamaFangYuanTi';
  src: url(${fangYuanData}) format('woff2');
  font-weight: 100 900;
  font-style: normal;
}
@font-face {
  font-family: 'AlimamaAgile';
  src: url(${agileData}) format('woff2');
  font-weight: 100 900;
  font-style: normal;
}`;
  return _fontEmbedCSSCache;
};

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
      const fontEmbedCSS = await getFontEmbedCSS();
      const options = {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS,
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
      const fontEmbedCSS = await getFontEmbedCSS();
      const options = { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS };
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
