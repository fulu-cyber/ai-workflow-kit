import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { callAI, isAIConfigured } from '../utils/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface GenerationRequest {
  fileName: string;
  description: string;
  techStack?: string;
}

async function promptForGeneration(): Promise<GenerationRequest> {
  const questions: any[] = [
    {
      type: 'text' as const,
      name: 'fileName',
      message: '文件名 (例如: src/utils/helper.ts):',
      initial: 'src/utils/feature.ts',
    },
    {
      type: 'text' as const,
      name: 'description',
      message: '功能描述 (例如: 实现用户认证的工具函数):',
      initial: '',
      multiline: true,
    },
    {
      type: 'text' as const,
      name: 'techStack',
      message: '技术栈 (例如: TypeScript + React):',
      initial: 'TypeScript',
    },
  ];

  const answers = await prompts(questions);
  return answers as GenerationRequest;
}

async function generateCode(request: GenerationRequest): Promise<string> {
  if (!isAIConfigured()) {
    console.log(chalk.yellow('\n  ⚠️ AI 未配置，使用模拟代码生成\n'));
    return generateMockCode(request);
  }

  console.log(chalk.cyan('\n  🤖 AI 正在生成代码...\n'));

  const systemPrompt = `你是一个专业的全栈开发工程师。你的任务是根据用户的需求描述生成高质量的代码。
请遵循以下原则：
1. 代码要符合最佳实践
2. 包含适当的注释
3. 错误处理要完善
4. 遵循 SOLID 原则
5. 代码要简洁、易读、易维护

请生成完整的、可运行的代码，不要省略任何部分。`;

  const userPrompt = `请为以下功能生成代码：

文件名: ${request.fileName}
功能描述: ${request.description}
技术栈: ${request.techStack || 'TypeScript'}

请生成完整的代码文件内容。`;

  try {
    const code = await callAI(systemPrompt, userPrompt);
    console.log(chalk.green('\n  ✅ 代码生成完成！\n'));
    return code;
  } catch (error) {
    console.log(chalk.red('\n  ❌ AI 代码生成失败，使用模拟代码\n'));
    return generateMockCode(request);
  }
}

function generateMockCode(request: GenerationRequest): string {
  const fileName = request.fileName;
  const ext = fileName.split('.').pop() || 'ts';
  const funcName =
    fileName
      .split('/')
      .pop()
      ?.replace(/\.[^/.]+$/, '') || 'feature';

  if (ext === 'ts' || ext === 'tsx') {
    return `/**
 * ${request.description || 'Auto-generated feature module'}
 * @file ${fileName}
 */

export interface ${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Config {
  enabled?: boolean;
  timeout?: number;
}

export async function ${funcName}(config?: ${funcName.charAt(0).toUpperCase() + funcName.slice(1)}Config): Promise<void> {
  const options = {
    enabled: true,
    timeout: 5000,
    ...config,
  };

  console.log('Executing ${funcName} with config:', options);

  if (!options.enabled) {
    console.log('Feature is disabled');
    return;
  }

  // TODO: Implement ${funcName} functionality
  console.log('Feature "${funcName}" executed successfully');
}

export default ${funcName};
`;
  }

  return `// ${request.description || 'Auto-generated file'}\n\n// TODO: Implement ${request.fileName}\n`;
}

async function saveCode(fileName: string, code: string): Promise<void> {
  const fullPath = resolve(process.cwd(), fileName);
  const dir = dirname(fullPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (existsSync(fullPath)) {
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `文件 ${fileName} 已存在，是否覆盖?`,
      initial: false,
    });

    if (!response.overwrite) {
      console.log(chalk.gray('\n  跳过文件写入\n'));
      return;
    }
  }

  writeFileSync(fullPath, code);
  console.log(chalk.green(`\n  ✅ 代码已保存到 ${fileName}\n`));
}

export async function generate(): Promise<void> {
  console.log(chalk.cyan.bold('\n  🚀 AI 代码生成器\n'));
  console.log(chalk.gray('  描述你想要实现的功能，AI 将为你生成代码...\n'));

  const request = await promptForGeneration();

  if (!isAIConfigured()) {
    console.log(chalk.yellow('  💡 提示: 配置 AI API 可以获得更好的代码生成结果\n'));
    console.log(chalk.gray('  请参考 .env.example 文件配置 AI\n'));
  }

  const code = await generateCode(request);

  console.log(chalk.cyan('\n  生成的代码预览:\n'));
  console.log(
    '```' +
      (request.fileName.endsWith('.ts') || request.fileName.endsWith('.tsx') ? 'typescript' : '')
  );
  console.log(code);
  console.log('```\n');

  const save = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '是否保存代码到文件?',
    initial: true,
  });

  if (save.confirm) {
    await saveCode(request.fileName, code);
  }

  const another = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '是否继续生成更多代码?',
    initial: false,
  });

  if (another.confirm) {
    await generate();
  } else {
    console.log(chalk.green.bold('\n  🎉 代码生成完成！\n'));
  }
}

export default generate;
