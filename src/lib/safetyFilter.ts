/**
 * 安全过滤模块
 * 来源：soullensV5.1.html 的 Jt 替换词表和 se 禁词表
 * 用途：敏感词替换和四区检测
 */

// ============================================
// 替换词表 (Jt) - 自动替换
// ============================================

export const replacementTable: Record<string, string> = {
  // 真人相关
  "真人": "3D渲染角色",
  "真实人物": "数字艺术形象",
  "真人照片": "CGI角色",
  "本人": "虚拟形象",
  "换脸": "形象转换",
  "Deepfake": "数字艺术",
  "伪造身份": "虚拟身份",
  "模仿名人": "风格化角色",
  "数字分身": "虚拟化身",
  "克隆声音": "合成音效",
  "还原本人": "角色还原",
  "真实人脸": "动漫风格面部",
  "身份证照": "虚拟证件",
  "护照照片": "虚拟证件",
  "监控画面": "监控风格画面",
  "偷拍视角": "隐蔽视角",

  // 政治人物
  "习近平": "重要人物",
  "李克强": "重要人物",
  "毛泽东": "历史人物",
  "邓小平": "历史人物",
  "特朗普": "外国政要",
  "拜登": "外国政要",
  "普京": "外国政要",
  "国家领导人": "重要人物",
  "政党": "组织",
  "政治事件": "重要事件",
  "抗议": "集会",
  "示威": "表达",
  "暴乱": "混乱场面",
  "敏感日期": "特殊日期",
  "国旗": "旗帜",
  "国徽": "徽章",
  "地图边界": "地理区域",
  "战争罪行": "冲突事件",
  "恐怖组织": "神秘组织",
  "极端主义": "激进思想",
  "江泽民": "历史人物",
  "胡锦涛": "历史人物",
  "Trump": "外国政要",
  "Biden": "外国政要",
  "Putin": "外国政要",

  // 色情相关
  "色情": "艺术表现",
  "裸体": "优雅着装",
  "裸露": "得体服饰",
  "性爱": "亲密时刻",
  "性交": "情感交流",
  "生殖器": "身体部位",
  "乳房": "胸部轮廓",
  "臀部特写": "身形",
  "高潮": "情感顶点",
  "性暗示": "浪漫暗示",
  "诱惑姿势": "优雅姿态",
  "成人用品": "生活用品",
  "AV": "影视作品",
  "hentai": "动漫风格",
  "恋童": "未成年人",
  "未成年人色情": "青少年内容",
  "软色情": "暧昧氛围",
  "擦边球": "边界内容",
  "内衣秀": "时尚展示",

  // 暴力相关
  "血腥": "激烈动作",
  "断肢": "肢体动作",
  "残骸": "碎片",
  "大量出血": "红色液体",
  "杀戮": "戏剧冲突",
  "自杀": "内心挣扎",
  "自残": "情感释放",
  "上吊": "悬挂",
  "酷刑": "紧张对峙",
  "虐待": "压迫感",
  "恐怖分子": "神秘人物",
  "僵尸": "奇异生物",
  "鬼怪": "神秘存在",
  "灾难现场": "虚构场景",
  "事故现场": "虚构场景",
  "尸体": "静止物体",
  "腐烂": "陈旧",
  "死亡": "静止",
  "鬼魂": "神秘存在",
  "僵尸(过度惊悚)": "奇异生物",
  "鬼怪(过度恐怖)": "神秘存在",
  "灾难现场(真实)": "虚构场景",

  // 违法相关
  "吸毒": "不良习惯",
  "贩毒": "非法交易",
  "制毒": "化学实验",
  "赌博": "娱乐活动",
  "赌场": "娱乐场所",
  "诈骗教程": "防范指南",
  "制造武器": "工业生产",
  "爆炸物": "特效装置",
  "爆炸物制作": "特效装置演示",
  "黑客攻击": "网络安全",
  "盗窃": "不当行为",
  "抢劫": "冲突事件",
  "教唆犯罪": "不当引导",
  "本人上传": "CGI素材引用",

  // 品牌IP
  "Disney": "童话风格",
  "迪士尼": "童话梦幻风格",
  "Marvel": "超级英雄风格",
  "漫威": "科幻超级英雄风格",
  "DC": "漫画风格",
  "Harry Potter": "魔法世界",
  "哈利波特": "魔法学院风格",
  "Nintendo": "游戏风格",
  "任天堂": "游戏风格",
  "Pokemon": "精灵风格",
  "皮卡丘": "电气精灵",
  "Star Wars": "太空史诗",
  "星球大战": "星际战争风格",
  "Pixar": "3D动画",
  "皮克斯": "3D动画风格",
  "Ghibli": "日式动画",
  "宫崎骏": "日式手绘动画风",
  "Transformers": "机甲风格",
  "变形金刚": "机甲变形风格",
  "奥特曼": "特摄英雄",
  "Nike": "运动品牌",
  "耐克": "知名运动品牌",
  "Adidas": "运动品牌",
  "阿迪达斯": "运动品牌",
  "Apple": "科技公司",
  "苹果": "极简设计产品",
  "iPhone": "智能手机",
  "Coca-Cola": "碳酸饮料",
  "可口可乐": "红色罐装饮料",
  "McDonalds": "快餐",
  "麦当劳": "快餐品牌",
  "Mercedes-Benz": "豪华汽车",
  "奔驰": "豪华汽车",
  "BMW": "运动汽车",
  "宝马": "运动汽车",
  "LV": "奢侈品",
  "Louis Vuitton": "奢侈品",
  "Gucci": "时尚品牌",
  "古驰": "时尚品牌",
  "Chanel": "奢侈品牌",
  "香奈儿": "奢侈品牌",

  // 名人（替换为气质描述）
  "成龙": "功夫巨星气质",
  "李连杰": "武术大师气质",
  "周润发": "影帝气质",
  "刘德华": "天王气质",
  "周杰伦": "音乐才子气质",
  "范冰冰": "女神气质",
  "杨幂": "流量明星气质",
  "赵丽颖": "甜美气质",
  "迪丽热巴": "异域美女气质",
  "肖战": "偶像气质",
  "王一博": "酷盖气质",
  "鹿晗": "小鲜肉气质",
  "吴亦凡": "嘻哈气质",
  "黄子韬": "个性气质",
  "王俊凯": "少年偶像气质",
  "易烊千玺": "实力派气质",
  "王源": "阳光少年气质",
  "蔡徐坤": "舞台王者气质",
  "张艺兴": "努力派气质",
  "杨颖": "混血美女气质",
  "刘亦菲": "仙女气质",
  "刘诗诗": "古典美女气质",
  "倪妮": "高级脸气质",
  "汤唯": "文艺气质",
  "章子怡": "国际范气质",
  "巩俐": "女王气质",
  "张曼玉": "影后气质",
  "梁朝伟": "忧郁男神气质",
  "张国荣": "绝代风华气质",
  "周星驰": "喜剧之王气质",
  "黄渤": "实力派气质",
  "沈腾": "喜剧气质",
  "徐峥": "导演气质",
  "吴京": "硬汉气质",
  "甄子丹": "动作巨星气质",
  "李小龙": "功夫宗师气质",
  "姚明": "篮球巨星气质",
  "李娜": "网球冠军气质",
  "Tom Cruise": "动作巨星气质",
  "汤姆克鲁斯": "动作巨星气质",
  "Brad Pitt": "男神气质",
  "布拉德皮特": "男神气质",
  "Leonardo DiCaprio": "实力派气质",
  "莱昂纳多": "实力派气质",
  "Johnny Depp": "怪咖气质",
  "约翰尼德普": "怪咖气质",
  "Robert Downey Jr": "钢铁侠气质",
  "小罗伯特唐尼": "钢铁侠气质",
  "Chris Evans": "美国队长气质",
  "克里斯埃文斯": "美国队长气质",
  "Scarlett Johansson": "黑寡妇气质",
  "斯嘉丽约翰逊": "黑寡妇气质",
  "Angelina Jolie": "女神气质",
  "安吉丽娜朱莉": "女神气质",
  "Jennifer Lawrence": "大表姐气质",
  "詹妮弗劳伦斯": "大表姐气质",
  "Emma Watson": "学霸气质",
  "艾玛沃森": "学霸气质",
  "Natalie Portman": "才女气质",
  "娜塔莉波特曼": "才女气质",
  "Meryl Streep": "影后气质",
  "梅丽尔斯特里普": "影后气质",
  "Dwayne Johnson": "巨石气质",
  "道恩强森": "巨石气质",
  "Will Smith": "Fresh Prince气质",
  "威尔史密斯": "Fresh Prince气质",
  "Tom Hanks": "国民老爸气质",
  "汤姆汉克斯": "国民老爸气质",

  // IP角色
  "孙悟空": "神话英雄",
  "猪八戒": "神话角色",
  "唐僧": "高僧形象",
  "哪吒": "神话少年",
  "关羽": "武圣形象",
  "诸葛亮": "智者形象",
  "曹操": "枭雄形象",
  "刘备": "仁君形象",
  "蜘蛛侠": "超级英雄",
  "钢铁侠": "科技英雄",
  "美国队长": "正义英雄",
  "雷神": "神话英雄",
  "绿巨人": "力量英雄",
  "黑寡妇": "特工英雄",
  "鹰眼": "射手英雄",
  "超人": "氪星英雄",
  "蝙蝠侠": "黑暗骑士",
  "神奇女侠": "亚马逊英雄",
  "闪电侠": "速度英雄",
  "海王": "海洋英雄",
  "哆啦A梦": "机器猫",
  "柯南": "侦探少年",
  "鸣人": "忍者少年",
  "路飞": "海贼少年",
  "佐助": "忍者天才",
  "樱木花道": "篮球少年",
  "流川枫": "篮球天才",
  "蜡笔小新": "调皮小孩",
  "樱桃小丸子": "可爱女孩",
  "马里奥": "水管工",
  "索尼克": "蓝色刺猬",
}

// ============================================
// 禁词四区 (se) - 检测拦截
// ============================================

export const bannedZones = {
  /** 红区：绝对禁止，检测到必须阻断 */
  redZone: [
    "真人照片", "本人上传", "换脸", "Deepfake", "伪造身份", "模仿名人",
    "克隆声音", "还原本人", "真实人脸", "身份证照", "护照照片", "监控画面", "偷拍视角",
    "习近平", "李克强", "毛泽东", "邓小平", "江泽民", "胡锦涛",
    "色情", "裸体", "裸露", "性爱", "性交", "生殖器", "乳房", "臀部特写",
    "高潮", "性暗示", "诱惑姿势", "成人用品", "AV", "hentai", "恋童", "未成年人色情",
    "血腥", "断肢", "残骸", "大量出血", "杀戮", "自杀", "自残", "上吊",
    "酷刑", "虐待", "恐怖分子", "恐怖组织", "极端主义", "尸体", "腐烂",
    "吸毒", "贩毒", "制毒", "赌博", "赌场", "诈骗教程", "制造武器", "爆炸物制作",
    "黑客攻击", "盗窃", "抢劫", "教唆犯罪",
  ],

  /** 黄区：版权/品牌风险，警告 */
  yellowZone: [
    "Disney", "迪士尼", "Marvel", "漫威", "DC",
    "Harry Potter", "哈利波特", "Nintendo", "任天堂", "Pokemon", "皮卡丘",
    "Star Wars", "星球大战", "Pixar", "皮克斯", "Ghibli", "宫崎骏",
    "Transformers", "变形金刚", "奥特曼",
    "Nike", "Adidas", "Apple", "iPhone", "Coca-Cola", "McDonalds",
    "Mercedes-Benz", "BMW", "LV", "Gucci", "Louis Vuitton", "Chanel",
  ],

  /** 名人区：真实人物肖像风险 */
  celebrityZone: [
    "成龙", "李连杰", "周润发", "刘德华", "周杰伦",
    "范冰冰", "杨幂", "赵丽颖", "迪丽热巴", "肖战", "王一博", "鹿晗", "吴亦凡", "黄子韬",
    "王俊凯", "易烊千玺", "王源", "蔡徐坤", "张艺兴", "杨颖", "刘亦菲", "刘诗诗", "倪妮", "汤唯",
    "章子怡", "巩俐", "张曼玉", "梁朝伟", "张国荣", "周星驰", "黄渤", "沈腾", "徐峥",
    "吴京", "甄子丹", "李小龙", "姚明", "李娜",
    "Tom Cruise", "汤姆克鲁斯", "Brad Pitt", "布拉德皮特",
    "Leonardo DiCaprio", "莱昂纳多", "Johnny Depp", "约翰尼德普",
    "Robert Downey Jr", "小罗伯特唐尼", "Chris Evans", "克里斯埃文斯",
    "Scarlett Johansson", "斯嘉丽约翰逊", "Angelina Jolie", "安吉丽娜朱莉",
    "Jennifer Lawrence", "詹妮弗劳伦斯", "Emma Watson", "艾玛沃森",
    "Natalie Portman", "娜塔莉波特曼", "Meryl Streep", "梅丽尔斯特里普",
    "Dwayne Johnson", "道恩强森", "Will Smith", "威尔史密斯", "Tom Hanks", "汤姆汉克斯",
  ],

  /** IP区：知名角色/IP形象风险 */
  ipZone: [
    "孙悟空", "猪八戒", "唐僧", "哪吒", "关羽", "诸葛亮", "曹操", "刘备",
    "蜘蛛侠", "钢铁侠", "美国队长", "雷神", "绿巨人", "黑寡妇", "鹰眼",
    "超人", "蝙蝠侠", "神奇女侠", "闪电侠", "海王",
    "哆啦A梦", "柯南", "鸣人", "路飞", "佐助", "樱木花道", "流川枫",
    "蜡笔小新", "樱桃小丸子", "马里奥", "索尼克",
  ],
}

// ============================================
// 过滤结果类型
// ============================================

export interface SafetyCheckResult {
  /** 替换后的文本 */
  text: string
  /** 所有替换记录 */
  replaced: Array<{ bad: string; good: string }>
  /** 红区词汇替换记录 */
  replacedRedZone: Array<{ bad: string; good: string }>
  /** 黄区词汇替换记录 */
  replacedYellowZone: Array<{ bad: string; good: string }>
  /** 检测到的红区词汇（替换后仍存在） */
  detectedRedZone: string[]
  /** 检测到的黄区词汇 */
  detectedYellowZone: string[]
  /** 检测到的名人名 */
  detectedCelebrity: string[]
  /** 检测到的IP名 */
  detectedIP: string[]
  /** 是否安全（无红区检测） */
  isSafe: boolean
  /** 风险等级 */
  riskLevel: "safe" | "warning" | "danger"
}

// ============================================
// 核心过滤函数
// ============================================

/**
 * 安全检测主函数
 * @param text 原始文本
 * @param enableFilter 是否启用过滤（替换功能）
 * @returns 检测结果
 */
export function safetyCheck(text: string, enableFilter: boolean = true): SafetyCheckResult {
  let processedText = text
  const replaced: Array<{ bad: string; good: string }> = []

  // 1. 执行替换
  if (enableFilter) {
    for (const [bad, good] of Object.entries(replacementTable)) {
      if (processedText.includes(bad)) {
        const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        processedText = processedText.replace(new RegExp(escaped, "g"), good)
        replaced.push({ bad, good })
      }
    }
  }

  // 2. 四区检测
  const detectedRedZone = bannedZones.redZone.filter((word) => processedText.includes(word))
  const detectedYellowZone = bannedZones.yellowZone.filter((word) => processedText.includes(word))
  const detectedCelebrity = bannedZones.celebrityZone.filter((word) => processedText.includes(word))
  const detectedIP = bannedZones.ipZone.filter((word) => processedText.includes(word))

  // 3. 分类替换记录
  const replacedRedZone = replaced.filter(
    (r) => bannedZones.redZone.includes(r.bad)
  )
  const replacedYellowZone = replaced.filter(
    (r) => bannedZones.yellowZone.includes(r.bad) ||
          bannedZones.celebrityZone.includes(r.bad) ||
          bannedZones.ipZone.includes(r.bad)
  )

  // 4. 计算风险等级
  let riskLevel: "safe" | "warning" | "danger" = "safe"
  if (detectedRedZone.length > 0) {
    riskLevel = "danger"
  } else if (detectedYellowZone.length > 0 || detectedCelebrity.length > 0 || detectedIP.length > 0) {
    riskLevel = "warning"
  }

  return {
    text: processedText,
    replaced,
    replacedRedZone,
    replacedYellowZone,
    detectedRedZone,
    detectedYellowZone,
    detectedCelebrity,
    detectedIP,
    isSafe: detectedRedZone.length === 0,
    riskLevel,
  }
}

/**
 * 快速检查文本是否包含红区词汇
 */
export function hasRedZoneContent(text: string): boolean {
  return bannedZones.redZone.some((word) => text.includes(word))
}

/**
 * 快速检查文本是否包含任何风险内容
 */
export function hasAnyRisk(text: string): boolean {
  const allBanned = [
    ...bannedZones.redZone,
    ...bannedZones.yellowZone,
    ...bannedZones.celebrityZone,
    ...bannedZones.ipZone,
  ]
  return allBanned.some((word) => text.includes(word))
}

/**
 * 获取风险报告文本
 */
export function getRiskReport(result: SafetyCheckResult): string {
  const lines: string[] = []

  if (result.replaced.length > 0) {
    lines.push("✓ 已自动替换以下词汇：")
    result.replaced.forEach((r) => {
      lines.push(`  "${r.bad}" → "${r.good}"`)
    })
  }

  if (result.detectedRedZone.length > 0) {
    lines.push("⚠️ 检测到红区词汇（禁止生成）：")
    result.detectedRedZone.forEach((word) => {
      lines.push(`  - ${word}`)
    })
  }

  if (result.detectedYellowZone.length > 0) {
    lines.push("⚠️ 检测到版权/品牌风险：")
    result.detectedYellowZone.forEach((word) => {
      lines.push(`  - ${word}`)
    })
  }

  if (result.detectedCelebrity.length > 0) {
    lines.push("⚠️ 检测到名人名称：")
    result.detectedCelebrity.forEach((word) => {
      lines.push(`  - ${word}`)
    })
  }

  if (result.detectedIP.length > 0) {
    lines.push("⚠️ 检测到IP角色：")
    result.detectedIP.forEach((word) => {
      lines.push(`  - ${word}`)
    })
  }

  return lines.join("\n")
}