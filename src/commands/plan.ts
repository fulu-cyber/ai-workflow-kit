import prompts from 'prompts';
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { callAI, isAIConfigured } from '../utils/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DesignDoc {
  projectOverview: string;
  projectGoals: string;
  targetUsers: string;
  coreFeatures: string;
  techStack: string;
  scopeAndBoundaries: string;
  notes: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  estimatedHours: number;
  acceptanceCriteria: string[];
  dependencies: number[];
}

export interface PlanConfig {
  tasks: Task[];
}

function parseDesignDoc(designDocPath: string): DesignDoc {
  const content = readFileSync(designDocPath, 'utf-8');
  const result: DesignDoc = {
    projectOverview: '',
    projectGoals: '',
    targetUsers: '',
    coreFeatures: '',
    techStack: '',
    scopeAndBoundaries: '',
    notes: '',
  };

  const sections = [
    { key: 'projectOverview', title: '项目概述' },
    { key: 'projectGoals', title: '项目目标' },
    { key: 'targetUsers', title: '目标用户' },
    { key: 'coreFeatures', title: '核心功能' },
    { key: 'techStack', title: '技术选型' },
    { key: 'scopeAndBoundaries', title: '项目范围与边界' },
    { key: 'notes', title: '注意事项' },
  ];

  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const next = sections[i + 1];
    const startIndex = content.indexOf(`## ${current.title}`);
    if (startIndex === -1) continue;

    let endIndex = next ? content.indexOf(`## ${next.title}`) : content.length;
    if (endIndex === -1) endIndex = content.length;

    const sectionContent = content
      .slice(startIndex + `## ${current.title}`.length, endIndex)
      .trim();
    (result as any)[current.key] = sectionContent;
  }

  return result;
}

function splitFeatures(coreFeatures: string): string[] {
  const features = coreFeatures
    .split(/\n|-|\d\./)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
  return features;
}

function generateDefaultTasks(features: string[]): Task[] {
  const tasks: Task[] = [];
  let taskId = 1;

  for (const feature of features) {
    if (feature.length === 0) continue;

    tasks.push({
      id: taskId++,
      title: `实现功能: ${feature.substring(0, 50)}${feature.length > 50 ? '...' : ''}`,
      description: `实现 "${feature}" 功能`,
      estimatedHours: 2,
      acceptanceCriteria: [
        '功能按设计文档要求实现',
        '代码有良好的注释',
        '有对应的测试用例',
        '测试通过',
      ],
      dependencies: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [],
    });

    tasks.push({
      id: taskId++,
      title: `测试功能: ${feature.substring(0, 45)}${feature.length > 45 ? '...' : ''}`,
      description: `为 "${feature}" 功能编写和运行测试`,
      estimatedHours: 1,
      acceptanceCriteria: ['测试用例覆盖主要场景', '所有测试通过'],
      dependencies: [taskId - 2],
    });
  }

  return tasks;
}

function renderTaskList(tasks: Task[]): string {
  let result = '';
  for (const task of tasks) {
    result += `### 任务 ${task.id}: ${task.title}\n\n`;
    result += `- **描述**: ${task.description}\n`;
    result += `- **预计时间**: ${task.estimatedHours} 小时\n`;
    result += `- **依赖**: ${task.dependencies.length > 0 ? task.dependencies.map((id) => `#${id}`).join(', ') : '无'}\n\n`;
    result += '**验收标准**:\n';
    for (const criteria of task.acceptanceCriteria) {
      result += `- [ ] ${criteria}\n`;
    }
    result += '\n';
  }
  return result;
}

function renderTasksTemplate(template: string, designDoc: DesignDoc, tasks: Task[]): string {
  let result = template;
  result = result.replace(/\{\{projectOverview\}\}/g, designDoc.projectOverview);
  result = result.replace(/\{\{coreFeatures\}\}/g, designDoc.coreFeatures);
  result = result.replace(/\{\{taskList\}\}/g, renderTaskList(tasks));
  result = result.replace(/\{\{generatedAt\}\}/g, new Date().toISOString());
  return result;
}

function getTemplatePath(): string {
  return resolve(__dirname, '../../templates/tasks.md');
}

async function reviewTasks(tasks: Task[]): Promise<Task[]> {
  let currentTasks = [...tasks];
  let confirmed = false;

  while (!confirmed) {
    console.log(chalk.cyan('\n  当前任务列表:'));
    for (const task of currentTasks) {
      console.log(chalk.gray(`\n  #${task.id}: ${task.title}`));
      console.log(chalk.gray(`    预计: ${task.estimatedHours} 小时`));
    }

    const action = await prompts({
      type: 'select',
      name: 'choice',
      message: '请选择操作:',
      choices: [
        { title: '确认任务列表', value: 'confirm' },
        { title: '添加新任务', value: 'add' },
        { title: '修改任务', value: 'edit' },
        { title: '删除任务', value: 'delete' },
      ],
    });

    if (action.choice === 'confirm') {
      confirmed = true;
    } else if (action.choice === 'add') {
      const questions: any[] = [
        {
          type: 'text',
          name: 'title',
          message: '任务标题:',
        },
        {
          type: 'text',
          name: 'description',
          message: '任务描述:',
          multiline: true,
        },
        {
          type: 'number',
          name: 'estimatedHours',
          message: '预计时间（小时）:',
          initial: 2,
        },
        {
          type: 'list',
          name: 'acceptanceCriteria',
          message: '验收标准（每一项用回车分隔）:',
          initial: '功能实现',
        },
      ];
      const newTask = await prompts(questions);

      currentTasks.push({
        id: currentTasks.length > 0 ? currentTasks[currentTasks.length - 1].id + 1 : 1,
        title: newTask.title,
        description: newTask.description,
        estimatedHours: newTask.estimatedHours || 2,
        acceptanceCriteria: newTask.acceptanceCriteria,
        dependencies: currentTasks.length > 0 ? [currentTasks[currentTasks.length - 1].id] : [],
      });
    } else if (action.choice === 'edit' && currentTasks.length > 0) {
      const taskToEdit = await prompts({
        type: 'select',
        name: 'taskId',
        message: '选择要修改的任务:',
        choices: currentTasks.map((task) => ({
          title: `#${task.id}: ${task.title}`,
          value: task.id,
        })),
      });

      const task = currentTasks.find((t) => t.id === taskToEdit.taskId);
      if (task) {
        const questions: any[] = [
          {
            type: 'text',
            name: 'title',
            message: '任务标题:',
            initial: task.title,
          },
          {
            type: 'text',
            name: 'description',
            message: '任务描述:',
            initial: task.description,
            multiline: true,
          },
          {
            type: 'number',
            name: 'estimatedHours',
            message: '预计时间（小时）:',
            initial: task.estimatedHours,
          },
        ];
        const updatedTask = await prompts(questions);

        task.title = updatedTask.title;
        task.description = updatedTask.description;
        task.estimatedHours = updatedTask.estimatedHours || task.estimatedHours;
      }
    } else if (action.choice === 'delete' && currentTasks.length > 0) {
      const taskToDelete = await prompts({
        type: 'select',
        name: 'taskId',
        message: '选择要删除的任务:',
        choices: currentTasks.map((task) => ({
          title: `#${task.id}: ${task.title}`,
          value: task.id,
        })),
      });

      currentTasks = currentTasks.filter((t) => t.id !== taskToDelete.taskId);
    }
  }

  return currentTasks;
}

async function enhanceTasksWithAI(designDoc: DesignDoc, tasks: Task[]): Promise<Task[]> {
  if (!isAIConfigured()) {
    return tasks;
  }

  console.log(chalk.cyan('\n  🤖 AI 正在优化任务列表...\n'));

  const systemPrompt = `你是一个专业的项目管理和开发专家。你的任务是帮助用户将项目需求分解成具体的、可执行的任务列表。
请基于设计文档，生成详细的开发任务列表，每个任务需要包含：
1. 任务标题（简洁明了）
2. 任务描述（详细说明要做什么）
3. 预计时间（小时）
4. 验收标准（可检查的完成条件）
5. 任务依赖关系

请用中文回答，格式清晰，便于开发者直接执行。`;

  const userPrompt = `请为以下项目生成详细的任务列表：

项目概述: ${designDoc.projectOverview}
核心功能: ${designDoc.coreFeatures}
技术选型: ${designDoc.techStack}

当前已有任务:
${tasks.map((t) => `任务${t.id}: ${t.title} - ${t.description} (${t.estimatedHours}h)`).join('\n')}

请帮我：
1. 补充和完善任务列表
2. 确保任务的依赖关系合理
3. 添加合理的验收标准`;

  try {
    const aiResponse = await callAI(systemPrompt, userPrompt);
    console.log(chalk.green('\n  ✅ AI 任务优化完成！\n'));
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
      message: '\n是否应用 AI 优化后的任务列表?',
      initial: true,
    });

    if (enhance.confirm) {
      console.log(chalk.green('\n  ✅ 已应用 AI 优化结果\n'));
    }

    return tasks;
  } catch (error) {
    console.log(chalk.yellow('\n  ⚠️ AI 任务优化失败，使用默认任务列表\n'));
    return tasks;
  }
}

export async function plan(): Promise<void> {
  console.log(chalk.cyan.bold('\n  📋 AI 任务规划\n'));
  console.log(chalk.gray('  让我们基于设计文档分解任务...\n'));

  const designDocPath = resolve(process.cwd(), 'docs/design.md');
  if (!existsSync(designDocPath)) {
    console.error(chalk.red('  错误：找不到设计文档 docs/design.md'));
    console.error(chalk.gray('  请先运行 "aiw brainstorm" 生成设计文档\n'));
    process.exit(1);
  }

  const designDoc = parseDesignDoc(designDocPath);
  const features = splitFeatures(designDoc.coreFeatures);

  console.log(chalk.green(`  找到 ${features.length} 个核心功能，正在生成任务列表...\n`));

  let initialTasks = generateDefaultTasks(features);

  if (isAIConfigured()) {
    initialTasks = await enhanceTasksWithAI(designDoc, initialTasks);
  }

  const finalTasks = await reviewTasks(initialTasks);

  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  const tasksDocPath = resolve(docsDir, 'tasks.md');
  const templatePath = getTemplatePath();

  try {
    const template = readFileSync(templatePath, 'utf-8');
    const renderedContent = renderTasksTemplate(template, designDoc, finalTasks);
    writeFileSync(tasksDocPath, renderedContent);

    console.log(chalk.green.bold('\n  ✅ 任务规划完成！\n'));
    console.log(chalk.gray(`  文档位置: ${tasksDocPath}`));
    console.log(chalk.gray(`  共生成 ${finalTasks.length} 个任务\n`));
  } catch (error) {
    console.error(chalk.red('  错误：生成任务文档失败'));
    console.error(error);
    process.exit(1);
  }
}

export { parseDesignDoc, splitFeatures, generateDefaultTasks, renderTaskList, renderTasksTemplate };

export default plan;
