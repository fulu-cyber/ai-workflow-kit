import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderTemplate, InitConfig } from '../src/commands/init';

describe('init command', () => {
  describe('renderTemplate', () => {
    it('should replace all template variables correctly', () => {
      const config: InitConfig = {
        name: 'test-project',
        description: 'Test description',
        author: 'Test Author',
        typescript: true,
      };

      const template = '{{name}} - {{description}} by {{author}}';
      const result = renderTemplate(template, config);

      expect(result).toBe('test-project - Test description by Test Author');
    });

    it('should replace multiple occurrences', () => {
      const config: InitConfig = {
        name: 'test-project',
        description: 'Test description',
        author: 'Test Author',
        typescript: true,
      };

      const template = '{{name}} is called {{name}}';
      const result = renderTemplate(template, config);

      expect(result).toBe('test-project is called test-project');
    });
  });
});
