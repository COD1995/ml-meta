/* Landing‑page behaviour
   ------------------------------------------------------------ */

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

fetchContributors()
  .then(renderContributors)
  .catch((err) => {
    console.error(err);
    document.querySelector("#contributors").innerHTML =
      '<p class="error">Unable to load contributor list 😢</p>';
  });

// 2) Last‑updated stamp
document.getElementById("lastUpdated").textContent = new Date(
  document.lastModified
).toLocaleDateString(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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

document.getElementById("expandAll").addEventListener("click", expandAllDropdowns);
document.getElementById("collapseAll").addEventListener("click", collapseAllDropdowns);

// 4) GitHub Contributions Heatmap
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
