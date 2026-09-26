// 曲目列表的筛选与排序（纯函数，便于单测）
import type { Score } from '../types';

export type SortKey = 'updatedAt' | 'title' | 'bars' | 'bpm';
export type SortDir = 'asc' | 'desc';

export const SORT_LABELS: Record<SortKey, string> = {
  updatedAt: '更新时间',
  title: '曲名',
  bars: '小节数',
  bpm: '速度',
};

/** 按曲名或流派的片段筛选（大小写不敏感，去首尾空白） */
export function filterScores(scores: Score[], keyword: string): Score[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return scores;
  return scores.filter((s) => s.title.toLowerCase().includes(kw) || (s.style ?? '').toLowerCase().includes(kw));
}

/** 排序：更新时间/曲名/小节数/速度，正序或倒序 */
export function sortScores(scores: Score[], key: SortKey, dir: SortDir): Score[] {
  const cmp = (a: Score, b: Score): number => {
    switch (key) {
      case 'updatedAt':
        return a.updatedAt - b.updatedAt;
      case 'title':
        return a.title.localeCompare(b.title, 'zh-Hans-CN');
      case 'bars':
        return a.bars.length - b.bars.length;
      case 'bpm':
        return a.bpm - b.bpm;
    }
  };
  const sorted = [...scores].sort(cmp);
  return dir === 'asc' ? sorted : sorted.reverse();
}
