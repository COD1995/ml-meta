/**
 * Main application entry point
 * Coordinates all modules and handles legacy compatibility
 */

import utils from './utils.js';
import theme from './theme.js';
import navigation from './navigation.js';
import toc from './toc.js';

// Import individual functions we need
const { $, $$, on, fetchWithTimeout, getStorageItem, setStorageItem, formatRelativeTime, domReady } = utils;

/**
 * Main application class
 */
class MLMetaApp {
  constructor() {
    this.contributors = [];
    this.lastUpdate = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Wait for DOM to be ready
      await domReady();
      
      // Initialize all modules
      await this.initializeModules();
      
      // Setup legacy compatibility
      this.setupLegacyCompatibility();
      
      // Load dynamic content
      await this.loadDynamicContent();
      
      this.initialized = true;
      console.log('ML-Meta application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    // Theme system is auto-initialized
    // Navigation system is auto-initialized  
    // TOC system is auto-initialized
    
    // Additional initialization
    this.setupLastUpdated();
    this.setupContributors();
    this.setupExpandCollapse();
  }

  /**
   * Setup legacy compatibility for existing code
   */
  setupLegacyCompatibility() {
    // Expose necessary functions to global scope for legacy code
    // Note: toggleDropdown is now defined directly in navigation.js as a global function
    
    // Legacy slugify function
    window.slugify = utils.slugify;
    
    // Theme utilities
    window.getCurrentTheme = utils.getCurrentTheme;
    window.applyTheme = utils.applyTheme;
  }

  /**
   * Load dynamic content
   */
  async loadDynamicContent() {
    await Promise.all([
      this.loadContributors(),
      this.loadGitHubHeatmap()
    ]);
  }

  /**
   * Setup last updated timestamp
   */
  setupLastUpdated() {
    const lastUpdatedEl = $('#lastUpdated');
    if (lastUpdatedEl) {
      // Try to get from localStorage first
      const cached = getStorageItem('lastUpdated');
      if (cached) {
        lastUpdatedEl.textContent = formatRelativeTime(cached);
        lastUpdatedEl.setAttribute('datetime', new Date(cached).toISOString());
      } else {
        lastUpdatedEl.textContent = 'Recently';
      }
    }
  }

  /**
   * Setup contributor system
   */
  setupContributors() {
    // Contributors will be loaded asynchronously
    this.setupContributorRefresh();
  }

  /**
   * Setup contributor refresh mechanism
   */
  setupContributorRefresh() {
    // Refresh contributors every 24 hours
    const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    const lastRefresh = getStorageItem('contributorsLastRefresh', 0);
    const now = Date.now();

    if (now - lastRefresh > REFRESH_INTERVAL) {
      this.loadContributors(true); // Force refresh
    }
  }

  /**
   * Load GitHub contributors
   */
  async loadContributors(forceRefresh = false) {
    const cacheKey = 'contributors';
    const lastRefreshKey = 'contributorsLastRefresh';
    
    // Check cache first
    if (!forceRefresh) {
      const cached = getStorageItem(cacheKey);
      if (cached && Array.isArray(cached)) {
        this.displayContributors(cached);
        return;
      }
    }

    try {
      const response = await fetchWithTimeout(
        'https://api.github.com/repos/COD1995/ml-meta/contributors?per_page=100',
        { headers: { 'Accept': 'application/vnd.github.v3+json' } },
        10000
      );

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const contributors = await response.json();
      
      // Filter and sort contributors
      const filtered = contributors
        .filter(c => c.type === 'User' && c.contributions > 0)
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 10); // Top 10 contributors

      this.contributors = filtered;
      this.displayContributors(filtered);

      // Cache the results
      setStorageItem(cacheKey, filtered);
      setStorageItem(lastRefreshKey, Date.now());
      setStorageItem('lastUpdated', new Date().toISOString());
      
      // Update last updated display
      this.setupLastUpdated();

    } catch (error) {
      console.error('Failed to load contributors:', error);
      this.displayContributorsError(error.message);
    }
  }

  /**
   * Display contributors in leaderboard
   */
  displayContributors(contributors) {
    const tbody = $('.leaderboard-table tbody');
    if (!tbody) return;

    // Clear existing content
    tbody.innerHTML = '';

    contributors.forEach((contributor, index) => {
      const row = this.createContributorRow(contributor, index + 1);
      tbody.appendChild(row);
    });
  }

  /**
   * Create contributor table row
   */
  createContributorRow(contributor, rank) {
    const row = document.createElement('tr');
    
    // Rank with medal for top 3
    const rankCell = document.createElement('td');
    rankCell.className = 'number';
    rankCell.innerHTML = this.getRankDisplay(rank);
    
    // Name with avatar and link
    const nameCell = document.createElement('td');
    nameCell.className = 'name';
    nameCell.innerHTML = `
      <div class="name-cell">
        <img src="${contributor.avatar_url}" alt="${contributor.login}" width="32" height="32" class="avatar">
        <a href="${contributor.html_url}" target="_blank" rel="noopener noreferrer">${contributor.login}</a>
      </div>
    `;
    
    // Contributions
    const contributionsCell = document.createElement('td');
    contributionsCell.className = 'points';
    contributionsCell.textContent = contributor.contributions;
    
    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(contributionsCell);
    
    return row;
  }

  /**
   * Get rank display with medals
   */
  getRankDisplay(rank) {
    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return medals[rank] || rank;
  }

  /**
   * Display contributors error
   */
  displayContributorsError(message) {
    const tbody = $('.leaderboard-table tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="error">
          Failed to load contributors: ${message}
        </td>
      </tr>
    `;
  }

  /**
   * Load GitHub contribution heatmap
   */
  async loadGitHubHeatmap() {
    const container = $('#github-heatmap');
    if (!container) return;

    try {
      // Create iframe for GitHub contribution graph
      const iframe = document.createElement('iframe');
      iframe.src = 'https://ghchart.rshah.org/COD1995';
      iframe.width = '100%';
      iframe.height = '150';
      iframe.style.border = 'none';
      iframe.title = 'GitHub Contribution Chart';
      
      container.appendChild(iframe);
    } catch (error) {
      console.error('Failed to load GitHub heatmap:', error);
      container.innerHTML = '<p class="error">Failed to load contribution chart</p>';
    }
  }

  /**
   * Setup expand/collapse all functionality
   */
  setupExpandCollapse() {
    const expandBtn = $('#expandAll');
    const collapseBtn = $('#collapseAll');

    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        this.expandAllSections();
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        this.collapseAllSections();
      });
    }
  }

  /**
   * Expand all sections
   */
  expandAllSections() {
    // Main navigation sections
    $$('.toc-book').forEach(book => {
      book.setAttribute('open', '');
      const button = book.querySelector('.toc-book-title, .index-dropdown');
      if (button) button.setAttribute('aria-expanded', 'true');
    });

    // Any other collapsible sections
    $$('details').forEach(details => {
      details.open = true;
    });

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('sectionsExpanded'));
  }

  /**
   * Collapse all sections
   */
  collapseAllSections() {
    // Main navigation sections
    $$('.toc-book').forEach(book => {
      book.removeAttribute('open');
      const button = book.querySelector('.toc-book-title, .index-dropdown');
      if (button) button.setAttribute('aria-expanded', 'false');
    });

    // Any other collapsible sections
    $$('details').forEach(details => {
      details.open = false;
    });

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('sectionsCollapsed'));
  }

  /**
   * Refresh all dynamic content
   */
  async refresh() {
    try {
      await Promise.all([
        this.loadContributors(true),
        this.loadGitHubHeatmap()
      ]);
      console.log('Content refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh content:', error);
    }
  }
}

// Create and initialize the application
const app = new MLMetaApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Expose app instance for debugging and external access
window.MLMetaApp = app;

// Export for module systems
export default app;