import { useState } from 'react';
import type { StorageLoadErrorKind } from '../types/todo';

interface StorageCorruptBannerProps {
  loadError: StorageLoadErrorKind | null;
  errorDetail: string | null;
  hasRawBackup: boolean;
  onExportBackup: () => boolean;
  onConfirmReset: () => void;
}

/**
 * 저장 데이터가 손상되었거나 지원하지 않는 상위 버전일 때 표시하는 보호 배너.
 * 기존 데이터를 자동으로 덮어쓰지 않고 내보내기 또는 사용자 확인 후 초기화 경로를 제공한다.
 */
export function StorageCorruptBanner({
  loadError,
  errorDetail,
  hasRawBackup,
  onExportBackup,
  onConfirmReset,
}: StorageCorruptBannerProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  if (loadError !== 'corrupt' && loadError !== 'unsupported-version') {
    return null;
  }

  return (
    <section className="corrupt-banner" role="alert" aria-label="저장 데이터 오류 안내">
      <p className="corrupt-banner-title">
        저장된 목록을 읽지 못했어요. 기존 데이터는 덮어쓰지 않았습니다.
      </p>
      {errorDetail && <p className="corrupt-banner-desc">원인: {errorDetail}</p>}
      <p className="corrupt-banner-desc">
        기존 데이터를 먼저 백업한 뒤 초기화하거나, 지금 화면에서 임시로 할 일을 기록할 수 있습니다.
      </p>

      {exportMessage && <p className="corrupt-banner-desc">{exportMessage}</p>}

      <div className="corrupt-banner-actions">
        {hasRawBackup && (
          <button
            type="button"
            className="btn btn-secondary btn-compact"
            onClick={() => {
              const ok = onExportBackup();
              setExportMessage(
                ok
                  ? '기존 저장 데이터를 JSON 파일로 내보냈습니다.'
                  : '파일 내보내기에 실패했습니다.',
              );
            }}
          >
            기존 데이터 내보내기
          </button>
        )}

        {!confirmingReset ? (
          <button
            type="button"
            className="btn btn-destructive btn-compact"
            onClick={() => setConfirmingReset(true)}
          >
            초기화하고 새로 저장하기
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-danger-solid btn-compact"
              onClick={onConfirmReset}
            >
              정말 초기화
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={() => setConfirmingReset(false)}
            >
              취소
            </button>
          </>
        )}
      </div>
    </section>
  );
}
