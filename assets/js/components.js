/**
 * Reusable components for ML-Meta site
 */

/**
 * Create an explanation block with original and explanation text
 * @param {string} originalText - The original quoted text
 * @param {string} explanationText - The explanation text
 * @returns {string} HTML string for the explanation block
 */
export function createExplanationBlock(originalText, explanationText) {
  return `
    <div class="explanation-block">
      <blockquote class="original-quote">
        ${originalText}
      </blockquote>
      ${explanationText ? `<div class="explanation-text">${explanationText}</div>` : ''}
    </div>
  `;
}

/**
 * Create a simple quoted block
 * @param {string} text - The text to quote
 * @param {string} author - Optional author attribution
 * @returns {string} HTML string for the quote
 */
export function createQuote(text, author = '') {
  return `
    <blockquote class="styled-quote">
      ${text}
      ${author ? `<cite>— ${author}</cite>` : ''}
    </blockquote>
  `;
}

/**
 * Create a note/callout block
 * @param {string} content - The content of the note
 * @param {string} type - Type of note (info, warning, tip, etc.)
 * @returns {string} HTML string for the note
 */
export function createNote(content, type = 'info') {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
    important: '❗',
    success: '✅'
  };
  
  return `
    <div class="note note-${type}">
      <span class="note-icon">${icons[type] || icons.info}</span>
      <div class="note-content">${content}</div>
    </div>
  `;
}

/**
 * Convert simple markdown-like syntax to HTML components
 * @param {string} content - Content with simple syntax
 * @returns {string} HTML string with components
 */
export function parseSimpleMarkdown(content) {
  // Convert > text to blockquotes
  content = content.replace(/^> (.+)$/gm, (match, p1) => {
    return createQuote(p1);
  });
  
  // Convert [!NOTE] blocks
  content = content.replace(/\[!(\w+)\]\s*(.+?)(?=\n\n|\n\[!|$)/gs, (match, type, text) => {
    return createNote(text.trim(), type.toLowerCase());
  });
  
  return content;
}

// Export for use in HTML files
if (typeof window !== 'undefined') {
  window.MLComponents = {
    createExplanationBlock,
    createQuote,
    createNote,
    parseSimpleMarkdown
  };
}