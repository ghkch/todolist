import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  loadTodosFromStorage,
  saveTodosToStorage,
} from '../lib/storage';
import type { TodoItem } from '../types/todo';

const sampleTask: TodoItem = {
  id: 'task-1',
  text: '장보기',
  completed: false,
  createdAt: '2026-11-26T01:00:00.000Z',
  updatedAt: '2026-11-26T01:00:00.000Z',
};

describe('storage 유틸리티', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('스키마 버전과 함께 저장하고 불러온다', () => {
    const saveResult = saveTodosToStorage([sampleTask]);
    expect(saveResult.ok).toBe(true);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(parsed.tasks).toHaveLength(1);

    const loaded = loadTodosFromStorage();
    expect(loaded.error).toBeNull();
    expect(loaded.tasks).toEqual([sampleTask]);
  });

  it('JSON 파싱 실패 시 원본을 보존하고 corrupt 오류를 반환한다', () => {
    const broken = '{not-valid-json';
    window.localStorage.setItem(STORAGE_KEY, broken);

    const loaded = loadTodosFromStorage();
    expect(loaded.error).toBe('corrupt');
    expect(loaded.rawBackup).toBe(broken);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(broken);
  });

  it('상위 스키마 버전은 덮어쓰지 않고 unsupported-version 오류를 반환한다', () => {
    const futureData = JSON.stringify({
      schemaVersion: 99,
      tasks: [sampleTask],
    });
    window.localStorage.setItem(STORAGE_KEY, futureData);

    const loaded = loadTodosFromStorage();
    expect(loaded.error).toBe('unsupported-version');
    expect(loaded.rawBackup).toBe(futureData);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(futureData);
  });

  it('중복 ID 또는 잘못된 날짜가 있으면 corrupt 오류를 반환한다', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [sampleTask, { ...sampleTask }],
      }),
    );
    expect(loadTodosFromStorage().error).toBe('corrupt');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        tasks: [{ ...sampleTask, createdAt: 'not-a-date' }],
      }),
    );
    expect(loadTodosFromStorage().error).toBe('corrupt');
  });

  it('localStorage 접근 또는 쓰기 실패를 안전하게 처리한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const loaded = loadTodosFromStorage();
    expect(loaded.error).toBe('access-error');
    expect(loaded.tasks).toEqual([]);

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    const saved = saveTodosToStorage([sampleTask]);
    expect(saved.ok).toBe(false);
    expect(saved.errorDetail).toContain('저장 공간');
  });
});
