import type { TodoFilter, TodoItem as TodoItemModel } from '../types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  visibleTasks: readonly TodoItemModel[];
  totalCount: number;
  filter: TodoFilter;
  searchQuery: string;
  onToggle: (id: string) => void;
  onEdit: (id: string, nextText: string) => { ok: boolean; error: string | null };
  onDelete: (id: string) => void;
  onFocusAddInput: () => void;
  onClearSearch: () => void;
  onShowAll: () => void;
  registerDeleteButtonRef: (id: string, node: HTMLButtonElement | null) => void;
}

/**
 * 할 일 목록 및 DESIGN.md 기준 빈 상태(전체 없음 / 검색 결과 없음 / 필터 결과 없음)를 렌더링한다.
 */
export function TodoList({
  visibleTasks,
  totalCount,
  filter,
  searchQuery,
  onToggle,
  onEdit,
  onDelete,
  onFocusAddInput,
  onClearSearch,
  onShowAll,
  registerDeleteButtonRef,
}: TodoListProps) {
  if (totalCount === 0) {
    return (
      <section className="empty-state" aria-label="할 일 목록 비어 있음">
        <p className="empty-state-title">아직 할 일이 없어요</p>
        <p className="empty-state-desc">첫 할 일을 입력해 보세요.</p>
        <button
          type="button"
          className="btn btn-primary btn-compact"
          onClick={onFocusAddInput}
        >
          할 일 입력하기
        </button>
      </section>
    );
  }

  if (visibleTasks.length === 0) {
    // 검색어가 있으면 검색 결과 없음 상태를 우선한다.
    if (searchQuery.trim().length > 0) {
      return (
        <section className="empty-state" aria-label="검색 결과 없음">
          <p className="empty-state-title">일치하는 할 일이 없어요</p>
          <p className="empty-state-desc">
            다른 검색어를 입력하거나 검색어를 지워 보세요.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-compact"
            onClick={onClearSearch}
          >
            검색어 초기화
          </button>
        </section>
      );
    }

    if (filter === 'active') {
      return (
        <section className="empty-state" aria-label="진행 중인 할 일 없음">
          <p className="empty-state-title">진행 중인 할 일이 없어요</p>
          <p className="empty-state-desc">등록한 할 일을 모두 마쳤어요.</p>
        </section>
      );
    }

    if (filter === 'completed') {
      return (
        <section className="empty-state" aria-label="완료한 할 일 없음">
          <p className="empty-state-title">아직 완료한 할 일이 없어요</p>
          <p className="empty-state-desc">할 일을 마친 뒤 체크박스를 눌러 보세요.</p>
        </section>
      );
    }

    return (
      <section className="empty-state" aria-label="조건에 맞는 할 일 없음">
        <p className="empty-state-title">이 조건에 맞는 할 일이 없어요</p>
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          onClick={onShowAll}
        >
          전체 보기
        </button>
      </section>
    );
  }

  return (
    <section aria-label="할 일 목록">
      <ul className="todo-list">
        {visibleTasks.map((item) => (
          <TodoItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            registerDeleteButtonRef={registerDeleteButtonRef}
          />
        ))}
      </ul>
    </section>
  );
}
