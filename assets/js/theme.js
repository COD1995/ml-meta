/**
 * Theme management module
 * @module theme
 */

import { $, getStorageItem, setStorageItem, applyTheme } from './utils.js';

/**
 * Initialize theme system
 */
export function initTheme() {
  // Load saved theme or detect system preference
  const savedTheme = getStorageItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = savedTheme || systemTheme;
  
  // Apply initial theme
  applyTheme(theme);
  
  // Setup theme toggle button
  setupThemeToggle();
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStorageItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Setup theme toggle button functionality
 */
function setupThemeToggle() {
  const toggleButton = $('#themeToggle');
  if (!toggleButton) return;
  
  // Update button appearance
  updateToggleButton(toggleButton);
  
  // Add click handler
  toggleButton.addEventListener('click', () => {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    updateToggleButton(toggleButton);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: newTheme } 
    }));
  });
}

/**
 * Get current theme
 * @returns {string} Current theme
 */
function getCurrentTheme() {
  const htmlClass = document.documentElement.className;
  if (htmlClass.includes('theme-dark')) return 'dark';
  if (htmlClass.includes('theme-light')) return 'light';
  return 'light';
}

/**
 * Update toggle button appearance
 * @param {HTMLElement} button - Toggle button element
 */
function updateToggleButton(button) {
  const theme = getCurrentTheme();
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  
  button.textContent = icon;
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
}

/**
 * Apply theme-specific styles to dynamic content
 * @param {HTMLElement} element - Element to style
 */
export function applyThemeStyles(element) {
  if (!element) return;
  
  const theme = getCurrentTheme();
  
  // Add theme-specific classes if needed
  if (theme === 'dark') {
    element.classList.add('dark-theme');
    element.classList.remove('light-theme');
  } else {
    element.classList.add('light-theme');
    element.classList.remove('dark-theme');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

export default {
  initTheme,
  applyThemeStyles
};