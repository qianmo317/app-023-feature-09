// 曲目复制用例
import { describe, expect, it } from 'vitest';
import type { Score } from '../src/types';
import { duplicateScore, scoreFromPattern, PATTERNS } from '../src/lib/factory';

describe('duplicateScore 整份复制', () => {
  it('曲名带「副本」字样', () => {
    const src = scoreFromPattern(PATTERNS[0]);
    expect(duplicateScore(src).title).toBe(`${src.title} 副本`);
  });

  it('生成新 id，不与原谱相同', () => {
    const src = scoreFromPattern(PATTERNS[0]);
    expect(duplicateScore(src).id).not.toBe(src.id);
  });

  it('内容与原谱一致（bars/instruments/bpm 等）', () => {
    const src = scoreFromPattern(PATTERNS[1]);
    const copy = duplicateScore(src);
    expect(copy.bpm).toBe(src.bpm);
    expect(copy.freeMeter).toBe(src.freeMeter);
    expect(copy.style).toBe(src.style);
    expect(JSON.stringify(copy.bars)).toBe(JSON.stringify(src.bars));
    expect(JSON.stringify(copy.instruments)).toBe(JSON.stringify(src.instruments));
  });

  it('副本是深拷贝：改副本不影响原谱', () => {
    const src = scoreFromPattern(PATTERNS[0]);
    const copy = duplicateScore(src);
    copy.bars[0].steps[0].hits.push({ instrumentId: 'fake', velocity: 3 });
    copy.bpm = 999;
    expect(src.bpm).not.toBe(999);
    const origFirst = src.bars[0].steps[0].hits.length;
    expect(src.bars[0].steps[0].hits).toHaveLength(origFirst);
  });

  it('连续复制两份彼此独立', () => {
    const src = scoreFromPattern(PATTERNS[0]);
    const c1 = duplicateScore(src);
    const c2 = duplicateScore(src);
    expect(c1.id).not.toBe(c2.id);
    expect((c1 as Score).id).not.toBe(src.id);
  });
});
