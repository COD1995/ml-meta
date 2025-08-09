/**
 * Main application entry point
 * Coordinates all modules and handles legacy compatibility
 */

import utils from "./utils.js";
import theme from "./theme.js";
import navigation from "./navigation.js";
import toc from "./toc.js";

// Import individual functions we need
const {
  $,
  $$,
  on,
  fetchWithTimeout,
  getStorageItem,
  setStorageItem,
  formatRelativeTime,
  domReady,
} = utils;

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
      console.log("ML-Meta application initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
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
    await Promise.all([this.loadContributors(), this.loadGitHubHeatmap()]);
  }

  /**
   * Setup last updated timestamp
   */
  setupLastUpdated() {
    const lastUpdatedEl = $("#lastUpdated");
    if (lastUpdatedEl) {
      // Try to get from localStorage first
      const cached = getStorageItem("lastUpdated");
      if (cached) {
        lastUpdatedEl.textContent = formatRelativeTime(cached);
        lastUpdatedEl.setAttribute("datetime", new Date(cached).toISOString());
      } else {
        lastUpdatedEl.textContent = "Recently";
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
    const lastRefresh = getStorageItem("contributorsLastRefresh", 0);
    const now = Date.now();

    if (now - lastRefresh > REFRESH_INTERVAL) {
      this.loadContributors(true); // Force refresh
    }
  }

  /**
   * Load GitHub contributors
   */
  async loadContributors(forceRefresh = false) {
    const cacheKey = "contributors";
    const lastRefreshKey = "contributorsLastRefresh";

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
        "https://api.github.com/repos/COD1995/ml-meta/contributors?per_page=100",
        { headers: { Accept: "application/vnd.github.v3+json" } },
        10000
      );

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const contributors = await response.json();

      // Filter and sort contributors
      const filtered = contributors
        .filter((c) => c.type === "User" && c.contributions > 0)
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 10); // Top 10 contributors

      this.contributors = filtered;
      this.displayContributors(filtered);

      // Cache the results
      setStorageItem(cacheKey, filtered);
      setStorageItem(lastRefreshKey, Date.now());
      setStorageItem("lastUpdated", new Date().toISOString());

      // Update last updated display
      this.setupLastUpdated();
    } catch (error) {
      console.error("Failed to load contributors:", error);
      this.displayContributorsError(error.message);
    }
  }

  /**
   * Display contributors in leaderboard
   */
  displayContributors(contributors) {
    const tbody = $(".leaderboard-table tbody");
    if (!tbody) return;

    // Clear existing content
    tbody.innerHTML = "";

    contributors.forEach((contributor, index) => {
      const row = this.createContributorRow(contributor, index + 1);
      tbody.appendChild(row);
    });
  }

  /**
   * Create contributor table row
   */
  createContributorRow(contributor, rank) {
    const row = document.createElement("tr");

    // Rank with medal for top 3
    const rankCell = document.createElement("td");
    rankCell.className = "number";
    rankCell.innerHTML = this.getRankDisplay(rank);

    // Name with avatar and link
    const nameCell = document.createElement("td");
    nameCell.className = "name";
    nameCell.innerHTML = `
      <div class="name-cell">
        <img src="${contributor.avatar_url}" alt="${contributor.login}" width="32" height="32" class="avatar">
        <a href="${contributor.html_url}" target="_blank" rel="noopener noreferrer">${contributor.login}</a>
      </div>
    `;

    // Contributions
    const contributionsCell = document.createElement("td");
    contributionsCell.className = "points";
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
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    return medals[rank] || rank;
  }

  /**
   * Display contributors error
   */
  displayContributorsError(message) {
    const tbody = $(".leaderboard-table tbody");
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
   * Set USE_CUSTOM_HEATMAP to true for GitHub API version, false for iframe version
   */
  async loadGitHubHeatmap() {
    const USE_CUSTOM_HEATMAP = true; // Switch between implementations

    if (USE_CUSTOM_HEATMAP) {
      await this.loadCustomGitHubHeatmap();
    } else {
      await this.loadIframeGitHubHeatmap();
    }
  }

  /**
   * Load iframe-based heatmap (Option 1: Enhanced)
   */
  async loadIframeGitHubHeatmap() {
    const container = $(".heatmap-content");
    if (!container) return;

    const loadingEl = container.querySelector(".heatmap-loading");
    const errorEl = container.querySelector(".heatmap-error");

    try {
      // Create iframe for GitHub contribution graph
      const iframe = document.createElement("iframe");
      iframe.src = "https://ghchart.rshah.org/COD1995";
      iframe.width = "100%";
      iframe.height = "150";
      iframe.title = "GitHub Contribution Chart";
      iframe.loading = "lazy";

      // Show loading state
      if (loadingEl) loadingEl.style.display = "flex";
      if (errorEl) errorEl.style.display = "none";

      // Handle iframe load
      iframe.onload = () => {
        if (loadingEl) loadingEl.style.display = "none";
        iframe.style.opacity = "1";
      };

      // Handle iframe error
      iframe.onerror = () => {
        if (loadingEl) loadingEl.style.display = "none";
        if (errorEl) errorEl.style.display = "flex";
      };

      // Set initial opacity for smooth transition
      iframe.style.opacity = "0";

      // Add timeout for loading state
      setTimeout(() => {
        if (loadingEl && loadingEl.style.display !== "none") {
          if (loadingEl) loadingEl.style.display = "none";
          if (errorEl) errorEl.style.display = "flex";
        }
      }, 10000); // 10 second timeout

      container.appendChild(iframe);
    } catch (error) {
      console.error("Failed to load GitHub heatmap:", error);
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "flex";
        errorEl.querySelector("span").textContent = `⚠️ ${error.message}`;
      }
    }
  }

  /**
   * Load custom GitHub API heatmap (Option 2: Custom)
   */
  async loadCustomGitHubHeatmap() {
    const container = $(".heatmap-content");
    if (!container) return;

    const loadingEl = container.querySelector(".heatmap-loading");
    const errorEl = container.querySelector(".heatmap-error");

    try {
      // Show loading state
      if (loadingEl) loadingEl.style.display = "flex";
      if (errorEl) errorEl.style.display = "none";

      // Get contribution data from GitHub API
      let contributionData;
      try {
        contributionData = await this.fetchContributionData("COD1995");
      } catch (apiError) {
        console.warn("GitHub API failed, using mock data:", apiError);
        contributionData = this.generateMockContributionData();
      }

      // Create custom heatmap
      const heatmapSvg = this.createCustomHeatmap(contributionData);

      // Hide loading and show heatmap
      if (loadingEl) loadingEl.style.display = "none";
      
      // Clear container before adding new content
      const existingHeatmap = container.querySelector('.custom-heatmap');
      if (existingHeatmap) {
        existingHeatmap.remove();
      }
      
      container.appendChild(heatmapSvg);
    } catch (error) {
      console.error("Failed to load custom GitHub heatmap:", error);
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "flex";
        const errorSpan = errorEl.querySelector("span");
        if (errorSpan) {
          errorSpan.textContent = `⚠️ ${error.message}`;
        }
      }
    }
  }

  /**
   * Generate mock contribution data for testing
   */
  generateMockContributionData() {
    const contributionMap = new Map();
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Generate random data for the past year
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      // Random contributions (0-10, with some days having no contributions)
      const contributions = Math.random() < 0.7 ? Math.floor(Math.random() * 5) : 0;
      contributionMap.set(dateStr, contributions);
    }

    return contributionMap;
  }

  /**
   * Fetch contribution data from GitHub API
   */
  async fetchContributionData(username) {
    const cacheKey = `github-contributions-${username}`;
    const cached = getStorageItem(cacheKey);

    // Use cache if less than 1 hour old and not empty
    if (cached && Date.now() - cached.timestamp < 3600000 && cached.data && Object.keys(cached.data).length > 0) {
      console.log("Using cached data:", cached.data);
      // Convert cached object back to Map
      return new Map(Object.entries(cached.data));
    }
    
    console.log("Cache miss or empty, fetching fresh data...");

    // Fetch commits from the ml-meta repository
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/COD1995/ml-meta/commits?per_page=100&since=${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}`,
      { headers: { Accept: "application/vnd.github.v3+json" } },
      10000
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    // Process commits into daily contribution counts
    const contributions = this.processCommitsToContributions(commits);

    // Cache the result (convert Map to object for storage)
    setStorageItem(cacheKey, {
      data: Object.fromEntries(contributions),
      timestamp: Date.now(),
    });

    return contributions;
  }

  /**
   * Process GitHub commits into daily contribution counts
   */
  processCommitsToContributions(commits) {
    const contributionMap = new Map();
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Initialize all days in the last year with 0 contributions
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      contributionMap.set(dateStr, 0);
    }

    // Count commits per day
    commits.forEach((commit) => {
      const commitDate = new Date(commit.commit.author.date).toISOString().split("T")[0];
      if (contributionMap.has(commitDate)) {
        contributionMap.set(commitDate, contributionMap.get(commitDate) + 1);
      }
    });

    return contributionMap;
  }

  /**
   * Create custom SVG heatmap
   */
  createCustomHeatmap(contributionData) {
    const cellSize = 12;
    const cellGap = 2;
    
    // Ensure contributionData is a Map (handle cached objects)
    const dataMap = contributionData instanceof Map ? contributionData : new Map(Object.entries(contributionData));
    
    const totalCells = dataMap.size;
    const weeksCount = Math.ceil(totalCells / 7);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", weeksCount * (cellSize + cellGap));
    svg.setAttribute("height", 7 * (cellSize + cellGap));
    svg.setAttribute("class", "custom-heatmap");

    // Get current theme for colors
    const isDark = document.documentElement.classList.contains("theme-dark");
    const colors = isDark
      ? {
          0: "#161b22",
          1: "#0e4429",
          2: "#006d32",
          3: "#26a641",
          4: "#39d353",
        }
      : {
          0: "#ebedf0",
          1: "#9be9a8",
          2: "#40c463",
          3: "#30a14e",
          4: "#216e39",
        };

    // Find max contributions for normalization
    const values = Array.from(dataMap.values());
    const maxContributions = values.length > 0 ? Math.max(...values) : 0;

    let dayIndex = 0;
    for (const [date, count] of dataMap) {
      const week = Math.floor(dayIndex / 7);
      const day = dayIndex % 7;

      // Normalize contribution count to color level (0-4)
      let level = 0;
      if (count > 0) {
        level = Math.min(4, Math.ceil((count / maxContributions) * 4));
      }

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", week * (cellSize + cellGap));
      rect.setAttribute("y", day * (cellSize + cellGap));
      rect.setAttribute("width", cellSize);
      rect.setAttribute("height", cellSize);
      rect.setAttribute("fill", colors[level]);
      rect.setAttribute("rx", 2);
      rect.setAttribute("class", "contribution-cell");

      // Add tooltip
      rect.innerHTML = `<title>${count} contributions on ${date}</title>`;

      svg.appendChild(rect);
      dayIndex++;
    }

    // Add snake functionality
    this.addSnakeToHeatmap(svg);

    return svg;
  }

  /**
   * Add snake animation to heatmap
   */
  addSnakeToHeatmap(svg) {
    console.log('Adding snake to heatmap, SVG:', svg);
    const cells = svg.querySelectorAll('.contribution-cell');
    console.log('Found cells:', cells.length);
    
    if (cells.length === 0) {
      console.log('No cells found, exiting');
      return;
    }

    // Convert cells to array and sort by position (left to right, top to bottom)
    const cellArray = Array.from(cells).map(cell => {
      const cellData = {
        element: cell,
        x: parseInt(cell.getAttribute('x')),
        y: parseInt(cell.getAttribute('y')),
        width: parseInt(cell.getAttribute('width')),
        height: parseInt(cell.getAttribute('height')),
        originalFill: cell.getAttribute('fill'),
        isGreen: cell.getAttribute('fill') !== '#ebedf0' && cell.getAttribute('fill') !== '#161b22'
      };
      console.log('Cell data:', cellData);
      return cellData;
    });
    
    // Sort cells by position: left to right, then top to bottom  
    cellArray.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
    
    // Add snake elements directly to the SVG
    console.log('Adding snake elements directly to SVG');
    
    let currentIndex = 0;
    let snakeLength = 3;
    let snake = []; // Array of cell indices in cellArray
    let snakeElements = []; // Array of SVG elements for snake
    
    const moveSnake = () => {
      console.log('moveSnake called, currentIndex:', currentIndex);
      
      // Clear previous snake elements from SVG
      snakeElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      snakeElements = [];
      
      // Add new head position
      if (currentIndex < cellArray.length) {
        snake.unshift(currentIndex);
        
        // Check if snake ate a green box
        if (cellArray[currentIndex] && cellArray[currentIndex].isGreen) {
          snakeLength++;
          console.log(`Snake ate green box! Length: ${snakeLength}`);
        }
        
        // Keep snake at proper length
        while (snake.length > snakeLength) {
          snake.pop();
        }
        
        currentIndex++;
      } else {
        // Reset to beginning
        currentIndex = 0;
        snake = [];
        snakeLength = 3;
        console.log('Snake reset to beginning');
        return;
      }
      
      // Draw snake elements directly into the SVG (on top of existing cells)
      snake.forEach((cellIndex, segmentIndex) => {
        const cell = cellArray[cellIndex];
        if (cell && cell.element) {
          console.log('Drawing snake segment', segmentIndex, 'at cell', cellIndex);
          
          // Create new SVG rect for snake segment
          const snakeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          
          if (segmentIndex === 0) {
            // Head - bright green with larger size
            snakeRect.setAttribute("fill", "#00ff00");
            snakeRect.setAttribute("stroke", "#ffffff");
            snakeRect.setAttribute("stroke-width", "3");
            const size = cell.width * 1.5;
            const offset = (size - cell.width) / 2;
            snakeRect.setAttribute("x", cell.x - offset);
            snakeRect.setAttribute("y", cell.y - offset);
            snakeRect.setAttribute("width", size);
            snakeRect.setAttribute("height", size);
            snakeRect.setAttribute("rx", "3");
          } else {
            // Body - dark green with medium size
            snakeRect.setAttribute("fill", "#228B22");
            snakeRect.setAttribute("stroke", "#ffffff");
            snakeRect.setAttribute("stroke-width", "2");
            const size = cell.width * 1.3;
            const offset = (size - cell.width) / 2;
            snakeRect.setAttribute("x", cell.x - offset);
            snakeRect.setAttribute("y", cell.y - offset);
            snakeRect.setAttribute("width", size);
            snakeRect.setAttribute("height", size);
            snakeRect.setAttribute("rx", "2");
          }
          
          // Add to SVG (will appear on top since it's added last)
          svg.appendChild(snakeRect);
          snakeElements.push(snakeRect);
        }
      });
    };

    console.log(`Snake initialized! Moving through ${cellArray.length} cells.`);
    console.log('Starting snake animation...');
    
    // Test the snake immediately
    moveSnake();
    
    setInterval(moveSnake, 500);
  }

  /**
   * Setup expand/collapse all functionality
   */
  setupExpandCollapse() {
    const expandBtn = $("#expandAll");
    const collapseBtn = $("#collapseAll");

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        this.expandAllSections();
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        this.collapseAllSections();
      });
    }
  }

  /**
   * Expand all sections
   */
  expandAllSections() {
    // Main navigation sections
    $$(".toc-book").forEach((book) => {
      book.setAttribute("open", "");
      const button = book.querySelector(".toc-book-title, .index-dropdown");
      if (button) button.setAttribute("aria-expanded", "true");
    });

    // Any other collapsible sections
    $$("details").forEach((details) => {
      details.open = true;
    });

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent("sectionsExpanded"));
  }

  /**
   * Collapse all sections
   */
  collapseAllSections() {
    // Main navigation sections
    $$(".toc-book").forEach((book) => {
      book.removeAttribute("open");
      const button = book.querySelector(".toc-book-title, .index-dropdown");
      if (button) button.setAttribute("aria-expanded", "false");
    });

    // Any other collapsible sections
    $$("details").forEach((details) => {
      details.open = false;
    });

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent("sectionsCollapsed"));
  }

  /**
   * Refresh all dynamic content
   */
  async refresh() {
    try {
      await Promise.all([
        this.loadContributors(true),
        this.loadGitHubHeatmap(),
      ]);
      console.log("Content refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh content:", error);
    }
  }
}

// Create and initialize the application
const app = new MLMetaApp();

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init());
} else {
  app.init();
}

// Expose app instance for debugging and external access
window.MLMetaApp = app;

// Export for module systems
export default app;
