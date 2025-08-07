/**
 * Shared utility functions for ml-meta project
 * @module utils
 */

/**
 * Convert a string to a URL-friendly slug
 * @param {string} str - The string to slugify
 * @returns {string} The slugified string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed JSON or fallback value
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Get value from localStorage with fallback
 * @param {string} key - Storage key
 * @param {*} fallback - Fallback value if key doesn't exist
 * @returns {*} Stored value or fallback
 */
export function getStorageItem(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? safeJsonParse(item, item) : fallback;
  } catch (error) {
    console.error('localStorage error:', error);
    return fallback;
  }
}

/**
 * Set value in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export function setStorageItem(key, value) {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error('localStorage error:', error);
    return false;
  }
}

/**
 * Fetch with timeout and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Fetch promise
 */
export async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Create DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {HTMLElement|null} Found element or null
 */
export function $(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return null;
  }
}

/**
 * Query selector all with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {NodeList} Found elements
 */
export function $$(selector, context = document) {
  try {
    return context.querySelectorAll(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return [];
  }
}

/**
 * Add event listener with delegation support
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {string|Function} selectorOrHandler - Delegate selector or handler
 * @param {Function} handler - Event handler (if delegating)
 */
export function on(element, event, selectorOrHandler, handler) {
  if (typeof selectorOrHandler === 'function') {
    // Direct event binding
    element.addEventListener(event, selectorOrHandler);
  } else {
    // Event delegation
    element.addEventListener(event, (e) => {
      const target = e.target.closest(selectorOrHandler);
      if (target && element.contains(target)) {
        handler.call(target, e);
      }
    });
  }
}

/**
 * Toggle class on element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add/remove
 */
export function toggleClass(element, className, force) {
  if (element) {
    element.classList.toggle(className, force);
  }
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to check
 * @returns {boolean} Has class
 */
export function hasClass(element, className) {
  return element && element.classList.contains(className);
}

/**
 * Get current theme
 * @returns {string} Current theme ('light' or 'dark')
 */
export function getCurrentTheme() {
  const htmlClass = document.documentElement.className;
  if (htmlClass.includes('theme-dark')) return 'dark';
  if (htmlClass.includes('theme-light')) return 'light';
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Apply theme to document
 * @param {string} theme - Theme to apply ('light' or 'dark')
 */
export function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add(`theme-${theme}`);
  setStorageItem('theme', theme);
}

/**
 * Format date to relative time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted relative time
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects to merge
 * @returns {Object} Merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is plain object
 * @param {*} obj - Value to check
 * @returns {boolean} Is plain object
 */
function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Wait for DOM content to be loaded
 * @returns {Promise} Promise that resolves when DOM is ready
 */
export function domReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

/**
 * Load external script dynamically
 * @param {string} src - Script source URL
 * @param {Object} attrs - Additional attributes
 * @returns {Promise} Promise that resolves when script loads
 */
export function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    
    script.onload = resolve;
    script.onerror = reject;
    
    document.head.appendChild(script);
  });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textarea = createElement('textarea', {
      value: text,
      style: 'position: fixed; left: -9999px;'
    });
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

// Export all functions as default object as well
export default {
  slugify,
  debounce,
  throttle,
  safeJsonParse,
  getStorageItem,
  setStorageItem,
  fetchWithTimeout,
  createElement,
  $,
  $$,
  on,
  toggleClass,
  hasClass,
  getCurrentTheme,
  applyTheme,
  formatRelativeTime,
  deepMerge,
  domReady,
  loadScript,
  copyToClipboard
};