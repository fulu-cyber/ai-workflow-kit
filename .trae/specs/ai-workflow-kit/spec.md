# AI Workflow Kit - Product Requirement Document

## Overview
- **Summary**: AI Workflow Kit 是一个轻量级的 AI 编程工作流工具，整合了 gstack 的虚拟团队角色和 Superpowers 的 TDD 纪律，帮助开发者高效完成从需求到上线的完整开发流程。
- **Purpose**: 解决 AI 编程中缺乏流程规范、质量难以保证、上下文易丢失的问题，提供一套可复用的工作流模板和命令行工具。
- **Target Users**: 独立开发者、小型团队、使用 AI 辅助编程的工程师

## Goals
- 提供一套完整的 AI 编程工作流模板（从需求到上线）
- 实现可复用的角色化命令（类似 gstack 的斜杠命令）
- 集成测试驱动开发 (TDD) 的最佳实践
- 支持 Git 工作流自动化和代码质量检查
- 生成可部署到 GitHub 的完整项目结构

## Non-Goals (Out of Scope)
- 不实现完整的 AI 代理系统（不替代 AutoGPT）
- 不实现浏览器自动化（超出 MVP 范围）
- 不支持多云部署（专注于 GitHub 单一平台）
- 不实现复杂的用户界面（命令行工具为主）

## Background & Context
- 参考 gstack (garrytan/gstack) 的角色化设计理念
- 参考 Superpowers (obra/superpowers) 的 TDD 工作流
- 目标是创建一个更轻量、更易于入门的版本
- 使用 Node.js/Bun 作为运行时，确保跨平台兼容性

## Functional Requirements
- **FR-1**: 项目初始化 - 创建标准的项目结构和配置文件
- **FR-2**: 需求分析工具 - 帮助用户澄清需求和生成设计文档
- **FR-3**: 任务规划 - 将需求分解为可执行的任务列表
- **FR-4**: TDD 工作流 - 强制测试前置的开发模式
- **FR-5**: 代码审查 - 自动化代码质量检查
- **FR-6**: Git 自动化 - 创建分支、提交、PR 等操作的辅助工具
- **FR-7**: 项目文档生成 - 自动生成 README、API 文档等

## Non-Functional Requirements
- **NFR-1**: 性能 - 命令响应时间 < 2 秒
- **NFR-2**: 可扩展性 - 支持自定义工作流插件
- **NFR-3**: 兼容性 - 支持 Node.js 18+ 和 Bun 1.0+
- **NFR-4**: 可维护性 - 代码有良好的注释和测试覆盖

## Constraints
- **Technical**: 使用 TypeScript，支持 Node.js 和 Bun
- **Business**: 开源项目，MIT 许可证
- **Dependencies**: 依赖 Git、GitHub CLI（可选）

## Assumptions
- 用户已安装 Git
- 用户有基本的编程和 Git 经验
- 用户使用 GitHub 作为代码托管平台（MVP）
- 目标用户主要使用 JavaScript/TypeScript 技术栈

## Acceptance Criteria

### AC-1: 项目初始化功能
- **Given**: 用户在空目录中运行 `aiw init`
- **When**: 命令执行完成
- **Then**: 创建标准的项目结构，包括 package.json、.gitignore、docs/、src/、tests/ 等目录
- **Verification**: `programmatic`
- **Notes**: 目录结构应该符合行业最佳实践

### AC-2: 需求分析工具
- **Given**: 用户运行 `aiw brainstorm`
- **When**: 用户按照提示回答问题
- **Then**: 生成设计文档 (design.md)，包含需求描述、技术选型、任务清单
- **Verification**: `human-judgment`

### AC-3: 任务规划功能
- **Given**: 有设计文档存在
- **When**: 用户运行 `aiw plan`
- **Then**: 生成任务列表，分解为 < 4 小时的子任务，每个任务有明确的验收标准
- **Verification**: `human-judgment`

### AC-4: TDD 工作流命令
- **Given**: 用户开始一个新功能开发
- **When**: 用户运行 `aiw tdd`
- **Then**: 强制用户先写测试，测试失败后再写实现代码，最后重构
- **Verification**: `programmatic`

### AC-5: 代码审查功能
- **Given**: 有代码变更
- **When**: 用户运行 `aiw review`
- **Then**: 执行代码质量检查（lint、format、test），生成审查报告
- **Verification**: `programmatic`

### AC-6: Git 自动化功能
- **Given**: Git 仓库已初始化
- **When**: 用户运行 `aiw ship`
- **Then**: 自动创建分支、提交变更、推送到远程、创建 PR（如果配置了 GitHub CLI）
- **Verification**: `programmatic`

### AC-7: 文档生成功能
- **Given**: 项目开发完成
- **When**: 用户运行 `aiw docs`
- **Then**: 生成 README、API 文档（基于 JSDoc）、部署指南
- **Verification**: `human-judgment`

### AC-8: 项目可上传到 GitHub
- **Given**: 项目开发完成
- **When**: 用户按照文档操作
- **Then**: 项目可以成功推送到 GitHub 仓库，所有 CI/CD 配置正常
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要支持其他语言（Python、Go）？
- [ ] 是否需要集成 CI/CD 配置生成？
- [ ] 是否需要更复杂的配置系统？
