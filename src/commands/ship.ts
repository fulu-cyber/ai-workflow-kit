import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync, spawnSync } from 'child_process';

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  branch: string;
}

export function getGitStatus(): GitStatus | null {
  try {
    const statusResult = spawnSync('git', ['status', '--porcelain', '-b'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    if (statusResult.status !== 0) {
      return null;
    }

    const lines = statusResult.stdout.split('\n').filter(line => line.trim() !== '');
    let branch = 'main';
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      if (line.startsWith('##')) {
        const branchMatch = line.match(/## ([^.]+)/);
        if (branchMatch) {
          branch = branchMatch[1];
        }
      } else if (line.startsWith('??')) {
        untracked.push(line.slice(3));
      } else if (line.startsWith(' ')) {
        unstaged.push(line.slice(3));
      } else {
        staged.push(line.slice(3));
      }
    }

    return { staged, unstaged, untracked, branch };
  } catch (error) {
    return null;
  }
}

export function getGitDiff(): string {
  try {
    const diffResult = spawnSync('git', ['diff', '--staged'], {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    return diffResult.stdout || '';
  } catch {
    return '';
  }
}

export function generateCommitMessage(diff: string, status: GitStatus): string {
  const fileCount = status.staged.length + status.unstaged.length;
  if (fileCount === 0) {
    return 'chore: update';
  }

  if (fileCount === 1) {
    const file = status.staged[0] || status.unstaged[0];
    return `chore: update ${file}`;
  }

  return `chore: update ${fileCount} files`;
}

export function createBranch(branchName: string): boolean {
  try {
    execSync(`git checkout -b ${branchName}`, { cwd: process.cwd(), stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function stageAll(): boolean {
  try {
    execSync('git add .', { cwd: process.cwd(), stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function commit(message: string): boolean {
  try {
    execSync(`git commit -m "${message}"`, { cwd: process.cwd(), stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function push(branchName: string): boolean {
  try {
    execSync(`git push -u origin ${branchName}`, { cwd: process.cwd(), stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function ship(): Promise<void> {
  console.log(chalk.cyan.bold('\n  🚢 Git 自动化 - Ship\n'));

  if (!existsSync(resolve(process.cwd(), '.git'))) {
    console.error(chalk.red('  错误：这不是一个 Git 仓库'));
    console.error(chalk.gray('  请先运行 git init 初始化仓库\n'));
    process.exit(1);
  }

  const gitStatus = getGitStatus();
  if (!gitStatus) {
    console.error(chalk.red('  错误：无法获取 Git 状态\n'));
    process.exit(1);
  }

  console.log(chalk.gray(`  当前分支: ${gitStatus.branch}`));
  console.log(chalk.gray(`  已暂存: ${gitStatus.staged.length} 个文件`));
  console.log(chalk.gray(`  未暂存: ${gitStatus.unstaged.length} 个文件`));
  console.log(chalk.gray(`  未跟踪: ${gitStatus.untracked.length} 个文件\n`));

  const shouldCreateBranch = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '是否创建新分支?',
    initial: true,
  });

  let branchName = gitStatus.branch;

  if (shouldCreateBranch.confirm) {
    const branchPrompt = await prompts({
      type: 'text',
      name: 'name',
      message: '分支名称:',
      initial: `feature/${Date.now()}`,
    });

    branchName = branchPrompt.name || `feature/${Date.now()}`;

    console.log(chalk.gray(`\n  创建分支: ${branchName}...`));
    if (!createBranch(branchName)) {
      console.error(chalk.red('  错误：创建分支失败\n'));
      process.exit(1);
    }
    console.log(chalk.green('  ✅ 分支创建成功'));
  }

  const totalFiles = gitStatus.staged.length + gitStatus.unstaged.length + gitStatus.untracked.length;
  if (totalFiles > 0 && gitStatus.staged.length === 0) {
    const shouldStage = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '是否暂存所有更改?',
      initial: true,
    });

    if (shouldStage.confirm) {
      console.log(chalk.gray('\n  暂存所有文件...'));
      if (!stageAll()) {
        console.error(chalk.red('  错误：暂存文件失败\n'));
        process.exit(1);
      }
      console.log(chalk.green('  ✅ 文件暂存成功'));
    }
  }

  const gitDiff = getGitDiff();
  const defaultCommitMsg = generateCommitMessage(gitDiff, gitStatus);

  const commitPrompt = await prompts({
    type: 'text',
    name: 'message',
    message: '提交信息:',
    initial: defaultCommitMsg,
  });

  const commitMessage = commitPrompt.message || defaultCommitMsg;

  console.log(chalk.gray('\n  创建提交...'));
  if (!commit(commitMessage)) {
    console.error(chalk.red('  错误：提交失败\n'));
    process.exit(1);
  }
  console.log(chalk.green('  ✅ 提交成功'));

  const shouldPush = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '是否推送到远程仓库?',
    initial: true,
  });

  if (shouldPush.confirm) {
    console.log(chalk.gray('\n  推送到远程仓库...'));
    if (!push(branchName)) {
      console.error(chalk.red('  错误：推送失败\n'));
      process.exit(1);
    }
    console.log(chalk.green('  ✅ 推送成功'));
  }

  console.log(chalk.green.bold('\n  🎉 Ship 流程完成！\n'));
}

export default ship;
