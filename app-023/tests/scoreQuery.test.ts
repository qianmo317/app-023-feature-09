// 曲目列表筛选 / 排序用例
import { describe, expect, it } from 'vitest';
import type { Score } from '../src/types';
import { filterScores, sortScores } from '../src/lib/scoreQuery';

const mk = (over: Partial<Score> & Pick<Score, 'id' | 'title'>): Score => ({
  bpm: 100,
  bars: [],
  instruments: [],
  freeMeter: false,
  updatedAt: 0,
  ...over,
});

const scores: Score[] = [
  mk({ id: 'a', title: '急急风', style: '通用 · 京剧', bpm: 152, updatedAt: 300, bars: [{}, {}, {}] as Score['bars'] }),
  mk({ id: 'b', title: '威风锣鼓·排山', style: '山西威风锣鼓', bpm: 108, updatedAt: 100, bars: [{}, {}, {}] as Score['bars'] }),
  mk({ id: 'c', title: '马腿儿', style: '北方锣鼓', bpm: 120, updatedAt: 200, bars: [{}] as Score['bars'] }),
  mk({ id: 'd', title: '未命名锣鼓段', updatedAt: 400, bars: [] }),
];

describe('filterScores 关键字筛选', () => {
  it('空关键字返回全部', () => {
    expect(filterScores(scores, '').map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(filterScores(scores, '   ')).toHaveLength(4);
  });

  it('按曲名片段筛', () => {
    expect(filterScores(scores, '马腿').map((s) => s.id)).toEqual(['c']);
    // 「锣鼓」同时命曲名（b、d）与流派（c 北方锣鼓），a 不命中
    expect(filterScores(scores, '锣鼓').map((s) => s.id)).toEqual(['b', 'c', 'd']);
    expect(filterScores(scores, '急急').map((s) => s.id)).toEqual(['a']);
  });

  it('按流派片段筛', () => {
    expect(filterScores(scores, '京剧').map((s) => s.id)).toEqual(['a']);
    expect(filterScores(scores, '山西').map((s) => s.id)).toEqual(['b']);
  });

  it('大小写不敏感、忽略首尾空白', () => {
    expect(filterScores(scores, '  BPM ')).toEqual([]);
    const en = [mk({ id: 'e', title: 'Open Gong', style: 'Beijing Opera' })];
    expect(filterScores(en, 'beijing').map((s) => s.id)).toEqual(['e']);
  });

  it('无流派字段的曲目不报错', () => {
    expect(filterScores(scores, '未命名').map((s) => s.id)).toEqual(['d']);
  });
});

describe('sortScores 排序', () => {
  it('更新时间倒序 / 正序', () => {
    expect(sortScores(scores, 'updatedAt', 'desc').map((s) => s.id)).toEqual(['d', 'a', 'c', 'b']);
    expect(sortScores(scores, 'updatedAt', 'asc').map((s) => s.id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('曲名正序 / 倒序', () => {
    const asc = sortScores(scores, 'title', 'asc').map((s) => s.id);
    expect(asc[0]).toBe('a'); // 急急风
    expect(sortScores(scores, 'title', 'desc').map((s) => s.id)).toEqual([...asc].reverse());
  });

  it('按小节数排序', () => {
    expect(sortScores(scores, 'bars', 'asc').map((s) => s.id)).toEqual(['d', 'c', 'a', 'b']);
    expect(sortScores(scores, 'bars', 'desc').map((s) => s.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('按速度 BPM 排序', () => {
    expect(sortScores(scores, 'bpm', 'asc').map((s) => s.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(sortScores(scores, 'bpm', 'desc').map((s) => s.id)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('不改原数组顺序', () => {
    const before = scores.map((s) => s.id);
    sortScores(scores, 'title', 'asc');
    expect(scores.map((s) => s.id)).toEqual(before);
  });
});
