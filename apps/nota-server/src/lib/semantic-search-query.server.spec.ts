import { describe, expect, test } from 'bun:test';
import { parseSemanticSearchQuery } from './semantic-search-query.server.ts';

describe('parseSemanticSearchQuery', () => {
  test('semantic only', () => {
    expect(parseSemanticSearchQuery('that weird bug with the router')).toEqual({
      semantic: 'that weird bug with the router',
      literals: [],
    });
  });

  test('literal only', () => {
    expect(parseSemanticSearchQuery('"Next.js router"')).toEqual({
      semantic: '',
      literals: ['Next.js router'],
    });
  });

  test('mixed semantic and quoted literal', () => {
    expect(parseSemanticSearchQuery('summer "Next.js" bug')).toEqual({
      semantic: 'summer bug',
      literals: ['Next.js'],
    });
  });

  test('escaped quote inside literal', () => {
    expect(parseSemanticSearchQuery('"say \\"hello\\""')).toEqual({
      semantic: '',
      literals: ['say "hello"'],
    });
  });

  test('multiple literals', () => {
    expect(parseSemanticSearchQuery('"foo" bar "baz"')).toEqual({
      semantic: 'bar',
      literals: ['foo', 'baz'],
    });
  });
});
