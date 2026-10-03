import { TileType, PushBlock } from './types';

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 270;
export const TILE_SIZE = 30; // 16 cols x 9 rows = 480 x 270
export const COLS = 16;
export const ROWS = 9;

export const INITIAL_ROOMS: Record<string, TileType[][]> = {
  // [0, 0] 左上房間：祭壇與隱藏蛋 (需要泡泡二段跳爬到左上方)
  // 增加脆弱裂紋石壁 (8) 擋在捷徑與隱藏石窟前
  '0,0': [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 5, 0, 0, 8, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
  ],

  // [1, 0] 右上房間：機關房間與門 (有推動方塊與地板開關)
  '1,0': [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 3, 1, 1, 1],
    [0, 0, 0, 0, 1, 4, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  ],

  // [0, 1] 左下房間：起始泉池、圖騰與電話亭記錄點 (Tile 9)
  '0,1': [
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 6, 6, 6, 6, 1, 1, 6, 6, 6, 6, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  // [1, 1] 右下房間：地下深處與第 3 顆蛋 (重力感應石臺與隱藏石門解謎)
  '1,1': [
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 11, 5, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 11, 1, 1, 1],
    [1, 1, 1, 0, 10, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
};

export const INITIAL_BLOCKS: PushBlock[] = [
  // Room '1,0': 可推動的石塊，可推上開關 (Tile 4) 或當墊腳石
  {
    id: 1,
    roomKey: '1,0',
    x: 65,
    y: 180,
    w: 22,
    h: 22,
    vx: 0,
    vy: 0,
    grounded: true,
  },
  // Room '1,1': 深淵的可推動石塊，可用來砸碎或借力攀爬
  {
    id: 2,
    roomKey: '1,1',
    x: 160,
    y: 120,
    w: 22,
    h: 22,
    vx: 0,
    vy: 0,
    grounded: true,
  },
];

export const ROOM_NAMES: Record<string, string> = {
  '0,0': '遠古祭壇 (Ancient Altar)',
  '1,0': '機關深閘 (Switch Chamber)',
  '0,1': '幽微泉池 (Glow Springs)',
  '1,1': '深淵幽徑 (Abyssal Cavern)',
};

export const WELL_CREATURES = [
  {
    id: 'phosphor_toad',
    name: '螢光仙蟾',
    englishName: 'Phosphor Toad',
    roomKey: '0,1',
    x: 235,
    y: 195,
    w: 18,
    h: 14,
    avatar: '🐸',
    color: '#38e8ac',
    glowColor: '#45ffb8',
    habitat: '[0,1] 幽微泉池之水畔',
    behaviorDesc: '靜臥於池泉邊緣，喉囊有節律地微光鼓動，對路過的泡泡發出親暱低鳴。',
    lore: '棲息於幽微泉池的古老兩棲生物。相傳牠腹中的囊袋能吞吐地下暗河的純淨靈氣，皮膚常年分泌泛著淡綠磷光的黏液，是地底旅者遇見的第一位友善生靈。',
  },
  {
    id: 'well_feline',
    name: '靈貓幽影',
    englishName: 'Well Feline',
    roomKey: '1,0',
    x: 340,
    y: 75,
    w: 18,
    h: 14,
    avatar: '🐈',
    color: '#e2f9f3',
    glowColor: '#75ffd6',
    habitat: '[1,0] 機關深閘高聳石柱',
    behaviorDesc: '盤踞於遠古石閘之上，尾巴輕柔擺動，好奇凝視著機關的運作。',
    lore: '出沒於石閘高處的神秘影獸，身形飄忽如白色純霧。牠似乎對遠古機關的齒輪轉動聲格外好奇，只在旅者靜立時顯露真身，默默注視著每一次解謎。',
  },
  {
    id: 'abyssal_jelly',
    name: '深淵幽水母',
    englishName: 'Abyssal Jelly',
    roomKey: '1,1',
    x: 240,
    y: 130,
    w: 18,
    h: 18,
    avatar: '🪼',
    color: '#d488ff',
    glowColor: '#e5a3ff',
    habitat: '[1,1] 深淵幽徑深谷空域',
    behaviorDesc: '無重力懸浮於地底懸崖之間，觸鬚泛著神秘紫粉光暈，隨氣流徐徐收縮。',
    lore: '漂浮於無風深淵的半透明浮空生物。其體內儲存著純淨的地核磁場，據說只要凝視其核心的律動，便能忘卻井底的寒冷與幽暗，指引通往深處彩蛋的路。',
  },
  {
    id: 'ancient_gecko',
    name: '遠古靈蜥',
    englishName: 'Ancient Gecko',
    roomKey: '0,0',
    x: 310,
    y: 110,
    w: 18,
    h: 12,
    avatar: '🦎',
    color: '#ffd043',
    glowColor: '#ffe47a',
    habitat: '[0,0] 遠古祭壇殘垣峭壁',
    behaviorDesc: '緊附在斑駁石壁表面，身軀隨環境在翠綠與金黃間微光流轉。',
    lore: '攀附在遠古祭壇殘壁上的守護靈蜥。其背部的菱形鱗片能感應井內所有彩蛋的微弱共鳴，是這座古老地下神殿最長壽的見證者。',
  },
];

export const WEATHER_CONFIGS = {
  CALM: {
    id: 'CALM',
    name: '靜謐微光',
    description: '地下微風平緩，微細孢子輕柔懸浮。',
    toastMsg: '◈ 幽谷歸於靜謐，微光柔和流轉...',
  },
  WATER_DROPLETS: {
    id: 'WATER_DROPLETS',
    name: '溶洞細雨',
    description: '洞頂岩隙水汽凝結，清脆水滴滴落池中。',
    toastMsg: '💧 穹頂岩隙水汽凝結，溶洞細雨清冽滴落...',
  },
  GLOWING_DUST: {
    id: 'GLOWING_DUST',
    name: '地脈微光塵暴',
    description: '深層地脈微光微粒噴湧，金色塵屑漫天飄散。',
    toastMsg: '✨ 地脈深處微光噴湧，金色浮塵漫天飛舞！',
  },
  FIREFLY_SWARM: {
    id: 'FIREFLY_SWARM',
    name: '幽境螢舞',
    description: '大量螢火蟲自岩隙飛出，聚集盤旋舞動。',
    toastMsg: '🌿 幽境群螢飛舞，幽綠繁星照亮井底！',
  },
};

export const ACHIEVEMENT_DEFINITIONS: Record<string, {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'EXPLORATION' | 'TECHNIQUE' | 'PUZZLE' | 'MASTERY';
}> = {
  first_egg: {
    id: 'first_egg',
    title: '初露微光',
    description: '首次在地底深處拾獲神秘彩蛋',
    icon: '🥚',
    category: 'EXPLORATION',
  },
  all_eggs: {
    id: 'all_eggs',
    title: '遠古收藏家',
    description: '尋獲散落各處的所有 3 顆神秘彩蛋',
    icon: '🪺',
    category: 'EXPLORATION',
  },
  bubble_jump: {
    id: 'bubble_jump',
    title: '泡泡踏步',
    description: '熟練掌握下墜時踩踏泡泡的高空二段跳技巧',
    icon: '🫧',
    category: 'TECHNIQUE',
  },
  wall_breaker: {
    id: 'wall_breaker',
    title: '崩解之壁',
    description: '利用撞擊、衝墜或重石粉碎脆弱裂紋石壁',
    icon: '🧱',
    category: 'PUZZLE',
  },
  platform_engineer: {
    id: 'platform_engineer',
    title: '古殿工程師',
    description: '將重石推入重力感應石臺凹槽，沉降開通石柱通道',
    icon: '⚙',
    category: 'PUZZLE',
  },
  creature_scholar: {
    id: 'creature_scholar',
    title: '幽井學者',
    description: '首次發現並登錄神秘地底生物至生態圖鑑',
    icon: '🐾',
    category: 'EXPLORATION',
  },
  master_naturalist: {
    id: 'master_naturalist',
    title: '博物學大師',
    description: '成功目擊並解鎖圖鑑中全部 4 隻神秘生靈',
    icon: '📖',
    category: 'MASTERY',
  },
  save_phone: {
    id: 'save_phone',
    title: '留聲之刻',
    description: '在幽谷木製電話亭前響鈴並留下冒險存檔點',
    icon: '☎',
    category: 'EXPLORATION',
  },
  weather_witness: {
    id: 'weather_witness',
    title: '地穴風雲',
    description: '見證地下洞窟微氣候的一度更迭轉變',
    icon: '🌧',
    category: 'EXPLORATION',
  },
  well_liberated: {
    id: 'well_liberated',
    title: '幽井解封',
    description: '集齊彩蛋返回遠古祭壇，解開封印完成冒險',
    icon: '🏆',
    category: 'MASTERY',
  },
};

export const SAVE_STORAGE_KEY = 'glow_well_save_v1';

