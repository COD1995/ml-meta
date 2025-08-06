/* ------------------------------------------------------------------
   build-side-nav.js  (ES module)
   Builds the sidebar using the SAME markup & classes you already style:
   .toc-books  >  .toc-book  >  button.toc-book-title  +  .toc-chapters
   ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const data = window.BOOK_DATA; // injected by book-data.js
  if (!data || !data.chapters) return;

  const navRoot = document.getElementById("bookNav");
  if (!navRoot) return;

  /* ── Book label ──────────────────────────────────────────────── */
  const label = document.createElement("span");
  label.className = "toc-label";
  label.textContent = `📚 ${data.title}`;
  navRoot.appendChild(label);

  /* container that matches your CSS expectations */
  const booksWrap = document.createElement("div");
  booksWrap.className = "toc-books";
  navRoot.appendChild(booksWrap);

  /* ── One .toc-book per chapter ───────────────────────────────── */
  data.chapters.forEach((ch) => {
    const slug = fileNoExt(ch.href); // e.g. 04-paths-in-graphs
    const bookDiv = document.createElement("div");
    bookDiv.className = "toc-book dropdown";

    /* button (chapter title) */
    const btn = document.createElement("button");
    btn.className = "toc-book-title dropdown-toggle";
    btn.textContent = ch.title;
    btn.setAttribute("aria-expanded", "false");
    const listId = `${slug}-chapters`;
    btn.setAttribute("aria-controls", listId);
    btn.onclick = () => toggleDropdown(listId, btn);

    /* inner container for headings */
    const inner = document.createElement("div");
    inner.className = "toc-chapters dropdown-content";
    inner.id = listId;

    /* If this is the current page, mark active & inject headings */
    const isCurrent = location.pathname.endsWith(ch.href);
    if (isCurrent) {
      btn.classList.add("active");
      btn.setAttribute("aria-expanded", "true");
      injectHeadings(inner);
    } else {
      inner.hidden = true; // collapsed by default
    }

    /* Add link to open the chapter when button text clicked */
    btn.addEventListener("click", (e) => {
      // stop double navigation if dropdown only toggled
      if (e.target.tagName.toLowerCase() === "button" && !isCurrent) {
        window.location.href = ch.href;
      }
    });

    /* assemble */
    bookDiv.appendChild(btn);
    bookDiv.appendChild(inner);
    booksWrap.appendChild(bookDiv);
  });

  /* ── Theme toggle (unchanged) ───────────────────────────────── */
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.documentElement.classList.toggle("theme-dark");
      document.documentElement.classList.toggle("theme-light");
    });
  }
});

/* ────────────────────────── helpers ──────────────────────────── */
function injectHeadings(container) {
  /* Collect H2 & H3 headings from the article */
  const heads = [...document.querySelectorAll(".content h2, .content h3")];
  heads.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const row = document.createElement("div");
    row.innerHTML = `<a href="#${h.id}">${h.textContent}</a>`;
    container.appendChild(row);
  });
}

function toggleDropdown(id, btn) {
  const box = document.getElementById(id);
  if (!box) return;
  const isOpen = !box.hidden;
  box.hidden = isOpen;
  btn.setAttribute("aria-expanded", (!isOpen).toString());
}

function fileNoExt(p) {
  return p
    .replace(/\.html$/i, "")
    .split("/")
    .pop();
}
function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}
