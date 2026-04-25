// ═══════════════════════════════════════════════════════════════
// DIFF ENGINE — Character-level LCS diff (no external libraries)
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the Longest Common Subsequence table.
 * Uses O(n*m) DP approach.
 * 
 * @param {string} a - Original string
 * @param {string} b - Modified string
 * @returns {number[][]} - LCS DP table
 */
function buildLCSTable(a, b) {
  const m = a.length;
  const n = b.length;
  
  // Optimized: use typed arrays for better performance
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Uint16Array(n + 1);
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp;
}

/**
 * Backtrack through the LCS table to produce diff operations.
 * 
 * @param {number[][]} dp - LCS table
 * @param {string} a - Original string
 * @param {string} b - Modified string
 * @returns {Array<{type: 'same'|'add'|'remove', char: string}>}
 */
function backtrack(dp, a, b) {
  const result = [];
  let i = a.length;
  let j = b.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ type: 'same', char: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'add', char: b[j - 1] });
      j--;
    } else {
      result.push({ type: 'remove', char: a[i - 1] });
      i--;
    }
  }
  
  return result.reverse();
}

/**
 * Compute character-level diff between two strings.
 * Returns an array of operations with type and character.
 * 
 * For very long strings (>5000 chars), falls back to a 
 * word-level diff for performance.
 * 
 * @param {string} original - Original prompt string
 * @param {string} modified - Modified prompt string
 * @returns {Array<{type: 'same'|'add'|'remove', text: string}>}
 */
export function computeDiff(original, modified) {
  if (original === modified) {
    return [{ type: 'same', text: original }];
  }
  
  if (!original) {
    return [{ type: 'add', text: modified }];
  }
  
  if (!modified) {
    return [{ type: 'remove', text: original }];
  }
  
  // For performance, if strings are very long, use word-level diff
  if (original.length > 3000 || modified.length > 3000) {
    return computeWordDiff(original, modified);
  }
  
  const dp = buildLCSTable(original, modified);
  const charOps = backtrack(dp, original, modified);
  
  // Merge consecutive same-type operations into text chunks
  return mergeOps(charOps);
}

/**
 * Word-level diff for long strings (performance optimization).
 */
function computeWordDiff(original, modified) {
  const aWords = original.split(/(\s+)/);
  const bWords = modified.split(/(\s+)/);
  
  const m = aWords.length;
  const n = bWords.length;
  
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Uint16Array(n + 1);
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aWords[i - 1] === bWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) {
      result.push({ type: 'same', char: aWords[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'add', char: bWords[j - 1] });
      j--;
    } else {
      result.push({ type: 'remove', char: aWords[i - 1] });
      i--;
    }
  }
  
  return mergeOps(result.reverse());
}

/**
 * Merge consecutive operations of the same type into text chunks.
 */
function mergeOps(ops) {
  if (ops.length === 0) return [];
  
  const merged = [];
  let current = { type: ops[0].type, text: ops[0].char };
  
  for (let i = 1; i < ops.length; i++) {
    if (ops[i].type === current.type) {
      current.text += ops[i].char;
    } else {
      merged.push(current);
      current = { type: ops[i].type, text: ops[i].char };
    }
  }
  
  merged.push(current);
  return merged;
}
