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

    const isCurrent = location.pathname.endsWith(ch.href);
    btn.onclick = () => toggleDropdown(listId, btn, isCurrent ? null : ch);

    /* inner container for headings */
    const inner = document.createElement("div");
    inner.className = "toc-chapters dropdown-content";
    inner.id = listId;

    /* If this is the current page, mark active & inject headings */
    if (isCurrent) {
      btn.classList.add("active");
      btn.setAttribute("aria-expanded", "true");
      injectHeadings(inner);
    } else {
      inner.hidden = true; // collapsed by default
    }

    /* assemble */
    bookDiv.appendChild(btn);
    bookDiv.appendChild(inner);
    booksWrap.appendChild(bookDiv);
  });
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

function injectRemoteHeadings(container, path) {
  container.dataset.loaded = "loading";
  container.innerHTML = "<div><em>Loading...</em></div>";

  fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const heads = [...doc.querySelectorAll(".content h2, .content h3")];

      container.innerHTML = ""; // clear loading
      heads.forEach((h) => {
        if (!h.id) h.id = slugify(h.textContent);
        const row = document.createElement("div");
        row.innerHTML = `<a href="${path}#${h.id}">${h.textContent}</a>`;
        container.appendChild(row);
      });
      if (heads.length === 0) {
        container.innerHTML = "<div><em>No headings found.</em></div>";
      }
      container.dataset.loaded = "true";
    })
    .catch((err) => {
      console.error(`Failed to fetch ${path}:`, err);
      container.innerHTML = "<div>Error loading headings.</div>";
      delete container.dataset.loaded; // allow retry
    });
}

function toggleDropdown(id, btn, chapter = null) {
  const box = document.getElementById(id);
  if (!box) return;

  const isCurrent = !chapter;
  if (!isCurrent && box.hidden && !box.dataset.loaded) {
    injectRemoteHeadings(box, chapter.href);
  }

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
