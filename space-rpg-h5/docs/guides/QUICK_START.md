# 快速开始指南 - API 修复验证

## 🚀 快速验证步骤

### 第一步：打开游戏

1. 在浏览器中打开 `index.html`
2. 打开浏览器开发者工具（F12）
3. 切换到"控制台"标签页

### 第二步：验证 APIManagerInstance 修复

在浏览器控制台输入：
```javascript
console.log(APIManagerInstance);
```

**预期结果：**
```
APIManager {
  config: {...},
  currentProvider: "deepseek",
  apiKey: "",
  baseURLs: {...},
  ...
}
```

✅ 如果看到 APIManager 对象，说明修复成功！

### 第三步：配置 API 密钥

1. 点击页面上的 "API 设置" 链接（或直接打开 `api-settings.html`）
2. 选择 AI 服务提供商（推荐 DeepSeek）
3. 输入您的 API 密钥
4. 选择模型
5. 点击"测试连接"按钮

**预期结果：**
- 显示 "✓ 连接成功！模型: xxx"

### 第四步：验证会话存储

在浏览器控制台输入：
```javascript
console.log(sessionStorage.getItem('spaceRPG_APIKey'));
```

**预期结果：**
```
"sk-xxx..." (您的 API 密钥)
```

✅ 如果看到密钥，说明会话存储成功！

### 第五步：验证页面刷新后密钥仍存在

1. 在控制台输入上面的命令，确认密钥存在
2. 按 F5 刷新页面
3. 再次在控制台输入命令

**预期结果：**
- 刷新前后密钥都存在

✅ 会话存储正常工作！

### 第六步：测试输入框与 AI 通信

1. 返回游戏主页面 `index.html`
2. 在底部输入框输入一条命令，例如：
   ```
   我想探索附近的星系
   ```
3. 按 Enter 或点击"执行"按钮

**预期结果：**
- 命令显示在终端
- AI 返回响应
- 没有错误信息

✅ 输入框与 AI 通信正常！

---

## 🔍 详细验证清单

### ✅ 修复 1：APIManagerInstance 未定义

| 检查项 | 方法 | 预期结果 |
|--------|------|--------|
| 全局变量存在 | `typeof APIManagerInstance` | `"object"` |
| 可访问实例 | `APIManagerInstance.enabled` | `true` 或 `false` |
| 方法可用 | `typeof APIManagerInstance.sendRequest` | `"function"` |

### ✅ 修复 2：API Key 持久化存储

| 检查项 | 方法 | 预期结果 |
|--------|------|--------|
| 会话存储方法 | `typeof APIManagerInstance.saveApiKeyToSession` | `"function"` |
| 加载方法 | `typeof APIManagerInstance.loadApiKeyFromSession` | `"function"` |
| 清除方法 | `typeof APIManagerInstance.clearApiKeyFromSession` | `"function"` |
| 密钥保存 | `sessionStorage.getItem('spaceRPG_APIKey')` | API 密钥字符串 |

### ✅ 修复 3：输入框与 AI 通信

| 检查项 | 方法 | 预期结果 |
|--------|------|--------|
| Game 对象存在 | `typeof window.Game` | `"object"` |
| 处理命令方法 | `typeof window.Game.processCommand` | `"function"` |
| UI 管理器 | `typeof window.UI` | `"object"` |
| 发送命令方法 | `typeof window.UI.sendCommand` | `"function"` |

---

## 🐛 常见问题排查

### 问题 1：控制台显示 "APIManagerInstance is not defined"

**原因：** 浏览器缓存或文件未更新

**解决方案：**
```javascript
// 方案 1：清除缓存
// 按 Ctrl+Shift+Delete 打开清除浏览数据
// 选择"缓存的图片和文件"，点击清除

// 方案 2：硬刷新
// 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)

// 方案 3：检查文件
// 打开 js/api-manager.js，搜索 "const APIManagerInstance"
// 确保该行存在
```

### 问题 2：API 密钥页面刷新后丢失

**原因：** 浏览器禁用了 sessionStorage 或使用了无痕模式

**解决方案：**
```javascript
// 检查 sessionStorage 是否可用
try {
    sessionStorage.setItem('test', 'test');
    console.log('✓ sessionStorage 可用');
    sessionStorage.removeItem('test');
} catch (e) {
    console.log('✗ sessionStorage 不可用:', e);
}

// 如果使用无痕模式，某些浏览器会禁用 sessionStorage
// 请在普通模式下使用
```

### 问题 3：输入框命令无响应

**原因：** Game 对象未初始化或 API 未启用

**解决方案：**
```javascript
// 检查 Game 对象
console.log('Game 对象:', window.Game);
console.log('API 启用状态:', APIManagerInstance.enabled);
console.log('API 密钥:', APIManagerInstance.apiKey ? '已设置' : '未设置');

// 检查错误信息
// 打开浏览器控制台的"错误"标签页
// 查看是否有红色错误信息
```

### 问题 4：测试连接失败

**原因：** API 密钥无效或网络问题

**解决方案：**
```javascript
// 验证 API 密钥格式
const apiKey = sessionStorage.getItem('spaceRPG_APIKey');
console.log('API 密钥长度:', apiKey ? apiKey.length : 0);
console.log('API 密钥前缀:', apiKey ? apiKey.substring(0, 10) : 'N/A');

// 检查网络连接
fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{role: 'user', content: 'test'}],
        max_tokens: 10
    })
}).then(r => console.log('响应状态:', r.status))
  .catch(e => console.log('网络错误:', e));
```

---

## 📊 性能检查

### 检查加载时间

在控制台输入：
```javascript
// 检查脚本加载时间
console.time('API Manager 初始化');
console.log('APIManager 已初始化');
console.timeEnd('API Manager 初始化');

// 检查会话存储操作时间
console.time('会话存储操作');
sessionStorage.setItem('test', 'value');
sessionStorage.getItem('test');
sessionStorage.removeItem('test');
console.timeEnd('会话存储操作');
```

### 检查内存使用

```javascript
// 获取内存信息（仅 Chrome）
if (performance.memory) {
    console.log('内存使用:', {
        已用: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        总计: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        限制: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    });
}
```

---

## 🎮 游戏功能测试

### 测试 1：基础命令

```
输入: /status
预期: 显示游戏状态信息

输入: /help
预期: 显示可用命令列表

输入: /rest
预期: 打开休息模态框
```

### 测试 2：AI 响应

```
输入: 我想探索附近的星系
预期: AI 返回叙事性响应

输入: 与商人交易
预期: AI 分析行动并调用相关工具

输入: 检查船体状态
预期: AI 返回船体信息
```

### 测试 3：错误处理

```
输入: (不输入任何内容，直接按 Enter)
预期: 无反应或显示提示

输入: 非常长的文本...（超过 1000 字符）
预期: 正确处理长文本，不崩溃
```

---

## 📝 日志收集

如需报告问题，请收集以下信息：

### 1. 浏览器信息
```javascript
console.log({
    浏览器: navigator.userAgent,
    语言: navigator.language,
    平台: navigator.platform,
    在线状态: navigator.onLine
});
```

### 2. 游戏状态
```javascript
console.log({
    Game: typeof window.Game,
    UI: typeof window.UI,
    APIManager: typeof window.APIManager,
    APIManagerInstance: typeof APIManagerInstance,
    API启用: APIManagerInstance.enabled,
    API提供商: APIManagerInstance.currentProvider,
    会话存储: !!sessionStorage.getItem('spaceRPG_APIKey')
});
```

### 3. 错误信息
```javascript
// 复制浏览器控制台中的所有红色错误信息
// 包括错误堆栈跟踪
```

---

## ✨ 成功标志

当您看到以下信息时，说明所有修复都成功了：

```
✅ APIManagerInstance 全局变量可访问
✅ API Key 保存到会话存储
✅ 页面刷新后 API Key 仍存在
✅ 输入框命令正确传递
✅ AI 返回响应
✅ 没有控制台错误
```

---

## 🎯 下一步

1. **配置 API 密钥**
   - 访问 `api-settings.html`
   - 输入您的 API 密钥
   - 测试连接

2. **开始游戏**
   - 返回 `index.html`
   - 在输入框输入命令
   - 享受游戏！

3. **反馈问题**
   - 如遇到问题，查看本指南的排查部分
   - 收集日志信息
   - 提交问题报告

---

## 📞 获取帮助

- 📖 查看 `API_FIX_REPORT.md` 了解详细修复信息
- 🔧 查看浏览器控制台获取错误信息
- 💬 检查网络连接和 API 密钥有效性

祝您游戏愉快！🚀
