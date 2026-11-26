import type { UndoState } from '../types/todo';

interface UndoToastProps {
  undoState: UndoState | null;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * 개별 삭제 직후 하단에 표시되는 실행 취소 알림.
 * 자동 소멸하지 않으며, 닫기 또는 새 삭제 시 교체된다.
 */
export function UndoToast({ undoState, onUndo, onDismiss }: UndoToastProps) {
  if (!undoState) {
    return null;
  }

  return (
    <div className="undo-toast-region" aria-live="polite">
      <div className="undo-toast" role="status">
        <span className="undo-toast-text">할 일을 삭제했어요.</span>
        <div className="undo-toast-actions">
          <button
            type="button"
            className="toast-btn toast-btn-undo"
            onClick={onUndo}
          >
            실행 취소
          </button>
          <button
            type="button"
            className="toast-btn toast-btn-close"
            onClick={onDismiss}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
