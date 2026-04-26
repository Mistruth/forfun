import { useEffect, useState } from 'react';
import { resolveImageValue } from '@/lib/imageStore';

const IMAGE_FIELD_KEYS = new Set(['url', 'imageUrl']);

const resolveValue = async (key, value) => {
  if (IMAGE_FIELD_KEYS.has(key) && typeof value === 'string') {
    return resolveImageValue(value);
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolveValue('', item)));
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([childKey, childValue]) => [
        childKey,
        await resolveValue(childKey, childValue),
      ]),
    );
    return Object.fromEntries(entries);
  }

  return value;
};

const resolveBlock = async (block) => {
  if (block.type !== 'custom' || !block.props) return block;
  return {
    ...block,
    props: await resolveValue('', block.props),
  };
};

const resolveBlocks = async (blocks) => Promise.all(blocks.map(resolveBlock));

export const useResolvedBlocks = (blocks) => {
  const [resolvedBlocks, setResolvedBlocks] = useState(blocks);

  useEffect(() => {
    let cancelled = false;

    setResolvedBlocks(blocks);
    resolveBlocks(blocks).then((nextBlocks) => {
      if (!cancelled) setResolvedBlocks(nextBlocks);
    });

    return () => {
      cancelled = true;
    };
  }, [blocks]);

  return resolvedBlocks;
};
