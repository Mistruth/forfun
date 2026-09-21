import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, ChevronDown, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadElementSlices,
  getExportElementHeight,
  getNonBreakingSliceRanges,
  MAX_EXPORT_FILE_BYTES,
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
export const getFontEmbedCSS = async () => {
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
export const MIN_EXPORT_WIDTH = 1440;
export const MAX_EXPORT_PIXEL_RATIO = 5;
export const MAX_EXPORT_CANVAS_DIMENSION = 16000;

export const getExportPixelRatio = (element) => {
  const width = element.getBoundingClientRect().width || element.offsetWidth || 420;
  return Math.min(
    MAX_EXPORT_PIXEL_RATIO,
    Math.max(2, MIN_EXPORT_WIDTH / width),
  );
};

export const getExportDimensions = (element, pixelRatio = getExportPixelRatio(element)) => ({
  width: Math.round((element.getBoundingClientRect().width || element.offsetWidth) * pixelRatio),
  height: Math.round(getExportElementHeight(element) * pixelRatio),
});

export const isSingleImageSafe = (element, pixelRatio = getExportPixelRatio(element)) => {
  const { width, height } = getExportDimensions(element, pixelRatio);
  return width <= MAX_EXPORT_CANVAS_DIMENSION && height <= MAX_EXPORT_CANVAS_DIMENSION;
};

export const getSafeSliceHeight = (pixelRatio, requestedHeight) => Math.max(
  1,
  Math.min(requestedHeight, Math.floor(MAX_EXPORT_CANVAS_DIMENSION / pixelRatio)),
);

const ImageGenerator = () => {
  const [sliceHeight, setSliceHeight] = useState(DEFAULT_SLICE_HEIGHT);

  const getSuccessMessage = (count, width, largestBytes, reducedCount = 0, automatic = false) => {
    const size = (largestBytes / 1_000_000).toFixed(2);
    const compression = reducedCount > 0
      ? `；为保留完整内容块，已自动缩小 ${reducedCount} 张`
      : '';
    if (count === 1) return `图片生成成功，约 ${width}px 宽，${size}MB${compression}`;
    return `${automatic ? '内容或文件较大，已自动' : '已'}按完整内容块分段导出 ${count} 张，每张不超过 3MB（最大 ${size}MB）${compression}`;
  };

  const generateSlicedImage = async (format = 'png', automatic = false) => {
    const previewElement = document.querySelector('.preview-content-for-export');
    if (!previewElement) {
      toast.error('内容未准备好');
      return;
    }

    try {
      const fontEmbedCSS = await getFontEmbedCSS();
      const pixelRatio = getExportPixelRatio(previewElement);
      const options = {
        quality: format === 'png' ? 1 : 0.98,
        pixelRatio,
        backgroundColor: '#ffffff',
        fontEmbedCSS,
      };
      const safeSliceHeight = getSafeSliceHeight(pixelRatio, sliceHeight);
      const ranges = getNonBreakingSliceRanges(previewElement, safeSliceHeight);
      const { count, width, largestBytes, reducedCount } = await downloadElementSlices(
        previewElement,
        format,
        ranges,
        { ...options, maxBytes: MAX_EXPORT_FILE_BYTES },
      );
      toast.success(getSuccessMessage(count, width, largestBytes, reducedCount, automatic));
    } catch (error) {
      console.error('分段导出失败:', error);
      toast.error(error?.message || '分段导出失败，请重试');
    }
  };

  const generateImage = async (format = 'png') => {
    const previewElement = document.querySelector('.preview-content-for-export');
    if (!previewElement) {
      toast.error('内容未准备好');
      return;
    }

    const element = previewElement;
    const pixelRatio = getExportPixelRatio(element);
    if (!isSingleImageSafe(element, pixelRatio)) {
      toast.info('内容较长，为避免画质下降，将自动高清分段导出');
      await generateSlicedImage(format, true);
      return;
    }

    try {
      const fontEmbedCSS = await getFontEmbedCSS();
      const fullRange = { start: 0, end: Math.ceil(getExportElementHeight(element)) };
      const { count, width, largestBytes, reducedCount } = await downloadElementSlices(
        element,
        format,
        [fullRange],
        {
          quality: format === 'png' ? 1 : 0.98,
          pixelRatio,
          backgroundColor: '#ffffff',
          fontEmbedCSS,
          maxBytes: MAX_EXPORT_FILE_BYTES,
        },
      );
      toast.success(getSuccessMessage(count, width, largestBytes, reducedCount, count > 1));
    } catch (error) {
      console.error('生成图片失败:', error);
      toast.error(error?.message || '生成图片失败，请重试');
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
