const EXPORT_BLOCK_SELECTOR = '[data-export-block="true"]';

export const loadBlobAsImage = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });

const getElementHeight = (element) => {
  const rectHeight = element.getBoundingClientRect().height;
  return Math.max(element.scrollHeight, rectHeight);
};

const getExportBlockBounds = (element) => {
  const containerRect = element.getBoundingClientRect();
  return Array.from(element.querySelectorAll(EXPORT_BLOCK_SELECTOR))
    .map((node) => {
      const rects = [node, ...node.querySelectorAll('*')]
        .map((child) => child.getBoundingClientRect())
        .filter((rect) => rect.height > 0);

      if (!rects.length) return null;

      const top = Math.min(...rects.map((rect) => rect.top));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));

      return {
        top: Math.max(0, top - containerRect.top),
        bottom: Math.max(0, bottom - containerRect.top),
      };
    })
    .filter(Boolean)
    .filter(({ bottom, top }) => bottom > top)
    .sort((a, b) => a.top - b.top);
};

const pushRange = (ranges, start, end) => {
  const normalizedStart = Math.max(0, Math.floor(start));
  const normalizedEnd = Math.max(normalizedStart, Math.ceil(end));
  if (normalizedEnd > normalizedStart) {
    ranges.push({ start: normalizedStart, end: normalizedEnd });
  }
};

export const getNonBreakingSliceRanges = (element, sliceHeight) => {
  const totalHeight = getElementHeight(element);
  const blockBounds = getExportBlockBounds(element);

  if (!blockBounds.length) {
    const ranges = [];
    for (let start = 0; start < totalHeight; start += sliceHeight) {
      pushRange(ranges, start, Math.min(start + sliceHeight, totalHeight));
    }
    return ranges;
  }

  const ranges = [];
  let start = 0;
  let index = 0;

  while (start < totalHeight) {
    const limit = start + sliceHeight;
    let end = Math.min(limit, totalHeight);

    while (index < blockBounds.length && blockBounds[index].bottom <= start) {
      index += 1;
    }

    const crossingBlock = blockBounds
      .slice(index)
      .find((block) => block.top < limit && block.bottom > limit);

    if (crossingBlock) {
      if (crossingBlock.top > start) {
        end = crossingBlock.top;
      } else {
        end = crossingBlock.bottom;
      }
    }

    pushRange(ranges, start, Math.min(end, totalHeight));
    start = Math.min(end, totalHeight);
  }

  return ranges;
};

export const downloadImageSlices = async (blob, format, ranges, elementHeight) => {
  const img = await loadBlobAsImage(blob);
  const scaleY = img.height / elementHeight;
  const ext = format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? undefined : 0.95;

  for (let i = 0; i < ranges.length; i += 1) {
    const sourceY = Math.round(ranges[i].start * scaleY);
    const sourceHeight = Math.min(
      img.height - sourceY,
      Math.max(1, Math.round((ranges[i].end - ranges[i].start) * scaleY))
    );
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, sourceY, img.width, sourceHeight, 0, 0, img.width, sourceHeight);

    const dataUrl = quality
      ? canvas.toDataURL(mimeType, quality)
      : canvas.toDataURL(mimeType);
    const link = document.createElement('a');
    link.download = `wechat-article_${i + 1}.${ext}`;
    link.href = dataUrl;
    link.click();
  }

  return ranges.length;
};

export const getExportElementHeight = getElementHeight;
