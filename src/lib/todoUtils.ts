import type { TodoFilter, TodoItem, TodoStats } from '../types/todo';

/** 할 일 최대 글자 수 */
export const MAX_TODO_LENGTH = 200;

/**
 * 할 일 입력값을 검증하고 앞뒤 공백을 제거한 문자열을 반환한다.
 * 빈 문자열이거나 최대 길이를 초과하면 오류 메시지를 반환한다.
 */
export function validateTodoText(raw: string): { text: string; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { text: '', error: '할 일을 입력해 주세요.' };
  }
  if (trimmed.length > MAX_TODO_LENGTH) {
    return {
      text: trimmed,
      error: `할 일은 최대 ${MAX_TODO_LENGTH}자까지 입력할 수 있어요.`,
    };
  }
  return { text: trimmed, error: null };
}

/**
 * 새 할 일의 고유 ID를 생성한다.
 * crypto.randomUUID가 없는 환경에서도 안전한 대체 ID를 생성한다.
 */
export function createTodoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 목록을 createdAt 내림차순(최신 항목 위)으로 정렬한다.
 * 완료 여부나 수정 시각으로는 재정렬하지 않는다.
 */
export function sortTodosByCreatedDesc(tasks: readonly TodoItem[]): TodoItem[] {
  return [...tasks].sort((a, b) => {
    const timeDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return b.id.localeCompare(a.id);
  });
}

/**
 * 새 할 일 항목을 생성한다.
 * 같은 밀리초에 연속 추가되더라도 최신 항목이 항상 최상단에 유지되도록
 * 기존 최대 createdAt보다 최소 1ms 큰 타임스탬프를 보장한다.
 */
export function createTodoItem(text: string, existingTasks: readonly TodoItem[]): TodoItem {
  let nowMs = Date.now();
  for (const task of existingTasks) {
    const taskMs = Date.parse(task.createdAt);
    if (!Number.isNaN(taskMs) && taskMs >= nowMs) {
      nowMs = taskMs + 1;
    }
  }
  const iso = new Date(nowMs).toISOString();
  return {
    id: createTodoId(),
    text,
    completed: false,
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * 개별 항목이 현재 필터와 검색어 조건에 일치하는지 판별한다.
 */
export function matchesFilterAndSearch(
  item: TodoItem,
  filter: TodoFilter,
  searchQuery: string,
): boolean {
  if (filter === 'active' && item.completed) {
    return false;
  }
  if (filter === 'completed' && !item.completed) {
    return false;
  }
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');
  if (normalizedQuery.length === 0) {
    return true;
  }
  return item.text.toLocaleLowerCase('ko-KR').includes(normalizedQuery);
}

/**
 * 상태 필터와 검색어를 교집합으로 적용해 표시할 목록을 반환한다.
 */
export function filterAndSearchTodos(
  tasks: readonly TodoItem[],
  filter: TodoFilter,
  searchQuery: string,
): TodoItem[] {
  return tasks.filter((task) => matchesFilterAndSearch(task, filter, searchQuery));
}

/**
 * 전체 할 일 기준 통계를 계산한다.
 * 항목이 0개일 때 0으로 나누는 오류를 방지하고 0%를 반환한다.
 */
export function calculateTodoStats(tasks: readonly TodoItem[]): TodoStats {
  const total = tasks.length;
  const completed = tasks.reduce((count, task) => count + (task.completed ? 1 : 0), 0);
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, remaining, percent };
}

/**
 * 기기 로컬 날짜를 한국어 형식으로 포맷한다. (예: 2026년 11월 26일 목요일)
 */
export function formatKoreanDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  } catch {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
}

/**
 * ISO 8601 날짜 문자열이 유효한지 검증한다.
 */
export function isValidIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}
