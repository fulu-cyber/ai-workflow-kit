import { describe, it, expect } from 'vitest';
import { renderDesignTemplate, BrainstormConfig } from '../src/commands/brainstorm';

describe('brainstorm command', () => {
  describe('renderDesignTemplate', () => {
    it('should replace all template variables correctly', () => {
      const config: BrainstormConfig = {
        projectOverview: '这是一个测试项目',
        projectGoals: '解决测试问题',
        targetUsers: '测试用户',
        coreFeatures: '核心功能1、核心功能2',
        techStack: 'TypeScript, Node.js',
        scopeAndBoundaries: '只做MVP，不做高级功能',
        notes: '注意事项',
      };

      const template = `# 设计文档

## 项目概述
{{projectOverview}}

## 项目目标
{{projectGoals}}

## 目标用户
{{targetUsers}}

## 核心功能
{{coreFeatures}}

## 技术选型
{{techStack}}

## 项目范围与边界
{{scopeAndBoundaries}}

## 注意事项
{{notes}}

## 生成时间
{{generatedAt}}`;

      const result = renderDesignTemplate(template, config);

      expect(result).toContain('这是一个测试项目');
      expect(result).toContain('解决测试问题');
      expect(result).toContain('测试用户');
      expect(result).toContain('核心功能1、核心功能2');
      expect(result).toContain('TypeScript, Node.js');
      expect(result).toContain('只做MVP，不做高级功能');
      expect(result).toContain('注意事项');
    });

    it('should handle empty values correctly', () => {
      const config: BrainstormConfig = {
        projectOverview: '',
        projectGoals: '',
        targetUsers: '',
        coreFeatures: '',
        techStack: '',
        scopeAndBoundaries: '',
        notes: '',
      };

      const template = '{{projectOverview}}{{projectGoals}}';
      const result = renderDesignTemplate(template, config);

      expect(result).toBe('');
    });

    it('should include generated timestamp', () => {
      const config: BrainstormConfig = {
        projectOverview: 'test',
        projectGoals: 'test',
        targetUsers: 'test',
        coreFeatures: 'test',
        techStack: 'test',
        scopeAndBoundaries: 'test',
        notes: 'test',
      };

      const template = '{{generatedAt}}';
      const result = renderDesignTemplate(template, config);

      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
