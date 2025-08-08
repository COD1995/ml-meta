/**
 * Navigation management module
 * @module navigation
 */

import { $, $$, on, toggleClass, hasClass, createElement } from './utils.js';

/**
 * Global toggleDropdown function for onclick handlers
 * Define this early so it's available when HTML is generated
 */
window.toggleDropdown = function(dropdownId, button) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) {
    return;
  }
  
  const isCurrentlyVisible = dropdown.classList.contains('show');
  
  if (isCurrentlyVisible) {
    // Hide dropdown
    dropdown.classList.add('hidden');
    dropdown.classList.remove('show');
    button.setAttribute('aria-expanded', 'false');
  } else {
    // Show dropdown
    dropdown.classList.remove('hidden');
    dropdown.classList.add('show');
    button.setAttribute('aria-expanded', 'true');
    
    // Also expand all nested dropdowns within this section
    const nestedDropdowns = dropdown.querySelectorAll('.dropdown-content');
    nestedDropdowns.forEach(nested => {
      nested.classList.remove('hidden');
      nested.classList.add('show');
      
      // Also set the nested buttons to expanded
      const nestedButton = nested.previousElementSibling;
      if (nestedButton) {
        nestedButton.setAttribute('aria-expanded', 'true');
      }
    });
  }
};

/**
 * Initialize navigation system
 */
export function initNavigation() {
  setupDropdowns();
  setupExpandCollapseButtons();
  setupSideNavLinks();
  setupMobileMenu();
  setupSidebarDragging();
}

/**
 * Setup dropdown functionality
 */
function setupDropdowns() {
  // Handle all dropdowns with event delegation
  on(document, 'click', '[data-dropdown-toggle]', handleDropdownToggle);
  
  // Close dropdowns when clicking outside
  on(document, 'click', (e) => {
    // Check if click is inside either data-dropdown elements OR main content dropdown structure
    const isInsideDataDropdown = e.target.closest('[data-dropdown]');
    const isInsideMainDropdown = e.target.closest('.toc-book.dropdown');
    
    if (!isInsideDataDropdown && !isInsideMainDropdown) {
      closeAllDropdowns();
    }
  });
  
  // Keyboard navigation
  on(document, 'keydown', handleDropdownKeyboard);
}

/**
 * Handle dropdown toggle
 * @param {Event} e - Click event
 */
function handleDropdownToggle(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const button = this;
  const dropdown = button.nextElementSibling;
  
  if (!dropdown || !hasClass(dropdown, 'dropdown-content')) return;
  
  const isOpen = hasClass(dropdown, 'show');
  
  // Close other dropdowns
  closeAllDropdowns();
  
  // Toggle current dropdown
  if (!isOpen) {
    openDropdown(button, dropdown);
  }
}

/**
 * Open dropdown
 * @param {HTMLElement} button - Toggle button
 * @param {HTMLElement} dropdown - Dropdown content
 */
function openDropdown(button, dropdown) {
  toggleClass(dropdown, 'show', true);
  button.setAttribute('aria-expanded', 'true');
  
  // Animate
  dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
  dropdown.style.opacity = '1';
}

/**
 * Close dropdown
 * @param {HTMLElement} button - Toggle button
 * @param {HTMLElement} dropdown - Dropdown content
 */
function closeDropdown(button, dropdown) {
  toggleClass(dropdown, 'show', false);
  button.setAttribute('aria-expanded', 'false');
  
  // Animate
  dropdown.style.maxHeight = '0';
  dropdown.style.opacity = '0';
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
  $$('.dropdown-content.show').forEach(dropdown => {
    const button = dropdown.previousElementSibling;
    if (button) {
      closeDropdown(button, dropdown);
    }
  });
}

/**
 * Handle dropdown keyboard navigation
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleDropdownKeyboard(e) {
  const dropdown = e.target.closest('[data-dropdown]');
  if (!dropdown) return;
  
  switch (e.key) {
    case 'Escape':
      closeAllDropdowns();
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusNextDropdownItem(dropdown, 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusNextDropdownItem(dropdown, -1);
      break;
  }
}

/**
 * Focus next dropdown item
 * @param {HTMLElement} dropdown - Dropdown container
 * @param {number} direction - Direction (1 or -1)
 */
function focusNextDropdownItem(dropdown, direction) {
  const items = Array.from(dropdown.querySelectorAll('a, button'));
  const currentIndex = items.indexOf(document.activeElement);
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  
  items[nextIndex]?.focus();
}

/**
 * Setup expand/collapse toggle button
 */
function setupExpandCollapseButtons() {
  const toggleBtn = $('#toggleAll');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      // Wait for content to be generated if needed
      setTimeout(() => {
        const books = $$('.toc-book');
        if (books.length === 0) return;
        
        // Simple toggle based on button state
        const currentState = toggleBtn.getAttribute('data-state');
        const shouldExpand = currentState === 'collapsed';
        
        books.forEach(book => {
          const button = book.querySelector('.toc-book-title');
          const dropdown = book.querySelector('.dropdown-content');
          
          if (button && dropdown) {
            if (shouldExpand) {
              // Expand
              dropdown.classList.remove('hidden');
              dropdown.classList.add('show');
              button.setAttribute('aria-expanded', 'true');
            } else {
              // Collapse
              dropdown.classList.add('hidden');
              dropdown.classList.remove('show');
              button.setAttribute('aria-expanded', 'false');
            }
          }
        });
        
        // Update button state
        if (shouldExpand) {
          toggleBtn.setAttribute('data-state', 'expanded');
          toggleBtn.innerHTML = '⬆️';
          toggleBtn.setAttribute('aria-label', 'Collapse all sections');
          toggleBtn.setAttribute('title', 'Collapse all sections');
        } else {
          toggleBtn.setAttribute('data-state', 'collapsed');
          toggleBtn.innerHTML = '⬇️';
          toggleBtn.setAttribute('aria-label', 'Expand all sections');
          toggleBtn.setAttribute('title', 'Expand all sections');
        }
      }, 150); // Increased timeout slightly
    });
  }
}

/**
 * Setup side navigation links
 */
function setupSideNavLinks() {
  const sideNav = $('.side-nav');
  if (!sideNav) return;
  
  // Smooth scroll to sections
  on(sideNav, 'click', 'a[href^="#"]', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update active state
      $$('.side-nav a').forEach(link => {
        toggleClass(link, 'active', false);
      });
      toggleClass(this, 'active', true);
    }
  });
  
  // Highlight current section on scroll
  setupScrollSpy();
}

/**
 * Setup scroll spy for navigation
 */
function setupScrollSpy() {
  const sections = $$('section[id], article[id], div[id^="main-"], div[id^="call-"]');
  const navLinks = $$('.side-nav a[href^="#"]');
  
  if (!sections.length || !navLinks.length) return;
  
  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          toggleClass(link, 'active', isActive);
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(section => observer.observe(section));
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
  // Check sidebar overlap on load and resize
  checkSidebarOverlap();
  
  // Create mobile menu toggle if not exists
  if (window.innerWidth <= 768 && !$('#mobileMenuToggle')) {
    createMobileMenuToggle();
  }
  
  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      checkSidebarOverlap();
      
      if (window.innerWidth <= 768 && !$('#mobileMenuToggle')) {
        createMobileMenuToggle();
      } else if (window.innerWidth > 768) {
        removeMobileMenuToggle();
      }
    }, 250);
  });
}

/**
 * Check if sidebar would overlap with main content
 */
function checkSidebarOverlap() {
  const sideNav = $('.side-nav');
  const container = $('.container');
  
  if (!sideNav || !container) return;
  
  // Check if manually toggled
  const isManuallyToggled = sideNav.getAttribute('data-manually-toggled') === 'true';
  
  // Get positions and dimensions
  const sideNavRect = sideNav.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Calculate if they would overlap (with 20px buffer)
  const sideNavRight = sideNavRect.left + sideNavRect.width;
  const wouldOverlap = sideNavRight + 20 > containerRect.left;
  
  // Get or create nav toggle bubble
  let navBubble = $('#navToggleBubble');
  if (!navBubble) {
    navBubble = createNavToggleBubble();
  }
  
  // Hide/show sidebar based on overlap (unless manually toggled)
  if (wouldOverlap && !isManuallyToggled) {
    sideNav.style.display = 'none';
    navBubble.style.display = 'flex';
    navBubble.classList.remove('fade-out');
    navBubble.classList.add('fade-in', 'pulse');
    navBubble.innerHTML = '☰';
    navBubble.setAttribute('aria-label', 'Show navigation');
  } else if (!wouldOverlap) {
    sideNav.style.display = 'flex';
    
    // Smoothly hide the bubble
    if (navBubble.style.display === 'flex') {
      navBubble.classList.add('fade-out');
      setTimeout(() => {
        navBubble.style.display = 'none';
        navBubble.classList.remove('fade-out', 'pulse', 'active', 'sidebar-open');
      }, 300);
    } else {
      navBubble.style.display = 'none';
    }
    
    sideNav.removeAttribute('data-manually-toggled');
  }
}

/**
 * Create navigation toggle bubble
 */
function createNavToggleBubble() {
  const bubble = createElement('button', {
    id: 'navToggleBubble',
    className: 'nav-toggle-bubble fade-in',
    'aria-label': 'Toggle navigation'
  });
  bubble.innerHTML = '☰';
  
  // Add pulse animation initially
  setTimeout(() => bubble.classList.add('pulse'), 300);
  
  bubble.addEventListener('click', () => {
    const sideNav = $('.side-nav');
    if (sideNav) {
      const isVisible = sideNav.style.display === 'flex';
      
      if (isVisible) {
        // Hide nav and switch back to hamburger
        sideNav.style.display = 'none';
        sideNav.removeAttribute('data-manually-toggled');
        
        bubble.classList.remove('active', 'sidebar-open');
        bubble.innerHTML = '☰';
        bubble.setAttribute('aria-label', 'Show navigation');
        
        // Keep button visible and ready for next use
        bubble.classList.remove('fade-out');
        bubble.classList.add('pulse'); // Add attention-grabbing pulse
      } else {
        // Add icon change animation only when opening
        bubble.classList.add('icon-change');
        
        // Show nav and keep button partially visible
        sideNav.style.display = 'flex';
        sideNav.setAttribute('data-manually-toggled', 'true');
        bubble.classList.add('active', 'sidebar-open');
        bubble.innerHTML = '✕';
        bubble.setAttribute('aria-label', 'Hide navigation');
        
        // Remove fade classes and add smart positioning
        bubble.classList.remove('fade-out');
        
        // Auto-hide button after 3 seconds if not hovered
        const autoHide = setTimeout(() => {
          if (!bubble.matches(':hover')) {
            bubble.classList.add('fade-out');
            setTimeout(() => {
              if (bubble.classList.contains('fade-out')) {
                bubble.style.display = 'none';
              }
            }, 300);
          }
        }, 3000);
        
        // Cancel auto-hide on hover
        bubble.addEventListener('mouseenter', () => clearTimeout(autoHide), { once: true });
        
        // Remove icon animation class after animation completes
        setTimeout(() => bubble.classList.remove('icon-change'), 400);
      }
    }
  });
  
  // Add keyboard support for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sideNav = $('.side-nav');
      if (sideNav && sideNav.style.display === 'flex' && sideNav.hasAttribute('data-manually-toggled')) {
        bubble.click(); // Trigger the same hide behavior
      }
    }
  });
  
  document.body.appendChild(bubble);
  return bubble;
}

/**
 * Create mobile menu toggle button
 */
function createMobileMenuToggle() {
  const toggle = createElement('button', {
    id: 'mobileMenuToggle',
    className: 'mobile-menu-toggle',
    'aria-label': 'Toggle navigation menu',
    innerHTML: '<span></span><span></span><span></span>'
  });
  
  toggle.addEventListener('click', () => {
    const sideNav = $('.side-nav');
    if (sideNav) {
      toggleClass(sideNav, 'mobile-open');
      toggleClass(toggle, 'active');
    }
  });
  
  document.body.appendChild(toggle);
}

/**
 * Remove mobile menu toggle
 */
function removeMobileMenuToggle() {
  const toggle = $('#mobileMenuToggle');
  if (toggle) {
    toggle.remove();
  }
  
  const sideNav = $('.side-nav');
  if (sideNav) {
    sideNav.classList.remove('mobile-open');
  }
}

/**
 * Setup sidebar dragging functionality
 */
function setupSidebarDragging() {
  const sideNav = $('.side-nav');
  if (!sideNav) return;

  // Create drag handle and wrap existing content
  const dragHandle = createElement('div', {
    className: 'side-nav-drag-handle',
    'aria-label': 'Drag to move sidebar'
  });

  const contentWrapper = createElement('div', {
    className: 'side-nav-content'
  });

  // Move all existing sidebar content into the wrapper
  while (sideNav.firstChild) {
    contentWrapper.appendChild(sideNav.firstChild);
  }

  // Add drag handle and content wrapper to sidebar
  sideNav.appendChild(dragHandle);
  sideNav.appendChild(contentWrapper);

  // Dragging state
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let startPosition = { x: 0, y: 0 };

  // Load saved position from localStorage
  loadSidebarPosition(sideNav);

  // Mouse events for dragging
  dragHandle.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);

  // Touch events for mobile dragging
  dragHandle.addEventListener('touchstart', startDragTouch, { passive: false });
  document.addEventListener('touchmove', dragTouch, { passive: false });
  document.addEventListener('touchend', endDrag);

  function startDrag(e) {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    initializeDrag(e.clientX, e.clientY);
  }

  function startDragTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    initializeDrag(touch.clientX, touch.clientY);
  }

  function initializeDrag(clientX, clientY) {
    isDragging = true;
    sideNav.classList.add('dragging');
    
    const rect = sideNav.getBoundingClientRect();
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;
    startPosition.x = rect.left;
    startPosition.y = rect.top;
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e.clientX, e.clientY);
  }

  function dragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  }

  function updatePosition(clientX, clientY) {
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    // Constrain to viewport bounds
    const maxX = window.innerWidth - sideNav.offsetWidth;
    const maxY = window.innerHeight - sideNav.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(0, Math.min(maxY, newY));
    
    sideNav.style.left = `${constrainedX}px`;
    sideNav.style.top = `${constrainedY}px`;
    sideNav.style.transform = 'none'; // Override the translateY(-50%)
  }

  function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    sideNav.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Save position to localStorage
    saveSidebarPosition(sideNav);
  }
}

/**
 * Save sidebar position to localStorage
 */
function saveSidebarPosition(sideNav) {
  const rect = sideNav.getBoundingClientRect();
  const position = {
    x: rect.left,
    y: rect.top,
    isDragged: true
  };
  localStorage.setItem('sidebarPosition', JSON.stringify(position));
}

/**
 * Load sidebar position from localStorage
 */
function loadSidebarPosition(sideNav) {
  const saved = localStorage.getItem('sidebarPosition');
  if (!saved) return;
  
  try {
    const position = JSON.parse(saved);
    if (position.isDragged) {
      // Ensure position is still within viewport bounds
      const maxX = window.innerWidth - sideNav.offsetWidth;
      const maxY = window.innerHeight - sideNav.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(maxX, position.x));
      const constrainedY = Math.max(0, Math.min(maxY, position.y));
      
      sideNav.style.left = `${constrainedX}px`;
      sideNav.style.top = `${constrainedY}px`;
      sideNav.style.transform = 'none';
    }
  } catch (e) {
    console.warn('Failed to load sidebar position:', e);
  }
}

// toggleDropdown is now defined as a global function above


// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}

export default {
  initNavigation
};