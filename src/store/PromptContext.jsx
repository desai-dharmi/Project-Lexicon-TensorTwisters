// ═══════════════════════════════════════════════════════════════
// PROMPT CONTEXT — React Context + useReducer state management
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { promptReducer, initialState, ACTIONS } from './reducer';
import { compilePrompt } from '../utils/promptCompiler';

const PromptContext = createContext(null);

const STORAGE_KEY = 'project-lexicon-state';

/**
 * Load persisted state from localStorage
 */
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...initialState, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
  }
  return initialState;
}

/**
 * Save state to localStorage
 */
function persistState(state) {
  try {
    const toSave = {
      blocks: state.blocks,
      history: state.history,
      savedTemplates: state.savedTemplates,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

/**
 * Provider component wrapping the entire app
 */
export function PromptProvider({ children }) {
  const [state, dispatch] = useReducer(promptReducer, null, loadPersistedState);
  const saveTimer = useRef(null);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistState(state);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  // Convenience action creators
  const addBlock = useCallback((blockType, insertIndex) => {
    dispatch({ type: ACTIONS.ADD_BLOCK, payload: { blockType, insertIndex } });
  }, []);

  const removeBlock = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_BLOCK, payload: { id } });
  }, []);

  const updateBlock = useCallback((id, content) => {
    dispatch({ type: ACTIONS.UPDATE_BLOCK, payload: { id, content } });
  }, []);

  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    dispatch({ type: ACTIONS.REORDER_BLOCKS, payload: { fromIndex, toIndex } });
  }, []);

  const duplicateBlock = useCallback((id) => {
    dispatch({ type: ACTIONS.DUPLICATE_BLOCK, payload: { id } });
  }, []);

  const moveBlock = useCallback((id, direction) => {
    dispatch({ type: ACTIONS.MOVE_BLOCK, payload: { id, direction } });
  }, []);

  const selectBlock = useCallback((id) => {
    dispatch({ type: ACTIONS.SELECT_BLOCK, payload: { id } });
  }, []);

  const saveTemplate = useCallback((name) => {
    dispatch({ type: ACTIONS.SAVE_TEMPLATE, payload: { name } });
  }, []);

  const loadTemplate = useCallback((id) => {
    dispatch({ type: ACTIONS.LOAD_TEMPLATE, payload: { id } });
  }, []);

  const deleteTemplate = useCallback((id) => {
    dispatch({ type: ACTIONS.DELETE_TEMPLATE, payload: { id } });
  }, []);

  const saveHistory = useCallback(() => {
    const prompt = compilePrompt(state.blocks);
    if (prompt.trim()) {
      dispatch({ type: ACTIONS.SAVE_HISTORY, payload: { prompt } });
    }
  }, [state.blocks]);

  const restoreHistory = useCallback((index) => {
    dispatch({ type: ACTIONS.RESTORE_HISTORY, payload: { index } });
  }, []);

  const toggleComparison = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_COMPARISON });
  }, []);

  const toggleVariantBlock = useCallback((id) => {
    dispatch({ type: ACTIONS.TOGGLE_VARIANT_BLOCK, payload: { id } });
  }, []);

  const clearCanvas = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CANVAS });
  }, []);

  const value = {
    state,
    dispatch,
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlocks,
    duplicateBlock,
    moveBlock,
    selectBlock,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    saveHistory,
    restoreHistory,
    toggleComparison,
    toggleVariantBlock,
    clearCanvas,
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
}

/**
 * Custom hook to access prompt context
 */
export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider');
  return ctx;
}
