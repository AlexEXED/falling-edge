/**
 * JSON持久化记忆存储管理器
 * 使用localStorage存储结构化JSON数据
 * 容量限制：4MB，自动压缩和清理
 */

class JSONStorageManager {
    constructor() {
        this.STORAGE_KEY = 'space_rpg_memories_v1';
        this.BACKUP_KEY = 'space_rpg_memories_backup';
        this.MAX_SIZE = 4 * 1024 * 1024; // 4MB限制
        this.COMPRESSION_THRESHOLD = 3.5 * 1024 * 1024; // 3.5MB开始压缩
        this.MAX_CONVERSATIONS_PER_SESSION = 100;
        this.MAX_SESSIONS = 5;
        this.MAX_EVENTS = 1000;
        
        // 初始化默认记忆库
        this.defaultMemories = this.getDefaultMemories();
    }
    
    // 获取默认记忆库结构
    getDefaultMemories() {
        return {
            version: '1.0',
            schemaVersion: 1,
            lastUpdated: new Date().toISOString(),
            playerId: this.generatePlayerId(),
            
            // 对话历史（按会话分组）
            conversations: {},
            
            // 关键事件（扁平化，便于查询）
            events: [],
            
            // 事实数据库（从世界观和游戏状态动态派生）
            facts: this.buildFactsFromWorldState(),
            
            // 玩家状态快照（定期保存）
            snapshots: [],
            
            // 记忆索引（加速查询）
            indexes: {
                by_location: {},
                by_type: {},
                by_keyword: {},
                by_timestamp: {}
            },
            
            // 统计信息
            stats: {
                totalEvents: 0,
                totalConversations: 0,
                lastSessionId: null,
                firstPlayDate: new Date().toISOString()
            }
        };
    }
    
    // 从世界观和游戏状态动态构建事实数据库
    buildFactsFromWorldState() {
        const facts = { ship: {}, resources: {}, locations: {}, npcs: {}, ships: {} };
        try {
            // 从世界观模块读取飞船信息
            if (typeof window !== 'undefined' && window.Lore && window.Lore.data) {
                const lore = window.Lore.data;
                const ps = lore.playerShip || {};
                facts.ship = {
                    name: ps.name || '未知飞船',
                    type: ps.class || '未知',
                    armament: ps.weapons || '',
                    defense: ps.defense || ''
                };
                // 已知地点
                facts.locations.known = (lore.starMap || []).map(l => l.name);
                // NPC
                (lore.npcs || []).forEach(npc => {
                    const race = (lore.races || []).find(r => r.id === npc.race);
                    facts.npcs[npc.id] = {
                        name: npc.name,
                        species: race ? race.name : npc.race,
                        description: npc.description || ''
                    };
                });
                // 已知船只
                (lore.knownShips || []).forEach(s => {
                    facts.ships[s.id] = {
                        name: s.name,
                        type: s.class || '未知',
                        description: s.description || `归属: ${s.owner || '未知'}`
                    };
                });
            } else if (typeof DEFAULT_LORE !== 'undefined') {
                // 世界观实例未初始化但配置可用
                const ps = DEFAULT_LORE.playerShip || {};
                facts.ship = { name: ps.name || '未知飞船', type: ps.class || '未知', armament: ps.weapons || '', defense: ps.defense || '' };
                facts.locations.known = (DEFAULT_LORE.starMap || []).map(l => l.name);
            }

            // 从游戏状态读取资源和位置
            if (typeof window !== 'undefined' && window.State && window.State.state) {
                const state = window.State.state;
                facts.locations.current = state.captain.location || '未知';
                // 资源清单
                (state.inventory.items || []).forEach(item => {
                    facts.resources[item.id] = item.count;
                });
            } else if (typeof DEFAULT_STATE !== 'undefined') {
                facts.locations.current = DEFAULT_STATE.captain.location || '未知';
                (DEFAULT_STATE.inventory.items || []).forEach(item => {
                    facts.resources[item.id] = item.count;
                });
            }
        } catch (e) {
            console.warn('构建事实数据库时出错，使用空值:', e);
        }
        return facts;
    }

    // 生成玩家ID（基于时间戳和随机数）
    generatePlayerId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return `player_${timestamp}_${random}`;
    }
    
    // 获取当前会话ID（基于日期）
    getCurrentSessionId() {
        const now = new Date();
        return `session_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}`;
    }
    
    // 生成事件ID
    generateEventId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `event_${timestamp}_${random}`;
    }
    
    // 保存完整记忆库
    async saveMemories(memories) {
        try {
            // 更新最后修改时间
            memories.lastUpdated = new Date().toISOString();
            
            // 序列化为JSON
            const jsonStr = JSON.stringify(memories);
            const size = jsonStr.length;
            
            console.log(`记忆库大小: ${(size / 1024).toFixed(2)}KB`);
            
            // 大小检查，超过阈值则压缩
            if (size > this.COMPRESSION_THRESHOLD) {
                console.log('记忆库超过压缩阈值，开始压缩...');
                memories = await this.compressMemories(memories);
                const compressedJson = JSON.stringify(memories);
                const compressedSize = compressedJson.length;
                console.log(`压缩后大小: ${(compressedSize / 1024).toFixed(2)}KB`);
                
                if (compressedSize > this.MAX_SIZE) {
                    console.warn('压缩后仍超过最大限制，进行紧急清理');
                    memories = await this.emergencyCleanup(memories);
                }
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memories));
            } else {
                localStorage.setItem(this.STORAGE_KEY, jsonStr);
            }
            
            // 保存备份（每10次保存备份一次）
            const backupCount = parseInt(localStorage.getItem('backup_count') || '0');
            if (backupCount % 10 === 0) {
                await this.saveBackup(memories);
            }
            localStorage.setItem('backup_count', (backupCount + 1).toString());
            
            return true;
        } catch (error) {
            console.error('保存记忆失败:', error);
            return false;
        }
    }
    
    // 加载记忆库
    async loadMemories() {
        try {
            const jsonStr = localStorage.getItem(this.STORAGE_KEY);
            if (!jsonStr) {
                console.log('未找到记忆库，创建默认记忆库');
                const defaultMemories = this.getDefaultMemories();
                await this.saveMemories(defaultMemories);
                return defaultMemories;
            }
            
            let memories = JSON.parse(jsonStr);
            
            // 版本迁移
            if (memories.version !== '1.0' || memories.schemaVersion !== 1) {
                console.log('检测到旧版本记忆库，进行迁移...');
                memories = await this.migrateVersion(memories);
            }
            
            // 验证数据结构
            memories = this.validateStructure(memories);
            
            return memories;
        } catch (error) {
            console.error('加载记忆失败:', error);
            return this.getDefaultMemories();
        }
    }
    
    // 验证和修复数据结构
    validateStructure(memories) {
        const defaultMemories = this.getDefaultMemories();
        
        // 确保所有必需字段存在
        const requiredFields = ['version', 'conversations', 'events', 'facts', 'indexes'];
        for (const field of requiredFields) {
            if (!memories[field]) {
                memories[field] = defaultMemories[field];
            }
        }
        
        // 确保数组类型
        if (!Array.isArray(memories.events)) memories.events = [];
        if (!Array.isArray(memories.snapshots)) memories.snapshots = [];
        
        // 确保对象类型
        if (typeof memories.conversations !== 'object') memories.conversations = {};
        if (typeof memories.facts !== 'object') memories.facts = defaultMemories.facts;
        if (typeof memories.indexes !== 'object') memories.indexes = defaultMemories.indexes;
        
        return memories;
    }
    
    // 版本迁移
    async migrateVersion(oldMemories) {
        // 这里可以添加版本迁移逻辑
        // 例如：v0.5 -> v1.0 的数据结构转换
        
        const newMemories = this.getDefaultMemories();
        
        // 迁移事件
        if (oldMemories.events && Array.isArray(oldMemories.events)) {
            newMemories.events = oldMemories.events.map(event => ({
                id: event.id || this.generateEventId(),
                type: event.type || 'unknown',
                timestamp: event.timestamp || new Date().toISOString(),
                content: event.content || '',
                location: event.location || '未知',
                weight: event.weight || 0.5,
                accessCount: event.accessCount || 1
            }));
        }
        
        // 迁移对话
        if (oldMemories.conversations && typeof oldMemories.conversations === 'object') {
            newMemories.conversations = oldMemories.conversations;
        }
        
        // 保存迁移后的数据
        await this.saveMemories(newMemories);
        
        return newMemories;
    }
    
    // 添加对话记录
    async addConversation(playerInput, aiResponse, location, keywords = []) {
        const memories = await this.loadMemories();
        const sessionId = this.getCurrentSessionId();
        
        // 初始化会话数组
        if (!memories.conversations[sessionId]) {
            memories.conversations[sessionId] = [];
        }
        
        // 检查会话长度限制
        if (memories.conversations[sessionId].length >= this.MAX_CONVERSATIONS_PER_SESSION) {
            // 移除最早的对话
            memories.conversations[sessionId].shift();
        }
        
        // 添加新对话
        memories.conversations[sessionId].push({
            id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date().toISOString(),
            player: playerInput.substring(0, 500), // 限制长度
            ai: aiResponse.substring(0, 1000),     // 限制长度
            location: location || '未知',
            keywords: keywords,
            type: 'dialogue'
        });
        
        memories.stats.totalConversations++;
        memories.stats.lastSessionId = sessionId;
        
        // 更新索引
        await this.updateIndexes(memories);
        
        // 保存
        return await this.saveMemories(memories);
    }
    
    // 添加关键事件
    async addEvent(type, content, location, metadata = {}, weight = 0.7) {
        const memories = await this.loadMemories();
        
        // 检查事件数量限制
        if (memories.events.length >= this.MAX_EVENTS) {
            // 移除权重最低的旧事件
            memories.events.sort((a, b) => {
                // 按权重和时间排序
                const scoreA = a.weight * (a.accessCount || 1);
                const scoreB = b.weight * (b.accessCount || 1);
                return scoreA - scoreB;
            });
            
            // 移除前10%的低权重事件
            const removeCount = Math.floor(this.MAX_EVENTS * 0.1);
            memories.events.splice(0, removeCount);
        }
        
        // 添加新事件
        const event = {
            id: this.generateEventId(),
            type: type,
            timestamp: new Date().toISOString(),
            content: content.substring(0, 1000), // 限制长度
            location: location || '未知',
            metadata: metadata,
            weight: Math.min(Math.max(weight, 0.1), 1.0), // 限制在0.1-1.0之间
            accessCount: 1
        };
        
        memories.events.push(event);
        memories.stats.totalEvents++;
        
        // 更新索引
        await this.updateIndexes(memories);
        
        // 保存
        return await this.saveMemories(memories);
    }
    
    // 更新事件权重和访问计数
    async updateEventWeight(eventId, deltaWeight = 0, incrementAccess = true) {
        const memories = await this.loadMemories();
        const eventIndex = memories.events.findIndex(e => e.id === eventId);
        
        if (eventIndex >= 0) {
            const event = memories.events[eventIndex];
            
            // 更新权重
            event.weight = Math.min(Math.max(event.weight + deltaWeight, 0.1), 1.0);
            
            // 更新访问计数
            if (incrementAccess) {
                event.accessCount = (event.accessCount || 1) + 1;
            }
            
            event.lastAccessed = new Date().toISOString();
            
            // 保存
            return await this.saveMemories(memories);
        }
        
        return false;
    }
    
    // 更新索引
    async updateIndexes(memories) {
        // 按位置索引
        memories.indexes.by_location = {};
        memories.events.forEach(event => {
            if (!memories.indexes.by_location[event.location]) {
                memories.indexes.by_location[event.location] = [];
            }
            memories.indexes.by_location[event.location].push(event.id);
        });
        
        // 按类型索引
        memories.indexes.by_type = {};
        memories.events.forEach(event => {
            if (!memories.indexes.by_type[event.type]) {
                memories.indexes.by_type[event.type] = [];
            }
            memories.indexes.by_type[event.type].push(event.id);
        });
        
        // 按时间索引（最近优先）
        memories.indexes.by_timestamp = memories.events
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(e => e.id);
        
        return memories;
    }
    
    // 查询记忆
    async queryMemories(options = {}) {
        const memories = await this.loadMemories();
        const {
            keyword,
            location,
            type,
            timespan,
            limit = 10,
            minWeight = 0.3
        } = options;
        
        let results = [...memories.events];
        
        // 按权重过滤
        results = results.filter(event => event.weight >= minWeight);
        
        // 关键词搜索
        if (keyword) {
            const keywordLower = keyword.toLowerCase();
            results = results.filter(event => 
                event.content.toLowerCase().includes(keywordLower) ||
                (event.metadata && JSON.stringify(event.metadata).toLowerCase().includes(keywordLower)) ||
                (event.keywords && event.keywords.some(k => k.toLowerCase().includes(keywordLower)))
            );
        }
        
        // 位置过滤
        if (location) {
            results = results.filter(event => 
                event.location && event.location.includes(location)
            );
        }
        
        // 类型过滤
        if (type) {
            results = results.filter(event => event.type === type);
        }
        
        // 时间范围过滤
        if (timespan) {
            const now = new Date();
            let cutoffDate;
            
            switch (timespan) {
                case '1d':
                    cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    // 尝试解析为天数
                    const days = parseInt(timespan);
                    if (!isNaN(days)) {
                        cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                    }
            }
            
            if (cutoffDate) {
                results = results.filter(event => 
                    new Date(event.timestamp) >= cutoffDate
                );
            }
        }
        
        // 排序：按权重×访问计数×时间衰减
        results.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a);
            const scoreB = this.calculateRelevanceScore(b);
            return scoreB - scoreA; // 降序
        });
        
        // 限制数量
        return results.slice(0, limit);
    }
    
    // 计算相关性分数
    calculateRelevanceScore(event) {
        const now = new Date();
        const eventDate = new Date(event.timestamp);
        const hoursDiff = (now - eventDate) / (1000 * 60 * 60);
        
        // 时间衰减因子：24小时内为1.0，每过一天衰减0.1，最低0.3
        const timeDecay = Math.max(0.3, 1.0 - (hoursDiff / 24) * 0.1);
        
        // 权重因子
        const weightFactor = event.weight || 0.5;
        
        // 访问计数因子（对数增长）
        const accessFactor = Math.log10((event.accessCount || 1) + 1);
        
        return weightFactor * timeDecay * accessFactor;
    }
    
    // 压缩记忆库
    async compressMemories(memories) {
        console.log('开始压缩记忆库...');
        
        // 1. 清理旧会话（保留最近5个会话）
        const sessionKeys = Object.keys(memories.conversations).sort();
        if (sessionKeys.length > this.MAX_SESSIONS) {
            const toDelete = sessionKeys.slice(0, sessionKeys.length - this.MAX_SESSIONS);
            console.log(`删除 ${toDelete.length} 个旧会话`);
            toDelete.forEach(key => delete memories.conversations[key]);
        }
        
        // 2. 压缩每个会话中的对话
        Object.values(memories.conversations).forEach(session => {
            if (session.length > this.MAX_CONVERSATIONS_PER_SESSION) {
                // 保留最近的和权重高的对话
                session.sort((a, b) => {
                    const dateA = new Date(a.timestamp);
                    const dateB = new Date(b.timestamp);
                    return dateB - dateA; // 降序
                });
                
                // 截断
                session.splice(this.MAX_CONVERSATIONS_PER_SESSION);
            }
            
            // 压缩对话内容
            session.forEach(conv => {
                if (conv.ai && conv.ai.length > 500) {
                    conv.ai = conv.ai.substring(0, 500) + '...';
                }
                if (conv.player && conv.player.length > 200) {
                    conv.player = conv.player.substring(0, 200) + '...';
                }
            });
        });
        
        // 3. 清理低权重事件
        const originalEventCount = memories.events.length;
        memories.events = memories.events.filter(event => {
            // 保留权重高或最近的事件
            if (event.weight >= 0.5) return true;
            
            // 检查时间（30天内的保留）
            const eventDate = new Date(event.timestamp);
            const daysDiff = (new Date() - eventDate) / (1000 * 60 * 60 * 24);
            return daysDiff < 30;
        });
        
        console.log(`事件清理: ${originalEventCount} -> ${memories.events.length}`);
        
        // 4. 清理旧快照（只保留最近10个）
        if (memories.snapshots.length > 10) {
            memories.snapshots.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            memories.snapshots.splice(10);
        }
        
        // 5. 重新构建索引
        await this.updateIndexes(memories);
        
        console.log('记忆库压缩完成');
        return memories;
    }
    
    // 紧急清理（当压缩后仍超限时）
    async emergencyCleanup(memories) {
        console.warn('执行紧急清理');
        
        // 1. 删除所有低权重事件（<0.3）
        memories.events = memories.events.filter(event => event.weight >= 0.3);
        
        // 2. 删除所有旧会话（只保留最近2个）
        const sessionKeys = Object.keys(memories.conversations).sort();
        if (sessionKeys.length > 2) {
            const toDelete = sessionKeys.slice(0, sessionKeys.length - 2);
            toDelete.forEach(key => delete memories.conversations[key]);
        }
        
        // 3. 清空快照
        memories.snapshots = [];
        
        // 4. 重新构建索引
        await this.updateIndexes(memories);
        
        return memories;
    }
    
    // 保存备份
    async saveBackup(memories) {
        try {
            const backup = {
                ...memories,
                backupTimestamp: new Date().toISOString(),
                backupId: `backup_${Date.now()}`
            };
            
            const backupStr = JSON.stringify(backup);
            if (backupStr.length < this.MAX_SIZE) {
                localStorage.setItem(this.BACKUP_KEY, backupStr);
                console.log('记忆库备份已保存');
                return true;
            }
        } catch (error) {
            console.error('备份保存失败:', error);
        }
        return false;
    }
    
    // 从备份恢复
    async restoreFromBackup() {
        try {
            const backupStr = localStorage.getItem(this.BACKUP_KEY);
            if (backupStr) {
                const backup = JSON.parse(backupStr);
                console.log(`从备份恢复: ${backup.backupTimestamp}`);
                return await this.saveMemories(backup);
            }
        } catch (error) {
            console.error('备份恢复失败:', error);
        }
        return false;
    }
    
    // 导出记忆库（用于调试或迁移）
    exportMemories() {
        const memories = localStorage.getItem(this.STORAGE_KEY);
        if (memories) {
            const blob = new Blob([memories], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `space_rpg_memories_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        }
        return false;
    }
    
    // 导入记忆库
    async importMemories(jsonStr) {
        try {
            const imported = JSON.parse(jsonStr);
            
            // 验证基本结构
            if (!imported.version || !imported.events || !Array.isArray(imported.events)) {
                throw new Error('无效的记忆库格式');
            }
            
            // 合并到现有记忆库
            const currentMemories = await this.loadMemories();
            
            // 合并事件（去重）
            const existingIds = new Set(currentMemories.events.map(e => e.id));
            imported.events.forEach(event => {
                if (!existingIds.has(event.id)) {
                    currentMemories.events.push(event);
                }
            });
            
            // 合并对话
            if (imported.conversations && typeof imported.conversations === 'object') {
                Object.assign(currentMemories.conversations, imported.conversations);
            }
            
            // 保存
            return await this.saveMemories(currentMemories);
        } catch (error) {
            console.error('导入记忆库失败:', error);
            return false;
        }
    }
    
    // 获取统计信息
    async getStats() {
        const memories = await this.loadMemories();
        return {
            totalEvents: memories.stats.totalEvents,
            totalConversations: memories.stats.totalConversations,
            sessionCount: Object.keys(memories.conversations).length,
            lastUpdated: memories.lastUpdated,
            firstPlayDate: memories.stats.firstPlayDate,
            memorySize: JSON.stringify(memories).length
        };
    }
    
    // 清空记忆库（调试用）
    async clearMemories() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.BACKUP_KEY);
            localStorage.removeItem('backup_count');
            console.log('记忆库已清空');
            return true;
        } catch (error) {
            console.error('清空记忆库失败:', error);
            return false;
        }
    }
}

// 创建全局实例
const MemoryStorage = new JSONStorageManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSONStorageManager, MemoryStorage };
} else {
    window.MemoryStorage = MemoryStorage;
}