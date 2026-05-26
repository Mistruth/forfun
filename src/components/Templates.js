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
  id: "outdoor-hiking",
  name: "楠木溪徒步活动",
  description: "邛崃楠木溪纳凉休闲游，适合户外俱乐部、徒步团队的公众号推文",
  category: "活动推文",
  cover: "🏞️",
  blocks: [
    {
      id: "tpl_title_1",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "01",
        title: "序 · THE VIBE",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_body_2",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: true,
        bgCardColor: "rgba(62,207,142,0.06)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700; font-style: italic; background-color: rgba(62,207,142,0.12); padding: 1px 5px; border-radius: 3px\">&quot;走出去，寻故事，造可能。&quot;</span><br>山那边，不仅是风景，更是远方。<br>这里汇聚<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">3000+</span>定居成都的有趣灵魂。<br>周末穿梭周边山野，假期深入川西秘境。<br>无论故乡何处，山野间皆是同路人。<span style=\"font-weight: 700\"><br>山那边，在成都遇见志同道合的自己。</span>"
      }
    },
    {
      id: "tpl_body_3",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: false,
        bgCardColor: "#fafafa",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.25); padding: 1px 5px; border-radius: 3px\">楠木溪</span>，这是一条约4公里长的狭长河谷，周围群峰耸峙，谷中瀑布飞泻、溪流潺潺、叠泉幽潭、错落有致。这条溪流从邛崃山脉中缓缓流淌，清澈见底。四周青山环抱，绿树成荫。溪流的两岸，山势还是平缓，植被覆盖率超高，<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">空气好的遭不住</span>。夏天来这里简直不要太凉快！<br><br>放空自己走在路上，感受慢生活，耳听潺潺的流水声，感受着沿溪送来的阵阵山风，甚觉浑身舒畅，神情气爽，使人产生远离尘世的感慨。"
      }
    },
    {
      id: "tpl_title_4",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "02",
        title: "本周目的地 · DESTINATION",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_img_5",
      type: "custom",
      componentId: "image-block",
      props: {
        url: "",
        alt: "目的地风景大图",
        width: "100%",
        borderRadius: "16px",
        caption: "",
        captionFontFamily: YOUYUAN
      }
    },
    {
      id: "tpl_body_6",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: true,
        bgCardColor: "rgba(62,207,142,0.06)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700\">📍 路线 A ｜</span><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\"> 进阶徒步线</span><span style=\"font-weight: 700\"><br><br>徒步距离：</span><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">8-10公里</span><br>✦ 下车后先参观&quot;红军长征纪念馆&quot;（半小时）<br>✦ 从楠木溪沟口进入，全长约4公里<br>✦ 午餐后继续徒步，可穿越到纪念馆上车或原路往返"
      }
    },
    {
      id: "tpl_body_7",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: true,
        bgCardColor: "rgba(99,179,237,0.06)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700\">📍 路线 B ｜</span><span style=\"font-weight: 700; background-color: rgba(99,179,237,0.2); padding: 1px 5px; border-radius: 3px\"> 轻松休闲线<br></span><br>✦ 参观红军长征纪念馆<br>✦ 楠木溪沟口徒步4公里<br>✦ 午餐后在农家乐自由玩耍，享受悠闲时光"
      }
    },
    {
      id: "tpl_title_8",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "03",
        title: "活动方案 · ACTIVITY PLAN",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_img_9",
      type: "custom",
      componentId: "image-block",
      props: {
        url: "",
        alt: "活动方案配图",
        width: "100%",
        borderRadius: "16px",
        caption: "",
        captionFontFamily: YOUYUAN
      }
    },
    {
      id: "tpl_body_10",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "2.0",
        hasBg: true,
        bgCardColor: "rgba(62,207,142,0.06)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700\">活动时间：</span>2026年5月17日（周天）<span style=\"font-weight: 700\"><br>活动地点：</span>邛崃 - 楠木溪<span style=\"font-weight: 700\"><br>活动主题：</span>纳凉/吸氧休闲游<span style=\"font-weight: 700\"><br>徒步路线：</span>A线8-10㎞，B线3-5㎞<span style=\"font-weight: 700\"><br>活动形式：</span>包车，AA结伴同行<span style=\"font-weight: 700\"><br>AA费用：</span><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.25); padding: 1px 5px; border-radius: 3px\">80元/人</span>"
      }
    },
    {
      id: "tpl_tipbox_11",
      type: "custom",
      componentId: "tip-box",
      props: {
        type: "tip",
        content: "💰 费用包含\n☞ 往返大巴车费\n☞ 司机餐补\n☞ 一日保险",
        customIcon: "",
        fontFamily: YOUYUAN,
        variant: "classic",
        title: ""
      }
    },
    {
      id: "tpl_tipbox_12",
      type: "custom",
      componentId: "tip-box",
      props: {
        type: "warning",
        content: "💰 费用不包含\n☞ 所有的自费项目，包括餐费",
        customIcon: "",
        fontFamily: YOUYUAN,
        variant: "classic",
        title: ""
      }
    },
    {
      id: "tpl_body_13",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "2.0",
        hasBg: false,
        bgCardColor: "#fafafa",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🚌  08:00</span>  集合出发<br>📍 集合地点：桐梓林地铁站B口前行200米<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🥾  10:30</span>  预计到达目的地，开始徒步活动<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🍱  12:00</span>  午餐时间，AB线分流<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🏔️  16:00</span>  收队返程，所有徒友上车 🚌<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🏠  18:00</span>  预计回到成都，期待下次再见 👋"
      }
    },
    {
      id: "tpl_title_14",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "04",
        title: "装备清单 · GEAR LIST",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_body_15",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: true,
        bgCardColor: "rgba(255,237,213,0.5)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700\">👟 必备</span><br>徒步鞋/运动鞋（防滑很重要！）<br>双肩包（省体力） · 1.5L以上饮用水<br><span style=\"font-weight: 700\">☀️ 防晒</span><br>遮阳帽 · 防晒霜 · 墨镜<br><span style=\"font-weight: 700\">🎒 其他</span><br>充电宝 · 个人常用药品<br>垃圾袋（无痕山野，带走垃圾 🌱）<br>"
      }
    },
    {
      id: "tpl_title_16",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "05",
        title: "报名方式 · JOIN US",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_img_17",
      type: "custom",
      componentId: "image-block",
      props: {
        url: "",
        alt: "报名二维码",
        width: "180px",
        borderRadius: "12px",
        caption: "扫码关注 / 添加领队微信",
        captionFontFamily: YOUYUAN
      }
    },
    {
      id: "tpl_body_18",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: false,
        bgCardColor: "#fafafa",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-style: italic\">⚠️ 名额有限，先到先得，以缴费确认报名为准</span>"
      }
    },
    {
      id: "tpl_title_19",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "06",
        title: "报名须知 · NOTICE",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_checklist_20",
      type: "custom",
      componentId: "checklist",
      props: {
        items: [
          "凡报名参加者均视为具有完全民事行为能力人，并确认报名参加者的姓名、身份证号码、联系电话准确有效。",
          "所有的报名者必须是身体健康，无任何急慢性病、三高及心脑血管疾病，四肢健全，体力良好，无任何不适于参加户外运动的患者。有极强的动手能力、有团队协作精神、心理健康的健康人士。",
          "活动策划方已为所有参加者购买相关旅游意外保险，如在活动中发生人身损害后果，应立即通知保险公司协调相关事宜，我方不承担赔偿责任，由受损害人依据法律、法规的规定和活动声明依法解决。",
          "代他人报名者必须将以上注意事项告知对方，并保证被代报名者符合参加活动的条件。",
          "户外活动为高风险运动，请大家报名前必须知晓户外运动存在的风险。",
          "没有认真阅读本群活动免责声明者不要报名。"
        ],
        icon: "📍",
        showLine: true,
        accentColor: "#3ecf8e",
        fontFamily: YOUYUAN
      }
    },
    {
      id: "tpl_title_21",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "07",
        title: "常见问题 · FAQ",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_body_22",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "17",
        lineHeight: "1.9",
        hasBg: false,
        bgCardColor: "#fafafa",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.15); padding: 1px 5px; border-radius: 3px\">Q：我是一个人，可以参加吗？</span><br>A：当然！一半以上都是独自报名的&quot;独行侠&quot;，领队会组织破冰，分分钟找到志同道合的搭子 🤝<br><br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.15); padding: 1px 5px; border-radius: 3px\">Q：体力不好，会跟不上吗？</span><br>A：配备双领队（头驴+收队），不落下任何一个人。选对难度等级，完全不用担心！💪<br><br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.15); padding: 1px 5px; border-radius: 3px\">Q：下雨怎么办？</span><br>A：小雨正常出发（雨中徒步更有氛围感 🌧️），极端天气提前一天通知，全额退费。<br><br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.15); padding: 1px 5px; border-radius: 3px\">Q：可以带宠物吗？</span><br>A：暂不支持携带宠物。大巴车厢为密闭空间，可能影响其他乘客；徒步路线对毛孩子也不太友好，还请理解 🙏"
      }
    },
    {
      id: "tpl_title_23",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "08",
        title: "往期回顾 · MEMORIES",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_img_24",
      type: "custom",
      componentId: "image-block",
      props: {
        url: "",
        alt: "往期活动照片",
        width: "100%",
        borderRadius: "16px",
        captionFontFamily: YOUYUAN
      }
    },
    {
      id: "tpl_body_25",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "18",
        lineHeight: "2.0",
        hasBg: false,
        bgCardColor: "#fafafa",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700; font-style: italic; background-color: rgba(62,207,142,0.12); padding: 1px 5px; border-radius: 3px\">&quot;山野没有信号，但有更好的连接。&quot; 🌿</span><br><br>这个周末，山里见！"
      }
    },
    {
      id: "tpl_title_26",
      type: "custom",
      componentId: "chapter-title",
      props: {
        number: "09",
        title: "免责申明 · DISCLAIMER",
        bgColor: "rgba(88,187,144,0.12)",
        numberColor: "#3ecf8e",
        fontFamily: YOUYUAN,
        fontSize: "26",
        titleStyle: "badge"
      }
    },
    {
      id: "tpl_body_27",
      type: "custom",
      componentId: "body-text",
      props: {
        fontSize: "15",
        lineHeight: "1.85",
        hasBg: true,
        bgCardColor: "rgba(62,207,142,0.04)",
        fontFamily: YOUYUAN,
        contentHtml: "<span style=\"font-weight: 700\">凡参加本次户外活动人员必须充分解读以下条款：<br><br></span><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">❶ 户外活动存在危险与不确定性</span><br>参加活动人员须年满18周岁（未满十八周岁的未成年人必须有监护人陪同），身体健康，有民事自主能力的公民，并已知晓自己所参与的活动存在不确定性和危险性以及完全理解户外AA制（费用自理/责任自负/风险自担）活动之概念，请参与队员自行认定活动的轻重性，并对出发至返回过程中所有不可预见的意外及风险具备足够的心理及生理承受能力，参加此次活动纯属个人自愿行为，如发生意外与其他同行者无关。建议参加人员购买相关保险。<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">❷ 责任声明</span><br>本活动为非盈利性质的自助结伴游活动并具有一定的危险性，参加者必须对自己的安全负责，活动中发生意外事故，同行者可根据实际情况组织救援或改变活动计划，但不承担任何法律和经济责任，特此声明。活动开始后，本声明将自动生效并表明你接受本声明，否则，请在活动开始前退出本次活动。<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">❸ 免责条款</span><br>此户外活动属于自助性质的出行活动，当由于意外事故和急性疾病等不可预测因素造成身体损伤时，其他成员尽力救助，但如果造成了不可逆转的永久损伤，其他成员不承担任何（精神和经济）责任。团队中的任何一个队员本着&quot;在力所能及情况下尽力救助、风险自担&quot;的原则参加救助活动。<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">❹ 关于交通工具的责任条款</span><br>户外活动所乘的交通工具，遵循哪里上车哪里下车的原则，中途不能要求司机按照自己的意愿停靠，同时，租车活动来回途中因交通事故造成乘员人身伤害和财产损失，按有关法律法规处理，发起人和同行人员不承担任何责任。<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">❺ 报名即视为接受声明</span><br>凡报名参加活动者均视为具有完全民事行为能力人，如在活动中发生人身损害及财产损失，发起人及参加活动人员不承担任何赔偿责任，凡报名者均视为接受以上条款声明。代他人报名者，被代报名参加者如遭受人身损害及财产损失，发起人及同行人员不承担赔偿责任，报名并成行人员视同已经接受以上免责条款。"
      }
    }
  ]
};

const cloneTemplateBlock = (block) => ({
  ...block,
  id: block.id.replace('tpl_', 'tpl_mutuo_'),
  props: block.props ? JSON.parse(JSON.stringify(block.props)) : undefined,
});

const withContentHtml = (block, contentHtml, overrides = {}) => ({
  ...block,
  props: {
    ...block.props,
    ...overrides,
    contentHtml,
  },
});

// ─── 牟托羌寨车厘子采摘活动模板 ────────────────────────────────────────────────
const mutuoCherryHikingTemplate = {
  ...outdoorHikingTemplate,
  id: "mutuo-cherry-hiking",
  name: "牟托羌寨车厘子采摘",
  description: "牟托羌寨轻徒步与高山车厘子采摘活动推文，保留默认户外活动模板章节与风格",
  cover: "🍒",
  blocks: outdoorHikingTemplate.blocks
    .filter((sourceBlock) => !["tpl_body_6", "tpl_body_7"].includes(sourceBlock.id))
    .map((sourceBlock) => {
      const block = cloneTemplateBlock(sourceBlock);

      switch (sourceBlock.id) {
        case "tpl_body_2":
          return withContentHtml(
            block,
            "牟托羌寨，位于阿坝州茂县，是一座依山而建的古老羌族村落。寨子四周青山环抱，碉楼矗立，石板路蜿蜒其间，保留着浓郁的羌族风情。初夏时节，满山的 <span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">高山车厘子</span> 挂满枝头，红得诱人∞",
            {
              hasBg: true,
              bgCardColor: "rgba(62,207,142,0.06)",
            }
          );

        case "tpl_body_3":
          return withContentHtml(
            block,
            "沿着山谷轻徒步，吹着初夏山风，感受羌寨的慢节奏，再摘一筐甜到心里的车厘子—一这才是周末该有的样子。",
            {
              hasBg: false,
              bgCardColor: "#fafafa",
            }
          );

        case "tpl_title_4":
          return {
            ...block,
            props: {
              ...block.props,
              title: "本周目的地 · DESTINATION",
            },
          };

        case "tpl_body_10":
          return withContentHtml(
            block,
            "<p><strong>活动时间：</strong>5月31日（周日）<strong><br>出发时间：</strong>早上8:00，桐梓林地铁口<strong><br>活动地点：</strong>牟托羌寨<strong><br>活动路线：</strong>预计11点左右到达羌寨，上午游玩寨子，午餐自行解决，下午可进园采摘购买。<strong><br>活动主题：</strong>休息徒步，采摘车厘子<strong><br>活动费用：110元/人</strong></p>",
            {
              lineHeight: "2.0",
              hasBg: true,
              bgCardColor: "rgba(62,207,142,0.06)",
            }
          );

        case "tpl_tipbox_11":
          return {
            ...block,
            props: {
              ...block.props,
              type: "tip",
              content: "💰 费用包含\n☞ 往返大巴车费\n☞ 司机餐补\n☞ 一日徒步保险",
            },
          };

        case "tpl_tipbox_12":
          return {
            ...block,
            props: {
              ...block.props,
              type: "warning",
              content: "💰 费用不包含\n☞ 徒步午餐\n☞ 所有自费项目",
            },
          };

        case "tpl_body_13":
          return withContentHtml(
            block,
            "<span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🚌  08:00</span>  桐梓林地铁口集合出发<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🏔️  11:00</span>  预计到达牟托羌寨，上午游玩寨子<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🍱  12:00</span>  午餐自行解决，按现场节奏自由安排<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🍒  下午</span>  可进园采摘购买高山车厘子<br><span style=\"font-weight: 700; background-color: rgba(62,207,142,0.2); padding: 1px 5px; border-radius: 3px\">🏠  适时</span>  收队返程，期待下次山野再见 👋",
            {
              lineHeight: "2.0",
              hasBg: false,
              bgCardColor: "#fafafa",
            }
          );

        case "tpl_body_25":
          return withContentHtml(
            block,
            "<span style=\"font-weight: 700; font-style: italic; background-color: rgba(62,207,142,0.12); padding: 1px 5px; border-radius: 3px\">&quot;山野没有信号，但有更好的连接。&quot; 🌿</span><br><br>这个周末，牟托羌寨见！",
            {
              fontSize: "18",
              lineHeight: "2.0",
            }
          );

        default:
          return block;
      }
    }),
};

// ─── 模板列表 ────────────────────────────────────────────────
export const templates = [
  outdoorHikingTemplate,
  mutuoCherryHikingTemplate,
];

// 按分类分组
export const templateCategories = [
  { id: 'all', name: '全部模板' },
  { id: '活动推文', name: '活动推文' },
  { id: 'my-templates', name: '我的模板' },
];
