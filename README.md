# AI Workflow Kit

一个轻量级的 AI 编程工作流工具，结合了 gstack 的虚拟团队角色和 Superpowers 的 TDD 纪律，帮助开发者高效完成从需求到上线的完整开发流程。

## 功能特性

- 🚀 **项目初始化** (`aiw init`) - 创建标准的项目结构和配置文件
- 💡 **需求分析** (`aiw brainstorm`) - 交互式问答界面，帮助澄清需求并生成设计文档
- 📋 **任务规划** (`aiw plan`) - 将需求分解为可执行的任务列表
- 🧪 **TDD 工作流** (`aiw tdd`) - 强制测试驱动开发的红-绿-重构流程
- 🔍 **代码审查** (`aiw review`) - 自动化代码质量检查
- 🔄 **Git 自动化** (`aiw ship`) - 自动化分支、提交、推送等操作
- 📝 **文档生成** (`aiw docs`) - 自动生成 README 和项目文档
- 🐙 **GitHub 集成** (`aiw github`) - 配置 GitHub 相关设置和 CI

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/fulu-cyber/ai-workflow-kit.git
cd ai-workflow-kit

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到全局（可选，方便直接使用 aiw 命令）
npm link
```

### 使用方法

#### 1. 创建新项目

```bash
# 在空目录中初始化新项目
aiw init

# 或使用快速模式（默认配置）
aiw init --yes
```

#### 2. 需求分析和设计

```bash
# 开始需求分析，生成设计文档
aiw brainstorm
```

#### 3. 任务规划

```bash
# 基于设计文档生成任务列表
aiw plan
```

#### 4. TDD 开发

```bash
# 开始 TDD 工作流
aiw tdd
```

#### 5. 代码审查

```bash
# 运行代码质量检查
aiw review
```

#### 6. 自动化 Git 流程

```bash
# 自动化分支、提交、推送
aiw ship
```

#### 7. 生成文档

```bash
# 生成项目文档
aiw docs
```

#### 8. GitHub 配置

```bash
# 配置 GitHub 相关设置
aiw github
```

## 完整工作流示例

```bash
# 1. 初始化项目
aiw init

# 2. 需求分析
aiw brainstorm

# 3. 任务规划
aiw plan

# 4. TDD 开发
aiw tdd

# 5. 代码审查
aiw review

# 6. Git 自动化
aiw ship

# 7. 生成文档
aiw docs

# 8. GitHub 配置
aiw github
```

## 项目结构

```
ai-workflow-kit/
├── src/
│   ├── cli/              # CLI 入口
│   ├── commands/         # 各个命令的实现
│   └── utils/            # 工具函数
├── templates/           # 项目模板
├── tests/               # 测试文件
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── README.md
```

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 运行测试
npm run test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 构建

```bash
# 构建项目
npm run build
```

## 参考项目

- [gstack](https://github.com/garrytan/gstack) - Garry Tan 开源的 AI 工程工作流
- [Superpowers](https://github.com/obra/superpowers) - 测试驱动开发的 AI 工作流框架

## 许可证

MIT License

## 贡献

欢迎贡献！请提交 Issue 和 Pull Request。

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。
