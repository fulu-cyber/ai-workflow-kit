import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TddConfig {
  featureName: string;
  testFileName: string;
  implementationFileName: string;
  language: 'ts' | 'js';
}

function getDefaultConfig(): TddConfig {
  return {
    featureName: '',
    testFileName: '',
    implementationFileName: '',
    language: 'ts',
  };
}

async function promptForConfig(): Promise<TddConfig> {
  const defaultConfig = getDefaultConfig();

  const questions: any[] = [
    {
      type: 'text',
      name: 'featureName',
      message: '功能名称 (例如: addUser):',
      initial: defaultConfig.featureName,
    },
    {
      type: 'select',
      name: 'language',
      message: '选择语言:',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'JavaScript', value: 'js' },
      ],
      initial: 0,
    },
  ];

  const answers = await prompts(questions);

  const featureName = answers.featureName || 'myFeature';
  const language = answers.language;

  return {
    featureName,
    testFileName: `${featureName}.test.${language}`,
    implementationFileName: `${featureName}.${language}`,
    language,
  };
}

function renderTestTemplate(config: TddConfig): string {
  if (config.language === 'ts') {
    return `import { expect, describe, it } from 'vitest';
import { ${config.featureName} } from './${config.featureName}';

describe('${config.featureName}', () => {
  it('should be defined', () => {
    expect(${config.featureName}).toBeDefined();
  });
});
`;
  } else {
    return `import { expect, describe, it } from 'vitest';
import { ${config.featureName} } from './${config.featureName}';

describe('${config.featureName}', () => {
  it('should be defined', () => {
    expect(${config.featureName}).toBeDefined();
  });
});
`;
  }
}

function renderImplementationTemplate(config: TddConfig): string {
  if (config.language === 'ts') {
    return `export function ${config.featureName}(): void {
  // 实现你的功能
}
`;
  } else {
    return `export function ${config.featureName}() {
  // 实现你的功能
}
`;
  }
}

function getProjectLanguage(): 'ts' | 'js' {
  if (existsSync(resolve(process.cwd(), 'tsconfig.json'))) {
    return 'ts';
  }
  return 'js';
}

function runTests(): boolean {
  try {
    console.log(chalk.gray('\n  运行测试...'));
    execSync('npm test', { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    return false;
  }
}

export async function tdd(): Promise<void> {
  console.log(chalk.cyan.bold('\n  🔴 TDD 工作流 - 红-绿-重构\n'));

  const language = getProjectLanguage();
  console.log(chalk.gray(`  检测到项目使用 ${language.toUpperCase()}`));

  const config = await promptForConfig();
  console.log();

  const srcDir = resolve(process.cwd(), 'src');
  const testsDir = resolve(process.cwd(), 'tests');

  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }
  if (!existsSync(testsDir)) {
    mkdirSync(testsDir, { recursive: true });
  }

  const testPath = resolve(testsDir, config.testFileName);
  const implementationPath = resolve(srcDir, config.implementationFileName);

  if (existsSync(testPath) || existsSync(implementationPath)) {
    const overwrite = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '文件已存在，是否覆盖?',
      initial: false,
    });

    if (!overwrite.confirm) {
      console.log(chalk.gray('\n  已取消操作\n'));
      return;
    }
  }

  console.log(chalk.yellow('  🟥 阶段 1: 红 - 先写测试'));

  try {
    writeFileSync(testPath, renderTestTemplate(config));
    console.log(chalk.green(`  ✅ 测试文件已创建: ${config.testFileName}`));

    const shouldRunTests = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '是否运行测试 (预计会失败)?',
      initial: true,
    });

    if (shouldRunTests.confirm) {
      const testPassed = runTests();

      if (!testPassed) {
        console.log(chalk.yellow('\n  测试失败了，这是预期的！现在进入绿阶段。'));
      }
    }

    console.log(chalk.yellow('\n  🟩 阶段 2: 绿 - 实现功能'));

    writeFileSync(implementationPath, renderImplementationTemplate(config));
    console.log(chalk.green(`  ✅ 实现文件已创建: ${config.implementationFileName}`));

    console.log(chalk.gray('\n  请实现功能代码，然后按回车继续...'));
    await prompts({ type: 'invisible', name: 'wait', message: '' });

    const testPassed = runTests();

    if (testPassed) {
      console.log(chalk.green('\n  ✅ 测试通过！现在进入重构阶段。'));

      console.log(chalk.yellow('\n  🔵 阶段 3: 重构 - 优化代码'));

      console.log(chalk.gray('\n  请重构你的代码，保持测试通过。完成后按回车继续...'));
      await prompts({ type: 'invisible', name: 'wait', message: '' });

      const finalTestPassed = runTests();

      if (finalTestPassed) {
        console.log(chalk.green.bold('\n  🎉 TDD 工作流完成！'));
        console.log(chalk.gray('  你已经通过红-绿-重构完成了功能开发\n'));
      } else {
        console.log(chalk.red('\n  ❌ 重构后测试失败，请检查代码\n'));
      }
    } else {
      console.log(chalk.red('\n  ❌ 测试仍然失败，请检查实现代码\n'));
    }
  } catch (error) {
    console.error(chalk.red('  错误：TDD 工作流失败'));
    console.error(error);
    process.exit(1);
  }
}

export default tdd;
