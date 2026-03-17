import { Project, Scene, Shot, BeatType, Episode } from "@/types";

/**
 * 示例项目数据（用于开发测试）
 */
export const mockProjects: Project[] = [
  {
    id: "proj_demo_001",
    name: "示例项目 - 深夜咖啡馆",
    createdAt: "2026-03-17T10:00:00Z",
    updatedAt: "2026-03-17T14:30:00Z",
    plotInput:
      "深夜，一个失意的中年男人走进一家24小时营业的咖啡馆。他坐在角落，点了一杯黑咖啡。女服务员注意到他眼角的泪痕，默默递上一块芝士蛋糕。男人抬头，两人对视，无需言语。窗外，城市的霓虹灯闪烁，雨开始下。",
    charCount: 95,
    isScriptImported: false,
    duration: 60,
    shotMode: "auto",
    selectedDirector: "wong",
    visualStyle: "cinematic",
    aspectRatio: "2.39:1",
    quality: "high",
    enableBGM: false,
    enableSubtitle: true,
    scriptFaithfulMode: false,
    enableWordFilter: true,
    autoSafetyCheck: true,
    strictMode: false,
    stcEnabled: true,
    assets: {
      character: [
        {
          id: "char_001",
          type: "character",
          name: "失意男人",
          desc: "中年男性，西装革履但略显凌乱，眼角有泪痕，眼神疲惫",
        },
        {
          id: "char_002",
          type: "character",
          name: "女服务员",
          desc: "年轻女性，短发，眼神温柔，穿着咖啡馆制服",
        },
      ],
      image: [
        {
          id: "img_001",
          type: "image",
          name: "深夜咖啡馆",
          desc: "24小时营业的复古咖啡馆，暖黄灯光，木质装潢，落地窗外是城市夜景",
        },
      ],
      props: [
        {
          id: "prop_001",
          type: "props",
          name: "黑咖啡",
          desc: "冒着热气的黑咖啡，装在白色陶瓷杯中",
        },
        {
          id: "prop_002",
          type: "props",
          name: "芝士蛋糕",
          desc: "三角形芝士蛋糕，放在白色瓷盘上，配有一把小银叉",
        },
      ],
      assetNameMap: {
        失意男人: "@人物1",
        女服务员: "@人物2",
        深夜咖啡馆: "@图片1",
        黑咖啡: "@道具1",
        芝士蛋糕: "@道具2",
      },
      assetTagEnabled: {
        character: true,
        image: true,
        props: true,
      },
    },
    currentPlatformId: "platform_default",
    platforms: [
      {
        id: "platform_default",
        name: "默认平台",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4",
        mode: "openai",
        apiKey: "",
      },
    ],
    episodes: [
      {
        id: "ep_001",
        name: "深夜咖啡馆",
        plotInput:
          "深夜，一个失意的中年男人走进一家24小时营业的咖啡馆。他坐在角落，点了一杯黑咖啡。女服务员注意到他眼角的泪痕，默默递上一块芝士蛋糕。男人抬头，两人对视，无需言语。窗外，城市的霓虹灯闪烁，雨开始下。",
        scenes: [
          {
            id: "scene_001",
            name: "开场画面",
            beatType: "opening",
            duration: 8,
            narrativeMode: "mini",
            contentSummary: "深夜城市空镜，咖啡馆外观，男人推门进入",
            bridgeState: {
              charPosition: "门口",
              lightPhase: "霓虹灯冷光",
              environment: "雨夜城市",
              keyProp: "无",
            },
          },
          {
            id: "scene_002",
            name: "铺垫",
            beatType: "setup",
            duration: 20,
            narrativeMode: "mini",
            contentSummary: "男人坐在角落，点咖啡，女服务员观察到他眼角泪痕",
            bridgeState: {
              charPosition: "角落座位",
              lightPhase: "暖黄顶光",
              environment: "咖啡馆内",
              keyProp: "咖啡杯",
            },
          },
          {
            id: "scene_003",
            name: "催化剂",
            beatType: "catalyst",
            duration: 12,
            narrativeMode: "mini",
            contentSummary: "女服务员默默递上芝士蛋糕，两人对视",
            bridgeState: {
              charPosition: "与服务员对视",
              lightPhase: "暖光侧逆",
              environment: "咖啡馆内",
              keyProp: "芝士蛋糕",
            },
          },
          {
            id: "scene_004",
            name: "争执",
            beatType: "debate",
            duration: 15,
            narrativeMode: "mini",
            contentSummary: "男人犹豫是否接受，内心挣扎，最终接过",
            bridgeState: {
              charPosition: "接过蛋糕",
              lightPhase: "柔和暖光",
              environment: "咖啡馆内",
              keyProp: "芝士蛋糕",
            },
          },
          {
            id: "scene_005",
            name: "进入第二幕",
            beatType: "act2in",
            duration: 5,
            narrativeMode: "mini",
            contentSummary: "窗外雨下大，霓虹灯倒映在玻璃上，男人开始吃蛋糕",
            bridgeState: {
              charPosition: "面向窗户",
              lightPhase: "霓虹反射",
              environment: "雨夜咖啡馆",
              keyProp: "蛋糕+窗外雨景",
            },
          },
        ],
        shots: [
          {
            id: "shot_001",
            sceneId: "scene_001",
            index: 1,
            globalIndex: 1,
            type: "全景",
            duration: 3,
            timeRange: "0-3s",
            env: "@图片1 深夜雨中的城市街道，霓虹灯闪烁",
            action: "无",
            light: "冷色调霓虹光，雨夜氛围",
            tension: "悬念→",
            seedancePrompt:
              "镜头：全景固定 环境：在@图片1 深夜雨中的城市街道，霓虹灯闪烁，湿漉漉的路面倒映灯光 角色分动：无 光影：冷色调霓虹光，雨夜氛围 戏剧张力：悬念→ | 全景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_002",
            sceneId: "scene_001",
            index: 2,
            globalIndex: 2,
            type: "中景",
            duration: 5,
            timeRange: "3-8s",
            env: "@图片1 咖啡馆门口，暖黄灯光从门内透出",
            action: "@人物1 正推开门走进来",
            light: "冷暖对比，外部冷光与内部暖光",
            tension: "紧张↑",
            seedancePrompt:
              "镜头：中景跟拍 环境：在@图片1 咖啡馆门口，暖黄灯光从门内透出 角色分动：@人物1 中年失意男人正推开门走进来，西装略显凌乱，眼神疲惫 光影：冷暖对比，外部冷光与内部暖光 戏剧张力：紧张↑ | 中景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_003",
            sceneId: "scene_002",
            index: 1,
            globalIndex: 3,
            type: "特写",
            duration: 4,
            timeRange: "8-12s",
            env: "@图片1 咖啡馆角落，木质桌椅",
            action: "@人物1 正垂着头坐在角落",
            light: "暖黄顶光，面部半阴影",
            tension: "压抑↓",
            seedancePrompt:
              "镜头：特写固定 环境：在@图片1 咖啡馆角落，木质桌椅，暖黄灯光 角色分动：@人物1 正垂着头坐在角落，双手放在桌上，眼角有泪痕 细节：嘴角下垂，眉头紧锁 光影：暖黄顶光，面部半阴影 音效：咖啡馆环境音，雨声背景 | 特写 | 2.39:1 | --quality high",
          },
          {
            id: "shot_004",
            sceneId: "scene_002",
            index: 2,
            globalIndex: 4,
            type: "近景",
            duration: 5,
            timeRange: "12-17s",
            env: "@图片1 吧台视角望向角落",
            action: "@人物2 正看向@人物1，眼神担忧",
            light: "侧光，面部柔和",
            tension: "温情→",
            seedancePrompt:
              "镜头：近景切换 环境：在@图片1 吧台视角望向角落 角色分动：@人物2 女服务员正看向@人物1，眼神温柔担忧 细节：眉头微皱，嘴角轻抿 光影：侧光，面部柔和 音效：轻柔爵士乐 | 近景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_005",
            sceneId: "scene_002",
            index: 3,
            globalIndex: 5,
            type: "中景",
            duration: 6,
            timeRange: "17-23s",
            env: "@图片1 咖啡馆中央，其他顾客虚焦",
            action: "@人物2 正端着托盘走向@人物1",
            light: "逆光，轮廓光",
            tension: "期待→",
            seedancePrompt:
              "镜头：中景横移 环境：在@图片1 咖啡馆中央，其他顾客虚焦背景 角色分动：@人物2 正端着托盘走向@人物1，托盘上有@道具2 芝士蛋糕 光影：逆光，服务员轮廓光 戏剧张力：期待→ | 中景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_006",
            sceneId: "scene_003",
            index: 1,
            globalIndex: 6,
            type: "特写",
            duration: 4,
            timeRange: "23-27s",
            env: "@图片1 角落桌面特写",
            action: "@人物2 正将@道具2 放在桌上",
            light: "桌面暖光",
            tension: "温暖↑",
            seedancePrompt:
              "镜头：特写俯拍 环境：在@图片1 角落桌面特写 角色分动：@人物2 正将@道具2 芝士蛋糕放在桌上，动作轻柔 光影：桌面暖光，蛋糕质感诱人 音效：杯盘轻放声 | 特写 | 2.39:1 | --quality high",
          },
          {
            id: "shot_007",
            sceneId: "scene_003",
            index: 2,
            globalIndex: 7,
            type: "近景",
            duration: 5,
            timeRange: "27-32s",
            env: "@图片1 两人对视视角",
            action: "@人物1 正抬头看向@人物2，眼神复杂",
            light: "眼神光，柔和暖光",
            tension: "温情↑",
            seedancePrompt:
              "镜头：近景对切 环境：在@图片1 两人对视视角 角色分动：@人物1 正抬头看向@人物2，眼神从惊讶到感激 细节：眼眶微红，嘴角微微上扬 光影：眼神光，柔和暖光 戏剧张力：温情↑ | 近景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_008",
            sceneId: "scene_003",
            index: 3,
            globalIndex: 8,
            type: "特写",
            duration: 3,
            timeRange: "32-35s",
            env: "@图片1 @人物2 面部特写",
            action: "@人物2 正微笑点头，无需言语",
            light: "面部光，温暖柔和",
            tension: "平静→",
            seedancePrompt:
              "镜头：特写固定 环境：在@图片1 @人物2 面部特写 角色分动：@人物2 正微笑点头，无需言语 细节：嘴角上扬，眼神温柔 光影：面部光，温暖柔和 | 特写 | 2.39:1 | --quality high",
          },
          {
            id: "shot_009",
            sceneId: "scene_004",
            index: 1,
            globalIndex: 9,
            type: "近景",
            duration: 5,
            timeRange: "35-40s",
            env: "@图片1 @人物1 手部特写",
            action: "@人物1 正犹豫地伸向@道具2",
            light: "手部暖光",
            tension: "犹豫→",
            seedancePrompt:
              "镜头：近景特写 环境：在@图片1 手部特写 角色分动：@人物1 正犹豫地伸向@道具2 芝士蛋糕，手指微微颤抖 光影：手部暖光 戏剧张力：犹豫→ | 近景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_010",
            sceneId: "scene_004",
            index: 2,
            globalIndex: 10,
            type: "中景",
            duration: 5,
            timeRange: "40-45s",
            env: "@图片1 角落座位侧面",
            action: "@人物1 正拿起叉子开始吃蛋糕",
            light: "侧面暖光",
            tension: "释然→",
            seedancePrompt:
              "镜头：中景侧面 环境：在@图片1 角落座位侧面 角色分动：@人物1 正拿起叉子开始吃@道具2 芝士蛋糕，动作缓慢 光影：侧面暖光 音效：轻微餐具声 | 中景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_011",
            sceneId: "scene_004",
            index: 3,
            globalIndex: 11,
            type: "特写",
            duration: 5,
            timeRange: "45-50s",
            env: "@图片1 @人物1 面部特写",
            action: "@人物1 正咀嚼，眼眶微红",
            light: "面部特写光",
            tension: "感动↑",
            seedancePrompt:
              "镜头：特写面部 环境：在@图片1 @人物1 面部特写 角色分动：@人物1 正咀嚼蛋糕，眼眶微红，一滴泪滑落 细节：嘴角上扬带泪 光影：面部特写光 戏剧张力：感动↑ | 特写 | 2.39:1 | --quality high",
          },
          {
            id: "shot_012",
            sceneId: "scene_005",
            index: 1,
            globalIndex: 12,
            type: "全景",
            duration: 5,
            timeRange: "50-55s",
            env: "@图片1 窗外雨景，霓虹灯倒映",
            action: "@人物1 背对镜头望向窗外",
            light: "霓虹反射光",
            tension: "诗意→",
            seedancePrompt:
              "镜头：全景窗景 环境：在@图片1 窗外雨景，霓虹灯倒映在玻璃上，雨丝清晰可见 角色分动：@人物1 背对镜头望向窗外，轮廓剪影 光影：霓虹反射光，蓝紫色调 戏剧张力：诗意→ | 全景 | 2.39:1 | --quality high",
          },
          {
            id: "shot_013",
            sceneId: "scene_005",
            index: 2,
            globalIndex: 13,
            type: "中景",
            duration: 5,
            timeRange: "55-60s",
            env: "@图片1 咖啡馆内，暖光氛围",
            action: "@人物1 继续吃蛋糕，@人物2 在吧台后微笑",
            light: "暖色氛围光",
            tension: "温暖→",
            seedancePrompt:
              "镜头：中景双人中景 环境：在@图片1 咖啡馆内，暖光氛围，雨声背景 角色分动：@人物1 继续吃蛋糕，@人物2 在吧台后微笑注视 光影：暖色氛围光 戏剧张力：温暖→ | 中景 | 2.39:1 | --quality high",
          },
        ],
      },
    ],
  },
];

/**
 * 空项目模板
 */
export function createEmptyProject(): Project {
  const now = new Date().toISOString();
  return {
    id: `proj_${Date.now()}`,
    name: "未命名项目",
    createdAt: now,
    updatedAt: now,
    plotInput: "",
    charCount: 0,
    isScriptImported: false,
    duration: 60,
    shotMode: "auto",
    selectedDirector: "nolan",
    visualStyle: "cinematic",
    aspectRatio: "2.39:1",
    quality: "high",
    enableBGM: false,
    enableSubtitle: true,
    scriptFaithfulMode: false,
    enableWordFilter: true,
    autoSafetyCheck: true,
    strictMode: false,
    stcEnabled: true,
    assets: {
      character: [],
      image: [],
      props: [],
      assetNameMap: {},
      assetTagEnabled: {
        character: true,
        image: true,
        props: true,
      },
    },
    currentPlatformId: "platform_default",
    platforms: [
      {
        id: "platform_default",
        name: "默认平台",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4",
        mode: "openai",
        apiKey: "",
      },
    ],
    episodes: [
      {
        id: `ep_${Date.now()}`,
        name: "第一集",
        plotInput: "",
        scenes: [],
        shots: [],
      },
    ],
  };
}

/**
 * 示例剧本（用于测试输入）
 */
export const samplePlots = [
  {
    title: "深夜咖啡馆",
    content:
      "深夜，一个失意的中年男人走进一家24小时营业的咖啡馆。他坐在角落，点了一杯黑咖啡。女服务员注意到他眼角的泪痕，默默递上一块芝士蛋糕。男人抬头，两人对视，无需言语。窗外，城市的霓虹灯闪烁，雨开始下。",
  },
  {
    title: "追逐",
    content:
      "深夜的东京街头，一个黑衣特工在雨中狂奔。身后，三辆黑色轿车紧追不舍。特工拐进一条小巷，爬上消防梯。他在楼顶喘息，从口袋里掏出一个闪烁红光的U盘。追兵的脚步声越来越近...",
  },
  {
    title: "告白",
    content:
      "樱花树下，男孩紧张地攥着情书。女孩走来，微风吹起她的长发。男孩深呼吸，刚要开口，一阵风吹走了情书。两人追着情书奔跑，笑声回荡在春天的校园里。最后，情书落在喷泉中，两人相视而笑。",
  },
];
