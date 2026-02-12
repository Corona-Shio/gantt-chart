import { describe, expect, it } from 'vitest';
import { compareScriptNo } from './scriptSort';

describe('compareScriptNo', () => {
  it('sorts natural order for numeric and suffix patterns', () => {
    const values = ['715', '714A', '714', '714B', '713'];
    values.sort(compareScriptNo);
    expect(values).toEqual(['713', '714', '714A', '714B', '715']);
  });

  it('keeps numeric chunk before alpha chunk', () => {
    const values = ['20B', '20', '20A'];
    values.sort(compareScriptNo);
    expect(values).toEqual(['20', '20A', '20B']);
  });
});
