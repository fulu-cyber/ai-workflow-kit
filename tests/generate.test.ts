import { describe, it, expect } from 'vitest';
import { generateMockCode } from '../src/commands/generate.js';

describe('AI Code Generation (Mock Mode)', () => {
  it('should generate TypeScript code', () => {
    const request = {
      fileName: 'src/utils/helper.ts',
      description: 'A helper function for string manipulation',
      techStack: 'TypeScript',
    };

    const code = generateMockCode(request);

    expect(code).toContain('export');
    expect(code).toContain('helper');
    expect(code).toContain('interface');
  });

  it('should generate JavaScript code', () => {
    const request = {
      fileName: 'src/utils/helper.js',
      description: 'A simple helper function',
      techStack: 'JavaScript',
    };

    const code = generateMockCode(request);

    expect(code).toContain('//');
    expect(code).toContain('TODO');
  });
});
