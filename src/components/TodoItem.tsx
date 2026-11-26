import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { TodoItem as TodoItemModel } from '../types/todo';
import { MAX_TODO_LENGTH } from '../lib/todoUtils';
import { CheckIcon, EditIcon, TrashIcon } from './Icons';

interface TodoItemProps {
  item: TodoItemModel;
  onToggle: (id: string) => void;
  onEdit: (id: string, nextText: string) => { ok: boolean; error: string | null };
  onDelete: (id: string) => void;
  registerDeleteButtonRef: (id: string, node: HTMLButtonElement | null) => void;
}

/**
 * 개별 할 일 항목 컴포넌트.
 * 보기 모드에서는 체크박스·내용·수정·삭제를 제공하고,
 * 수정 모드에서는 체크박스 레이블과 중첩되지 않은 독립 편집 폼을 제공한다.
 */
export function TodoItem({
  item,
  onToggle,
  onEdit,
  onDelete,
  registerDeleteButtonRef,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [error, setError] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const isComposingRef = useRef(false);
  const shouldReturnFocusRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    } else if (shouldReturnFocusRef.current) {
      shouldReturnFocusRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  const startEditing = () => {
    setDraft(item.text);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(item.text);
    setError(null);
    shouldReturnFocusRef.current = true;
    setIsEditing(false);
  };

  const commitEditing = () => {
    const result = onEdit(item.id, draft);
    if (!result.ok) {
      setError(result.error);
      editInputRef.current?.focus();
      return;
    }
    setError(null);
    shouldReturnFocusRef.current = true;
    setIsEditing(false);
  };

  const handleEditSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    commitEditing();
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
      return;
    }
    if (e.key === 'Enter') {
      if (
        isComposingRef.current ||
        e.nativeEvent.isComposing ||
        e.keyCode === 229
      ) {
        e.preventDefault();
      }
    }
  };

  const checkboxId = `todo-check-${item.id}`;
  const editInputId = `todo-edit-${item.id}`;
  const editErrorId = `todo-edit-error-${item.id}`;

  if (isEditing) {
    return (
      <li className="todo-item" data-completed={item.completed}>
        <form className="todo-edit-form" onSubmit={handleEditSubmit} noValidate>
          <label htmlFor={editInputId} className="sr-only">
            {item.text} 내용 수정
          </label>
          <input
            ref={editInputRef}
            id={editInputId}
            type="text"
            className="text-input"
            value={draft}
            maxLength={MAX_TODO_LENGTH}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? editErrorId : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
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
            onKeyDown={handleEditKeyDown}
          />

          {error && (
            <p id={editErrorId} className="field-error" role="alert">
              {error}
            </p>
          )}

          <div className="todo-edit-actions">
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={cancelEditing}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-compact">
              저장
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="todo-item" data-completed={item.completed}>
      <div className="todo-item-main">
        <label htmlFor={checkboxId} className="todo-checkbox-label">
          <span className="todo-checkbox-box">
            <input
              id={checkboxId}
              type="checkbox"
              className="todo-checkbox-input"
              checked={item.completed}
              onChange={() => onToggle(item.id)}
            />
            {item.completed && (
              <span className="todo-checkbox-check" aria-hidden="true">
                <CheckIcon size={14} />
              </span>
            )}
          </span>
          <span className="todo-text-wrap">
            <span className="todo-text">{item.text}</span>
            {item.completed && (
              <span className="todo-completed-badge" aria-hidden="true">
                <CheckIcon size={12} />
                <span>완료됨</span>
              </span>
            )}
          </span>
        </label>
      </div>

      <div className="todo-actions">
        <button
          ref={editButtonRef}
          type="button"
          className="btn btn-ghost btn-compact"
          aria-label={`${item.text} 수정`}
          onClick={startEditing}
        >
          <EditIcon />
          <span>수정</span>
        </button>
        <button
          ref={(node) => registerDeleteButtonRef(item.id, node)}
          type="button"
          className="btn btn-destructive btn-compact"
          aria-label={`${item.text} 삭제`}
          onClick={() => onDelete(item.id)}
        >
          <TrashIcon />
          <span>삭제</span>
        </button>
      </div>
    </li>
  );
}
