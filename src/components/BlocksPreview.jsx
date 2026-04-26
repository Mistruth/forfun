import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { customComponents } from './CustomComponentDefinitions';

/**
 * 按块直接渲染预览，避免 base64 图片在字符串拼接时被截断
 * blocks: Array<{ id, type, content?, componentId?, props? }>
 */
const BlocksPreview = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  const exportBlockStyle = {
    display: 'flow-root',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  };

  return (
    <>
      {blocks.map((block) => {
        if (block.type === 'markdown') {
          return (
            <div
              key={block.id}
              data-export-block="true"
              data-block-id={block.id}
              style={exportBlockStyle}
              className="markdown-preview prose prose-lg max-w-none"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {block.content || ''}
              </ReactMarkdown>
            </div>
          );
        }

        if (block.type === 'custom') {
          const compDef = customComponents.find(c => c.id === block.componentId);
          if (!compDef) return null;
          const html = compDef.renderFn(block.props || compDef.defaultProps);
          return (
            <div
              key={block.id}
              data-export-block="true"
              data-block-id={block.id}
              style={exportBlockStyle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return null;
      })}
    </>
  );
};

export default BlocksPreview;
