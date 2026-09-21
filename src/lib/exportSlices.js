import { toCanvas } from 'html-to-image';

const EXPORT_BLOCK_SELECTOR = '[data-export-block="true"]';
const EXPORT_VIEWPORT_SELECTOR = '[data-export-slice-viewport="true"]';
const MAX_CANVAS_DIMENSION = 15900;
const MIN_ADAPTIVE_PIXEL_RATIO = 0.1;
const MIN_JPEG_QUALITY = 0.78;
export const MAX_EXPORT_FILE_BYTES = 3_000_000;
let exportInProgress = false;

const getElementHeight = (element) => {
  const rectHeight = element.getBoundingClientRect().height;
  return Math.max(element.scrollHeight, rectHeight);
};

const getNodeBounds = (node, containerRect) => {
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
};

const getExportBlockBounds = (element) => {
  const containerRect = element.getBoundingClientRect();
  return Array.from(element.querySelectorAll(EXPORT_BLOCK_SELECTOR))
    .map((node) => {
      const blockBounds = getNodeBounds(node, containerRect);
      return blockBounds ? { ...blockBounds, node } : null;
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
    return normalizedEnd;
  }
  return normalizedStart;
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
      const boundaryBeforeBlock = Math.floor(crossingBlock.top);
      if (boundaryBeforeBlock > start) {
        end = boundaryBeforeBlock;
      } else {
        // A block is atomic for export. If it is taller than the requested
        // slice, keep the entire block instead of cutting through it.
        end = Math.ceil(crossingBlock.bottom);
      }
    }

    start = pushRange(ranges, start, Math.min(end, totalHeight));
  }

  return ranges;
};

const createSliceViewport = (element, range, backgroundColor) => {
  const width = element.getBoundingClientRect().width || element.offsetWidth;
  const height = range.end - range.start;
  const viewport = document.createElement('div');
  const clone = element.cloneNode(true);

  Object.assign(viewport.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '-2147483647',
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'hidden',
    backgroundColor,
    pointerEvents: 'none',
    contain: 'layout paint style',
  });
  viewport.setAttribute('aria-hidden', 'true');
  viewport.setAttribute('data-export-slice-viewport', 'true');

  Object.assign(clone.style, {
    position: 'absolute',
    left: '0',
    top: `${-range.start}px`,
    width: `${width}px`,
    maxWidth: 'none',
    margin: '0',
  });

  viewport.appendChild(clone);
  document.body.appendChild(viewport);
  return { viewport, width, height };
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const canvasToBlob = (canvas, mimeType, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, mimeType, quality);
});

const yieldToBrowser = () => new Promise((resolve) => window.setTimeout(resolve, 0));

const cleanupSliceViewports = () => {
  document.querySelectorAll(EXPORT_VIEWPORT_SELECTOR).forEach((node) => node.remove());
};

const getWholeBlockSplitPoint = (element, range) => {
  const midpoint = Math.floor((range.start + range.end) / 2);
  const blocks = getExportBlockBounds(element)
    .filter(({ top, bottom }) => top < range.end && bottom > range.start);

  if (blocks.length < 2) return null;

  const candidates = blocks.slice(1)
    .map((block, index) => Math.floor((blocks[index].bottom + block.top) / 2))
    .filter((point) => point > range.start && point < range.end)
    .sort((a, b) => Math.abs(a - midpoint) - Math.abs(b - midpoint));
  return candidates[0] || null;
};

export const downloadElementSlices = async (element, format, ranges, options = {}) => {
  if (exportInProgress) throw new Error('已有图片正在导出，请稍候');
  exportInProgress = true;
  cleanupSliceViewports();

  const ext = format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const {
    backgroundColor = '#ffffff',
    baseName = 'wechat-article',
    maxBytes = MAX_EXPORT_FILE_BYTES,
    ...renderOptions
  } = options;
  let firstBlob = null;
  let outputCount = 0;
  let outputWidth = Infinity;
  let largestBytes = 0;
  let reducedCount = 0;
  const requestedPixelRatio = renderOptions.pixelRatio || window.devicePixelRatio || 1;
  const sourceWidth = element.getBoundingClientRect().width || element.offsetWidth;
  const requestedOutputWidth = Math.round(sourceWidth * requestedPixelRatio);

  const acceptBlob = (blob, renderedWidth) => {
    outputCount += 1;
    largestBytes = Math.max(largestBytes, blob.size);
    outputWidth = Math.min(outputWidth, renderedWidth);
    if (renderedWidth < requestedOutputWidth - 1) reducedCount += 1;

    if (outputCount === 1) {
      firstBlob = blob;
      return;
    }

    if (outputCount === 2 && firstBlob) {
      downloadBlob(firstBlob, `${baseName}_1.${ext}`);
      firstBlob = null;
    }

    downloadBlob(blob, `${baseName}_${outputCount}.${ext}`);
  };

  const renderOnce = async (range, pixelRatio, quality) => {
    const { viewport, width, height } = createSliceViewport(element, range, backgroundColor);
    const safePixelRatio = Math.min(
      pixelRatio,
      MAX_CANVAS_DIMENSION / width,
      MAX_CANVAS_DIMENSION / height,
    );
    try {
      const canvas = await toCanvas(viewport, {
        ...renderOptions,
        pixelRatio: safePixelRatio,
        width,
        height,
        canvasWidth: width,
        canvasHeight: height,
        type: mimeType,
        quality: format === 'png' ? 1 : quality,
        // Every slice is kept below the conservative canvas limit by the
        // caller. Disabling auto-scale prevents hidden quality degradation.
        skipAutoScale: true,
      });
      const blob = await canvasToBlob(
        canvas,
        mimeType,
        format === 'png' ? 1 : quality,
      );
      return {
        blob,
        pixelRatio: safePixelRatio,
        quality,
        outputWidth: Math.round(width * safePixelRatio),
      };
    } finally {
      viewport.remove();
    }
  };

  const renderRange = async (range) => {
    let rendered = await renderOnce(
      range,
      requestedPixelRatio,
      format === 'png' ? 1 : (renderOptions.quality ?? 0.98),
    );
    if (!rendered.blob) throw new Error('图片生成失败');

    if (rendered.blob.size <= maxBytes) {
      acceptBlob(rendered.blob, rendered.outputWidth);
      await yieldToBrowser();
      return;
    }

    const splitPoint = getWholeBlockSplitPoint(element, range);
    if (splitPoint) {
      rendered.blob = null;
      await yieldToBrowser();
      await renderRange({ start: range.start, end: splitPoint });
      await renderRange({ start: splitPoint, end: range.end });
      return;
    }

    // A single block cannot be split. Reduce JPEG quality first, then scale
    // the complete block down until the encoded file fits the hard size cap.
    for (let attempt = 0; attempt < 12 && rendered.blob.size > maxBytes; attempt += 1) {
      let nextQuality = rendered.quality;
      let nextPixelRatio = rendered.pixelRatio;

      if (format === 'jpg' && nextQuality > MIN_JPEG_QUALITY) {
        nextQuality = Math.max(MIN_JPEG_QUALITY, nextQuality - 0.08);
      } else {
        const sizeScale = Math.sqrt(maxBytes / rendered.blob.size) * 0.95;
        nextPixelRatio = Math.max(
          MIN_ADAPTIVE_PIXEL_RATIO,
          nextPixelRatio * Math.min(0.9, sizeScale),
        );
      }

      if (
        nextPixelRatio === rendered.pixelRatio
        && nextQuality === rendered.quality
      ) break;

      rendered.blob = null;
      await yieldToBrowser();
      rendered = await renderOnce(range, nextPixelRatio, nextQuality);
      if (!rendered.blob) throw new Error('图片生成失败');
    }

    if (rendered.blob.size > maxBytes) {
      throw new Error(`完整块无法压缩到 ${(maxBytes / 1_000_000).toFixed(0)}MB 以内，请改用 JPG`);
    }

    acceptBlob(rendered.blob, rendered.outputWidth);
    await yieldToBrowser();
  };

  try {
    for (const range of ranges) {
      await renderRange(range);
    }

    if (outputCount === 1 && firstBlob) {
      downloadBlob(firstBlob, `${baseName}.${ext}`);
      firstBlob = null;
    }

    return {
      count: outputCount,
      width: Number.isFinite(outputWidth) ? outputWidth : 0,
      largestBytes,
      reducedCount,
    };
  } finally {
    firstBlob = null;
    cleanupSliceViewports();
    exportInProgress = false;
  }
};

export const getExportElementHeight = getElementHeight;
