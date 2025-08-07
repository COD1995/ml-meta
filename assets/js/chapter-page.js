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

  /* 4. Initialize reading progress indicator ------------------- */
  initReadingProgress();
});

/**
 * Initialize the reading progress indicator
 */
function initReadingProgress() {
  const progressBar = document.getElementById('reading-progress-bar');
  const progressContainer = document.getElementById('reading-progress');
  
  if (!progressBar || !progressContainer) return;

  let ticking = false;

  function updateProgress() {
    // Get the main content container
    const contentContainer = document.querySelector('.container.content');
    if (!contentContainer) return;

    // Calculate scroll progress
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = contentContainer.offsetHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = Math.min(100, Math.max(0, (scrollTop / (docHeight - winHeight)) * 100));

    // Update progress bar width
    progressBar.style.width = scrollPercent + '%';

    // Add/remove 'at-top' class for fade effect
    document.body.classList.toggle('at-top', scrollTop < 50);

    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  // Listen for scroll events
  window.addEventListener('scroll', requestTick, { passive: true });

  // Initialize progress on load
  updateProgress();
}
