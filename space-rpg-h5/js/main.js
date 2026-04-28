/**
 * 主入口文件
 * 初始化游戏并设置全局函数
 */

// 全局游戏对象
window.Game = Game;
window.State = State;
window.Tools = Tools;
window.ActManager = ActManagerInstance;
window.Validator = ValidatorInstance;
window.UI = UI;

// 全局工具函数
window.showNotification = function(title, message, type = 'info') {
    UI.showNotification(title, message, type);
};

window.openRestModal = function() {
    // 检查休息条件
    Tools.callTool('check_rest_conditions').then(result => {
        if (result.success) {
            UI.showRestConditionsModal(result.result);
        } else {
            UI.showNotification('错误', `无法检查休息条件: ${result.message}`, 'error');
        }
    });
};

// 初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    console.log('太空RPG H5版初始化...');
    
    // 检查浏览器兼容性
    if (!window.localStorage) {
        alert('错误: 您的浏览器不支持本地存储，游戏无法运行。请使用现代浏览器。');
        return;
    }

    // === 世界观构建向导检测 ===
    const wizard = new WorldBuildWizard();
    window.WorldBuildWizardInstance = wizard;

    if (wizard.needsWizard()) {
        // 新游戏 → 启动世界观构建向导
        console.log('检测到新游戏，启动世界观构建向导...');
        wizard.start(
            // onComplete: 向导完成回调
            (wizardData, rawInput) => {
                console.log('世界观向导完成，初始化游戏数据...');
                
                // 1. 用向导数据初始化世界观
                Lore.initFromWizardData(wizardData);
                
                // 2. 用向导数据+世界观初始化游戏状态
                State.initFromWizardData(wizardData, Lore.data);
                
                // 3. 更新UI显示
                UI.updateStatusDisplay();
                
                // 4. 显示启动消息
                showBootMessages();
                
                // 5. 显示世界观摘要
                setTimeout(() => {
                    const hasCustom = rawInput && Object.values(rawInput).some(v => v && v.trim());
                    if (hasCustom) {
                        UI.addTerminalOutput('🌌 自定义世界观已加载', 'system');
                    } else {
                        UI.addTerminalOutput('🌌 默认世界观已加载', 'system');
                    }
                    UI.addTerminalOutput(`纪元: ${Lore.data.universe.name}`, 'system');
                    UI.addTerminalOutput(`飞船: ${Lore.data.playerShip.name}`, 'system');
                    UI.addTerminalOutput(`位置: ${State.state.captain.location}`, 'system');
                    UI.addTerminalOutput('', 'empty');
                    UI.addTerminalOutput('输入行动描述开始游戏，或使用 /help 查看命令', 'system');
                }, 500);
            },
            // onCancel: 向导取消回调 → 使用默认设定
            () => {
                console.log('向导已取消，使用默认设定');
                wizard.markCompleted();
                showBootMessages();
            }
        );
    } else {
        // 已有存档或向导已完成 → 正常启动
        showBootMessages();
    }

    function showBootMessages() {
        setTimeout(() => {
            UI.addTerminalOutput('深空网络连接稳定', 'system');
            UI.addTerminalOutput('传感器阵列在线', 'system');
            UI.addTerminalOutput('导航系统就绪', 'system');
            UI.addTerminalOutput('', 'empty');
            UI.addTerminalOutput('输入行动描述开始游戏，或使用 /help 查看命令', 'system');
        }, 1000);
    }
    
    // 设置自动保存
    setInterval(() => {
        Game.saveGame();
        console.log('自动保存完成');
    }, 300000); // 每5分钟自动保存
    
    // 添加仅在CSS文件中未定义的动态样式
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-spinner {
            border: 4px solid rgba(0, 204, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #00ccff;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        .terminal-line.system-header {
            color: #00ccff;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .terminal-line.status-bar {
            color: #88ff88;
            font-family: 'Courier New', monospace;
            margin: 5px 0;
        }
        
        .terminal-line.mission {
            color: #ffcc00;
            margin: 10px 0;
        }
        
        .terminal-line.prompt-large {
            color: #00ccff;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 15px 0;
        }
        
        .success-message {
            color: #33cc33;
        }
        
        .warning-message {
            color: #ff9900;
        }
        
        .error-message {
            color: #ff3333;
        }
    `;
    document.head.appendChild(style);
});

// 导出游戏数据（用于调试）
window.exportGameData = function() {
    const data = {
        state: State.exportState(),
        acts: ActManagerInstance.exportActs(),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `space-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    UI.showNotification('导出成功', '游戏数据已导出为JSON文件', 'success');
};

// 导入游戏数据
window.importGameData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('确定要导入游戏数据吗？当前进度将丢失。')) {
                    // 恢复状态
                    State.importState(data.state);
                    
                    // 恢复幕数据
                    ActManagerInstance.importActs(data.acts);
                    
                    // 更新UI
                    UI.updateStatusDisplay();
                    UI.addTerminalOutput(`游戏数据已导入 (${new Date(data.timestamp).toLocaleString()})`, 'success');
                    UI.showNotification('导入成功', '游戏数据已恢复', 'success');
                }
            } catch (error) {
                UI.showNotification('导入失败', `文件格式错误: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
};

// 开发者工具
window.devTools = {
    // 添加资源
    addResource: function(resource, amount) {
        Tools.callTool('update_resources', {
            resource: resource,
            amount: amount,
            operation: 'add'
        }).then(result => {
            if (result.success) {
                UI.showNotification('开发者工具', result.result.message, 'success');
                UI.updateStatusDisplay();
            } else {
                UI.showNotification('错误', result.message, 'error');
            }
        });
    },
    
    // 完全恢复
    fullHeal: function() {
        State.update({
            captain: {
                health: 100,
                energy: 100
            },
            ship: {
                hull: 100,
                shield: 100,
                fuel: 100
            }
        });
        UI.updateStatusDisplay();
        UI.showNotification('开发者工具', '状态完全恢复', 'success');
    },
    
    // 跳转到目的地
    jumpTo: function(destination) {
        Tools.callTool('navigate', {
            destination: destination,
            distance: 1
        }).then(result => {
            if (result.success) {
                UI.showNotification('开发者工具', result.result.message, 'success');
                UI.updateStatusDisplay();
            } else {
                UI.showNotification('错误', result.message, 'error');
            }
        });
    },
    
    // 显示调试信息
    showDebugInfo: function() {
        console.log('=== 调试信息 ===');
        console.log('游戏状态:', State.state);
        console.log('当前幕:', ActManagerInstance.currentAct);
        console.log('幕事件:', ActManagerInstance.events.length);
        console.log('本地存储使用:', 
            JSON.stringify(localStorage).length + ' 字符'
        );
        
        UI.addTerminalOutput('调试信息已输出到控制台', 'system');
    }
};

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl+S: 保存游戏
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        Game.saveGame();
    }
    
    // Ctrl+L: 加载游戏
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        Game.loadGame();
    }
    
    // Ctrl+H: 显示帮助
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        Game.showHelp();
    }
    
    // Ctrl+D: 开发者工具
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        window.devTools.showDebugInfo();
    }
    
    // Esc: 关闭所有模态框
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('游戏错误:', e.error);
    UI.showNotification('游戏错误', `发生错误: ${e.message}`, 'error');
});

// 页面离开确认
window.addEventListener('beforeunload', function(e) {
    // 如果有未保存的更改，提示用户
    if (Game.commandHistory.length > 0) {
        e.preventDefault();
        e.returnValue = '游戏进度可能丢失，确定要离开吗？';
    }
});

// 游戏版本信息
const GAME_VERSION = '1.0.0';
const GAME_BUILD = '2026-04-14';

console.log(`太空RPG H5版 v${GAME_VERSION} (${GAME_BUILD})`);
console.log('基于太空RPG项目最终汇报方案开发');
console.log('游戏已就绪，祝您探索愉快！');