import assert from 'node:assert/strict';
import { templates } from '../src/components/Templates.js';

const mutuoTemplate = templates.find((template) => template.id === 'mutuo-cherry-hiking');

assert.ok(mutuoTemplate, '牟托羌寨车厘子模板应存在');
assert.equal(mutuoTemplate.name, '牟托羌寨车厘子采摘');
assert.equal(mutuoTemplate.category, '活动推文');
assert.ok(
  mutuoTemplate.blocks.some(
    (block) =>
      block.componentId === 'body-text' &&
      block.props?.contentHtml?.includes('牟托羌寨，位于阿坝州茂县')
  ),
  '模板应包含牟托羌寨序文'
);
assert.ok(
  mutuoTemplate.blocks.some(
    (block) =>
      block.componentId === 'body-text' &&
      block.props?.contentHtml?.includes('<strong><br>活动费用：110元/人</strong>')
  ),
  '模板应包含活动费用 110 元'
);
assert.ok(
  !mutuoTemplate.blocks.some(
    (block) => block.id === 'tpl_mutuo_body_6' || block.id === 'tpl_mutuo_body_7'
  ),
  '模板应使用用户调整后的结构，不包含目的地说明扩展块'
);
assert.ok(
  mutuoTemplate.blocks.some(
    (block) =>
      block.componentId === 'body-text' &&
      block.props?.contentHtml?.includes('桐梓林地铁口')
  ),
  '模板应包含出发地点'
);

console.log('Templates check passed');
