// ═══════════════════════════════════════════════════════════════
// MOCK RESPONSES — Simulated AI output based on block composition
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a mock AI response based on which block types are present.
 * More complete prompts yield richer, more structured responses.
 */
export function generateMockResponse(blocks) {
  if (!blocks || blocks.length === 0) {
    return {
      quality: 'none',
      response: 'Add blocks to your canvas to see a simulated AI response.',
      score: 0,
    };
  }

  const types = new Set(blocks.map(b => b.type));
  const hasRole = types.has('role');
  const hasContext = types.has('context');
  const hasTone = types.has('tone');
  const hasFormat = types.has('format');
  const hasConstraint = types.has('constraint');
  const hasExample = types.has('example');
  const hasLength = types.has('output_length');

  const roleContent = blocks.find(b => b.type === 'role')?.content || '';
  const contextContent = blocks.find(b => b.type === 'context')?.content || '';
  const toneContent = blocks.find(b => b.type === 'tone')?.content || '';
  const formatContent = blocks.find(b => b.type === 'format')?.content || '';

  // Score: 0-100 based on completeness
  let score = types.size * 14;
  if (score > 100) score = 100;

  // Build response based on richness
  if (hasRole && hasContext && hasTone && hasFormat) {
    return {
      quality: 'excellent',
      score,
      response: buildExcellentResponse(roleContent, contextContent, toneContent, formatContent, hasConstraint, hasExample, hasLength),
    };
  }

  if (hasRole && hasContext) {
    return {
      quality: 'good',
      score,
      response: buildGoodResponse(roleContent, contextContent, hasTone, hasFormat),
    };
  }

  if (hasRole || hasContext) {
    return {
      quality: 'basic',
      score,
      response: buildBasicResponse(hasRole ? roleContent : contextContent, hasRole),
    };
  }

  return {
    quality: 'minimal',
    score,
    response: buildMinimalResponse(blocks),
  };
}

function buildExcellentResponse(role, context, tone, format, hasConstraint, hasExample, hasLength) {
  return `## AI Response (Premium Quality)

As ${role || 'your specified role'}, I understand the context: ${context || 'the situation described'}.

### Analysis
I'll approach this with a ${tone || 'professional'} tone, structured in ${format || 'the requested format'}.

${hasConstraint ? '⚠️ **Constraints acknowledged** — I will strictly follow the defined boundaries.\n' : ''}
${hasExample ? '📌 **Example pattern detected** — My response follows the provided template.\n' : ''}
${hasLength ? '📏 **Length constraint applied** — Response optimized for specified length.\n' : ''}

### Key Points
- **Comprehensive understanding** of the prompt structure
- **Tailored response** matching all specified parameters
- **Consistent tone** throughout the output
- **Formatted output** as requested

### Conclusion
This response demonstrates how a well-structured prompt with role, context, tone, and format produces significantly higher quality AI output. The additional constraints and examples further refine the response quality.

> 💎 *Prompt completeness directly correlates with response quality.*`;
}

function buildGoodResponse(role, context, hasTone, hasFormat) {
  return `## AI Response (Good Quality)

${role ? `Speaking as ${role}, ` : ''}I've analyzed the context: ${context || 'your request'}.

Here is my response:

${hasTone ? '✓ Tone has been applied to this response.\n' : '⚡ *Add a Tone block to improve response personality.*\n'}
${hasFormat ? '✓ Format guidelines are being followed.\n' : '⚡ *Add a Format block to structure the output better.*\n'}

The response covers the main points but could be enhanced with additional prompt blocks for:
- Specific formatting guidelines
- Tone preferences
- Constraints to narrow the scope
- Examples to demonstrate expected output

> 📈 *Adding more block types will significantly improve response quality.*`;
}

function buildBasicResponse(content, isRole) {
  return `## AI Response (Basic)

${isRole 
  ? `I'll respond as ${content || 'the specified role'}. However, without context, my response may be generic.`
  : `Based on the context: ${content || 'your input'}. Without a defined role, the perspective may vary.`}

This is a basic response. To improve quality, consider adding:
- ${isRole ? '📋 Context' : '👤 Role'} — provides essential framing
- 🎭 Tone — defines the communication style
- 📐 Format — structures the output
- 🔒 Constraints — sets boundaries

> ⚠️ *Minimal prompt = minimal quality. Build a richer prompt for better results.*`;
}

function buildMinimalResponse(blocks) {
  const types = blocks.map(b => b.type).join(', ');
  return `## AI Response (Minimal)

I received blocks of type: ${types}. 

Without a core Role or Context block, the AI has limited ability to generate meaningful output. The current prompt structure is incomplete.

**Recommendation:** Start with a Role and Context block, then layer on additional blocks for optimal results.

> 🔴 *Critical blocks missing. Response quality is significantly limited.*`;
}
