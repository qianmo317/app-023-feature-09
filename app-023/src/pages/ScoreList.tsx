// 曲目列表 /
import { useEffect, useMemo, useState } from 'react';
import type { Score } from '../types';
import { deleteScore, getScore, listScores, saveScore } from '../lib/storage';
import { duplicateScore, newEmptyScore, PATTERNS } from '../lib/factory';
import { filterScores, SORT_LABELS, sortScores, type SortDir, type SortKey } from '../lib/scoreQuery';

export function ScoreList() {
  const [scores, setScores] = useState<Score[]>([]);
  const [title, setTitle] = useState('');
  const [bpb, setBpb] = useState(4);
  const [free, setFree] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const refresh = () => listScores().then(setScores);
  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    const s = newEmptyScore(title.trim() || '未命名锣鼓段', bpb, 4);
    if (free) s.freeMeter = true;
    await saveScore(s);
    setTitle('');
    window.location.hash = `#/score/${s.id}`;
  };

  const duplicate = async (id: string) => {
    const src = await getScore(id);
    if (!src) return;
    await saveScore(duplicateScore(src));
    await refresh();
  };

  const visible = useMemo(
    () => sortScores(filterScores(scores, keyword), sortKey, sortDir),
    [scores, keyword, sortKey, sortDir],
  );

  return (
    <div className="page" data-testid="score-list">
      <h1>曲目</h1>
      <div className="create-box">
        <input data-testid="new-title" placeholder="曲目名，如：开道锣" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select data-testid="new-bpb" value={bpb} onChange={(e) => setBpb(Number(e.target.value))}>
          <option value={2}>2/4</option>
          <option value={3}>3/4</option>
          <option value={4}>4/4</option>
        </select>
        <label className="dim">
          <input type="checkbox" data-testid="new-free" checked={free} onChange={(e) => setFree(e.target.checked)} />
          散板
        </label>
        <button className="btn primary" data-testid="btn-create" onClick={create}>
          新建空白谱
        </button>
        <button
          className="btn"
          data-testid="btn-from-library"
          onClick={() => (window.location.hash = '#/library')}
        >
          从曲牌库创建
        </button>
      </div>

      {scores.length > 0 && (
        <div className="list-tools">
          <input
            className="keyword-input"
            data-testid="filter-keyword"
            placeholder="按曲名或流派筛选，输入即筛"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <label className="dim">
            排序
            <select
              data-testid="sort-key"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn-sm"
            data-testid="sort-dir"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDir === 'asc' ? '↑ 正序' : '↓ 倒序'}
          </button>
          <span className="list-count dim" data-testid="list-count">
            共 {scores.length} 份，当前显示 {visible.length} 份
          </span>
        </div>
      )}

      {scores.length === 0 ? (
        <p className="dim">还没有曲目。可新建空白谱，或从曲牌库载入「急急风」「四击头」等骨架再改。</p>
      ) : visible.length === 0 ? (
        <p className="dim" data-testid="list-empty-filter">
          没有匹配「{keyword}」的曲目。
        </p>
      ) : (
        <table className="list" data-testid="score-table">
          <thead>
            <tr>
              <th>曲名</th>
              <th>流派</th>
              <th>拍号</th>
              <th>小节</th>
              <th>BPM</th>
              <th>更新</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id} data-testid={`score-row-${s.id}`}>
                <td>
                  <a href={`#/score/${s.id}`} className="score-link">
                    {s.title}
                  </a>
                </td>
                <td className="dim">{s.style ?? '—'}</td>
                <td>{s.freeMeter ? '散板' : `${s.bars[0]?.beatsPerBar ?? 4}/4`}</td>
                <td>{s.bars.length}</td>
                <td>{s.bpm}</td>
                <td className="dim">{new Date(s.updatedAt).toLocaleString('zh-CN')}</td>
                <td>
                  <a href={`#/score/${s.id}/print`}>打印</a>
                  <button className="mini" data-testid={`dup-${s.id}`} onClick={() => void duplicate(s.id)}>
                    复制
                  </button>
                  <button
                    className="mini danger"
                    data-testid={`del-${s.id}`}
                    onClick={async () => {
                      if (confirm(`删除「${s.title}」？`)) {
                        await deleteScore(s.id);
                        void refresh();
                      }
                    }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="dim">内置曲牌：{PATTERNS.map((p) => p.name).join(' / ')}</p>
    </div>
  );
}
