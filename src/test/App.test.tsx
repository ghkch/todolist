import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { STORAGE_KEY } from '../lib/storage';

describe('TodoList 앱 통합 테스트', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('빈 상태에서 0% 진행률과 빈 안내 문구를 표시하고 완료 삭제 버튼을 비활성화한다', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    expect(screen.getByText('아직 할 일이 없어요')).toBeInTheDocument();

    const progress = screen.getByRole('progressbar', { name: '할 일 완료율' });
    expect(progress).toHaveAttribute('aria-valuenow', '0');

    expect(screen.getByRole('button', { name: '완료 항목 삭제' })).toBeDisabled();
    expect(screen.getByText('이 브라우저에 자동 저장됩니다.')).toBeInTheDocument();
  });

  it('할 일을 추가하면 앞뒤 공백을 제거하고 최신 항목을 맨 위에 표시하며 입력창 포커스를 유지한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '   첫 번째 할 일   {Enter}');

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();

    await user.type(input, '두 번째 할 일');
    await user.click(screen.getByRole('button', { name: '추가' }));

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('두 번째 할 일')).toBeInTheDocument();
    expect(within(items[1]).getByText('첫 번째 할 일')).toBeInTheDocument();
  });

  it('빈 입력과 공백 입력을 차단하고 오류 메시지와 aria-invalid를 설정한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '     {Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('할 일을 입력해 주세요.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('최대 200자 입력 제한이 적용된다', () => {
    render(<App />);
    const input = screen.getByLabelText('새 할 일');
    expect(input).toHaveAttribute('maxLength', '200');
  });

  it('한글 IME 조합 중 Enter로는 등록되지 않고 조합 종료 후 Enter로 등록된다', () => {
    render(<App />);
    const input = screen.getByLabelText('새 할 일');

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '장보기' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true });

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);

    fireEvent.compositionEnd(input);
    fireEvent.submit(input.closest('form')!);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('장보기')).toBeInTheDocument();
  });

  it('완료와 미완료 전환 시 진행률이 갱신되고 항목 순서가 유지된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '운동하기{Enter}');
    await user.type(input, '책 읽기{Enter}');

    const checkbox = screen.getByRole('checkbox', { name: '책 읽기' });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText('완료됨')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '할 일 완료율' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByText('남은 할 일 1개')).toBeInTheDocument();

    // 순서 유지 확인 (책 읽기가 여전히 맨 위)
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('책 읽기')).toBeInTheDocument();
    expect(within(items[1]).getByText('운동하기')).toBeInTheDocument();
  });

  it('할 일 내용을 수정 저장 및 Esc 취소할 수 있고, 빈 내용 저장을 차단하며 포커스를 복귀한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '물 마시기{Enter}');

    // 수정 시작
    await user.click(screen.getByRole('button', { name: '물 마시기 수정' }));
    const editInput = screen.getByLabelText('물 마시기 내용 수정');
    expect(editInput).toHaveFocus();

    // 빈 내용 저장 차단
    await user.clear(editInput);
    await user.type(editInput, '   {Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('할 일을 입력해 주세요.');

    // Esc 취소
    await user.keyboard('{Escape}');
    expect(screen.getByText('물 마시기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '물 마시기 수정' })).toHaveFocus();

    // 정상 수정 저장
    await user.click(screen.getByRole('button', { name: '물 마시기 수정' }));
    const editInputAgain = screen.getByLabelText('물 마시기 내용 수정');
    await user.clear(editInputAgain);
    await user.type(editInputAgain, '따뜻한 물 마시기{Enter}');

    expect(screen.getByText('따뜻한 물 마시기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '따뜻한 물 마시기 수정' })).toHaveFocus();
  });

  it('개별 삭제 후 실행 취소로 원래 위치에 복원하고, 연속 삭제 시 최신 1건만 복원한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '하나{Enter}');
    await user.type(input, '둘{Enter}');
    await user.type(input, '셋{Enter}');
    // 현재 순서: 셋, 둘, 하나

    // 가운데 '둘' 삭제 후 복원 -> 원래 위치(인덱스 1)로 돌아와야 함
    await user.click(screen.getByRole('button', { name: '둘 삭제' }));
    expect(screen.queryByText('둘')).not.toBeInTheDocument();
    expect(screen.getByText('할 일을 삭제했어요.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '실행 취소' }));
    const restoredItems = screen.getAllByRole('listitem');
    expect(within(restoredItems[0]).getByText('셋')).toBeInTheDocument();
    expect(within(restoredItems[1]).getByText('둘')).toBeInTheDocument();
    expect(within(restoredItems[2]).getByText('하나')).toBeInTheDocument();

    // 연속 삭제: '셋' 삭제 -> 바로 '둘' 삭제 -> 실행 취소 시 '둘'만 복원
    await user.click(screen.getByRole('button', { name: '셋 삭제' }));
    await user.click(screen.getByRole('button', { name: '둘 삭제' }));
    await user.click(screen.getByRole('button', { name: '실행 취소' }));

    expect(screen.getByText('둘')).toBeInTheDocument();
    expect(screen.queryByText('셋')).not.toBeInTheDocument();
  });

  it('상태 필터와 검색을 교집합으로 적용하고 결과 없음과 검색어 초기화를 처리한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '사과 사기{Enter}');
    await user.type(input, '사과 씻기{Enter}');
    await user.type(input, '우유 사기{Enter}');

    await user.click(screen.getByRole('checkbox', { name: '사과 사기' }));

    // 완료 필터 + '사과' 검색 -> '사과 사기'만 표시
    const completedFilter = screen.getByRole('button', { name: '완료' });
    await user.click(completedFilter);
    expect(completedFilter).toHaveAttribute('aria-pressed', 'true');

    const searchInput = screen.getByLabelText('할 일 검색');
    await user.type(searchInput, '사과');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('사과 사기')).toBeInTheDocument();

    // 완료 필터 상태에서 새 항목 추가 시 숨김 안내 표시
    await user.type(input, '새 할 일{Enter}');
    expect(
      screen.getByText('할 일을 추가했어요. 현재 조건에서는 보이지 않습니다.'),
    ).toBeInTheDocument();

    // 검색 결과 없음 확인 및 검색어 초기화
    await user.clear(searchInput);
    await user.type(searchInput, '없는단어');
    expect(screen.getByText('일치하는 할 일이 없어요')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '검색어 초기화' })[0]);
    expect(searchInput).toHaveValue('');
  });

  it('완료 항목 일괄 삭제 대화상자에서 취소 시 데이터를 유지하고 확인 시 완료 항목만 삭제한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '할 일 A{Enter}');
    await user.type(input, '할 일 B{Enter}');
    await user.click(screen.getByRole('checkbox', { name: '할 일 A' }));

    const clearBtn = screen.getByRole('button', { name: '완료 항목 삭제' });
    expect(clearBtn).toBeEnabled();
    await user.click(clearBtn);

    expect(screen.getByText('완료한 할 일을 삭제할까요?')).toBeInTheDocument();
    expect(
      screen.getByText('완료한 할 일 1개가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'),
    ).toBeInTheDocument();

    // 취소
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByText('할 일 A')).toBeInTheDocument();

    // 다시 열고 삭제 확인
    await user.click(clearBtn);
    await user.click(screen.getByRole('button', { name: '1개 삭제' }));
    expect(screen.queryByText('할 일 A')).not.toBeInTheDocument();
    expect(screen.getByText('할 일 B')).toBeInTheDocument();
    expect(clearBtn).toBeDisabled();
  });

  it('새로고침(재마운트) 후에도 저장된 할 일과 완료 상태가 복원된다', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '병원 예약하기{Enter}');
    await user.click(screen.getByRole('checkbox', { name: '병원 예약하기' }));
    unmount();

    render(<App />);
    const checkbox = screen.getByRole('checkbox', { name: '병원 예약하기' });
    expect(checkbox).toBeChecked();
  });

  it('손상된 저장 데이터가 있어도 기존 데이터를 덮어쓰지 않고 오류 안내를 표시한다', () => {
    const corrupted = '{"schemaVersion": 1, "tasks": "invalid"}';
    window.localStorage.setItem(STORAGE_KEY, corrupted);

    render(<App />);
    expect(
      screen.getByText('저장된 목록을 읽지 못했어요. 기존 데이터는 덮어쓰지 않았습니다.'),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(corrupted);
  });

  it('localStorage 쓰기 실패 시 앱은 계속 동작하고 저장 실패 안내를 표시한다', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

    render(<App />);
    const input = screen.getByLabelText('새 할 일');
    await user.type(input, '임시 할 일{Enter}');

    // 메모리 상태에서는 정상 표시됨
    expect(screen.getByText('임시 할 일')).toBeInTheDocument();
    // 저장 성공 문구 대신 실패 안내 표시
    expect(
      screen.queryByText('이 브라우저에 자동 저장됩니다.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/변경 내용을 이 브라우저에 저장하지 못했어요/),
    ).toBeInTheDocument();

    // 저장 재시도 성공 시 정상 안내 복귀
    setItemSpy.mockRestore();
    await user.click(screen.getByRole('button', { name: '저장 다시 시도' }));
    expect(screen.getByText('이 브라우저에 자동 저장됩니다.')).toBeInTheDocument();
  });

  it('HTML 태그가 포함된 입력도 실행하지 않고 일반 텍스트로 안전하게 렌더링한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    const xssPayload = '<img src=x onerror=alert(1)>';
    const input = screen.getByLabelText('새 할 일');
    await user.type(input, `${xssPayload}{Enter}`);

    expect(screen.getByText(xssPayload)).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
