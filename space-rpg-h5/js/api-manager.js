/**
 * AI API 管理器 - 基于开源项目最佳实践重构
 * 支持主流AI平台：DeepSeek, OpenAI, Claude, Qwen, GLM, 自定义API
 * 参考：https://developer.baidu.com/article/detail.html?id=3595831
 * 参考：https://jishuzhan.net/article/1992522487771496450
 * 版本：1.0.1 (修复静态方法调用问题)
 */

class APIManager {
    constructor() {
        this.config = this.loadConfig();
        this.currentProvider = this.config.currentProvider || 'deepseek';
        this.apiKey = this.config.apiKey || '';
        this.baseURLs = {
            deepseek: 'https://api.deepseek.com/v1',
            openai: 'https://api.openai.com/v1',
            claude: 'https://api.anthropic.com/v1',
            qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            glm: 'https://open.bigmodel.cn/api/paas/v4',
            custom: this.config.customBaseURL || ''
        };
        
        this.models = {
            deepseek: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
            openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
            claude: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
            qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            glm: ['glm-4', 'glm-4v', 'glm-3-turbo'],
            custom: ['custom-model']
        };
        
        this.currentModel = this.config.currentModel || this.models[this.currentProvider][0];
        this.enabled = this.config.enabled || false;
        this.temperature = this.config.temperature || 0.7;
        this.maxTokens = this.config.maxTokens || 500;
        
        // 会话历史管理
        this.sessionHistory = [];
        this.maxHistoryLength = 10;
        
        // 请求统计
        this.requestStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0
        };
        
        // 错误处理配置
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
        
        console.log('APIManager 初始化完成，当前提供商:', this.currentProvider);
    }
    
    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const config = localStorage.getItem('spaceRPG_APIConfig');
            return config ? JSON.parse(config) : {};
        } catch (error) {
            console.error('加载API配置失败:', error);
            return {};
        }
    }
    
    /**
     * 保存配置（含 API Key 持久化到 localStorage）
     */
    saveConfig() {
        try {
            const config = {
                currentProvider: this.currentProvider,
                apiKey: this.apiKey,
                currentModel: this.currentModel,
                enabled: this.enabled,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                customBaseURL: this.baseURLs.custom
            };
            localStorage.setItem('spaceRPG_APIConfig', JSON.stringify(config));
            console.log('✅ API配置已保存（含密钥）');
        } catch (error) {
            console.error('保存API配置失败:', error);
        }
    }

    /**
     * 重置配置（对应 settings-manager 中的 resetAPIConfig）
     */
    resetConfig() {
        this.currentProvider = 'deepseek';
        this.apiKey = '';
        this.currentModel = this.models['deepseek'][0];
        this.enabled = false;
        this.temperature = 0.7;
        this.maxTokens = 500;
        this.baseURLs.custom = '';
        this.saveConfig();
        console.log('✅ API配置已重置');
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        if (newConfig.currentProvider) this.currentProvider = newConfig.currentProvider;
        if (newConfig.apiKey !== undefined) this.apiKey = newConfig.apiKey;
        if (newConfig.currentModel) this.currentModel = newConfig.currentModel;
        if (newConfig.enabled !== undefined) this.enabled = newConfig.enabled;
        if (newConfig.temperature !== undefined) this.temperature = newConfig.temperature;
        if (newConfig.maxTokens !== undefined) this.maxTokens = newConfig.maxTokens;
        if (newConfig.customBaseURL) this.baseURLs.custom = newConfig.customBaseURL;
        
        this.saveConfig();
    }
    
    /**
     * 获取当前配置
     */
    getConfig() {
        return {
            currentProvider: this.currentProvider,
            apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : '',
            currentModel: this.currentModel,
            enabled: this.enabled,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            customBaseURL: this.baseURLs.custom,
            stats: this.requestStats
        };
    }
    
    /**
     * 测试API连接
     */
    async testConnection() {
        if (!this.apiKey) {
            return {
                success: false,
                message: '未配置API密钥',
                hint: '请在设置中填写API Key后重试'
            };
        }

        try {
            const endpoint = this.getAPIEndpoint();
            const headers = this.getRequestHeaders();

            // 构造验证提示：时间戳 + 随机种子，本地无法预测AI的回复内容
            const verifySeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const verifyTime = new Date().toLocaleString('zh-CN');
            const captainName = '舰长'; // 可从gameState读取

            const messages = [
                {
                    role: 'system',
                    content: `你是一个连接验证程序。请严格按以下步骤执行，不要添加任何多余内容：
1. 用中文写一句简短的科幻风格问候语（不超过20字），必须包含"星辰"这个词
2. 换行
3. 输出 [VERIFY:${verifySeed}]
4. 换行
5. 用3个中文词描述此刻你的状态（如：清醒/好奇/活跃）

只输出以上内容，不要输出其他任何文字。`
                },
                {
                    role: 'user',
                    content: `验证时间: ${verifyTime} | 种子: ${verifySeed}`
                }
            ];
            const body = this.buildRequestBody(messages);

            const t0 = performance.now();
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            const latency = Math.round(performance.now() - t0);

            if (!resp.ok) {
                let detail = '';
                try { detail = await resp.text(); } catch (_) {}
                let reason = `HTTP ${resp.status}`;
                if (resp.status === 401) reason += ' — API密钥无效或已过期';
                else if (resp.status === 403) reason += ' — 权限不足，检查账户余额或访问限制';
                else if (resp.status === 429) reason += ' — 请求频率超限，稍后重试';
                else if (resp.status === 500) reason += ' — 服务端内部错误，非本地问题';
                else if (resp.status === 404) reason += ' — 接口地址不存在，检查提供商/模型是否匹配';
                else if (detail) reason += ` — ${detail.substring(0, 200)}`;
                return { success: false, message: reason, httpStatus: resp.status, latency };
            }

            const data = await resp.json();
            const content = (data.choices?.[0]?.message?.content || '').trim();
            const modelUsed = data.model || this.currentModel;
            const usage = data.usage || {};

            // 验证AI是否真正处理了请求（回显了种子）
            const seedEchoed = content.includes(verifySeed);

            return {
                success: true,
                message: `模型 ${modelUsed} 响应正常`,
                response: content,
                model: modelUsed,
                usage: usage,
                latency: latency,
                verifySeed: verifySeed,
                verifyTime: verifyTime,
                verified: seedEchoed
            };

        } catch (error) {
            let reason = error.message || '未知错误';
            if (reason.includes('Failed to fetch') || reason.includes('NetworkError')) {
                reason = '网络不可达 — 可能是CORS限制或网络断开（本地file://打开常见）';
            } else if (reason.includes('timeout')) {
                reason = '请求超时 — 服务器未在时间内响应';
            }
            return { success: false, message: reason, error: error };
        }
    }
    
    /**
     * 发送API请求（核心方法）
     */
    async sendRequest(prompt, isTest = false) {
        if (!this.enabled || !this.apiKey) {
            return {
                success: false,
                message: 'API功能未启用或未配置API密钥',
                fallback: true
            };
        }
        
        this.requestStats.totalRequests++;
        
        try {
            // 构建消息历史
            const messages = this.buildMessages(prompt);
            
            // 构建请求体
            const requestBody = this.buildRequestBody(messages);
            
            // 获取API端点
            const endpoint = this.getAPIEndpoint();
            
            // 获取请求头
            const headers = this.getRequestHeaders();
            
            console.log(`发送API请求到 ${this.currentProvider}，模型: ${this.currentModel}`);
            
            // 发送请求（带重试机制）
            const response = await this.sendWithRetry(endpoint, headers, requestBody);
            
            // 处理响应
            const result = await this.processResponse(response);
            
            // 更新统计
            this.requestStats.successfulRequests++;
            if (result.usage) {
                this.requestStats.totalTokens += result.usage.total_tokens || 0;
            }
            
            // 添加到会话历史
            if (!isTest) {
                this.addToHistory('user', prompt);
                this.addToHistory('assistant', result.content);
            }
            
            return {
                success: true,
                result: result.content,
                usage: result.usage,
                model: result.model
            };
            
        } catch (error) {
            this.requestStats.failedRequests++;
            console.error('API请求失败:', error);
            
            return {
                success: false,
                message: `API请求失败: ${error.message}`,
                error: error,
                fallback: true
            };
        }
    }
    
    /**
     * 构建消息历史
     */
    buildMessages(prompt) {
        const messages = [];
        
        // 从世界观模块动态构建系统提示
        const loreSummary = (window.Lore) ? window.Lore.buildSystemLore() : '（世界观模块未加载）';
        
        // 动态读取飞船名：优先 Lore → 回退 DEFAULT_LORE → 兜底默认
        const shipName = (window.Lore && window.Lore.data && window.Lore.data.playerShip)
            ? window.Lore.data.playerShip.name
            : (typeof DEFAULT_LORE !== 'undefined' && DEFAULT_LORE.playerShip)
                ? DEFAULT_LORE.playerShip.name
                : '飞船';
        
        // 使用 PROMPT_TEMPLATES.systemRole 模板（如果可用），否则回退到内联默认
        let systemContent;
        if (typeof PROMPT_TEMPLATES !== 'undefined' && PROMPT_TEMPLATES.systemRole) {
            systemContent = PROMPT_TEMPLATES.systemRole
                .replace(/\{\{shipName\}\}/g, shipName)
                .replace(/\{\{loreSummary\}\}/g, loreSummary);
        } else {
            // 回退：模板不可用时使用内联版本
            systemContent = `你是${shipName}的船载AI终端。这是一个沉浸式太空RPG，所有交互通过船载终端进行。

${loreSummary}

你的行为准则：
1. 始终以船载AI终端的身份回应，用 > 前缀表示终端输出
2. 保持沉浸感，绝不使用"游戏"、"玩家"等出戏词汇——舰长就是舰长
3. 基于上述世界观设定生成合理的叙事，不虚构与设定矛盾的内容
4. NPC 对话要符合其种族特征和性格
5. 根据声望关系影响 NPC 态度和可用选项
6. 保持语气专业但友好，偶尔展现 AI 的独特幽默感

当前游戏状态会在每次请求中提供。请严格基于提供的状态事实回复。`;
        }
        
        messages.push({
            role: 'system',
            content: systemContent
        });
        
        // ── Token 预算控制 ──
        // 粗略估算：1中文字≈2 token，1英文词≈1.5 token；系统+用户提示已占用的 token
        const estimateTokens = (text) => Math.ceil(text.length * 1.5);
        const maxContextTokens = Math.min(this.maxTokens * 6, 8000); // 上下文预算（输出token的6倍，上限8k）
        let usedTokens = estimateTokens(systemContent) + estimateTokens(prompt);

        // 添加会话历史（按时间倒序，优先保留最近的）
        const historySlice = this.sessionHistory.slice(-this.maxHistoryLength);
        const fittingHistory = [];
        for (let i = historySlice.length - 1; i >= 0; i--) {
            const entry = historySlice[i];
            const entryTokens = estimateTokens(entry.content || '');
            if (usedTokens + entryTokens > maxContextTokens) break; // 超预算则停止
            fittingHistory.unshift(entry);
            usedTokens += entryTokens;
        }
        messages.push(...fittingHistory);

        // 注入持久化记忆（如果有且预算允许）
        if (window.Game && window.Game.persistentMemories && window.Game.persistentMemories.length > 0) {
            const memoriesText = window.Game.persistentMemories.join('\n');
            const memTokens = estimateTokens(memoriesText);
            if (usedTokens + memTokens <= maxContextTokens) {
                messages.push({
                    role: 'system',
                    content: `【近期记忆摘要】\n${memoriesText}`
                });
                usedTokens += memTokens;
            }
        }
        
        // 添加当前消息
        messages.push({
            role: 'user',
            content: prompt
        });
        
        console.log(`[Token预算] 预估 ${usedTokens} / ${maxContextTokens} tokens（历史 ${fittingHistory.length} 条）`);
        return messages;
    }
    
    /**
     * 构建请求体
     */
    buildRequestBody(messages) {
        const baseBody = {
            model: this.currentModel,
            messages: messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: false
        };
        
        // 提供商特定的参数
        switch (this.currentProvider) {
            case 'claude':
                return {
                    ...baseBody,
                    max_tokens: this.maxTokens,
                    system: messages.find(m => m.role === 'system')?.content || ''
                };
            case 'qwen':
                return {
                    ...baseBody,
                    stream: false
                };
            case 'glm':
                return {
                    ...baseBody,
                    stream: false
                };
            default:
                return baseBody;
        }
    }
    
    /**
     * 获取API端点
     */
    getAPIEndpoint() {
        let baseURL;
        
        // 只有自定义提供商才使用用户输入的地址
        if (this.currentProvider === 'custom') {
            baseURL = this.baseURLs.custom || '';
        } else {
            // 主流提供商使用预定义的官方地址
            baseURL = this.baseURLs[this.currentProvider];
        }
        
        // 确保baseURL不为空
        if (!baseURL) {
            console.warn(`未找到提供商 ${this.currentProvider} 的API地址，使用默认地址`);
            baseURL = 'https://api.openai.com/v1';
        }
        
        switch (this.currentProvider) {
            case 'deepseek':
            case 'openai':
            case 'custom':
                return `${baseURL}/chat/completions`;
            case 'claude':
                return `${baseURL}/messages`;
            case 'qwen':
                return `${baseURL}/chat/completions`;
            case 'glm':
                return `${baseURL}/chat/completions`;
            default:
                return `${baseURL}/chat/completions`;
        }
    }
    
    /**
     * 获取请求头
     */
    getRequestHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // 添加认证头
        switch (this.currentProvider) {
            case 'deepseek':
            case 'openai':
            case 'custom':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
            case 'claude':
                headers['x-api-key'] = this.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;
            case 'qwen':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
            case 'glm':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
        }
        
        return headers;
    }
    
    /**
     * 带重试机制的请求发送
     * ✅ 修复：添加超时控制
     */
    async sendWithRetry(endpoint, headers, body, retryCount = 0) {
        try {
            // ✅ 创建超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: { message: errorText } };
                    }
                    
                    // ✅ 改进的重试判断
                    if (this.shouldRetry(response.status) && retryCount < this.retryConfig.maxRetries) {
                        const delay = this.calculateRetryDelay(retryCount);
                        console.log(`请求失败 (${response.status})，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                        
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.sendWithRetry(endpoint, headers, body, retryCount + 1);
                    }
                    
                    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
                }
                
                return response;
                
            } catch (error) {
                clearTimeout(timeoutId);
                
                // ✅ 区分超时和其他错误
                if (error.name === 'AbortError') {
                    throw new Error('请求超时（30秒）');
                }
                
                if (retryCount < this.retryConfig.maxRetries) {
                    const delay = this.calculateRetryDelay(retryCount);
                    console.log(`网络错误，${delay}ms后重试 (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.sendWithRetry(endpoint, headers, body, retryCount + 1);
                }
                
                throw error;
            }
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    }
    
    /**
     * 检查是否需要重试
     */
    shouldRetry(statusCode) {
        // 5xx错误和429（速率限制）应该重试
        return statusCode >= 500 || statusCode === 429;
    }
    
    /**
     * 计算重试延迟（指数退避）
     */
    calculateRetryDelay(retryCount) {
        const delay = this.retryConfig.baseDelay * Math.pow(2, retryCount);
        return Math.min(delay, this.retryConfig.maxDelay);
    }
    
    /**
     * 处理响应
     * ✅ 修复：添加完整的验证和错误处理
     */
    async processResponse(response) {
        try {
            const data = await response.json();
            
            // ✅ 验证响应数据
            if (!data) {
                throw new Error('API返回空响应');
            }
            
            // ✅ 检查错误字段
            if (data.error) {
                throw new Error(`API错误: ${data.error.message || JSON.stringify(data.error)}`);
            }
            
            let content = '';
            let usage = {};
            let model = this.currentModel;
            
            switch (this.currentProvider) {
                case 'deepseek':
                case 'openai':
                case 'custom':
                case 'qwen':
                case 'glm':
                    // ✅ 严格验证
                    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                        throw new Error('API未返回任何选择');
                    }
                    content = data.choices[0]?.message?.content;
                    if (!content) {
                        throw new Error('无法从API响应中提取内容');
                    }
                    usage = data.usage || {};
                    model = data.model || this.currentModel;
                    break;
                    
                case 'claude':
                    // ✅ Claude特殊处理
                    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
                        throw new Error('Claude响应中没有content字段或为空');
                    }
                    content = data.content[0]?.text;
                    if (!content) {
                        throw new Error('无法从Claude响应中提取文本');
                    }
                    usage = data.usage || {};
                    model = data.model || this.currentModel;
                    break;
                    
                default:
                    // ✅ 通用降级处理
                    content = data.choices?.[0]?.message?.content 
                        || data.content?.[0]?.text 
                        || data.content 
                        || '';
                    if (!content) {
                        throw new Error('无法从响应中提取内容');
                    }
                    usage = data.usage || {};
                    model = data.model || this.currentModel;
            }
            
            return {
                content: content.trim(),
                usage: usage,
                model: model
            };
            
        } catch (error) {
            console.error('响应处理失败:', error);
            throw error;
        }
    }
    
    /**
     * 添加到会话历史
     */
    addToHistory(role, content) {
        this.sessionHistory.push({ role, content });
        
        // 限制历史长度
        if (this.sessionHistory.length > this.maxHistoryLength * 2) {
            this.sessionHistory = this.sessionHistory.slice(-this.maxHistoryLength);
        }
    }
    
    /**
     * 清空会话历史
     */
    clearHistory() {
        this.sessionHistory = [];
    }
    
    /**
     * 获取可用模型列表
     */
    getAvailableModels(provider = null) {
        const providerKey = provider || this.currentProvider;
        return this.models[providerKey] || [];
    }
    
    /**
     * 获取所有提供商
     */
    getProviders() {
        return Object.keys(this.models);
    }
    
    /**
     * 获取请求统计
     */
    getStats() {
        return {
            ...this.requestStats,
            successRate: this.requestStats.totalRequests > 0 
                ? (this.requestStats.successfulRequests / this.requestStats.totalRequests * 100).toFixed(1)
                : 0
        };
    }
    
    /**
     * 重置统计
     */
    resetStats() {
        this.requestStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0
        };
    }
    
    /**
     * 生成工具调用建议（AI分析玩家行动）
     * ✅ 修复：改进JSON解析和验证
     */
    async analyzeActionForTools(playerAction, gameState) {
        if (!this.enabled) {
            return {
                success: false,
                message: 'API未启用',
                suggestedTools: []
            };
        }
        
        try {
            // ✅ 改进的提示词，强制JSON格式
            const analysisPrompt = `你是一个游戏AI助手。分析玩家行动并建议需要调用的工具。

玩家行动: "${playerAction}"

当前游戏状态:
- 位置: ${gameState.location || '未知'}
- 状态: ${gameState.status || '正常'}
- 资源: ${JSON.stringify(gameState.resources || {})}

可用工具:
1. calculate_battle - 战斗计算
2. update_resources - 资源更新
3. roll_check - 技能检定
4. navigate - 航行
5. trade - 交易
6. time_advance - 时间推进
7. search_acts - 幕文件检索
8. check_rest_conditions - 检查休息条件

请严格按照以下JSON格式回复，不要其他内容:
{
  "suggested_tools": ["tool1", "tool2"],
  "reasoning": "分析理由",
  "priority": "high|medium|low",
  "confidence": 0.0-1.0
}`;

            const response = await this.sendRequest(analysisPrompt);
            
            if (!response.success) {
                return {
                    success: false,
                    message: response.message,
                    suggestedTools: []
                };
            }
            
            // ✅ 改进的JSON解析
            const result = this.parseToolAnalysis(response.result);
            
            if (result.success) {
                return {
                    success: true,
                    suggestedTools: result.suggestedTools,
                    reasoning: result.reasoning,
                    priority: result.priority,
                    confidence: result.confidence
                };
            } else {
                // ✅ 降级处理：使用关键字提取
                console.warn('JSON解析失败，使用关键字提取');
                const tools = this.extractToolsFromText(playerAction);
                return {
                    success: true,
                    suggestedTools: tools,
                    reasoning: '使用关键字提取的工具建议',
                    priority: 'medium',
                    confidence: 0.5
                };
            }
            
        } catch (error) {
            console.error('分析行动失败:', error);
            return {
                success: false,
                message: `分析失败: ${error.message}`,
                suggestedTools: []
            };
        }
    }
    
    /**
     * 安全的JSON解析方法
     * ✅ 新增：验证和清理JSON响应
     */
    parseToolAnalysis(text) {
        try {
            // 尝试直接解析
            const data = JSON.parse(text);
            
            // 验证必要字段
            if (!Array.isArray(data.suggested_tools)) {
                throw new Error('suggested_tools 必须是数组');
            }
            
            // 验证工具名称
            const validTools = [
                'calculate_battle', 'update_resources', 'roll_check',
                'navigate', 'trade', 'time_advance', 'search_acts',
                'check_rest_conditions'
            ];
            
            const suggestedTools = data.suggested_tools.filter(tool =>
                validTools.includes(tool)
            );
            
            return {
                success: true,
                suggestedTools: suggestedTools,
                reasoning: data.reasoning || '',
                priority: ['high', 'medium', 'low'].includes(data.priority) 
                    ? data.priority 
                    : 'medium',
                confidence: typeof data.confidence === 'number' 
                    ? Math.max(0, Math.min(1, data.confidence))
                    : 0.7
            };
            
        } catch (error) {
            console.error('JSON解析失败:', error);
            return { success: false };
        }
    }
    
    /**
     * 从文本中提取工具名称
     */
    extractToolsFromText(text) {
        const toolKeywords = {
            'calculate_battle': ['战斗', '攻击', '伤害', '命中', 'battle', 'combat', 'attack'],
            'update_resources': ['资源', '物品', '获得', '失去', 'resource', 'item', 'gain', 'lose'],
            'roll_check': ['检定', '技能', '概率', '成功', 'roll', 'check', 'skill', 'probability'],
            'navigate': ['航行', '移动', '前往', '旅行', 'navigate', 'travel', 'move', 'journey'],
            'trade': ['交易', '购买', '出售', '价格', 'trade', 'buy', 'sell', 'price'],
            'time_advance': ['时间', '等待', '休息', '推进', 'time', 'wait', 'rest', 'advance'],
            'search_acts': ['搜索', '查找', '历史', '记录', 'search', 'find', 'history', 'record'],
            'check_rest_conditions': ['休息', '睡眠', '恢复', '休息条件', 'rest', 'sleep', 'recover']
        };
        
        const suggestedTools = [];
        const lowerText = text.toLowerCase();
        
        for (const [tool, keywords] of Object.entries(toolKeywords)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    suggestedTools.push(tool);
                    break;
                }
            }
        }
        
        return [...new Set(suggestedTools)]; // 去重
    }
}

// 创建全局实例
const apiManagerInstance = new APIManager();

// ✅ 挂载到 window，使所有 JS 文件均可访问
window.APIManagerInstance = apiManagerInstance;

// 导出代理对象（便于测试页面和 settings-manager 使用）
window.APIManager = {
    getProviders: () => apiManagerInstance.getProviders(),
    getAvailableModels: (provider) => apiManagerInstance.getAvailableModels(provider),
    getConfig: () => apiManagerInstance.getConfig(),
    updateConfig: (config) => apiManagerInstance.updateConfig(config),
    testConnection: () => apiManagerInstance.testConnection(),
    sendRequest: (message) => apiManagerInstance.sendRequest(message),
    analyzeActionForTools: (action, state) => apiManagerInstance.analyzeActionForTools(action, state),
    resetStats: () => apiManagerInstance.resetStats(),
    resetConfig: () => apiManagerInstance.resetConfig(),
    instance: apiManagerInstance
};
