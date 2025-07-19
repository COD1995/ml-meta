/* assets/js/chapter-page.js
 * Behaviour shared by every chapter page
 * ------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  /* 1. Render pseudocode blocks -------------------------------- */
  pseudocode.renderClass("pseudocode", {
    lineNumber: true,
    lineNumberPunc: ".",
    indentSize: "1.4em",
  });

  /* 2. Trigger MathJax typesetting ----------------------------- */
  window.MathJax?.typeset();

  /* 3. Activate Highlight.js + line numbers -------------------- */
  hljs.highlightAll();
  hljs.initLineNumbersOnLoad();
});
