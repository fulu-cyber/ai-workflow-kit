import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateCiConfig(): string {
  return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run build
`;
}

function generateLicense(): string {
  return `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function generateContributing(): string {
  return `# 贡献指南

感谢你对本项目的关注！

## 如何贡献

1. Fork 本仓库
2. 创建你的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交你的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启一个 Pull Request

## 代码规范

- 运行 npm run lint 检查代码风格
- 运行 npm test 确保所有测试通过
- 遵循 TDD 开发流程

## 报告问题

请使用 GitHub Issues 报告问题。
`;
}

function generateGithubGuide(): string {
  return `# GitHub 上传指南

## 准备工作

1. 创建 GitHub 账号并登录

2. 在 GitHub 上创建新仓库

## 上传步骤

### 初始化 Git 仓库（如果尚未初始化）

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
\`\`\`

### 关联远程仓库

\`\`\`bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
\`\`\`

### 推送现有仓库

\`\`\`bash
git push -u origin main
\`\`\`

## 协作开发

1. 创建特性分支
2. 推送分支到远程
3. 创建 Pull Request
4. 代码审查
5. 合并分支
`;
}

export async function github(): Promise<void> {
  console.log(chalk.cyan.bold('\n  🐙 GitHub 集成配置\n'));

  const questions: any[] = [
    {
      type: 'confirm',
      name: 'includeCi',
      message: '是否生成 GitHub Actions CI 配置?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'includeLicense',
      message: '是否生成 LICENSE 文件?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'includeContributing',
      message: '是否生成 CONTRIBUTING.md?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'includeGuide',
      message: '是否生成 GitHub 上传指南?',
      initial: true,
    },
  ];

  const answers = await prompts(questions);
  console.log();

  try {
    if (answers.includeCi) {
      const workflowsDir = resolve(process.cwd(), '.github/workflows');
      if (!existsSync(workflowsDir)) {
        mkdirSync(workflowsDir, { recursive: true });
      }
      const ciPath = resolve(workflowsDir, 'ci.yml');
      writeFileSync(ciPath, generateCiConfig());
      console.log(chalk.green('  ✅ GitHub Actions CI 配置已生成'));
    }

    if (answers.includeLicense) {
      const licensePath = resolve(process.cwd(), 'LICENSE');
      writeFileSync(licensePath, generateLicense());
      console.log(chalk.green('  ✅ LICENSE 许可证文件已生成'));
    }

    if (answers.includeContributing) {
      const contributingPath = resolve(process.cwd(), 'CONTRIBUTING.md');
      writeFileSync(contributingPath, generateContributing());
      console.log(chalk.green('  ✅ CONTRIBUTING.md 已生成'));
    }

    if (answers.includeGuide) {
      const guidePath = resolve(process.cwd(), 'docs', 'github-guide.md');
      const docsDir = dirname(guidePath);
      if (!existsSync(docsDir)) {
        mkdirSync(docsDir, { recursive: true });
      }
      writeFileSync(guidePath, generateGithubGuide());
      console.log(chalk.green('  ✅ GitHub 上传指南已生成'));
    }

    console.log(chalk.green.bold('\n  🎉 GitHub 配置完成！\n'));
  } catch (error) {
    console.error(chalk.red('  错误：GitHub 配置失败'));
    console.error(error);
    process.exit(1);
  }
}

export default github;
