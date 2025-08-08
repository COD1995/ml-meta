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
  setupSidebarResize();
  setupSidebarMinimize();
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
  // Get all potential targets: sections, headings for TOC
  const sections = $$('section[id], article[id], div[id^="main-"], div[id^="call-"], h2[id], h3[id]');
  const navLinks = $$('.side-nav a[href^="#"], .toc-link');
  
  if (!sections.length || !navLinks.length) return;
  
  // Track visible sections
  const visibleSections = new Set();
  
  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };
  
  const updateActiveLinks = () => {
    // Remove all active classes
    navLinks.forEach(link => {
      toggleClass(link, 'active', false);
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
    
    // Activate the corresponding link
    if (topmostSection) {
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${topmostSection}`) {
          toggleClass(link, 'active', true);
          
          // Auto-scroll TOC container if needed
          const tocContainer = link.closest('#toc-list, .toc-chapters');
          if (tocContainer && tocContainer.scrollHeight > tocContainer.clientHeight) {
            const tocRect = tocContainer.getBoundingClientRect();
            const linkRect = link.getBoundingClientRect();
            
            if (linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom) {
              link.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      });
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
    
    updateActiveLinks();
  }, observerOptions);
  
  sections.forEach(section => observer.observe(section));
  
  // Also update on scroll for smoother experience
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateActiveLinks, 50);
  }, { passive: true });
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
 * Check if sidebar would overlap with main content (simplified for cloud button system)
 */
function checkSidebarOverlap() {
  const sideNav = $('.side-nav');
  const container = $('.container');
  
  if (!sideNav || !container) return;
  
  // Skip if already minimized or manually positioned
  if (sideNav.classList.contains('minimized') || sideNav.getAttribute('data-manually-toggled') === 'true') {
    return;
  }
  
  // Get positions and dimensions
  const sideNavRect = sideNav.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Calculate if they would overlap (with 20px buffer)
  const sideNavRight = sideNavRect.left + sideNavRect.width;
  const wouldOverlap = sideNavRight + 20 > containerRect.left;
  
  // Auto-minimize if overlapping
  if (wouldOverlap) {
    const minimizeEvent = new Event('minimize-sidebar');
    sideNav.dispatchEvent(minimizeEvent);
  }
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
    width: sideNav.style.width || '',
    height: sideNav.style.height || '',
    isDragged: true,
    isMinimized: sideNav.classList.contains('minimized') || false
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
      // Restore dimensions if saved
      if (position.width) sideNav.style.width = position.width;
      if (position.height) sideNav.style.height = position.height;
      
      // Restore minimized state
      if (position.isMinimized) {
        // Trigger minimize after setup is complete
        setTimeout(() => {
          const minimizeEvent = new Event('minimize-sidebar');
          sideNav.dispatchEvent(minimizeEvent);
        }, 1000);
      }
      
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

/**
 * Setup sidebar resize functionality
 */
function setupSidebarResize() {
  const sideNav = $('.side-nav');
  if (!sideNav) return;

  // Create resize handles
  const resizeHandleLeft = createElement('div', {
    className: 'resize-handle resize-handle-left',
    'aria-label': 'Resize sidebar width from left'
  });

  const resizeHandleRight = createElement('div', {
    className: 'resize-handle resize-handle-right',
    'aria-label': 'Resize sidebar width from right'
  });

  const resizeHandleTop = createElement('div', {
    className: 'resize-handle resize-handle-top',
    'aria-label': 'Resize sidebar height from top'
  });

  const resizeHandleBottom = createElement('div', {
    className: 'resize-handle resize-handle-bottom',
    'aria-label': 'Resize sidebar height from bottom'
  });

  const resizeHandleCorner = createElement('div', {
    className: 'resize-handle resize-handle-corner',
    'aria-label': 'Resize sidebar width and height'
  });

  const resizeHandleCornerTL = createElement('div', {
    className: 'resize-handle resize-handle-corner-tl',
    'aria-label': 'Resize from top-left corner'
  });

  const resizeHandleCornerTR = createElement('div', {
    className: 'resize-handle resize-handle-corner-tr',
    'aria-label': 'Resize from top-right corner'
  });

  const resizeHandleCornerBL = createElement('div', {
    className: 'resize-handle resize-handle-corner-bl',
    'aria-label': 'Resize from bottom-left corner'
  });

  // Add resize handles to sidebar
  sideNav.appendChild(resizeHandleLeft);
  sideNav.appendChild(resizeHandleRight);
  sideNav.appendChild(resizeHandleTop);
  sideNav.appendChild(resizeHandleBottom);
  sideNav.appendChild(resizeHandleCorner);
  sideNav.appendChild(resizeHandleCornerTL);
  sideNav.appendChild(resizeHandleCornerTR);
  sideNav.appendChild(resizeHandleCornerBL);

  // Resize state
  let isResizing = false;
  let resizeType = '';
  let startSize = { width: 0, height: 0, left: 0, top: 0 };
  let startMouse = { x: 0, y: 0 };

  // Add resize event listeners
  resizeHandleLeft.addEventListener('mousedown', (e) => startResize(e, 'left'));
  resizeHandleRight.addEventListener('mousedown', (e) => startResize(e, 'right'));
  resizeHandleTop.addEventListener('mousedown', (e) => startResize(e, 'top'));
  resizeHandleBottom.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
  resizeHandleCorner.addEventListener('mousedown', (e) => startResize(e, 'corner'));
  resizeHandleCornerTL.addEventListener('mousedown', (e) => startResize(e, 'corner-tl'));
  resizeHandleCornerTR.addEventListener('mousedown', (e) => startResize(e, 'corner-tr'));
  resizeHandleCornerBL.addEventListener('mousedown', (e) => startResize(e, 'corner-bl'));

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);

  function startResize(e, type) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    resizeType = type;
    sideNav.classList.add('resizing');

    const rect = sideNav.getBoundingClientRect();
    startSize.width = rect.width;
    startSize.height = rect.height;
    startSize.left = rect.left;
    startSize.top = rect.top;
    startMouse.x = e.clientX;
    startMouse.y = e.clientY;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = getCursorForType(type);
  }

  function getCursorForType(type) {
    switch(type) {
      case 'left':
      case 'right':
        return 'ew-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'corner':
      case 'corner-tl':
        return 'nwse-resize';
      case 'corner-tr':
      case 'corner-bl':
        return 'nesw-resize';
      default:
        return 'move';
    }
  }

  function handleResize(e) {
    if (!isResizing) return;
    e.preventDefault();

    const deltaX = e.clientX - startMouse.x;
    const deltaY = e.clientY - startMouse.y;

    let newWidth = startSize.width;
    let newHeight = startSize.height;
    let newLeft = startSize.left;
    let newTop = startSize.top;

    // Handle different resize types
    switch(resizeType) {
      case 'right':
        newWidth = Math.max(200, Math.min(600, startSize.width + deltaX));
        break;
      
      case 'left':
        newWidth = Math.max(200, Math.min(600, startSize.width - deltaX));
        newLeft = startSize.left + (startSize.width - newWidth);
        break;
      
      case 'bottom':
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height + deltaY));
        break;
      
      case 'top':
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height - deltaY));
        newTop = startSize.top + (startSize.height - newHeight);
        break;
      
      case 'corner': // bottom-right
        newWidth = Math.max(200, Math.min(600, startSize.width + deltaX));
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height + deltaY));
        break;
      
      case 'corner-tl': // top-left
        newWidth = Math.max(200, Math.min(600, startSize.width - deltaX));
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height - deltaY));
        newLeft = startSize.left + (startSize.width - newWidth);
        newTop = startSize.top + (startSize.height - newHeight);
        break;
      
      case 'corner-tr': // top-right
        newWidth = Math.max(200, Math.min(600, startSize.width + deltaX));
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height - deltaY));
        newTop = startSize.top + (startSize.height - newHeight);
        break;
      
      case 'corner-bl': // bottom-left
        newWidth = Math.max(200, Math.min(600, startSize.width - deltaX));
        newHeight = Math.max(300, Math.min(window.innerHeight - 50, startSize.height + deltaY));
        newLeft = startSize.left + (startSize.width - newWidth);
        break;
    }

    // Apply new dimensions and position
    sideNav.style.width = `${newWidth}px`;
    sideNav.style.height = `${newHeight}px`;
    sideNav.style.left = `${newLeft}px`;
    sideNav.style.top = `${newTop}px`;
  }

  function endResize() {
    if (!isResizing) return;

    isResizing = false;
    resizeType = '';
    sideNav.classList.remove('resizing');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Save the new dimensions
    saveSidebarPosition(sideNav);
  }
}

/**
 * Setup sidebar minimize functionality with cloud button
 */
function setupSidebarMinimize() {
  const sideNav = $('.side-nav');
  if (!sideNav) return;

  let cloudButton = null;

  // Function to create cloud button
  function createCloudButton() {
    if (cloudButton) return cloudButton;
    
    cloudButton = createElement('button', {
      className: 'cloud-restore-btn',
      'aria-label': 'Restore sidebar (draggable)',
      'title': 'Click to restore sidebar • Drag to move'
    });
    cloudButton.innerHTML = '☁️';
    
    // Load saved position
    const savedCloudPos = localStorage.getItem('cloudButtonPosition');
    let cloudPosition = { x: 20, y: window.innerHeight / 2 };
    if (savedCloudPos) {
      try {
        cloudPosition = JSON.parse(savedCloudPos);
      } catch (e) {
        console.warn('Failed to load cloud button position');
      }
    }
    
    // Style the cloud button
    Object.assign(cloudButton.style, {
      position: 'fixed',
      top: `${cloudPosition.y}px`,
      left: `${cloudPosition.x}px`,
      transform: 'translate(-50%, -50%)',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: 'none',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '20px',
      cursor: 'grab',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '1002',
      transition: 'box-shadow 0.3s ease, transform 0.1s ease',
      display: 'none',
      userSelect: 'none'
    });

    // Dragging state
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let dragStartTime = 0;

    // Mouse events for dragging
    cloudButton.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Touch events for mobile dragging
    cloudButton.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);

    function startDrag(e) {
      if (e.button !== 0) return; // Only left mouse button
      e.preventDefault();
      dragStartTime = Date.now();
      initializeDrag(e.clientX, e.clientY);
    }

    function startDragTouch(e) {
      e.preventDefault();
      dragStartTime = Date.now();
      const touch = e.touches[0];
      initializeDrag(touch.clientX, touch.clientY);
    }

    function initializeDrag(clientX, clientY) {
      isDragging = true;
      cloudButton.style.cursor = 'grabbing';
      cloudButton.style.transition = 'none';
      cloudButton.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
      
      const rect = cloudButton.getBoundingClientRect();
      dragOffset.x = clientX - (rect.left + rect.width / 2);
      dragOffset.y = clientY - (rect.top + rect.height / 2);
      
      document.body.style.userSelect = 'none';
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
      
      // Constrain to viewport bounds (with button radius buffer)
      const radius = 25;
      const constrainedX = Math.max(radius, Math.min(window.innerWidth - radius, newX));
      const constrainedY = Math.max(radius, Math.min(window.innerHeight - radius, newY));
      
      cloudButton.style.left = `${constrainedX}px`;
      cloudButton.style.top = `${constrainedY}px`;
    }

    function endDrag() {
      if (!isDragging) return;
      
      const dragDuration = Date.now() - dragStartTime;
      isDragging = false;
      
      cloudButton.style.cursor = 'grab';
      cloudButton.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease';
      cloudButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      document.body.style.userSelect = '';
      
      // Save position
      const rect = cloudButton.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      localStorage.setItem('cloudButtonPosition', JSON.stringify(position));
      
      // If drag was very short (< 200ms), treat as click
      if (dragDuration < 200) {
        setTimeout(() => restoreSidebar(), 10);
      }
    }

    // Hover effects (only when not dragging)
    cloudButton.addEventListener('mouseenter', () => {
      if (!isDragging) {
        cloudButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
        cloudButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
      }
    });
    
    cloudButton.addEventListener('mouseleave', () => {
      if (!isDragging) {
        cloudButton.style.transform = 'translate(-50%, -50%) scale(1)';
        cloudButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }
    });

    document.body.appendChild(cloudButton);
    return cloudButton;
  }

  // Function to minimize sidebar
  function minimizeSidebar() {
    // Get sidebar position before hiding
    const sideNavRect = sideNav.getBoundingClientRect();
    const sidebarCenterX = sideNavRect.left + sideNavRect.width / 2;
    const sidebarCenterY = sideNavRect.top + sideNavRect.height / 2;
    
    // Hide the sidebar
    sideNav.style.display = 'none';
    sideNav.classList.add('minimized');
    
    // Show cloud button at sidebar's position
    const button = createCloudButton();
    button.style.display = 'flex';
    button.style.visibility = 'visible';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    
    // Position cloud button where sidebar was
    button.style.left = `${sidebarCenterX}px`;
    button.style.top = `${sidebarCenterY}px`;
    button.style.transform = 'translate(-50%, -50%)';
    
    // Save cloud button position
    const cloudPosition = {
      x: sidebarCenterX,
      y: sidebarCenterY
    };
    localStorage.setItem('cloudButtonPosition', JSON.stringify(cloudPosition));
    
    // Add pulse animation
    button.style.animation = 'pulse 2s ease-in-out 3';
    
    // Save minimized state
    saveSidebarPosition(sideNav);
  }

  // Function to restore sidebar
  function restoreSidebar() {
    // Get cloud button position if it exists
    if (cloudButton && cloudButton.style.display !== 'none') {
      const cloudRect = cloudButton.getBoundingClientRect();
      const cloudCenterX = cloudRect.left + cloudRect.width / 2;
      const cloudCenterY = cloudRect.top + cloudRect.height / 2;
      
      // Position sidebar at cloud button location
      sideNav.style.position = 'fixed';
      sideNav.style.left = `${cloudCenterX}px`;
      sideNav.style.top = `${cloudCenterY}px`;
      sideNav.style.transform = 'translate(-50%, -50%)';
      
      // Ensure sidebar stays within viewport bounds
      setTimeout(() => {
        const sideNavRect = sideNav.getBoundingClientRect();
        let adjustedX = cloudCenterX;
        let adjustedY = cloudCenterY;
        
        // Adjust X position if sidebar would go off-screen
        if (sideNavRect.left < 0) {
          adjustedX = sideNav.offsetWidth / 2 + 10;
        } else if (sideNavRect.right > window.innerWidth) {
          adjustedX = window.innerWidth - sideNav.offsetWidth / 2 - 10;
        }
        
        // Adjust Y position if sidebar would go off-screen
        if (sideNavRect.top < 0) {
          adjustedY = sideNav.offsetHeight / 2 + 10;
        } else if (sideNavRect.bottom > window.innerHeight) {
          adjustedY = window.innerHeight - sideNav.offsetHeight / 2 - 10;
        }
        
        // Apply adjusted position
        sideNav.style.left = `${adjustedX}px`;
        sideNav.style.top = `${adjustedY}px`;
        
        // Save the new position
        saveSidebarPosition(sideNav);
      }, 50);
    }
    
    // Show the sidebar with animation
    sideNav.style.display = 'flex';
    sideNav.style.opacity = '0';
    sideNav.style.transform += ' scale(0.8)';
    sideNav.classList.remove('minimized');
    
    // Animate in
    setTimeout(() => {
      sideNav.style.opacity = '1';
      sideNav.style.transform = sideNav.style.transform.replace(' scale(0.8)', '');
    }, 10);
    
    // Hide cloud button completely
    if (cloudButton) {
      cloudButton.style.display = 'none';
      cloudButton.style.visibility = 'hidden';
    }
    
    // Save restored state
    const position = JSON.parse(localStorage.getItem('sidebarPosition') || '{}');
    position.isMinimized = false;
    localStorage.setItem('sidebarPosition', JSON.stringify(position));
  }

  // Function to check if sidebar overlaps with content and auto-minimize
  function checkOverlapAndMinimize() {
    const container = $('.container');
    if (!container || sideNav.classList.contains('minimized')) return;
    
    const sideNavRect = sideNav.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check if they overlap (with 20px buffer)
    const sideNavRight = sideNavRect.left + sideNavRect.width;
    const wouldOverlap = sideNavRight + 20 > containerRect.left;
    
    if (wouldOverlap) {
      minimizeSidebar();
    }
  }

  // Add minimize button to drag handle area
  const dragHandle = sideNav.querySelector('.side-nav-drag-handle');
  if (dragHandle) {
    const minimizeBtn = createElement('button', {
      className: 'minimize-btn cloud-btn',
      'aria-label': 'Minimize sidebar',
      'title': 'Minimize sidebar to cloud button'
    });
    minimizeBtn.innerHTML = '☁️';
    dragHandle.appendChild(minimizeBtn);

    // Minimize button functionality
    minimizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      minimizeSidebar();
    });

    // Double-click on drag handle to minimize
    dragHandle.addEventListener('dblclick', () => {
      minimizeSidebar();
    });
  }

  // Function to ensure cloud button visibility matches sidebar state
  function syncCloudButtonVisibility() {
    if (!cloudButton) return;
    
    const sideNavVisible = sideNav.style.display === 'flex' && !sideNav.classList.contains('minimized');
    
    if (sideNavVisible) {
      // Hide cloud button when sidebar is visible
      cloudButton.style.display = 'none';
      cloudButton.style.visibility = 'hidden';
    } else if (sideNav.classList.contains('minimized')) {
      // Show cloud button when sidebar is minimized
      cloudButton.style.display = 'flex';
      cloudButton.style.visibility = 'visible';
    }
  }

  // Monitor sidebar visibility changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        setTimeout(syncCloudButtonVisibility, 50);
      }
    });
  });

  observer.observe(sideNav, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // Listen for window resize to check overlap
  window.addEventListener('resize', () => {
    setTimeout(() => {
      checkOverlapAndMinimize();
      syncCloudButtonVisibility();
    }, 100);
  });

  // Listen for minimize events
  sideNav.addEventListener('minimize-sidebar', minimizeSidebar);

  // Check overlap and sync visibility on initial load
  setTimeout(() => {
    checkOverlapAndMinimize();
    syncCloudButtonVisibility();
  }, 1000);
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