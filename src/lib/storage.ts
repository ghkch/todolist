import type {
  StorageLoadResult,
  StorageSaveResult,
  TodoItem,
  TodoStorageSchema,
} from '../types/todo';
import {
  MAX_TODO_LENGTH,
  isValidIsoDateString,
  sortTodosByCreatedDesc,
} from './todoUtils';

/** localStorage 저장 키 */
export const STORAGE_KEY = 'todo-app:v1';

/** 현재 지원하는 스키마 버전 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * 개별 할 일 객체의 필드 타입·필수 값·날짜 유효성을 검증한다.
 */
function isValidTodoItem(value: unknown): value is TodoItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
    return false;
  }
  if (
    typeof candidate.text !== 'string' ||
    candidate.text.trim().length === 0 ||
    candidate.text.trim().length > MAX_TODO_LENGTH
  ) {
    return false;
  }
  if (typeof candidate.completed !== 'boolean') {
    return false;
  }
  if (!isValidIsoDateString(candidate.createdAt)) {
    return false;
  }
  if (!isValidIsoDateString(candidate.updatedAt)) {
    return false;
  }
  return true;
}

/**
 * localStorage에서 할 일 목록을 안전하게 불러온다.
 * JSON 파싱 실패, 스키마 불일치, 중복 ID, 알 수 없는 상위 버전인 경우
 * 원본 데이터를 덮어쓰지 않고 오류 정보와 원본 문자열을 함께 반환한다.
 */
export function loadTodosFromStorage(): StorageLoadResult {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      tasks: [],
      error: 'access-error',
      errorDetail: '브라우저 저장소에 접근할 수 없습니다.',
      rawBackup: null,
    };
  }

  if (raw === null) {
    return {
      tasks: [],
      error: null,
      errorDetail: null,
      rawBackup: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      tasks: [],
      error: 'corrupt',
      errorDetail: '저장된 JSON 형식이 올바르지 않습니다.',
      rawBackup: raw,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      tasks: [],
      error: 'corrupt',
      errorDetail: '저장 데이터 구조가 올바르지 않습니다.',
      rawBackup: raw,
    };
  }

  const record = parsed as Record<string, unknown>;

  if (typeof record.schemaVersion !== 'number' || !Number.isInteger(record.schemaVersion)) {
    return {
      tasks: [],
      error: 'corrupt',
      errorDetail: '저장 데이터 버전 정보가 올바르지 않습니다.',
      rawBackup: raw,
    };
  }

  if (record.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      tasks: [],
      error: 'unsupported-version',
      errorDetail: `현재 앱이 지원하지 않는 상위 저장 버전(v${record.schemaVersion})입니다.`,
      rawBackup: raw,
    };
  }

  if (record.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return {
      tasks: [],
      error: 'corrupt',
      errorDetail: `알 수 없는 저장 버전(v${record.schemaVersion})입니다.`,
      rawBackup: raw,
    };
  }

  if (!Array.isArray(record.tasks)) {
    return {
      tasks: [],
      error: 'corrupt',
      errorDetail: '할 일 목록 데이터가 배열 형식이 아닙니다.',
      rawBackup: raw,
    };
  }

  const seenIds = new Set<string>();
  const validatedTasks: TodoItem[] = [];

  for (const item of record.tasks) {
    if (!isValidTodoItem(item)) {
      return {
        tasks: [],
        error: 'corrupt',
        errorDetail: '할 일 항목 중 필수 정보나 날짜 형식이 잘못된 데이터가 있습니다.',
        rawBackup: raw,
      };
    }
    if (seenIds.has(item.id)) {
      return {
        tasks: [],
        error: 'corrupt',
        errorDetail: '중복된 항목 ID가 발견되었습니다.',
        rawBackup: raw,
      };
    }
    seenIds.add(item.id);
    validatedTasks.push({
      id: item.id,
      text: item.text.trim(),
      completed: item.completed,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }

  return {
    tasks: sortTodosByCreatedDesc(validatedTasks),
    error: null,
    errorDetail: null,
    rawBackup: null,
  };
}

/**
 * 할 일 목록을 스키마 버전과 함께 localStorage에 저장한다.
 * 저장 실패 시 예외를 삼키고 결과 객체로 반환하여 앱이 메모리 상태로 계속 동작하게 한다.
 */
export function saveTodosToStorage(tasks: readonly TodoItem[]): StorageSaveResult {
  const payload: TodoStorageSchema = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tasks: [...tasks],
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, errorDetail: null };
  } catch (err) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      errorDetail: isQuotaError
        ? '브라우저 저장 공간이 부족합니다.'
        : '브라우저 저장소에 기록하지 못했습니다.',
    };
  }
}

/**
 * 손상된 원본 데이터를 JSON 파일로 다운로드할 수 있게 내보낸다.
 */
export function exportRawStorageBackup(rawBackup: string): boolean {
  try {
    const blob = new Blob([rawBackup], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todolist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
