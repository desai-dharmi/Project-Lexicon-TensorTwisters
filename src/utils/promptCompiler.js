// ═══════════════════════════════════════════════════════════════
// PROMPT COMPILER — Assembles blocks into a prompt string
// ═══════════════════════════════════════════════════════════════

import { BLOCK_TYPES } from './constants';

/**
 * Compile an array of blocks into a formatted prompt string.
 * Each block type gets a semantic prefix and natural joining.
 * 
 * @param {Array} blocks - Ordered array of block objects
 * @returns {string} - Compiled prompt
 */
export function compilePrompt(blocks) {
  if (!blocks || blocks.length === 0) return '';
  
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  
  const parts = sorted
    .filter(b => b.content.trim())
    .map(block => {
      const typeInfo = BLOCK_TYPES[block.type];
      if (!typeInfo) return block.content;
      return `${typeInfo.prefix} ${block.content.trim()}`;
    });
  
  return parts.join('\n\n');
}

/**
 * Compile blocks into an array of segments with type info,
 * used for syntax-highlighted preview.
 * 
 * @param {Array} blocks - Ordered array of block objects
 * @returns {Array<{type: string, prefix: string, content: string, color: string}>}
 */
export function compileSegments(blocks) {
  if (!blocks || blocks.length === 0) return [];
  
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  
  return sorted
    .filter(b => b.content.trim())
    .map(block => {
      const typeInfo = BLOCK_TYPES[block.type];
      return {
        type: block.type,
        prefix: typeInfo?.prefix || '',
        content: block.content.trim(),
        color: typeInfo?.color || '#888',
        label: typeInfo?.label || block.type,
      };
    });
}

/**
 * Calculate structural completeness as a percentage.
 * Based on how many of the 7 block types are present.
 * 
 * @param {Array} blocks - Current blocks
 * @returns {{ percentage: number, missing: string[], present: string[] }}
 */
export function calculateCompleteness(blocks) {
  const allTypes = Object.keys(BLOCK_TYPES);
  const presentTypes = new Set(blocks.map(b => b.type));
  
  const present = allTypes.filter(t => presentTypes.has(t));
  const missing = allTypes.filter(t => !presentTypes.has(t));
  
  return {
    percentage: Math.round((present.length / allTypes.length) * 100),
    missing: missing.map(t => BLOCK_TYPES[t].label),
    present: present.map(t => BLOCK_TYPES[t].label),
  };
}
