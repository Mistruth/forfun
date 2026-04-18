import React, { useRef } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ImageGenerator = ({ children }) => {
  const contentRef = useRef(null);

  const generateImage = async (format = 'png') => {
    // 查找预览区域的内容
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ImageGenerator;
