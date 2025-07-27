/**
 * Lists .html files in a directory as chapters.
 * Returns: [{ href, title }]
 */
function getChapters(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      href: path.relative(path.join(__dirname, '..'), path.join(dirPath, f)).replace(/\\/g, '/'),
      title: f.replace(/[-_]/g, ' ').replace(/\.html$/, '').replace(/\b\w/g, c => c.toUpperCase())
    }));
}
/* Landing‑page behaviour
   ------------------------------------------------------------ */



const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../');
const booksRoot = path.resolve(projectRoot, 'books');
const mathRoot = path.resolve(projectRoot, 'math-foundations');


// 1) GitHub contributors
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

// 3) Expand / Collapse all <details> blocks
// Expand/collapse for both <details> and dropdown sections
function expandAllDropdowns() {
  // Expand all <details>
  document.querySelectorAll("details").forEach((d) => (d.open = true));
  // Expand all dropdowns
  document.querySelectorAll('.toc-book').forEach(function(book) {
    book.setAttribute('open', '');
    var btn = book.querySelector('.index-dropdown, .toc-book-title');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    var chapters = book.querySelector('.toc-chapters');
    if (chapters) chapters.removeAttribute('hidden');
  });
}

function collapseAllDropdowns() {
  // Collapse all <details>
  document.querySelectorAll("details").forEach((d) => (d.open = false));
  // Collapse all dropdowns
  document.querySelectorAll('.toc-book').forEach(function(book) {
    book.removeAttribute('open');
    var btn = book.querySelector('.index-dropdown, .toc-book-title');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    var chapters = book.querySelector('.toc-chapters');
    if (chapters) chapters.setAttribute('hidden', '');
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.getElementById("expandAll").addEventListener("click", expandAllDropdowns);
  document.getElementById("collapseAll").addEventListener("click", collapseAllDropdowns);
}

// 4) GitHub Contributions Heatmap
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



function getMainContentLinks() {
  const contentDirs = [
    { id: 'books', path: booksRoot },
    { id: 'math-foundations', path: mathRoot },
    { id: 'papers', path: path.resolve(projectRoot, 'papers') }
  ];
  return contentDirs
    .filter(dir => fs.existsSync(dir.path))
    .map(dir => {
      // List subdirectories (1st level only)
      let subdirs = [];
      let chapters = [];
      try {
        subdirs = fs.readdirSync(dir.path)
          .filter(f => fs.statSync(path.join(dir.path, f)).isDirectory())
          .map(sub => ({
            name: sub,
            href: path.relative(path.join(__dirname, '..'), path.join(dir.path, sub)).replace(/\\/g, '/'),
            chapters: getChapters(path.join(dir.path, sub))
          }));
        // Prefer chapters from a 'chapters' subdirectory if it exists
        const chaptersDir = path.join(dir.path, 'chapters');
        if (fs.existsSync(chaptersDir) && fs.statSync(chaptersDir).isDirectory()) {
          chapters = getChapters(chaptersDir);
        } else {
          chapters = getChapters(dir.path);
        }
      } catch (e) {}
      return {
        id: dir.id,
        href: path.relative(path.join(__dirname, '..'), dir.path).replace(/\\/g, '/'),
        subdirs,
        chapters
      };
    });
}

/**
 * Generates HTML for main content sections, including subdirs and chapter links.
 */
function generateMainContentHTML() {
  const contentLinks = getMainContentLinks();
  let html = '';

  contentLinks.forEach(section => {
    html += `<section class="main-section">\n`;
    html += `  <h2>${section.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h2>\n`;
    html += `  <a href="${section.href}">Go to ${section.id}</a>\n`;

    // Chapters directly under section
    if (section.chapters && section.chapters.length > 0) {
      html += `  <ul>\n`;
      section.chapters.forEach(ch => {
        html += `    <li><a href="${ch.href}">${ch.title}</a></li>\n`;
      });
      html += `  </ul>\n`;
    }

  
    if (section.subdirs && section.subdirs.length > 0) {
      section.subdirs.forEach(sub => {
        html += `  <h3>${sub.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>\n`;
        html += `  <a href="${sub.href}">Go to ${sub.name}</a>\n`;
        if (sub.chapters && sub.chapters.length > 0) {
          html += `  <ul>\n`;
          sub.chapters.forEach(ch => {
            html += `    <li><a href="${ch.href}">${ch.title}</a></li>\n`;
          });
          html += `  </ul>\n`;
        }
      });
    }

    html += `</section>\n\n`;
  });

  return html;
}

// --- AUTOMATION: Write generated HTML to index-content.html when run as a script ---
if (require.main === module) {
  const outputPath = path.join(__dirname, '../../index-content.html');
  const mainContentHTML = generateMainContentHTML();
  fs.writeFileSync(outputPath, mainContentHTML);
  console.log('index-content.html generated at', outputPath);
}

console.log(JSON.stringify(getMainContentLinks(), null, 2));
console.log(JSON.stringify(getMainContentLinks(), null, 2));
