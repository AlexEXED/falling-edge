/**
 * 幕文件管理模块
 * 对应原方案中的 act_manager.py
 * 管理幕文件（acts/）和快照
 */

class ActManager {
    constructor() {
        this.currentAct = 1;
        this.events = [];
        this.initializeStorage();
    }

    // 初始化存储
    initializeStorage() {
        // 检查是否已有幕数据
        if (!localStorage.getItem('space_rpg_acts')) {
            this.createInitialAct();
        } else {
            this.loadCurrentAct();
        }
    }

    // 创建初始幕（动态读取配置，不再硬编码具体剧情）
    createInitialAct() {
        // 从 DEFAULT_STATE 读取起始时间
        const startTime = (typeof DEFAULT_STATE !== 'undefined' && DEFAULT_STATE.act)
            ? DEFAULT_STATE.act.start_time
            : (typeof DEFAULT_STATE !== 'undefined' && DEFAULT_STATE.time)
                ? `${DEFAULT_STATE.time.year}.${String(DEFAULT_STATE.time.month).padStart(2,'0')}.${String(DEFAULT_STATE.time.day).padStart(2,'0')}`
                : '未知';

        // 从 DEFAULT_LORE 读取飞船名和起始位置
        const shipName = (typeof DEFAULT_LORE !== 'undefined' && DEFAULT_LORE.playerShip)
            ? DEFAULT_LORE.playerShip.name
            : '飞船';
        const startLocation = (typeof DEFAULT_STATE !== 'undefined' && DEFAULT_STATE.captain)
            ? DEFAULT_STATE.captain.location
            : '未知位置';

        // 从 DEFAULT_STATE 读取船员信息生成 key_people
        const crewList = (typeof DEFAULT_STATE !== 'undefined' && Array.isArray(DEFAULT_STATE.crew))
            ? DEFAULT_STATE.crew.map(c => `${c.name}(${c.role})`)
            : [];

        const initialAct = {
            act: 1,
            title: "序章",
            start_time: startTime,
            events: [],       // 空幕：让游戏自然开始，事件由玩家行为产生
            keywords: [shipName],
            summary: {
                days_passed: 0,
                end_location: startLocation,
                captain_status: "正常",
                tasks_completed: 0,
                items_acquired: [],
                key_people: crewList
            },
            next_preview: null
        };

        this.saveAct(initialAct);
        this.events = initialAct.events;
    }

    // 保存幕
    saveAct(actData) {
        try {
            const acts = this.getAllActs();
            acts[actData.act] = actData;
            localStorage.setItem('space_rpg_acts', JSON.stringify(acts));
            return true;
        } catch (error) {
            console.error('保存幕失败:', error);
            return false;
        }
    }

    // 获取所有幕
    getAllActs() {
        try {
            const acts = localStorage.getItem('space_rpg_acts');
            return acts ? JSON.parse(acts) : {};
        } catch (error) {
            console.error('获取幕数据失败:', error);
            return {};
        }
    }

    // 加载当前幕
    loadCurrentAct() {
        const acts = this.getAllActs();
        const currentActNumber = State.state.act.current;
        
        if (acts[currentActNumber]) {
            this.currentAct = currentActNumber;
            this.events = acts[currentActNumber].events || [];
            return acts[currentActNumber];
        }
        
        // 如果没有当前幕，创建新的
        return this.createNewAct();
    }

    // 创建新幕
    createNewAct() {
        const previousAct = this.getAct(this.currentAct);
        const newActNumber = this.currentAct + 1;
        
        const newAct = {
            act: newActNumber,
            title: `第${newActNumber}幕`,
            start_time: State.getGameTimeString(),
            events: [],
            keywords: [],
            summary: null,
            next_preview: null
        };

        // 如果有上一幕，复制一些信息
        if (previousAct && previousAct.next_preview) {
            newAct.title = previousAct.next_preview.target || `第${newActNumber}幕`;
        }

        this.saveAct(newAct);
        State.update({ act: { current: newActNumber, events: [], start_time: newAct.start_time } });
        
        this.currentAct = newActNumber;
        this.events = [];
        
        return newAct;
    }

    // 获取特定幕
    getAct(actNumber) {
        const acts = this.getAllActs();
        return acts[actNumber] || null;
    }

    // 添加事件到当前幕
    addEvent(eventData) {
        const act = this.getAct(this.currentAct);
        if (!act) return false;

        // 生成事件ID
        const eventId = `E${(act.events.length + 1).toString().padStart(3, '0')}`;
        
        const event = {
            id: eventId,
            time: State.getGameTimeString(),
            title: eventData.title || "未命名事件",
            description: eventData.description || "",
            location: eventData.location || State.state.captain.location,
            type: eventData.type || "general",
            details: eventData.details || {}
        };

        // 添加到事件列表
        act.events.push(event);
        
        // 更新关键词
        if (eventData.keywords) {
            act.keywords = [...new Set([...act.keywords, ...eventData.keywords])];
        }

        // 保存更新
        this.saveAct(act);
        this.events = act.events;
        
        // 更新游戏状态中的事件计数
        State.incrementEventCount();
        
        return event;
    }

    // 生成幕总结
    generateActSummary() {
        const act = this.getAct(this.currentAct);
        if (!act || act.events.length === 0) return null;

        // 计算统计信息
        const eventTypes = {};
        let locations = new Set();
        let totalCost = 0;
        let totalGain = 0;

        act.events.forEach(event => {
            eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
            locations.add(event.location);
            
            // 计算经济影响
            if (event.details.cost) totalCost += event.details.cost;
            if (event.details.gain) totalGain += event.details.gain;
        });

        // 计算经过的天数（简化）
        const startDate = new Date(act.start_time.replace(/\./g, '-'));
        const currentDate = new Date(State.getGameTimeString().replace(/\./g, '-'));
        const daysPassed = Math.max(1, Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)));

        const summary = {
            days_passed: daysPassed,
            end_location: State.state.captain.location,
            captain_status: State.state.captain.health >= 70 ? "正常" : "需要休息",
            events_count: act.events.length,
            event_types: eventTypes,
            locations: Array.from(locations),
            tasks_completed: act.events.filter(e => e.type === 'mission').length,
            economic_impact: {
                total_cost: totalCost,
                total_gain: totalGain,
                net_change: totalGain - totalCost
            },
            key_achievements: act.events
                .filter(e => e.type === 'achievement' || e.type === 'milestone')
                .map(e => e.title)
        };

        act.summary = summary;
        this.saveAct(act);
        
        return summary;
    }

    // 创建状态快照
    createSnapshot() {
        const snapshot = {
            act: this.currentAct,
            timestamp: new Date().toISOString(),
            game_time: State.getGameTimeString(),
            state: State.exportState(),
            events_count: this.events.length,
            summary: this.generateActSummary()
        };

        // 保存快照到LocalStorage
        try {
            const snapshots = this.getSnapshots();
            snapshots.push(snapshot);
            localStorage.setItem('space_rpg_snapshots', JSON.stringify(snapshots));
            return snapshot;
        } catch (error) {
            console.error('创建快照失败:', error);
            return null;
        }
    }

    // 获取所有快照
    getSnapshots() {
        try {
            const snapshots = localStorage.getItem('space_rpg_snapshots');
            return snapshots ? JSON.parse(snapshots) : [];
        } catch (error) {
            console.error('获取快照失败:', error);
            return [];
        }
    }

    // 获取特定快照
    getSnapshot(actNumber) {
        const snapshots = this.getSnapshots();
        return snapshots.find(snap => snap.act === actNumber) || null;
    }

    // 从快照恢复
    restoreFromSnapshot(actNumber) {
        const snapshot = this.getSnapshot(actNumber);
        if (!snapshot) return false;

        try {
            // 恢复游戏状态
            State.importState(snapshot.state);
            
            // 恢复幕数据
            const acts = this.getAllActs();
            if (acts[actNumber]) {
                this.currentAct = actNumber;
                this.events = acts[actNumber].events || [];
            }
            
            return true;
        } catch (error) {
            console.error('从快照恢复失败:', error);
            return false;
        }
    }

    // 关键词检索
    searchByKeyword(keyword) {
        const acts = this.getAllActs();
        const results = [];
        const kw = keyword.toLowerCase();

        Object.values(acts).forEach(act => {
            // 搜索所有幕的事件全文（不再要求幕级 keywords 匹配）
            const matchingEvents = (act.events || []).filter(event => {
                const eventText = `${event.title || ''} ${event.description || ''} ${JSON.stringify(event.details || {})}`.toLowerCase();
                return eventText.includes(kw);
            });

            // 也检查幕标题
            const titleMatch = (act.title || '').toLowerCase().includes(kw);

            if (matchingEvents.length > 0 || titleMatch) {
                results.push({
                    act: act.act,
                    title: act.title,
                    matchingEvents: matchingEvents.slice(0, 5),
                    totalMatches: matchingEvents.length
                });
            }
        });

        return results;
    }

    // 获取最近事件
    getRecentEvents(limit = 5) {
        const allEvents = [];
        const acts = this.getAllActs();

        Object.values(acts).forEach(act => {
            act.events.forEach(event => {
                allEvents.push({
                    ...event,
                    act: act.act,
                    actTitle: act.title
                });
            });
        });

        // 按时间排序（简化：按事件ID排序）
        return allEvents
            .sort((a, b) => b.id.localeCompare(a.id))
            .slice(0, limit);
    }

    // 执行幕间休息
    performActTransition() {
        // 生成当前幕总结
        const summary = this.generateActSummary();
        
        // 创建快照
        const snapshot = this.createSnapshot();
        
        // 创建新幕
        const newAct = this.createNewAct();
        
        // 清空当前事件列表（新幕开始）
        this.events = [];
        
        return {
            previousAct: this.currentAct - 1,
            newAct: this.currentAct,
            summary: summary,
            snapshotCreated: !!snapshot,
            message: `第${this.currentAct - 1}幕结束，开始第${this.currentAct}幕`
        };
    }

    // 导出幕数据（用于备份）
    exportActs() {
        return {
            acts: this.getAllActs(),
            snapshots: this.getSnapshots(),
            currentAct: this.currentAct,
            exportTime: new Date().toISOString()
        };
    }

    // 导入幕数据（从备份恢复）
    importActs(data) {
        try {
            if (data.acts) {
                localStorage.setItem('space_rpg_acts', JSON.stringify(data.acts));
            }
            if (data.snapshots) {
                localStorage.setItem('space_rpg_snapshots', JSON.stringify(data.snapshots));
            }
            if (data.currentAct) {
                this.currentAct = data.currentAct;
                State.update({ act: { current: data.currentAct } });
            }
            
            this.loadCurrentAct();
            return true;
        } catch (error) {
            console.error('导入幕数据失败:', error);
            return false;
        }
    }
}

// 创建全局幕管理器实例
const ActManagerInstance = new ActManager();