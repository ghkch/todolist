import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { MAX_TODO_LENGTH } from '../lib/todoUtils';
import { PlusIcon } from './Icons';

interface TodoFormProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onAdd: (rawText: string) => { ok: boolean; error: string | null };
  hiddenNotice: string | null;
  onShowAll: () => void;
}

/**
 * 새 할 일 입력 폼.
 * 한글 IME 조합 중 Enter 등록을 방지하고, 공백 입력 오류와 200자 제한을 안내한다.
 */
export function TodoForm({
  inputRef,
  onAdd,
  hiddenNotice,
  onShowAll,
}: TodoFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isComposingRef = useRef(false);

  const errorId = 'new-todo-error';
  const counterId = 'new-todo-counter';

  const submitValue = () => {
    const result = onAdd(value);
    if (!result.ok) {
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setValue('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitValue();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    // 한글 IME 조합 중 Enter가 폼을 의도치 않게 제출하지 않도록 차단
    if (
      isComposingRef.current ||
      e.nativeEvent.isComposing ||
      e.keyCode === 229
    ) {
      e.preventDefault();
    }
  };

  return (
    <section aria-label="새 할 일 추가">
      <form className="todo-form" onSubmit={handleSubmit} noValidate>
        <div className="form-label-row">
          <label htmlFor="new-todo-input" className="form-label">
            새 할 일
          </label>
          <span
            id={counterId}
            className="char-counter"
            data-limit={value.length >= MAX_TODO_LENGTH}
          >
            {value.length} / {MAX_TODO_LENGTH}자
          </span>
        </div>

        <div className="form-row">
          <input
            ref={inputRef}
            id="new-todo-input"
            type="text"
            className="text-input"
            value={value}
            maxLength={MAX_TODO_LENGTH}
            placeholder="어떤 일을 할 예정인가요?"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${errorId} ${counterId}` : counterId}
            onChange={(e) => {
              setValue(e.target.value);
              if (error && e.target.value.trim().length > 0) {
                setError(null);
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="btn btn-primary">
            <PlusIcon />
            <span>추가</span>
          </button>
        </div>

        {error && (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        )}

        {hiddenNotice && (
          <div className="hidden-notice" role="status">
            <span>{hiddenNotice}</span>
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={onShowAll}
            >
              전체 보기
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
