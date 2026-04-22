import { describe, expect, it } from 'vitest';
import { isSpaShellPathnameAllowed } from './spa-pathname-policy';

describe('isSpaShellPathnameAllowed', () => {
  it('allows the SPA shell and static prefixes', () => {
    // Arrange
    const paths = [
      '/',
      '/index.html',
      '/favicon.svg',
      '/assets/main-abc123.js',
      '/notes',
      '/notes/any',
      '/notes/',
    ];

    // Act
    const results = paths.map((p) => isSpaShellPathnameAllowed(p));

    // Assert
    expect(results.every(Boolean)).toBe(true);
  });

  it('rejects unknown pathnames', () => {
    // Arrange
    const paths = ['/typo', '/blog/post', '/api'];

    // Act
    const results = paths.map((p) => isSpaShellPathnameAllowed(p));

    // Assert
    expect(results.every((allowed) => !allowed)).toBe(true);
  });
});
