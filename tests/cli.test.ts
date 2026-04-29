import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

describe('CLI Tests', () => {
  const cliPath = resolve(__dirname, '..', 'dist', 'cli', 'index.js');
  const pkg = require('../package.json');

  it('should output version when --version is passed', () => {
    const result = execSync(`node ${cliPath} --version`, { encoding: 'utf-8' });
    expect(result).toContain(pkg.version);
  });

  it('should output version when -v is passed', () => {
    const result = execSync(`node ${cliPath} -v`, { encoding: 'utf-8' });
    expect(result).toContain(pkg.version);
  });

  it('should output help when --help is passed', () => {
    const result = execSync(`node ${cliPath} --help`, { encoding: 'utf-8' });
    expect(result).toContain('Usage:');
    expect(result).toContain('aiw');
    expect(result).toContain('--help');
    expect(result).toContain('--version');
  });

  it('should output help when -h is passed', () => {
    const result = execSync(`node ${cliPath} -h`, { encoding: 'utf-8' });
    expect(result).toContain('Usage:');
  });

  it('should show welcome message when no arguments are passed', () => {
    const result = execSync(`node ${cliPath}`, { encoding: 'utf-8' });
    expect(result).toContain('AI Workflow Kit');
    expect(result).toContain(`Version ${pkg.version}`);
    expect(result).toContain('Use "aiw --help" for more information');
  });
});
