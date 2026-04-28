/**
 * 设置管理器 - 管理游戏设置和API配置
 */

class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.apiManager = window.APIManager;
        this.initUI();
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('space_rpg_settings');
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('加载设置失败:', error);
            return this.getDefaultSettings();
        }
    }
    
    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            // 游戏设置
            game: {
                autoSave: true,
                autoSaveInterval: 60, // 秒
                showTooltips: true,
                animationSpeed: 'normal', // slow, normal, fast
                soundEnabled: false,
                musicEnabled: false,
                volume: 50
            },
            
            // 界面设置
            ui: {
                theme: 'dark', // dark, light, terminal
                fontSize: 'medium', // small, medium, large
                showStatusBar: true,
                showCommandHistory: true,
                showDeveloperTools: false
            },
            
            // AI设置
            ai: {
                enabled: false,
                autoSuggestTools: true,
                temperature: 0.7,
                maxResponseLength: 2000,
                useContextCache: true
            },
            
            // 开发者设置
            developer: {
                debugMode: false,
                logToolCalls: true,
                showValidationWarnings: true,
                enableExperimentalFeatures: false
            }
        };
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('space_rpg_settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }
    
    /**
     * 更新设置
     */
    updateSettings(category, key, value) {
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            this.settings[category][key] = value;
            this.saveSettings();
            this.applySettings();
            return true;
        }
        return false;
    }
    
    /**
     * 批量更新设置
     */
    updateSettingsBatch(updates) {
        let changed = false;
        
        for (const [category, categoryUpdates] of Object.entries(updates)) {
            if (this.settings[category]) {
                for (const [key, value] of Object.entries(categoryUpdates)) {
                    if (this.settings[category][key] !== undefined) {
                        this.settings[category][key] = value;
                        changed = true;
                    }
                }
            }
        }
        
        if (changed) {
            this.saveSettings();
            this.applySettings();
        }
        
        return changed;
    }
    
    /**
     * 应用设置到UI
     */
    applySettings() {
        // 应用主题
        this.applyTheme();
        
        // 应用字体大小
        this.applyFontSize();
        
        // 应用动画速度
        this.applyAnimationSpeed();
        
        // 触发设置变更事件
        this.triggerSettingsChange();
    }
    
    /**
     * 应用主题
     */
    applyTheme() {
        const theme = this.settings.ui.theme;
        document.body.className = `theme-${theme}`;
        
        // 添加主题CSS类
        const themes = ['dark', 'light', 'terminal'];
        themes.forEach(t => {
            document.body.classList.remove(`theme-${t}`);
        });
        document.body.classList.add(`theme-${theme}`);
    }
    
    /**
     * 应用字体大小
     */
    applyFontSize() {
        const fontSize = this.settings.ui.fontSize;
        const sizes = {
            'small': '12px',
            'medium': '14px',
            'large': '16px'
        };
        
        document.documentElement.style.fontSize = sizes[fontSize] || '14px';
    }
    
    /**
     * 应用动画速度
     */
    applyAnimationSpeed() {
        const speed = this.settings.game.animationSpeed;
        const speeds = {
            'slow': '0.5s',
            'normal': '0.3s',
            'fast': '0.1s'
        };
        
        document.documentElement.style.setProperty('--animation-speed', speeds[speed] || '0.3s');
    }
    
    /**
     * 触发设置变更事件
     */
    triggerSettingsChange() {
        const event = new CustomEvent('settingsChanged', {
            detail: { settings: this.settings }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 初始化UI
     */
    initUI() {
        this.createSettingsButton();
        this.createSettingsModal();
        this.bindEvents();
    }
    
    /**
     * 创建设置按钮（已移至 HTML 内联，此方法保留空壳防调用报错）
     */
    createSettingsButton() {
        // 设置按钮现在内联在 status-bar 中，无需动态创建
    }
    
    /**
     * 创建设置模态框
     */
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="settings-modal-content">
                <div class="settings-modal-header">
                    <h2>游戏设置</h2>
                    <button class="settings-close-btn">&times;</button>
                </div>
                
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="game">游戏设置</button>
                    <button class="settings-tab" data-tab="ui">界面设置</button>
                    <button class="settings-tab" data-tab="ai">AI设置</button>
                    <button class="settings-tab" data-tab="api">API配置</button>
                    <button class="settings-tab" data-tab="developer">开发者</button>
                </div>
                
                <div class="settings-tab-content">
                    <!-- 游戏设置 -->
                    <div class="settings-tab-pane active" id="game-settings">
                        <div class="settings-group">
                            <h3>游戏设置</h3>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="auto-save" data-category="game" data-key="autoSave">
                                    自动保存
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>自动保存间隔（秒）</label>
                                <input type="number" id="auto-save-interval" data-category="game" data-key="autoSaveInterval" min="10" max="300">
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="show-tooltips" data-category="game" data-key="showTooltips">
                                    显示工具提示
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>动画速度</label>
                                <select id="animation-speed" data-category="game" data-key="animationSpeed">
                                    <option value="slow">慢</option>
                                    <option value="normal">正常</option>
                                    <option value="fast">快</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 界面设置 -->
                    <div class="settings-tab-pane" id="ui-settings">
                        <div class="settings-group">
                            <h3>界面设置</h3>
                            <div class="settings-item">
                                <label>主题</label>
                                <select id="theme" data-category="ui" data-key="theme">
                                    <option value="dark">深色</option>
                                    <option value="light">浅色</option>
                                    <option value="terminal">终端</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>字体大小</label>
                                <select id="font-size" data-category="ui" data-key="fontSize">
                                    <option value="small">小</option>
                                    <option value="medium">中</option>
                                    <option value="large">大</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="show-status-bar" data-category="ui" data-key="showStatusBar">
                                    显示状态栏
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="show-command-history" data-category="ui" data-key="showCommandHistory">
                                    显示命令历史
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI设置 -->
                    <div class="settings-tab-pane" id="ai-settings">
                        <div class="settings-group">
                            <h3>AI设置</h3>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="ai-enabled" data-category="ai" data-key="enabled">
                                    启用AI功能
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="auto-suggest-tools" data-category="ai" data-key="autoSuggestTools">
                                    自动建议工具调用
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>温度（创造性）</label>
                                <input type="range" id="ai-temperature" data-category="ai" data-key="temperature" min="0" max="1" step="0.1">
                                <span id="temperature-value">0.7</span>
                            </div>
                            <div class="settings-item">
                                <label>最大响应长度</label>
                                <input type="number" id="max-response-length" data-category="ai" data-key="maxResponseLength" min="100" max="5000">
                            </div>
                        </div>
                    </div>
                    
                    <!-- API配置 -->
                    <div class="settings-tab-pane" id="api-settings">
                        <div class="settings-group">
                            <h3>API配置</h3>
                            <div class="settings-item">
                                <label>AI服务提供商</label>
                                <select id="api-provider">
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="claude">Claude (Anthropic)</option>
                                    <option value="qwen">Qwen (通义千问)</option>
                                    <option value="glm">GLM (智谱AI)</option>
                                    <option value="custom">自定义</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>API密钥</label>
                                <input type="password" id="api-key" placeholder="输入API密钥">
                            </div>
                            <div class="settings-item" id="api-url-container" style="display: none;">
                                <label>自定义API地址</label>
                                <input type="text" id="api-base-url" placeholder="仅自定义提供商需要输入">
                            </div>
                            <div class="settings-item">
                                <label>模型</label>
                                <select id="api-model">
                                    <option value="">选择模型</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="api-enabled">
                                    启用API
                                </label>
                            </div>
                            <div class="settings-actions">
                                <button id="test-api-connection" class="settings-btn">测试连接</button>
                                <button id="save-api-config" class="settings-btn primary">保存配置</button>
                                <button id="reset-api-config" class="settings-btn danger">重置配置</button>
                            </div>
                            <div id="api-status" class="api-status"></div>
                        </div>
                    </div>
                    
                    <!-- 开发者设置 -->
                    <div class="settings-tab-pane" id="developer-settings">
                        <div class="settings-group">
                            <h3>开发者设置</h3>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="debug-mode" data-category="developer" data-key="debugMode">
                                    调试模式
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="log-tool-calls" data-category="developer" data-key="logToolCalls">
                                    记录工具调用
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="show-validation-warnings" data-category="developer" data-key="showValidationWarnings">
                                    显示验证警告
                                </label>
                            </div>
                            <div class="settings-item">
                                <label>
                                    <input type="checkbox" id="enable-experimental-features" data-category="developer" data-key="enableExperimentalFeatures">
                                    启用实验功能
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-group">
                            <h3>开发者工具</h3>
                            <div class="settings-actions">
                                <button id="export-game-data" class="settings-btn">导出游戏数据</button>
                                <button id="import-game-data" class="settings-btn">导入游戏数据</button>
                                <button id="clear-game-data" class="settings-btn danger">清除游戏数据</button>
                                <button id="open-console" class="settings-btn">打开控制台</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-modal-footer">
                    <button id="save-settings" class="settings-btn primary">保存设置</button>
                    <button id="reset-settings" class="settings-btn">恢复默认</button>
                    <button id="close-settings" class="settings-btn">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 设置按钮点击（绑定内联齿轮按钮）
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        // 兼容旧 id
        const oldBtn = document.getElementById('settings-button');
        if (oldBtn) {
            oldBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // 关闭按钮
        document.querySelector('.settings-close-btn').addEventListener('click', () => {
            this.hideSettingsModal();
        });
        
        // 标签页切换
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 温度滑块
        const tempSlider = document.getElementById('ai-temperature');
        const tempValue = document.getElementById('temperature-value');
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
        
        // API提供商切换
        document.getElementById('api-provider').addEventListener('change', (e) => {
            this.updateAPIProvider(e.target.value);
            this.toggleCustomAPIURL(e.target.value);
        });
        
        // 测试API连接
        document.getElementById('test-api-connection').addEventListener('click', () => {
            this.testAPIConnection();
        });
        
        // 保存API配置
        document.getElementById('save-api-config').addEventListener('click', () => {
            this.saveAPIConfig();
        });
        
        // 重置API配置
        document.getElementById('reset-api-config').addEventListener('click', () => {
            this.resetAPIConfig();
        });
        
        // 保存设置
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveAllSettings();
        });
        
        // 重置设置
        document.getElementById('reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });
        
        // 关闭设置
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideSettingsModal();
        });
        
        // 开发者工具
        document.getElementById('export-game-data').addEventListener('click', () => {
            this.exportGameData();
        });
        
        document.getElementById('import-game-data').addEventListener('click', () => {
            this.importGameData();
        });
        
        document.getElementById('clear-game-data').addEventListener('click', () => {
            this.clearGameData();
        });
        
        document.getElementById('open-console').addEventListener('click', () => {
            this.openConsole();
        });
        
        // 点击模态框外部关闭
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.hideSettingsModal();
            }
        });
    }
    
    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        this.loadCurrentSettings();
        document.getElementById('settings-modal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('settings-modal').classList.add('show');
        }, 10);
    }
    
    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        document.getElementById('settings-modal').classList.remove('show');
        setTimeout(() => {
            document.getElementById('settings-modal').style.display = 'none';
        }, 300);
        // 关闭设置后刷新深空网络状态
        if (window.UI && typeof window.UI.updateConnectionStatus === 'function') {
            window.UI.updateConnectionStatus();
        }
    }
    
    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // 更新标签页
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });
        
        // 更新内容
        document.querySelectorAll('.settings-tab-pane').forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === `${tabName}-settings`) {
                pane.classList.add('active');
            }
        });
    }
    
    /**
     * 加载当前设置到UI
     */
    loadCurrentSettings() {
        // 加载游戏设置
        this.loadSettingsToUI();
        
        // 加载API配置
        this.loadAPIConfigToUI();
    }
    
    /**
     * 加载设置到UI
     */
    loadSettingsToUI() {
        // 遍历所有设置项
        document.querySelectorAll('[data-category][data-key]').forEach(element => {
            const category = element.dataset.category;
            const key = element.dataset.key;
            
            if (this.settings[category] && this.settings[category][key] !== undefined) {
                const value = this.settings[category][key];
                
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else if (element.type === 'range') {
                    element.value = value;
                    // 更新显示值
                    const valueDisplay = element.nextElementSibling;
                    if (valueDisplay && valueDisplay.id.includes('value')) {
                        valueDisplay.textContent = value;
                    }
                } else {
                    element.value = value;
                }
            }
        });
    }
    
    /**
     * 加载API配置到UI
     */
    loadAPIConfigToUI() {
        const config = this.apiManager.getConfig();
        // 直接从实例取真实 key（getConfig 返回脱敏值，不适合回填输入框）
        const realApiKey = this.apiManager.instance ? this.apiManager.instance.apiKey : '';
        
        document.getElementById('api-provider').value = config.currentProvider;
        document.getElementById('api-key').value = realApiKey;
        document.getElementById('api-enabled').checked = config.enabled;
        
        // 处理自定义API地址
        const urlInput = document.getElementById('api-base-url');
        if (config.currentProvider === 'custom' && config.customBaseURL) {
            urlInput.value = config.customBaseURL;
        } else {
            urlInput.value = '';
        }
        
        // 更新模型列表
        this.updateModelList(config.currentProvider);
        
        // 设置选中模型
        const modelSelect = document.getElementById('api-model');
        const models = this.apiManager.getAvailableModels(config.currentProvider);
        if (config.currentModel && models.includes(config.currentModel)) {
            modelSelect.value = config.currentModel;
        }
        
        // 更新自定义地址输入框的显示状态
        this.toggleCustomAPIURL(config.currentProvider);
    }
    
    /**
     * 更新API提供商
     */
    updateAPIProvider(provider) {
        // 更新模型列表
        this.updateModelList(provider);
        
        // 设置默认模型
        const models = this.apiManager.getAvailableModels(provider);
        if (models.length > 0) {
            document.getElementById('api-model').value = models[0];
        }
    }
    
    /**
     * 切换自定义API地址输入框的显示
     */
    toggleCustomAPIURL(provider) {
        const urlContainer = document.getElementById('api-url-container');
        const urlInput = document.getElementById('api-base-url');
        
        if (provider === 'custom') {
            urlContainer.style.display = 'block';
            urlInput.placeholder = '输入自定义API地址 (如: https://api.example.com/v1)';
            urlInput.required = true;
        } else {
            urlContainer.style.display = 'none';
            urlInput.value = ''; // 清空输入框
            urlInput.required = false;
        }
    }
    
    /**
     * 更新模型列表
     */
    updateModelList(provider = null) {
        const modelSelect = document.getElementById('api-model');
        
        // 清空选项
        modelSelect.innerHTML = '<option value="">选择模型</option>';
        
        // 获取模型列表
        const models = this.apiManager.getAvailableModels(provider);
        
        // 添加模型选项
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }
    
    /**
     * 测试API连接
     */
    async testAPIConnection() {
        const statusDiv = document.getElementById('api-status');
        statusDiv.innerHTML = '<span class="status-testing">测试连接中...</span>';
        statusDiv.className = 'api-status testing';
        
        try {
            const result = await this.apiManager.testConnection();
            
            if (result.success) {
                statusDiv.innerHTML = `<span class="status-success">✓ ${result.message}</span>`;
                statusDiv.className = 'api-status success';
            } else {
                statusDiv.innerHTML = `<span class="status-error">✗ ${result.message}</span>`;
                if (result.details) {
                    statusDiv.innerHTML += `<br><small>${JSON.stringify(result.details)}</small>`;
                }
                statusDiv.className = 'api-status error';
            }
        } catch (error) {
            statusDiv.innerHTML = `<span class="status-error">✗ 测试失败: ${error.message}</span>`;
            statusDiv.className = 'api-status error';
        }
    }
    
    /**
     * 保存API配置
     */
    saveAPIConfig() {
        const provider = document.getElementById('api-provider').value;
        const config = {
            currentProvider: provider,
            apiKey: document.getElementById('api-key').value,
            currentModel: document.getElementById('api-model').value,
            enabled: document.getElementById('api-enabled').checked
        };
        
        // 只有自定义提供商才保存自定义地址
        if (provider === 'custom') {
            const customURL = document.getElementById('api-base-url').value;
            if (customURL.trim()) {
                config.customBaseURL = customURL.trim();
            }
        }
        
        this.apiManager.updateConfig(config);
        
        const statusDiv = document.getElementById('api-status');
        statusDiv.innerHTML = '<span class="status-success">✓ API配置已保存</span>';
        statusDiv.className = 'api-status success';
    }
    
    /**
     * 重置API配置
     */
    resetAPIConfig() {
        if (confirm('确定要重置API配置吗？')) {
            this.apiManager.resetConfig();
            this.loadAPIConfigToUI();
            
            const statusDiv = document.getElementById('api-status');
            statusDiv.innerHTML = '<span class="status-success">✓ API配置已重置</span>';
            statusDiv.className = 'api-status success';
        }
    }
    
    /**
     * 保存所有设置
     */
    saveAllSettings() {
        const updates = {};
        
        // 收集所有设置项
        document.querySelectorAll('[data-category][data-key]').forEach(element => {
            const category = element.dataset.category;
            const key = element.dataset.key;
            let value;
            
            if (element.type === 'checkbox') {
                value = element.checked;
            } else if (element.type === 'range') {
                value = parseFloat(element.value);
            } else if (element.type === 'number') {
                value = parseInt(element.value);
            } else {
                value = element.value;
            }
            
            if (!updates[category]) updates[category] = {};
            updates[category][key] = value;
        });
        
        // 更新设置
        this.updateSettingsBatch(updates);
        
        // 显示保存成功消息
        this.showMessage('设置已保存', 'success');
    }
    
    /**
     * 重置设置
     */
    resetSettings() {
        if (confirm('确定要恢复默认设置吗？')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.applySettings();
            this.loadCurrentSettings();
            this.showMessage('设置已恢复默认', 'success');
        }
    }
    
    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `settings-message ${type}`;
        messageDiv.textContent = message;
        
        const modalContent = document.querySelector('.settings-modal-content');
        modalContent.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    /**
     * 导出游戏数据
     */
    exportGameData() {
        if (typeof exportGameData === 'function') {
            exportGameData();
            this.showMessage('游戏数据已导出', 'success');
        }
    }
    
    /**
     * 导入游戏数据
     */
    importGameData() {
        if (typeof importGameData === 'function') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    importGameData(file);
                    this.showMessage('游戏数据已导入', 'success');
                }
            };
            input.click();
        }
    }
    
    /**
     * 清除游戏数据
     */
    clearGameData() {
        if (confirm('确定要清除所有游戏数据吗？此操作不可恢复！')) {
            localStorage.clear();
            location.reload();
        }
    }
    
    /**
     * 打开控制台
     */
    openConsole() {
        // 创建开发者控制台
        const consoleDiv = document.createElement('div');
        consoleDiv.id = 'developer-console';
        consoleDiv.className = 'developer-console';
        consoleDiv.innerHTML = `
            <div class="console-header">
                <h3>开发者控制台</h3>
                <button class="console-close">&times;</button>
            </div>
            <div class="console-output"></div>
            <div class="console-input">
                <input type="text" placeholder="输入命令...">
                <button>执行</button>
            </div>
        `;
        
        document.body.appendChild(consoleDiv);
        
        // 绑定控制台事件
        consoleDiv.querySelector('.console-close').addEventListener('click', () => {
            consoleDiv.remove();
        });
        
        const input = consoleDiv.querySelector('input');
        const button = consoleDiv.querySelector('button');
        const output = consoleDiv.querySelector('.console-output');
        
        button.addEventListener('click', () => {
            this.executeConsoleCommand(input.value, output);
            input.value = '';
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeConsoleCommand(input.value, output);
                input.value = '';
            }
        });
    }
    
    /**
     * 执行控制台命令
     */
    executeConsoleCommand(command, outputDiv) {
        try {
            let result;
            
            // 解析命令
            const parts = command.trim().split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            switch (cmd) {
                case 'help':
                    result = '可用命令: help, state, tools, acts, config, eval <code>';
                    break;
                    
                case 'state':
                    result = JSON.stringify(State.state, null, 2);
                    break;
                    
                case 'tools':
                    result = '可用工具: ' + Object.keys(Tools.tools).join(', ');
                    break;
                    
                case 'acts':
                    result = `当前幕: ${ActManager.currentAct}\n总事件数: ${ActManager.getTotalEvents()}`;
                    break;
                    
                case 'config':
                    result = JSON.stringify(this.apiManager.getConfigSummary(), null, 2);
                    break;
                    
                case 'eval':
                    const code = args.join(' ');
                    result = eval(code);
                    break;
                    
                default:
                    result = `未知命令: ${cmd}`;
            }
            
            outputDiv.innerHTML += `<div class="console-command">> ${command}</div>`;
            outputDiv.innerHTML += `<div class="console-result">${result}</div>`;
            outputDiv.scrollTop = outputDiv.scrollHeight;
            
        } catch (error) {
            outputDiv.innerHTML += `<div class="console-error">错误: ${error.message}</div>`;
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    }
}

// 创建全局实例
const SettingsManagerInstance = new SettingsManager();
window.SettingsManager = SettingsManagerInstance;
window.openSettings = () => SettingsManagerInstance.showSettingsModal();