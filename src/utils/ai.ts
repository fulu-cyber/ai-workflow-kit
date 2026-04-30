import { config } from 'dotenv';
import { existsSync } from 'fs';

config();

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  apiKey?: string;
  model?: string;
  baseURL?: string;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER as AIConfig['provider']) || 'mock';
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4';
  const baseURL = process.env.AI_BASE_URL;

  return { provider, apiKey, model, baseURL };
}

export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return config.provider !== 'mock' && !!config.apiKey;
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const config = getAIConfig();

  if (config.provider === 'mock') {
    return mockAIResponse(systemPrompt, userPrompt);
  }

  if (config.provider === 'openai') {
    return callOpenAI(systemPrompt, userPrompt, config, options);
  }

  if (config.provider === 'anthropic') {
    return callAnthropic(systemPrompt, userPrompt, config, options);
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch(config.baseURL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: options?.maxTokens ?? 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text || '';
}

function mockAIResponse(systemPrompt: string, userPrompt: string): string {
  console.log(chalk.cyan('\n  🤖 AI 模拟模式 - 返回模拟响应\n'));

  if (systemPrompt.includes('需求分析') || systemPrompt.includes('设计文档')) {
    return mockDesignDoc(userPrompt);
  }

  if (systemPrompt.includes('任务规划') || systemPrompt.includes('任务列表')) {
    return mockTaskList(userPrompt);
  }

  if (systemPrompt.includes('代码生成')) {
    return mockCodeGeneration(userPrompt);
  }

  return `模拟响应: ${userPrompt.substring(0, 100)}...`;
}

function mockDesignDoc(requirement: string): string {
  return `# 设计文档

## 项目概述
${requirement}

## 项目目标
开发一个基于用户需求的应用系统

## 目标用户
目标用户群体为需要使用该应用的所有用户

## 核心功能
1. 用户注册和登录功能
2. 核心业务功能模块
3. 数据管理和展示
4. 用户设置和配置

## 技术选型
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL
- 部署: Docker

## 项目范围与边界
MVP版本将实现核心功能，不包含高级特性

## 注意事项
暂无特殊注意事项`;
}

function mockTaskList(coreFeatures: string): string {
  return `### 任务 1: 项目初始化
- **描述**: 创建项目基础结构
- **预计时间**: 1 小时
- **依赖**: 无
**验收标准**:
- [ ] 项目结构创建完成
- [ ] 配置文件已设置

### 任务 2: 实现核心功能
- **描述**: 实现 ${coreFeatures.split('\n')[0] || '主要功能'}
- **预计时间**: 4 小时
- **依赖**: 任务 1
**验收标准**:
- [ ] 功能按设计实现
- [ ] 有对应的测试

### 任务 3: 测试和优化
- **描述**: 测试和性能优化
- **预计时间**: 2 小时
- **依赖**: 任务 2
**验收标准**:
- [ ] 所有测试通过
- [ ] 性能达标`;
}

function mockCodeGeneration(task: string): string {
  return `// 自动生成的代码示例
export function implementFeature() {
  console.log('实现功能: ${task}');
  return true;
}`;
}

import chalk from 'chalk';
