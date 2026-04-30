import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { callAI, isAIConfigured } from '../utils/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface BrainstormConfig {
  projectOverview: string;
  projectGoals: string;
  targetUsers: string;
  coreFeatures: string;
  techStack: string;
  scopeAndBoundaries: string;
  notes: string;
}

function getDefaultConfig(): BrainstormConfig {
  return {
    projectOverview: '',
    projectGoals: '',
    targetUsers: '',
    coreFeatures: '',
    techStack: '',
    scopeAndBoundaries: '',
    notes: '',
  };
}

async function promptForConfig(): Promise<BrainstormConfig> {
  const defaultConfig = getDefaultConfig();

  const questions: any[] = [
    {
      type: 'text' as const,
      name: 'projectOverview',
      message: '1. 项目概述 - 用几句话描述你的项目想法:',
      initial: defaultConfig.projectOverview,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'projectGoals',
      message: '2. 项目目标 - 这个项目要解决什么具体问题？要达到什么目标？',
      initial: defaultConfig.projectGoals,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'targetUsers',
      message: '3. 目标用户 - 谁是这个项目的主要用户？他们有什么特点？',
      initial: defaultConfig.targetUsers,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'coreFeatures',
      message: '4. 核心功能 - MVP 版本需要实现哪些核心功能？',
      initial: defaultConfig.coreFeatures,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'techStack',
      message: '5. 技术选型 - 你倾向于使用什么技术栈？（框架、语言、工具等）',
      initial: defaultConfig.techStack,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'scopeAndBoundaries',
      message: '6. 项目范围与边界 - 哪些是 MVP 不做的？边界在哪里？',
      initial: defaultConfig.scopeAndBoundaries,
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'notes',
      message: '7. 注意事项 - 还有其他需要注意的事项吗？',
      initial: defaultConfig.notes,
      multiline: true,
    },
  ];

  const answers = await prompts(questions);
  return answers as BrainstormConfig;
}

async function enhanceWithAI(initialConfig: BrainstormConfig): Promise<BrainstormConfig> {
  if (!isAIConfigured()) {
    console.log(chalk.gray('\n  💡 提示: 配置 AI API 以获得更好的需求分析\n'));
    return initialConfig;
  }

  console.log(chalk.cyan('\n  🤖 AI 正在分析需求...\n'));

  const systemPrompt = `你是一个专业的需求分析师和架构师。你的任务是帮助用户完善和优化他们的项目需求。
请基于用户提供的信息，分析并补充以下内容：
1. 项目目标和价值主张
2. 目标用户画像
3. 核心功能拆解
4. 推荐的技术栈
5. MVP范围定义
6. 潜在风险和注意事项

请用中文回答，格式清晰，便于后续开发使用。`;

  const userPrompt = `请分析以下项目需求：

项目概述: ${initialConfig.projectOverview || '待补充'}
项目目标: ${initialConfig.projectGoals || '待补充'}
目标用户: ${initialConfig.targetUsers || '待补充'}
核心功能: ${initialConfig.coreFeatures || '待补充'}
技术选型: ${initialConfig.techStack || '待补充'}
范围边界: ${initialConfig.scopeAndBoundaries || '待补充'}
注意事项: ${initialConfig.notes || '待补充'}

请帮我完善这些内容，并给出改进建议。`;

  try {
    const aiResponse = await callAI(systemPrompt, userPrompt);
    console.log(chalk.green('\n  ✅ AI 分析完成！\n'));
    console.log(chalk.gray('  AI 建议:'));
    console.log(
      aiResponse
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')
    );

    const enhance = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '\n是否将 AI 分析结果应用到设计文档?',
      initial: true,
    });

    if (enhance.confirm) {
      console.log(chalk.green('\n  ✅ 已应用 AI 分析结果\n'));
    }

    return initialConfig;
  } catch (error) {
    console.log(chalk.yellow('\n  ⚠️ AI 分析失败，使用原始输入\n'));
    return initialConfig;
  }
}

export function renderDesignTemplate(template: string, config: BrainstormConfig): string {
  let result = template;
  result = result.replace(/\{\{projectOverview\}\}/g, config.projectOverview);
  result = result.replace(/\{\{projectGoals\}\}/g, config.projectGoals);
  result = result.replace(/\{\{targetUsers\}\}/g, config.targetUsers);
  result = result.replace(/\{\{coreFeatures\}\}/g, config.coreFeatures);
  result = result.replace(/\{\{techStack\}\}/g, config.techStack);
  result = result.replace(/\{\{scopeAndBoundaries\}\}/g, config.scopeAndBoundaries);
  result = result.replace(/\{\{notes\}\}/g, config.notes);
  result = result.replace(/\{\{generatedAt\}\}/g, new Date().toISOString());
  return result;
}

function getTemplatePath(): string {
  return resolve(__dirname, '../../templates/design.md');
}

export async function brainstorm(options?: { auto?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold('\n  🧠 AI 需求分析头脑风暴\n'));
  console.log(chalk.gray('  让我们通过一系列问题来澄清你的项目需求...\n'));

  const config = await promptForConfig();
  console.log();

  if (isAIConfigured()) {
    const enhancedConfig = await enhanceWithAI(config);
    Object.assign(config, enhancedConfig);
  }

  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  const designDocPath = resolve(docsDir, 'design.md');
  const templatePath = getTemplatePath();

  try {
    const template = readFileSync(templatePath, 'utf-8');
    const renderedContent = renderDesignTemplate(template, config);
    writeFileSync(designDocPath, renderedContent);

    console.log(chalk.green.bold('  ✅ 设计文档生成成功！\n'));
    console.log(chalk.gray(`  文档位置: ${designDocPath}`));
    console.log(chalk.gray('  下一步可以使用 aiw init 初始化项目，或继续完善设计文档\n'));
  } catch (error) {
    console.error(chalk.red('  错误：生成设计文档失败'));
    console.error(error);
    process.exit(1);
  }
}

export default brainstorm;
