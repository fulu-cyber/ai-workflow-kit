import { expect, test } from 'vitest';
import { greet } from '../src/utils/index.js';

test('greet function works', () => {
  expect(greet('World')).toBe('Hello, World!');
  expect(greet('Developer')).toBe('Hello, Developer!');
});
