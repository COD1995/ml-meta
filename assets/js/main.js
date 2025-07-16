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

// Theme toggle logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

function setTheme(theme) {
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add(`theme-${theme}`);
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme() {
  return localStorage.getItem('theme');
}

function saveTheme(theme) {
  localStorage.setItem('theme', theme);
}

function applyPreferredTheme() {
  const saved = getSavedTheme();
  if (saved === 'light' || saved === 'dark') {
    setTheme(saved);
  } else {
    setTheme(getSystemTheme());
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = html.classList.contains('theme-dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
  });
}

applyPreferredTheme();
