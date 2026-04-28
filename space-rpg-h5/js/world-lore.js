/**
 * 世界观模块 - 太空RPG 世界设定与动态实体注册
 * 提供统一的世界观数据源，供 AI prompt、交易、维修、导航等系统共同使用
 */

class WorldLore {
    constructor() {
        this.data = this.loadData() || this.getDefaultLore();
        this.migrateData(); // 补全旧存档中缺失的新字段
        this.saveData();
    }

    // ========================
    //  持久化
    // ========================
    loadData() {
        try {
            const saved = localStorage.getItem('space_rpg_world_lore');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('加载世界观数据失败:', e);
            return null;
        }
    }

    saveData() {
        try {
            localStorage.setItem('space_rpg_world_lore', JSON.stringify(this.data));
        } catch (e) {
            console.error('保存世界观数据失败:', e);
        }
    }

    reset() {
        this.data = this.getDefaultLore();
        this.saveData();
    }

    /**
     * 从向导生成的数据初始化世界观
     * @param {Object} wizardData - WorldBuildWizard 生成的数据
     * @returns {boolean} 是否成功初始化
     */
    initFromWizardData(wizardData) {
        if (!wizardData || Object.keys(wizardData).length === 0) {
            // 无数据，使用默认
            this.data = this.getDefaultLore();
            this.saveData();
            return true;
        }

        // 以默认值为基础，用向导数据覆盖
        const defaults = this.getDefaultLore();
        const merged = JSON.parse(JSON.stringify(defaults));

        // 覆盖宇宙背景
        if (wizardData.universe) {
            Object.assign(merged.universe, wizardData.universe);
        }

        // 覆盖种族（如果AI生成了完整列表则替换）
        if (wizardData.races && Array.isArray(wizardData.races) && wizardData.races.length > 0) {
            merged.races = wizardData.races;
        }

        // 覆盖势力
        if (wizardData.factions && Array.isArray(wizardData.factions) && wizardData.factions.length > 0) {
            merged.factions = wizardData.factions;
            // 同步声望系统
            merged.reputation = {};
            wizardData.factions.forEach(f => {
                merged.reputation[f.id] = 0;
            });
        }

        // 覆盖星图
        if (wizardData.starMap && Array.isArray(wizardData.starMap) && wizardData.starMap.length > 0) {
            merged.starMap = wizardData.starMap;
        }

        // 覆盖玩家飞船
        if (wizardData.playerShip) {
            Object.assign(merged.playerShip, wizardData.playerShip);
        }

        // 覆盖NPC
        if (wizardData.npcs && Array.isArray(wizardData.npcs)) {
            merged.npcs = wizardData.npcs;
        }

        // 覆盖已知船只
        if (wizardData.knownShips && Array.isArray(wizardData.knownShips)) {
            merged.knownShips = wizardData.knownShips;
        }

        this.data = merged;
        this.migrateData();
        this.saveData();
        console.log('世界观已从向导数据初始化');
        return true;
    }

    /** 数据迁移：为旧存档补全新增字段 */
    migrateData() {
        const defaults = this.getDefaultLore();

        // 补全顶层字段
        if (!this.data.agentTypes) this.data.agentTypes = defaults.agentTypes;
        if (!this.data.portServiceTemplates) this.data.portServiceTemplates = defaults.portServiceTemplates;
        if (!this.data.locationAgents) this.data.locationAgents = {};
        if (!this.data.blackmarketUnlocked) this.data.blackmarketUnlocked = {};
        if (!this.data.discoveredClues) this.data.discoveredClues = [];
        if (!this.data.sceneImpressions) this.data.sceneImpressions = {};
        if (!this.data.captainLog) this.data.captainLog = [];
        if (!this.data.reputation) this.data.reputation = defaults.reputation;
        if (!this.data.playerShip) this.data.playerShip = defaults.playerShip;
        if (!this.data.npcs) this.data.npcs = defaults.npcs;
        if (!this.data.knownShips) this.data.knownShips = defaults.knownShips;
        if (!this.data.universe) this.data.universe = defaults.universe;
        if (!this.data.races) this.data.races = defaults.races;
        if (!this.data.factions) this.data.factions = defaults.factions;
        if (!this.data.starMap) this.data.starMap = defaults.starMap;
    }

    // ========================
    //  默认世界观
    // ========================
    getDefaultLore() {
        // 从外部配置文件读取默认值（js/default-config.js）
        // 如需修改默认设定，请编辑 default-config.js 中的 DEFAULT_LORE
        if (typeof DEFAULT_LORE !== 'undefined') {
            return JSON.parse(JSON.stringify(DEFAULT_LORE));
        }
        // 极端兜底：配置文件未加载时的最小默认值
        console.warn('DEFAULT_LORE 未加载，使用最小兜底配置');
        return {
            universe: { name: '未知纪元', era: '未知', description: '', currency: '信用点', techLevel: '未知' },
            races: [],
            factions: [],
            starMap: [],
            playerShip: { name: '未命名飞船', class: '未知', weapons: '', defense: '', engines: '', sensors: '', special: '' },
            npcs: [],
            knownShips: [],
            discoveredClues: [],
            reputation: {},
            agentTypes: [],
            portServiceTemplates: {},
            locationAgents: {},
            blackmarketUnlocked: {}
        };
    }

    // ========================
    //  查询方法
    // ========================

    /** 获取宇宙背景纲要（用于 system prompt） */
    getUniverseSummary() {
        const u = this.data.universe;
        const races = this.data.races.map(r => `${r.name}(${r.traits})`).join('；');
        const factions = this.data.factions.map(f => `${f.name}(${f.description})`).join('；');
        return `【宇宙背景】${u.name} · ${u.era}
${u.description}
货币：${u.currency} | 科技水平：${u.techLevel}
已知种族：${races}
主要势力：${factions}`;
    }

    /** 获取玩家飞船纲要 */
    getShipSummary() {
        const s = this.data.playerShip;
        return `飞船：${s.name}（${s.class}）
武器：${s.weapons}
防御：${s.defense}
引擎：${s.engines} | 传感器：${s.sensors}`;
    }

    /** 根据位置名称获取星系节点 */
    getLocationByName(locationName) {
        return this.data.starMap.find(loc =>
            locationName.includes(loc.name) || loc.name.includes(locationName)
        );
    }

    /** 根据 ID 获取星系节点 */
    getLocationById(id) {
        return this.data.starMap.find(loc => loc.id === id);
    }

    /** 获取当前位置的详细信息文本 */
    getLocationInfo(locationName) {
        const loc = this.getLocationByName(locationName);
        if (!loc) return `位置"${locationName}"不在已知星图中`;
        const routes = loc.connections.map(c => {
            const target = this.getLocationById(c.target);
            return `${target ? target.name : c.target}(${c.distance}光年)`;
        }).join('、');
        return `${loc.name}（${loc.type}）— ${loc.description}
可用服务：${loc.services.join('、')}
航路连接：${routes}`;
    }

    /** 获取当前位置的可用服务列表 */
    getLocationServices(locationName) {
        const loc = this.getLocationByName(locationName);
        return loc ? loc.services : ['自助维修（需零件）'];
    }

    /** 获取当前位置的标签 */
    getLocationTags(locationName) {
        const loc = this.getLocationByName(locationName);
        return loc ? loc.tags : ['未知区域'];
    }

    /** 获取从当前位置可达的航路 */
    getNavigationRoutes(locationName) {
        const loc = this.getLocationByName(locationName);
        if (!loc) return [];
        return loc.connections.map(c => {
            const target = this.getLocationById(c.target);
            return {
                id: c.target,
                name: target ? target.name : c.target,
                distance: c.distance,
                type: target ? target.type : '未知'
            };
        });
    }

    /** 获取某位置的 NPC 列表 */
    getNPCsAtLocation(locationId) {
        return this.data.npcs.filter(npc => npc.location === locationId);
    }

    /** 获取某位置的已知船只 */
    getShipsAtLocation(locationId) {
        return this.data.knownShips.filter(ship => ship.location === locationId);
    }

    /** 获取所有已知 NPC 的摘要文本 */
    getNPCSummary(locationName) {
        const loc = this.getLocationByName(locationName);
        const locId = loc ? loc.id : '';
        const localNPCs = this.data.npcs.filter(n => n.location === locId);
        if (localNPCs.length === 0) return '当前位置无已知NPC';
        return localNPCs.map(n => {
            const race = this.data.races.find(r => r.id === n.race);
            return `${n.name}（${race ? race.name : n.race}）— ${n.description}`;
        }).join('\n');
    }

    /** 获取所有已知船只的摘要文本 */
    getShipsSummary(locationName) {
        const loc = this.getLocationByName(locationName);
        const locId = loc ? loc.id : '';
        const localShips = this.data.knownShips.filter(s => s.location === locId);
        if (localShips.length === 0) return '当前位置无已知船只';
        return localShips.map(s => `${s.name}（${s.class}）— 归属: ${s.owner}`).join('\n');
    }

    /** 获取声望文本 */
    getReputationSummary() {
        return Object.entries(this.data.reputation).map(([fid, val]) => {
            const faction = this.data.factions.find(f => f.id === fid);
            const name = faction ? faction.name : fid;
            let label = '中立';
            if (val >= 50) label = '友好';
            else if (val >= 20) label = '好感';
            else if (val <= -50) label = '敌对';
            else if (val <= -20) label = '警惕';
            return `${name}: ${label}(${val})`;
        }).join(' | ');
    }

    // ========================
    //  动态注册方法（供工具/AI 调用）
    // ========================

    /** 注册新 NPC */
    registerNPC(npc) {
        const existing = this.data.npcs.find(n => n.id === npc.id);
        if (existing) {
            Object.assign(existing, npc);
        } else {
            this.data.npcs.push({
                firstMet: new Date().toISOString(),
                disposition: 'neutral',
                knownInfo: [],
                ...npc
            });
        }
        this.saveData();
        console.log(`NPC 已注册/更新: ${npc.name || npc.id}`);
    }

    /** 注册新船只 */
    registerShip(ship) {
        const existing = this.data.knownShips.find(s => s.id === ship.id);
        if (existing) {
            Object.assign(existing, ship);
        } else {
            this.data.knownShips.push({
                firstSeen: new Date().toISOString(),
                disposition: 'unknown',
                ...ship
            });
        }
        this.saveData();
        console.log(`船只 已注册/更新: ${ship.name || ship.id}`);
    }

    /** 添加发现线索 */
    addClue(clue) {
        this.data.discoveredClues.push({
            timestamp: new Date().toISOString(),
            ...clue
        });
        this.saveData();
    }

    /** 更新声望 */
    updateReputation(factionId, delta) {
        if (this.data.reputation[factionId] !== undefined) {
            this.data.reputation[factionId] = Math.max(-100, Math.min(100,
                this.data.reputation[factionId] + delta
            ));
            this.saveData();
        }
    }

    /** 添加新星系节点（AI 发现新地点时调用） */
    registerLocation(location) {
        const existing = this.data.starMap.find(l => l.id === location.id);
        if (existing) {
            Object.assign(existing, location);
        } else {
            this.data.starMap.push(location);
        }
        this.saveData();
        console.log(`星系节点 已注册/更新: ${location.name || location.id}`);
    }

    // ========================
    //  为 AI prompt 组装完整上下文
    // ========================

    /** 组装精简的世界观纲要（用于 system prompt，约300字） */
    buildSystemLore() {
        return `${this.getUniverseSummary()}

${this.getShipSummary()}

声望：${this.getReputationSummary()}`;
    }

    /** 组装当前场景的事实（用于 user prompt，基于实际游戏状态） */
    buildSceneFacts(state) {
        const location = state.captain.location;
        const locInfo = this.getLocationInfo(location);
        const npcs = this.getNPCSummary(location);
        const ships = this.getShipsSummary(location);
        const inventory = state.inventory.items.map(i => `${i.name}x${i.count}`).join('、') || '空';
        const impressions = this.getImpressionsSummary(location);

        let result = `【当前场景事实】
位置信息：${locInfo}
当地NPC：${npcs}
当地船只：${ships}
资源库存：${inventory}`;

        if (impressions) {
            result += `\n场景印象（未确认身份的人物/氛围）：${impressions}`;
        }

        const logSummary = this.getLogSummary(5);
        if (logSummary) {
            result += `\n【舰长日志备忘】\n${logSummary}`;
        }

        return result;
    }

    // ========================
    //  场景印象系统（匿名角色/环境氛围追踪）
    // ========================

    /**
     * 记录场景印象
     * 用于追踪不注册为 NPC 的匿名角色和环境描述，
     * 确保 AI 后续叙事不会与之前产生矛盾。
     * 
     * @param {string} locationId - 地点 ID
     * @param {string} impression - 印象描述（如"一个高大的图兰人矿工在角落喝酒"）
     * @param {string} category - 类别：'anonymous_char'|'crowd'|'atmosphere'|'event_trace'
     */
    addImpression(locationId, impression, category = 'anonymous_char') {
        if (!this.data.sceneImpressions) {
            this.data.sceneImpressions = {};
        }
        if (!this.data.sceneImpressions[locationId]) {
            this.data.sceneImpressions[locationId] = [];
        }

        const list = this.data.sceneImpressions[locationId];

        // 去重：如果已有非常相似的印象则跳过（简单子串检查）
        const isDuplicate = list.some(imp =>
            imp.text.includes(impression) || impression.includes(imp.text)
        );
        if (isDuplicate) return;

        list.push({
            text: impression,
            category,
            addedAt: new Date().toISOString()
        });

        // 每个地点最多保留 15 条印象，超出则淘汰最早的
        if (list.length > 15) {
            this.data.sceneImpressions[locationId] = list.slice(-15);
        }

        this.saveData();
    }

    /** 获取某地点的场景印象摘要（供 buildSceneFacts 使用） */
    getImpressionsSummary(locationName) {
        const loc = this.getLocationByName(locationName);
        const locId = loc ? loc.id : '';
        if (!this.data.sceneImpressions || !this.data.sceneImpressions[locId]) return '';
        const impressions = this.data.sceneImpressions[locId];
        if (impressions.length === 0) return '';
        // 最多注入最近 8 条
        return impressions.slice(-8).map(imp => imp.text).join('；');
    }

    /** 清除某地点的场景印象（位置刷新/时间推进时调用） */
    clearImpressions(locationId) {
        if (this.data.sceneImpressions) {
            delete this.data.sceneImpressions[locationId];
            this.saveData();
        }
    }

    // ========================
    //  舰长日志系统（玩家主动记录的笔记）
    // ========================

    /**
     * 添加舰长日志条目
     * 当玩家说"记下/记住/记录"等词时调用，
     * 将信息持久化到独立区域供后续查阅和 AI 参考。
     * 
     * @param {string} content - 日志内容
     * @param {string} locationName - 记录时所在位置
     * @param {string} tag - 标签：'note'|'clue'|'contact'|'warning'|'plan'
     */
    addLogEntry(content, locationName, tag = 'note') {
        if (!this.data.captainLog) {
            this.data.captainLog = [];
        }
        if (!content || content.trim().length === 0) return;

        this.data.captainLog.push({
            content: content.trim(),
            location: locationName || '未知',
            tag,
            gameTime: typeof State !== 'undefined' ? State.getGameTimeString() : '',
            createdAt: new Date().toISOString()
        });

        // 最多保留 50 条日志
        if (this.data.captainLog.length > 50) {
            this.data.captainLog = this.data.captainLog.slice(-50);
        }

        this.saveData();
        console.log(`[舰长日志] 新条目: ${content.substring(0, 30)}...`);
    }

    /** 获取全部舰长日志 */
    getLogEntries() {
        return this.data.captainLog || [];
    }

    /** 获取最近 N 条日志的摘要文本（供 AI prompt 使用） */
    getLogSummary(maxEntries = 5) {
        const logs = this.data.captainLog || [];
        if (logs.length === 0) return '';
        const tagEmoji = { note: '📝', clue: '🔍', contact: '👤', warning: '⚠️', plan: '📋' };
        return logs.slice(-maxEntries).map(l => {
            const emoji = tagEmoji[l.tag] || '📝';
            return `${emoji} [${l.gameTime || ''}@${l.location}] ${l.content}`;
        }).join('\n');
    }

    /** 删除指定索引的日志条目 */
    removeLogEntry(index) {
        if (!this.data.captainLog) return false;
        if (index < 0 || index >= this.data.captainLog.length) return false;
        this.data.captainLog.splice(index, 1);
        this.saveData();
        return true;
    }

    // ========================
    //  代理人系统
    // ========================

    /** 获取某地点的代理人缓存 */
    getLocationAgents(locationId) {
        return this.data.locationAgents[locationId] || null;
    }

    /** 保存某地点的代理人 */
    setLocationAgents(locationId, agents, gameTimeHours, refreshAfterHours = 48) {
        this.data.locationAgents[locationId] = {
            agents: agents,
            generatedAt: gameTimeHours,
            refreshAfterHours: refreshAfterHours
        };
        this.saveData();
    }

    /** 检查代理人是否需要刷新 */
    needsAgentRefresh(locationId, currentGameTimeHours) {
        const cache = this.data.locationAgents[locationId];
        if (!cache) return true; // 首次访问
        return (currentGameTimeHours - cache.generatedAt) >= cache.refreshAfterHours;
    }

    /** 获取该地点应该有哪些代理人类型（基于地点类型，数据驱动） */
    getAvailableAgentTypes(locationId) {
        const loc = this.getLocationById(locationId);
        if (!loc) return [];

        const types = this.data.agentTypes.filter(t => !t.hidden); // 非隐藏代理人
        const locType = loc.type;

        // 从配置映射表中获取该地点类型允许的代理人ID列表
        const mapping = this.data.locationAgentMapping || {};
        const allowedIds = mapping[locType] || mapping['_default'] || ['trader', 'explorer'];
        let available = types.filter(t => allowedIds.includes(t.id));

        // 如果黑市已解锁，添加黑市掮客
        if (this.data.blackmarketUnlocked[locationId]) {
            const bm = this.data.agentTypes.find(t => t.id === 'blackmarket');
            if (bm && !available.find(a => a.id === 'blackmarket')) {
                available.push(bm);
            }
        }

        return available;
    }

    /** 解锁某地点的黑市 */
    unlockBlackmarket(locationId) {
        this.data.blackmarketUnlocked[locationId] = true;
        this.saveData();
    }

    /** 检查某地点黑市是否已解锁 */
    isBlackmarketUnlocked(locationId) {
        return !!this.data.blackmarketUnlocked[locationId];
    }

    // ========================
    //  港口服务系统
    // ========================

    /** 获取某地点的港口服务列表 */
    getPortServices(locationName) {
        const loc = this.getLocationByName(locationName);
        if (!loc) return this.data.portServiceTemplates['废墟'] || {};
        const template = this.data.portServiceTemplates[loc.type];
        return template || this.data.portServiceTemplates['废墟'] || {};
    }

    /** 获取导出数据（用于存档） */
    exportData() {
        return JSON.parse(JSON.stringify(this.data));
    }

    /** 导入数据（用于读档） */
    importData(data) {
        this.data = data;
        this.saveData();
    }
}

// 创建全局实例
const Lore = new WorldLore();
window.Lore = Lore;
