import { useRef } from 'react';
import type { TodoFilter } from '../types/todo';
import { CheckIcon, CloseIcon, SearchIcon } from './Icons';

interface FilterBarProps {
  filter: TodoFilter;
  onFilterChange: (next: TodoFilter) => void;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  visibleCount: number;
  totalCount: number;
}

const FILTER_OPTIONS: ReadonlyArray<{ value: TodoFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'completed', label: '완료' },
];

/**
 * 상태 필터(전체/진행 중/완료)와 검색 입력 영역.
 * 필터는 button + aria-pressed로 구현하며 선택 상태를 색상 외 테두리·체크 아이콘으로도 표시한다.
 */
export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  visibleCount,
  totalCount,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasSearch = searchQuery.length > 0;
  const isFiltered = filter !== 'all' || searchQuery.trim().length > 0;

  return (
    <section className="controls-section" aria-label="할 일 필터 및 검색">
      <div className="controls-row">
        <div className="filter-group" role="group" aria-label="할 일 상태 필터">
          {FILTER_OPTIONS.map((option) => {
            const isSelected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className="filter-btn"
                aria-pressed={isSelected}
                onClick={() => onFilterChange(option.value)}
              >
                {isSelected && <CheckIcon size={14} />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="search-wrap">
          <label htmlFor="todo-search-input" className="sr-only">
            할 일 검색
          </label>
          <span className="search-icon">
            <SearchIcon />
          </span>
          <input
            ref={searchInputRef}
            id="todo-search-input"
            type="search"
            className="search-input"
            value={searchQuery}
            placeholder="할 일 검색"
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {hasSearch && (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="검색어 초기화"
              onClick={() => {
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {isFiltered && totalCount > 0 && (
        <p className="result-count">
          현재 조건에 맞는 할 일 {visibleCount}개 (전체 {totalCount}개 중)
        </p>
      )}
    </section>
  );
}
