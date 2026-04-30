import prompts from 'prompts';
import chalk from 'chalk';
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';

config();

export interface PublishConfig {
  platforms: string[];
  message: string;
  includeScreenshot?: boolean;
}

export interface PlatformConfig {
  name: string;
  enabled: boolean;
  credentials: Record<string, string>;
}

function getPlatformConfig(): PlatformConfig[] {
  return [
    {
      name: 'twitter',
      enabled: !!(
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET
      ),
      credentials: {
        apiKey: process.env.TWITTER_API_KEY || '',
        apiSecret: process.env.TWITTER_API_SECRET || '',
        accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
        accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
      },
    },
    {
      name: 'weibo',
      enabled: !!(
        process.env.WEIBO_APP_KEY &&
        process.env.WEIBO_APP_SECRET &&
        process.env.WEIBO_ACCESS_TOKEN
      ),
      credentials: {
        appKey: process.env.WEIBO_APP_KEY || '',
        appSecret: process.env.WEIBO_APP_SECRET || '',
        accessToken: process.env.WEIBO_ACCESS_TOKEN || '',
      },
    },
  ];
}

async function promptForPublish(): Promise<PublishConfig> {
  const platforms = getPlatformConfig();
  const availablePlatforms = platforms.filter((p) => p.enabled);

  if (availablePlatforms.length === 0) {
    console.log(chalk.yellow('\n  ⚠️ 未配置任何社交平台账号\n'));
    console.log(chalk.gray('  请在 .env 文件中配置以下环境变量:\n'));
    console.log(chalk.cyan('  Twitter/X 配置:'));
    console.log(chalk.gray('    TWITTER_API_KEY'));
    console.log(chalk.gray('    TWITTER_API_SECRET'));
    console.log(chalk.gray('    TWITTER_ACCESS_TOKEN'));
    console.log(chalk.gray('    TWITTER_ACCESS_SECRET\n'));
    console.log(chalk.cyan('  微博配置:'));
    console.log(chalk.gray('    WEIBO_APP_KEY'));
    console.log(chalk.gray('    WEIBO_APP_SECRET'));
    console.log(chalk.gray('    WEIBO_ACCESS_TOKEN\n'));

    const useMock = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '是否使用模拟模式测试发布流程?',
      initial: true,
    });

    if (!useMock.confirm) {
      process.exit(0);
    }
  }

  const platformChoices =
    availablePlatforms.length > 0
      ? availablePlatforms.map((p) => ({
          title: `${p.name} (${p.enabled ? '已配置' : '未配置'})`,
          value: p.name,
        }))
      : [{ title: '模拟模式', value: 'mock' }];

  const questions: any[] = [
    {
      type: 'multiselect',
      name: 'platforms',
      message: '选择要发布的平台:',
      choices: platformChoices,
      hint: '- Space to select, Enter to confirm',
    },
    {
      type: 'text',
      name: 'message',
      message: '发布内容:',
      initial: '🎉 新项目发布！',
      multiline: true,
    },
    {
      type: 'confirm',
      name: 'includeScreenshot',
      message: '是否包含截图?',
      initial: false,
    },
  ];

  const answers = await prompts(questions);
  return answers as PublishConfig;
}

async function publishToTwitter(message: string): Promise<boolean> {
  console.log(chalk.cyan('\n  🐦 准备发布到 Twitter/X...\n'));

  const useMock = !(process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN);

  if (useMock) {
    console.log(chalk.gray('  模拟发布到 Twitter...'));
    console.log(chalk.gray(`  内容: ${message.substring(0, 50)}...`));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chalk.green('  ✅ 模拟发布成功 (Tweet ID: mock-12345)\n'));
    return true;
  }

  try {
    console.log(chalk.gray('  正在发布到 Twitter...'));
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { data?: { id?: string } };
      console.log(chalk.green(`  ✅ 发布成功 (Tweet ID: ${data.data?.id})\n`));
      return true;
    } else {
      console.log(chalk.red(`  ❌ 发布失败: ${response.status}\n`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ 发布失败: ${error}\n`));
    return false;
  }
}

async function publishToWeibo(message: string): Promise<boolean> {
  console.log(chalk.cyan('\n  🌐 准备发布到微博...\n'));

  const useMock = !(process.env.WEIBO_APP_KEY && process.env.WEIBO_ACCESS_TOKEN);

  if (useMock) {
    console.log(chalk.gray('  模拟发布到微博...'));
    console.log(chalk.gray(`  内容: ${message.substring(0, 50)}...`));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chalk.green('  ✅ 模拟发布成功 (Weibo ID: mock-67890)\n'));
    return true;
  }

  try {
    console.log(chalk.gray('  正在发布到微博...'));
    const response = await fetch('https://api.weibo.com/2/statuses/update.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `status=${encodeURIComponent(message)}&access_token=${process.env.WEIBO_ACCESS_TOKEN}`,
    });

    if (response.ok) {
      const data = (await response.json()) as { id?: string };
      console.log(chalk.green(`  ✅ 发布成功 (Weibo ID: ${data.id})\n`));
      return true;
    } else {
      console.log(chalk.red(`  ❌ 发布失败: ${response.status}\n`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ 发布失败: ${error}\n`));
    return false;
  }
}

async function publishToGitHub(message: string): Promise<boolean> {
  console.log(chalk.cyan('\n  🐙 准备发布到 GitHub...\n'));

  const readmePath = 'README.md';
  if (!existsSync(readmePath)) {
    console.log(chalk.yellow('  ⚠️ 未找到 README.md，跳过 GitHub 发布\n'));
    return false;
  }

  console.log(chalk.gray('  README.md 已就绪'));
  console.log(chalk.gray('  请使用 aiw ship 推送到 GitHub\n'));
  console.log(chalk.green('  ✅ GitHub 发布准备完成\n'));
  return true;
}

export async function publish(): Promise<void> {
  console.log(chalk.cyan.bold('\n  📤 产品发布工具\n'));
  console.log(chalk.gray('  选择平台并发布你的产品更新...\n'));

  const config = await promptForPublish();

  if (config.platforms.length === 0) {
    console.log(chalk.red('\n  ❌ 未选择任何发布平台\n'));
    process.exit(1);
  }

  console.log(chalk.green(`\n  将发布到 ${config.platforms.length} 个平台:\n`));
  config.platforms.forEach((p) => console.log(chalk.cyan(`    - ${p}`)));
  console.log();

  let successCount = 0;
  const results: { platform: string; success: boolean }[] = [];

  for (const platform of config.platforms) {
    let success = false;

    switch (platform) {
      case 'twitter':
        success = await publishToTwitter(config.message);
        break;
      case 'weibo':
        success = await publishToWeibo(config.message);
        break;
      case 'github':
        success = await publishToGitHub(config.message);
        break;
      case 'mock':
        console.log(chalk.cyan('\n  🔧 模拟模式发布...\n'));
        console.log(chalk.gray('  平台: 模拟测试'));
        console.log(chalk.gray(`  内容: ${config.message}`));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        success = true;
        console.log(chalk.green('  ✅ 模拟发布成功\n'));
        break;
    }

    results.push({ platform, success });
    if (success) successCount++;
  }

  console.log(chalk.green.bold('\n  📊 发布统计:\n'));
  console.log(chalk.gray(`  成功: ${successCount}/${config.platforms.length}`));
  results.forEach((r) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`  ${icon} ${r.platform}`);
  });

  if (successCount === config.platforms.length) {
    console.log(chalk.green.bold('\n  🎉 所有平台发布成功！\n'));
  } else {
    console.log(
      chalk.yellow.bold(`\n  ⚠️ ${config.platforms.length - successCount} 个平台发布失败\n`)
    );
  }
}

export default publish;
