import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync, spawnSync } from 'child_process';

export interface ReviewReport {
  eslint: {
    success: boolean;
    errors: number;
    warnings: number;
    output: string;
  };
  prettier: {
    success: boolean;
    output: string;
  };
  timestamp: string;
}

export function runEslint(): {
  success: boolean;
  errors: number;
  warnings: number;
  output: string;
} {
  try {
    const result = spawnSync('npx', ['eslint', 'src', '--ext', '.ts,.tsx', '--format', 'json'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    let errors = 0;
    let warnings = 0;

    if (result.stdout) {
      try {
        const eslintOutput = JSON.parse(result.stdout);
        for (const file of eslintOutput) {
          errors += file.errorCount || 0;
          warnings += file.warningCount || 0;
        }
      } catch {
        // 如果无法解析 JSON，使用默认值
      }
    }

    return {
      success: result.status === 0,
      errors,
      warnings,
      output: result.stdout || result.stderr || '',
    };
  } catch (error) {
    return {
      success: false,
      errors: 0,
      warnings: 0,
      output: String(error),
    };
  }
}

export function runPrettierCheck(): { success: boolean; output: string } {
  try {
    const result = spawnSync('npx', ['prettier', '--check', 'src/**/*.{ts,tsx,js,jsx}'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return {
      success: result.status === 0,
      output: result.stdout || result.stderr || '',
    };
  } catch (error) {
    return {
      success: false,
      output: String(error),
    };
  }
}

export function runPrettierFix(): { success: boolean; output: string } {
  try {
    const result = spawnSync('npx', ['prettier', '--write', 'src/**/*.{ts,tsx,js,jsx}'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return {
      success: result.status === 0,
      output: result.stdout || result.stderr || '',
    };
  } catch (error) {
    return {
      success: false,
      output: String(error),
    };
  }
}

export function runEslintFix(): { success: boolean; output: string } {
  try {
    const result = spawnSync('npx', ['eslint', 'src', '--ext', '.ts,.tsx', '--fix'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return {
      success: result.status === 0,
      output: result.stdout || result.stderr || '',
    };
  } catch (error) {
    return {
      success: false,
      output: String(error),
    };
  }
}

function generateReport(reviewReport: ReviewReport): string {
  let report = '# 代码审查报告\n\n';
  report += `生成时间: ${reviewReport.timestamp}\n\n`;
  report += '## ESLint 检查结果\n\n';
  report += `- 状态: ${reviewReport.eslint.success ? '✅ 通过' : '❌ 失败'}\n`;
  report += `- 错误数: ${reviewReport.eslint.errors}\n`;
  report += `- 警告数: ${reviewReport.eslint.warnings}\n\n`;
  if (reviewReport.eslint.output) {
    report += '### 详细输出\n\n';
    report += '```\n' + reviewReport.eslint.output + '\n```\n\n';
  }
  report += '## Prettier 检查结果\n\n';
  report += `- 状态: ${reviewReport.prettier.success ? '✅ 通过' : '❌ 需要格式化'}\n\n`;
  if (reviewReport.prettier.output) {
    report += '### 详细输出\n\n';
    report += '```\n' + reviewReport.prettier.output + '\n```\n\n';
  }
  return report;
}

export async function review(): Promise<void> {
  console.log(chalk.cyan.bold('\n  🔍 代码审查开始\n'));

  if (!existsSync(resolve(process.cwd(), 'package.json'))) {
    console.error(chalk.red('  错误：找不到 package.json 文件'));
    console.error(chalk.gray('  请在项目根目录运行此命令\n'));
    process.exit(1);
  }

  console.log(chalk.gray('  正在运行 ESLint 检查...'));
  const eslintResult = runEslint();

  console.log(chalk.gray('  正在运行 Prettier 检查...'));
  const prettierResult = runPrettierCheck();

  const report: ReviewReport = {
    eslint: eslintResult,
    prettier: prettierResult,
    timestamp: new Date().toISOString(),
  };

  console.log('\n' + chalk.cyan.bold('  审查结果:'));

  if (eslintResult.success) {
    console.log(
      chalk.green(`  ✅ ESLint 通过 (${eslintResult.errors} 错误, ${eslintResult.warnings} 警告)`)
    );
  } else {
    console.log(
      chalk.red(`  ❌ ESLint 发现问题 (${eslintResult.errors} 错误, ${eslintResult.warnings} 警告)`)
    );
  }

  if (prettierResult.success) {
    console.log(chalk.green('  ✅ Prettier 格式检查通过'));
  } else {
    console.log(chalk.yellow('  ⚠️ Prettier 发现格式问题'));
  }

  if (!eslintResult.success || !prettierResult.success) {
    const shouldFix = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '是否尝试自动修复?',
      initial: true,
    });

    if (shouldFix.confirm) {
      console.log(chalk.gray('\n  正在运行 ESLint 自动修复...'));
      const eslintFixResult = runEslintFix();

      console.log(chalk.gray('  正在运行 Prettier 格式化...'));
      const prettierFixResult = runPrettierFix();

      if (eslintFixResult.success) {
        console.log(chalk.green('  ✅ ESLint 自动修复完成'));
      } else {
        console.log(chalk.yellow('  ⚠️ ESLint 修复可能需要手动干预'));
      }

      if (prettierFixResult.success) {
        console.log(chalk.green('  ✅ Prettier 格式化完成'));
      }

      console.log(chalk.gray('\n  重新运行检查...'));
      const finalEslint = runEslint();
      const finalPrettier = runPrettierCheck();

      console.log('\n' + chalk.cyan.bold('  修复后结果:'));
      if (finalEslint.success) {
        console.log(
          chalk.green(`  ✅ ESLint 通过 (${finalEslint.errors} 错误, ${finalEslint.warnings} 警告)`)
        );
      } else {
        console.log(
          chalk.red(
            `  ❌ ESLint 仍有问题 (${finalEslint.errors} 错误, ${finalEslint.warnings} 警告)`
          )
        );
      }
      if (finalPrettier.success) {
        console.log(chalk.green('  ✅ Prettier 格式检查通过'));
      }

      report.eslint = finalEslint;
      report.prettier = finalPrettier;
    }
  }

  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) {
    require('fs').mkdirSync(docsDir, { recursive: true });
  }

  const reportPath = resolve(docsDir, 'review-report.md');
  writeFileSync(reportPath, generateReport(report));

  console.log(chalk.green.bold('\n  ✅ 代码审查完成！\n'));
  console.log(chalk.gray(`  报告已保存到: ${reportPath}\n`));
}

export default review;
