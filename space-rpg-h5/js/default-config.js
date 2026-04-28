/**
 * 默认配置数据 - 游戏世界观和初始状态的兜底默认值
 * 
 * 当向导跳过或AI不可用时使用这些数据。
 * 如需自定义默认设定，只需编辑本文件即可，无需修改核心逻辑代码。
 */

// ============================================================
//  默认世界观设定 (对应 WorldLore.getDefaultLore())
// ============================================================
const DEFAULT_LORE = {
    // ---------- 宇宙背景 ----------
    universe: {
        name: '星联邦纪元',
        era: '星历2157年',
        description: '人类与多个外星种族建立了松散的星际联邦。超光速跃迁技术使星际旅行成为可能，但深空区域仍充满未知危险。',
        currency: '联邦信用点（€）',
        techLevel: '中等偏高——跃迁引擎普及，能量护盾常见，AI辅助但未完全自主'
    },

    // ---------- 种族 ----------
    races: [
        { id: 'human', name: '人类', traits: '适应力强，技术均衡', homeworld: '地球/太阳系' },
        { id: 'turan', name: '图兰人', traits: '身材高大，擅长机械与采矿，常以机械义肢替换受损肢体', homeworld: '图兰星系' },
        { id: 'velari', name: '维拉里人', traits: '纤细灵敏，擅长信息处理和外交', homeworld: '维拉里星云' },
        { id: 'krath', name: '克拉斯族', traits: '好战的爬行类种族，控制数个边境星系', homeworld: '克拉斯帝国' }
    ],

    // ---------- 势力 ----------
    factions: [
        { id: 'federation', name: '星际联邦', alignment: '秩序/中立', description: '多种族联合政体，维护主要航路安全' },
        { id: 'free_traders', name: '自由贸易商会', alignment: '中立', description: '跨星系商业网络，信息灵通' },
        { id: 'pirates', name: '深空海盗联盟', alignment: '混乱', description: '松散的海盗组织，活跃于边境航路' },
        { id: 'miners_guild', name: '矿工公会', alignment: '中立/秩序', description: '控制大部分小行星采矿权' }
    ],

    // ---------- 星系地图 ----------
    starMap: [
        {
            id: 'zhixing_station',
            name: '织星空间站',
            type: '空间站',
            tags: ['空间站', '安全区域', '贸易', '维修'],
            description: '织星星系的核心空间站，联邦管辖，设施齐全',
            services: ['全面维修', '武器升级', '燃料补给', '商品交易', '信息交易', '船员招募'],
            connections: [
                { target: 'shenyan_colony', distance: 3 },
                { target: 'piaobo_outpost', distance: 8 },
                { target: 'federation_trade', distance: 12 }
            ]
        },
        {
            id: 'shenyan_colony',
            name: '采矿殖民地深岩',
            type: '殖民地',
            tags: ['殖民地', '采矿', '边境'],
            description: '图兰人主导的采矿殖民地，粗犷但资源丰富',
            services: ['基础维修', '矿物交易', '燃料补给', '酒馆情报'],
            connections: [
                { target: 'zhixing_station', distance: 3 },
                { target: 'piaobo_outpost', distance: 6 },
                { target: 'abandoned_relay', distance: 4 }
            ]
        },
        {
            id: 'piaobo_outpost',
            name: '漂泊者前哨站',
            type: '前哨站',
            tags: ['前哨站', '黑市', '危险区域'],
            description: '法外之地，走私者和赏金猎人的聚集地',
            services: ['应急维修', '黑市交易', '走私品', '武器改装', '非法改造'],
            connections: [
                { target: 'zhixing_station', distance: 8 },
                { target: 'shenyan_colony', distance: 6 }
            ]
        },
        {
            id: 'federation_trade',
            name: '联邦贸易站',
            type: '贸易站',
            tags: ['贸易站', '安全区域', '联邦'],
            description: '联邦官方贸易枢纽，商品种类最丰富，价格公道',
            services: ['全面维修', '飞船升级', '大宗商品交易', '联邦任务板', '医疗中心'],
            connections: [
                { target: 'zhixing_station', distance: 12 }
            ]
        },
        {
            id: 'abandoned_relay',
            name: '废弃中继站',
            type: '废墟',
            tags: ['废墟', '危险区域', '未探索'],
            description: '战前遗留的通信中继站，据传内部仍有可回收技术',
            services: ['自助维修（需零件）'],
            connections: [
                { target: 'shenyan_colony', distance: 4 }
            ]
        }
    ],

    // ---------- 玩家飞船设定 ----------
    playerShip: {
        name: '星际探索者号',
        class: '中型探索/轻型护卫混合型',
        weapons: '双联装脉冲激光炮塔×2 + 磁轨炮×1 + 点防御阵列×4',
        defense: '星联标准 Mk.III 能量护盾发生器',
        engines: '标准跃迁引擎',
        sensors: '基础扫描阵列',
        special: '搭载船载AI终端（即玩家交互界面）'
    },

    // ---------- 动态 NPC 注册表 ----------
    npcs: [
        {
            id: 'bartender_turan',
            name: '酒保',
            race: 'turan',
            description: '图兰人，左臂是液压机械臂，经营深岩殖民地的酒馆',
            location: 'shenyan_colony',
            disposition: 'neutral',
            knownInfo: ['本地矿脉情报', '走私航线传言'],
            firstMet: '初始'
        }
    ],

    // ---------- 动态已知船只 ----------
    knownShips: [
        {
            id: 'grey_rat',
            name: '灰鼠号',
            class: '轻型走私船',
            owner: '未知',
            location: 'shenyan_colony',
            disposition: 'unknown',
            firstSeen: '初始'
        }
    ],

    // ---------- 动态发现的线索/事件 ----------
    discoveredClues: [],

    // ---------- 声望系统 ----------
    reputation: {
        federation: 0,
        free_traders: 0,
        pirates: 0,
        miners_guild: 10
    },

    // ---------- 代理人类型定义 ----------
    agentTypes: [
        { id: 'bounty', name: '赏金代理人', icon: '🎯', faction: 'federation', desc: '发布悬赏令，追缉逃犯和海盗', serviceTypes: ['bounty_mission', 'target_info'] },
        { id: 'military', name: '军方联络官', icon: '⚔️', faction: 'federation', desc: '联邦军事任务和军需物资', serviceTypes: ['military_mission', 'military_supply'] },
        { id: 'industrial', name: '工业代理人', icon: '⚙️', faction: 'miners_guild', desc: '矿业合同、工业零件交易和改装服务', serviceTypes: ['mining_contract', 'parts_trade', 'ship_refit'] },
        { id: 'explorer', name: '探索代理人', icon: '🔭', faction: 'free_traders', desc: '探索任务、星图数据和科考装备', serviceTypes: ['exploration_mission', 'star_data', 'scan_equipment'] },
        { id: 'trader', name: '贸易代理人', icon: '💰', faction: 'free_traders', desc: '通用商品买卖和货运合同', serviceTypes: ['commodity_trade', 'cargo_contract'] },
        { id: 'blackmarket', name: '黑市掮客', icon: '🕵️', faction: 'pirates', desc: '非法改装、走私品和灰色情报', serviceTypes: ['illegal_refit', 'contraband', 'grey_intel'], hidden: true }
    ],

    // ---------- 港口服务模板（按地点类型决定） ----------
    portServiceTemplates: {
        '空间站': {
            fuel: { name: '燃料补给', available: true, desc: '标准价补充跃迁燃料', baseCost: 3 },
            repair: { name: '全面维修', available: true, desc: '专业技师修复船体和子系统', baseCost: 5 },
            shield: { name: '护盾充能', available: true, desc: '重置护盾发生器', baseCost: 2 },
            upgrade: { name: '飞船升级', available: true, desc: '武器/引擎/传感器升级', baseCost: 50 },
            medical: { name: '医疗中心', available: true, desc: '治疗伤病和状态恢复', baseCost: 20 }
        },
        '贸易站': {
            fuel: { name: '燃料补给', available: true, desc: '批发价补充跃迁燃料', baseCost: 2 },
            repair: { name: '全面维修', available: true, desc: '专业维修设施', baseCost: 4 },
            shield: { name: '护盾充能', available: true, desc: '护盾系统维护', baseCost: 2 },
            upgrade: { name: '飞船升级', available: true, desc: '高端升级选项', baseCost: 40 },
            medical: { name: '医疗中心', available: true, desc: '联邦标准医疗', baseCost: 15 }
        },
        '殖民地': {
            fuel: { name: '燃料补给', available: true, desc: '精炼燃料补充', baseCost: 4 },
            repair: { name: '基础维修', available: true, desc: '矿工级维修，够用但粗糙', baseCost: 3 },
            shield: { name: '护盾充能', available: false, desc: '无护盾维护设施' },
            upgrade: { name: '采矿改装', available: true, desc: '仅限采矿和防护相关', baseCost: 30 },
            medical: { name: '急救站', available: true, desc: '基础医疗处理', baseCost: 10 }
        },
        '前哨站': {
            fuel: { name: '燃料补给', available: true, desc: '高价燃料，来路不明', baseCost: 6 },
            repair: { name: '应急维修', available: true, desc: '凑合能飞就行', baseCost: 2 },
            shield: { name: '护盾充能', available: false, desc: '没这服务' },
            upgrade: { name: '非法改造', available: true, desc: '性能好但不保修', baseCost: 25 },
            medical: { name: '黑医', available: true, desc: '不问来路的医疗', baseCost: 8 }
        },
        '废墟': {
            fuel: { name: '残余燃料回收', available: true, desc: '从废弃设施提取残余燃料，量少', baseCost: 1 },
            repair: { name: '自助维修', available: true, desc: '需要自备零件，手动操作', baseCost: 0 },
            shield: { name: '护盾充能', available: false, desc: '无供电设施' },
            upgrade: { name: '拆解回收', available: false, desc: '无改装能力' },
            medical: { name: '急救包', available: false, desc: '无医疗设施' }
        }
    },

    // ---------- 地点类型→可用代理人映射（数据驱动，替代 switch-case） ----------
    locationAgentMapping: {
        '空间站': ['bounty', 'military', 'industrial', 'explorer', 'trader'],
        '贸易站': ['trader', 'explorer', 'industrial', 'military'],
        '殖民地': ['industrial', 'trader', 'bounty', 'explorer'],
        '前哨站': ['bounty', 'trader', 'explorer'],
        '废墟':   ['explorer'],
        '_default': ['trader', 'explorer']
    },

    // ---------- 各地点的代理人缓存 ----------
    locationAgents: {},

    // ---------- 黑市解锁状态 ----------
    blackmarketUnlocked: {},

    // ---------- 武器类型（用于从AI叙事中提取装备变更） ----------
    weaponTypes: ['激光炮', '磁轨炮', '等离子炮', '导弹发射器', '加农炮', '速射炮'],
    weaponLevels: ['重型', '中型', '轻型', '微型'],

    // ---------- 防御类型 ----------
    defenseTypes: ['能量护盾', '相位护盾', '偏转护盾', '复合装甲', '反应装甲'],

    // ---------- 离线回退商品列表（AI不可用时的兜底） ----------
    offlineTradeBasics: [
        { name: '能量电池', price: 50, desc: '恢复能量' },
        { name: '医疗包', price: 80, desc: '恢复生命' },
        { name: '备用零件', price: 120, desc: '用于维修' },
        { name: '燃料补给(+10%)', price: 30, desc: '补充燃料' }
    ]
};


// ============================================================
//  System Prompt 模板 (对应 GameCore.buildSystemPrompt())
//  使用 {{变量名}} 占位符，运行时由 GameCore 替换为实际值
// ============================================================
const PROMPT_TEMPLATES = {
    // system role prompt（每次请求的系统角色设定）
    systemRole: `你是{{shipName}}的船载AI终端。这是一个沉浸式太空RPG，所有交互通过船载终端进行。

{{loreSummary}}

你的行为准则：
1. 始终以船载AI终端的身份回应，用 > 前缀表示终端输出
2. 保持沉浸感，绝不使用"游戏"、"玩家"等出戏词汇——舰长就是舰长
3. 基于上述世界观设定生成合理的叙事，不虚构与设定矛盾的内容
4. NPC 对话要符合其种族特征和性格
5. 根据声望关系影响 NPC 态度和可用选项
6. 保持语气专业但友好，偶尔展现 AI 的独特幽默感

当前游戏状态会在每次请求中提供。请严格基于提供的状态事实回复。`,

    // 主交互 prompt（玩家每次输入行动时发送给AI）
    mainAction: `你是{{shipName}}的船载AI终端。玩家输入了一个行动指令。

【游戏状态摘要 - 必须基于以下事实回复】
位置：{{location}}
燃料：{{fuel}}%
信用点：{{credits}}€
舰长状态：{{captainStatus}} | {{energyDesc}}
船体：{{hull}}%
护盾：{{shield}}%
武器：{{armament}}
防御：{{defense}}
当前任务：{{currentMission}}
游戏时间：{{gameTime}}（标准时）{{memorySection}}

{{shipInfo}}

{{sceneFacts}}

可用航路：{{routesText}}
时间事实：当前是{{era}}，必须使用此年份

【玩家行动】{{action}}

【回复规则】
1. 以船载终端风格回复，保持沉浸感（用 > 前缀表示终端输出）
2. 大部分行动只需要叙事回复，不需要修改游戏数据
3. 只有当行动**明确需要修改游戏数值**时，才在末尾附加工具调用指令
4. 工具调用格式（单独一行，JSON格式）：
   [TOOL_CALL] {"tool":"工具名","params":{参数}}
5. 可用工具：
   - calculate_battle：玩家发起战斗时（需 weapon, range 参数）
   - update_resources：明确获得/失去资源时（需 resource, amount, operation 参数）
     * resource类型：'credits'（信用点）、'fuel'（燃料）、'energy_cell'（能量电池）、'medkit'（医疗包）、'spare_parts'（备用零件）
     * operation：'add'（增加）或 'subtract'（减少）
   - roll_check：技能检定（需 skill, difficulty 参数）
   - navigate：星际航行/跃迁到另一地点时（需 destination, distance 参数）
     * 燃料消耗：每光年消耗1%燃料（distance光年 → 消耗Math.round(distance)%）
     * 时间消耗：每光年推进1小时
   - trade：明确的买卖交易时（需 item, price, quantity 参数）
   - time_advance：时间跳跃（需 hours 参数）
   - check_rest_conditions：玩家要求休息时
6. 以下情况**不要**调用工具：
   - 寻找信息、对话、观察、思考、调查、询问
   - 普通移动（在同一地点内）
   - 需要用户确认的情况（如询问"是否确认？(Y/N)"）
   - 风险警告或建议备选方案时
7. 当燃料储备低于20%时，如果航行会耗尽燃料，请先警告玩家并询问确认，不要直接调用导航工具

8. NPC 标注规则（重要）：
   - 当叙事中**首次出现**一个有名字的NPC时，必须用以下格式标注一次：「NPC名字」（种族/身份简述）
   - 例如：「塔洛斯」（图兰人矿工头目）向你走来...
   - 例如：酒吧里，「琳达」（人类酒保）正在擦拭杯子...
   - 如果NPC已在"当地NPC"列表中出现过，则不需要再次标注
   - 机器人/AI实体也需要标注，种族写"人工智能"或"机械"
   - 如果NPC在叙事中死亡或永久离开，请在文末注明：[NPC_STATUS] 名字|状态（如：[NPC_STATUS] 塔洛斯|死亡）

重要：请基于上述游戏状态摘要和事实数据库进行回复，不要虚构不存在的状态或信息。
所有时间回复必须使用游戏时间：{{gameTime}}，不要虚构不同的年份或时间。

请直接回复叙事内容。只在必要时附加一行 [TOOL_CALL]。`,

    // 交易系统 prompt
    tradeGeneration: `你是太空RPG的交易系统。请根据以下信息，列出当前位置可以买卖的商品和服务。

当前位置：{{location}}
位置标签：{{locationTags}}
位置服务：{{locationServices}}
玩家信用点：{{credits}}€
玩家背包：{{inventorySummary}}
飞船燃料：{{fuel}}%
船体：{{hull}}%  护盾：{{shield}}%

【要求】
1. 根据位置合理推断可用商品（如：空间站=补给+维修+燃料+信息；殖民地=矿物+基础补给；前哨站=走私品+武器；贸易站=丰富商品低价）
2. 每个商品/服务给出：名称、单价（€）、简短描述（10字内）
3. 输出格式严格为 JSON 数组，每个元素: {"name":"名称","price":数字,"desc":"描述","type":"buy|sell|service"}
4. buy=可购买物品, sell=该地收购的物品（给出收购价）, service=服务（如维修、燃料补给、信息购买）
5. 数量6-10个即可，价格要合理
6. 仅输出JSON数组，不要其他文字`,

    // 维修系统 prompt
    repairGeneration: `你是太空RPG的维修系统。根据以下飞船状态和当前位置，列出可用的维修/升级服务。

当前位置：{{location}}
位置标签：{{locationTags}}
位置服务：{{locationServices}}
船体完整度：{{hull}}%
护盾完整度：{{shield}}%
引擎：{{engines}}
武器：{{weapons}}
传感器：{{sensors}}
备用零件：{{partsCount}}个
信用点：{{credits}}€

【要求】
1. 根据位置推断维修能力（空间站=全面维修+升级；殖民地=基础维修；前哨站=应急维修；野外=仅自修）
2. 每项服务给出：名称、费用(€或零件数)、效果描述、是否可用(根据玩家资源判断)
3. 输出格式严格为 JSON 数组，每个元素: {"name":"名称","cost":"费用描述","effect":"效果","available":true/false,"reason":"不可用原因或空字符串"}
4. 数量3-6个即可
5. 仅输出JSON数组，不要其他文字`,

    // 代理人NPC生成 prompt
    agentGeneration: `你是太空RPG的NPC生成系统。为当前位置生成一批代理人NPC。

【位置】{{locationName}}（{{locationType}}）— {{locationDesc}}
服务: {{locationServices}}
标签: {{locationTags}}

【玩家声望】{{reputation}}
【玩家信用点】{{credits}}€

【应生成的代理人类型】
{{agentTypesDesc}}
{{oldAgentsDesc}}

【要求】
1. 每种代理人类型生成1个NPC（如果是更新，保留约一半旧NPC，替换另一半）
2. 每个NPC需要有：名字（符合世界观）、种族、性格特征、提供的具体服务/商品/任务
3. 输出严格 JSON 数组，每个元素格式:
{
  "agentType": "代理人类型id（如bounty/military/industrial/explorer/trader/blackmarket）",
  "name": "NPC名字",
  "race": "种族",
  "personality": "一句话性格描述",
  "desc": "身份描述（15字内）",
  "services": [
    {"name":"服务/商品/任务名","type":"mission|trade|refit|info","price":价格数字,"desc":"简短描述"}
  ]
}
4. 每个代理人有2-4个services
5. 任务类service的price是奖励（正数），交易/改装的price是花费
6. 价格要合理，符合位置经济水平
7. 仅输出JSON数组`,

    // 幕总结叙事生成 prompt
    actSummary: `你是太空RPG的幕总结系统。请根据以下事件记录，为刚结束的一幕生成一段简洁的叙事摘要。

【幕信息】
第{{actNumber}}幕 "{{actTitle}}"
时间跨度：{{daysPassed}}天
经历地点：{{locations}}

【事件列表】
{{eventList}}

【统计数据】
事件总数：{{eventsCount}}
任务完成：{{tasksCompleted}}
经济变化：收入 {{totalGain}}€ / 支出 {{totalCost}}€（净变化 {{netChange}}€）

【要求】
1. 用2-4句话概括这一幕的主要经历和成就
2. 文风应像航行日志/简报，使用船载AI终端视角
3. 突出关键转折点和重要决策
4. 如果有战斗、交易或重大发现，要提及
5. 仅输出叙事文本，不要JSON或其他格式标记`
};


// ============================================================
//  默认游戏状态 (对应 GameState.getInitialState())
//  所有具体内容从 DEFAULT_LORE 动态派生，不再硬编码剧情数据
// ============================================================

// 辅助：安全读取 DEFAULT_LORE 字段
const _lore = (typeof DEFAULT_LORE !== 'undefined') ? DEFAULT_LORE : {};
const _ship = _lore.playerShip || {};
const _starMap = _lore.starMap || [];
// 起始位置：取 starMap 第一个节点名 + "控制室"，兜底"未知位置"
const _startLoc = _starMap.length > 0 ? _starMap[0].name : '未知位置';
const _startTags = _starMap.length > 0 ? (_starMap[0].tags || []) : [];
// 起始时间从 lore.universe 或默认值
const _era = (_lore.universe && _lore.universe.era) ? _lore.universe.era : '';
const _startYear = _era.match(/(\d{4})/) ? parseInt(_era.match(/(\d{4})/)[1]) : 2157;

const DEFAULT_STATE = {
    // 舰长状态
    captain: {
        name: "舰长",
        health: 85,
        energy: 70,
        credits: 1250,
        location: _startLoc,
        location_tags: _startTags.length > 0 ? _startTags : ["安全区域"],
        in_combat: false,
        in_danger: false
    },

    // 飞船状态（从 DEFAULT_LORE.playerShip 派生）
    ship: {
        name: _ship.name || "飞船",
        hull: 85,
        shield: 50,
        fuel: 45,
        cargo_capacity: _ship.cargo_capacity || 100,
        cargo_used: 35,
        systems: {
            weapons: _ship.weapons || "基础武器",
            engines: _ship.engines || "标准跃迁引擎",
            sensors: _ship.sensors || "基础扫描阵列"
        }
    },

    // 物品清单（通用初始装备，不含剧情物品）
    inventory: {
        credits: 1250,
        items: [
            { id: "energy_cell", name: "能量块", count: 3, type: "consumable" },
            { id: "medkit", name: "医疗包", count: 2, type: "consumable" },
            { id: "spare_parts", name: "备用零件", count: 5, type: "resource" }
        ]
    },

    // 任务系统（初始为空，由游戏玩法自然产生）
    missions: {
        active: [],
        completed: []
    },

    // 船员（从 DEFAULT_LORE.playerShip.crew 派生）
    crew: ((_ship.crew && Array.isArray(_ship.crew))
        ? _ship.crew.map(c => ({
            id: c.id || c.name,
            name: c.name,
            role: c.role || '船员',
            status: '正常'
        }))
        : []
    ),

    // 游戏时间（从世界观纪元年份派生）
    time: {
        year: _startYear,
        month: 3,
        day: 15,
        hour: 14,
        minute: 30
    },

    // 幕信息
    act: {
        current: 1,
        events: [],
        start_time: `${_startYear}.03.10`,
        days_passed: 5
    },

    // 休息条件配置
    rest_conditions: {
        location_tags: ["飞船休息舱", "空间站旅馆"],
        resource_cost: { item: "energy_cell", count: 1 },
        requires_no_combat: true,
        requires_no_danger: true,
        unlocked_locations: [],
        unlocked_skills: []
    },

    // 游戏统计
    stats: {
        turns_played: 0,
        events_logged: 0,
        battles_fought: 0,
        credits_earned: 0,
        distance_traveled: 0
    }
};
