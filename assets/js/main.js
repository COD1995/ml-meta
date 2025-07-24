
/* assets/js/main.js
 * -------------------------------------------------------------
 * ① Build ToC (current + lazy‑remote)
 * ② Handle sidebar collapse
 * ---------------------------------------------------------- */

const headingSelector = "main.content h2, main.content h3";

function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "-");
}
function ensureId(el) {
  if (!el.id) el.id = slugify(el.textContent);
  return el.id;
}

function buildList(doc, ul, prefix = "") {
  const frag = document.createDocumentFragment();
  doc.querySelectorAll(headingSelector).forEach((h) => {
    const li = document.createElement("li");
    li.className = h.tagName.toLowerCase();
    const a = document.createElement("a");
    a.href = `${prefix}#${ensureId(h)}`;
    a.textContent = h.textContent;
    li.append(a);
    frag.append(li);
  });
  ul.append(frag);
}

/* ToC for THIS page ---------------------------------------- */
document
  .querySelectorAll('ul.toc-list[data-src="self"]')
  .forEach((ul) => buildList(document, ul));

/* Lazy‑load ToCs for other chapters ------------------------- */
document
  .querySelectorAll('ul.toc-list[data-src]:not([data-src="self"])')
  .forEach((ul) => {
    const src = ul.dataset.src;
    const details = ul.closest("details");
    if (!details || !src) return;

    details.addEventListener(
      "toggle",
      async () => {
        if (!details.open || ul.childElementCount) return;
        try {
          const html = await (await fetch(src)).text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          buildList(doc, ul, src);
        } catch (e) {
          console.error("ToC fetch error", e);
          ul.innerHTML = "<li><em>Unable to load ToC</em></li>";
        }
      },
      { once: true }
    );
  });

/* Sidebar toggle ------------------------------------------- */
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  const body = document.body;
  const collapsed = body.classList.toggle("sidebar-collapsed");
  document
    .getElementById("sidebarToggle")
    .setAttribute("aria-expanded", (!collapsed).toString());
});

// Theme toggle logic (robust for all pages)
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(theme) {
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(theme);
  localStorage.setItem('theme', theme);
  if (themeToggle) {
    themeToggle.textContent = theme === 'theme-dark' ? '🌙' : '🌞';
  }
}

(function() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('theme-dark');
  } else {
    setTheme('theme-light');
  }
})();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = root.classList.contains('theme-dark');
    setTheme(isDark ? 'theme-light' : 'theme-dark');
  });
}

// Expand/collapse all logic (robust for all pages)
function setAllDetails(open) {
  document.querySelectorAll('.nav-section details').forEach(d => d.open = open);
}
const expandAllBtn = document.getElementById('expandAll');
const collapseAllBtn = document.getElementById('collapseAll');
if (expandAllBtn) {
  expandAllBtn.addEventListener('click', () => setAllDetails(true));
}
if (collapseAllBtn) {
  collapseAllBtn.addEventListener('click', () => setAllDetails(false));
}

// --- Book/Chapter Dropdown Functionality for Custom Buttons ---
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.toc-book-title').forEach(function(btn) {
    // Find the dropdown content (next sibling)
    var dropdown = btn.nextElementSibling;
    // Set initial aria-expanded
    btn.setAttribute('aria-expanded', dropdown && !dropdown.hidden ? 'true' : 'false');
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (!dropdown) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', (!expanded).toString());
      dropdown.hidden = expanded;
    });
  });
});
