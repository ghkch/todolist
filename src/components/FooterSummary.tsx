import type { RefObject } from 'react';

interface FooterSummaryProps {
  remainingCount: number;
  completedCount: number;
  clearButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenClearDialog: () => void;
  saveErrorDetail: string | null;
  isOverwriteProtected: boolean;
  onRetrySave: () => void;
}

/**
 * 하단 요약 영역: 전체 기준 남은 할 일 수, 완료 항목 일괄 삭제 버튼, 브라우저 저장 상태 안내.
 */
export function FooterSummary({
  remainingCount,
  completedCount,
  clearButtonRef,
  onOpenClearDialog,
  saveErrorDetail,
  isOverwriteProtected,
  onRetrySave,
}: FooterSummaryProps) {
  const hasSaveError = saveErrorDetail !== null;

  return (
    <footer className="footer-summary">
      <div className="footer-top">
        <p className="remaining-count">남은 할 일 {remainingCount}개</p>
        <button
          ref={clearButtonRef}
          type="button"
          className="btn btn-destructive btn-compact"
          disabled={completedCount === 0}
          onClick={onOpenClearDialog}
        >
          완료 항목 삭제
        </button>
      </div>

      {hasSaveError ? (
        <div className="storage-status" data-error="true" role="alert">
          <span>
            변경 내용을 이 브라우저에 저장하지 못했어요. 창을 닫으면 사라질 수 있습니다.
            {saveErrorDetail ? ` (${saveErrorDetail})` : ''}
          </span>
          {!isOverwriteProtected && (
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={onRetrySave}
            >
              저장 다시 시도
            </button>
          )}
        </div>
      ) : isOverwriteProtected ? (
        <p className="storage-status">
          기존 저장 데이터를 보호하기 위해 자동 저장이 일시 중지되어 있습니다.
        </p>
      ) : (
        <p className="storage-status">이 브라우저에 자동 저장됩니다.</p>
      )}
    </footer>
  );
}
