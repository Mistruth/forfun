// 模板定义文件
// 每个模板包含：id, name, description, category, blocks

// 字体常量
const YOUYUAN = "'AlimamaFangYuanTi', 'PingFang SC', sans-serif";
const PINGFANG = "'AlimamaFangYuanTi', 'PingFang SC', sans-serif";
const AGILE = "'AlimamaAgile', 'PingFang SC', sans-serif";
const KAITI = "'KaiTi', '楷体', 'STKaiti', 'PingFang SC', serif";

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
        title: '序 · THE VIBE',
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
          { text: '"走出去，寻故事，造可能。"', bold: true, italic: true, underline: false, bgColor: 'rgba(62,207,142,0.12)' },
          { text: '\n山那边，不仅是风景，更是远方。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n这里汇聚', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '3000+', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '定居成都的有趣灵魂。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n周末穿梭周边山野，假期深入川西秘境。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n无论故乡何处，山野间皆是同路人。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n山那边，在成都遇见志同道合的自己。', bold: true, italic: false, underline: false, bgColor: '' },
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
          { text: '三天时间，带你走进', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '川西的山野诗篇', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.25)' },
          { text: '。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '5月2日', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '从成都出发，穿越雅安宝兴，打卡', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '神木垒', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '与', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '硗碛湖', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '，雪山与湖光交织成一幅静谧画卷；次日深入', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '四姑娘山长坪沟', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '，徒步穿越斯古拉寺、枯树滩、上干海子至两河口，在海拔渐升中感受高山草甸与原始森林的呼吸；第三天沿', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '理小路', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '轻徒步，邂逅', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '红石滩', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '与瀑布秘境。', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '节奏舒适，风景高能，适合热爱自然与摄影的你，一起用脚步丈量川西的辽阔与自由。', bold: false, italic: false, underline: false, bgColor: '' },
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
        caption: '',
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
      id: tid('img'),
      type: 'custom',
      componentId: 'image-block',
      props: {
        url: '',
        alt: '活动方案配图',
        width: '100%',
        borderRadius: '16px',
        caption: '',
        captionFontFamily: YOUYUAN,
      },
    },
    {
      id: tid('body'),
      type: 'custom',
      componentId: 'body-text',
      props: {
        segments: [
          { text: '活动时间：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '2026年5月2-4日（周六/周日/周一）', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n活动地点：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '神木垒 / 四姑娘山 / 理小路', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n活动主题：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '欣赏原始景观，体验四季美景', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n徒步距离：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '休闲徒步游', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\n活动形式：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: 'AA结伴同行', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '\nAA费用：', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '580元/人', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.25)' },
        ],
        fontSize: '17',
        lineHeight: '2.0',
        hasBg: true,
        bgCardColor: 'rgba(62,207,142,0.06)',
        fontFamily: YOUYUAN,
      },
    },
    {
      id: tid('tipbox'),
      type: 'custom',
      componentId: 'tip-box',
      props: {
        type: 'tip',
        content: '💰 费用包含\n☞ 交通往返目的地旅游大巴车费（含司机餐补、过路费、油费、停车费）\n☞ 三日徒步保险\n☞ 两正两早（2号晚餐，3号早餐&晚餐，4号早餐）\n☞ 两晚住宿（均为2人间）',
        customIcon: '',
        fontFamily: YOUYUAN,
      },
    },
    {
      id: tid('tipbox'),
      type: 'custom',
      componentId: 'tip-box',
      props: {
        type: 'warning',
        content: '💰 费用不包含\n☞ 沿途涉及的景区门票及转运车费用，请根据自身情况自行购买',
        customIcon: '',
        fontFamily: YOUYUAN,
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
          { text: '\n徒步鞋/运动鞋（防滑很重要！）\n双肩包（省体力） · 1.5L以上饮用水\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '☀️ 防晒', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '\n遮阳帽 · 防晒霜 · 墨镜\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '🎒 其他', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '\n充电宝 · 个人常用药品\n垃圾袋（无痕山野，带走垃圾 🌱）\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '⚠️ 川西高原特别提醒', bold: true, italic: false, underline: false, bgColor: 'rgba(239,68,68,0.2)' },
          { text: '\n此活动路线属于川西高原，天气变化无常，请大家出行务必带上各类雨具，以及保暖衣物，易高反者提前服用防高反药物。', bold: false, italic: false, underline: false, bgColor: '' },
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
        title: '报名方式 · JOIN US',
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
          { text: '⚠️ 名额有限，先到先得，以缴费确认报名为准', bold: false, italic: true, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 06 报名须知 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '06',
        title: '报名须知 · NOTICE',
        bgColor: 'rgba(88,187,144,0.12)',
        numberColor: '#3ecf8e',
        fontFamily: YOUYUAN,
        fontSize: '26',
        titleStyle: 'badge',
      },
    },
    {
      id: tid('checklist'),
      type: 'custom',
      componentId: 'checklist',
      props: {
        items: [
          '凡报名参加者均视为具有完全民事行为能力人，并确认报名参加者的姓名、身份证号码、联系电话准确有效。',
          '所有的报名者必须是身体健康，无任何急慢性病、三高及心脑血管疾病，四肢健全，体力良好，无任何不适于参加户外运动的患者。有极强的动手能力、有团队协作精神、心理健康的健康人士。',
          '活动策划方已为所有参加者购买相关旅游意外保险，如在活动中发生人身损害后果，应立即通知保险公司协调相关事宜，我方不承担赔偿责任，由受损害人依据法律、法规的规定和活动声明依法解决。',
          '代他人报名者必须将以上注意事项告知对方，并保证被代报名者符合参加活动的条件。',
          '户外活动为高风险运动，请大家报名前必须知晓户外运动存在的风险。',
          '没有认真阅读本群活动免责声明者不要报名。',
        ],
        icon: '📍',
        showLine: true,
        accentColor: '#3ecf8e',
        fontFamily: YOUYUAN,
      },
    },

    // ── 07 常见问题 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '07',
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
          { text: '\nA：暂不支持携带宠物。大巴车厢为密闭空间，可能影响其他乘客；徒步路线对毛孩子也不太友好，还请理解 🙏', bold: false, italic: false, underline: false, bgColor: '' },
        ],
        fontSize: '17',
        lineHeight: '1.9',
        hasBg: false,
        bgCardColor: '#fafafa',
        fontFamily: YOUYUAN,
      },
    },

    // ── 08 往期回顾 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '08',
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

    // ── 09 免责申明 ──
    {
      id: tid('title'),
      type: 'custom',
      componentId: 'chapter-title',
      props: {
        number: '09',
        title: '免责申明 · DISCLAIMER',
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
          { text: '凡参加本次户外活动人员必须充分解读以下条款：\n\n', bold: true, italic: false, underline: false, bgColor: '' },
          { text: '❶ 户外活动存在危险与不确定性', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n参加活动人员须年满18周岁（未满十八周岁的未成年人必须有监护人陪同），身体健康，有民事自主能力的公民，并已知晓自己所参与的活动存在不确定性和危险性以及完全理解户外AA制（费用自理/责任自负/风险自担）活动之概念，请参与队员自行认定活动的轻重性，并对出发至返回过程中所有不可预见的意外及风险具备足够的心理及生理承受能力，参加此次活动纯属个人自愿行为，如发生意外与其他同行者无关。建议参加人员购买相关保险。\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '❷ 责任声明', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n本活动为非盈利性质的自助结伴游活动并具有一定的危险性，参加者必须对自己的安全负责，活动中发生意外事故，同行者可根据实际情况组织救援或改变活动计划，但不承担任何法律和经济责任，特此声明。活动开始后，本声明将自动生效并表明你接受本声明，否则，请在活动开始前退出本次活动。\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '❸ 免责条款', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n此户外活动属于自助性质的出行活动，当由于意外事故和急性疾病等不可预测因素造成身体损伤时，其他成员尽力救助，但如果造成了不可逆转的永久损伤，其他成员不承担任何（精神和经济）责任。团队中的任何一个队员本着"在力所能及情况下尽力救助、风险自担"的原则参加救助活动。\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '❹ 关于交通工具的责任条款', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n户外活动所乘的交通工具，遵循哪里上车哪里下车的原则，中途不能要求司机按照自己的意愿停靠，同时，租车活动来回途中因交通事故造成乘员人身伤害和财产损失，按有关法律法规处理，发起人和同行人员不承担任何责任。\n', bold: false, italic: false, underline: false, bgColor: '' },
          { text: '❺ 报名即视为接受声明', bold: true, italic: false, underline: false, bgColor: 'rgba(62,207,142,0.2)' },
          { text: '\n凡报名参加活动者均视为具有完全民事行为能力人，如在活动中发生人身损害及财产损失，发起人及参加活动人员不承担任何赔偿责任，凡报名者均视为接受以上条款声明。代他人报名者，被代报名参加者如遭受人身损害及财产损失，发起人及同行人员不承担赔偿责任，报名并成行人员视同已经接受以上免责条款。', bold: false, italic: false, underline: false, bgColor: '' }
        ],
        fontSize: '15',
        lineHeight: '1.85',
        hasBg: true,
        bgCardColor: 'rgba(62,207,142,0.04)',
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
  { id: 'my-templates', name: '我的模板' },
];
