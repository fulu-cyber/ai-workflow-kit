import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DocsConfig {
  projectName: string;
  description: string;
  author: string;
  license: string;
  includeApiDocs: boolean;
  includeDeployGuide: boolean;
}

function getDefaultConfig(packageJson: any): DocsConfig {
  return {
    projectName: packageJson.name || 'my-project',
    description: packageJson.description || 'A project created with aiw',
    author: packageJson.author || '',
    license: packageJson.license || 'MIT',
    includeApiDocs: true,
    includeDeployGuide: true,
  };
}

async function promptForConfig(packageJson: any): Promise<DocsConfig> {
  const defaultConfig = getDefaultConfig(packageJson);

  const questions: any[] = [
    {
      type: 'text',
      name: 'projectName',
      message: '项目名称:',
      initial: defaultConfig.projectName,
    },
    {
      type: 'text',
      name: 'description',
      message: '项目描述:',
      initial: defaultConfig.description,
    },
    {
      type: 'text',
      name: 'author',
      message: '作者:',
      initial: defaultConfig.author,
    },
    {
      type: 'text',
      name: 'license',
      message: '许可证:',
      initial: defaultConfig.license,
    },
    {
      type: 'confirm',
      name: 'includeApiDocs',
      message: '是否包含 API 文档?',
      initial: defaultConfig.includeApiDocs,
    },
    {
      type: 'confirm',
      name: 'includeDeployGuide',
      message: '是否包含部署指南?',
      initial: defaultConfig.includeDeployGuide,
    },
  ];

  const answers = await prompts(questions);
  return answers as DocsConfig;
}

function generateReadme(config: DocsConfig): string {
  return `# ${config.projectName}

${config.description}

## 安装

\`\`\`bash
npm install
\`\`\`

## 使用

\`\`\`bash
npm run dev
\`\`\`

## 测试

\`\`\`bash
npm test
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

## 许可证

${config.license} © ${config.author}
`;
}

function generateApiDocs(): string {
  return `# API 文档

此文档包含项目的 API 接口说明。

## 概述

请在此处添加你的 API 文档内容。

## 接口列表

### 示例接口

\`\`\`typescript
// 示例代码
\`\`\`
`;
}

function generateDeployGuide(): string {
  return `# 部署指南

本文档说明如何部署项目。

## 前提条件

- Node.js 18+
- npm 或 yarn

## 部署步骤

1. 构建项目
   \`\`\`bash
   npm run build
   \`\`\`

2. 部署到目标服务器

3. 配置环境变量

## 环境变量

请参考 .env.example 文件配置环境变量。
`;
}

export async function docs(): Promise<void> {
  console.log(chalk.cyan.bold('\n  📚 文档生成\n'));

  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.error(chalk.red('  错误：找不到 package.json 文件'));
    console.error(chalk.gray('  请在项目根目录运行此命令\n'));
    process.exit(1);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const config = await promptForConfig(packageJson);
  console.log();

  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  try {
    const readmePath = resolve(process.cwd(), 'README.md');
    writeFileSync(readmePath, generateReadme(config));
    console.log(chalk.green(`  ✅ README.md 已生成`));

    if (config.includeApiDocs) {
      const apiDocsPath = resolve(docsDir, 'api.md');
      writeFileSync(apiDocsPath, generateApiDocs());
      console.log(chalk.green(`  ✅ API 文档已生成`));
    }

    if (config.includeDeployGuide) {
      const deployPath = resolve(docsDir, 'deploy.md');
      writeFileSync(deployPath, generateDeployGuide());
      console.log(chalk.green(`  ✅ 部署指南已生成`));
    }

    console.log(chalk.green.bold('\n  🎉 文档生成完成！\n'));
    console.log(chalk.gray('  请查看生成的文档并根据需要进行编辑\n'));
  } catch (error) {
    console.error(chalk.red('  错误：文档生成失败'));
    console.error(error);
    process.exit(1);
  }
}

export default docs;
