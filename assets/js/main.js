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
  // Handle <details> elements
  document.querySelectorAll('.nav-section details').forEach(d => d.open = open);

  // Handle dropdowns
  document.querySelectorAll('.dropdown-content').forEach(content => {
    content.hidden = !open;
  });
  document.querySelectorAll('.index-dropdown, .toc-book-title, .dropdown-toggle').forEach(button => {
    button.setAttribute('aria-expanded', open);
  });
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
function toggleDropdown(contentId, button) {
  const content = document.getElementById(contentId);
  if (!content) return;

  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !isExpanded);
  content.hidden = isExpanded;
}

if (typeof window !== 'undefined') {
  window.toggleDropdown = toggleDropdown;
}

// Inject index-content.html into <nav> for local development
document.addEventListener('DOMContentLoaded', function () {
  const navs = document.querySelectorAll('nav');
  navs.forEach(nav => {
    // Only inject if nav contains the SSI comment
    if (nav.innerHTML.includes('<!--#include file="index-content.html" -->')) {
      fetch('index-content.html')
        .then(res => res.text())
        .then(html => {
          // Replace the SSI comment with the loaded HTML
          nav.innerHTML = nav.innerHTML.replace(
            /<!--#include file="index-content.html" -->/,
            html
          );
        })
        .catch(err => {
          nav.innerHTML += '<p class="error">Unable to load navigation.</p>';
        });
    }
  });
});

/* Main client-side behaviour
   ------------------------------------------------------------ */

  // 2) Last‑updated stamp
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.getElementById("lastUpdated").textContent = new Date(
      document.lastModified
    ).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  
  // 3) GitHub Contributions Heatmap
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    (function(){
      // Load github-calendar CSS
      const calendarCss = document.createElement('link');
      calendarCss.rel = 'stylesheet';
      calendarCss.href = 'https://cdn.jsdelivr.net/npm/github-calendar@latest/dist/github-calendar-responsive.css';
      document.head.appendChild(calendarCss);
  
      // Load github-calendar JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/github-calendar@latest/dist/github-calendar.min.js';
      script.onload = function() {
        // Render the calendar for the repo owner (COD1995)
        if (window.GitHubCalendar) {
          GitHubCalendar("#github-heatmap", "COD1995", { responsive: true });
        }
      };
      document.body.appendChild(script);
    })();
  }
  
  // 4) GitHub contributors
  const owner = "COD1995",
    repo = "ml-meta";
  const key = "ghContribCache",
    ttl = 24 * 60 * 60 * 1e3; // 24 h
  
  async function fetchContributors() {
    const cached = JSON.parse(localStorage.getItem(key) || "{}");
    if (cached.when && Date.now() - cached.when < ttl) return cached.data;
  
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors`
    );
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    localStorage.setItem(key, JSON.stringify({ when: Date.now(), data }));
    return data;
  }
  
  /* Render Top‑10 with avatars + medals */
  function renderContributors(list) {
    const tbody = document.querySelector(".leaderboard-table tbody");
    if (!tbody) return;
  
    const medals = ["🥇", "🥈", "🥉"];
  
    list
      .sort((a, b) => b.contributions - a.contributions) // highest first
      .slice(0, 10) // top‑10 only
      .forEach((u, i) => {
        const medal = medals[i] ? `<span class="medal">${medals[i]}</span>` : "";
        tbody.insertAdjacentHTML(
          "beforeend",
          `<tr>
             <td class="number">${i + 1}</td>
             <td class="name">
               <div class="name-cell">
                 <img class="avatar" src="${u.avatar_url}&s=80" alt="${
            u.login
          } avatar">
                 ${u.login}
               </div>
             </td>
             <td class="points">${u.contributions}${medal}</td>
           </tr>`
        );
      });
  }
  
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    fetchContributors()
      .then(renderContributors)
      .catch((err) => {
        console.error(err);
        document.querySelector("#contributors").innerHTML =
          '<p class="error">Unable to load contributor list 😢</p>';
      });
  }