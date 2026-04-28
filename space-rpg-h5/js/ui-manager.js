/**
 * UI管理器模块
 * 处理界面更新和用户交互
 */

class UIManager {
    constructor() {
        this.terminalOutput = document.getElementById('terminal-output');
        this.commandInput = document.getElementById('command-input');
        this.sendButton = document.getElementById('send-btn');

        // 终端输出限制
        this.maxTerminalLines = 100;  // 最多保留100行
        this.terminalLines = [];      // 跟踪所有行

        // 防止警告重复弹出的标记
        this._warnedFuel = false;
        this._warnedHealth = false;

        this.initializeUI();
        this.setupEventListeners();
        this.updateConnectionStatus();
    }

    // 更新深空网络连接状态
    updateConnectionStatus() {
        const el = document.querySelector('.connection-status');
        if (!el) return;

        const config = JSON.parse(localStorage.getItem('spaceRPG_APIConfig') || '{}');
        const hasKey = !!(config.apiKey && config.apiKey.trim());
        const enabled = config.enabled !== false;

        if (hasKey && enabled) {
            el.className = 'connection-status';
            el.innerHTML = '<i class="fas fa-signal"></i> 深空网络';
        } else {
            el.className = 'connection-status no-signal';
            el.innerHTML = '<i class="fas fa-ban"></i> 无信号';
        }
    }

    // 初始化UI
    initializeUI() {
        // 清空终端输出
        this.clearTerminal();
        
        // 更新状态显示
        this.updateStatusDisplay();

        // 绑定设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // 如果 SettingsManager 存在则用它，否则用原生
                if (window.SettingsManager && typeof window.SettingsManager.openSettings === 'function') {
                    window.SettingsManager.openSettings();
                } else if (typeof openSettings === 'function') {
                    openSettings();
                }
            });
        }
        
        // 聚焦到输入框
        this.commandInput.focus();
        
        // 显示欢迎消息（动态位置）
        const state = State.state;
        const location = state.captain.location || '未知位置';
        const t = state.time;
        const timeStr = `${t.year}.${t.month.toString().padStart(2, '0')}.${t.day.toString().padStart(2, '0')}`;
        this.addTerminalOutput(`🖥️ 终端 · ${timeStr} · ${location}`, 'system-header');
        this.addTerminalOutput('', 'empty');
        
        // 动态显示状态（从游戏状态获取实时数据）
        this.updateTerminalStatusDisplay();
        
        // 动态显示当前活跃任务（如有）
        const activeMission = (State.state.missions.active && State.state.missions.active.length > 0)
            ? State.state.missions.active[0].name
            : null;
        if (activeMission) {
            this.addTerminalOutput(`追踪: ${activeMission}`, 'mission');
        }
        this.addTerminalOutput('', 'empty');
        this.addTerminalOutput('→', 'prompt-large');
    }

    // 设置事件监听器
    setupEventListeners() {
        // 发送按钮点击
        this.sendButton.addEventListener('click', () => this.sendCommand());
        
        // 输入框回车键
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendCommand();
            }
        });
        
        // 输入框键盘导航
        this.commandInput.addEventListener('keydown', (e) => {
            // 上箭头：历史命令
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateCommandHistory(-1);
            }
            // 下箭头：历史命令
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateCommandHistory(1);
            }
        });
        
        // 输入框获得焦点时滚动到底部
        this.commandInput.addEventListener('focus', () => {
            this.scrollToBottom();
        });
    }

    // 发送命令
    async sendCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;
        
        // 清空输入框
        this.commandInput.value = '';
        
        // ✅ 修复：确保Game对象存在
        if (!window.Game) {
            this.addTerminalOutput('错误：游戏核心未初始化', 'error');
            this.commandInput.focus();
            return;
        }
        
        // 处理命令
        try {
            await window.Game.processCommand(command);
        } catch (error) {
            console.error('命令处理异常:', error);
            this.addTerminalOutput(`命令处理失败: ${error.message}`, 'error');
        }
        
        // 滚动到底部
        this.scrollToBottom();
        
        // 重新聚焦到输入框
        this.commandInput.focus();
    }

    // 导航命令历史
    navigateCommandHistory(direction) {
        // 这里需要实现命令历史导航
        // 简化：暂时不实现
        console.log(`命令历史导航: ${direction}`);
    }

    // 添加终端输出（带自动上滑限制）
    addTerminalOutput(text, type = 'info') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        
        let content = '';
        
        switch (type) {
            case 'system-header':
                content = `<span class="system-header">${text}</span>`;
                break;
                
            case 'status-bar':
                content = `<span class="status-bar-text">${text}</span>`;
                break;
                
            case 'mission':
                content = `<span class="mission-text"><i class="fas fa-satellite"></i> ${text}</span>`;
                break;
                
            case 'prompt-large':
                content = `<span class="prompt-large">${text}</span>`;
                break;
                
            case 'user':
                content = `<span class="prompt">></span> <span class="command">${text}</span>`;
                break;
                
            case 'ai':
                content = `<span class="ai-response">${text}</span>`;
                break;
                
            case 'system':
                content = `<span class="system-message"><i class="fas fa-info-circle"></i> ${text}</span>`;
                break;
                
            case 'tool':
                content = `<span class="tool-call"><i class="fas fa-cog"></i> ${text}</span>`;
                break;
                
            case 'event':
                content = `<span class="event-log"><i class="fas fa-calendar-alt"></i> ${text}</span>`;
                break;
                
            case 'success':
                content = `<span class="success-message"><i class="fas fa-check-circle"></i> ${text}</span>`;
                break;
                
            case 'warning':
                content = `<span class="warning-message"><i class="fas fa-exclamation-triangle"></i> ${text}</span>`;
                break;
                
            case 'error':
                content = `<span class="error-message"><i class="fas fa-times-circle"></i> ${text}</span>`;
                break;
                
            case 'empty':
                content = `<br>`;
                break;
                
            default:
                content = `<span class="info-message">${text}</span>`;
        }
        
        line.innerHTML = content;
        this.terminalOutput.appendChild(line);
        this.terminalLines.push(line);
        
        // 自动删除超过限制的旧行（自动上滑）
        if (this.terminalLines.length > this.maxTerminalLines) {
            const oldLine = this.terminalLines.shift();
            oldLine.remove();
        }
        
        // 自动滚动到底部
        this.scrollToBottom();
    }

    // 清空终端
    clearTerminal() {
        this.terminalOutput.innerHTML = '';
    }

    // 滚动到底部
    scrollToBottom() {
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    // 更新状态显示（动态更新所有属性）
    updateStatusDisplay() {
        try {
            // 获取状态数据
            const status = State.getStatusDescription();
            const progress = State.getProgressData();
            const state = State.state;
            
            // 更新ASCII进度标签（船体、护盾、燃料）
            const hullLabel = document.getElementById('hull-label');
            const shieldLabel = document.getElementById('shield-label');
            const fuelLabel = document.getElementById('fuel-label');
            
            if (hullLabel) {
                const hullBar = this.createProgressBar(progress.hull);
                hullLabel.textContent = `船体 ${hullBar} ${Math.round(progress.hull)}%`;
            }
            if (shieldLabel) {
                const shieldBar = this.createProgressBar(progress.shield);
                shieldLabel.textContent = `护盾 ${shieldBar} ${Math.round(progress.shield)}%`;
            }
            if (fuelLabel) {
                const fuelBar = this.createProgressBar(progress.fuel);
                fuelLabel.textContent = `燃料 ${fuelBar} ${Math.round(progress.fuel)}%`;
            }
            
            // 动态更新舰长状态
            const healthEl = document.getElementById('captain-health');
            if (healthEl) {
                const healthPercent = state.captain.health;
                let healthText = '正常';
                if (healthPercent < 30) healthText = '危险';
                else if (healthPercent < 60) healthText = '受伤';
                else if (healthPercent < 100) healthText = '受损';
                healthEl.textContent = `${healthText} (${healthPercent}%)`;
            }
            
            const energyEl = document.getElementById('captain-energy');
            if (energyEl) {
                const energyPercent = state.captain.energy;
                let energyText = '尚可';
                if (energyPercent < 30) energyText = '疲惫';
                else if (energyPercent < 60) energyText = '疲劳';
                else if (energyPercent < 100) energyText = '有点累';
                energyEl.textContent = `${energyText} (${energyPercent}%)`;
            }
            
            // 动态更新信用点
            const creditsEl = document.getElementById('credits');
            if (creditsEl) {
                creditsEl.textContent = `${state.captain.credits}€`;
            }

            // 动态更新飞船信息（右侧面板）
            const shipNameDisplayEl = document.getElementById('ship-name-display');
            if (shipNameDisplayEl) {
                shipNameDisplayEl.textContent = state.ship.name;
            }

            const shipArmamentEl = document.getElementById('ship-armament');
            if (shipArmamentEl) {
                // 优先使用游戏状态中的武器信息，如果没有则使用默认值
                const armament = state.ship.armament || '轻型';
                shipArmamentEl.textContent = armament;
                console.log('武器信息更新:', armament);
            }

            const shipDefenseEl = document.getElementById('ship-defense');
            if (shipDefenseEl) {
                // 优先使用游戏状态中的防御信息，如果没有则使用默认值
                const defense = state.ship.defense || '标准护盾';
                shipDefenseEl.textContent = defense;
                console.log('防御信息更新:', defense);
            }

            // 动态更新地区信息面板
            const locationDisplayEl = document.getElementById('location-display');
            if (locationDisplayEl) {
                locationDisplayEl.textContent = state.captain.location;
            }

            const securityLevelEl = document.getElementById('security-level');
            if (securityLevelEl) {
                // 根据位置判断安全等级
                const location = state.captain.location;
                let security = '安全';
                
                if (location.includes('海盗') || location.includes('危险')) security = '危险';
                else if (location.includes('未知') || location.includes('深空')) security = '未知';
                else if (location.includes('中立') || location.includes('贸易')) security = '中立';
                
                securityLevelEl.textContent = security;
            }

            const gravityEl = document.getElementById('gravity');
            if (gravityEl) {
                // 根据位置判断重力
                const location = state.captain.location;
                let gravity = '标准 (1.0g)';
                
                if (location.includes('空间站') || location.includes('轨道')) gravity = '微重力 (0.1g)';
                else if (location.includes('小行星') || location.includes('采矿')) gravity = '低重力 (0.3g)';
                else if (location.includes('行星') && location.includes('重型')) gravity = '高重力 (1.5g)';
                
                gravityEl.textContent = gravity;
            }
            
            // 动态更新近期任务
            this.updateRecentMissions(state);
            
            // 动态更新顶部状态栏三要素
            this.updateTopBar(state);
            
        } catch (error) {
            console.error('更新状态显示出错:', error);
        }
    }

    // 更新近期任务显示
    updateRecentMissions(state) {
        const missionsContainer = document.getElementById('recent-missions');
        if (!missionsContainer) return;

        // 获取任务数据
        const activeMissions = state.missions.active || [];
        const completedMissions = state.missions.completed || [];
        const recentMissions = [...activeMissions, ...completedMissions]
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
            .slice(0, 3); // 只显示最近3个任务

        // 如果没有任务，显示空状态提示
        if (recentMissions.length === 0) {
            missionsContainer.innerHTML = `
                <div class="mission-item" style="opacity:0.5">
                    <i class="fas fa-inbox"></i> 暂无活跃任务
                    <span class="mission-status" data-status="提示">待接取</span>
                </div>
            `;
            return;
        }

        // 生成任务HTML
        let missionsHTML = '';
        recentMissions.forEach((mission, index) => {
            const isActive = mission.status === 'active' || mission.status === 'in_progress';
            const statusText = this.getMissionStatusText(mission.status);
            const icon = this.getMissionIcon(mission.type || mission.name);
            
            missionsHTML += `
                <div class="mission-item ${isActive ? 'active' : ''}" 
                     data-mission-id="${mission.id || index}"
                     onclick="UI.showMissionDetails('${mission.id || index}')">
                    <i class="${icon}"></i> ${mission.name}
                    <span class="mission-status" data-status="${statusText}">${statusText}</span>
                </div>
            `;
        });

        missionsContainer.innerHTML = missionsHTML;
    }

    // 获取任务状态文本
    getMissionStatusText(status) {
        const statusMap = {
            'active': '进行中',
            'in_progress': '进行中',
            'completed': '已完成',
            'failed': '失败',
            'pending': '未接受',
            'available': '可接受'
        };
        return statusMap[status] || '未知';
    }

    // 获取任务图标
    getMissionIcon(missionType) {
        const iconMap = {
            '侦查': 'fas fa-binoculars',
            '战斗': 'fas fa-crosshairs',
            '运输': 'fas fa-truck',
            '探索': 'fas fa-map',
            '交易': 'fas fa-coins',
            '维修': 'fas fa-wrench',
            '救援': 'fas fa-life-ring',
            '悬赏': 'fas fa-skull',
            '酒吧': 'fas fa-beer',
            '燃料': 'fas fa-gas-pump',
            '信号': 'fas fa-satellite',
            'default': 'fas fa-tasks'
        };

        // 根据任务名称或类型匹配图标
        for (const [key, icon] of Object.entries(iconMap)) {
            if (missionType.includes(key)) {
                return icon;
            }
        }
        
        return iconMap.default;
    }

    // 显示任务详情
    showMissionDetails(missionId) {
        console.log('显示任务详情:', missionId);
        // 这里可以扩展为显示模态框或终端输出
        Game.command(`/mission info ${missionId}`);
    }

    // 切换任务
    switchMission() {
        console.log('切换任务');
        // 这里可以扩展为显示任务列表供选择
        Game.command('/missions list');
    }

    // 更新顶部状态栏（三段式地址：星区 | 地区 | 具体地点）
    updateTopBar(state) {
        const location = state.captain.location;
        
        // 解析三段式地址
        const { sector, region, specificLocation } = this.parseLocation(location);

        // 更新星区信息
        const sectorEl = document.getElementById('sector-info');
        if (sectorEl) {
            sectorEl.textContent = sector;
        }

        // 更新地区信息
        const regionEl = document.getElementById('region-info');
        if (regionEl) {
            regionEl.textContent = region;
        }

        // 更新具体地点
        const locationEl = document.getElementById('location-info');
        if (locationEl) {
            locationEl.textContent = specificLocation;
        }

        // 游戏时间
        const timeEl = document.getElementById('game-time');
        if (timeEl) {
            const t = state.time;
            // 确保小时和分钟是整数
            const hour = Math.floor(t.hour);
            const minute = Math.floor(t.minute);
            timeEl.textContent = `${t.year}.${t.month.toString().padStart(2, '0')}.${t.day.toString().padStart(2, '0')} · ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
    }

    // 解析位置为三段式地址
    parseLocation(location) {
        // 默认值
        let sector = '未知星域';
        let region = '未知地区';
        let specificLocation = '未知位置';

        // ── 从 Lore.data.starMap 动态查找匹配的星系节点 ──
        const starMap = (window.Lore && window.Lore.data && Array.isArray(window.Lore.data.starMap))
            ? window.Lore.data.starMap
            : (typeof DEFAULT_LORE !== 'undefined' && Array.isArray(DEFAULT_LORE.starMap))
                ? DEFAULT_LORE.starMap
                : [];

        // 读取飞船名（用于舰内位置判断）
        const shipName = (window.Lore && window.Lore.data && window.Lore.data.playerShip)
            ? window.Lore.data.playerShip.name
            : (typeof DEFAULT_LORE !== 'undefined' && DEFAULT_LORE.playerShip)
                ? DEFAULT_LORE.playerShip.name
                : '飞船';

        // 按名称长度降序排列，优先匹配更精确的节点（如"采矿殖民地深岩"优先于"深岩"）
        const sortedNodes = [...starMap].sort((a, b) => b.name.length - a.name.length);

        let matchedNode = null;
        for (const node of sortedNodes) {
            if (location.includes(node.name) || node.name.includes(location.split(/[·\s]/)[0])) {
                matchedNode = node;
                break;
            }
        }

        if (matchedNode) {
            // 星区：用节点类型生成（如"空间站" → "XX星域"）
            // 从节点名提取核心词作为星域名
            sector = matchedNode.name.replace(/(空间站|殖民地|前哨站|贸易站|中继站).*$/, '').trim() + '星域';
            if (sector === '星域') sector = matchedNode.name + '星域'; // 兜底
            region = matchedNode.name;
        } else if (location.includes('舰长室') || location.includes('舰桥') || location.includes('船舱')) {
            // 舰内位置
            sector = shipName;
            region = shipName;
        } else if (location.includes('深空') || location.includes('星际') || location.includes('跃迁')) {
            sector = '深空星域';
            region = location;
        } else {
            // 无匹配：直接使用位置名
            region = location;
        }

        // ── 具体地点：通用关键词匹配（与世界观无关） ──
        const specificKeywords = [
            { keywords: ['酒吧', '酒馆', '吧台'], location: '酒吧' },
            { keywords: ['舰桥', '驾驶舱', '导航室'], location: '舰桥' },
            { keywords: ['机库', '停机坪', '船坞'], location: '机库' },
            { keywords: ['医疗室', '医务室', '诊所'], location: '医疗室' },
            { keywords: ['宿舍', '休息室', '舱室'], location: '休息室' },
            { keywords: ['走廊', '通道', '过道'], location: '走廊' },
            { keywords: ['控制室', '指挥室', '监控室'], location: '控制室' },
            { keywords: ['仓库', '储藏室', '货舱'], location: '仓库' },
            { keywords: ['实验室', '研究室'], location: '实验室' },
            { keywords: ['餐厅', '食堂'], location: '餐厅' },
            { keywords: ['贸易甲板', '交易大厅', '市场'], location: '贸易区' },
            { keywords: ['舰长室', '舰长舱'], location: '舰长室' },
        ];

        for (const { keywords, location: loc } of specificKeywords) {
            if (keywords.some(kw => location.includes(kw))) {
                specificLocation = loc;
                break;
            }
        }

        // 如果没匹配到具体地点，尝试去掉已匹配的区域名，剩余部分作为具体地点
        if (specificLocation === '未知位置' && matchedNode) {
            const remainder = location.replace(matchedNode.name, '').trim();
            if (remainder.length > 0) {
                specificLocation = remainder;
            }
        }

        return { sector, region, specificLocation };
    }

    // 根据AI描述更新具体地点
    updateSpecificLocationFromAI(aiResponse) {
        console.log('updateSpecificLocationFromAI 调用，AI回复:', aiResponse.substring(0, 100));
        
        const locationKeywords = [
            { keywords: ['酒吧', '酒馆', '吧台', '喝酒'], location: '酒吧' },
            { keywords: ['舰桥', '驾驶舱', '控制台', '导航'], location: '舰桥' },
            { keywords: ['机库', '停机坪', '飞船', '维修'], location: '机库' },
            { keywords: ['医疗室', '医务室', '治疗', '医生'], location: '医疗室' },
            { keywords: ['宿舍', '休息室', '睡觉', '休息'], location: '休息室' },
            { keywords: ['走廊', '通道', '过道', '行走'], location: '走廊' },
            { keywords: ['控制室', '指挥室', '监控'], location: '控制室' },
            { keywords: ['仓库', '储藏室', '货物'], location: '仓库' },
            { keywords: ['实验室', '研究', '实验'], location: '实验室' },
            { keywords: ['餐厅', '食堂', '吃饭'], location: '餐厅' }
        ];

        for (const { keywords, location } of locationKeywords) {
            for (const keyword of keywords) {
                if (aiResponse.includes(keyword)) {
                    console.log('找到关键词匹配:', keyword, '→', location);
                    const locationEl = document.getElementById('location-info');
                    if (locationEl) {
                        locationEl.textContent = location;
                        console.log('具体地点更新为:', location);
                    } else {
                        console.error('找不到 location-info 元素');
                    }
                    return location;
                }
            }
        }
        
        console.log('未找到匹配的关键词');

        return null; // 未检测到具体地点
    }

    // 更新终端状态显示（进度条和状态文本）
    updateTerminalStatusDisplay() {
        try {
            const state = State.state;
            const status = State.getStatusDescription();
            
            // 创建进度条
            const hullBar = this.createProgressBar(state.ship.hull, 6);
            const shieldBar = this.createProgressBar(state.ship.shield, 6);
            const fuelBar = this.createProgressBar(state.ship.fuel, 6);
            
            // 显示进度条
            this.addTerminalOutput(`船体 ${hullBar} ${state.ship.hull}% | 护盾 ${shieldBar} ${state.ship.shield}% | 燃料 ${fuelBar} ${state.ship.fuel}%`, 'status-bar');
            
            // 显示舰长状态
            this.addTerminalOutput(`舰长${status.health} | ${status.energy} | ${status.credits}`, 'status-bar');
            
        } catch (error) {
            console.error('更新终端状态显示出错:', error);
            // 回退到默认显示
            this.addTerminalOutput('船体 ████░░ 85% | 护盾 ██░░░░ 50% | 燃料 ██░░░░ 45%', 'status-bar');
            this.addTerminalOutput('舰长正常 | 精力尚可 | 1,250€', 'status-bar');
        }
    }

    // 创建进度条字符串
    createProgressBar(value, length = 6) {
        const filled = Math.round((value / 100) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    // 更新进度条（同时更新标签）
    updateProgressBar(progressId, textId, value, labelName = null) {
        const progressBar = document.getElementById(progressId);
        const progressText = document.getElementById(textId);

        if (progressBar && progressText) {
            const clampedValue = Math.max(0, Math.min(100, value));

            progressBar.style.width = `${clampedValue}%`;
            progressText.textContent = `${Math.round(clampedValue)}%`;

            if (clampedValue < 20) {
                progressBar.style.background = 'linear-gradient(90deg, #ff3333, #ff6666)';
            } else if (clampedValue < 50) {
                progressBar.style.background = 'linear-gradient(90deg, #ff9900, #ffcc00)';
            } else {
                progressBar.style.background = '';
            }

            // 同步更新下方标签文字
            if (labelName && value !== undefined) {
                // 根据进度条ID映射到对应的标签ID
                let labelId;
                if (progressId === 'hull-progress') labelId = 'hull-label';
                else if (progressId === 'shield-progress') labelId = 'shield-label';
                else if (progressId === 'fuel-progress') labelId = 'fuel-label';
                else labelId = `${progressId.replace('-progress', '-label')}`;
                
                const labelEl = document.getElementById(labelId);
                if (labelEl) {
                    const bar = this.createProgressBar(clampedValue);
                    labelEl.textContent = `${labelName} ${bar} ${Math.round(clampedValue)}%`;
                }
            }
        }
    }

    // 显示通知
    showNotification(title, message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${title}</span>
                <span class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            </div>
            <div class="notification-body">${message}</div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 自动移除（5秒后）
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 显示休息条件检查
    showRestConditionsModal(checkResult) {
        const modal = document.getElementById('rest-modal');
        const conditionsDiv = document.getElementById('rest-conditions-check');
        const optionsDiv = document.getElementById('rest-options');
        
        if (!modal || !conditionsDiv) return;
        
        // 清空现有内容
        conditionsDiv.innerHTML = '';
        
        // 添加条件检查结果
        const conditions = checkResult.conditions;
        
        Object.entries(conditions).forEach(([key, met]) => {
            const conditionNames = {
                location: '安全位置',
                combat: '不在战斗中',
                danger: '无危险状态',
                resources: '资源充足'
            };
            
            const conditionDiv = document.createElement('div');
            conditionDiv.className = `condition-check ${met ? 'condition-met' : 'condition-not-met'}`;
            conditionDiv.innerHTML = `
                <div class="condition-icon">
                    <i class="fas fa-${met ? 'check' : 'times'}"></i>
                </div>
                <div class="condition-text">
                    ${conditionNames[key] || key}
                </div>
            `;
            
            conditionsDiv.appendChild(conditionDiv);
        });
        
        // 显示总结
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'condition-summary';
        summaryDiv.innerHTML = `
            <p>满足条件: ${checkResult.metConditions}/${checkResult.totalConditions}</p>
            ${checkResult.allMet ? '<p class="success-text">✓ 可以完整休息</p>' : ''}
            ${checkResult.canSimpleRest ? '<p class="info-text">✓ 可以简易休息</p>' : ''}
            <p class="info-text">✓ 可以紧急休息（无条件）</p>
        `;
        conditionsDiv.appendChild(summaryDiv);
        
        // 显示/隐藏选项
        if (checkResult.allMet || checkResult.canSimpleRest) {
            optionsDiv.style.display = 'block';
        } else {
            optionsDiv.style.display = 'none';
        }
        
        // 显示模态框
        this.showModal('rest-modal');
    }

    // 更新命令历史显示
    updateCommandHistoryDisplay() {
        // 这里可以实现在侧边栏显示命令历史
        // 简化：暂时不实现
    }

    // 显示加载动画
    showLoading(message = '处理中...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.id = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    // 隐藏加载动画
    hideLoading() {
        const loadingDiv = document.getElementById('loading-overlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // 显示确认对话框
    showConfirm(message, callback) {
        if (confirm(message)) {
            callback(true);
        } else {
            callback(false);
        }
    }

    // 显示提示
    showPrompt(message, defaultValue = '', callback) {
        const result = prompt(message, defaultValue);
        callback(result);
    }

    // 更新快速命令按钮状态
    updateQuickCommands() {
        // 根据游戏状态更新快速命令的可用性
        const restButton = document.querySelector('.cmd-btn[onclick*="/rest"]');
        if (restButton) {
            // 检查是否可以休息
            const checkResult = State.checkRestConditions();
            restButton.disabled = !checkResult.canSimpleRest;
            restButton.title = checkResult.canSimpleRest 
                ? '请求幕间休息' 
                : '不满足休息条件';
        }
    }

    // 响应游戏状态变化
    onGameStateChange() {
        this.updateStatusDisplay();
        this.updateQuickCommands();

        const state = State.state;

        // 低燃料警告（仅弹一次）
        if (state.ship.fuel < 20 && !this._warnedFuel) {
            this.showNotification('燃料警告', `燃料仅剩 ${state.ship.fuel}%，建议补充燃料`, 'warning');
            this._warnedFuel = true;
        } else if (state.ship.fuel >= 20) {
            this._warnedFuel = false; // 燃料恢复后重置，允许再次警告
        }

        // 低生命值警告（仅弹一次）
        if (state.captain.health < 30 && !this._warnedHealth) {
            this.showNotification('生命值警告', `舰长生命值仅剩 ${state.captain.health}%，建议休息或治疗`, 'warning');
            this._warnedHealth = true;
        } else if (state.captain.health >= 30) {
            this._warnedHealth = false;
        }
    }

    // 初始化游戏循环
    startGameLoop() {
        // 定期更新UI
        setInterval(() => {
            this.onGameStateChange();
        }, 5000); // 每5秒更新一次
        
        // 初始更新
        this.onGameStateChange();
    }
}

// 创建全局UI管理器实例
const UI = new UIManager();

// 全局函数供HTML调用
function sendCommand() {
    UI.sendCommand();
}

function closeModal(modalId) {
    UI.closeModal(modalId);
}

// 初始化游戏循环
window.addEventListener('load', () => {
    UI.startGameLoop();
});