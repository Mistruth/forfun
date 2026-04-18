// 模板定义文件
// 每个模板包含：id, name, description, category, blocks

// 字体常量
const YOUYUAN = "'AlimamaFangYuanTi', 'PingFang SC', sans-serif";
const PINGFANG = "'AlimamaFangYuanTi', 'PingFang SC', sans-serif";

let _tplIdCounter = 1;
const tid = (prefix) => `tpl_${prefix}_${_tplIdCounter++}`;

// ─── 户外徒步活动推文模板（年轻化版） ────────────────────────────────────────────────
const outdoorHikingTemplate = {
  id: 'outdoor-hiking',
  name: '户外徒步活动推文',
  description: '适合户外俱乐部、徒步团队的公众号推文，幼圆字体 + 徽章标题，年轻活泼风格',
  category: '活动推文',
  cover: '🏔️',
  blocks: [
    // ── 01 写在前面 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '01',
        title: '写在前面 · THE VIBE',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '"周一到周五在工位吸尘，周六周日去山野吸氧。"', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.15)' },
        ],
        fontSize: '18',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '拒绝内卷，拒绝emo 🙅‍♀️\n本周我们策划了 ', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '[XX场]', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.25)' },
          { text: ' 户外徒步活动。\n\n不管你是想挑战自我的硬核玩家 🧗\n还是只想找个地方美美拍照的新手 📸\n这里都有属于你的那片山野 🌿', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 02 本周目的地 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '02',
        title: '本周目的地 · DESTINATION',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('img'),
      type: 'custom',
      componentId: 'image-block',
      props: {
        url: '',
        alt: '目的地风景大图',
        width: '100%',
        borderRadius: '16px',
        caption: '📷 此处放一张极具视觉冲击力的风景大图',
        captionFontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '📍 路线 A ｜', bold: true, italic: false, underline: false, bgColor: '' },
          { text: ' [路线名称，如：云端草甸]', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n\n难度系数：⭐⭐  新手友好\n风景指数：⭐⭐⭐⭐⭐  出片率极高\n关键词：#日落 #森林 #云海\n\n✦ 穿越无人干扰的原始森林\n✦ 山顶360°无死角俯瞰城市', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: true,
        bgCardColor: 'rgba(62,207,142,0.06)',
        fontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '📍 路线 B ｜', bold: true, italic: false, underline: false, bgColor: '' },
          { text: ' [路线名称，如：溪谷秘境]', bold: true, italic: false, underline: false, bgColor: 'rgba(99,179,237,0.2)' },
          { text: '\n\n难度系数：⭐⭐⭐  进阶挑战\n风景指数：⭐⭐⭐⭐  清凉感拉满\n关键词：#溯溪 #清凉 #体能挑战\n\n✦ [亮点1，如：踩着溪石穿越峡谷]\n✦ [亮点2，如：隐藏瀑布打卡点]', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: true,
        bgCardColor: 'rgba(99,179,237,0.06)',
        fontFamily: YOUYUAN,
      },
    },

    // ── 03 活动方案 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '03',
        title: '活动方案 · ACTIVITY PLAN',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '🚌  08:30', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '  集合出发（XX地铁站）\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🥾  10:30', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '  到达起点，热身 & 破冰\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🍱  12:00', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '  山野路餐，建议自带高能量食物\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🏔️  16:30', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '  登顶 / 下山，合影留念 📸\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🚌  18:30', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '  愉快返程，期待下次再见 👋', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '2.0',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 04 装备清单 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '04',
        title: '装备清单 · GEAR LIST',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '👟 必备', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '\n徒步鞋/运动鞋（防滑很重要！）\n双肩包 · 1.5L以上饮用水\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '☀️ 防晒', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '\n遮阳帽 · 防晒霜 · 墨镜\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🎒 其他', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '\n充电宝 · 个人常用药品\n垃圾袋（无痕山野，带走垃圾 🌱）', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: true,
        bgCardColor: 'rgba(255,237,213,0.5)',
        fontFamily: YOUYUAN,
      },
    },

    // ── 05 参与方式 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '05',
        title: '参与方式 · JOIN US',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('img'),
      type: 'custom',
      componentId: 'image-block',
      props: {
        url: '',
        alt: '报名二维码',
        width: '180px',
        borderRadius: '12px',
        caption: '扫码关注 / 添加领队微信',
        captionFontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '👉 ', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '点击上方名片关注，回复关键词【本周】报名', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n👉 或直接添加领队微信：[微信号]\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '⚠️ 名额有限，先到先得，以缴费确认报名为准', bold: false, italic: true, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 06 常见问题 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '06',
        title: '常见问题 · FAQ',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: 'Q：我是一个人，可以参加吗？', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.15)' },
          { text: '\nA：当然！一半以上都是独自报名的"独行侠"，领队会组织破冰，分分钟找到志同道合的搭子 🤝\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: 'Q：体力不好，会跟不上吗？', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.15)' },
          { text: '\nA：配备双领队（头驴+收队），不落下任何一个人。选对难度等级，完全不用担心！💪\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: 'Q：下雨怎么办？', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.15)' },
          { text: '\nA：小雨正常出发（雨中徒步更有氛围感 🌧️），极端天气提前一天通知，全额退费。\n\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: 'Q：可以带宠物吗？', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.15)' },
          { text: '\nA：欢迎毛孩子 🐾，需提前报备并全程牵绳。', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 07 往期回顾 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '07',
        title: '往期回顾 · MEMORIES',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('img'),
      type: 'custom',
      componentId: 'image-block',
      props: {
        url: '',
        alt: '往期活动照片',
        width: '100%',
        borderRadius: '16px',
        caption: '📸 放3-4张往期活动中，年轻人笑得很开心的合影或氛围感特写',
        captionFontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '"山野没有信号，但有更好的连接。" 🌿', bold: true, italic: true, underline: false, bgColor: 'rgba(62,207,142,0.12)' },
          { text: '\n\n这个周末，山里见！', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '18',
        lineHeight: '2.0',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },
  ],
};

// ─── 模板列表 ────────────────────────────────────────────────
export const templates = [
  outdoorHikingTemplate,
];

// 按分类分组
export const templateCategories = [
  { id: 'all', name: '全部模板' },
  { id: '活动推文', name: '活动推文' },
];
