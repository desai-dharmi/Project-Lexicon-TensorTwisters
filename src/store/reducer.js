// ═══════════════════════════════════════════════════════════════
// REDUCER — Immutable state management for prompt blocks
// ═══════════════════════════════════════════════════════════════

import { generateId } from '../utils/constants';

/**
 * Initial state shape
 */
export const initialState = {
  blocks: [],
  history: [], // Array of { timestamp, blocks, prompt }
  savedTemplates: [], // Array of { id, name, blocks, createdAt }
  variantExcluded: [], // Block IDs excluded in variant (A/B mode)
  comparisonMode: false,
  selectedBlockId: null,
};

/**
 * Action types
 */
export const ACTIONS = {
  ADD_BLOCK: 'ADD_BLOCK',
  REMOVE_BLOCK: 'REMOVE_BLOCK',
  UPDATE_BLOCK: 'UPDATE_BLOCK',
  REORDER_BLOCKS: 'REORDER_BLOCKS',
  DUPLICATE_BLOCK: 'DUPLICATE_BLOCK',
  MOVE_BLOCK: 'MOVE_BLOCK',
  SELECT_BLOCK: 'SELECT_BLOCK',
  SAVE_TEMPLATE: 'SAVE_TEMPLATE',
  LOAD_TEMPLATE: 'LOAD_TEMPLATE',
  DELETE_TEMPLATE: 'DELETE_TEMPLATE',
  SAVE_HISTORY: 'SAVE_HISTORY',
  RESTORE_HISTORY: 'RESTORE_HISTORY',
  TOGGLE_COMPARISON: 'TOGGLE_COMPARISON',
  TOGGLE_VARIANT_BLOCK: 'TOGGLE_VARIANT_BLOCK',
  LOAD_STATE: 'LOAD_STATE',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
};

/**
 * Pure reducer function with immutable state updates
 */
export function promptReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_BLOCK: {
      const newBlock = {
        id: generateId(),
        type: action.payload.blockType,
        content: '',
        order: state.blocks.length,
      };
      // If an insertIndex is given, insert at that position
      if (action.payload.insertIndex !== undefined) {
        const blocks = [...state.blocks];
        newBlock.order = action.payload.insertIndex;
        // Shift orders of blocks at or after insertIndex
        const updated = blocks.map(b =>
          b.order >= action.payload.insertIndex
            ? { ...b, order: b.order + 1 }
            : b
        );
        return { ...state, blocks: [...updated, newBlock] };
      }
      return { ...state, blocks: [...state.blocks, newBlock] };
    }

    case ACTIONS.REMOVE_BLOCK: {
      const filtered = state.blocks.filter(b => b.id !== action.payload.id);
      // Re-normalize order
      const reordered = filtered
        .sort((a, b) => a.order - b.order)
        .map((b, i) => ({ ...b, order: i }));
      return {
        ...state,
        blocks: reordered,
        selectedBlockId: state.selectedBlockId === action.payload.id ? null : state.selectedBlockId,
        variantExcluded: state.variantExcluded.filter(id => id !== action.payload.id),
      };
    }

    case ACTIONS.UPDATE_BLOCK: {
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === action.payload.id
            ? { ...b, content: action.payload.content }
            : b
        ),
      };
    }

    case ACTIONS.REORDER_BLOCKS: {
      // payload: { fromIndex, toIndex }
      const sorted = [...state.blocks].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(action.payload.fromIndex, 1);
      sorted.splice(action.payload.toIndex, 0, moved);
      const reordered = sorted.map((b, i) => ({ ...b, order: i }));
      return { ...state, blocks: reordered };
    }

    case ACTIONS.DUPLICATE_BLOCK: {
      const source = state.blocks.find(b => b.id === action.payload.id);
      if (!source) return state;
      const newBlock = {
        ...source,
        id: generateId(),
        order: source.order + 1,
      };
      const shifted = state.blocks.map(b =>
        b.order > source.order ? { ...b, order: b.order + 1 } : b
      );
      return { ...state, blocks: [...shifted, newBlock] };
    }

    case ACTIONS.MOVE_BLOCK: {
      // payload: { id, direction: 'up' | 'down' }
      const sorted = [...state.blocks].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(b => b.id === action.payload.id);
      if (idx === -1) return state;
      
      const newIdx = action.payload.direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= sorted.length) return state;
      
      [sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
      const reordered = sorted.map((b, i) => ({ ...b, order: i }));
      return { ...state, blocks: reordered };
    }

    case ACTIONS.SELECT_BLOCK: {
      return { ...state, selectedBlockId: action.payload.id };
    }

    case ACTIONS.SAVE_TEMPLATE: {
      const template = {
        id: generateId(),
        name: action.payload.name,
        blocks: state.blocks.map(b => ({ ...b })),
        createdAt: new Date().toISOString(),
      };
      return { ...state, savedTemplates: [...state.savedTemplates, template] };
    }

    case ACTIONS.LOAD_TEMPLATE: {
      const template = state.savedTemplates.find(t => t.id === action.payload.id);
      if (!template) return state;
      // Assign new IDs to avoid conflicts
      const newBlocks = template.blocks.map((b, i) => ({
        ...b,
        id: generateId(),
        order: i,
      }));
      return { ...state, blocks: newBlocks, selectedBlockId: null, variantExcluded: [] };
    }

    case ACTIONS.DELETE_TEMPLATE: {
      return {
        ...state,
        savedTemplates: state.savedTemplates.filter(t => t.id !== action.payload.id),
      };
    }

    case ACTIONS.SAVE_HISTORY: {
      const entry = {
        timestamp: new Date().toISOString(),
        blocks: state.blocks.map(b => ({ ...b })),
        prompt: action.payload.prompt,
      };
      // Keep last 50 history entries
      const history = [entry, ...state.history].slice(0, 50);
      return { ...state, history };
    }

    case ACTIONS.RESTORE_HISTORY: {
      const entry = state.history[action.payload.index];
      if (!entry) return state;
      const newBlocks = entry.blocks.map((b, i) => ({
        ...b,
        id: generateId(),
        order: i,
      }));
      return { ...state, blocks: newBlocks, selectedBlockId: null, variantExcluded: [] };
    }

    case ACTIONS.TOGGLE_COMPARISON: {
      return { ...state, comparisonMode: !state.comparisonMode, variantExcluded: [] };
    }

    case ACTIONS.TOGGLE_VARIANT_BLOCK: {
      const excluded = state.variantExcluded.includes(action.payload.id)
        ? state.variantExcluded.filter(id => id !== action.payload.id)
        : [...state.variantExcluded, action.payload.id];
      return { ...state, variantExcluded: excluded };
    }

    case ACTIONS.LOAD_STATE: {
      return { ...state, ...action.payload };
    }

    case ACTIONS.CLEAR_CANVAS: {
      return { ...state, blocks: [], selectedBlockId: null, variantExcluded: [] };
    }

    default:
      return state;
  }
}
