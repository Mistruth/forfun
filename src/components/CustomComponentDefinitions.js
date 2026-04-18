// 自定义组件定义 - 用户可插入到编辑器的丰富样式组件
// 每个组件包含：id, name, category, icon, preview, defaultProps, renderFn, configFields

// ─── 字体预设 ────────────────────────────────────────────────
export const FONT_FAMILY_OPTIONS = [
  { label: '默认（苹方/系统）', value: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" },
  { label: '阿里妈妈方圆体（圆润可爱）', value: "'AlimamaFangYuanTi', 'PingFang SC', sans-serif" },
  { label: '阿里妈妈敏捷体（现代活力）', value: "'AlimamaAgile', 'PingFang SC', sans-serif" },
  { label: '幼圆（可爱圆润）', value: "'YouYuan', '幼圆', 'PingFang SC', sans-serif" },
  { label: '圆体（圆润现代）', value: "'Noto Sans SC', 'PingFang SC', 'HanHei SC', sans-serif" },
  { label: '楷体（文艺复古）', value: "'KaiTi', '楷体', 'STKaiti', 'PingFang SC', serif" },
  { label: '宋体（正式典雅）', value: "'SimSun', '宋体', 'STSong', 'PingFang SC', serif" },
  { label: '黑体（简洁有力）', value: "'SimHei', '黑体', 'STHeiti', 'PingFang SC', sans-serif" },
];

// ─── 渲染函数 ────────────────────────────────────────────────

const renderChapterTitle = (props) => {
  const {
    number = '01',
    title = '在这里输入您的标题内容',
    bgColor = 'rgba(88,187,144,0.12)',
    numberColor = '#58bb90',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize = '26',
    titleStyle = 'default',
  } = props;

  const ff = fontFamily;
  const fs = parseInt(fontSize) || 26;

  if (titleStyle === 'badge') {
    // 徽章风格：数字做小标签，标题大字
    return `<section style="margin: 24px 0 16px; padding: 0;">
  <div style="display: flex; align-items: center; gap: 10px; font-family: ${ff};">
    <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${numberColor}; color: #fff; font-size: 13px; font-weight: 800; border-radius: 50%; flex-shrink: 0; letter-spacing: -0.5px;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.3; letter-spacing: 0.5px;">${title}</h2>
  </div>
  <div style="margin-top: 8px; height: 3px; width: 48px; background: linear-gradient(90deg, ${numberColor}, transparent); border-radius: 2px; margin-left: 42px;"></div>
</section>`;
  }

  if (titleStyle === 'underline') {
    // 下划线风格：简洁现代
    return `<section style="margin: 24px 0 16px; padding: 0; font-family: ${ff};">
  <div style="display: flex; align-items: baseline; gap: 8px;">
    <span style="font-size: ${Math.round(fs * 0.65)}px; color: ${numberColor}; font-weight: 800; letter-spacing: 1px; opacity: 0.9;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.3;">${title}</h2>
  </div>
  <div style="margin-top: 6px; height: 2px; background: linear-gradient(90deg, ${numberColor} 0%, rgba(88,187,144,0.1) 100%); border-radius: 1px;"></div>
</section>`;
  }

  if (titleStyle === 'card') {
    // 卡片风格：带背景色块
    return `<section style="margin: 20px 0; padding: 14px 18px; background: linear-gradient(135deg, ${bgColor} 0%, rgba(88,187,144,0.03) 100%); border-radius: 16px; border-left: 4px solid ${numberColor}; font-family: ${ff};">
  <div style="display: flex; align-items: center; gap: 10px;">
    <span style="font-size: ${Math.round(fs * 0.6)}px; color: ${numberColor}; font-weight: 800; opacity: 0.8;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.4;">${title}</h2>
  </div>
</section>`;
  }

  // default 风格（原始渐变背景）
  return `<section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, ${bgColor} 0%, rgba(88,187,144,0.04) 100%); border-radius: 12px; font-family: ${ff};">
  <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.4; display: flex; align-items: baseline; gap: 10px;">
    <span style="font-size: ${Math.round(fs * 0.7)}px; color: ${numberColor}; font-weight: 800;">${number}</span>
    <span>${title}</span>
  </h2>
</section>`;
};

// 将富文本片段列表渲染成 HTML
// segments: Array<{ text, bold, italic, underline, bgColor }>
const renderSegments = (segments, fontFamily) => {
  if (!segments || segments.length === 0) return '';
  return segments.map(seg => {
    let style = '';
    if (fontFamily) style += `font-family: ${fontFamily};`;
    if (seg.bold) style += 'font-weight: 700;';
    if (seg.italic) style += 'font-style: italic;';
    if (seg.underline) style += 'text-decoration: underline;';
    if (seg.bgColor) style += `background: ${seg.bgColor}; padding: 1px 5px; border-radius: 3px;`;
    if (style) {
      return `<span style="${style}">${seg.text}</span>`;
    }
    return seg.text;
  }).join('');
};

const renderBodyText = (props) => {
  const {
    segments = [{ text: '这是一段适合移动端阅读的正文。您可以在这里编写您的核心内容。', bold: false, italic: false, underline: false, bgColor: '' }],
    fontSize = '17',
    lineHeight = '1.85',
    hasBg = false,
    bgCardColor = '#fafafa',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;
  const html = renderSegments(segments, fontFamily);
  const pStyle = `font-size: ${fontSize}px; line-height: ${lineHeight}; letter-spacing: 0.4px; color: #333; margin: 0; text-align: justify; font-family: ${fontFamily};`;
  if (hasBg) {
    return `<section style="margin: 16px 0; background: ${bgCardColor}; border-radius: 12px; padding: 14px 16px;">
  <p style="${pStyle}">${html}</p>
</section>`;
  }
  return `<p style="${pStyle} margin: 12px 0;">${html}</p>`;
};

const renderImage = (props) => {
  const { url = '', alt = '', width = '100%', borderRadius = '8px', caption = '', captionFontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" } = props;
  const imgStyle = `max-width: 100%; width: ${width}; border-radius: ${borderRadius}; display: block; margin: 0 auto;`;
  const imgTag = url
    ? `<img src="${url}" alt="${alt}" style="${imgStyle}" />`
    : `<div style="width: 100%; height: 160px; background: linear-gradient(135deg, #f0f0f0, #e0e0e0); border-radius: ${borderRadius}; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 14px; font-family: ${captionFontFamily};">点击配置图片地址</div>`;
  const captionTag = caption
    ? `<p style="text-align: center; font-size: 12px; color: #999; margin: 6px 0 0; font-family: ${captionFontFamily};">${caption}</p>`
    : '';
  return `<section style="margin: 16px 0;">${imgTag}${captionTag}</section>`;
};

// ─── 组件列表 ────────────────────────────────────────────────

export const customComponents = [
  // 标题组件
  {
    id: 'chapter-title',
    name: '篇章标题',
    category: '标题',
    icon: 'Type',
    preview: '醒目的单行标题，可配置篇章数字、字体、风格',
    defaultProps: {
      number: '01',
      title: '在这里输入您的标题内容',
      bgColor: 'rgba(88,187,144,0.12)',
      numberColor: '#58bb90',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      fontSize: '26',
      titleStyle: 'badge',
    },
    renderFn: renderChapterTitle,
    configFields: [
      { key: 'number', label: '篇章数字', type: 'text', placeholder: '如：01、02、一、二' },
      { key: 'title', label: '标题文字', type: 'text', placeholder: '输入标题内容' },
      { key: 'titleStyle', label: '标题风格', type: 'select', options: [
        { label: '徽章风格', value: 'badge' },
        { label: '下划线风格', value: 'underline' },
        { label: '卡片风格', value: 'card' },
        { label: '渐变背景', value: 'default' },
      ]},
      { key: 'fontSize', label: '字体大小（px）', type: 'stepper', min: 16, max: 40, step: 1 },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
      { key: 'numberColor', label: '主题色', type: 'color' },
      { key: 'bgColor', label: '背景色（卡片/渐变风格）', type: 'text', placeholder: 'rgba(88,187,144,0.12)', showWhen: { key: 'titleStyle', value: 'card' } },
    ],
    get template() { return renderChapterTitle(this.defaultProps); }
  },

  // 正文组件（合并版）
  {
    id: 'body-text',
    name: '正文',
    category: '文本',
    icon: 'AlignLeft',
    preview: '支持字号、行距、字体、背景卡片、富文本格式',
    defaultProps: {
      segments: [
        { text: '这是一段适合移动端阅读的正文。您可以在这里编写您的核心内容。', bold: false, italic: false, underline: false, bgColor: '' },
      ],
      fontSize: '17',
      lineHeight: '1.85',
      hasBg: false,
      bgCardColor: '#fafafa',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderBodyText,
    configFields: [
      { key: 'segments', label: '文本片段', type: 'richSegments' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
      { key: 'fontSize', label: '字体大小（px）', type: 'stepper', min: 10, max: 28, step: 1 },
      { key: 'lineHeight', label: '行距', type: 'stepper', min: 1.0, max: 3.0, step: 0.05, decimals: 2 },
      { key: 'hasBg', label: '背景卡片', type: 'toggle' },
      { key: 'bgCardColor', label: '卡片背景色', type: 'color', showWhen: { key: 'hasBg', value: true } },
    ],
    get template() { return renderBodyText(this.defaultProps); }
  },

  // 图片组件
  {
    id: 'image-block',
    name: '图片',
    category: '媒体',
    icon: 'Image',
    preview: '插入图片，支持圆角、宽度、说明文字',
    defaultProps: {
      url: '',
      alt: '图片',
      width: '100%',
      borderRadius: '8px',
      caption: '',
      captionFontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderImage,
    configFields: [
      { key: 'url', label: '图片', type: 'imageUpload' },
      { key: 'alt', label: '图片描述', type: 'text', placeholder: '图片描述文字' },
      { key: 'width', label: '宽度', type: 'text', placeholder: '100% 或 300px' },
      { key: 'borderRadius', label: '圆角', type: 'text', placeholder: '8px' },
      { key: 'caption', label: '图片说明（可选）', type: 'text', placeholder: '图片下方说明文字' },
      { key: 'captionFontFamily', label: '说明文字字体', type: 'fontSelect' },
    ],
    get template() { return renderImage(this.defaultProps); }
  },
];

// 按分类分组
export const componentCategories = [
  { id: 'all', name: '全部', icon: 'Grid' },
  { id: '标题', name: '标题', icon: 'Type' },
  { id: '文本', name: '文本', icon: 'AlignLeft' },
  { id: '媒体', name: '媒体', icon: 'Image' },
];
