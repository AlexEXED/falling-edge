/**
 * 游戏核心模块
 * 主游戏逻辑和交互循环
 */

class GameCore {
    constructor() {
        this.isProcessing = false;
        this.commandHistory = [];
        this.maxHistory = 50;
        
        // 记忆存储系统
        this.memoryStorage = null;
        this.persistentMemories = [];
        this.recentMemoriesLimit = 5;
        
        this.initializeGame();
    }

    // 初始化游戏
    async initializeGame() {
        console.log('游戏核心初始化...');
        
        // 初始化记忆存储系统
        await this.initializeMemoryStorage();
        
        this.loadCommandHistory();
        this.updateUI();
        this.addTerminalOutput('系统初始化完成。欢迎回来，舰长。', 'system');
        this.showCurrentStatus();
        
        // 显示前情提要（从记忆/幕事件中提取）
        this.showRecap();
    }
    
    // 显示前情提要
    showRecap() {
        try {
            const state = State.state;
            // 如果是全新游戏（回合数为0），跳过
            if (!state.stats || state.stats.turns_played <= 0) return;
            
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('═══ 前情提要 ═══', 'system');
            
            // 1. 从当前幕获取最近事件
            if (typeof ActManagerInstance !== 'undefined') {
                const currentAct = ActManagerInstance.getAct(state.act.current);
                if (currentAct && currentAct.events && currentAct.events.length > 0) {
                    const recentEvents = currentAct.events.slice(-3);
                    recentEvents.forEach(e => {
                        this.addTerminalOutput(`  · ${e.title} @ ${e.location}`, 'info');
                    });
                }
            }
            
            // 2. 从持久化记忆获取关键信息
            if (this.persistentMemories && this.persistentMemories.length > 0) {
                const topMemories = this.persistentMemories.slice(0, 2);
                topMemories.forEach(m => {
                    this.addTerminalOutput(`  ${m}`, 'info');
                });
            }
            
            // 3. 显示当前活跃任务
            if (state.missions.active.length > 0) {
                const missionNames = state.missions.active.map(m => m.name).join('、');
                this.addTerminalOutput(`  活跃任务: ${missionNames}`, 'mission');
            }
            
            this.addTerminalOutput('════════════════', 'system');
        } catch (error) {
            console.warn('显示前情提要失败:', error);
        }
    }
    
    // 初始化记忆存储系统
    async initializeMemoryStorage() {
        try {
            // 加载记忆存储模块
            if (typeof MemoryStorage !== 'undefined') {
                this.memoryStorage = MemoryStorage;
                console.log('记忆存储系统已加载');
                
                // 加载持久化记忆
                await this.loadPersistentMemories();
                
                // 显示记忆统计
                const stats = await this.memoryStorage.getStats();
                console.log('记忆库统计:', stats);
            } else {
                console.warn('记忆存储模块未找到，使用内存缓存');
                this.memoryStorage = null;
            }
        } catch (error) {
            console.error('初始化记忆存储失败:', error);
            this.memoryStorage = null;
        }
    }
    
    // 加载持久化记忆
    async loadPersistentMemories() {
        if (!this.memoryStorage) return;
        
        try {
            // 查询最近的相关记忆
            const recentMemories = await this.memoryStorage.queryMemories({
                limit: this.recentMemoriesLimit,
                timespan: '7d',
                minWeight: 0.5
            });
            
            this.persistentMemories = recentMemories.map(memory => 
                `[记忆] ${this.formatMemoryTimestamp(memory.timestamp)}: ${memory.content}`
            );
            
            console.log(`加载了 ${this.persistentMemories.length} 条持久化记忆`);
        } catch (error) {
            console.error('加载持久化记忆失败:', error);
        }
    }
    
    // 格式化记忆时间戳
    formatMemoryTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffHours = (now - date) / (1000 * 60 * 60);
            
            if (diffHours < 24) {
                return `${Math.floor(diffHours)}小时前`;
            } else if (diffHours < 168) { // 7天
                return `${Math.floor(diffHours / 24)}天前`;
            } else {
                return date.toLocaleDateString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
        } catch (error) {
            return '之前';
        }
    }

    // 处理命令
    async processCommand(input) {
        if (this.isProcessing || !input.trim()) {
            return;
        }

        this.isProcessing = true;
        
        try {
            this.addToCommandHistory(input);
            this.addTerminalOutput(`> ${input}`, 'user');
            
            if (input.startsWith('/')) {
                await this.processSystemCommand(input);
            } else {
                await this.processAIAction(input);
            }
            
        } catch (error) {
            console.error('命令处理错误:', error);
            this.addTerminalOutput(`错误: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.updateUI();
        }
    }

    // 处理系统命令
    async processSystemCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case '/rest':
                await this.handleRestCommand(args);
                break;
            case '/status':
                this.showDetailedStatus();
                break;
            case '/inventory':
                this.showInventory();
                break;
            case '/missions':
                this.showMissions(args);
                break;
            case '/mission':
                this.showMissions(args);
                break;
            case '/map':
                this.showMap();
                break;
            case '/trade':
            case '/agents':
                await this.showAgents();
                break;
            case '/repair':
            case '/port':
                await this.showPortServices();
                break;
            case '/history':
                this.showCommandHistory();
                break;
            case '/save':
                this.saveGame();
                break;
            case '/load':
                this.loadGame();
                break;
            case '/help':
                this.showHelp();
                break;
            case '/reset':
                this.resetGame();
                break;
            case '/test':
                await this.handleTestConnection();
                break;
            case '/act':
                await this.handleActCommand(args);
                break;
            case '/worldbuild':
                await this.handleWorldBuild(args);
                break;
            case '/log':
                this.showCaptainLog(args);
                break;
            default:
                this.addTerminalOutput(`未知命令: ${cmd}。输入 /help 查看可用命令。`, 'warning');
        }
    }

    // 处理AI行动
    async processAIAction(action) {
        if (APIManagerInstance && APIManagerInstance.enabled) {
            await this.processWithRealAI(action);
        } else {
            await this.processWithRuleEngine(action);
        }
    }
    
    // 工具名汉化映射表
    static TOOL_NAMES = {
        'calculate_battle': '战斗计算',
        'update_resources': '资源更新',
        'roll_check': '属性检定',
        'navigate': '导航',
        'trade': '交易',
        'time_advance': '时间推进',
        'search_acts': '事件搜索',
        'check_rest_conditions': '休息条件检查'
    };

    // 获取工具中文名
    static getToolDisplayName(toolName) {
        return this.TOOL_NAMES[toolName] || toolName;
    }

    // 模板变量替换工具方法
    static fillTemplate(template, vars) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{{${key}}}`);
    }

    // 使用真实AI处理（叙事优先架构：一次AI调用，工具仅在必要时执行）
    async processWithRealAI(action) {
        try {
            const state = State.state;
            const t = state.time;
            const gameTime = `${t.year}.${t.month.toString().padStart(2, '0')}.${t.day.toString().padStart(2, '0')} · ${Math.floor(t.hour).toString().padStart(2, '0')}:${Math.floor(t.minute).toString().padStart(2, '0')}`;

            // 构建记忆部分
            let memorySection = '';
            if (this.persistentMemories && this.persistentMemories.length > 0) {
                memorySection = `\n【近期记忆 - 参考以下历史事件】\n${this.persistentMemories.join('\n')}`;
            }

            // 从世界观模块动态构建场景事实
            const sceneFacts = (window.Lore) ? window.Lore.buildSceneFacts(state) : '（世界观模块未加载）';
            const shipInfo = (window.Lore) ? window.Lore.getShipSummary() : '飞船：未知';
            const shipName = (window.Lore) ? window.Lore.data.playerShip.name : (state.ship.name || '未知飞船');
            const navRoutes = (window.Lore) ? window.Lore.getNavigationRoutes(state.captain.location) : [];
            const routesText = navRoutes.length > 0 
                ? navRoutes.map(r => `${r.name}(${r.distance}光年, ${r.type})`).join('、')
                : '无已知航路';

            // 使用模板填充变量
            const templateVars = {
                shipName,
                location: state.captain.location,
                fuel: state.ship.fuel,
                credits: state.captain.credits,
                captainStatus: state.captain.status,
                energyDesc: state.captain.energy >= 70 ? '充沛' : state.captain.energy >= 40 ? '尚可' : '疲惫',
                hull: state.ship.hull,
                shield: state.ship.shield,
                armament: state.ship.armament || '轻型',
                defense: state.ship.defense || '标准护盾',
                currentMission: state.missions.active.length > 0 ? state.missions.active[0].name : '无活动任务',
                gameTime,
                memorySection,
                shipInfo,
                sceneFacts,
                routesText,
                era: (window.Lore) ? window.Lore.data.universe.era : '未知纪元',
                action
            };

            const template = (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.mainAction)
                ? PROMPT_TEMPLATES.mainAction
                : null;

            const prompt = template
                ? GameCore.fillTemplate(template, templateVars)
                : `你是${shipName}的船载AI终端。玩家行动：${action}。位置：${state.captain.location}，燃料：${state.ship.fuel}%，信用点：${state.captain.credits}€。请以船载终端风格回复。`;

            const apiManager = window.APIManagerInstance;
            const aiResponse = await apiManager.sendRequest(prompt);

            if (!aiResponse.success) {
                this.addTerminalOutput(`AI服务错误: ${aiResponse.message}`, 'error');
                await this.processWithRuleEngine(action);
                return;
            }

            // 解析AI回复：叙事内容 + 可选工具调用 + 武器信息
            const { narrative, toolCalls, weaponInfo, defenseInfo } = this.parseAIResponse(aiResponse.result);

            // 显示叙事内容
            this.addTerminalOutput(narrative, 'ai');

            // 根据AI描述更新具体地点
            console.log('尝试更新具体地点，narrative:', narrative.substring(0, 100));
            if (window.UI) {
                console.log('window.UI 存在');
                if (typeof window.UI.updateSpecificLocationFromAI === 'function') {
                    console.log('updateSpecificLocationFromAI 是函数，调用中...');
                    window.UI.updateSpecificLocationFromAI(narrative);
                } else {
                    console.error('updateSpecificLocationFromAI 不是函数');
                }
            } else {
                console.error('window.UI 不存在');
            }

            // 执行工具调用（如果有且参数完整）
            if (toolCalls.length > 0) {
                await this.executeToolCalls(toolCalls, action);
            }

            // 更新武器信息（如果AI描述中提到）
            if (weaponInfo || defenseInfo) {
                this.updateShipArmament(weaponInfo, defenseInfo);
            }

            // 从 AI 叙事中提取并注册新 NPC
            this.extractAndRegisterNPCs(narrative);

            // 检测玩家"记下/记住"意图 → 写入舰长日志
            this._detectAndLogPlayerNote(action, narrative);

            // 保存到记忆存储系统
            await this.saveToMemoryStorage(action, narrative, toolCalls, weaponInfo, defenseInfo);

            // 后处理校验（validator）
            if (typeof ValidatorInstance !== 'undefined') {
                const validation = ValidatorInstance.validateAIOutput(narrative, toolCalls);
                if (validation.errors.length > 0) {
                    validation.errors.forEach(e => this.addTerminalOutput(`⚠ 校验错误: ${e}`, 'warning'));
                }
                if (validation.warnings.length > 0) {
                    validation.warnings.forEach(w => console.warn('[Validator]', w));
                }
                ValidatorInstance.recordEvent({ action, location: State.state.captain.location });
            }

            // 记录事件和推进回合
            await this.processToolResults(action, []);

        } catch (error) {
            console.error('AI处理错误:', error);
            this.addTerminalOutput(`AI处理失败: ${error.message}`, 'error');
            await this.processWithRuleEngine(action);
        }
    }
    
    // 保存到记忆存储系统
    async saveToMemoryStorage(action, narrative, toolCalls, weaponInfo, defenseInfo) {
        if (!this.memoryStorage) return;
        
        try {
            const state = State.state;
            const location = state.captain.location;
            
            // 1. 保存对话记录
            await this.memoryStorage.addConversation(
                action,
                narrative.substring(0, 1000), // 限制长度
                location,
                this.extractKeywords(action + ' ' + narrative)
            );
            
            // 2. 如果有关键事件，保存为事件
            const keyEvents = this.extractKeyEventsFromAIResponse(action, narrative, toolCalls);
            for (const event of keyEvents) {
                await this.memoryStorage.addEvent(
                    event.type,
                    event.content,
                    location,
                    event.metadata,
                    event.weight
                );
            }
            
            // 3. 如果是武器/防御相关，保存为重要事件
            if (weaponInfo || defenseInfo) {
                await this.memoryStorage.addEvent(
                    'equipment_change',
                    `装备更新: ${weaponInfo || ''} ${defenseInfo || ''}`.trim(),
                    location,
                    { weapon: weaponInfo, defense: defenseInfo },
                    0.9 // 高权重
                );
            }
            
            // 4. 重新加载持久化记忆（更新提示词）
            await this.loadPersistentMemories();
            
        } catch (error) {
            console.error('保存到记忆存储失败:', error);
        }
    }
    
    // 从AI回复中提取关键事件
    extractKeyEventsFromAIResponse(action, narrative, toolCalls) {
        const events = [];
        const state = State.state;
        
        // 检测购买/交易事件
        if (action.includes('购买') || action.includes('买') || 
            narrative.includes('购买') || narrative.includes('花费') || narrative.includes('支付')) {
            events.push({
                type: 'purchase',
                content: `购买物品: ${action}`,
                metadata: { action, narrative: narrative.substring(0, 200) },
                weight: 0.8
            });
        }
        
        // 检测任务相关事件
        if (action.includes('任务') || narrative.includes('任务') || 
            narrative.includes('委托') || narrative.includes('目标')) {
            events.push({
                type: 'mission',
                content: `任务相关: ${action}`,
                metadata: { action, narrative: narrative.substring(0, 200) },
                weight: 0.7
            });
        }
        
        // 检测战斗相关事件
        if (action.includes('攻击') || action.includes('战斗') || action.includes('开火') ||
            narrative.includes('战斗') || narrative.includes('攻击') || narrative.includes('伤害')) {
            events.push({
                type: 'combat',
                content: `战斗事件: ${action}`,
                metadata: { action, narrative: narrative.substring(0, 200) },
                weight: 0.85
            });
        }
        
        // 检测位置移动
        if (action.includes('前往') || action.includes('去') || action.includes('移动到') ||
            narrative.includes('前往') || narrative.includes('到达') || narrative.includes('位置')) {
            events.push({
                type: 'movement',
                content: `位置移动: ${action}`,
                metadata: { action, narrative: narrative.substring(0, 200) },
                weight: 0.6
            });
        }
        
        // 如果有工具调用，增加权重
        if (toolCalls.length > 0) {
            events.forEach(event => {
                event.weight = Math.min(event.weight + 0.1, 1.0);
                event.metadata.toolCalls = toolCalls;
            });
        }
        
        return events;
    }
    
    // 提取关键词
    extractKeywords(text) {
        const keywords = [];
        const commonWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
        
        // 简单的中文分词（按字符分割）
        const words = text.split(/[\s\.,!?;:，。！？；：]/).filter(word => 
            word.length > 1 && !commonWords.has(word)
        );
        
        // 取前5个关键词
        return words.slice(0, 5);
    }

    // 解析AI回复，分离叙事内容和工具调用指令，提取武器信息
    parseAIResponse(responseText) {
        const lines = responseText.split('\n');
        const narrativeLines = [];
        const toolCalls = [];
        let weaponInfo = null;
        let defenseInfo = null;

        // 检测是否包含询问确认的文本
        const confirmationPatterns = [
            /是否确认.*[？?]\s*[YyNn]/,
            /确认.*[？?]\s*[YyNn]/,
            /[YyNn]\s*\/\s*[YyNn]/,
            /\([Yy]\s*\/\s*[Nn]\)/,
            /请确认/,
            /请选择/
        ];

        let hasConfirmation = false;
        for (const line of lines) {
            for (const pattern of confirmationPatterns) {
                if (pattern.test(line)) {
                    hasConfirmation = true;
                    break;
                }
            }
            if (hasConfirmation) break;
        }

        // 如果有确认询问，忽略所有工具调用
        if (hasConfirmation) {
            console.log('检测到确认询问，忽略工具调用');
            return {
                narrative: responseText.trim(),
                toolCalls: [],
                weaponInfo: null,
                defenseInfo: null
            };
        }

        // 从配置派生武器/防御正则
        const loreData = (typeof DEFAULT_LORE !== 'undefined') ? DEFAULT_LORE : null;
        const cfgWeaponTypes = loreData ? loreData.weaponTypes : ['激光炮', '磁轨炮', '等离子炮', '导弹发射器', '加农炮', '速射炮'];
        const cfgWeaponLevels = loreData ? loreData.weaponLevels : ['重型', '中型', '轻型', '微型'];
        const cfgDefenseTypes = loreData ? loreData.defenseTypes : ['能量护盾', '相位护盾', '偏转护盾', '复合装甲', '反应装甲'];

        const weaponTypeRe = cfgWeaponTypes.join('|');
        const weaponLevelRe = cfgWeaponLevels.join('|');
        const defenseTypeRe = cfgDefenseTypes.join('|');

        const weaponPatterns = [
            new RegExp(`装备.*?(${weaponTypeRe})`),
            new RegExp(`安装.*?(${weaponTypeRe})`),
            new RegExp(`获得.*?(${weaponTypeRe})`),
            new RegExp(`购买.*?(${weaponTypeRe})`),
            /武器.*?(升级|强化|增强)/,
            new RegExp(`(${weaponLevelRe}).*?(武器|炮|发射器)`)
        ];

        const defensePatterns = [
            /护盾.*?(升级|强化|增强|恢复|修复)/,
            /装甲.*?(升级|强化|增强|安装)/,
            /防御系统.*?(激活|启动|部署)/,
            new RegExp(`(${defenseTypeRe})`)
        ];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('[TOOL_CALL]')) {
                try {
                    const jsonStr = trimmed.replace('[TOOL_CALL]', '').trim();
                    const parsed = JSON.parse(jsonStr);
                    toolCalls.push(parsed);
                } catch (e) {
                    console.warn('工具调用JSON解析失败:', trimmed);
                    // 当作普通文本处理
                    narrativeLines.push(line);
                }
            } else {
                narrativeLines.push(line);

                // 提取武器信息
                if (!weaponInfo) {
                    for (const pattern of weaponPatterns) {
                        const match = trimmed.match(pattern);
                        if (match) {
                            weaponInfo = this.extractWeaponInfo(trimmed);
                            break;
                        }
                    }
                }

                // 提取防御信息
                if (!defenseInfo) {
                    for (const pattern of defensePatterns) {
                        const match = trimmed.match(pattern);
                        if (match) {
                            defenseInfo = this.extractDefenseInfo(trimmed);
                            break;
                        }
                    }
                }
            }
        }

        return {
            narrative: narrativeLines.join('\n').trim(),
            toolCalls,
            weaponInfo,
            defenseInfo
        };
    }

    // 从文本中提取武器信息
    extractWeaponInfo(text) {
        const loreData = (typeof DEFAULT_LORE !== 'undefined') ? DEFAULT_LORE : null;
        const weaponTypesList = loreData ? loreData.weaponTypes : ['激光炮', '磁轨炮', '等离子炮', '导弹发射器', '加农炮', '速射炮'];
        const weaponLevelsList = loreData ? loreData.weaponLevels : ['重型', '中型', '轻型', '微型'];

        let weaponType = '未知';
        let weaponLevel = '标准';

        // 检测武器类型（从配置列表）
        for (const wt of weaponTypesList) {
            if (text.includes(wt)) {
                weaponType = wt;
                break;
            }
        }

        // 检测武器级别（从配置列表）
        for (const wl of weaponLevelsList) {
            if (text.includes(wl)) {
                weaponLevel = wl;
                break;
            }
        }

        // 检测升级
        if (text.includes('升级') || text.includes('强化') || text.includes('增强')) {
            return `${weaponLevel}${weaponType} (升级)`;
        }

        return `${weaponLevel}${weaponType}`;
    }

    // 从文本中提取防御信息
    extractDefenseInfo(text) {
        const loreData = (typeof DEFAULT_LORE !== 'undefined') ? DEFAULT_LORE : null;
        const defenseTypesList = loreData ? loreData.defenseTypes : ['能量护盾', '相位护盾', '偏转护盾', '复合装甲', '反应装甲'];

        let defenseType = '标准护盾';

        // 检测防御类型（从配置列表）
        for (const dt of defenseTypesList) {
            if (text.includes(dt)) {
                defenseType = dt;
                break;
            }
        }

        // 检测状态
        if (text.includes('升级') || text.includes('强化') || text.includes('增强')) {
            return `${defenseType} (升级)`;
        } else if (text.includes('损坏') || text.includes('破损') || text.includes('失效')) {
            return `${defenseType} (损坏)`;
        } else if (text.includes('恢复') || text.includes('修复') || text.includes('激活')) {
            return `${defenseType} (激活)`;
        }

        return defenseType;
    }

    // 更新飞船武装信息
    updateShipArmament(weaponInfo, defenseInfo) {
        try {
            // 更新右侧面板显示
            const armamentEl = document.getElementById('ship-armament');
            const defenseEl = document.getElementById('ship-defense');

            if (weaponInfo && armamentEl) {
                armamentEl.textContent = weaponInfo;
                console.log('武器信息更新:', weaponInfo);
            }

            if (defenseInfo && defenseEl) {
                defenseEl.textContent = defenseInfo;
                console.log('防御信息更新:', defenseInfo);
            }

            // 这里可以添加将武器信息保存到游戏状态的逻辑
            // 例如：State.update({ ship: { armament: weaponInfo, defense: defenseInfo } });

        } catch (error) {
            console.error('更新武装信息失败:', error);
        }
    }

    // 执行解析出的工具调用
    async executeToolCalls(toolCalls, action) {
        const results = [];

        for (const call of toolCalls) {
            const toolName = call.tool;
            const params = call.params || {};

            // 参数完整性校验：关键字段缺失则跳过
            const requiredParams = {
                'calculate_battle': ['weapon', 'range'],
                'update_resources': ['resource', 'amount'],
                'roll_check': ['skill'],
                'navigate': ['destination'],
                'trade': ['item', 'price'],
                'time_advance': ['hours']
            };

            const required = requiredParams[toolName];
            if (required) {
                const missing = required.filter(k => params[k] === undefined || params[k] === null);
                if (missing.length > 0) {
                    console.warn(`[${toolName}] 参数缺失，跳过执行: ${missing.join(', ')}`);
                    continue;
                }
            }

            try {
                const result = await Tools.callTool(toolName, params);
                const displayName = GameCore.getToolDisplayName(toolName);

                if (result.success) {
                    this.addTerminalOutput(`[${displayName}] ${result.result.message}`, 'tool');
                    results.push({ success: true, tool: toolName, message: result.result.message });
                } else {
                    this.addTerminalOutput(`[${displayName}] 错误: ${result.message}`, 'error');
                    results.push({ success: false, tool: toolName, message: result.message });
                }
            } catch (error) {
                console.error(`执行工具 ${toolName} 失败:`, error);
            }
        }

        return results;
    }
    
    // 使用规则引擎处理
    async processWithRuleEngine(action) {
        this.addTerminalOutput('正在分析行动...', 'system');
        await this.delay(1000);
        
        const toolCalls = this.detectToolCalls(action);
        
        const toolResults = [];
        for (const toolCall of toolCalls) {
            const result = await Tools.callTool(toolCall.tool, toolCall.params);
            toolResults.push(result);
            const displayName = GameCore.getToolDisplayName(toolCall.tool);
            
            if (result.success) {
                this.addTerminalOutput(`[${displayName}] ${result.result.message}`, 'tool');
            } else {
                this.addTerminalOutput(`[${displayName}] 错误: ${result.message}`, 'error');
            }
        }
        
        await this.processToolResults(action, toolResults);
    }
    
    // 处理工具结果
    async processToolResults(action, toolResults) {
        const event = this.generateEventFromAction(action, toolResults);
        if (event) {
            ActManagerInstance.addEvent(event);
            this.addTerminalOutput(`事件记录: ${event.title}`, 'event');
        }
        
        State.incrementTurn();
        this.showCurrentStatus();
    }

    // 检测需要调用的工具
    detectToolCalls(action) {
        const toolCalls = [];
        
        if (action.includes('攻击') || action.includes('战斗') || action.includes('射击')) {
            toolCalls.push({
                tool: 'calculate_battle',
                params: {
                    attacker: 'player',
                    defender: 'enemy',
                    weapon: this.detectWeapon(action),
                    range: this.detectRange(action)
                }
            });
        }
        
        if (action.includes('获得') || action.includes('失去') || 
            action.includes('消耗') || action.includes('恢复')) {
            
            const resource = this.detectResource(action);
            if (resource) {
                toolCalls.push({
                    tool: 'update_resources',
                    params: {
                        resource: resource.type,
                        amount: resource.amount,
                        operation: resource.operation
                    }
                });
            }
        }
        
        if (action.includes('前往') || action.includes('航行') || action.includes('跃迁')) {
            const destination = this.detectDestination(action);
            if (destination) {
                toolCalls.push({
                    tool: 'navigate',
                    params: {
                        destination: destination,
                        distance: this.estimateDistance(destination)
                    }
                });
            }
        }
        
        return toolCalls;
    }

    // 从行动生成事件
    generateEventFromAction(action, toolResults) {
        const location = State.state.captain.location;
        const time = State.getGameTimeString();
        
        let eventType = 'general';
        if (action.includes('攻击') || action.includes('战斗')) eventType = 'combat';
        else if (action.includes('探索') || action.includes('调查')) eventType = 'exploration';
        else if (action.includes('交易') || action.includes('购买')) eventType = 'trade';
        
        const details = {};
        toolResults.forEach(result => {
            if (result.success) {
                details[result.tool] = result.result;
            }
        });
        
        let title = action.substring(0, 30);
        if (title.length < action.length) title += '...';
        
        return {
            title: title,
            description: action,
            location: location,
            type: eventType,
            details: details,
            keywords: this.extractKeywords(action)
        };
    }

    // 测试AI连接（裸调用，跳过GM/人格模块）
    async handleTestConnection() {
        const inst = window.APIManagerInstance;

        if (!inst) {
            this.addTerminalOutput('[诊断] ✗ API模块未加载', 'error');
            return;
        }
        if (!inst.enabled) {
            this.addTerminalOutput('[诊断] ✗ API功能未启用', 'error');
            this.addTerminalOutput('  请在设置中开启API并填写密钥', 'system');
            return;
        }
        if (!inst.apiKey) {
            this.addTerminalOutput('[诊断] ✗ 未配置API密钥', 'error');
            this.addTerminalOutput('  请在设置中选择提供商并填写API Key', 'system');
            return;
        }

        this.addTerminalOutput(`[诊断] 提供商: ${inst.currentProvider} | 模型: ${inst.currentModel}`, 'system');
        this.addTerminalOutput('[诊断] 发送验证请求（跳过GM/人格）...', 'system');

        try {
            const r = await inst.testConnection();

            if (r.success) {
                this.addTerminalOutput(`[诊断] ✓ AI服务已接入`, 'success');
                this.addTerminalOutput(`  实际模型: ${r.model}`, 'system');
                this.addTerminalOutput(`  网络延迟: ${r.latency}ms`, 'system');
                if (r.usage) {
                    const u = r.usage;
                    const p = [];
                    if (u.prompt_tokens) p.push(`输入${u.prompt_tokens}`);
                    if (u.completion_tokens) p.push(`输出${u.completion_tokens}`);
                    if (u.total_tokens) p.push(`合计${u.total_tokens}`);
                    this.addTerminalOutput(`  Token: ${p.join(' / ')}`, 'system');
                }
                // 验证回显
                if (r.verified) {
                    this.addTerminalOutput(`  验证种子回显: ✓ (${r.verifySeed})`, 'success');
                } else {
                    this.addTerminalOutput(`  验证种子回显: ✗ AI未回显种子，可能未正确处理指令`, 'warning');
                }
                // AI回复
                this.addTerminalOutput('', 'system');
                this.addTerminalOutput(r.response, 'ai');
            } else {
                this.addTerminalOutput(`[诊断] ✗ 连接失败`, 'error');
                if (r.latency) this.addTerminalOutput(`  延迟: ${r.latency}ms`, 'system');
                this.addTerminalOutput(`  原因: ${r.message}`, 'error');
            }
        } catch (err) {
            this.addTerminalOutput(`[诊断] ✗ 异常: ${err.message}`, 'error');
        }
    }

    // ========================================
    // 幕管理命令 /act
    // ========================================

    /**
     * 处理幕管理命令
     * /act              — 显示当前幕信息
     * /act end          — 结束当前幕，开始新幕（需满足条件）
     * /act history      — 查看历史幕摘要
     * /act search <关键词> — 搜索历史事件
     */
    async handleActCommand(args) {
        const sub = (args[0] || '').toLowerCase();

        switch (sub) {
            case '':
                // 显示当前幕信息
                this.showActInfo();
                break;

            case 'end':
                await this.endCurrentAct();
                break;

            case 'history':
                this.showActHistory();
                break;

            case 'search':
                const keyword = args.slice(1).join(' ');
                if (!keyword) {
                    this.addTerminalOutput('用法: /act search <关键词>', 'warning');
                    return;
                }
                this.searchActEvents(keyword);
                break;

            default:
                this.addTerminalOutput('幕管理命令:', 'system');
                this.addTerminalOutput('  /act             查看当前幕信息', 'info');
                this.addTerminalOutput('  /act end         结束当前幕，开始新幕', 'info');
                this.addTerminalOutput('  /act history     查看历史幕摘要', 'info');
                this.addTerminalOutput('  /act search <词> 搜索历史事件', 'info');
                break;
        }
    }

    // 显示当前幕信息
    showActInfo() {
        const state = State.state;
        const act = ActManagerInstance.getAct(state.act.current);

        this.addTerminalOutput(`=== 第${state.act.current}幕: ${act ? act.title : '进行中'} ===`, 'system');
        this.addTerminalOutput(`开始时间: ${act ? act.start_time : '未知'}`, 'info');
        this.addTerminalOutput(`已记录事件: ${act ? act.events.length : 0}`, 'info');

        if (act && act.events.length > 0) {
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('--- 最近事件 ---', 'system');
            const recent = act.events.slice(-5);
            recent.forEach(e => {
                this.addTerminalOutput(`  [${e.id}] ${e.title} @ ${e.location}`, 'info');
            });
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('输入 /act end 结束当前幕并开始新幕', 'system');
    }

    // 结束当前幕
    async endCurrentAct() {
        const state = State.state;
        const currentAct = ActManagerInstance.getAct(state.act.current);

        // 条件检查：至少有几个事件
        if (currentAct && currentAct.events.length < 3) {
            this.addTerminalOutput(`当前幕仅有 ${currentAct.events.length} 个事件，建议至少积累 3 个事件再结束`, 'warning');
            this.addTerminalOutput('如确定要结束，请再次输入 /act end', 'info');
            // 简单防误触：如果事件<3，需要连续输入两次
            if (!this._actEndConfirmed) {
                this._actEndConfirmed = true;
                return;
            }
        }
        this._actEndConfirmed = false;

        this.addTerminalOutput('正在结束当前幕...', 'system');

        // 执行幕转换
        const transition = ActManagerInstance.performActTransition();

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput(`═══════════════════════════════`, 'system');
        this.addTerminalOutput(transition.message, 'event');
        this.addTerminalOutput(`═══════════════════════════════`, 'system');

        if (transition.summary) {
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('--- 幕总结 ---', 'system');
            this.addTerminalOutput(`经过天数: ${transition.summary.days_passed}`, 'info');
            this.addTerminalOutput(`事件数量: ${transition.summary.events_count || '?'}`, 'info');
            this.addTerminalOutput(`结束位置: ${transition.summary.end_location}`, 'info');
            this.addTerminalOutput(`舰长状态: ${transition.summary.captain_status}`, 'info');

            // 尝试用 AI 生成叙事摘要
            const narrativeSummary = await this.generateActNarrative(transition);
            if (narrativeSummary) {
                this.addTerminalOutput('', 'empty');
                this.addTerminalOutput('--- 航行日志 ---', 'system');
                this.addTerminalOutput(narrativeSummary, 'ai');
                // 保存叙事摘要到幕档案
                const prevActData = ActManagerInstance.getAct(transition.previousAct);
                if (prevActData) {
                    if (!prevActData.summary) prevActData.summary = {};
                    prevActData.summary.narrative = narrativeSummary;
                    ActManagerInstance.saveAct(prevActData);
                }
            }
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput(`第${transition.newAct}幕开始`, 'success');
        this.addTerminalOutput(`快照已${transition.snapshotCreated ? '创建' : '未能创建'}`, transition.snapshotCreated ? 'info' : 'warning');

        this.updateUI();
    }

    // AI 生成幕叙事摘要
    async generateActNarrative(transition) {
        const apiManager = window.APIManagerInstance;
        if (!apiManager || !apiManager.enabled) return null;

        const template = (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.actSummary)
            ? PROMPT_TEMPLATES.actSummary
            : null;
        if (!template) return null;

        try {
            const prevAct = ActManagerInstance.getAct(transition.previousAct);
            if (!prevAct) return null;

            const summary = transition.summary || {};
            const eventList = (prevAct.events || [])
                .map(e => `[${e.id}] ${e.time || ''} ${e.title} @ ${e.location} — ${(e.description || '').substring(0, 60)}`)
                .join('\n') || '（无事件记录）';

            const vars = {
                actNumber: prevAct.act,
                actTitle: prevAct.title || '未命名',
                daysPassed: summary.days_passed || '?',
                locations: (summary.locations || []).join('、') || '未知',
                eventList,
                eventsCount: summary.events_count || (prevAct.events || []).length,
                tasksCompleted: summary.tasks_completed || 0,
                totalGain: (summary.economic_impact && summary.economic_impact.total_gain) || 0,
                totalCost: (summary.economic_impact && summary.economic_impact.total_cost) || 0,
                netChange: (summary.economic_impact && summary.economic_impact.net_change) || 0
            };

            const prompt = GameCore.fillTemplate(template, vars);
            const aiResponse = await apiManager.sendRequest(prompt);
            if (aiResponse.success) {
                return aiResponse.result.trim();
            }
        } catch (err) {
            console.warn('AI幕叙事生成失败:', err.message);
        }
        return null;
    }

    // 查看历史幕摘要
    showActHistory() {
        const acts = ActManagerInstance.getAllActs();
        const actKeys = Object.keys(acts).sort((a, b) => Number(a) - Number(b));

        if (actKeys.length === 0) {
            this.addTerminalOutput('暂无历史幕数据', 'info');
            return;
        }

        this.addTerminalOutput('=== 幕历史 ===', 'system');

        actKeys.forEach(key => {
            const act = acts[key];
            const isCurrent = Number(key) === State.state.act.current;
            const marker = isCurrent ? ' ← 当前' : '';
            this.addTerminalOutput(``, 'empty');
            this.addTerminalOutput(`第${act.act}幕: ${act.title}${marker}`, isCurrent ? 'success' : 'system');
            this.addTerminalOutput(`  开始: ${act.start_time}  事件: ${act.events.length}`, 'info');
            if (act.summary) {
                this.addTerminalOutput(`  经过: ${act.summary.days_passed}天  位置: ${act.summary.end_location || '?'}`, 'info');
            }
        });
    }

    // 搜索历史事件
    searchActEvents(keyword) {
        const results = ActManagerInstance.searchByKeyword(keyword);

        this.addTerminalOutput(`=== 搜索: "${keyword}" ===`, 'system');

        if (results.length === 0) {
            this.addTerminalOutput('未找到匹配的事件', 'info');
            return;
        }

        results.forEach(r => {
            this.addTerminalOutput(``, 'empty');
            this.addTerminalOutput(`第${r.act}幕: ${r.title} (${r.totalMatches}条匹配)`, 'system');
            r.matchingEvents.forEach(e => {
                this.addTerminalOutput(`  [${e.id}] ${e.title} — ${e.description.substring(0, 50)}`, 'info');
            });
        });
    }

    // 处理休息命令
    async handleRestCommand(args) {
        const checkResult = await Tools.callTool('check_rest_conditions');
        
        if (!checkResult.success) {
            this.addTerminalOutput(`无法检查休息条件: ${checkResult.message}`, 'error');
            return;
        }
        
        this.showRestConditions(checkResult.result);
        
        if (args.includes('emergency')) {
            await this.performRest('emergency');
            return;
        }
        
        this.showRestOptions(checkResult.result);
    }

    // 显示休息条件
    showRestConditions(checkResult) {
        const conditions = checkResult.conditions;
        
        this.addTerminalOutput('休息条件检查:', 'system');
        
        Object.entries(conditions).forEach(([key, met]) => {
            const conditionNames = {
                location: '安全位置',
                combat: '不在战斗中',
                danger: '无危险状态',
                resources: '资源充足'
            };
            
            const icon = met ? '✅' : '❌';
            this.addTerminalOutput(`  ${icon} ${conditionNames[key] || key}`, met ? 'success' : 'warning');
        });
        
        this.addTerminalOutput(`满足条件: ${checkResult.metConditions}/${checkResult.totalConditions}`, 'system');
    }

    // 显示休息选项
    showRestOptions(checkResult) {
        this.addTerminalOutput('可用休息选项:', 'system');
        
        if (checkResult.allMet) {
            this.addTerminalOutput('  1. 完整休息 - 满足所有条件，完全恢复', 'success');
        }
        
        if (checkResult.canSimpleRest) {
            this.addTerminalOutput('  2. 简易休息 - 仅需不在战斗中，部分恢复', 'info');
        }
        
        this.addTerminalOutput('  3. 紧急休息 - 无条件，极少恢复+可能负面效果', 'warning');
        this.addTerminalOutput('输入 /rest full, /rest simple 或 /rest emergency 选择', 'system');
    }

    // 执行休息
    async performRest(restType) {
        this.addTerminalOutput(`执行${this.getRestTypeName(restType)}...`, 'system');
        
        if (restType !== 'emergency') {
            const checkResult = await Tools.callTool('check_rest_conditions');
            if (!checkResult.success || 
                (restType === 'full' && !checkResult.result.allMet) ||
                (restType === 'simple' && !checkResult.result.canSimpleRest)) {
                
                this.addTerminalOutput(`无法执行${this.getRestTypeName(restType)}: 条件不满足`, 'error');
                return;
            }
        }
        
        if (restType === 'full') {
            const consumed = State.consumeRestResources();
            if (!consumed) {
                this.addTerminalOutput('资源不足，无法完整休息', 'warning');
                return;
            }
        }
        
        const effects = State.applyRestEffects(restType);
        
        this.addTerminalOutput(`${this.getRestTypeName(restType)}效果:`, 'system');
        
        if (effects.captain) {
            if (effects.captain.health) {
                this.addTerminalOutput(`  舰长生命: ${effects.captain.health > 0 ? '+' : ''}${effects.captain.health}`, 'success');
            }
            if (effects.captain.energy) {
                this.addTerminalOutput(`  舰长精力: ${effects.captain.energy > 0 ? '+' : ''}${effects.captain.energy}`, 'success');
            }
        }
        
        if (effects.ship) {
            if (effects.ship.hull) {
                this.addTerminalOutput(`  船体修复: ${effects.ship.hull > 0 ? '+' : ''}${effects.ship.hull}`, 'success');
            }
            if (effects.ship.shield) {
                this.addTerminalOutput(`  护盾充能: ${effects.ship.shield > 0 ? '+' : ''}${effects.ship.shield}`, 'success');
            }
        }
        
        // 推进游戏时间（完整休息8小时，简易4小时，紧急2小时）
        const restHours = restType === 'full' ? 8 : (restType === 'simple' ? 4 : 2);
        await Tools.callTool('time_advance', { hours: restHours });
        
        this.addTerminalOutput(`休息完成，时间推进 ${restHours} 小时`, 'info');
        this.updateUI();
    }

    // 获取休息类型名称
    getRestTypeName(restType) {
        const names = {
            'full': '完整休息',
            'simple': '简易休息',
            'emergency': '紧急休息'
        };
        return names[restType] || restType;
    }

    // 显示物品清单
    showInventory() {
        const state = State.state;
        this.addTerminalOutput('=== 物品清单 ===', 'system');
        this.addTerminalOutput(`信用点: ${state.captain.credits}€`, 'info');
        this.addTerminalOutput(`货舱: ${state.ship.cargo_used}/${state.ship.cargo_capacity}`, 'info');
        this.addTerminalOutput('', 'empty');

        if (state.inventory.items.length === 0) {
            this.addTerminalOutput('  (空)', 'info');
        } else {
            state.inventory.items.forEach(item => {
                const typeTag = { consumable: '消耗品', resource: '资源', quest: '任务物品', equipment: '装备' }[item.type] || item.type;
                this.addTerminalOutput(`  ${item.name} x${item.count}  [${typeTag}]`, 'info');
            });
        }
    }

    // 显示任务列表
    showMissions(args) {
        const state = State.state;
        const sub = (args && args[0]) || 'list';

        this.addTerminalOutput('=== 任务日志 ===', 'system');

        if (state.missions.active.length === 0 && state.missions.completed.length === 0) {
            this.addTerminalOutput('  暂无任务', 'info');
            return;
        }

        if (state.missions.active.length > 0) {
            this.addTerminalOutput('--- 进行中 ---', 'system');
            state.missions.active.forEach(m => {
                this.addTerminalOutput(`  ★ ${m.name} — ${m.description || ''}`, 'info');
                if (m.reward) this.addTerminalOutput(`    奖励: ${m.reward}€`, 'info');
            });
        }

        if (state.missions.completed.length > 0) {
            this.addTerminalOutput('--- 已完成 ---', 'system');
            state.missions.completed.forEach(m => {
                this.addTerminalOutput(`  ✓ ${m.name}`, 'success');
            });
        }
    }

    // 显示星图（从 Lore 动态读取）
    showMap() {
        const state = State.state;
        const currentLocation = state.captain.location;
        const fuel = state.ship.fuel;

        this.addTerminalOutput('=== 星域导航 ===', 'system');
        this.addTerminalOutput(`当前位置: ${currentLocation}`, 'info');
        this.addTerminalOutput(`燃料储备: ${fuel}%`, 'info');
        this.addTerminalOutput('', 'empty');

        if (window.Lore) {
            // 当前位置信息
            const locNode = window.Lore.getLocationByName(currentLocation);
            if (locNode) {
                this.addTerminalOutput(`${locNode.name}（${locNode.type}）— ${locNode.description}`, 'info');
                this.addTerminalOutput(`可用服务: ${locNode.services.join('、')}`, 'info');
                this.addTerminalOutput('', 'empty');
            }

            // 可用航路
            const routes = window.Lore.getNavigationRoutes(currentLocation);
            if (routes.length > 0) {
                this.addTerminalOutput('可用航路:', 'system');
                routes.forEach(route => {
                    const fuelCost = Math.round(route.distance);
                    const reachable = fuel >= fuelCost;
                    const tag = reachable ? '' : ' ⚠燃料不足';
                    this.addTerminalOutput(
                        `  • ${route.name}（${route.type}）— ${route.distance} 光年  燃料消耗 ${fuelCost}%${tag}`,
                        reachable ? 'info' : 'warning'
                    );
                });
            } else {
                this.addTerminalOutput('当前位置不在已知星图中，无已知航路', 'warning');
            }

            // 整体星图概览
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('全部已知星域:', 'system');
            window.Lore.data.starMap.forEach(loc => {
                const isCurrent = (currentLocation.includes(loc.name) || loc.name.includes(currentLocation));
                const marker = isCurrent ? ' ← 当前' : '';
                this.addTerminalOutput(`  ◆ ${loc.name}（${loc.type}）${marker}`, isCurrent ? 'success' : 'info');
            });
        } else {
            this.addTerminalOutput('（世界观模块未加载，无法显示星图）', 'warning');
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('使用自然语言描述航行目标，如"前往采矿殖民地深岩"', 'system');
    }

    // ========================================
    // 代理人系统 /agents
    // ========================================

    /** 获取当前游戏时间（小时数，用于刷新判断） */
    getGameTimeInHours() {
        const t = State.state.time;
        // 基准年从 DEFAULT_STATE 读取，避免硬编码
        const baseYear = (typeof DEFAULT_STATE !== 'undefined' && DEFAULT_STATE.time) ? DEFAULT_STATE.time.year : t.year;
        return ((t.year - baseYear) * 365 * 24) + ((t.month - 1) * 30 * 24) + ((t.day - 1) * 24) + t.hour;
    }

    /** 显示当前位置的代理人列表 */
    async showAgents() {
        const state = State.state;
        const location = state.captain.location;
        const credits = state.captain.credits;

        if (!window.Lore) {
            this.addTerminalOutput('世界观模块未加载', 'error');
            return;
        }

        const loc = window.Lore.getLocationByName(location);
        const locId = loc ? loc.id : 'unknown';
        const locType = loc ? loc.type : '未知';
        const gameTimeH = this.getGameTimeInHours();

        this.addTerminalOutput('=== 本地代理人 ===', 'system');
        this.addTerminalOutput(`当前位置: ${location}（${locType}）`, 'info');
        this.addTerminalOutput(`信用点: ${credits}€`, 'info');
        this.addTerminalOutput('', 'empty');

        // 检查是否需要刷新
        const needsRefresh = window.Lore.needsAgentRefresh(locId, gameTimeH);
        const cache = window.Lore.getLocationAgents(locId);

        if (!needsRefresh && cache && cache.agents.length > 0) {
            // 使用缓存
            const hoursLeft = Math.max(0, Math.round(cache.refreshAfterHours - (gameTimeH - cache.generatedAt)));
            this.addTerminalOutput(`代理人信息已缓存（${hoursLeft}小时后刷新）`, 'system');
            this.addTerminalOutput('', 'empty');
            this.renderAgentList(cache.agents, credits);
            return;
        }

        // 需要生成/刷新代理人
        const isUpdate = cache && cache.agents.length > 0;
        this.addTerminalOutput(isUpdate ? '代理人轮换中，正在更新...' : '首次到达，正在扫描本地代理人...', 'system');

        // 获取此地点应有的代理人类型
        const agentTypes = window.Lore.getAvailableAgentTypes(locId);
        if (agentTypes.length === 0) {
            this.addTerminalOutput('此位置没有已知代理人', 'warning');
            return;
        }

        // 尝试 AI 生成
        if (window.APIManagerInstance && window.APIManagerInstance.enabled) {
            try {
                const oldAgents = isUpdate ? cache.agents : [];
                const agents = await this.generateAgentsWithAI(loc, agentTypes, oldAgents, state);
                if (agents && agents.length > 0) {
                    // 随机刷新间隔 24~72 小时
                    const refreshH = 24 + Math.floor(Math.random() * 48);
                    window.Lore.setLocationAgents(locId, agents, gameTimeH, refreshH);
                    // ── 同步注册为 Lore NPC ──
                    this.registerAgentsAsNPCs(agents, locId);
                    this.addTerminalOutput(`已${isUpdate ? '更新' : '生成'} ${agents.length} 位代理人（${refreshH}小时后轮换）`, 'success');
                    this.addTerminalOutput('', 'empty');
                    this.renderAgentList(agents, credits);
                    return;
                }
            } catch (err) {
                console.warn('AI代理人生成失败:', err.message);
            }
        }

        // 离线回退
        const fallback = this.generateOfflineAgents(agentTypes, locId, locType);
        const refreshH = 24 + Math.floor(Math.random() * 48);
        window.Lore.setLocationAgents(locId, fallback, gameTimeH, refreshH);
        // ── 同步注册为 Lore NPC ──
        this.registerAgentsAsNPCs(fallback, locId);
        this.addTerminalOutput('（离线模式 — 基础代理人列表）', 'warning');
        this.renderAgentList(fallback, credits);
    }

    /**
     * 从 AI 叙事中提取并注册出现的 NPC
     * 识别模式：「名字」（种族/职业）、对话标记、自我介绍、种族前缀、英文头衔、通讯来源、绰号等
     * 
     * 注册边界规则：
     *  ✅ 注册：有明确名字/代号的角色（可再次交互）
     *  ❌ 不注册：无名描述性角色、群体、代词、玩家自身、纯历史人物
     *  ⚠️ 同名不同地点：允许注册，用 locId 区分 id
     *  ⚠️ 死亡/离开：不删除，标记 disposition 为 deceased/departed
     */
    extractAndRegisterNPCs(narrative) {
        if (!window.Lore || !narrative) return;

        const state = State.state;
        const loc = window.Lore.getLocationByName(state.captain.location);
        const locId = loc ? loc.id : 'unknown';

        // 已注册的 NPC：同名+同地点视为已存在，同名不同地点允许新建
        const existingByNameLoc = new Set(
            window.Lore.data.npcs.map(n => `${n.name}@${n.location}`)
        );
        // 全局名字集（用于跨地点查重，部分模式跳过已有全局名）
        const existingNames = new Set(window.Lore.data.npcs.map(n => n.name));

        const registered = [];

        // ── 通用过滤词表（代词、通用称谓、玩家自身等不应注册的词） ──
        const FILTER_WORDS = /^(你|我|他|她|它|舰长|船长|对方|那人|此人|这人|老人|女人|男人|人们|大家|众人|某人|一个|某个|那个|这个|有人|谁|什么|怎么|然后|但是|不过|于是|因为|所以|如果|虽然|可是|已经|正在|终于|忽然|突然|慢慢|渐渐)$/;

        // ── 辅助：注册NPC（统一入口，含边界检查） ──
        const tryRegister = (name, race, description, source) => {
            if (!name || name.length < 2 || name.length > 12) return false;
            if (FILTER_WORDS.test(name)) return false;
            if (registered.includes(name)) return false;
            // 同名+同地点 → 跳过
            if (existingByNameLoc.has(`${name}@${locId}`)) return false;

            // 生成 id：包含地点以支持同名不同地点
            const id = `npc_${name}_${locId}_${Date.now().toString(36)}`;

            window.Lore.registerNPC({
                id, name, race,
                description,
                location: locId,
                disposition: 'neutral',
                knownInfo: [],
                source,
                firstMet: new Date().toISOString()
            });
            registered.push(name);
            existingByNameLoc.add(`${name}@${locId}`);
            existingNames.add(name);
            return true;
        };

        // ── 模式0（最优先）：AI 标注格式 —— 「名字」（种族/身份） ──
        // 这是 prompt 引导 AI 输出的标准格式，匹配率最高
        const standardPattern = /[「""]([^「""」]{2,8})[」""][\s]*[（(]([^)）]{1,30})[)）]/g;
        let match;
        while ((match = standardPattern.exec(narrative)) !== null) {
            const name = match[1].trim();
            const desc = match[2].trim();
            // 从描述中尝试提取种族
            const race = this._extractRaceFromDesc(desc);
            tryRegister(name, race, desc, 'ai_annotated');
        }

        // ── 模式1：职业称谓模式 —— "XX老板/店主/摊主/掌柜/技师/医生/酒保" ──
        const rolePattern = /(?:叫|名叫|是|——|—)\s*([^\s,，。！]{2,6}(?:老板|店主|摊主|掌柜|技师|医生|酒保|老板娘|船长|矿工|商人|工程师|军官|猎人|向导|维修师|飞行员|研究员|特工|接线员|管理员))/g;
        while ((match = rolePattern.exec(narrative)) !== null) {
            tryRegister(match[1].trim(), '未知', '在叙事中提及', 'ai_narrative_role');
        }

        // ── 模式2：种族+名字 —— "瓦尔基人塔洛斯" ──
        const knownRaces = window.Lore.data.races.map(r => r.name);
        // 添加机器人/AI实体种族关键词
        const aiEntityRaces = ['人工智能', '机械', '机器人', 'AI', '无人机', '自动化', '仿生人', '赛博格'];
        const allRaceNames = [...knownRaces, ...aiEntityRaces];
        if (allRaceNames.length > 0) {
            const raceNamesRe = allRaceNames.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            const raceBeforePattern = new RegExp(`(${raceNamesRe})\\s*([^\\s,，。！的了和在是说一个也]{2,6})`, 'g');
            while ((match = raceBeforePattern.exec(narrative)) !== null) {
                const race = match[1];
                const name = match[2].trim();
                tryRegister(name, race, `${race}，在叙事中首次出现`, 'ai_narrative_race');
            }
        }

        // ── 模式3：对话标记 —— "XX说：/道：/问道：" ──
        const dialogPattern = /([^\s,，。！""「」]{2,8})\s*(?:说[：:]|道[：:]|问道[：:]|回答[：:]|喊道[：:]|叹道[：:]|笑道[：:]|低声[：:]|冷笑[：:]|怒道[：:])/g;
        while ((match = dialogPattern.exec(narrative)) !== null) {
            tryRegister(match[1].trim(), '未知', '在对话中首次出现', 'ai_narrative_dialog');
        }

        // ── 模式4：自我介绍/他人介绍 —— "我叫XX" / "这位是XX" ──
        const introPattern = /(?:我叫|我是|这位是|他叫|她叫|他是|她是|名为|名字叫|称为|人称)\s*([^\s,，。！""]{2,8})/g;
        while ((match = introPattern.exec(narrative)) !== null) {
            const name = match[1].trim().replace(/[。，！？"""'的]$/, '');
            if (/^(你的|我的|他的|她的|它的)/.test(name)) continue;
            tryRegister(name, '未知', '通过介绍获知', 'ai_narrative_intro');
        }

        // ── 模式5：英文头衔+姓名 ──
        const engNamePattern = /(?:Captain|Dr\.|Mr\.|Mrs\.|Ms\.|Commander|Admiral|Chief|Professor|Agent|Pilot|Engineer)\s+([A-Z][a-zA-Z]{1,15})/g;
        while ((match = engNamePattern.exec(narrative)) !== null) {
            const title = match[0].split(/\s+/)[0].replace('.', '');
            const surname = match[1];
            const fullName = `${title} ${surname}`;
            tryRegister(fullName, '未知', `${title}，在叙事中首次出现`, 'ai_narrative_eng');
        }

        // ── 模式6：通讯/信号来源 —— "来自XX的通讯/信号" ──
        const commPattern = /来自(?:[「""])?([^「""」\s]{2,10})(?:[」""])?的(?:通讯|信号|消息|求救|广播|呼叫)/g;
        while ((match = commPattern.exec(narrative)) !== null) {
            const name = match[1].trim();
            if (name.includes('号')) {
                // 船只注册
                if (!window.Lore.data.knownShips.find(s => s.name === name)) {
                    window.Lore.registerShip({
                        id: `ship_${name}_${locId}_${Date.now().toString(36)}`,
                        name, class: '未知', owner: '未知',
                        location: locId
                    });
                    console.log(`[船只提取] 从通讯中注册船只: ${name}`);
                }
            } else {
                tryRegister(name, '未知', '通过通讯/信号获知', 'ai_narrative_comm');
            }
        }

        // ── 模式7：绰号/代号+动作 —— 「血刃」向你走来 ──
        const nicknamePattern = /[「『""]([^\s「」『』""]{2,6})[」』""](?:\s*(?:向|朝|对|冲|从|在|开始|发出|转身|举起|拔出|说|喊|笑|挡|走|站|坐|靠))/g;
        while ((match = nicknamePattern.exec(narrative)) !== null) {
            tryRegister(match[1].trim(), '未知', '以绰号/代号出现', 'ai_narrative_nickname');
        }

        // ── 模式8：机器人/AI实体专用 —— "XX号机器人"/"AI助手XX"/"无人机XX" ──
        const robotPattern = /(?:机器人|无人机|AI助手|维修机器人|安保无人机|自动化系统)\s*[「""]?([^\s,，。！""「」]{2,8})[」""]?/g;
        while ((match = robotPattern.exec(narrative)) !== null) {
            tryRegister(match[1].trim(), '人工智能', '机械/AI实体', 'ai_narrative_robot');
        }
        // 反向："XX号无人机" / "Alpha-7哨兵"
        const robotPattern2 = /([A-Za-z0-9\-]{2,12})\s*(?:号)?(?:机器人|无人机|哨兵|守卫|侦察机|维修臂)/g;
        while ((match = robotPattern2.exec(narrative)) !== null) {
            tryRegister(match[1].trim(), '人工智能', '机械/AI实体', 'ai_narrative_robot');
        }

        // ══════════════════════════════════════════════
        // NPC 状态变更提取（死亡/离开/被捕等）
        // AI prompt 中要求用 [NPC_STATUS] 名字|状态 标记
        // ══════════════════════════════════════════════
        this._extractNPCStatusChanges(narrative, locId);

        if (registered.length > 0) {
            console.log(`[NPC提取] 从AI叙事中注册了 ${registered.length} 个NPC:`, registered.join(', '));
        }

        // ── 提取匿名角色印象（不注册为NPC但保留场景记忆） ──
        this._extractAnonymousImpressions(narrative, locId, registered);
    }

    /**
     * 从 AI 叙事中提取匿名角色/环境印象
     * 这些角色没有明确名字，不注册为 NPC，
     * 但通过 sceneImpressions 保留，确保后续叙事一致性。
     */
    _extractAnonymousImpressions(narrative, locId, registeredNames) {
        if (!window.Lore) return;

        let impressionCount = 0;

        // 模式A：描述性匿名角色 — "一个/一位/某个 + 描述 + 的 + 角色类型"
        const anonCharPattern = /(?:一个|一位|某个|某位|那个|那位)\s*([^\s,，。！]{2,20}(?:的[^\s,，。！]{1,6}))/g;
        let match;
        while ((match = anonCharPattern.exec(narrative)) !== null) {
            const desc = match[1].trim();
            // 排除过于泛化的描述
            if (desc.length < 4) continue;
            // 排除已注册NPC的描述
            if (registeredNames.some(n => desc.includes(n))) continue;
            window.Lore.addImpression(locId, match[0].trim(), 'anonymous_char');
            impressionCount++;
        }

        // 模式B：群体描述 — "几个/一群/一些 + 描述"
        const crowdPattern = /(?:几个|一群|一些|许多|不少|三五个)\s*([^\s,，。！]{2,20})/g;
        while ((match = crowdPattern.exec(narrative)) !== null) {
            window.Lore.addImpression(locId, match[0].trim(), 'crowd');
            impressionCount++;
        }

        // 模式C：环境氛围 — 含有"弥漫/充满/笼罩/飘荡"的句子片段
        const atmospherePattern = /[^。！]*(?:弥漫|充满|笼罩|飘荡|回荡|闪烁|散发|充斥)[^。！]{2,30}/g;
        while ((match = atmospherePattern.exec(narrative)) !== null) {
            const text = match[0].trim();
            if (text.length > 5 && text.length < 50) {
                window.Lore.addImpression(locId, text, 'atmosphere');
                impressionCount++;
            }
        }

        if (impressionCount > 0) {
            console.log(`[场景印象] 提取了 ${impressionCount} 条匿名角色/环境印象 @ ${locId}`);
        }
    }

    /**
     * 检测玩家是否有"记下/记住"意图，若有则从 AI 叙事中提取关键信息写入舰长日志
     */
    _detectAndLogPlayerNote(playerAction, narrative) {
        if (!window.Lore) return;

        // 检测玩家输入中的记录意图关键词
        const notePatterns = /记下|记住|记录|备忘|笔记|标记|留意|注意到|不要忘|别忘/;
        if (!notePatterns.test(playerAction)) return;

        const location = State.state.captain.location;

        // 推断标签
        let tag = 'note';
        if (/线索|秘密|发现|情报/.test(playerAction)) tag = 'clue';
        else if (/联系|联络|认识|结交|此人|这个人/.test(playerAction)) tag = 'contact';
        else if (/危险|警告|小心|当心|威胁/.test(playerAction)) tag = 'warning';
        else if (/计划|打算|下一步|目标/.test(playerAction)) tag = 'plan';

        // 从玩家输入中提取"记下XXX"后面的内容
        const extractFromAction = playerAction.match(/(?:记下|记住|记录|备忘|标记|留意)\s*[:：]?\s*(.{4,})/);
        if (extractFromAction) {
            window.Lore.addLogEntry(extractFromAction[1].trim(), location, tag);
            this.addTerminalOutput(`📝 舰长日志已记录: ${extractFromAction[1].trim().substring(0, 40)}...`, 'success');
            return;
        }

        // 如果玩家只说"记下来"没有具体内容，从 AI 叙事中提取关键信息
        // 取叙事的前 200 字作为摘要
        const summary = narrative.substring(0, 200).replace(/\n/g, ' ').trim();
        if (summary.length > 10) {
            window.Lore.addLogEntry(summary, location, tag);
            this.addTerminalOutput(`📝 舰长日志已记录当前场景要点`, 'success');
        }
    }

    /** 显示舰长日志 */
    showCaptainLog(args) {
        if (!window.Lore) {
            this.addTerminalOutput('世界观模块未加载', 'error');
            return;
        }

        const sub = (args[0] || '').toLowerCase();

        // /log add <内容> — 手动添加日志
        if (sub === 'add' && args.length > 1) {
            const content = args.slice(1).join(' ');
            const location = State.state.captain.location;
            window.Lore.addLogEntry(content, location, 'note');
            this.addTerminalOutput(`📝 已记录: ${content}`, 'success');
            return;
        }

        // /log del <索引> — 删除日志
        if (sub === 'del' && args[1]) {
            const idx = parseInt(args[1]) - 1;
            if (window.Lore.removeLogEntry(idx)) {
                this.addTerminalOutput(`已删除第 ${idx + 1} 条日志`, 'success');
            } else {
                this.addTerminalOutput('索引无效', 'warning');
            }
            return;
        }

        // /log — 显示全部日志
        const logs = window.Lore.getLogEntries();
        this.addTerminalOutput('=== 舰长日志 ===', 'system');

        if (logs.length === 0) {
            this.addTerminalOutput('  （空）', 'info');
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('在对话中说"记下..."或使用 /log add <内容> 添加日志', 'system');
            return;
        }

        const tagEmoji = { note: '📝', clue: '🔍', contact: '👤', warning: '⚠️', plan: '📋' };
        logs.forEach((l, i) => {
            const emoji = tagEmoji[l.tag] || '📝';
            this.addTerminalOutput(`  ${i + 1}. ${emoji} [${l.gameTime || ''}@${l.location}] ${l.content}`, 'info');
        });

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('命令: /log add <内容>  |  /log del <序号>', 'system');
    }

    /** 从描述文本中提取种族名（辅助方法） */
    _extractRaceFromDesc(desc) {
        if (!window.Lore) return '未知';
        // 已知种族匹配
        for (const race of window.Lore.data.races) {
            if (desc.includes(race.name)) return race.name;
        }
        // AI/机械实体
        if (/人工智能|机器人|机械|AI|无人机|仿生人|赛博格/.test(desc)) return '人工智能';
        return '未知';
    }

    /**
     * 提取 NPC 状态变更标记
     * 格式：[NPC_STATUS] 名字|状态
     * 状态：死亡/deceased、离开/departed、被捕/captured、失踪/missing
     */
    _extractNPCStatusChanges(narrative, locId) {
        if (!window.Lore) return;

        const statusPattern = /\[NPC_STATUS\]\s*([^|]+)\|(.+)/g;
        let match;
        while ((match = statusPattern.exec(narrative)) !== null) {
            const name = match[1].trim();
            const rawStatus = match[2].trim().toLowerCase();

            // 映射中英文状态
            const statusMap = {
                '死亡': 'deceased', 'deceased': 'deceased', '阵亡': 'deceased', '被杀': 'deceased',
                '离开': 'departed', 'departed': 'departed', '离去': 'departed', '撤离': 'departed',
                '被捕': 'captured', 'captured': 'captured', '被抓': 'captured',
                '失踪': 'missing', 'missing': 'missing', '失联': 'missing',
                '敌对': 'hostile', 'hostile': 'hostile', '背叛': 'hostile',
                '友好': 'friendly', 'friendly': 'friendly', '结盟': 'friendly'
            };
            const disposition = statusMap[rawStatus] || rawStatus;

            // 查找并更新该 NPC
            const npc = window.Lore.data.npcs.find(n => n.name === name);
            if (npc) {
                npc.disposition = disposition;
                if (disposition === 'deceased' || disposition === 'departed' || disposition === 'missing') {
                    npc.lastSeen = locId;
                    npc.statusChangedAt = new Date().toISOString();
                }
                window.Lore.saveData();
                console.log(`[NPC状态] ${name} → ${disposition}`);
            }
        }

        // ── 备用：从叙事文本推断死亡/离开（AI没用标记时的回退） ──
        const deathHints = /[「""]([^「""」]{2,8})[」""](?:倒下了|死了|阵亡了|被击杀|不再呼吸|永远地闭上了眼)/g;
        while ((match = deathHints.exec(narrative)) !== null) {
            const name = match[1].trim();
            const npc = window.Lore.data.npcs.find(n => n.name === name);
            if (npc && npc.disposition !== 'deceased') {
                npc.disposition = 'deceased';
                npc.lastSeen = locId;
                npc.statusChangedAt = new Date().toISOString();
                window.Lore.saveData();
                console.log(`[NPC状态推断] ${name} → deceased`);
            }
        }

        const departHints = /[「""]([^「""」]{2,8})[」""](?:离开了|远去了|消失在|驾船离去|跳入了超空间|启动了跃迁)/g;
        while ((match = departHints.exec(narrative)) !== null) {
            const name = match[1].trim();
            const npc = window.Lore.data.npcs.find(n => n.name === name);
            if (npc && npc.disposition !== 'departed') {
                npc.disposition = 'departed';
                npc.lastSeen = locId;
                npc.statusChangedAt = new Date().toISOString();
                window.Lore.saveData();
                console.log(`[NPC状态推断] ${name} → departed`);
            }
        }
    }

    /** 将代理人同步注册为 Lore NPC（确保 AI 叙事能查到） */
    registerAgentsAsNPCs(agents, locId) {
        if (!window.Lore || !agents) return;
        agents.forEach(agent => {
            const npcId = agent.id || `agent_${agent.agentType}_${locId}`;
            window.Lore.registerNPC({
                id: npcId,
                name: agent.name,
                race: agent.race || '未知',
                description: agent.desc || agent.personality || '',
                location: locId,
                disposition: 'neutral',
                knownInfo: agent.services ? agent.services.map(s => s.name) : [],
                agentType: agent.agentType
            });
        });
        console.log(`[NPC注册] ${agents.length} 位代理人已注册到 Lore @ ${locId}`);
    }

    /** AI 生成代理人 */
    async generateAgentsWithAI(loc, agentTypes, oldAgents, state) {
        const typesDesc = agentTypes.map(t => `${t.icon} ${t.name}(${t.id}): ${t.desc}，服务类型: ${t.serviceTypes.join('/')}`).join('\n');
        const oldDesc = oldAgents.length > 0
            ? `\n【旧代理人（部分保留、部分替换）】\n${oldAgents.map(a => `${a.name}(${a.agentType}) — ${a.desc}`).join('\n')}`
            : '';
        const reputation = window.Lore ? window.Lore.getReputationSummary() : '未知';

        // 使用模板填充变量
        const templateVars = {
            locationName: loc.name,
            locationType: loc.type,
            locationDesc: loc.description,
            locationServices: loc.services.join('、'),
            locationTags: loc.tags.join('、'),
            reputation,
            credits: state.captain.credits,
            agentTypesDesc: typesDesc,
            oldAgentsDesc: oldDesc
        };

        const template = (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.agentGeneration)
            ? PROMPT_TEMPLATES.agentGeneration
            : null;

        const prompt = template
            ? GameCore.fillTemplate(template, templateVars)
            : `为${loc.name}（${loc.type}）生成代理人NPC。类型: ${typesDesc}。输出JSON数组。`;

        const apiManager = window.APIManagerInstance;
        if (!apiManager || !apiManager.enabled) return null;
        const aiResponse = await apiManager.sendRequest(prompt);
        if (!aiResponse.success) return null;
        return this.parseTradeJSON(aiResponse.result);
    }

    /** 离线生成代理人 */
    generateOfflineAgents(agentTypes, locId, locType) {
        // 从 agentTypes 配置中获取名称，不再使用硬编码映射
        return agentTypes.map(t => ({
            agentType: t.id,
            name: t.name,
            race: '人类',
            personality: '沉默寡言',
            desc: t.desc.substring(0, 15),
            services: t.serviceTypes.map(st => ({
                name: st.replace('_', ' '),
                type: st.includes('mission') ? 'mission' : 'trade',
                price: st.includes('mission') ? 200 : 100,
                desc: '基础服务'
            }))
        }));
    }

    /** 渲染代理人列表 */
    renderAgentList(agents, credits) {
        const typeIcons = {};
        if (window.Lore) {
            window.Lore.data.agentTypes.forEach(t => { typeIcons[t.id] = t.icon; });
        }

        agents.forEach(agent => {
            const icon = typeIcons[agent.agentType] || '👤';
            this.addTerminalOutput(`${icon} ${agent.name}（${agent.race}）— ${agent.desc}`, 'system');
            if (agent.personality) {
                this.addTerminalOutput(`   性格: ${agent.personality}`, 'info');
            }
            if (agent.services && agent.services.length > 0) {
                agent.services.forEach(svc => {
                    const priceLabel = svc.type === 'mission' ? `奖励 ${svc.price}€` : `${svc.price}€`;
                    const affordable = svc.type === 'mission' || credits >= svc.price;
                    const tag = affordable ? '' : ' ⚠余额不足';
                    this.addTerminalOutput(
                        `   • ${svc.name}  ${priceLabel}  ${svc.desc || ''}${tag}`,
                        affordable ? 'info' : 'warning'
                    );
                });
            }
            this.addTerminalOutput('', 'empty');
        });

        // 黑市提示
        const state = State.state;
        const loc = window.Lore ? window.Lore.getLocationByName(state.captain.location) : null;
        if (loc && !window.Lore.isBlackmarketUnlocked(loc.id)) {
            this.addTerminalOutput('💡 据说通过探索或特定NPC可以接触到黑市掮客...', 'info');
        }

        this.addTerminalOutput('使用自然语言与代理人交互，如"找赏金代理人接任务"或"向贸易代理人购买能量电池"', 'system');
    }

    // ========================================
    // 港口服务 /port
    // ========================================

    /** 显示港口服务 */
    async showPortServices() {
        const state = State.state;
        const location = state.captain.location;
        const credits = state.captain.credits;
        const spareParts = state.inventory.items.find(i => i.id === 'spare_parts');
        const partsCount = spareParts ? spareParts.count : 0;

        if (!window.Lore) {
            // 回退到旧维修
            await this.showRepairInfo();
            return;
        }

        const loc = window.Lore.getLocationByName(location);
        const locType = loc ? loc.type : '未知';
        const services = window.Lore.getPortServices(location);

        this.addTerminalOutput('=== 港口服务 ===', 'system');
        this.addTerminalOutput(`当前位置: ${location}（${locType}）`, 'info');
        this.addTerminalOutput(`船体: ${state.ship.hull}%  护盾: ${state.ship.shield}%  燃料: ${state.ship.fuel}%`, 'info');
        this.addTerminalOutput(`信用点: ${credits}€  备用零件: ${partsCount}`, 'info');
        this.addTerminalOutput('', 'empty');

        // 燃料服务
        const fuelSvc = services.fuel;
        if (fuelSvc && fuelSvc.available) {
            const fuelNeeded = 100 - state.ship.fuel;
            const fuelCost = Math.ceil(fuelNeeded * fuelSvc.baseCost);
            const canAffordFull = credits >= fuelCost;
            const canAffordAny = credits >= fuelSvc.baseCost; // 至少能加1%
            const fuelTag = state.ship.fuel >= 100 ? '（燃料已满）' : canAffordFull ? '' : canAffordAny ? ' （余额不足以加满）' : ' ⚠余额不足';
            this.addTerminalOutput(`⛽ ${fuelSvc.name}  ${fuelSvc.baseCost}€/%  — ${fuelSvc.desc}`, 'system');
            if (state.ship.fuel >= 100) {
                this.addTerminalOutput(`   燃料已满`, 'success');
            } else {
                this.addTerminalOutput(`   当前燃料 ${state.ship.fuel}%  加满需 ${fuelCost}€  可加 ${Math.floor(credits / fuelSvc.baseCost)}%${fuelTag}`, canAffordAny ? 'info' : 'warning');
            }
        }

        // 维修服务
        const repairSvc = services.repair;
        if (repairSvc) {
            if (repairSvc.available) {
                const hullNeeded = 100 - state.ship.hull;
                const repairCost = repairSvc.baseCost > 0 ? Math.ceil(hullNeeded * repairSvc.baseCost) : `${Math.ceil(hullNeeded / 20)}个零件`;
                this.addTerminalOutput(`🔧 ${repairSvc.name}  — ${repairSvc.desc}`, 'system');
                if (state.ship.hull < 100) {
                    this.addTerminalOutput(`   船体修复至100%: ${repairCost}${typeof repairCost === 'number' ? '€' : ''}`, 'info');
                } else {
                    this.addTerminalOutput(`   船体完好，无需维修`, 'success');
                }
            } else {
                this.addTerminalOutput(`🔧 ${repairSvc.name}  — ${repairSvc.desc}`, 'warning');
            }
        }

        // 护盾充能
        const shieldSvc = services.shield;
        if (shieldSvc) {
            if (shieldSvc.available) {
                const shieldNeeded = 100 - state.ship.shield;
                const shieldCost = Math.ceil(shieldNeeded * shieldSvc.baseCost);
                this.addTerminalOutput(`🛡️ ${shieldSvc.name}  — ${shieldSvc.desc}`, 'system');
                if (state.ship.shield < 100) {
                    this.addTerminalOutput(`   护盾充至100%: ${shieldCost}€`, credits >= shieldCost ? 'info' : 'warning');
                } else {
                    this.addTerminalOutput(`   护盾满能`, 'success');
                }
            } else {
                this.addTerminalOutput(`🛡️ ${shieldSvc.name}  — ${shieldSvc.desc}`, 'warning');
            }
        }

        // 升级/改装
        const upgradeSvc = services.upgrade;
        if (upgradeSvc) {
            const tag = upgradeSvc.available ? 'system' : 'warning';
            this.addTerminalOutput(`🚀 ${upgradeSvc.name}  起步 ${upgradeSvc.baseCost || '?'}€  — ${upgradeSvc.desc}`, tag);
        }

        // 医疗
        const medicalSvc = services.medical;
        if (medicalSvc) {
            if (medicalSvc.available) {
                this.addTerminalOutput(`🏥 ${medicalSvc.name}  ${medicalSvc.baseCost}€  — ${medicalSvc.desc}`, 'system');
                if (state.captain.health < 100) {
                    this.addTerminalOutput(`   舰长健康 ${state.captain.health}%，建议治疗`, 'info');
                }
            } else {
                this.addTerminalOutput(`🏥 ${medicalSvc.name}  — ${medicalSvc.desc}`, 'warning');
            }
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('使用自然语言操作，如"给飞船加满燃料"、"修复船体"、"升级武器"', 'system');
    }

    // 显示交易信息（AI 动态生成 + 离线回退）— 保留兼容
    async showTradeInfo() {
        const state = State.state;
        const credits = state.captain.credits;
        const location = state.captain.location;

        this.addTerminalOutput('=== 交易终端 ===', 'system');
        this.addTerminalOutput(`当前位置: ${location}`, 'info');
        this.addTerminalOutput(`信用点余额: ${credits}€`, 'info');
        this.addTerminalOutput('', 'empty');

        // 背包摘要
        const inventorySummary = state.inventory.items.map(i => `${i.name}x${i.count}`).join('、') || '空';

        // 尝试通过 AI 生成当前位置可交易内容
        if (window.APIManagerInstance && window.APIManagerInstance.enabled) {
            this.addTerminalOutput('正在扫描本地市场...', 'system');
            try {
                const tradeVars = {
                    location,
                    locationTags: (window.Lore ? window.Lore.getLocationTags(location) : (state.captain.location_tags || [])).join('、'),
                    locationServices: (window.Lore ? window.Lore.getLocationServices(location) : []).join('、'),
                    credits,
                    inventorySummary,
                    fuel: state.ship.fuel,
                    hull: state.ship.hull,
                    shield: state.ship.shield
                };
                const tradeTemplate = (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.tradeGeneration) ? PROMPT_TEMPLATES.tradeGeneration : null;
                const prompt = tradeTemplate
                    ? GameCore.fillTemplate(tradeTemplate, tradeVars)
                    : `为${location}生成交易商品列表，信用点${credits}€。输出JSON数组。`;

                const apiManager = window.APIManagerInstance;
                const aiResponse = await apiManager.sendRequest(prompt);

                if (aiResponse.success) {
                    const items = this.parseTradeJSON(aiResponse.result);
                    if (items && items.length > 0) {
                        this.renderTradeList(items, credits);
                        return;
                    }
                }
            } catch (error) {
                console.warn('AI交易生成失败，使用离线模式:', error.message);
            }
        }

        // 离线回退：基于位置关键词的基础列表
        this.renderOfflineTradeList(location, credits, state);
    }

    // 解析AI返回的交易JSON
    parseTradeJSON(text) {
        try {
            // 提取JSON数组（可能被```json ... ```包裹）
            const jsonMatch = text.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('交易JSON解析失败:', e.message);
        }
        return null;
    }

    // 渲染AI生成的交易列表
    renderTradeList(items, credits) {
        const buyItems = items.filter(i => i.type === 'buy');
        const sellItems = items.filter(i => i.type === 'sell');
        const services = items.filter(i => i.type === 'service');

        if (buyItems.length > 0) {
            this.addTerminalOutput('--- 可购买 ---', 'system');
            buyItems.forEach(item => {
                const affordable = credits >= item.price;
                const tag = affordable ? '' : ' ⚠余额不足';
                this.addTerminalOutput(
                    `  ${item.name}  ${item.price}€  ${item.desc || ''}${tag}`,
                    affordable ? 'info' : 'warning'
                );
            });
        }

        if (sellItems.length > 0) {
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('--- 本地收购 ---', 'system');
            sellItems.forEach(item => {
                this.addTerminalOutput(
                    `  ${item.name}  收购价${item.price}€  ${item.desc || ''}`,
                    'info'
                );
            });
        }

        if (services.length > 0) {
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('--- 服务 ---', 'system');
            services.forEach(item => {
                const affordable = credits >= item.price;
                const tag = affordable ? '' : ' ⚠余额不足';
                this.addTerminalOutput(
                    `  ${item.name}  ${item.price}€  ${item.desc || ''}${tag}`,
                    affordable ? 'info' : 'warning'
                );
            });
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('使用自然语言描述交易，如"购买2个能量电池"或"给飞船加满燃料"', 'system');
    }

    // 离线回退交易列表
    renderOfflineTradeList(location, credits, state) {
        this.addTerminalOutput('（离线模式 — 基础商品列表）', 'warning');
        const basics = (typeof DEFAULT_LORE !== 'undefined' && DEFAULT_LORE.offlineTradeBasics)
            ? DEFAULT_LORE.offlineTradeBasics
            : [
                { name: '能量电池', price: 50, desc: '恢复能量' },
                { name: '医疗包', price: 80, desc: '恢复生命' },
                { name: '备用零件', price: 120, desc: '用于维修' },
                { name: '燃料补给(+10%)', price: 30, desc: '补充燃料' }
            ];
        basics.forEach(item => {
            const affordable = credits >= item.price;
            this.addTerminalOutput(
                `  ${item.name}  ${item.price}€  ${item.desc}${affordable ? '' : ' ⚠余额不足'}`,
                affordable ? 'info' : 'warning'
            );
        });

        const sellable = state.inventory.items.filter(i => i.type !== 'quest');
        if (sellable.length > 0) {
            this.addTerminalOutput('', 'empty');
            this.addTerminalOutput('--- 可出售 ---', 'system');
            sellable.forEach(item => {
                this.addTerminalOutput(`  ${item.name} x${item.count}`, 'info');
            });
        }

        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('启用AI后可获取基于当前位置的动态商品列表', 'system');
        this.addTerminalOutput('使用自然语言描述交易，如"购买2个能量电池"', 'system');
    }

    // 显示维修信息（AI 动态生成 + 离线回退）
    async showRepairInfo() {
        const state = State.state;
        const location = state.captain.location;
        const credits = state.captain.credits;
        const spareParts = state.inventory.items.find(i => i.id === 'spare_parts');
        const partsCount = spareParts ? spareParts.count : 0;

        this.addTerminalOutput('=== 维修工坊 ===', 'system');
        this.addTerminalOutput(`船体: ${state.ship.hull}%  |  护盾: ${state.ship.shield}%`, 'info');
        this.addTerminalOutput(`备用零件: ${partsCount}  |  信用点: ${credits}€`, 'info');
        this.addTerminalOutput('', 'empty');

        if (state.ship.hull >= 100 && state.ship.shield >= 100) {
            this.addTerminalOutput('飞船各系统运转正常，无需维修。', 'success');
            return;
        }

        // 尝试通过 AI 生成维修选项
        if (window.APIManagerInstance && window.APIManagerInstance.enabled) {
            this.addTerminalOutput('正在查询本地维修设施...', 'system');
            try {
                const repairVars = {
                    location,
                    locationTags: (window.Lore ? window.Lore.getLocationTags(location) : (state.captain.location_tags || [])).join('、'),
                    locationServices: (window.Lore ? window.Lore.getLocationServices(location) : []).join('、'),
                    hull: state.ship.hull,
                    shield: state.ship.shield,
                    engines: state.ship.systems.engines,
                    weapons: state.ship.systems.weapons,
                    sensors: state.ship.systems.sensors,
                    partsCount,
                    credits
                };
                const repairTemplate = (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.repairGeneration) ? PROMPT_TEMPLATES.repairGeneration : null;
                const prompt = repairTemplate
                    ? GameCore.fillTemplate(repairTemplate, repairVars)
                    : `为${location}生成维修服务列表，船体${state.ship.hull}%，信用点${credits}€。输出JSON数组。`;

                const apiManager = window.APIManagerInstance;
                const aiResponse = await apiManager.sendRequest(prompt);

                if (aiResponse.success) {
                    const services = this.parseTradeJSON(aiResponse.result);
                    if (services && services.length > 0) {
                        this.renderRepairList(services);
                        return;
                    }
                }
            } catch (error) {
                console.warn('AI维修生成失败，使用离线模式:', error.message);
            }
        }

        // 离线回退
        this.renderOfflineRepairList(state, credits, partsCount);
    }

    // 渲染AI生成的维修列表
    renderRepairList(services) {
        this.addTerminalOutput('可用维修服务:', 'system');
        services.forEach(svc => {
            const status = svc.available ? '✓' : '✗';
            const reason = (!svc.available && svc.reason) ? ` (${svc.reason})` : '';
            this.addTerminalOutput(
                `  ${status} ${svc.name}  ${svc.cost}  — ${svc.effect}${reason}`,
                svc.available ? 'info' : 'warning'
            );
        });
        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('使用自然语言描述维修需求，如"修复船体"或"升级护盾"', 'system');
    }

    // 离线回退维修列表
    renderOfflineRepairList(state, credits, partsCount) {
        this.addTerminalOutput('（离线模式 — 基础维修选项）', 'warning');
        this.addTerminalOutput('维修选项:', 'system');
        if (state.ship.hull < 100) {
            this.addTerminalOutput(
                `  船体修复 — 消耗1个备用零件，恢复20%船体 ${partsCount > 0 ? '(可用)' : '(零件不足)'}`,
                partsCount > 0 ? 'info' : 'warning'
            );
        }
        if (state.ship.shield < 100) {
            this.addTerminalOutput(
                `  护盾充能 — 消耗50€，恢复25%护盾 ${credits >= 50 ? '(可用)' : '(余额不足)'}`,
                credits >= 50 ? 'info' : 'warning'
            );
        }
        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('启用AI后可获取基于当前位置的动态维修服务', 'system');
        this.addTerminalOutput('使用自然语言描述维修需求，如"修复船体"', 'system');
    }

    // 显示详细状态
    showDetailedStatus() {
        const state = State.state;
        
        this.addTerminalOutput('=== 详细状态报告 ===', 'system');
        this.addTerminalOutput(`时间: ${State.getGameTimeString()}`, 'info');
        this.addTerminalOutput(`位置: ${state.captain.location}`, 'info');
        this.addTerminalOutput(`当前幕: 第${state.act.current}幕`, 'info');
        
        this.addTerminalOutput('--- 舰长状态 ---', 'system');
        this.addTerminalOutput(`生命值: ${state.captain.health}/100`, 'info');
        this.addTerminalOutput(`精力值: ${state.captain.energy}/100`, 'info');
        this.addTerminalOutput(`信用点: ${state.captain.credits}€`, 'info');
        this.addTerminalOutput(`战斗状态: ${state.captain.in_combat ? '战斗中' : '安全'}`, 
                              state.captain.in_combat ? 'warning' : 'success');
        
        this.addTerminalOutput('--- 飞船状态 ---', 'system');
        this.addTerminalOutput(`船体: ${state.ship.hull}/100`, 'info');
        this.addTerminalOutput(`护盾: ${state.ship.shield}/100`, 'info');
        this.addTerminalOutput(`燃料: ${state.ship.fuel}/100`, 'info');
        this.addTerminalOutput(`货舱: ${state.ship.cargo_used}/${state.ship.cargo_capacity}`, 'info');
        
        this.addTerminalOutput('--- 物品清单 ---', 'system');
        if (state.inventory.items.length === 0) {
            this.addTerminalOutput('  无物品', 'info');
        } else {
            state.inventory.items.forEach(item => {
                this.addTerminalOutput(`  ${item.name}: ${item.count}`, 'info');
            });
        }
        
        this.addTerminalOutput('--- 当前任务 ---', 'system');
        if (state.missions.active.length === 0) {
            this.addTerminalOutput('  无活动任务', 'info');
        } else {
            state.missions.active.forEach(mission => {
                this.addTerminalOutput(`  ${mission.name}: ${mission.status}`, 'info');
            });
        }
        
        this.addTerminalOutput('--- 游戏统计 ---', 'system');
        this.addTerminalOutput(`游戏回合: ${state.stats.turns_played}`, 'info');
        this.addTerminalOutput(`事件记录: ${state.stats.events_logged}`, 'info');
        this.addTerminalOutput(`战斗次数: ${state.stats.battles_fought}`, 'info');
        this.addTerminalOutput(`航行距离: ${state.stats.distance_traveled} 光年`, 'info');
    }

    // 显示命令历史
    showCommandHistory() {
        this.addTerminalOutput('=== 最近命令历史 ===', 'system');
        
        if (this.commandHistory.length === 0) {
            this.addTerminalOutput('无命令历史', 'info');
            return;
        }
        
        const recentHistory = this.commandHistory.slice(-10).reverse();
        
        recentHistory.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            this.addTerminalOutput(`${recentHistory.length - index}. [${time}] ${entry.command}`, 'info');
        });
    }

    // 保存游戏
    saveGame() {
        const saveData = {
            state: State.exportState(),
            acts: ActManagerInstance.exportActs(),
            lore: (window.Lore) ? window.Lore.exportData() : null,
            commandHistory: this.commandHistory,
            timestamp: new Date().toISOString(),
            version: '1.1'
        };
        
        try {
            localStorage.setItem('space_rpg_save', JSON.stringify(saveData));
            this.addTerminalOutput('游戏已保存（含世界观数据）', 'success');
            return true;
        } catch (error) {
            this.addTerminalOutput(`保存失败: ${error.message}`, 'error');
            return false;
        }
    }

    // 加载游戏
    loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('space_rpg_save'));
            
            if (!saveData) {
                this.addTerminalOutput('未找到存档', 'warning');
                return false;
            }
            
            State.importState(saveData.state);
            ActManagerInstance.importActs(saveData.acts);
            this.commandHistory = saveData.commandHistory || [];
            
            // 恢复世界观数据
            if (saveData.lore && window.Lore) {
                window.Lore.importData(saveData.lore);
                this.addTerminalOutput('世界观数据已恢复', 'info');
            }
            
            this.addTerminalOutput(`游戏已加载 (${new Date(saveData.timestamp).toLocaleString()})`, 'success');
            this.updateUI();
            return true;
            
        } catch (error) {
            this.addTerminalOutput(`加载失败: ${error.message}`, 'error');
            return false;
        }
    }

    // 显示帮助
    showHelp() {
        this.addTerminalOutput('=== 可用命令 ===', 'system');
        
        const commands = [
            { cmd: '/status', desc: '查看完整状态报告' },
            { cmd: '/inventory', desc: '查看物品清单' },
            { cmd: '/missions', desc: '查看任务日志' },
            { cmd: '/map', desc: '查看星域导航' },
            { cmd: '/agents', desc: '查看本地代理人（赏金/军方/工业/探索/贸易/黑市）' },
            { cmd: '/port', desc: '港口服务（加油/维修/护盾/升级/医疗）' },
            { cmd: '/rest', desc: '休息恢复（full/simple/emergency）' },
            { cmd: '/act', desc: '查看当前幕信息' },
            { cmd: '/act end', desc: '结束当前幕，开始新幕' },
            { cmd: '/act history', desc: '查看历史幕摘要' },
            { cmd: '/history', desc: '查看命令历史' },
            { cmd: '/save', desc: '手动保存游戏' },
            { cmd: '/load', desc: '加载存档' },
            { cmd: '/test', desc: '测试AI连接状态' },
            { cmd: '/log', desc: '查看/添加舰长日志（记录线索、联系人、备忘）' },
            { cmd: '/worldbuild', desc: 'AI辅助世界观调整（添加种族/势力/NPC等）' },
            { cmd: '/reset', desc: '重置游戏（新游戏）' },
            { cmd: '/help', desc: '显示此帮助信息' }
        ];
        
        commands.forEach(cmd => {
            this.addTerminalOutput(`${cmd.cmd.padEnd(20)} ${cmd.desc}`, 'info');
        });
        
        this.addTerminalOutput('', 'system');
        this.addTerminalOutput('=== 游戏说明 ===', 'system');
        this.addTerminalOutput('• 输入自然语言描述行动（如："攻击前方的海盗船"）', 'info');
        this.addTerminalOutput('• AI会根据行动内容决定是否调用游戏系统', 'info');
        this.addTerminalOutput('• 使用 / 开头的命令执行系统操作', 'info');
        this.addTerminalOutput('• /rest 用于恢复状态，/act end 用于结束当前幕', 'info');
    }

    // ========================================
    // 世界观调整命令 /worldbuild
    // ========================================

    /**
     * 处理世界观构建命令
     * /worldbuild              — 显示当前世界观概要 + 可调整项菜单
     * /worldbuild <自然语言>    — AI 辅助调整世界观
     */
    async handleWorldBuild(args) {
        if (!window.Lore) {
            this.addTerminalOutput('世界观模块未加载', 'error');
            return;
        }

        const instruction = args.join(' ').trim();

        // 无参数：显示当前世界观概要
        if (!instruction) {
            this.showWorldBuildMenu();
            return;
        }

        // 有参数：AI 辅助调整
        await this.worldBuildWithAI(instruction);
    }

    /** 显示世界观概要与可调整项菜单 */
    showWorldBuildMenu() {
        const lore = window.Lore.data;

        this.addTerminalOutput('=== 世界观设定控制台 ===', 'system');
        this.addTerminalOutput('', 'empty');

        // 宇宙背景
        this.addTerminalOutput('【宇宙背景】', 'system');
        this.addTerminalOutput(`  纪元：${lore.universe.name} · ${lore.universe.era}`, 'info');
        this.addTerminalOutput(`  货币：${lore.universe.currency}`, 'info');
        this.addTerminalOutput(`  科技：${lore.universe.techLevel}`, 'info');
        this.addTerminalOutput('', 'empty');

        // 种族
        this.addTerminalOutput(`【已知种族】(${lore.races.length}个)`, 'system');
        lore.races.forEach(r => {
            this.addTerminalOutput(`  ◆ ${r.name} — ${r.traits}`, 'info');
        });
        this.addTerminalOutput('', 'empty');

        // 势力
        this.addTerminalOutput(`【势力】(${lore.factions.length}个)`, 'system');
        lore.factions.forEach(f => {
            const rep = lore.reputation[f.id];
            const repLabel = rep !== undefined ? ` [声望: ${rep}]` : '';
            this.addTerminalOutput(`  ◆ ${f.name}（${f.alignment}）— ${f.description}${repLabel}`, 'info');
        });
        this.addTerminalOutput('', 'empty');

        // 星图
        this.addTerminalOutput(`【星系地图】(${lore.starMap.length}个节点)`, 'system');
        lore.starMap.forEach(loc => {
            this.addTerminalOutput(`  ◆ ${loc.name}（${loc.type}）— ${loc.description.substring(0, 30)}...`, 'info');
        });
        this.addTerminalOutput('', 'empty');

        // 玩家飞船
        this.addTerminalOutput('【玩家飞船】', 'system');
        this.addTerminalOutput(`  ${lore.playerShip.name}（${lore.playerShip.class}）`, 'info');
        this.addTerminalOutput(`  武器：${lore.playerShip.weapons}`, 'info');
        this.addTerminalOutput(`  防御：${lore.playerShip.defense}`, 'info');
        this.addTerminalOutput('', 'empty');

        // NPC
        this.addTerminalOutput(`【NPC 注册表】(${lore.npcs.length}个)`, 'system');
        lore.npcs.forEach(n => {
            this.addTerminalOutput(`  ◆ ${n.name}（${n.race}）@ ${n.location} — ${n.description.substring(0, 30)}`, 'info');
        });
        this.addTerminalOutput('', 'empty');

        // 已知船只
        this.addTerminalOutput(`【已知船只】(${lore.knownShips.length}艘)`, 'system');
        lore.knownShips.forEach(s => {
            this.addTerminalOutput(`  ◆ ${s.name}（${s.class}）@ ${s.location}`, 'info');
        });
        this.addTerminalOutput('', 'empty');

        // 使用提示
        this.addTerminalOutput('--- 使用方式 ---', 'system');
        this.addTerminalOutput('  /worldbuild 添加一个新种族：克洛尔虫族，擅长生物科技', 'info');
        this.addTerminalOutput('  /worldbuild 在深岩殖民地添加一个NPC：矿工头目老贾', 'info');
        this.addTerminalOutput('  /worldbuild 添加一个新星系节点：幽灵星云，废弃的战场遗迹', 'info');
        this.addTerminalOutput('  /worldbuild 把飞船武器升级为重型等离子炮', 'info');
        this.addTerminalOutput('  /worldbuild 修改宇宙背景：加入虫洞网络设定', 'info');
        this.addTerminalOutput('  /worldbuild 重置世界观为默认', 'info');
        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('AI 会分析你的指令，自动修改世界观数据并保存。', 'system');
    }

    /** AI 辅助世界观调整 */
    async worldBuildWithAI(instruction) {
        // 特殊指令：重置
        if (instruction === '重置世界观为默认' || instruction === '重置') {
            window.Lore.reset();
            this.addTerminalOutput('世界观已重置为默认设定', 'success');
            return;
        }

        // 检查 AI 是否可用
        if (!window.APIManagerInstance || !window.APIManagerInstance.enabled) {
            this.addTerminalOutput('AI 服务未启用。请在设置中开启 API 后再使用 AI 辅助世界观调整。', 'warning');
            this.addTerminalOutput('（你也可以直接在浏览器控制台通过 Lore.registerNPC({...}) 等方法手动调整）', 'info');
            return;
        }

        this.addTerminalOutput(`[世界观调整] 正在处理指令: "${instruction}"`, 'system');
        this.addTerminalOutput('AI 分析中...', 'system');

        try {
            const currentLore = window.Lore.data;

            const prompt = `你是一个太空RPG的世界观设计助手。玩家想要调整游戏世界观设定。

【当前世界观数据（JSON）】
${JSON.stringify(currentLore, null, 2).substring(0, 3000)}

【玩家指令】
${instruction}

【你的任务】
分析玩家的指令，生成需要执行的世界观修改操作。你必须严格输出一个 JSON 对象，格式如下：

{
  "summary": "一句话描述你做了什么修改",
  "operations": [
    {
      "type": "操作类型",
      "data": { ... }
    }
  ]
}

可用操作类型：
1. "add_race" — 添加种族，data: { "id": "唯一ID", "name": "名称", "traits": "特征", "homeworld": "母星" }
2. "add_faction" — 添加势力，data: { "id": "唯一ID", "name": "名称", "alignment": "阵营", "description": "描述" }
3. "add_location" — 添加星系节点，data: { "id": "唯一ID", "name": "名称", "type": "类型", "tags": [...], "description": "描述", "services": [...], "connections": [{"target":"已有节点ID","distance":数字}] }
4. "add_npc" — 添加NPC，data: { "id": "唯一ID", "name": "名称", "race": "种族ID", "description": "描述", "location": "位置ID", "disposition": "neutral/friendly/hostile", "knownInfo": [...] }
5. "add_ship" — 添加船只，data: { "id": "唯一ID", "name": "名称", "class": "类型", "owner": "归属", "location": "位置ID" }
6. "update_universe" — 修改宇宙背景，data: { 要修改的字段: 新值 }（如 {"description":"新描述"} ）
7. "update_ship" — 修改玩家飞船，data: { 要修改的字段: 新值 }（如 {"weapons":"重型等离子炮×2"} ）
8. "update_reputation" — 修改声望，data: { "faction_id": "势力ID", "value": 数字(-100~100) }
9. "add_clue" — 添加线索，data: { "title": "标题", "content": "内容", "source": "来源" }
10. "remove_npc" — 移除NPC，data: { "id": "NPC的ID" }
11. "remove_location" — 移除星系节点，data: { "id": "节点ID" }

【规则】
- 新增的 id 用英文小写+下划线，如 "ghost_nebula"
- 新增的星系节点至少要有一个 connection 连接到已有节点
- 种族 id 要用于 NPC 的 race 字段
- 位置 id 要用于 NPC 和船只的 location 字段
- 如果指令含糊，做合理推断，但不要过度扩展
- 仅输出 JSON 对象，不要输出任何其他文字`;

            const apiManager = window.APIManagerInstance;
            const aiResponse = await apiManager.sendRequest(prompt);

            if (!aiResponse.success) {
                this.addTerminalOutput(`AI 请求失败: ${aiResponse.message}`, 'error');
                return;
            }

            // 解析 AI 返回的操作
            const ops = this.parseWorldBuildResponse(aiResponse.result);
            if (!ops) {
                this.addTerminalOutput('AI 返回的数据格式无法解析，请换个说法重试', 'warning');
                this.addTerminalOutput(`原始回复: ${aiResponse.result.substring(0, 200)}...`, 'info');
                return;
            }

            // 执行操作
            this.addTerminalOutput(`[世界观调整] ${ops.summary}`, 'success');
            this.addTerminalOutput('', 'empty');

            let successCount = 0;
            for (const op of ops.operations) {
                const result = this.executeWorldBuildOp(op);
                if (result) {
                    successCount++;
                    this.addTerminalOutput(`  ✓ ${result}`, 'success');
                }
            }

            if (successCount > 0) {
                window.Lore.saveData();
                this.addTerminalOutput('', 'empty');
                this.addTerminalOutput(`共执行 ${successCount} 项修改，世界观数据已保存`, 'success');
            } else {
                this.addTerminalOutput('未执行任何修改', 'warning');
            }

        } catch (error) {
            console.error('世界观调整失败:', error);
            this.addTerminalOutput(`世界观调整失败: ${error.message}`, 'error');
        }
    }

    /** 解析 AI 返回的世界观修改 JSON */
    parseWorldBuildResponse(text) {
        try {
            // 尝试提取 JSON 对象
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.summary && Array.isArray(parsed.operations)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('世界观 JSON 解析失败:', e.message);
        }
        return null;
    }

    /** 执行单个世界观修改操作，返回描述文本或 null */
    executeWorldBuildOp(op) {
        const lore = window.Lore;
        const d = op.data;
        if (!d) return null;

        try {
            switch (op.type) {
                case 'add_race':
                    if (!d.id || !d.name) return null;
                    if (lore.data.races.find(r => r.id === d.id)) {
                        // 更新已有
                        Object.assign(lore.data.races.find(r => r.id === d.id), d);
                        return `更新种族: ${d.name}`;
                    }
                    lore.data.races.push(d);
                    return `添加种族: ${d.name}（${d.traits || ''})`;

                case 'add_faction':
                    if (!d.id || !d.name) return null;
                    if (lore.data.factions.find(f => f.id === d.id)) {
                        Object.assign(lore.data.factions.find(f => f.id === d.id), d);
                        return `更新势力: ${d.name}`;
                    }
                    lore.data.factions.push(d);
                    // 初始化声望
                    if (lore.data.reputation[d.id] === undefined) {
                        lore.data.reputation[d.id] = 0;
                    }
                    return `添加势力: ${d.name}（${d.alignment || '中立'}）`;

                case 'add_location':
                    if (!d.id || !d.name) return null;
                    lore.registerLocation(d);
                    return `添加/更新星系节点: ${d.name}（${d.type || '未知'}）`;

                case 'add_npc':
                    if (!d.id || !d.name) return null;
                    lore.registerNPC(d);
                    return `添加/更新 NPC: ${d.name}`;

                case 'add_ship':
                    if (!d.id || !d.name) return null;
                    lore.registerShip(d);
                    return `添加/更新船只: ${d.name}`;

                case 'update_universe':
                    Object.assign(lore.data.universe, d);
                    return `更新宇宙背景: ${Object.keys(d).join('、')}`;

                case 'update_ship':
                    Object.assign(lore.data.playerShip, d);
                    return `更新玩家飞船: ${Object.keys(d).join('、')}`;

                case 'update_reputation':
                    if (d.faction_id && d.value !== undefined) {
                        lore.data.reputation[d.faction_id] = Math.max(-100, Math.min(100, d.value));
                        return `设置声望: ${d.faction_id} → ${d.value}`;
                    }
                    return null;

                case 'add_clue':
                    lore.addClue(d);
                    return `添加线索: ${d.title || d.content?.substring(0, 20)}`;

                case 'remove_npc':
                    if (!d.id) return null;
                    const npcIdx = lore.data.npcs.findIndex(n => n.id === d.id);
                    if (npcIdx >= 0) {
                        const removed = lore.data.npcs.splice(npcIdx, 1)[0];
                        return `移除 NPC: ${removed.name}`;
                    }
                    return `NPC ${d.id} 不存在`;

                case 'remove_location':
                    if (!d.id) return null;
                    const locIdx = lore.data.starMap.findIndex(l => l.id === d.id);
                    if (locIdx >= 0) {
                        const removed = lore.data.starMap.splice(locIdx, 1)[0];
                        return `移除星系节点: ${removed.name}`;
                    }
                    return `星系节点 ${d.id} 不存在`;

                default:
                    return `未知操作类型: ${op.type}`;
            }
        } catch (e) {
            console.error(`执行操作 ${op.type} 失败:`, e);
            return null;
        }
    }

    // 重置游戏
    resetGame() {
        if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
            State.resetGame();
            ActManagerInstance.initializeStorage();
            this.commandHistory = [];
            this.saveCommandHistory();
            
            // 重置世界观数据
            if (window.Lore) {
                window.Lore.reset();
            }
            
            this.addTerminalOutput('游戏已重置（含世界观数据）', 'success');
            this.initializeGame();
        }
    }

    // 显示当前状态（简略）
    showCurrentStatus() {
        const status = State.getStatusDescription();
        this.addTerminalOutput(`状态: ${status.health} | ${status.energy} | ${status.credits}`, 'status');
    }

    // 添加终端输出（修复：正确调用UI）
    addTerminalOutput(text, type = 'info') {
        if (typeof UI !== 'undefined' && UI && typeof UI.addTerminalOutput === 'function') {
            UI.addTerminalOutput(text, type);
        } else {
            console.log(`[${type}] ${text}`);
        }
    }

    // 更新UI（修复：正确调用UI）
    updateUI() {
        if (typeof UI !== 'undefined' && UI && typeof UI.updateStatusDisplay === 'function') {
            UI.updateStatusDisplay();
        } else {
            console.log('UI更新请求');
        }
    }

    // 快速命令方法（供HTML按钮调用）
    command(input) {
        this.processCommand(input);
    }

    // 执行休息方法（供HTML模态框调用）
    performRestAction(restType) {
        this.performRest(restType);
    }

    // 添加到命令历史
    addToCommandHistory(command) {
        this.commandHistory.push({
            command: command,
            timestamp: new Date().toISOString()
        });
        
        if (this.commandHistory.length > this.maxHistory) {
            this.commandHistory = this.commandHistory.slice(-this.maxHistory);
        }
        
        this.saveCommandHistory();
    }

    // 保存命令历史
    saveCommandHistory() {
        try {
            localStorage.setItem('space_rpg_command_history', JSON.stringify(this.commandHistory));
        } catch (error) {
            console.error('保存命令历史失败:', error);
        }
    }

    // 加载命令历史
    loadCommandHistory() {
        try {
            const saved = localStorage.getItem('space_rpg_command_history');
            if (saved) {
                this.commandHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载命令历史失败:', error);
            this.commandHistory = [];
        }
    }

    // 辅助方法：延迟
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 检测武器
    detectWeapon(action) {
        if (action.includes('激光')) return 'laser';
        if (action.includes('导弹')) return 'missile';
        if (action.includes('磁轨')) return 'railgun';
        return 'laser';
    }

    // 检测距离
    detectRange(action) {
        const rangeMatch = action.match(/(\d+)\s*米/);
        return rangeMatch ? parseInt(rangeMatch[1]) : 100;
    }

    // 检测资源
    detectResource(action) {
        // 统一的操作方向检测
        const isAdd = /获得|增加|补充|恢复|赚取|收到|奖励/.test(action);
        const isSub = /失去|减少|消耗|花费|支付|扣除|损失/.test(action);
        // 如果两者都没匹配到，根据语境猜测（默认减少更安全）
        const operation = isAdd ? 'add' : 'subtract';

        if (action.includes('信用点') || action.includes('€')) {
            const amountMatch = action.match(/(\d+)\s*(信用点|€)/);
            return {
                type: 'credits',
                amount: amountMatch ? parseInt(amountMatch[1]) : 100,
                operation: operation
            };
        }
        if (action.includes('燃料')) {
            const amountMatch = action.match(/(\d+)\s*(%?\s*燃料|燃料)/);
            return {
                type: 'fuel',
                amount: amountMatch ? parseInt(amountMatch[1]) : 10,
                operation: operation
            };
        }
        return null;
    }

    // 检测数量
    detectAmount(action) {
        const amountPattern = /(\d+)\s*(个|件|单位|点)/i;
        const match = action.match(amountPattern);
        return match ? parseInt(match[1]) : 1;
    }

    // 检测操作类型
    detectOperation(action) {
        if (action.includes('获得') || action.includes('增加') || action.includes('补充')) return 'add';
        if (action.includes('失去') || action.includes('减少') || action.includes('消耗')) return 'subtract';
        return 'add';
    }

    // 检测目的地（优先从 Lore.starMap 查询）
    detectDestination(action) {
        // 先尝试从世界观星图中匹配
        if (window.Lore && window.Lore.data && window.Lore.data.starMap) {
            for (const loc of window.Lore.data.starMap) {
                if (action.includes(loc.name)) return loc.name;
            }
        }
        // 回退到通用关键词（从 DEFAULT_LORE.starMap 类型 + 通用地点类型动态收集）
        const locationTypes = new Set(['基地', '港口']);
        if (typeof DEFAULT_LORE !== 'undefined' && Array.isArray(DEFAULT_LORE.starMap)) {
            DEFAULT_LORE.starMap.forEach(n => { if (n.type) locationTypes.add(n.type); });
        }
        for (const destination of locationTypes) {
            if (action.includes(destination)) return destination;
        }
        return '未知目的地';
    }

    // 估计距离
    estimateDistance(destination) {
        return Math.floor(Math.random() * 50) + 10;
    }

    // 提取关键词
    extractKeywords(text) {
        const words = text.split(/[，。！？\s]+/);
        return words.filter(word => 
            word.length > 1 && 
            !this.isCommonWord(word)
        ).slice(0, 5);
    }

    // 判断是否为常见词
    isCommonWord(word) {
        const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一'];
        return commonWords.includes(word);
    }
}

// 创建全局游戏核心实例
const Game = new GameCore();
