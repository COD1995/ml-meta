/* assets/js/main.js
 * -------------------------------------------------------------
 * ① Build page & remote ToCs
 * ② Sidebar collapse + dark / light theme switcher
 * ③ Misc: expand‑all, dropdown helper, GitHub widgets …
 * ---------------------------------------------------------- */

/* ────────────────────────────────────────────────────────────
   Tiny utilities
   ---------------------------------------------------------- */
const headingSelector = "main.content h2, main.content h3";

const slugify = (str) =>
  str
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "-");

const ensureId = (el) => {
  if (!el.id) el.id = slugify(el.textContent);
  return el.id;
};

/* ────────────────────────────────────────────────────────────
   Build a <ul> list of headings for a document (self or remote)
   ---------------------------------------------------------- */
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

/* ───────── ToC for CURRENT page ───────── */
document
  .querySelectorAll('ul.toc-list[data-src="self"]')
  .forEach((ul) => buildList(document, ul));

/* ───────── Lazy‑load ToCs for OTHER chapters ───────── */
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

/* ────────────────────────────────────────────────────────────
   Sidebar collapse / expand (desktop & mobile)
   ---------------------------------------------------------- */
const sidebarToggleBtn = document.getElementById("sidebarToggle");
sidebarToggleBtn?.addEventListener("click", () => {
  const body = document.body;
  const collapsed = body.classList.toggle("sidebar-collapsed");
  sidebarToggleBtn.setAttribute("aria-expanded", (!collapsed).toString());
});

/* ─────────────  THEME SWITCHER – final  ───────────── */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const button = document.getElementById("themeToggle");
  const KEY = "pref-theme"; // storage key

  const apply = (mode) => {
    // remove both, then add the requested one
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${mode}`);

    // legacy body classes for old rules
    document.body.classList.toggle("dark-mode", mode === "dark");
    document.body.classList.toggle("light-mode", mode === "light");

    localStorage.setItem(KEY, mode);
    if (button) button.textContent = mode === "dark" ? "🌙" : "🌞";
  };

  /* 1 ⃣  initial state — stored pref ¦ system default */
  const stored = localStorage.getItem(KEY);
  if (stored === "dark" || stored === "light") {
    apply(stored);
  } else {
    apply(
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
  }

  /* 2 ⃣  switch on click */
  button?.addEventListener("click", () => {
    apply(root.classList.contains("theme-dark") ? "light" : "dark");
  });
});

/* ────────────────────────────────────────────────────────────
   Expand‑all / collapse‑all (index page only)
   ---------------------------------------------------------- */
function setAllDetails(open) {
  /* <details> elements */
  document
    .querySelectorAll(".nav-section details")
    .forEach((d) => (d.open = open));

  /* dropdowns built with custom helper */
  document
    .querySelectorAll(".dropdown-content")
    .forEach((c) => (c.hidden = !open));
  document
    .querySelectorAll(".index-dropdown, .toc-book-title, .dropdown-toggle")
    .forEach((btn) => btn.setAttribute("aria-expanded", open));
}

document
  .getElementById("expandAll")
  ?.addEventListener("click", () => setAllDetails(true));
document
  .getElementById("collapseAll")
  ?.addEventListener("click", () => setAllDetails(false));

/* ────────────────────────────────────────────────────────────
   Custom dropdown buttons (books / index page)
   ---------------------------------------------------------- */
function toggleDropdown(contentId, button) {
  const content = document.getElementById(contentId);
  if (!content) return;
  const isExpanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", (!isExpanded).toString());
  content.hidden = isExpanded;
}
window.toggleDropdown = toggleDropdown; // needed for inline onclick="…"

/* attach to any button that wasn't wired inline */
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".dropdown-toggle, .index-dropdown")
    .forEach((btn) => {
      const id = btn.getAttribute("aria-controls");
      if (id) btn.addEventListener("click", () => toggleDropdown(id, btn));
    });
});

/* ────────────────────────────────────────────────────────────
   Inject ‘index-content.html’ server‑side‑include when running
   locally (so dev build matches prod)
   ---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("nav").forEach((nav) => {
    if (!nav.innerHTML.includes('<!--#include file="index-content.html" -->'))
      return;
    fetch("index-content.html")
      .then((r) => r.text())
      .then((html) => {
        nav.innerHTML = nav.innerHTML.replace(
          /<!--#include file="index-content.html" -->/,
          html
        );
      })
      .catch(() => {
        nav.insertAdjacentHTML(
          "beforeend",
          '<p class="error">Unable to load navigation.</p>'
        );
      });
  });
});

/* ────────────────────────────────────────────────────────────
   Misc extras: last‑modified stamp, GitHub heat‑map, contributor
   leaderboard (runs only where matching elements exist)
   ---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* 1) “Last updated” */
  const last = document.getElementById("lastUpdated");
  if (last) {
    last.textContent = new Date(document.lastModified).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  /* 2) GitHub contribution heat‑map */
  if (document.getElementById("github-heatmap")) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href =
      "https://cdn.jsdelivr.net/npm/github-calendar@latest/dist/github-calendar-responsive.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/github-calendar@latest/dist/github-calendar.min.js";
    script.onload = () =>
      window.GitHubCalendar &&
      GitHubCalendar("#github-heatmap", "COD1995", { responsive: true });
    document.body.appendChild(script);
  }

  /* 3) GitHub contributor leaderboard */
  if (document.querySelector(".leaderboard-table tbody")) {
    const owner = "COD1995",
      repo = "ml-meta",
      key = "ghContribCache",
      ttl = 24 * 60 * 60 * 1000; // 24 h

    const fetchContributors = async () => {
      const cached = JSON.parse(localStorage.getItem(key) || "{}");
      if (cached.when && Date.now() - cached.when < ttl) return cached.data;
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contributors`
      );
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      localStorage.setItem(key, JSON.stringify({ when: Date.now(), data }));
      return data;
    };

    const renderContributors = (list) => {
      const tbody = document.querySelector(".leaderboard-table tbody");
      if (!tbody) return;
      const medals = ["🥇", "🥈", "🥉"];
      list
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 10)
        .forEach((u, i) => {
          const medal = medals[i]
            ? `<span class="medal">${medals[i]}</span>`
            : "";
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
    };

    fetchContributors()
      .then(renderContributors)
      .catch(() => {
        document
          .querySelector("#contributors")
          ?.insertAdjacentHTML(
            "beforeend",
            '<p class="error">Unable to load contributor list 😢</p>'
          );
      });
  }
});
