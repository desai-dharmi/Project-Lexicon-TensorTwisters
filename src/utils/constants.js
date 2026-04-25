// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Block types, colors, and configuration
// ═══════════════════════════════════════════════════════════════

export const BLOCK_TYPES = {
  role: {
    id: 'role',
    label: 'Role',
    icon: '👤',
    color: '#4A90FF',
    colorRgb: '74, 144, 255',
    placeholder: 'e.g., a senior software engineer with 10 years of experience',
    prefix: 'Act as',
    desc: 'Define the AI persona — tell the model WHO to be. Example: "You are a senior Python developer with 10 years of experience."',
  },
  context: {
    id: 'context',
    label: 'Context',
    icon: '📋',
    color: '#A855F7',
    colorRgb: '168, 85, 247',
    placeholder: 'e.g., You are helping a startup build their MVP...',
    prefix: 'Context:',
    desc: 'Provide background information and situational framing. Example: "I am building a REST API for a healthcare startup."',
  },
  constraint: {
    id: 'constraint',
    label: 'Constraint',
    icon: '🔒',
    color: '#EF4444',
    colorRgb: '239, 68, 68',
    placeholder: 'e.g., Do not use any external libraries',
    prefix: 'Constraint:',
    desc: 'Set boundaries and limitations for the response. Example: "Do not use external libraries. Keep the code under 100 lines."',
  },
  format: {
    id: 'format',
    label: 'Format',
    icon: '📐',
    color: '#22C55E',
    colorRgb: '34, 197, 94',
    placeholder: 'e.g., Respond in bullet points with code examples',
    prefix: 'Format:',
    desc: 'Specify the output structure and formatting. Example: "Respond in bullet points with code blocks and inline comments."',
  },
  tone: {
    id: 'tone',
    label: 'Tone',
    icon: '🎭',
    color: '#F97316',
    colorRgb: '249, 115, 22',
    placeholder: 'e.g., Professional yet approachable',
    prefix: 'Tone:',
    desc: 'Control the communication style and voice. Example: "Professional yet approachable. Avoid jargon, explain like I\'m a beginner."',
  },
  example: {
    id: 'example',
    label: 'Example',
    icon: '💡',
    color: '#06B6D4',
    colorRgb: '6, 182, 212',
    placeholder: 'e.g., Input: "Hello" → Output: "Hi there!"',
    prefix: 'Example:',
    desc: 'Show the AI what good output looks like. Example: "Input: \'sort array\' → Output: complete working function with tests."',
  },
  output_length: {
    id: 'output_length',
    label: 'Output Length',
    icon: '📏',
    color: '#EAB308',
    colorRgb: '234, 179, 8',
    placeholder: 'e.g., Keep the response under 200 words',
    prefix: 'Length:',
    desc: 'Restrict the length of the generated output. Example: "Limit the response to explicitly one paragraph, under 200 words total."',
  },
};

export const BLOCK_TYPE_LIST = Object.values(BLOCK_TYPES);

// Generate unique IDs
let idCounter = 0;
export const generateId = () => `block_${Date.now()}_${++idCounter}`;

// Debounce utility
export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};
