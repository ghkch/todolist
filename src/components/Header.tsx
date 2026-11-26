import { useMemo } from 'react';
import type { TodoStats } from '../types/todo';
import { formatKoreanDate } from '../lib/todoUtils';

interface HeaderProps {
  stats: TodoStats;
}

/**
 * 상단 헤더: 한국어 로컬 날짜, 제목, 부제, 전체·완료 수 및 접근 가능한 진행률 바를 표시한다.
 */
export function Header({ stats }: HeaderProps) {
  const todayLabel = useMemo(() => formatKoreanDate(new Date()), []);

  return (
    <header className="app-header">
      <div className="header-top">
        <p className="header-date">{todayLabel}</p>
        <h1 className="header-title">나의 할 일</h1>
        <p className="header-subtitle">작은 실천으로 채우는 하루</p>
      </div>

      <div className="progress-panel" aria-label="오늘의 할 일 현황">
        <div className="progress-meta">
          <div className="progress-counts">
            <span>
              전체 <strong>{stats.total}</strong>개
            </span>
            <span>
              완료 <strong>{stats.completed}</strong>개
            </span>
            <span>
              남음 <strong>{stats.remaining}</strong>개
            </span>
          </div>
          <span className="progress-percent" aria-hidden="true">
            {stats.percent}%
          </span>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="할 일 완료율"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.percent}
          aria-valuetext={`${stats.percent}% (${stats.completed}개 완료 / 전체 ${stats.total}개)`}
        >
          <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
        </div>
      </div>
    </header>
  );
}
