import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface InitConfig {
  name: string;
  description: string;
  author: string;
  typescript: boolean;
}

function getDefaultConfig(): InitConfig {
  const currentDir = process.cwd().split('/').pop() || 'my-project';
  return {
    name: currentDir,
    description: 'A new project created with aiw',
    author: '',
    typescript: true,
  };
}

async function promptForConfig(): Promise<InitConfig> {
  const defaultConfig = getDefaultConfig();

  const questions: any[] = [
    {
      type: 'text' as const,
      name: 'name',
      message: '项目名称:',
      initial: defaultConfig.name,
    },
    {
      type: 'text' as const,
      name: 'description',
      message: '项目描述:',
      initial: defaultConfig.description,
    },
    {
      type: 'text' as const,
      name: 'author',
      message: '作者:',
      initial: defaultConfig.author,
    },
    {
      type: 'confirm' as const,
      name: 'typescript',
      message: '是否使用 TypeScript?',
      initial: defaultConfig.typescript,
    },
  ];

  const answers = await prompts(questions);
  return answers as InitConfig;
}

export function renderTemplate(template: string, config: InitConfig): string {
  let result = template;
  result = result.replace(/\{\{name\}\}/g, config.name);
  result = result.replace(/\{\{description\}\}/g, config.description);
  result = result.replace(/\{\{author\}\}/g, config.author);
  return result;
}

function getTemplatePath(templateRelativePath: string): string {
  return resolve(__dirname, '../../templates', templateRelativePath);
}

function copyDir(src: string, dest: string, config: InitConfig): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = require('fs').readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    let destPath = join(dest, entry.name);

    if (entry.name.startsWith('_')) {
      destPath = join(dest, entry.name.replace(/^_/, '.'));
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, config);
    } else {
      const content = readFileSync(srcPath, 'utf-8');
      const renderedContent = renderTemplate(content, config);
      writeFileSync(destPath, renderedContent);
    }
  }
}

export async function init(options: { yes?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold('\n  初始化 AI Workflow 项目...\n'));

  let config: InitConfig;

  if (options.yes) {
    config = getDefaultConfig();
    console.log(chalk.gray('  使用默认配置（--yes 模式）\n'));
  } else {
    config = await promptForConfig();
    console.log();
  }

  if (existsSync('package.json')) {
    console.error(chalk.red('  错误：当前目录已经包含 package.json 文件'));
    process.exit(1);
  }

  const templateType = config.typescript ? 'ts' : 'js';
  const commonTemplatesPath = getTemplatePath('common');
  const typeTemplatesPath = getTemplatePath(templateType);

  try {
    copyDir(commonTemplatesPath, process.cwd(), config);
    copyDir(typeTemplatesPath, process.cwd(), config);

    console.log(chalk.green.bold('  ✅ 项目初始化成功！\n'));
    console.log(chalk.gray('  下一步操作：'));
    console.log(chalk.cyan('    npm install'));
    console.log(chalk.cyan('    npm run dev'));
    console.log(chalk.cyan('    npm run test'));
    console.log();
  } catch (error) {
    console.error(chalk.red('  错误：初始化项目失败'));
    console.error(error);
    process.exit(1);
  }
}

export default init;
