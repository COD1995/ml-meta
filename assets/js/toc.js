/**
 * Table of Contents generation module
 * @module toc
 */

import { $, $$, createElement, slugify, fetchWithTimeout } from './utils.js';

/**
 * Initialize TOC generation
 */
export function initTOC() {
  // Generate TOC for current page
  generateTOC();
  
  // Setup lazy loading for remote TOCs
  setupLazyTOCs();
}

/**
 * Generate table of contents from headings
 * @param {string} contentSelector - Selector for content area
 * @param {string} tocSelector - Selector for TOC container
 */
export function generateTOC(contentSelector = '.main-content', tocSelector = '#toc-list') {
  const content = $(contentSelector);
  const tocContainer = $(tocSelector);
  
  if (!content || !tocContainer) return;
  
  const headings = $$('h2, h3', content);
  if (!headings.length) {
    tocContainer.innerHTML = '<li class="toc-empty">No sections found</li>';
    return;
  }
  
  // Clear existing TOC
  tocContainer.innerHTML = '';
  
  // Build TOC structure
  const tocFragment = document.createDocumentFragment();
  let currentH2Item = null;
  let currentH3List = null;
  
  headings.forEach(heading => {
    // Ensure heading has an ID
    if (!heading.id) {
      heading.id = slugify(heading.textContent);
    }
    
    // Create TOC item
    const tocItem = createTOCItem(heading);
    
    if (heading.tagName === 'H2') {
      // Add H2 item to main list
      tocFragment.appendChild(tocItem);
      currentH2Item = tocItem;
      currentH3List = null;
    } else if (heading.tagName === 'H3' && currentH2Item) {
      // Create sub-list for H3 items if needed
      if (!currentH3List) {
        currentH3List = createElement('ul', { className: 'toc-sublist' });
        currentH2Item.appendChild(currentH3List);
      }
      currentH3List.appendChild(tocItem);
    }
  });
  
  tocContainer.appendChild(tocFragment);
  
  // Setup smooth scrolling
  setupSmoothScrolling(tocContainer);
  
  // Setup active section tracking
  setupActiveTracking(headings, tocContainer);
}

/**
 * Create TOC item element
 * @param {HTMLElement} heading - Heading element
 * @returns {HTMLElement} TOC item element
 */
function createTOCItem(heading) {
  const link = createElement('a', {
    href: `#${heading.id}`,
    className: `toc-link toc-${heading.tagName.toLowerCase()}`,
    textContent: heading.textContent
  });
  
  return createElement('li', { className: 'toc-item' }, [link]);
}

/**
 * Setup smooth scrolling for TOC links
 * @param {HTMLElement} tocContainer - TOC container element
 */
function setupSmoothScrolling(tocContainer) {
  tocContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.href.includes('#')) {
      e.preventDefault();
      
      const targetId = e.target.href.split('#')[1];
      const target = document.getElementById(targetId);
      
      if (target) {
        // Calculate offset for fixed header
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without scrolling
        history.pushState(null, null, `#${targetId}`);
      }
    }
  });
}

/**
 * Setup active section tracking
 * @param {NodeList} headings - Heading elements
 * @param {HTMLElement} tocContainer - TOC container
 */
function setupActiveTracking(headings, tocContainer) {
  if (!headings.length) return;
  
  // Track which sections are currently visible
  const visibleSections = new Set();
  
  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };
  
  const updateActiveLink = () => {
    // Remove all active classes first
    tocContainer.querySelectorAll('.toc-link.active').forEach(link => {
      link.classList.remove('active');
    });
    
    // Find the topmost visible section
    let topmostSection = null;
    let topmostPosition = Infinity;
    
    visibleSections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top < topmostPosition && rect.top > -100) {
          topmostPosition = rect.top;
          topmostSection = id;
        }
      }
    });
    
    // Highlight the topmost visible section
    if (topmostSection) {
      const activeLink = tocContainer.querySelector(`a[href="#${topmostSection}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        
        // Ensure the active link is visible in the TOC container if it has scroll
        const tocRect = tocContainer.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        
        if (linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom) {
          activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleSections.add(entry.target.id);
      } else {
        visibleSections.delete(entry.target.id);
      }
    });
    
    // Update active link after processing all entries
    updateActiveLink();
  }, observerOptions);
  
  headings.forEach(heading => observer.observe(heading));
  
  // Also update on scroll for smoother tracking
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateActiveLink, 50);
  }, { passive: true });
}

/**
 * Setup lazy loading for remote TOCs
 */
function setupLazyTOCs() {
  $$('[data-toc-remote]').forEach(container => {
    const url = container.dataset.tocRemote;
    const trigger = container.querySelector('[data-toc-trigger]');
    
    if (!url || !trigger) return;
    
    trigger.addEventListener('click', async () => {
      if (container.dataset.tocLoaded === 'true') return;
      
      try {
        await loadRemoteTOC(url, container);
        container.dataset.tocLoaded = 'true';
      } catch (error) {
        console.error('Failed to load remote TOC:', error);
        showTOCError(container, error.message);
      }
    }, { once: true });
  });
}

/**
 * Load remote TOC content
 * @param {string} url - Remote URL
 * @param {HTMLElement} container - Container element
 */
async function loadRemoteTOC(url, container) {
  // Show loading state
  const tocList = container.querySelector('.toc-list');
  if (tocList) {
    tocList.innerHTML = '<li class="toc-loading">Loading...</li>';
  }
  
  try {
    // Fetch remote content
    const response = await fetchWithTimeout(url, {}, 10000);
    const html = await response.text();
    
    // Parse HTML and extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    if (!headings.length) {
      tocList.innerHTML = '<li class="toc-empty">No sections found</li>';
      return;
    }
    
    // Generate TOC from headings
    tocList.innerHTML = '';
    const tocFragment = document.createDocumentFragment();
    
    headings.forEach(heading => {
      const text = heading.textContent;
      const level = heading.tagName.toLowerCase();
      const id = heading.id || slugify(text);
      
      const link = createElement('a', {
        href: `${url}#${id}`,
        className: `toc-link toc-${level}`,
        textContent: text,
        target: '_self'
      });
      
      const item = createElement('li', { className: 'toc-item' }, [link]);
      tocFragment.appendChild(item);
    });
    
    tocList.appendChild(tocFragment);
  } catch (error) {
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

/**
 * Show TOC loading error
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 */
function showTOCError(container, message) {
  const tocList = container.querySelector('.toc-list');
  if (tocList) {
    tocList.innerHTML = `<li class="toc-error">Error: ${message}</li>`;
  }
}

/**
 * Generate mini TOC for a specific section
 * @param {HTMLElement} section - Section element
 * @returns {HTMLElement} Mini TOC element
 */
export function generateMiniTOC(section) {
  if (!section) return null;
  
  const headings = $$('h3, h4', section);
  if (!headings.length) return null;
  
  const miniTOC = createElement('nav', { className: 'mini-toc' });
  const list = createElement('ul', { className: 'mini-toc-list' });
  
  headings.forEach(heading => {
    if (!heading.id) {
      heading.id = slugify(heading.textContent);
    }
    
    const link = createElement('a', {
      href: `#${heading.id}`,
      textContent: heading.textContent
    });
    
    const item = createElement('li', {}, [link]);
    list.appendChild(item);
  });
  
  miniTOC.appendChild(list);
  return miniTOC;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTOC);
} else {
  initTOC();
}

export default {
  initTOC,
  generateTOC,
  generateMiniTOC
};