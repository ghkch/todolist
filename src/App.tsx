import { useCallback, useEffect, useRef, useState } from 'react';
import { useTodos } from './hooks/useTodos';
import { Header } from './components/Header';
import { StorageCorruptBanner } from './components/StorageCorruptBanner';
import { TodoForm } from './components/TodoForm';
import { FilterBar } from './components/FilterBar';
import { TodoList } from './components/TodoList';
import { FooterSummary } from './components/FooterSummary';
import { UndoToast } from './components/UndoToast';
import { ConfirmClearDialog } from './components/ConfirmClearDialog';

/**
 * 개인용 한국어 TodoList 메인 애플리케이션
 */
export function App() {
  const {
    visibleTasks,
    completedTaskIds,
    stats,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    undoState,
    hiddenNotice,
    loadError,
    loadErrorDetail,
    hasRawBackup,
    isOverwriteProtected,
    saveErrorDetail,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    undoDelete,
    dismissUndo,
    clearCompletedByIds,
    resetViewToAll,
    retrySave,
    exportCorruptBackup,
    confirmResetCorruptStorage,
  } = useTodos();

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingFocusTargetIdRef = useRef<string | 'INPUT' | null>(null);

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearTargetIds, setClearTargetIds] = useState<readonly string[]>([]);

  const registerDeleteButtonRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        deleteButtonRefs.current.set(id, node);
      } else {
        deleteButtonRefs.current.delete(id);
      }
    },
    [],
  );

  // 삭제 직후 포커스가 사라지지 않도록 다음 항목 → 이전 항목 → 입력창 순으로 이동
  useEffect(() => {
    const target = pendingFocusTargetIdRef.current;
    if (!target) {
      return;
    }
    pendingFocusTargetIdRef.current = null;
    if (target === 'INPUT') {
      addInputRef.current?.focus();
      return;
    }
    const nextButton = deleteButtonRefs.current.get(target);
    if (nextButton) {
      nextButton.focus();
    } else {
      addInputRef.current?.focus();
    }
  }, [visibleTasks]);

  const handleDeleteTodo = useCallback(
    (id: string) => {
      const currentIndex = visibleTasks.findIndex((task) => task.id === id);
      if (currentIndex !== -1) {
        const nextItem = visibleTasks[currentIndex + 1];
        const prevItem = visibleTasks[currentIndex - 1];
        pendingFocusTargetIdRef.current = nextItem?.id ?? prevItem?.id ?? 'INPUT';
      }
      deleteTodo(id);
    },
    [visibleTasks, deleteTodo],
  );

  const handleOpenClearDialog = useCallback(() => {
    setClearTargetIds(completedTaskIds);
    setClearDialogOpen(true);
  }, [completedTaskIds]);

  const handleConfirmClear = useCallback(
    (validTargetIds: readonly string[]) => {
      clearCompletedByIds(validTargetIds);
      setClearDialogOpen(false);
    },
    [clearCompletedByIds],
  );

  const handleCloseClearDialog = useCallback(() => {
    setClearDialogOpen(false);
  }, []);

  return (
    <div className="page-shell">
      <main className="todo-card">
        <Header stats={stats} />

        <StorageCorruptBanner
          loadError={loadError}
          errorDetail={loadErrorDetail}
          hasRawBackup={hasRawBackup}
          onExportBackup={exportCorruptBackup}
          onConfirmReset={confirmResetCorruptStorage}
        />

        <TodoForm
          inputRef={addInputRef}
          onAdd={addTodo}
          hiddenNotice={hiddenNotice}
          onShowAll={resetViewToAll}
        />

        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          visibleCount={visibleTasks.length}
          totalCount={stats.total}
        />

        <TodoList
          visibleTasks={visibleTasks}
          totalCount={stats.total}
          filter={filter}
          searchQuery={searchQuery}
          onToggle={toggleTodo}
          onEdit={editTodo}
          onDelete={handleDeleteTodo}
          onFocusAddInput={() => addInputRef.current?.focus()}
          onClearSearch={() => setSearchQuery('')}
          onShowAll={resetViewToAll}
          registerDeleteButtonRef={registerDeleteButtonRef}
        />

        <FooterSummary
          remainingCount={stats.remaining}
          completedCount={stats.completed}
          clearButtonRef={clearButtonRef}
          onOpenClearDialog={handleOpenClearDialog}
          saveErrorDetail={saveErrorDetail}
          isOverwriteProtected={isOverwriteProtected}
          onRetrySave={retrySave}
        />
      </main>

      <UndoToast
        undoState={undoState}
        onUndo={undoDelete}
        onDismiss={dismissUndo}
      />

      <ConfirmClearDialog
        isOpen={clearDialogOpen}
        targetIds={clearTargetIds}
        currentCompletedIds={completedTaskIds}
        onConfirm={handleConfirmClear}
        onClose={handleCloseClearDialog}
        returnFocusRef={clearButtonRef}
        fallbackFocusRef={addInputRef}
      />
    </div>
  );
}

export default App;
