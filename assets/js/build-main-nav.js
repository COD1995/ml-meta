document.addEventListener("DOMContentLoaded", () => {
  const navData = window.MAIN_NAV_DATA;
  if (!navData) return;

  const navContainer = document.getElementById("mainNav");
  if (!navContainer) return;

  const html = generateMainContentHTML(navData);
  navContainer.innerHTML = html;
});

function generateMainContentHTML(contentLinks) {
  let html = "";

  html += `<div class="toc-books">\n`;

  contentLinks.forEach((section) => {
    html += ` <div class="toc-book dropdown">\n`;
    html += `   <button class="toc-book-title index-dropdown" aria-expanded="true" aria-controls="${section.id}-chapters" onclick="toggleDropdown('${section.id}-chapters', this)" id="${section.title}">${section.title}</button>\n`;
    html += `   <div class="toc-chapters dropdown-content hidden" id="${section.id}-chapters">\n`;

    if (section.subdirs && section.subdirs.length > 0) {
      section.subdirs.forEach((sub) => {
        html += `     <div class="toc-book dropdown">\n`;
        html += `       <button class="toc-book-title dropdown-toggle" aria-expanded="true" aria-controls="${section.id}-${sub.id}-chapters" onclick="toggleDropdown('${section.id}-${sub.id}-chapters', this)">${sub.name}</button>\n`;
        html += `       <div class="toc-chapters dropdown-content hidden" id="${section.id}-${sub.id}-chapters">\n`;

        if (sub.chapters && sub.chapters.length > 0) {
          sub.chapters.forEach((ch) => {
            html += `         <div><a href="${ch.href}">${ch.title}</a></div>\n`;
          });
        }
        html += `       </div>\n`;
        html += `     </div>\n`;
      });
    }

    if (section.chapters && section.chapters.length > 0) {
      section.chapters.forEach((ch) => {
        html += `     <div><a href="${ch.href}">${ch.title}</a></div>\n`;
      });
    }

    html += `   </div>\n`;
    html += `   <hr class="main-nav-divider">\n`;
    html += ` </div>\n`;
  });

  html += `</div>\n`;
  return html;
}
