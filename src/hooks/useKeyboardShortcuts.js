// ═══════════════════════════════════════════════════════════════
// useKeyboardShortcuts — Global keyboard shortcut handler
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';

/**
 * Register global keyboard shortcuts for block manipulation.
 * 
 * Shortcuts:
 * - Delete / Backspace: Remove selected block
 * - Ctrl+D: Duplicate selected block
 * - Ctrl+ArrowUp: Move selected block up
 * - Ctrl+ArrowDown: Move selected block down
 * - Escape: Deselect block
 * - Ctrl+S: Save to history
 * - Ctrl+E: Export / copy to clipboard
 */
export function useKeyboardShortcuts({
  selectedBlockId,
  removeBlock,
  duplicateBlock,
  moveBlock,
  selectBlock,
  saveHistory,
  onExport,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept when typing in inputs
      const tag = e.target.tagName.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true';

      if (e.key === 'Escape') {
        selectBlock(null);
        e.target.blur?.();
        return;
      }

      // Ctrl+S: Save history
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveHistory();
        return;
      }

      // Ctrl+E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        onExport?.();
        return;
      }

      // Block-specific shortcuts (only when not editing)
      if (!isEditing && selectedBlockId) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          removeBlock(selectedBlockId);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          duplicateBlock(selectedBlockId);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
          e.preventDefault();
          moveBlock(selectedBlockId, 'up');
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
          e.preventDefault();
          moveBlock(selectedBlockId, 'down');
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, removeBlock, duplicateBlock, moveBlock, selectBlock, saveHistory, onExport]);
}
