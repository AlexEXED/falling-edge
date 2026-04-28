/**
 * 后处理校验器模块
 * 对应原方案中的 validator.py
 * 检查AI输出的一致性和合法性
 */

class Validator {
    constructor() {
        this.lastState = null;
        this.lastEvent = null;
    }

    // 验证AI输出
    validateAIOutput(aiOutput, toolCalls = []) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        // 1. 检查数值自造
        this.checkNumericalFabrication(aiOutput, toolCalls, errors);

        // 2. 检查实体存在性
        this.checkEntityExistence(aiOutput, errors, warnings);

        // 3. 检查位置连续性
        this.checkLocationContinuity(aiOutput, errors);

        // 4. 检查货舱超载
        this.checkCargoOverload(warnings);

        // 5. 检查工具调用必要性
        this.checkToolCallNecessity(aiOutput, toolCalls, suggestions);

        // 6. 检查状态一致性
        this.checkStateConsistency(errors);

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            suggestions: suggestions,
            summary: errors.length > 0 
                ? `发现 ${errors.length} 个错误，${warnings.length} 个警告`
                : `验证通过，${warnings.length} 个警告需要注意`
        };
    }

    // 检查数值自造
    checkNumericalFabrication(aiOutput, toolCalls, errors) {
        // 匹配数值模式：造成X点伤害、获得X信用点等
        const numericalPatterns = [
            /造成\s*(\d+)\s*点伤害/,
            /获得\s*(\d+)\s*信用点/,
            /消耗\s*(\d+)\s*燃料/,
            /恢复\s*(\d+)\s*生命值/,
            /损失\s*(\d+)\s*护盾/
        ];

        const foundNumbers = [];
        
        numericalPatterns.forEach(pattern => {
            const matches = aiOutput.match(pattern);
            if (matches) {
                foundNumbers.push({
                    pattern: pattern.source,
                    value: parseInt(matches[1]),
                    context: matches[0]
                });
            }
        });

        // 检查是否有对应的工具调用
        if (foundNumbers.length > 0) {
            const hasCombatTool = toolCalls.some(call => 
                call.tool === 'calculate_battle'
            );
            const hasResourceTool = toolCalls.some(call => 
                call.tool === 'update_resources'
            );

            foundNumbers.forEach(num => {
                if (num.pattern.includes('伤害') && !hasCombatTool) {
                    errors.push(`数值自造: "${num.context}" 但没有调用战斗计算工具`);
                }
                if ((num.pattern.includes('信用点') || num.pattern.includes('燃料') || 
                     num.pattern.includes('生命值') || num.pattern.includes('护盾')) && !hasResourceTool) {
                    errors.push(`数值自造: "${num.context}" 但没有调用资源更新工具`);
                }
            });
        }
    }

    // 检查实体存在性
    checkEntityExistence(aiOutput, errors, warnings) {
        const currentState = State.exportState();
        
        // 提取提到的物品名称
        const mentionedItems = this.extractMentionedItems(aiOutput);
        
        mentionedItems.forEach(item => {
            // 检查是否在物品清单中
            const inInventory = currentState.inventory.items.some(
                invItem => invItem.name === item
            );
            
            // 检查是否在船员中
            const inCrew = currentState.crew.some(
                crewMember => crewMember.name === item
            );
            
            // 检查是否在任务中
            const inMissions = currentState.missions.active.some(
                mission => mission.name === item
            ) || currentState.missions.completed.some(
                mission => mission.name === item
            );

            if (!inInventory && !inCrew && !inMissions) {
                // 可能是新引入的实体，给出警告而不是错误
                warnings.push(`未识别的实体: "${item}" - 确保这是游戏内有效实体`);
            }
        });

        // 检查提到的飞船系统
        const shipSystems = ['武器', '引擎', '护盾', '传感器', '货舱'];
        const mentionedSystems = shipSystems.filter(sys => 
            aiOutput.includes(sys)
        );

        mentionedSystems.forEach(sys => {
            // 验证系统状态
            const systemKey = this.getSystemKey(sys);
            if (systemKey && currentState.ship.systems[systemKey]) {
                // 系统存在，检查状态
                const systemValue = currentState.ship.systems[systemKey];
                if (systemValue.includes('损坏') || systemValue.includes('故障')) {
                    warnings.push(`提到的系统 "${sys}" 当前状态为: ${systemValue}`);
                }
            }
        });
    }

    // 检查位置连续性
    checkLocationContinuity(aiOutput, errors) {
        const currentLocation = State.state.captain.location;
        const lastLocation = this.lastEvent?.location;
        
        // 提取提到的位置
        const locationPattern = /在\s*([^，。！？]+?)\s*(?:进行|执行|前往|到达|离开)/;
        const match = aiOutput.match(locationPattern);
        
        if (match) {
            const mentionedLocation = match[1].trim();
            
            // 检查位置变化是否合理
            if (lastLocation && mentionedLocation !== currentLocation && mentionedLocation !== lastLocation) {
                // 检查是否有航行工具调用
                const hasNavigation = aiOutput.includes('航行') || 
                                     aiOutput.includes('跃迁') || 
                                     aiOutput.includes('前往');
                
                if (!hasNavigation) {
                    errors.push(`位置跳跃: 从 "${lastLocation}" 到 "${mentionedLocation}" 没有航行描述`);
                }
            }
        }
    }

    // 检查货舱超载
    checkCargoOverload(warnings) {
        const currentState = State.state;
        const cargoUsed = currentState.ship.cargo_used;
        const cargoCapacity = currentState.ship.cargo_capacity;
        
        if (cargoUsed > cargoCapacity) {
            warnings.push(`货舱超载: 使用 ${cargoUsed}/${cargoCapacity} (${Math.round(cargoUsed/cargoCapacity*100)}%)`);
        } else if (cargoUsed > cargoCapacity * 0.8) {
            warnings.push(`货舱接近满载: 使用 ${cargoUsed}/${cargoCapacity} (${Math.round(cargoUsed/cargoCapacity*100)}%)`);
        }
    }

    // 检查工具调用必要性
    checkToolCallNecessity(aiOutput, toolCalls, suggestions) {
        const scenarios = [
            {
                keywords: ['攻击', '战斗', '射击', '开火', '命中', '伤害'],
                requiredTool: 'calculate_battle',
                description: '战斗场景'
            },
            {
                keywords: ['购买', '出售', '交易', '价格', '信用点'],
                requiredTool: 'trade',
                description: '交易场景'
            },
            {
                keywords: ['航行', '跃迁', '前往', '目的地', '燃料消耗'],
                requiredTool: 'navigate',
                description: '航行场景'
            },
            {
                keywords: ['技能', '检定', '尝试', '成功率', '难度'],
                requiredTool: 'roll_check',
                description: '技能检定'
            },
            {
                keywords: ['时间', '小时', '天', '推进', '等待'],
                requiredTool: 'time_advance',
                description: '时间推进'
            }
        ];

        scenarios.forEach(scenario => {
            const hasKeyword = scenario.keywords.some(keyword => 
                aiOutput.includes(keyword)
            );
            
            const hasTool = toolCalls.some(call => 
                call.tool === scenario.requiredTool
            );

            if (hasKeyword && !hasTool) {
                suggestions.push(`建议调用 ${scenario.requiredTool} 工具处理${scenario.description}`);
            }
        });
    }

    // 检查状态一致性
    checkStateConsistency(errors) {
        const currentState = State.state;
        
        // 检查数值合法性
        this.checkValueValidity(currentState.captain.health, '舰长生命值', 0, 100, errors);
        this.checkValueValidity(currentState.captain.energy, '舰长精力', 0, 100, errors);
        this.checkValueValidity(currentState.ship.hull, '船体完整性', 0, 100, errors);
        this.checkValueValidity(currentState.ship.shield, '护盾能量', 0, 100, errors);
        this.checkValueValidity(currentState.ship.fuel, '燃料储备', 0, 100, errors);
        
        // 检查信用点不为负
        if (currentState.captain.credits < 0) {
            errors.push(`信用点为负值: ${currentState.captain.credits}€`);
        }
        
        // 检查物品数量不为负
        currentState.inventory.items.forEach(item => {
            if (item.count < 0) {
                errors.push(`物品数量为负: ${item.name} (${item.count})`);
            }
        });
    }

    // 检查数值有效性
    checkValueValidity(value, label, min, max, errors) {
        if (value < min) {
            errors.push(`${label} 低于最小值: ${value} < ${min}`);
        }
        if (value > max) {
            errors.push(`${label} 超过最大值: ${value} > ${max}`);
        }
        if (isNaN(value)) {
            errors.push(`${label} 不是有效数值: ${value}`);
        }
    }

    // 提取提到的物品
    extractMentionedItems(text) {
        // 简单模式匹配
        const patterns = [
            /使用\s*([^，。！？]+)/,
            /获得\s*([^，。！？]+)/,
            /失去\s*([^，。！？]+)/,
            /装备\s*([^，。！？]+)/,
            /见到\s*([^，。！？]+)/,
            /与\s*([^，。！？]+?)\s*(?:对话|交谈|见面)/
        ];

        const items = new Set();
        
        patterns.forEach(pattern => {
            const matches = text.match(new RegExp(pattern, 'g'));
            if (matches) {
                matches.forEach(match => {
                    const item = match.replace(pattern, '$1').trim();
                    // 过滤掉常见动词和连接词
                    if (item && !this.isCommonWord(item)) {
                        items.add(item);
                    }
                });
            }
        });

        return Array.from(items);
    }

    // 判断是否为常见词
    isCommonWord(word) {
        const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '一些', '这个', '那个'];
        return commonWords.includes(word) || word.length < 2;
    }

    // 获取系统键名
    getSystemKey(chineseName) {
        const mapping = {
            '武器': 'weapons',
            '引擎': 'engines',
            '护盾': 'shield', // 注意：护盾在ship.shield中，不在systems中
            '传感器': 'sensors',
            '货舱': 'cargo'
        };
        return mapping[chineseName];
    }

    // 记录事件用于连续性检查
    recordEvent(event) {
        this.lastEvent = event;
        this.lastState = State.exportState();
    }

    // 验证工具调用结果
    validateToolCallResult(toolCall, result) {
        const issues = [];

        if (result.error) {
            issues.push(`工具调用失败: ${result.message}`);
            return issues;
        }

        // 根据工具类型进行特定验证
        switch (toolCall.tool) {
            case 'calculate_battle':
                issues.push(...this.validateBattleResult(result));
                break;
            case 'update_resources':
                issues.push(...this.validateResourceUpdate(result));
                break;
            case 'trade':
                issues.push(...this.validateTradeResult(result));
                break;
            case 'navigate':
                issues.push(...this.validateNavigationResult(result));
                break;
        }

        return issues;
    }

    // 验证战斗结果
    validateBattleResult(result) {
        const issues = [];
        
        if (result.result.hit) {
            if (result.result.damage <= 0) {
                issues.push('战斗结果异常: 命中但伤害为0或负数');
            }
            if (result.result.hitChance < 0 || result.result.hitChance > 100) {
                issues.push(`命中率异常: ${result.result.hitChance}%`);
            }
        }
        
        return issues;
    }

    // 验证资源更新
    validateResourceUpdate(result) {
        const issues = [];
        const currentState = State.state;
        
        // 检查资源是否存在
        if (result.result.resource === 'credits') {
            if (currentState.captain.credits < 0) {
                issues.push('信用点更新后为负值');
            }
        } else if (result.result.resource === 'fuel') {
            if (currentState.ship.fuel < 0 || currentState.ship.fuel > 100) {
                issues.push(`燃料值异常: ${currentState.ship.fuel}%`);
            }
        }
        
        return issues;
    }

    // 验证交易结果
    validateTradeResult(result) {
        const issues = [];
        
        if (result.result.type === 'buy') {
            // 购买后检查信用点
            if (State.state.captain.credits < 0) {
                issues.push('购买后信用点为负');
            }
        }
        
        return issues;
    }

    // 验证航行结果
    validateNavigationResult(result) {
        const issues = [];
        
        if (result.result.fuelCost <= 0) {
            issues.push('燃料消耗为0或负数');
        }
        
        if (result.result.distance <= 0) {
            issues.push('航行距离为0或负数');
        }
        
        return issues;
    }

    // 生成验证报告
    generateValidationReport(aiOutput, toolCalls, toolResults = []) {
        const validation = this.validateAIOutput(aiOutput, toolCalls);
        
        // 添加工具调用结果验证
        const toolIssues = [];
        toolResults.forEach((result, index) => {
            if (index < toolCalls.length) {
                const issues = this.validateToolCallResult(toolCalls[index], result);
                toolIssues.push(...issues);
            }
        });
        
        if (toolIssues.length > 0) {
            validation.warnings.push(...toolIssues);
        }
        
        return {
            ...validation,
            toolIssues: toolIssues,
            timestamp: new Date().toISOString(),
            aiOutputLength: aiOutput.length,
            toolCallCount: toolCalls.length
        };
    }
}

// 创建全局校验器实例
const ValidatorInstance = new Validator();