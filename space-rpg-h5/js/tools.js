/**
 * 工具系统模块
 * 对应原方案中的 tools.py
 * 实现8个核心工具函数
 */

class ToolSystem {
    constructor() {
        this.toolRegistry = {};
        this.registerTools();
    }

    // 工具注册表
    registerTools() {
        this.register('calculate_battle', this.calculateBattle.bind(this));
        this.register('update_resources', this.updateResources.bind(this));
        this.register('roll_check', this.rollCheck.bind(this));
        this.register('navigate', this.navigate.bind(this));
        this.register('trade', this.trade.bind(this));
        this.register('time_advance', this.timeAdvance.bind(this));
        this.register('search_acts', this.searchActs.bind(this));
        this.register('check_rest_conditions', this.checkRestConditions.bind(this));
    }

    // 注册工具
    register(name, func) {
        this.toolRegistry[name] = func;
    }

    // 调用工具
    async callTool(name, params = {}) {
        if (!this.toolRegistry[name]) {
            return {
                error: true,
                message: `未知工具: ${name}`,
                tool: name
            };
        }

        try {
            const result = await this.toolRegistry[name](params);
            return {
                success: true,
                tool: name,
                params: params,
                result: result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                error: true,
                tool: name,
                message: `工具执行失败: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 工具1: 战斗计算
    async calculateBattle(params) {
        const { attacker, defender, weapon, range } = params;
        
        // 基础命中率
        let hitChance = 70; // 基础70%
        
        // 距离影响
        if (range > 300) hitChance -= 30;
        else if (range > 100) hitChance -= 15;
        
        // 武器类型影响
        if (weapon === 'laser') hitChance += 10;
        else if (weapon === 'missile') hitChance += 5;
        else if (weapon === 'railgun') hitChance -= 5;
        
        // 随机因素
        hitChance += (Math.random() * 20 - 10); // -10到+10的随机
        
        // 确保在合理范围内
        hitChance = Math.max(10, Math.min(95, hitChance));
        
        // 是否命中
        const hit = Math.random() * 100 < hitChance;
        
        if (!hit) {
            return {
                hit: false,
                hitChance: Math.round(hitChance),
                damage: 0,
                critical: false,
                message: "攻击未命中目标"
            };
        }
        
        // 计算伤害
        let baseDamage = 20;
        if (weapon === 'laser') baseDamage = 25;
        else if (weapon === 'missile') baseDamage = 40;
        else if (weapon === 'railgun') baseDamage = 60;
        
        // 暴击判定
        const isCritical = Math.random() * 100 < 15; // 15%暴击率
        let damage = isCritical ? baseDamage * 1.5 : baseDamage;
        
        // 距离衰减
        if (range > 200) damage *= 0.7;
        else if (range > 100) damage *= 0.85;
        
        // 随机波动
        damage *= (0.8 + Math.random() * 0.4); // 80%-120%波动
        
        damage = Math.round(damage);
        
        return {
            hit: true,
            hitChance: Math.round(hitChance),
            damage: damage,
            critical: isCritical,
            weapon: weapon,
            message: isCritical 
                ? `暴击命中！造成 ${damage} 点伤害`
                : `命中目标，造成 ${damage} 点伤害`
        };
    }

    // 工具2: 资源更新
    async updateResources(params) {
        const { resource, amount, operation = 'add' } = params;
        
        // 验证资源类型（支持中英文）
        const resourceMap = {
            'credits': 'credits', '信用点': 'credits', '信用': 'credits',
            'energy_cell': 'energy_cell', '能量电池': 'energy_cell', '电池': 'energy_cell',
            'medkit': 'medkit', '医疗包': 'medkit', '医疗': 'medkit',
            'spare_parts': 'spare_parts', '备用零件': 'spare_parts', '零件': 'spare_parts',
            'fuel': 'fuel', '燃料': 'fuel'
        };
        
        const normalizedResource = resourceMap[resource];
        if (!normalizedResource) {
            throw new Error(`无效的资源类型: ${resource}。有效类型: ${Object.keys(resourceMap).join(', ')}`);
        }
        
        // 验证数量
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error(`无效的数量: ${amount}`);
        }
        
        let currentState = State.exportState();
        let newValue;
        
        if (normalizedResource === 'credits') {
            // 信用点
            const current = currentState.captain.credits;
            if (operation === 'add') {
                newValue = current + amount;
                currentState.stats.credits_earned += amount;
            } else if (operation === 'subtract') {
                if (current < amount) {
                    throw new Error(`信用点不足: 需要 ${amount}，当前 ${current}`);
                }
                newValue = current - amount;
            } else {
                throw new Error(`无效的操作: ${operation}`);
            }
            
            currentState.captain.credits = newValue;
            
        } else if (normalizedResource === 'fuel') {
            // 燃料
            const current = currentState.ship.fuel;
            if (operation === 'add') {
                newValue = Math.min(100, current + amount);
            } else if (operation === 'subtract') {
                if (current < amount) {
                    throw new Error(`燃料不足: 需要 ${amount}%，当前 ${current}%`);
                }
                newValue = Math.max(0, current - amount);
            } else {
                throw new Error(`无效的操作: ${operation}`);
            }
            
            currentState.ship.fuel = newValue;
            
        } else {
            // 物品
            const itemIndex = currentState.inventory.items.findIndex(item => item.id === normalizedResource);
            
            if (operation === 'add') {
                if (itemIndex === -1) {
                    // 新物品
                    currentState.inventory.items.push({
                        id: normalizedResource,
                        name: this.getItemName(normalizedResource),
                        count: amount,
                        type: this.getItemType(normalizedResource)
                    });
                } else {
                    // 增加数量
                    currentState.inventory.items[itemIndex].count += amount;
                }
                
            } else if (operation === 'subtract') {
                if (itemIndex === -1 || currentState.inventory.items[itemIndex].count < amount) {
                    throw new Error(`${this.getItemName(normalizedResource)} 不足: 需要 ${amount}，当前 ${itemIndex === -1 ? 0 : currentState.inventory.items[itemIndex].count}`);
                }
                
                currentState.inventory.items[itemIndex].count -= amount;
                
                // 如果数量为0，移除物品
                if (currentState.inventory.items[itemIndex].count <= 0) {
                    currentState.inventory.items.splice(itemIndex, 1);
                }
                
            } else {
                throw new Error(`无效的操作: ${operation}`);
            }
        }
        
        // 应用更新
        State.importState(currentState);
        
        return {
            resource: normalizedResource,
            operation: operation,
            amount: amount,
            newValue: newValue || 'N/A',
            message: `${operation === 'add' ? '获得' : '消耗'} ${amount} ${this.getItemName(normalizedResource) || '单位'}`
        };
    }

    // 工具3: 技能检定
    async rollCheck(params) {
        const { skill, difficulty = 50, modifier = 0 } = params;
        
        // 验证技能
        const validSkills = ['piloting', 'engineering', 'diplomacy', 'combat', 'stealth', 'perception'];
        if (!validSkills.includes(skill)) {
            throw new Error(`无效的技能: ${skill}`);
        }
        
        // 基础成功率（根据技能类型）
        let baseSuccess = 50;
        if (skill === 'piloting') baseSuccess = 60;
        else if (skill === 'engineering') baseSuccess = 55;
        else if (skill === 'diplomacy') baseSuccess = 45;
        else if (skill === 'combat') baseSuccess = 65;
        else if (skill === 'stealth') baseSuccess = 40;
        else if (skill === 'perception') baseSuccess = 70;
        
        // 应用难度和修正
        let successChance = baseSuccess - difficulty + modifier;
        
        // 随机因素
        successChance += (Math.random() * 30 - 15); // -15到+15的随机
        
        // 确保在合理范围内
        successChance = Math.max(5, Math.min(95, successChance));
        
        // 检定结果
        const roll = Math.random() * 100;
        const success = roll <= successChance;
        
        // 计算成功程度
        let degree = '失败';
        if (success) {
            const margin = successChance - roll;
            if (margin > 30) degree = '大成功';
            else if (margin > 15) degree = '成功';
            else degree = '勉强成功';
        } else {
            const margin = roll - successChance;
            if (margin > 30) degree = '大失败';
            else if (margin > 15) degree = '失败';
            else degree = '接近成功';
        }
        
        return {
            skill: skill,
            difficulty: difficulty,
            modifier: modifier,
            successChance: Math.round(successChance),
            roll: Math.round(roll),
            success: success,
            degree: degree,
            message: `${skill} 检定: ${degree} (${Math.round(roll)}/${Math.round(successChance)})`
        };
    }

    // 工具4: 航行
    async navigate(params) {
        const { destination, distance } = params;
        
        if (!destination || typeof distance !== 'number' || distance <= 0) {
            throw new Error('需要有效的目的地和距离');
        }
        
        // 计算燃料消耗（每光年消耗1%燃料）
        const fuelCost = Math.round(distance);
        
        // 检查燃料是否足够
        const currentFuel = State.state.ship.fuel;
        if (currentFuel < fuelCost) {
            throw new Error(`燃料不足: 需要 ${fuelCost}%，当前 ${currentFuel}%`);
        }
        
        // 随机遭遇判定（20%几率）
        const hasEncounter = Math.random() < 0.2;
        let encounter = null;
        
        if (hasEncounter) {
            const encounters = [
                { type: 'pirate', name: '太空海盗', threat: 'medium' },
                { type: 'merchant', name: '贸易商队', threat: 'low' },
                { type: 'alien', name: '未知外星生物', threat: 'high' },
                { type: 'derelict', name: '废弃飞船', threat: 'none' }
            ];
            
            encounter = encounters[Math.floor(Math.random() * encounters.length)];
        }
        
        // 消耗燃料
        await this.callTool('update_resources', {
            resource: 'fuel',
            amount: fuelCost,
            operation: 'subtract'
        });
        
        // 推进时间（每光年1小时）
        const timeCost = distance;
        await this.callTool('time_advance', { hours: timeCost });
        
        // 更新位置
        State.update({
            captain: {
                location: destination,
                location_tags: ['太空', '航行中']
            },
            stats: {
                distance_traveled: State.state.stats.distance_traveled + distance
            }
        });
        
        return {
            destination: destination,
            distance: distance,
            fuelCost: fuelCost,
            timeCost: timeCost,
            hasEncounter: hasEncounter,
            encounter: encounter,
            message: `成功航行到 ${destination}，距离 ${distance} 光年，消耗 ${fuelCost}% 燃料`
        };
    }

    // 工具5: 交易
    async trade(params) {
        const { item, quantity = 1, price, type = 'buy' } = params;
        
        if (!item || !price || quantity <= 0) {
            throw new Error('需要有效的物品、价格和数量');
        }
        
        const totalCost = price * quantity;
        
        if (type === 'buy') {
            // 购买：检查信用点
            if (State.state.captain.credits < totalCost) {
                throw new Error(`信用点不足: 需要 ${totalCost}€，当前 ${State.state.captain.credits}€`);
            }
            
            // 扣除信用点
            await this.callTool('update_resources', {
                resource: 'credits',
                amount: totalCost,
                operation: 'subtract'
            });
            
            // 添加物品
            await this.callTool('update_resources', {
                resource: item,
                amount: quantity,
                operation: 'add'
            });
            
        } else if (type === 'sell') {
            // 出售：检查物品数量
            const itemIndex = State.state.inventory.items.findIndex(i => i.id === item);
            if (itemIndex === -1 || State.state.inventory.items[itemIndex].count < quantity) {
                throw new Error(`${this.getItemName(item)} 不足: 需要 ${quantity}，当前 ${itemIndex === -1 ? 0 : State.state.inventory.items[itemIndex].count}`);
            }
            
            // 移除物品
            await this.callTool('update_resources', {
                resource: item,
                amount: quantity,
                operation: 'subtract'
            });
            
            // 增加信用点
            await this.callTool('update_resources', {
                resource: 'credits',
                amount: totalCost,
                operation: 'add'
            });
            
        } else {
            throw new Error(`无效的交易类型: ${type}`);
        }
        
        return {
            item: item,
            itemName: this.getItemName(item),
            quantity: quantity,
            price: price,
            totalCost: totalCost,
            type: type,
            message: `${type === 'buy' ? '购买' : '出售'} ${quantity} ${this.getItemName(item)}，${type === 'buy' ? '花费' : '获得'} ${totalCost}€`
        };
    }

    // 工具6: 时间推进
    async timeAdvance(params) {
        const { hours = 1 } = params;
        
        if (hours <= 0) {
            throw new Error('时间推进必须为正数');
        }
        
        // 推进游戏时间
        const newTime = State.advanceTime(hours);
        
        // 随时间恢复（每小时恢复1%）
        const recovery = Math.min(hours, 24); // 最多恢复24%
        
        const updates = {};
        
        // 舰长精力恢复
        if (State.state.captain.energy < 100) {
            updates.captain = {
                energy: Math.min(100, State.state.captain.energy + recovery)
            };
        }
        
        // 飞船护盾恢复
        if (State.state.ship.shield < 100) {
            updates.ship = {
                shield: Math.min(100, State.state.ship.shield + Math.floor(recovery / 2))
            };
        }
        
        if (Object.keys(updates).length > 0) {
            State.update(updates);
        }
        
        return {
            hours: hours,
            newTime: newTime,
            recovery: recovery,
            message: `时间推进 ${hours} 小时，当前时间: ${newTime}`
        };
    }

    // 工具7: 幕文件检索
    async searchActs(params) {
        const { keyword, act_number, limit = 5 } = params;
        
        if (!keyword && !act_number) {
            throw new Error('需要关键词或幕编号');
        }
        
        const results = [];
        
        // 检查 ActManagerInstance 是否可用
        if (typeof ActManagerInstance === 'undefined') {
            console.warn('ActManagerInstance 不可用，无法检索幕数据');
            return {
                keyword, act_number, limit,
                results: [],
                count: 0,
                message: '幕管理器未初始化，无法检索'
            };
        }
        
        // 按关键词检索（调用 ActManager 真实数据）
        if (keyword) {
            const searchResults = ActManagerInstance.searchByKeyword(keyword);
            
            for (const sr of searchResults) {
                for (const event of sr.matchingEvents) {
                    results.push({
                        act: sr.act,
                        actTitle: sr.title,
                        event: event.id,
                        title: event.title,
                        match: event.description,
                        time: event.time,
                        location: event.location,
                        type: event.type
                    });
                }
            }
        }
        
        // 按幕编号检索
        if (act_number) {
            const act = ActManagerInstance.getAct(act_number);
            if (act && act.events) {
                for (const event of act.events) {
                    // 如果同时有关键词，只保留匹配的事件
                    if (keyword) {
                        const text = `${event.title} ${event.description} ${JSON.stringify(event.details)}`.toLowerCase();
                        if (!text.includes(keyword.toLowerCase())) continue;
                    }
                    // 避免重复添加
                    if (!results.find(r => r.event === event.id && r.act === act_number)) {
                        results.push({
                            act: act_number,
                            actTitle: act.title,
                            event: event.id,
                            title: event.title,
                            match: event.description,
                            time: event.time,
                            location: event.location,
                            type: event.type
                        });
                    }
                }
            }
        }
        
        // 限制返回数量
        const limited = results.slice(0, limit);
        
        return {
            keyword: keyword,
            act_number: act_number,
            limit: limit,
            results: limited,
            count: limited.length,
            total_matches: results.length,
            message: results.length > 0 
                ? `找到 ${results.length} 条相关记录${results.length > limit ? `，显示前 ${limit} 条` : ''}`
                : '未找到匹配的记录'
        };
    }

    // 工具8: 检查休息条件
    async checkRestConditions(params) {
        const checkResult = State.checkRestConditions();
        
        return {
            conditions: checkResult.conditions,
            metConditions: checkResult.metConditions,
            totalConditions: checkResult.totalConditions,
            allMet: checkResult.allMet,
            canSimpleRest: checkResult.canSimpleRest,
            canEmergencyRest: checkResult.canEmergencyRest,
            message: checkResult.allMet 
                ? '满足所有休息条件，可以完整休息'
                : `满足 ${checkResult.metConditions}/${checkResult.totalConditions} 个条件`
        };
    }

    // 辅助方法：获取物品名称
    getItemName(itemId) {
        const itemNames = {
            'energy_cell': '能量块',
            'medkit': '医疗包',
            'spare_parts': '备用零件',
            'data_chip': '数据芯片',
            'fuel': '燃料'
        };
        return itemNames[itemId] || itemId;
    }

    // 辅助方法：获取物品类型
    getItemType(itemId) {
        const itemTypes = {
            'energy_cell': 'consumable',
            'medkit': 'consumable',
            'spare_parts': 'resource',
            'data_chip': 'quest',
            'fuel': 'resource'
        };
        return itemTypes[itemId] || 'misc';
    }
}

// 创建全局工具系统实例
const Tools = new ToolSystem();