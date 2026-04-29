#!/usr/bin/env node

import { cac } from 'cac';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { init } from '../commands/init.js';
import { brainstorm } from '../commands/brainstorm.js';
import { plan } from '../commands/plan.js';
import { tdd } from '../commands/tdd.js';
import { review } from '../commands/review.js';
import { ship } from '../commands/ship.js';
import { docs } from '../commands/docs.js';
import { github } from '../commands/github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = resolve(__dirname, '../../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const cli = cac('aiw');

cli
  .version(pkg.version)
  .help()
  .usage('<command> [options]');

cli.command('', 'Show welcome message').action(() => {
  console.log(chalk.cyan.bold('\n  AI Workflow Kit'));
  console.log(chalk.gray(`  Version ${pkg.version}`));
  console.log('\n  A lightweight AI programming workflow kit');
  console.log('\n  ' + chalk.green('Use "aiw --help" for more information\n'));
});

cli
  .command('init', 'Initialize a new project')
  .option('-y, --yes', 'Use default configuration without prompts')
  .action(async (options: { yes?: boolean }) => {
    await init(options);
  });

cli
  .command('brainstorm', 'Interactive requirements analysis and design document generation')
  .action(async () => {
    await brainstorm();
  });

cli
  .command('plan', 'Task planning based on design document')
  .action(async () => {
    await plan();
  });

cli
  .command('tdd', 'TDD workflow - red, green, refactor')
  .action(async () => {
    await tdd();
  });

cli
  .command('review', 'Code review with ESLint and Prettier')
  .action(async () => {
    await review();
  });

cli
  .command('ship', 'Git automation - branch, commit, push')
  .action(async () => {
    await ship();
  });

cli
  .command('docs', 'Generate documentation')
  .action(async () => {
    await docs();
  });

cli
  .command('github', 'GitHub integration setup')
  .action(async () => {
    await github();
  });

cli.parse();

export default cli;
