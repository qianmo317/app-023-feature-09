// 列表筛选 / 排序 / 整份复制用例
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { filterScores, sortScores } from '../src/lib/scoreQuery';
import { cloneScore, newEmptyScore } from '../src/lib/factory';
import { getScore, saveScore } from '../src/lib/storage';
import type { Score } from '../src/types';

function mk(
  title: string,
  opts: { style?: string; bpm?: number; bars?: number; updatedAt?: number } = {},
): Score {
  const s = newEmptyScore(title, 4, opts.bars ?? 4);
  if (opts.style !== undefined) s.style = opts.style;
  s.bpm = opts.bpm ?? 100;
  s.updatedAt = opts.updatedAt ?? 1000;
  return s;
}

beforeEach(async () => {
  const dbs = await indexedDB.databases();
  for (const d of dbs) {
    if (d.name) indexedDB.deleteDatabase(d.name);
  }
});

describe('关键字筛选', () => {
  const scores = [
    mk('急急风', { style: '通用 · 京剧/威风锣鼓' }),
    mk('威风锣鼓·排山', { style: '山西威风锣鼓' }),
    mk('马腿儿', { style: '北方锣鼓' }),
    mk('无流派', {}), // style 缺省
  ];

  it('空串或纯空白不筛选，返回全部', () => {
    expect(filterScores(scores, '')).toHaveLength(4);
    expect(filterScores(scores, '   ')).toHaveLength(4);
  });

  it('按曲名片段筛', () => {
    expect(filterScores(scores, '急').map((s) => s.title)).toEqual(['急急风']);
    expect(filterScores(scores, '排山').map((s) => s.title)).toEqual(['威风锣鼓·排山']);
  });

  it('按流派片段筛', () => {
    expect(new Set(filterScores(scores, '威风').map((s) => s.title))).toEqual(
      new Set(['急急风', '威风锣鼓·排山']),
    );
    expect(filterScores(scores, '山西').map((s) => s.title)).toEqual(['威风锣鼓·排山']);
  });

  it('大小写不敏感', () => {
    const ss = [mk('Rocky 段', { style: 'Jingju' })];
    expect(filterScores(ss, 'rocky')).toHaveLength(1);
    expect(filterScores(ss, 'JINGJU')).toHaveLength(1);
  });

  it('无匹配返回空数组', () => {
    expect(filterScores(scores, '不存在的曲名')).toEqual([]);
  });
});

describe('排序', () => {
  const scores = [
    mk('老三', { bpm: 90, bars: 2, updatedAt: 300 }),
    mk('老大', { bpm: 150, bars: 8, updatedAt: 100 }),
    mk('老二', { bpm: 120, bars: 4, updatedAt: 200 }),
  ];

  it('按更新时间正序/倒序', () => {
    expect(sortScores(scores, 'updatedAt', 'asc').map((s) => s.title)).toEqual(['老大', '老二', '老三']);
    expect(sortScores(scores, 'updatedAt', 'desc').map((s) => s.title)).toEqual(['老三', '老二', '老大']);
  });

  it('按曲名正序/倒序（localeCompare，zh-CN 按拼音 大da < 二er < 三san）', () => {
    expect(sortScores(scores, 'title', 'asc').map((s) => s.title)).toEqual(['老大', '老二', '老三']);
    expect(sortScores(scores, 'title', 'desc').map((s) => s.title)).toEqual(['老三', '老二', '老大']);
  });

  it('按小节数正序/倒序', () => {
    expect(sortScores(scores, 'bars', 'asc').map((s) => s.title)).toEqual(['老三', '老二', '老大']);
    expect(sortScores(scores, 'bars', 'desc').map((s) => s.title)).toEqual(['老大', '老二', '老三']);
  });

  it('按速度正序/倒序', () => {
    expect(sortScores(scores, 'bpm', 'asc').map((s) => s.title)).toEqual(['老三', '老二', '老大']);
    expect(sortScores(scores, 'bpm', 'desc').map((s) => s.title)).toEqual(['老大', '老二', '老三']);
  });

  it('同值时保持传入顺序（稳定排序，列表同值即新谱在前）', () => {
    const a = mk('甲', { bpm: 100, updatedAt: 200 });
    const b = mk('乙', { bpm: 100, updatedAt: 100 });
    expect(sortScores([a, b], 'bpm', 'asc').map((s) => s.title)).toEqual(['甲', '乙']);
    expect(sortScores([a, b], 'bpm', 'desc').map((s) => s.title)).toEqual(['甲', '乙']);
  });

  it('不改动传入的数组', () => {
    const originalOrder = scores.map((s) => s.title);
    const sorted = sortScores(scores, 'bpm', 'asc');
    expect(scores.map((s) => s.title)).toEqual(originalOrder);
    expect(sorted).not.toBe(scores);
  });
});

describe('整份复制', () => {
  it('新 id、曲名带副本字样、更新时间刷新', () => {
    const src = mk('开道锣', { bpm: 110, updatedAt: 1000 });
    const copy = cloneScore(src);
    expect(copy.id).not.toBe(src.id);
    expect(copy.title).toBe('开道锣（副本）');
    expect(copy.updatedAt).toBeGreaterThanOrEqual(src.updatedAt);
  });

  it('内容与原谱一致', () => {
    const src = mk('开道锣', { style: '京剧', bpm: 110, bars: 3 });
    const copy = cloneScore(src);
    expect(copy.bpm).toBe(src.bpm);
    expect(copy.style).toBe(src.style);
    expect(copy.freeMeter).toBe(src.freeMeter);
    expect(copy.bars.length).toBe(src.bars.length);
    expect(JSON.stringify(copy.bars)).toBe(JSON.stringify(src.bars));
  });

  it('深拷贝：改副本不影响原谱', () => {
    const src = mk('开道锣', { bars: 2 });
    const copy = cloneScore(src);
    copy.title = '改头换面';
    copy.bpm = 200;
    copy.bars[0].steps[0].hits.push({ instrumentId: 'gu', velocity: 3, glyph: '咚' });
    copy.instruments.push({ ...src.instruments[0], id: 'extra' });
    expect(src.title).toBe('开道锣');
    expect(src.bpm).toBe(100);
    expect(src.bars[0].steps[0].hits).toHaveLength(0);
    expect(src.instruments.length).toBe(copy.instruments.length - 1);
  });

  it('副本独立持久化：原谱与副本各自可读', async () => {
    const src = mk('持久化段', { bars: 2 });
    await saveScore(src);
    const copy = cloneScore(src);
    await saveScore(copy);
    const gotCopy = await getScore(copy.id);
    const gotSrc = await getScore(src.id);
    expect(gotCopy?.title).toBe('持久化段（副本）');
    expect(gotSrc?.title).toBe('持久化段');
    expect(gotCopy?.id).not.toBe(gotSrc?.id);
  });
});
