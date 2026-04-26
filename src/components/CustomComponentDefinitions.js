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
    return `<section style="margin: 24px 0 16px; padding: 0;">
  <div style="display: flex; align-items: center; gap: 10px; font-family: ${ff};">
    <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${numberColor}; color: #fff; font-size: 13px; font-weight: 800; border-radius: 50%; flex-shrink: 0; letter-spacing: -0.5px;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.3; letter-spacing: 0.5px;">${title}</h2>
  </div>
  <div style="margin-top: 8px; height: 3px; width: 48px; background: linear-gradient(90deg, ${numberColor}, transparent); border-radius: 2px; margin-left: 42px;"></div>
</section>`;
  }

  if (titleStyle === 'underline') {
    return `<section style="margin: 24px 0 16px; padding: 0; font-family: ${ff};">
  <div style="display: flex; align-items: baseline; gap: 8px;">
    <span style="font-size: ${Math.round(fs * 0.65)}px; color: ${numberColor}; font-weight: 800; letter-spacing: 1px; opacity: 0.9;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.3;">${title}</h2>
  </div>
  <div style="margin-top: 6px; height: 2px; background: linear-gradient(90deg, ${numberColor} 0%, rgba(88,187,144,0.1) 100%); border-radius: 1px;"></div>
</section>`;
  }

  if (titleStyle === 'card') {
    return `<section style="margin: 20px 0; padding: 14px 18px; background: linear-gradient(135deg, ${bgColor} 0%, rgba(88,187,144,0.03) 100%); border-radius: 16px; border-left: 4px solid ${numberColor}; font-family: ${ff};">
  <div style="display: flex; align-items: center; gap: 10px;">
    <span style="font-size: ${Math.round(fs * 0.6)}px; color: ${numberColor}; font-weight: 800; opacity: 0.8;">${number}</span>
    <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.4;">${title}</h2>
  </div>
</section>`;
  }

  return `<section style="margin: 20px 0; padding: 16px 20px; background: linear-gradient(135deg, ${bgColor} 0%, rgba(88,187,144,0.04) 100%); border-radius: 12px; font-family: ${ff};">
  <h2 style="font-size: ${fs}px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.4; display: flex; align-items: baseline; gap: 10px;">
    <span style="font-size: ${Math.round(fs * 0.7)}px; color: ${numberColor}; font-weight: 800;">${number}</span>
    <span>${title}</span>
  </h2>
</section>`;
};

// 将富文本片段列表渲染成 HTML
const renderSegments = (segments, fontFamily) => {
  if (!segments || segments.length === 0) return '';
  return segments.map(seg => {
    let style = '';
    if (fontFamily) style += `font-family: ${fontFamily};`;
    if (seg.bold) style += 'font-weight: 700;';
    if (seg.italic) style += 'font-style: italic;';
    if (seg.underline) style += 'text-decoration: underline;';
    if (seg.bgColor) style += `background: ${seg.bgColor}; padding: 1px 5px; border-radius: 3px;`;
    const text = seg.text.replace(/\n/g, '<br/>');
    if (style) {
      return `<span style="${style}">${text}</span>`;
    }
    return text;
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

// ─── 新组件渲染函数 ──────────────────────────────────────────

const renderDivider = (props) => {
  const {
    dividerStyle = 'line',
    ornament = '✦',
    lineColor = '#e0e0e0',
    marginY = '24',
  } = props;

  const my = parseInt(marginY) || 24;

  if (dividerStyle === 'dashed') {
    return `<div style="margin: ${my}px 0; border-top: 1px dashed ${lineColor};"></div>`;
  }

  if (dividerStyle === 'ornament') {
    return `<div style="margin: ${my}px 0; display: flex; align-items: center; gap: 12px;">
  <div style="flex: 1; height: 1px; background: ${lineColor};"></div>
  <span style="font-size: 12px; color: #bbb; letter-spacing: 4px;">${ornament}</span>
  <div style="flex: 1; height: 1px; background: ${lineColor};"></div>
</div>`;
  }

  return `<div style="margin: ${my}px 0; border-top: 1px solid ${lineColor};"></div>`;
};

const renderImageTextCard = (props) => {
  const {
    layout = 'top-bottom',
    imageUrl = '',
    title = '卡片标题',
    description = '这里是卡片描述文字，支持多行内容展示。',
    tag = '',
    accentColor = '#58bb90',
    borderRadius = '10px',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const imgTag = imageUrl
    ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`
    : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #f0f0f0, #e8e8e8); display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 12px;">图片</div>`;

  const tagHtml = tag
    ? `<span style="display: inline-block; background: ${accentColor}18; color: ${accentColor}; font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; margin-bottom: 6px;">${tag}</span>`
    : '';

  if (layout === 'left-right') {
    return `<section style="margin: 16px 0; background: #fff; border-radius: ${borderRadius}; overflow: hidden; border: 1px solid #f0f0f0; font-family: ${fontFamily};">
  <div style="display: flex;">
    <div style="width: 40%; min-height: 100px; overflow: hidden; flex-shrink: 0;">${imgTag}</div>
    <div style="flex: 1; padding: 12px 14px;">
      ${tagHtml}
      <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; line-height: 1.4;">${title}</div>
      <div style="font-size: 13px; color: #666; line-height: 1.6;">${description}</div>
    </div>
  </div>
</section>`;
  }

  return `<section style="margin: 16px 0; background: #fff; border-radius: ${borderRadius}; overflow: hidden; border: 1px solid #f0f0f0; font-family: ${fontFamily};">
  <div style="height: 120px; overflow: hidden;">${imgTag}</div>
  <div style="padding: 12px 14px;">
    ${tagHtml}
    <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; line-height: 1.4;">${title}</div>
    <div style="font-size: 13px; color: #666; line-height: 1.6;">${description}</div>
  </div>
</section>`;
};

const renderInfoCard = (props) => {
  const {
    title = '知识点标题',
    content = '这里是详细说明内容，可以是一段文字描述。',
    bgColor = '#ffffff',
    borderColor = '#58bb90',
    showBorder = true,
    icon = '',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const borderStyle = showBorder ? `border-left: 3px solid ${borderColor};` : '';
  const iconHtml = icon
    ? `<span style="margin-right: 6px;">${icon}</span>`
    : '';

  return `<section style="margin: 16px 0; background: ${bgColor}; border-radius: 12px; padding: 14px 16px; ${borderStyle} box-shadow: 0 1px 4px rgba(0,0,0,0.06); font-family: ${fontFamily};">
  <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;">${iconHtml}${title}</div>
  <div style="font-size: 13px; color: #555; line-height: 1.7;">${content}</div>
</section>`;
};

const renderChecklist = (props) => {
  const {
    items = ['列表项目一', '列表项目二', '列表项目三'],
    icon = '📍',
    accentColor = '#58bb90',
    showLine = true,
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const lineStyle = showLine ? `border-left: 2px solid ${accentColor}30;` : '';

  const itemsHtml = items.map(item =>
    `<div style="margin-bottom: 8px; font-size: 14px; color: #333; line-height: 1.6; padding-left: 4px;">
  <span style="margin-right: 6px;">${icon}</span>${item}
</div>`
  ).join('');

  return `<section style="margin: 16px 0; padding: 12px 16px; ${lineStyle} font-family: ${fontFamily};">
  ${itemsHtml}
</section>`;
};

const renderQuoteBlock = (props) => {
  const {
    text = '这里是一段引用文字或金句内容。',
    accentColor = '#58bb90',
    showQuotes = true,
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const bgColor = accentColor + '0a';
  const quoteMark = showQuotes ? '<span style="font-size: 20px; color: ' + accentColor + '; opacity: 0.4; line-height: 1;">"</span>' : '';

  return `<section style="margin: 16px 0; background: ${bgColor}; border-radius: 0 10px 10px 0; padding: 14px 16px; border-left: 3px solid ${accentColor}; font-family: ${fontFamily};">
  ${quoteMark}
  <div style="font-size: 14px; color: #555; line-height: 1.8; font-style: italic;">${text}</div>
</section>`;
};

const renderTipBox = (props) => {
  const {
    type = 'tip',
    variant = 'classic',
    title = '',
    content = '这是一条提示信息。',
    customIcon = '',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const presets = {
    tip:      { icon: '💡', label: 'TIP', bg: '#f0f7ff', softBg: '#f7fbff', color: '#1565c0', border: '#64b5f6', shadow: 'rgba(21,101,192,0.12)' },
    warning:  { icon: '⚠️', label: 'NOTICE', bg: '#fffde7', softBg: '#fffaf0', color: '#f57f17', border: '#ffd54f', shadow: 'rgba(245,127,23,0.14)' },
    info:     { icon: 'ℹ️', label: 'INFO', bg: '#f5f5f5', softBg: '#fafafa', color: '#616161', border: '#bdbdbd', shadow: 'rgba(97,97,97,0.12)' },
    success:  { icon: '✅', label: 'CHECK', bg: '#e8f5e9', softBg: '#f4fbf5', color: '#2e7d32', border: '#81c784', shadow: 'rgba(46,125,50,0.14)' },
    danger:   { icon: '❗', label: 'ALERT', bg: '#fce4ec', softBg: '#fff5f8', color: '#c62828', border: '#ef9a9a', shadow: 'rgba(198,40,40,0.14)' },
    purple:   { icon: '🔮', label: 'IDEA', bg: '#f3e5f5', softBg: '#fbf5ff', color: '#7b1fa2', border: '#ce93d8', shadow: 'rgba(123,31,162,0.14)' },
    orange:   { icon: '🔥', label: 'HOT', bg: '#fff3e0', softBg: '#fff8ef', color: '#e65100', border: '#ffb74d', shadow: 'rgba(230,81,0,0.14)' },
    cyan:     { icon: '💎', label: 'FRESH', bg: '#e0f7fa', softBg: '#f0fdff', color: '#00695c', border: '#4dd0e1', shadow: 'rgba(0,105,92,0.14)' },
  };

  const preset = presets[type] || presets.tip;
  const icon = customIcon || preset.icon;
  const titleHtml = title
    ? `<div style="font-size: 14px; font-weight: 800; color: ${preset.color}; line-height: 1.45; margin-bottom: 4px;">${title}</div>`
    : '';

  // 将内容按换行拆分，支持列表项（☞ 开头的行）
  const lines = (content || '').split('\n');
  const bodyHtml = lines.map(line => {
    if (!line.trim()) return '<br/>';
    if (/^[☞•\-–]\s/.test(line)) {
      return `<div style="display:flex;align-items:flex-start;gap:4px;padding:2px 0;"><span style="flex-shrink:0;">${line.charAt(0)}</span><span>${line.slice(1).trim()}</span></div>`;
    }
    return `<div style="padding:2px 0;">${line}</div>`;
  }).join('');

  if (variant === 'sticker') {
    return `<section style="margin: 20px 0; padding: 0 4px; font-family: ${fontFamily};">
  <div style="position: relative; background: ${preset.softBg}; border: 1px solid ${preset.border}; border-radius: 12px; padding: 18px 16px 14px; box-shadow: 0 10px 24px ${preset.shadow}; transform: rotate(-0.8deg);">
    <span style="position: absolute; left: 18px; top: -10px; width: 56px; height: 18px; border-radius: 3px; background: rgba(255,255,255,0.72); border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(0,0,0,0.06);"></span>
    <div style="display: flex; align-items: flex-start; gap: 10px; transform: rotate(0.8deg);">
      <span style="font-size: 20px; line-height: 1.4;">${icon}</span>
      <div style="flex: 1; min-width: 0;">
        ${titleHtml}
        <div style="font-size: 15px; color: #333; line-height: 1.85;">${bodyHtml}</div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (variant === 'chat-bubble') {
    return `<section style="margin: 16px 0; display: flex; align-items: flex-start; gap: 10px; font-family: ${fontFamily};">
  <span style="width: 34px; height: 34px; border-radius: 50%; background: ${preset.bg}; color: ${preset.color}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px ${preset.shadow};">${icon}</span>
  <div style="position: relative; flex: 1; min-width: 0; background: ${preset.softBg}; border: 1px solid ${preset.border}; border-radius: 16px; padding: 12px 14px; box-shadow: 0 6px 16px ${preset.shadow};">
    <span style="position: absolute; left: -7px; top: 13px; width: 12px; height: 12px; background: ${preset.softBg}; border-left: 1px solid ${preset.border}; border-bottom: 1px solid ${preset.border}; transform: rotate(45deg);"></span>
    ${titleHtml}
    <div style="font-size: 15px; color: #333; line-height: 1.8;">${bodyHtml}</div>
  </div>
</section>`;
  }

  if (variant === 'marker') {
    return `<section style="margin: 16px 0; font-family: ${fontFamily};">
  <div style="display: inline-flex; align-items: center; gap: 6px; margin-bottom: 6px; color: ${preset.color}; font-size: 12px; font-weight: 800; letter-spacing: 0.8px;">
    <span>${icon}</span><span>${title || preset.label}</span>
  </div>
  <div style="font-size: 16px; color: #2a2a2a; line-height: 1.85; font-weight: 600;">
    <div style="background: linear-gradient(transparent 58%, ${preset.bg} 58%); padding: 0 3px;">${bodyHtml}</div>
  </div>
</section>`;
  }

  if (variant === 'glass') {
    return `<section style="margin: 16px 0; background: rgba(255,255,255,0.62); border: 1px solid rgba(255,255,255,0.86); border-top-color: ${preset.border}; border-radius: 16px; padding: 14px 16px; box-shadow: 0 10px 28px ${preset.shadow}; backdrop-filter: blur(12px); font-family: ${fontFamily};">
  <div style="display: flex; align-items: flex-start; gap: 10px;">
    <span style="width: 30px; height: 30px; border-radius: 10px; background: ${preset.bg}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon}</span>
    <div style="flex: 1; min-width: 0;">
      ${titleHtml}
      <div style="font-size: 15px; color: #333; line-height: 1.85;">${bodyHtml}</div>
    </div>
  </div>
</section>`;
  }

  if (variant === 'pixel') {
    return `<section style="margin: 18px 0; padding: 3px; background: ${preset.color}; box-shadow: 4px 4px 0 ${preset.border}; font-family: ${fontFamily};">
  <div style="background: ${preset.softBg}; border: 2px solid #fff; padding: 12px 13px;">
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <span style="font-size: 17px; line-height: 1.7;">${icon}</span>
      <div style="flex: 1; min-width: 0;">
        ${titleHtml}
        <div style="font-size: 15px; color: #2a2a2a; line-height: 1.8; font-weight: 600;">${bodyHtml}</div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (variant === 'badge') {
    return `<section style="margin: 16px 0; background: #fff; border: 1px solid ${preset.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.04); font-family: ${fontFamily};">
  <div style="display: inline-flex; align-items: center; gap: 6px; background: ${preset.color}; color: #fff; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 0 0 12px 0; letter-spacing: 0.8px;">
    <span>${icon}</span><span>${title || preset.label}</span>
  </div>
  <div style="padding: 11px 14px 14px; font-size: 15px; color: #333; line-height: 1.85;">${bodyHtml}</div>
</section>`;
  }

  if (variant === 'classic') {
    return `<section style="margin: 16px 0; background: ${preset.bg}; border-left: 4px solid ${preset.border}; border-radius: 8px; padding: 14px 16px; font-family: ${fontFamily}; overflow:hidden;">
  <div style="display: flex; align-items: flex-start; gap: 8px;">
    <span style="font-size: 17px; line-height: 1.8;">${icon}</span>
    <div style="flex: 1; min-width: 0;">
      ${titleHtml}
      <div style="font-size: 17px; color: ${preset.color}; line-height: 1.8;">${bodyHtml}</div>
    </div>
  </div>
</section>`;
  }

  return `<section style="margin: 16px 0; background: linear-gradient(135deg, ${preset.softBg} 0%, #ffffff 100%); border: 1px solid ${preset.border}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px ${preset.shadow}; font-family: ${fontFamily}; overflow:hidden;">
  <div style="display: flex; align-items: flex-start; gap: 10px;">
    <span style="width: 30px; height: 30px; border-radius: 10px; background: ${preset.bg}; color: ${preset.color}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon}</span>
    <div style="flex: 1; min-width: 0;">
      ${titleHtml}
      <div style="font-size: 15px; color: #333; line-height: 1.85;">${bodyHtml}</div>
    </div>
  </div>
</section>`;
};

const renderStatsBar = (props) => {
  const {
    items = [
      { value: '15km', label: '距离' },
      { value: '800m', label: '爬升' },
      { value: '6h', label: '时长' },
    ],
    accentColor = '#58bb90',
    itemBg = '#f5f5f5',
    fontFamily = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  } = props;

  const itemsHtml = items.map(item =>
    `<div style="flex: 1; background: ${itemBg}; border-radius: 8px; padding: 10px 8px; text-align: center;">
  <div style="font-size: 18px; font-weight: 700; color: ${accentColor}; line-height: 1.3;">${item.value}</div>
  <div style="font-size: 11px; color: #999; margin-top: 2px;">${item.label}</div>
</div>`
  ).join('');

  return `<section style="margin: 16px 0; display: flex; gap: 8px; font-family: ${fontFamily};">
  ${itemsHtml}
</section>`;
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

  // 正文组件
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

  // 分隔线
  {
    id: 'divider',
    name: '分隔线',
    category: '分隔',
    icon: 'Minus',
    preview: '内容分隔，支持实线、虚线、装饰符号',
    defaultProps: {
      dividerStyle: 'line',
      ornament: '✦',
      lineColor: '#e0e0e0',
      marginY: '24',
    },
    renderFn: renderDivider,
    configFields: [
      { key: 'dividerStyle', label: '分隔样式', type: 'select', options: [
        { label: '实线', value: 'line' },
        { label: '虚线', value: 'dashed' },
        { label: '装饰符号', value: 'ornament' },
      ]},
      { key: 'ornament', label: '装饰符号', type: 'text', placeholder: '✦ · ※ ★', showWhen: { key: 'dividerStyle', value: 'ornament' } },
      { key: 'lineColor', label: '线条颜色', type: 'color' },
      { key: 'marginY', label: '上下间距（px）', type: 'stepper', min: 8, max: 60, step: 4 },
    ],
    get template() { return renderDivider(this.defaultProps); }
  },

  // 图文卡片
  {
    id: 'image-text-card',
    name: '图文卡片',
    category: '卡片',
    icon: 'LayoutGrid',
    preview: '图片+文字的卡片布局，左图右文或上图下文',
    defaultProps: {
      layout: 'top-bottom',
      imageUrl: '',
      title: '卡片标题',
      description: '这里是卡片描述文字，支持多行内容展示。',
      tag: '',
      accentColor: '#58bb90',
      borderRadius: '10px',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderImageTextCard,
    configFields: [
      { key: 'layout', label: '布局', type: 'select', options: [
        { label: '上图下文', value: 'top-bottom' },
        { label: '左图右文', value: 'left-right' },
      ]},
      { key: 'imageUrl', label: '图片', type: 'imageUpload' },
      { key: 'title', label: '标题', type: 'text', placeholder: '卡片标题' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '卡片描述文字' },
      { key: 'tag', label: '标签（可选）', type: 'text', placeholder: '如：推荐、新品' },
      { key: 'accentColor', label: '主题色', type: 'color' },
      { key: 'borderRadius', label: '圆角', type: 'text', placeholder: '10px' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderImageTextCard(this.defaultProps); }
  },

  // 信息卡片
  {
    id: 'info-card',
    name: '信息卡片',
    category: '卡片',
    icon: 'FileText',
    preview: '白底卡片，突出单个知识点或要点',
    defaultProps: {
      title: '知识点标题',
      content: '这里是详细说明内容，可以是一段文字描述。',
      bgColor: '#ffffff',
      borderColor: '#58bb90',
      showBorder: true,
      icon: '',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderInfoCard,
    configFields: [
      { key: 'title', label: '标题', type: 'text', placeholder: '知识点标题' },
      { key: 'content', label: '内容', type: 'textarea', placeholder: '详细说明' },
      { key: 'icon', label: '图标（可选）', type: 'text', placeholder: '如：📌 💡 📖' },
      { key: 'showBorder', label: '左侧色条', type: 'toggle' },
      { key: 'borderColor', label: '色条颜色', type: 'color', showWhen: { key: 'showBorder', value: true } },
      { key: 'bgColor', label: '背景色', type: 'color' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderInfoCard(this.defaultProps); }
  },

  // 结构化清单
  {
    id: 'checklist',
    name: '清单',
    category: '列表',
    icon: 'List',
    preview: '带图标前缀的纵向列表，适合展示装备、步骤等',
    defaultProps: {
      items: ['列表项目一', '列表项目二', '列表项目三'],
      icon: '📍',
      accentColor: '#58bb90',
      showLine: true,
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderChecklist,
    configFields: [
      { key: 'items', label: '列表项', type: 'listEditor' },
      { key: 'icon', label: '图标符号', type: 'text', placeholder: '📍 ● ✓ → 📌' },
      { key: 'showLine', label: '左侧竖线', type: 'toggle' },
      { key: 'accentColor', label: '主题色', type: 'color' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderChecklist(this.defaultProps); }
  },

  // 引用块
  {
    id: 'quote-block',
    name: '引用块',
    category: '强调',
    icon: 'Quote',
    preview: '浅底+左侧色条，突出金句或重要内容',
    defaultProps: {
      text: '这里是一段引用文字或金句内容。',
      accentColor: '#58bb90',
      showQuotes: true,
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderQuoteBlock,
    configFields: [
      { key: 'text', label: '引用文字', type: 'textarea', placeholder: '输入引用内容' },
      { key: 'showQuotes', label: '显示引号', type: 'toggle' },
      { key: 'accentColor', label: '主题色', type: 'color' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderQuoteBlock(this.defaultProps); }
  },

  // 提示框
  {
    id: 'tip-box',
    name: '提示框',
    category: '强调',
    icon: 'AlertCircle',
    preview: '带图标的提示框，支持提示/警告/信息类型',
    defaultProps: {
      type: 'tip',
      variant: 'soft-card',
      title: '',
      content: '这是一条提示信息。',
      customIcon: '',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderTipBox,
    configFields: [
      { key: 'variant', label: '视觉风格', type: 'select', options: [
        { label: '轻卡片', value: 'soft-card' },
        { label: '贴纸便签', value: 'sticker' },
        { label: '聊天气泡', value: 'chat-bubble' },
        { label: '荧光标记', value: 'marker' },
        { label: '玻璃拟态', value: 'glass' },
        { label: '像素游戏', value: 'pixel' },
        { label: '徽章标题', value: 'badge' },
        { label: '经典色条', value: 'classic' },
      ]},
      { key: 'type', label: '提示类型', type: 'select', options: [
        { label: '提示（蓝色）', value: 'tip' },
        { label: '警告（黄色）', value: 'warning' },
        { label: '信息（灰色）', value: 'info' },
        { label: '成功（绿色）', value: 'success' },
        { label: '危险（红色）', value: 'danger' },
        { label: '创意（紫色）', value: 'purple' },
        { label: '活力（橙色）', value: 'orange' },
        { label: '清新（青色）', value: 'cyan' },
      ]},
      { key: 'title', label: '标题（可选）', type: 'text', placeholder: '如：小提示、注意啦、报名提醒' },
      { key: 'content', label: '内容', type: 'textarea', placeholder: '提示内容' },
      { key: 'customIcon', label: '自定义图标', type: 'text', placeholder: '覆盖默认图标，如 💡 ⚠️ ℹ️' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderTipBox(this.defaultProps); }
  },

  // 数据指标条
  {
    id: 'stats-bar',
    name: '数据指标',
    category: '数据',
    icon: 'BarChart3',
    preview: '多数据项横排展示，大数字+小标签',
    defaultProps: {
      items: [
        { value: '15km', label: '距离' },
        { value: '800m', label: '爬升' },
        { value: '6h', label: '时长' },
      ],
      accentColor: '#58bb90',
      itemBg: '#f5f5f5',
      fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    },
    renderFn: renderStatsBar,
    configFields: [
      { key: 'items', label: '数据项', type: 'statsEditor' },
      { key: 'accentColor', label: '数字颜色', type: 'color' },
      { key: 'itemBg', label: '每项背景色', type: 'color' },
      { key: 'fontFamily', label: '字体', type: 'fontSelect' },
    ],
    get template() { return renderStatsBar(this.defaultProps); }
  },

];

// 按分类分组
export const componentCategories = [
  { id: 'all', name: '全部', icon: 'Grid' },
  { id: '标题', name: '标题', icon: 'Type' },
  { id: '文本', name: '文本', icon: 'AlignLeft' },
  { id: '媒体', name: '媒体', icon: 'Image' },
  { id: '分隔', name: '分隔', icon: 'Minus' },
  { id: '卡片', name: '卡片', icon: 'LayoutGrid' },
  { id: '列表', name: '列表', icon: 'List' },
  { id: '强调', name: '强调', icon: 'Quote' },
  { id: '数据', name: '数据', icon: 'BarChart3' },
];
