/**
 * 世界观构建向导 - AI辅助世界观初始化系统
 * 新游戏时引导玩家通过对话式向导创建世界观
 * 支持AI辅助生成 + 离线默认回退
 */

class WorldBuildWizard {
    constructor() {
        // 向导步骤定义
        this.steps = [
            {
                id: 'universe',
                title: '🌌 宇宙背景',
                description: '描述你想要的宇宙背景设定',
                placeholder: '例如：一个赛博朋克风格的银河系，人类与AI共存，超光速旅行依赖虫洞网络...',
                hint: '可以简单一句话，也可以详细描述。AI会帮你补全细节。',
                shortHint: '如：硬科幻/太空歌剧/赛博朋克/废土/奇幻太空',
                required: false,
                fields: ['name', 'era', 'description', 'currency', 'techLevel']
            },
            {
                id: 'races',
                title: '👽 种族设定',
                description: '描述宇宙中存在的种族',
                placeholder: '例如：人类是主要种族，还有一种昆虫形态的外星种族擅长生物科技，以及硅基生命体...',
                hint: '描述你想要的种族类型和特点，AI会生成详细设定。留空则使用默认种族。',
                shortHint: '如：有3个种族，人类/机械种族/灵能种族',
                required: false,
                fields: ['id', 'name', 'traits', 'homeworld']
            },
            {
                id: 'factions',
                title: '⚔️ 势力阵营',
                description: '描述宇宙中的主要势力',
                placeholder: '例如：有一个强大的帝国政府、自由的商人联盟、神秘的海盗组织...',
                hint: '描述势力关系和特点。AI会生成阵营、声望系统等。',
                shortHint: '如：帝国vs叛军/多方势力混战/商业联盟主导',
                required: false,
                fields: ['id', 'name', 'alignment', 'description']
            },
            {
                id: 'starMap',
                title: '🗺️ 星系地图',
                description: '描述你想探索的星系和地点',
                placeholder: '例如：起始点是一个破旧的空间站，附近有矿业殖民地和危险的废墟...',
                hint: '描述3-5个初始地点即可，游戏中可以通过AI动态添加更多。',
                shortHint: '如：5个节点，从安全区到危险区递进',
                required: false,
                fields: ['id', 'name', 'type', 'tags', 'description', 'services', 'connections']
            },
            {
                id: 'playerShip',
                title: '🚀 玩家飞船',
                description: '描述你的飞船',
                placeholder: '例如：一艘老旧但改装过的走私船，有隐形装置但火力不足...',
                hint: '描述飞船类型、武器、防御和特殊装备。',
                shortHint: '如：中型探索船/重型战舰/轻型走私船',
                required: false,
                fields: ['name', 'class', 'weapons', 'defense', 'engines', 'sensors', 'special']
            },
            {
                id: 'captain',
                title: '👨‍✈️ 舰长与开局',
                description: '描述你的角色和初始情境',
                placeholder: '例如：一个退役军人，带着少量积蓄和两个老伙计开始新生活...',
                hint: '描述角色背景、初始资源、船员和起始任务。',
                shortHint: '如：赏金猎人/商人/探险家/逃犯',
                required: false,
                fields: ['name', 'background', 'credits', 'crew', 'startingMission']
            }
        ];

        this.currentStep = 0;
        this.collectedData = {};
        this.isActive = false;
        this.onComplete = null;
        this.onCancel = null;
    }

    /**
     * 检查是否需要运行向导（新游戏检测）
     */
    needsWizard() {
        const hasState = localStorage.getItem('space_rpg_state');
        const hasLore = localStorage.getItem('space_rpg_world_lore');
        const wizardCompleted = localStorage.getItem('space_rpg_wizard_completed');
        return !hasState && !hasLore && !wizardCompleted;
    }

    /**
     * 标记向导已完成
     */
    markCompleted() {
        localStorage.setItem('space_rpg_wizard_completed', 'true');
    }

    /**
     * 清除向导完成标记（用于重置游戏）
     */
    static clearCompleted() {
        localStorage.removeItem('space_rpg_wizard_completed');
    }

    /**
     * 启动向导
     */
    start(onComplete, onCancel) {
        this.isActive = true;
        this.currentStep = 0;
        this.collectedData = {};
        this.onComplete = onComplete;
        this.onCancel = onCancel;
        this.showWizardUI();
    }

    /**
     * 创建并显示向导UI
     */
    showWizardUI() {
        // 移除旧的向导UI
        const old = document.getElementById('worldbuild-wizard-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'worldbuild-wizard-overlay';
        overlay.className = 'wizard-overlay';
        overlay.innerHTML = this.renderWizardHTML();
        document.body.appendChild(overlay);

        // 绑定事件
        this.bindWizardEvents();

        // 动画显示
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    /**
     * 渲染向导HTML
     */
    renderWizardHTML() {
        const step = this.steps[this.currentStep];
        const progress = ((this.currentStep) / this.steps.length * 100).toFixed(0);
        const isFirst = this.currentStep === 0;
        const isLast = this.currentStep === this.steps.length - 1;

        // 步骤指示器
        const stepsIndicator = this.steps.map((s, i) => {
            let cls = 'wizard-step-dot';
            if (i < this.currentStep) cls += ' completed';
            if (i === this.currentStep) cls += ' active';
            return `<div class="${cls}" title="${s.title}">${i < this.currentStep ? '✓' : i + 1}</div>`;
        }).join('');

        // 已收集数据预览
        const preview = this.renderPreview();

        return `
        <div class="wizard-container">
            <div class="wizard-header">
                <h1>🌌 世界观构建向导</h1>
                <p class="wizard-subtitle">创建你的太空冒险世界。每一步都可以跳过，AI会帮你补全。</p>
                <div class="wizard-progress">
                    <div class="wizard-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="wizard-steps-indicator">
                    ${stepsIndicator}
                </div>
            </div>

            <div class="wizard-body">
                <div class="wizard-step-content">
                    <h2>${step.title}</h2>
                    <p class="wizard-step-desc">${step.description}</p>
                    <p class="wizard-step-hint">💡 ${step.hint}</p>
                    <p class="wizard-step-short-hint">快捷输入：${step.shortHint}</p>
                    
                    <textarea 
                        id="wizard-input" 
                        class="wizard-textarea" 
                        placeholder="${step.placeholder}"
                        rows="5"
                    >${this.collectedData[step.id] || ''}</textarea>
                </div>

                ${preview ? `<div class="wizard-preview">${preview}</div>` : ''}
            </div>

            <div class="wizard-footer">
                <div class="wizard-footer-left">
                    <button id="wizard-cancel" class="wizard-btn wizard-btn-cancel">取消</button>
                    <button id="wizard-skip-all" class="wizard-btn wizard-btn-skip">使用默认设定</button>
                </div>
                <div class="wizard-footer-right">
                    ${!isFirst ? '<button id="wizard-prev" class="wizard-btn wizard-btn-secondary">← 上一步</button>' : ''}
                    ${isLast 
                        ? '<button id="wizard-finish" class="wizard-btn wizard-btn-primary">✨ 生成世界观</button>'
                        : '<button id="wizard-next" class="wizard-btn wizard-btn-primary">下一步 →</button>'
                    }
                    <button id="wizard-skip" class="wizard-btn wizard-btn-ghost">跳过此步</button>
                </div>
            </div>
        </div>`;
    }

    /**
     * 渲染已收集数据预览
     */
    renderPreview() {
        const entries = Object.entries(this.collectedData).filter(([k, v]) => v && v.trim());
        if (entries.length === 0) return '';

        const items = entries.map(([key, value]) => {
            const step = this.steps.find(s => s.id === key);
            const title = step ? step.title : key;
            const short = value.length > 50 ? value.substring(0, 50) + '...' : value;
            return `<div class="wizard-preview-item"><strong>${title}:</strong> ${short}</div>`;
        }).join('');

        return `<h3>📋 已设定内容</h3>${items}`;
    }

    /**
     * 绑定向导事件
     */
    bindWizardEvents() {
        const cancel = document.getElementById('wizard-cancel');
        const skipAll = document.getElementById('wizard-skip-all');
        const prev = document.getElementById('wizard-prev');
        const next = document.getElementById('wizard-next');
        const finish = document.getElementById('wizard-finish');
        const skip = document.getElementById('wizard-skip');

        if (cancel) cancel.addEventListener('click', () => this.cancel());
        if (skipAll) skipAll.addEventListener('click', () => this.useDefaults());
        if (prev) prev.addEventListener('click', () => this.prevStep());
        if (next) next.addEventListener('click', () => this.nextStep());
        if (finish) finish.addEventListener('click', () => this.finish());
        if (skip) skip.addEventListener('click', () => this.skipStep());

        // 回车跳转下一步
        const textarea = document.getElementById('wizard-input');
        if (textarea) {
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (this.currentStep === this.steps.length - 1) {
                        this.finish();
                    } else {
                        this.nextStep();
                    }
                }
            });
            textarea.focus();
        }
    }

    /**
     * 保存当前步骤输入
     */
    saveCurrentInput() {
        const textarea = document.getElementById('wizard-input');
        if (textarea) {
            const step = this.steps[this.currentStep];
            const value = textarea.value.trim();
            if (value) {
                this.collectedData[step.id] = value;
            }
        }
    }

    /**
     * 下一步
     */
    nextStep() {
        this.saveCurrentInput();
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showWizardUI();
        }
    }

    /**
     * 上一步
     */
    prevStep() {
        this.saveCurrentInput();
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showWizardUI();
        }
    }

    /**
     * 跳过当前步骤
     */
    skipStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showWizardUI();
        } else {
            this.finish();
        }
    }

    /**
     * 使用默认设定（跳过所有步骤）
     */
    useDefaults() {
        this.collectedData = {};
        this.finishWithData({});
    }

    /**
     * 取消向导
     */
    cancel() {
        this.isActive = false;
        this.removeWizardUI();
        if (this.onCancel) this.onCancel();
    }

    /**
     * 完成向导 - 开始AI生成
     */
    async finish() {
        this.saveCurrentInput();
        
        // 显示生成中状态
        this.showGeneratingUI();

        // 检查是否有任何用户输入
        const hasInput = Object.values(this.collectedData).some(v => v && v.trim());

        if (!hasInput) {
            // 无输入，使用默认
            this.finishWithData({});
            return;
        }

        // 尝试AI生成
        if (window.APIManagerInstance && window.APIManagerInstance.enabled) {
            try {
                const generatedLore = await this.generateWithAI(this.collectedData);
                if (generatedLore) {
                    this.finishWithData(generatedLore);
                    return;
                }
            } catch (err) {
                console.warn('AI世界观生成失败，使用离线解析:', err.message);
            }
        }

        // AI不可用或失败，从用户输入离线解析
        const parsedLore = this.parseUserInputOffline(this.collectedData);
        this.finishWithData(parsedLore);
    }

    /**
     * 以生成的数据完成向导
     */
    finishWithData(loreData) {
        this.isActive = false;
        this.markCompleted();
        this.removeWizardUI();
        if (this.onComplete) this.onComplete(loreData, this.collectedData);
    }

    /**
     * 显示生成中UI
     */
    showGeneratingUI() {
        const container = document.querySelector('.wizard-container');
        if (!container) return;

        container.innerHTML = `
        <div class="wizard-header">
            <h1>🌌 世界观构建向导</h1>
        </div>
        <div class="wizard-generating">
            <div class="wizard-spinner"></div>
            <h2>正在生成世界观...</h2>
            <p>AI正在根据你的描述创建宇宙设定</p>
            <div class="wizard-gen-steps" id="wizard-gen-steps">
                <div class="wizard-gen-step active">📡 连接AI服务...</div>
            </div>
        </div>`;
    }

    /**
     * 更新生成进度
     */
    updateGeneratingProgress(message) {
        const steps = document.getElementById('wizard-gen-steps');
        if (steps) {
            // 标记上一步完成
            const active = steps.querySelector('.active');
            if (active) {
                active.classList.remove('active');
                active.classList.add('done');
                active.textContent = '✅ ' + active.textContent.substring(2);
            }
            // 添加新步骤
            const newStep = document.createElement('div');
            newStep.className = 'wizard-gen-step active';
            newStep.textContent = message;
            steps.appendChild(newStep);
        }
    }

    /**
     * AI生成世界观
     */
    async generateWithAI(userInput) {
        const apiManager = window.APIManagerInstance;
        if (!apiManager || !apiManager.enabled) return null;

        this.updateGeneratingProgress('🧠 分析你的描述...');

        // 构建综合prompt
        const inputSummary = Object.entries(userInput)
            .filter(([k, v]) => v && v.trim())
            .map(([key, value]) => {
                const step = this.steps.find(s => s.id === key);
                return `【${step ? step.title : key}】${value}`;
            }).join('\n\n');

        const prompt = `你是太空RPG世界观设计师。根据玩家的描述，生成完整的世界观数据。

【玩家描述】
${inputSummary || '（玩家未提供描述，请生成一个有趣的默认太空冒险世界观）'}

【输出要求】
生成严格的JSON对象，包含以下所有字段：

{
  "universe": {
    "name": "纪元名称",
    "era": "时代描述",
    "description": "宇宙背景描述（50-100字）",
    "currency": "货币名称和符号",
    "techLevel": "科技水平描述"
  },
  "races": [
    { "id": "英文id", "name": "名称", "traits": "特征描述", "homeworld": "母星" }
  ],
  "factions": [
    { "id": "英文id", "name": "名称", "alignment": "阵营", "description": "描述" }
  ],
  "starMap": [
    {
      "id": "英文id",
      "name": "地点名",
      "type": "空间站|殖民地|前哨站|贸易站|废墟",
      "tags": ["标签1", "标签2"],
      "description": "描述",
      "services": ["服务1", "服务2"],
      "connections": [{"target": "其他节点id", "distance": 数字}]
    }
  ],
  "playerShip": {
    "name": "飞船名",
    "class": "飞船类型",
    "weapons": "武器描述",
    "defense": "防御描述",
    "engines": "引擎类型",
    "sensors": "传感器类型",
    "special": "特殊装备"
  },
  "captain": {
    "name": "舰长名",
    "health": 数字(50-100),
    "energy": 数字(50-100),
    "credits": 数字(500-5000),
    "location": "起始位置（必须是starMap第一个节点的name+具体地点）",
    "location_tags": ["标签1", "标签2"]
  },
  "crew": [
    { "id": "英文id", "name": "名字", "role": "职位", "status": "正常" }
  ],
  "npcs": [
    { "id": "英文id", "name": "名字", "race": "种族id", "description": "描述", "location": "星图节点id", "disposition": "neutral", "knownInfo": ["信息"] }
  ],
  "knownShips": [
    { "id": "英文id", "name": "船名", "class": "类型", "owner": "归属", "location": "节点id" }
  ],
  "inventory": [
    { "id": "英文id", "name": "物品名", "count": 数字, "type": "consumable|resource|quest" }
  ],
  "startingMission": {
    "id": "英文id",
    "name": "任务名",
    "description": "任务描述",
    "location": "相关位置",
    "reward": 数字
  },
  "time": {
    "year": 数字,
    "month": 数字(1-12),
    "day": 数字(1-30),
    "hour": 数字(0-23),
    "minute": 数字(0-59)
  }
}

【规则】
1. 种族至少3个，势力至少3个，星图节点至少4个
2. 星图节点之间必须通过connections互相连通
3. 所有id用英文小写+下划线
4. 起始位置必须是安全区域
5. 根据玩家描述的风格调整所有内容
6. 如果玩家描述简短，合理推断补全
7. 仅输出JSON，不要其他文字`;

        this.updateGeneratingProgress('✨ 生成世界观数据...');

        const response = await apiManager.sendRequest(prompt);
        if (!response.success) return null;

        this.updateGeneratingProgress('📦 解析生成结果...');

        try {
            const jsonMatch = response.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // 验证必要字段
                if (parsed.universe && parsed.starMap && parsed.playerShip) {
                    this.updateGeneratingProgress('✅ 世界观生成完成！');
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('AI世界观JSON解析失败:', e.message);
        }

        return null;
    }

    /**
     * 离线解析用户输入，生成世界观数据
     * 从简短/长描述中提取关键信息
     */
    parseUserInputOffline(userInput) {
        const result = {};

        // 解析宇宙背景
        if (userInput.universe) {
            result.universe = this.parseUniverseInput(userInput.universe);
        }

        // 解析种族
        if (userInput.races) {
            result.races = this.parseRacesInput(userInput.races);
        }

        // 解析势力
        if (userInput.factions) {
            result.factions = this.parseFactionsInput(userInput.factions);
        }

        // 解析星图
        if (userInput.starMap) {
            result.starMap = this.parseStarMapInput(userInput.starMap);
        }

        // 解析飞船
        if (userInput.playerShip) {
            result.playerShip = this.parseShipInput(userInput.playerShip);
        }

        // 解析舰长
        if (userInput.captain) {
            result.captain = this.parseCaptainInput(userInput.captain);
        }

        return result;
    }

    /**
     * 解析宇宙背景描述
     */
    parseUniverseInput(text) {
        const result = {};
        
        // 提取关键词确定风格
        const styles = {
            '赛博朋克': { techLevel: '高科技低生活——赛博朋克风格' },
            '硬科幻': { techLevel: '严格物理定律，近未来科技' },
            '太空歌剧': { techLevel: '高度发达——超光速旅行、能量护盾、AI辅助' },
            '废土': { techLevel: '后灾难科技——残存旧世界技术碎片' },
            '奇幻': { techLevel: '魔法与科技融合' }
        };

        for (const [keyword, style] of Object.entries(styles)) {
            if (text.includes(keyword)) {
                Object.assign(result, style);
                break;
            }
        }

        result.description = text.substring(0, 200);
        if (!result.name) result.name = '星际纪元';
        
        return result;
    }

    /**
     * 解析种族描述
     */
    parseRacesInput(text) {
        // 尝试按分隔符拆分
        const parts = text.split(/[，,、；;。\n]+/).filter(p => p.trim());
        if (parts.length === 0) return undefined;

        return parts.map((part, i) => {
            const trimmed = part.trim();
            // 尝试提取"名称：描述"格式
            const colonMatch = trimmed.match(/^(.+?)[：:—\-](.+)$/);
            if (colonMatch) {
                return {
                    id: `race_${i}`,
                    name: colonMatch[1].trim(),
                    traits: colonMatch[2].trim(),
                    homeworld: '未知'
                };
            }
            return {
                id: `race_${i}`,
                name: trimmed.substring(0, 10),
                traits: trimmed,
                homeworld: '未知'
            };
        });
    }

    /**
     * 解析势力描述
     */
    parseFactionsInput(text) {
        const parts = text.split(/[，,、；;。\n]+/).filter(p => p.trim());
        if (parts.length === 0) return undefined;

        const alignments = ['秩序', '中立', '混乱', '秩序/中立', '中立/混乱'];
        return parts.map((part, i) => {
            const trimmed = part.trim();
            const colonMatch = trimmed.match(/^(.+?)[：:—\-](.+)$/);
            if (colonMatch) {
                return {
                    id: `faction_${i}`,
                    name: colonMatch[1].trim(),
                    alignment: alignments[i % alignments.length],
                    description: colonMatch[2].trim()
                };
            }
            return {
                id: `faction_${i}`,
                name: trimmed.substring(0, 10),
                alignment: alignments[i % alignments.length],
                description: trimmed
            };
        });
    }

    /**
     * 解析星图描述
     */
    parseStarMapInput(text) {
        const parts = text.split(/[。\n]+/).filter(p => p.trim());
        if (parts.length === 0) return undefined;

        const types = ['空间站', '殖民地', '前哨站', '贸易站', '废墟'];
        const typeKeywords = {
            '空间站': ['空间站', '太空站', '轨道站'],
            '殖民地': ['殖民地', '殖民', '定居点'],
            '前哨站': ['前哨站', '前哨', '据点'],
            '贸易站': ['贸易站', '贸易', '市场'],
            '废墟': ['废墟', '废弃', '遗迹', '残骸']
        };

        return parts.map((part, i) => {
            const trimmed = part.trim();
            if (!trimmed) return null;

            // 推断类型
            let locType = types[i % types.length];
            for (const [type, keywords] of Object.entries(typeKeywords)) {
                if (keywords.some(k => trimmed.includes(k))) {
                    locType = type;
                    break;
                }
            }

            // 提取名称
            const colonMatch = trimmed.match(/^(.+?)[：:—\-](.+)$/);
            const name = colonMatch ? colonMatch[1].trim() : trimmed.substring(0, 10);
            const desc = colonMatch ? colonMatch[2].trim() : trimmed;

            return {
                id: `loc_${i}`,
                name: name,
                type: locType,
                tags: [locType, i === 0 ? '安全区域' : ''],
                description: desc,
                services: locType === '空间站' ? ['全面维修', '燃料补给', '商品交易'] : ['基础服务'],
                connections: i > 0 ? [{ target: `loc_${i - 1}`, distance: 3 + i * 2 }] : []
            };
        }).filter(Boolean);
    }

    /**
     * 解析飞船描述
     */
    parseShipInput(text) {
        const result = {};
        
        // 提取飞船类型关键词
        const shipTypes = {
            '走私船': '轻型走私/运输船',
            '战舰': '重型战斗舰',
            '探索船': '中型探索船',
            '货船': '大型货运船',
            '护卫舰': '轻型护卫舰',
            '巡洋舰': '中型巡洋舰'
        };

        for (const [keyword, cls] of Object.entries(shipTypes)) {
            if (text.includes(keyword)) {
                result.class = cls;
                break;
            }
        }

        if (!result.class) result.class = '中型多用途飞船';
        result.description = text;

        return result;
    }

    /**
     * 解析舰长描述
     */
    parseCaptainInput(text) {
        const result = {};

        // 提取职业关键词
        const backgrounds = {
            '赏金猎人': { credits: 2000, background: '赏金猎人' },
            '商人': { credits: 3000, background: '太空商人' },
            '探险家': { credits: 1500, background: '星际探险家' },
            '逃犯': { credits: 800, background: '通缉逃犯' },
            '军人': { credits: 1800, background: '退役军人' },
            '海盗': { credits: 2500, background: '太空海盗' },
            '科学家': { credits: 1200, background: '科研人员' }
        };

        for (const [keyword, data] of Object.entries(backgrounds)) {
            if (text.includes(keyword)) {
                Object.assign(result, data);
                break;
            }
        }

        result.description = text;
        return result;
    }

    /**
     * 移除向导UI
     */
    removeWizardUI() {
        const overlay = document.getElementById('worldbuild-wizard-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// 全局实例
window.WorldBuildWizard = WorldBuildWizard;
