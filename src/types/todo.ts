/** 개별 할 일 데이터 모델 */
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  /** ISO 8601 생성 시각 (정렬 기준: 내림차순) */
  createdAt: string;
  /** ISO 8601 최종 수정 시각 */
  updatedAt: string;
}

/** 목록 필터 상태 */
export type TodoFilter = 'all' | 'active' | 'completed';

/** localStorage 영구 저장 스키마 */
export interface TodoStorageSchema {
  schemaVersion: number;
  tasks: TodoItem[];
}

/** 저장소 오류 상태 유형 */
export type StorageLoadErrorKind = 'corrupt' | 'unsupported-version' | 'access-error';

/** 저장소 로드 결과 */
export interface StorageLoadResult {
  tasks: TodoItem[];
  error: StorageLoadErrorKind | null;
  errorDetail: string | null;
  rawBackup: string | null;
}

/** 저장소 쓰기 결과 */
export interface StorageSaveResult {
  ok: boolean;
  errorDetail: string | null;
}

/** 개별 삭제 실행 취소 상태 (최신 삭제 1건만 유지) */
export interface UndoState {
  undoId: string;
  item: TodoItem;
}

/** 할 일 통계 정보 */
export interface TodoStats {
  total: number;
  completed: number;
  remaining: number;
  percent: number;
}
