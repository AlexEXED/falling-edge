/**
 * 游戏状态管理模块
 * 对应原方案中的 state.json
 */

class GameState {
    constructor() {
        this.state = this.loadState() || this.getInitialState();
        this.saveState();
    }

    // 获取初始状态
    getInitialState() {
        // 从外部配置文件读取默认值（js/default-config.js）
        // 如需修改默认初始状态，请编辑 default-config.js 中的 DEFAULT_STATE
        if (typeof DEFAULT_STATE !== 'undefined') {
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
        // 极端兜底：配置文件未加载时的最小默认值
        console.warn('DEFAULT_STATE 未加载，使用最小兜底配置');
        return {
            captain: { name: "舰长", health: 100, energy: 100, credits: 0, location: "未知位置", location_tags: [], in_combat: false, in_danger: false },
            ship: { name: "未命名飞船", hull: 100, shield: 100, fuel: 50, cargo_capacity: 100, cargo_used: 0, systems: { weapons: "无", engines: "基础引擎", sensors: "基础传感器" } },
            inventory: { credits: 0, items: [] },
            missions: { active: [], completed: [] },
            crew: [],
            time: { year: 2000, month: 1, day: 1, hour: 0, minute: 0 },
            act: { current: 1, events: [], start_time: "2000.01.01", days_passed: 0 },
            rest_conditions: { location_tags: [], resource_cost: null, requires_no_combat: true, requires_no_danger: true, unlocked_locations: [], unlocked_skills: [] },
            stats: { turns_played: 0, events_logged: 0, battles_fought: 0, credits_earned: 0, distance_traveled: 0 }
        };
    }

    // 从LocalStorage加载状态
    loadState() {
        try {
            const saved = localStorage.getItem('space_rpg_state');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载游戏状态失败:', error);
        }
        return null;
    }

    // 保存状态到LocalStorage
    saveState() {
        try {
            localStorage.setItem('space_rpg_state', JSON.stringify(this.state));
            return true;
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            return false;
        }
    }

    // 导出状态（用于快照）
    exportState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // 导入状态（从快照恢复）
    importState(snapshot) {
        this.state = snapshot;
        this.saveState();
        return true;
    }

    // 状态更新方法
    update(updates) {
        // 深度合并更新
        this.deepMerge(this.state, updates);
        this.saveState();
        return this.state;
    }

    // 深度合并辅助方法
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    // 获取状态描述文本（用于报幕）
    getStatusDescription() {
        const cap = this.state.captain;
        const ship = this.state.ship;
        
        // 健康状态描述
        let healthDesc = "良好";
        if (cap.health >= 90) healthDesc = "良好";
        else if (cap.health >= 70) healthDesc = "正常";
        else if (cap.health >= 50) healthDesc = "一般";
        else if (cap.health >= 30) healthDesc = "不佳";
        else if (cap.health >= 10) healthDesc = "⚠危险";
        else healthDesc = "⚠⚠临界";

        // 精力状态描述
        let energyDesc = "充沛";
        if (cap.energy >= 90) energyDesc = "充沛";
        else if (cap.energy >= 70) energyDesc = "尚可";
        else if (cap.energy >= 50) energyDesc = "一般";
        else if (cap.energy >= 30) energyDesc = "不足";
        else energyDesc = "精疲力竭";

        // 燃料状态描述
        let fuelDesc = "充足";
        if (ship.fuel >= 90) fuelDesc = "充足";
        else if (ship.fuel >= 70) fuelDesc = "尚可";
        else if (ship.fuel >= 50) fuelDesc = "一般";
        else if (ship.fuel >= 30) fuelDesc = "⚠偏低";
        else fuelDesc = "⚠⚠告急";

        return {
            health: healthDesc,
            energy: energyDesc,
            fuel: fuelDesc,
            credits: cap.credits.toLocaleString() + '€',
            mission: this.state.missions.active[0]?.name || "无活动任务",
            location: cap.location
        };
    }

    // 获取进度条数据
    getProgressData() {
        return {
            hull: this.state.ship.hull,
            shield: this.state.ship.shield,
            fuel: this.state.ship.fuel,
            health: this.state.captain.health,
            energy: this.state.captain.energy
        };
    }

    // 检查休息条件
    checkRestConditions() {
        const conditions = {
            location: false,
            combat: false,
            danger: false,
            resources: false
        };

        const cap = this.state.captain;
        const restCond = this.state.rest_conditions;

        // 检查位置
        if (cap.location_tags && cap.location_tags.some(tag => 
            restCond.location_tags.includes(tag) || 
            restCond.unlocked_locations.includes(tag)
        )) {
            conditions.location = true;
        }

        // 检查战斗状态
        conditions.combat = !restCond.requires_no_combat || !cap.in_combat;

        // 检查危险状态
        conditions.danger = !restCond.requires_no_danger || !cap.in_danger;

        // 检查资源
        if (restCond.resource_cost) {
            const item = this.state.inventory.items.find(
                i => i.id === restCond.resource_cost.item
            );
            conditions.resources = item && item.count >= restCond.resource_cost.count;
        } else {
            conditions.resources = true;
        }

        // 计算满足的条件数量
        const metConditions = Object.values(conditions).filter(v => v).length;
        const totalConditions = Object.keys(conditions).length;

        return {
            conditions,
            metConditions,
            totalConditions,
            allMet: metConditions === totalConditions,
            canSimpleRest: conditions.combat, // 简易休息只需要不在战斗中
            canEmergencyRest: true // 紧急休息无条件
        };
    }

    // 消耗休息资源
    consumeRestResources() {
        const restCond = this.state.rest_conditions;
        if (restCond.resource_cost) {
            const itemIndex = this.state.inventory.items.findIndex(
                i => i.id === restCond.resource_cost.item
            );
            if (itemIndex !== -1) {
                this.state.inventory.items[itemIndex].count -= restCond.resource_cost.count;
                if (this.state.inventory.items[itemIndex].count <= 0) {
                    this.state.inventory.items.splice(itemIndex, 1);
                }
                this.saveState();
                return true;
            }
            return false;
        }
        return true;
    }

    // 执行休息效果
    applyRestEffects(restType) {
        const updates = {};

        switch (restType) {
            case 'full':
                // 完整休息：完全恢复
                updates.captain = {
                    health: Math.min(100, this.state.captain.health + 40),
                    energy: Math.min(100, this.state.captain.energy + 60)
                };
                updates.ship = {
                    hull: Math.min(100, this.state.ship.hull + 20),
                    shield: Math.min(100, this.state.ship.shield + 30)
                };
                break;

            case 'simple':
                // 简易休息：部分恢复
                updates.captain = {
                    health: Math.min(100, this.state.captain.health + 20),
                    energy: Math.min(100, this.state.captain.energy + 30)
                };
                updates.ship = {
                    hull: Math.min(100, this.state.ship.hull + 10),
                    shield: Math.min(100, this.state.ship.shield + 15)
                };
                break;

            case 'emergency':
                // 紧急休息：极少恢复，可能有负面效果
                updates.captain = {
                    health: Math.min(100, this.state.captain.health + 10),
                    energy: Math.min(100, this.state.captain.energy + 15)
                };
                // 紧急休息不影响飞船
                updates.ship = {
                    hull: this.state.ship.hull,
                    shield: this.state.ship.shield
                };
                // 30%几率获得负面状态
                if (Math.random() < 0.3) {
                    updates.captain.health -= 5;
                    updates.captain.energy -= 10;
                }
                break;
        }

        // 确保数值不会低于0
        if (updates.captain) {
            updates.captain.health = Math.max(0, updates.captain.health);
            updates.captain.energy = Math.max(0, updates.captain.energy);
        }
        if (updates.ship) {
            updates.ship.hull = Math.max(0, updates.ship.hull);
            updates.ship.shield = Math.max(0, updates.ship.shield);
        }

        this.update(updates);
        return updates;
    }

    // 增加游戏回合数
    incrementTurn() {
        this.state.stats.turns_played++;
        this.saveState();
    }

    // 增加事件计数
    incrementEventCount() {
        this.state.stats.events_logged++;
        this.saveState();
    }

    // 重置游戏（新游戏）
    resetGame() {
        this.state = this.getInitialState();
        this.saveState();
        return this.state;
    }

    /**
     * 从向导数据初始化游戏状态
     * 从world-lore和向导数据派生初始captain/ship/crew/inventory/mission
     * @param {Object} wizardData - WorldBuildWizard 生成的完整数据
     * @param {Object} lore - 已初始化的WorldLore.data
     */
    initFromWizardData(wizardData, lore) {
        // 以默认状态为基础
        const state = this.getInitialState();

        if (!wizardData || Object.keys(wizardData).length === 0) {
            // 无向导数据，保持默认
            this.state = state;
            this.saveState();
            return this.state;
        }

        // === 从世界观同步飞船名称和系统 ===
        if (lore && lore.playerShip) {
            state.ship.name = lore.playerShip.name || state.ship.name;
            if (lore.playerShip.weapons) state.ship.systems.weapons = lore.playerShip.weapons;
            if (lore.playerShip.engines) state.ship.systems.engines = lore.playerShip.engines;
            if (lore.playerShip.sensors) state.ship.systems.sensors = lore.playerShip.sensors;
        }

        // === 从向导数据覆盖舰长信息 ===
        if (wizardData.captain) {
            if (wizardData.captain.name) state.captain.name = wizardData.captain.name;
            if (wizardData.captain.health) state.captain.health = wizardData.captain.health;
            if (wizardData.captain.energy) state.captain.energy = wizardData.captain.energy;
            if (wizardData.captain.credits) {
                state.captain.credits = wizardData.captain.credits;
                state.inventory.credits = wizardData.captain.credits;
            }
            if (wizardData.captain.location) {
                state.captain.location = wizardData.captain.location;
            } else if (lore && lore.starMap && lore.starMap.length > 0) {
                // 默认起始位置：星图第一个节点
                state.captain.location = lore.starMap[0].name + '控制室';
            }
            if (wizardData.captain.location_tags) {
                state.captain.location_tags = wizardData.captain.location_tags;
            } else if (lore && lore.starMap && lore.starMap.length > 0) {
                state.captain.location_tags = lore.starMap[0].tags || ['安全区域'];
            }
        } else if (lore && lore.starMap && lore.starMap.length > 0) {
            // 无captain数据但有星图，设置默认起始位置
            state.captain.location = lore.starMap[0].name + '控制室';
            state.captain.location_tags = lore.starMap[0].tags || ['安全区域'];
        }

        // === 从向导数据覆盖船员 ===
        if (wizardData.crew && Array.isArray(wizardData.crew) && wizardData.crew.length > 0) {
            state.crew = wizardData.crew;
        }

        // === 从向导数据覆盖物品 ===
        if (wizardData.inventory && Array.isArray(wizardData.inventory) && wizardData.inventory.length > 0) {
            state.inventory.items = wizardData.inventory;
        }

        // === 从向导数据覆盖起始任务 ===
        if (wizardData.startingMission) {
            state.missions.active = [{
                id: wizardData.startingMission.id || 'starting_mission',
                name: wizardData.startingMission.name || '起始任务',
                description: wizardData.startingMission.description || '探索周围区域',
                status: '进行中',
                location: wizardData.startingMission.location || state.captain.location,
                reward: wizardData.startingMission.reward || 500
            }];
        }

        // === 从向导数据覆盖时间 ===
        if (wizardData.time) {
            if (wizardData.time.year) state.time.year = wizardData.time.year;
            if (wizardData.time.month) state.time.month = wizardData.time.month;
            if (wizardData.time.day) state.time.day = wizardData.time.day;
            if (wizardData.time.hour !== undefined) state.time.hour = wizardData.time.hour;
            if (wizardData.time.minute !== undefined) state.time.minute = wizardData.time.minute;
        }

        this.state = state;
        this.saveState();
        console.log('游戏状态已从向导数据初始化');
        return this.state;
    }

    // 获取游戏时间字符串
    getGameTimeString() {
        const t = this.state.time;
        // 确保小时和分钟是整数
        const hour = Math.floor(t.hour);
        const minute = Math.floor(t.minute);
        return `${t.year}.${t.month.toString().padStart(2, '0')}.${t.day.toString().padStart(2, '0')} · ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // 推进游戏时间
    advanceTime(hours = 1) {
        const t = this.state.time;
        
        // 将小时转换为分钟，避免浮点数问题
        const totalMinutes = t.hour * 60 + t.minute + hours * 60;
        
        // 计算新的小时和分钟
        let newHour = Math.floor(totalMinutes / 60);
        let newMinute = Math.round(totalMinutes % 60);
        
        // 处理分钟进位
        if (newMinute >= 60) {
            newHour += Math.floor(newMinute / 60);
            newMinute = newMinute % 60;
        }
        
        // 处理小时进位
        while (newHour >= 24) {
            newHour -= 24;
            t.day++;
        }
        
        // 更新时间
        t.hour = newHour;
        t.minute = newMinute;
        
        while (t.day > 30) { // 简化：每月30天
            t.day -= 30;
            t.month++;
        }
        
        while (t.month > 12) {
            t.month -= 12;
            t.year++;
        }
        
        this.saveState();
        return this.getGameTimeString();
    }
}

// 创建全局游戏状态实例
const State = new GameState();