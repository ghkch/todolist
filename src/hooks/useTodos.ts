import { useCallback, useMemo, useState } from 'react';
import type {
  StorageLoadErrorKind,
  TodoFilter,
  TodoItem,
  UndoState,
} from '../types/todo';
import {
  exportRawStorageBackup,
  loadTodosFromStorage,
  saveTodosToStorage,
} from '../lib/storage';
import {
  calculateTodoStats,
  createTodoId,
  createTodoItem,
  filterAndSearchTodos,
  matchesFilterAndSearch,
  sortTodosByCreatedDesc,
  validateTodoText,
} from '../lib/todoUtils';

/**
 * 할 일 목록의 CRUD, 필터·검색, 실행 취소, localStorage 안전 저장을 관리하는 커스텀 훅
 */
export function useTodos() {
  const initialLoad = useMemo(() => loadTodosFromStorage(), []);

  const [tasks, setTasks] = useState<TodoItem[]>(initialLoad.tasks);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [hiddenNotice, setHiddenNotice] = useState<string | null>(null);

  // 저장소 상태: corrupt/unsupported-version 시 원본 자동 덮어쓰기를 차단
  const [loadError, setLoadError] = useState<StorageLoadErrorKind | null>(initialLoad.error);
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | null>(initialLoad.errorDetail);
  const [rawBackup, setRawBackup] = useState<string | null>(initialLoad.rawBackup);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(
    initialLoad.error === 'access-error' ? initialLoad.errorDetail : null,
  );

  const isOverwriteProtected =
    loadError === 'corrupt' || loadError === 'unsupported-version';

  /** 변경된 목록을 안전하게 저장한다. 원본 보호 중에는 덮어쓰지 않는다. */
  const persistTasks = useCallback(
    (nextTasks: readonly TodoItem[]) => {
      if (isOverwriteProtected) {
        return;
      }
      const result = saveTodosToStorage(nextTasks);
      if (result.ok) {
        setSaveErrorDetail(null);
      } else {
        setSaveErrorDetail(result.errorDetail ?? '저장에 실패했습니다.');
      }
    },
    [isOverwriteProtected],
  );

  /** 새 할 일 추가 */
  const addTodo = useCallback(
    (rawText: string): { ok: boolean; error: string | null } => {
      const validation = validateTodoText(rawText);
      if (validation.error) {
        return { ok: false, error: validation.error };
      }

      const newItem = createTodoItem(validation.text, tasks);
      const nextTasks = sortTodosByCreatedDesc([newItem, ...tasks]);
      setTasks(nextTasks);
      persistTasks(nextTasks);

      if (!matchesFilterAndSearch(newItem, filter, searchQuery)) {
        setHiddenNotice('할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.');
      } else {
        setHiddenNotice(null);
      }

      return { ok: true, error: null };
    },
    [tasks, filter, searchQuery, persistTasks],
  );

  /** 완료/미완료 상태 토글 (정렬 순서는 유지) */
  const toggleTodo = useCallback(
    (id: string) => {
      const nowIso = new Date().toISOString();
      const nextTasks = tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, updatedAt: nowIso }
          : task,
      );
      setTasks(nextTasks);
      persistTasks(nextTasks);
    },
    [tasks, persistTasks],
  );

  /** 할 일 내용 수정 (completed, createdAt 유지) */
  const editTodo = useCallback(
    (id: string, rawText: string): { ok: boolean; error: string | null } => {
      const validation = validateTodoText(rawText);
      if (validation.error) {
        return { ok: false, error: validation.error };
      }

      const nowIso = new Date().toISOString();
      const nextTasks = tasks.map((task) =>
        task.id === id
          ? { ...task, text: validation.text, updatedAt: nowIso }
          : task,
      );
      setTasks(nextTasks);
      persistTasks(nextTasks);
      return { ok: true, error: null };
    },
    [tasks, persistTasks],
  );

  /** 개별 할 일 삭제 (최신 1건 실행 취소 대상 갱신) */
  const deleteTodo = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target) {
        return;
      }
      const nextTasks = tasks.filter((task) => task.id !== id);
      setTasks(nextTasks);
      persistTasks(nextTasks);
      setUndoState({
        undoId: createTodoId(),
        item: target,
      });
    },
    [tasks, persistTasks],
  );

  /** 최근 삭제한 1건 실행 취소 (원래 데이터와 정렬 위치 복원, 다른 레코드 덮어쓰지 않음) */
  const undoDelete = useCallback(() => {
    if (!undoState) {
      return;
    }
    const { item } = undoState;
    const alreadyExists = tasks.some((task) => task.id === item.id);
    if (!alreadyExists) {
      const nextTasks = sortTodosByCreatedDesc([...tasks, item]);
      setTasks(nextTasks);
      persistTasks(nextTasks);

      if (!matchesFilterAndSearch(item, filter, searchQuery)) {
        setHiddenNotice('삭제한 할 일을 복원했어요. 현재 조건에서는 보이지 않습니다.');
      } else {
        setHiddenNotice(null);
      }
    }
    setUndoState(null);
  }, [undoState, tasks, filter, searchQuery, persistTasks]);

  /** 실행 취소 알림 닫기 */
  const dismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  /** 완료 항목 일괄 삭제 (전달된 대상 ID 중 여전히 완료 상태인 항목만 제거) */
  const clearCompletedByIds = useCallback(
    (targetIds: readonly string[]) => {
      const idSet = new Set(targetIds);
      const nextTasks = tasks.filter((task) => !(task.completed && idSet.has(task.id)));
      if (nextTasks.length === tasks.length) {
        return;
      }
      setTasks(nextTasks);
      persistTasks(nextTasks);
      // 일괄 삭제는 되돌릴 수 없으므로 이전 개별 삭제 실행 취소와 혼동되지 않도록 닫는다.
      setUndoState(null);
    },
    [tasks, persistTasks],
  );

  /** 필터/검색 초기화하여 전체 보기 */
  const resetViewToAll = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    setHiddenNotice(null);
  }, []);

  /** 저장 재시도 */
  const retrySave = useCallback(() => {
    if (isOverwriteProtected) {
      return;
    }
    const result = saveTodosToStorage(tasks);
    if (result.ok) {
      setSaveErrorDetail(null);
    } else {
      setSaveErrorDetail(result.errorDetail ?? '저장에 실패했습니다.');
    }
  }, [isOverwriteProtected, tasks]);

  /** 손상된 원본 데이터 내보내기 */
  const exportCorruptBackup = useCallback((): boolean => {
    if (!rawBackup) {
      return false;
    }
    return exportRawStorageBackup(rawBackup);
  }, [rawBackup]);

  /** 사용자 확인 후 손상된 저장소 초기화하고 현재 메모리 상태로 저장 시작 */
  const confirmResetCorruptStorage = useCallback(() => {
    setLoadError(null);
    setLoadErrorDetail(null);
    setRawBackup(null);
    const result = saveTodosToStorage(tasks);
    if (result.ok) {
      setSaveErrorDetail(null);
    } else {
      setSaveErrorDetail(result.errorDetail ?? '저장에 실패했습니다.');
    }
  }, [tasks]);

  const stats = useMemo(() => calculateTodoStats(tasks), [tasks]);
  const visibleTasks = useMemo(
    () => filterAndSearchTodos(tasks, filter, searchQuery),
    [tasks, filter, searchQuery],
  );
  const completedTaskIds = useMemo(
    () => tasks.filter((task) => task.completed).map((task) => task.id),
    [tasks],
  );

  return {
    tasks,
    visibleTasks,
    completedTaskIds,
    stats,
    filter,
    setFilter: useCallback((nextFilter: TodoFilter) => {
      setFilter(nextFilter);
      setHiddenNotice(null);
    }, []),
    searchQuery,
    setSearchQuery: useCallback((nextQuery: string) => {
      setSearchQuery(nextQuery);
      setHiddenNotice(null);
    }, []),
    undoState,
    hiddenNotice,
    dismissHiddenNotice: useCallback(() => setHiddenNotice(null), []),
    loadError,
    loadErrorDetail,
    hasRawBackup: rawBackup !== null,
    isOverwriteProtected,
    saveErrorDetail,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    undoDelete,
    dismissUndo,
    clearCompletedByIds,
    resetViewToAll,
    retrySave,
    exportCorruptBackup,
    confirmResetCorruptStorage,
  };
}
