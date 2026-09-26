// 曲目列表的筛选与排序 —— 纯函数，便于单测
import type { Score } from '../types';

export type SortKey = 'updatedAt' | 'title' | 'bars' | 'bpm';
export type SortDir = 'asc' | 'desc';

/** 关键字筛选：曲名 或 流派 包含片段即命中（大小写不敏感，空串不筛） */
export function filterScores(scores: Score[], keyword: string): Score[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return scores;
  return scores.filter(
    (s) => s.title.toLowerCase().includes(kw) || (s.style ?? '').toLowerCase().includes(kw),
  );
}

/** 排序：更新时间 / 曲名 / 小节数 / 速度，正序倒序均可；不改动原数组。
 *  稳定排序：同值保持传入顺序（列表传入的是按更新时间倒序的全量，即同值时新谱在前）。 */
export function sortScores(scores: Score[], key: SortKey, dir: SortDir): Score[] {
  const sign = dir === 'asc' ? 1 : -1;
  const value = (s: Score): number | string => {
    switch (key) {
      case 'title':
        return s.title;
      case 'bars':
        return s.bars.length;
      case 'bpm':
        return s.bpm;
      default:
        return s.updatedAt;
    }
  };
  return [...scores].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const cmp =
      typeof va === 'string' && typeof vb === 'string'
        ? va.localeCompare(vb, 'zh-CN')
        : Number(va) - Number(vb);
    return sign * cmp;
  });
}
