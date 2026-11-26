import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';

interface ConfirmClearDialogProps {
  isOpen: boolean;
  /** 대화상자가 열릴 때 스냅샷으로 전달된 삭제 대상 완료 ID 목록 */
  targetIds: readonly string[];
  /** 현재 실제 완료 상태인 ID 목록 (열려 있는 동안 변경 시 재검증용) */
  currentCompletedIds: readonly string[];
  onConfirm: (validTargetIds: readonly string[]) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  fallbackFocusRef: RefObject<HTMLInputElement | null>;
}

/**
 * 완료 항목 일괄 삭제 확인 대화상자 (native <dialog>).
 * 열릴 때 취소에 포커스, Esc 및 배경 클릭 취소, 닫힘 시 호출 버튼(또는 유효 대체 요소)으로 포커스 복귀를 처리한다.
 */
export function ConfirmClearDialog({
  isOpen,
  targetIds,
  currentCompletedIds,
  onConfirm,
  onClose,
  returnFocusRef,
  fallbackFocusRef,
}: ConfirmClearDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  // 열려 있는 동안 목록 상태가 바뀌면 실제 완료 상태인 대상 ID만 재검증
  const validTargetIds = useMemo(() => {
    const currentSet = new Set(currentCompletedIds);
    return targetIds.filter((id) => currentSet.has(id));
  }, [targetIds, currentCompletedIds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      wasOpenRef.current = true;
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
      cancelButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      }
      // 닫힘 후 호출 버튼으로 포커스 복귀 (비활성화되었으면 입력창으로 이동)
      const trigger = returnFocusRef.current;
      if (trigger && !trigger.disabled) {
        trigger.focus();
      } else {
        fallbackFocusRef.current?.focus();
      }
    }
  }, [isOpen, returnFocusRef, fallbackFocusRef]);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const count = validTargetIds.length;

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="clear-dialog-title"
      aria-describedby="clear-dialog-desc"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
    >
      <div className="confirm-dialog-body">
        <h2 id="clear-dialog-title" className="confirm-dialog-title">
          완료한 할 일을 삭제할까요?
        </h2>
        <p id="clear-dialog-desc" className="confirm-dialog-desc">
          완료한 할 일 {count}개가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="confirm-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-secondary btn-compact"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-danger-solid btn-compact"
            disabled={count === 0}
            onClick={() => onConfirm(validTargetIds)}
          >
            {count}개 삭제
          </button>
        </div>
      </div>
    </dialog>
  );
}
