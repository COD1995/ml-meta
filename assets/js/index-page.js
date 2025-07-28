/* Landing‑page behaviour
   ------------------------------------------------------------ */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../');
const booksRoot = path.resolve(projectRoot, 'books');
const mathRoot = path.resolve(projectRoot, 'math-foundations');
const papersRoot = path.resolve(projectRoot, 'papers');

function getMainContentLinks() {
  const contentDirs = [
    { id: 'math-foundations', path: mathRoot },
    { id: 'books', path: booksRoot },
    { id: 'papers', path: papersRoot }
  ];
  return contentDirs
    .filter(dir => fs.existsSync(dir.path))
    .map(dir => {
      // List subdirectories (1st level only)
      let subdirs = [];
      let chapters = [];
      try {
        if (dir.id === 'books' || dir.id === 'math-foundations' || dir.id === 'papers') {
          subdirs = fs.readdirSync(dir.path)
            .filter(f => fs.statSync(path.join(dir.path, f)).isDirectory())
            .map(sub => {
              const subPath = path.join(dir.path, sub);
              const chaptersPath = path.join(subPath, 'chapters');
              const hasChaptersDir = fs.existsSync(chaptersPath) && fs.statSync(chaptersPath).isDirectory();
              
              return {
                name: sub,
                href: path.relative(path.join(__dirname, '..'), subPath).replace(/\\/g, '/'),
                chapters: getChapters(hasChaptersDir ? chaptersPath : subPath)
              };
            });
        } else {
          // For other sections, look for chapters directly or in a 'chapters' subdir
          const chaptersDir = path.join(dir.path, 'chapters');
          if (fs.existsSync(chaptersDir) && fs.statSync(chaptersDir).isDirectory()) {
            chapters = getChapters(chaptersDir);
          } else {
            chapters = getChapters(dir.path);
          }
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
 * Lists .html files in a directory as chapters.
 * Returns: [{ href, title }]
 */
function getChapters(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .map(f => {
      const title = f.replace(/[-_]/g, ' ').replace(/\.html$/, '').replace(/\b\w/g, c => c.toUpperCase());
      return {
        href: path.relative(path.join(__dirname, '..'), path.join(dirPath, f)).replace(/\\/g, '/'),
        title: title
      };
    });
}

/**
 * Generates HTML for main content sections, including subdirs and chapter links.
 */
function generateMainContentHTML() {
  const contentLinks = getMainContentLinks();
  let html = '';
  
  html += `<div class="toc-books">\n`;

  contentLinks.forEach(section => {
    const sectionTitle = section.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    html += ` <div class="toc-book dropdown">\n`;
    html += `   <button class="toc-book-title index-dropdown" aria-expanded="true" aria-controls="${section.id}-chapters" onclick="toggleDropdown('${section.id}-chapters', this)">${sectionTitle}</button>\n`;
    html += `   <div class="toc-chapters dropdown-content hidden" id="${section.id}-chapters">\n`;

    // Chapters directly under section
    if (section.chapters && section.chapters.length > 0) {
      section.chapters.forEach(ch => {
        html += `       <div><a href="${ch.href}">${ch.title}</a></div>\n`;
      });
    }

    // Subdirectories
    if (section.subdirs && section.subdirs.length > 0) {
      section.subdirs.forEach(sub => {
        const subTitle = sub.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `     <div class="toc-book dropdown">\n`;
        html += `       <button class="toc-book-title dropdown-toggle" aria-expanded="true" aria-controls="${section.id}-${sub.name}-chapters" onclick="toggleDropdown('${section.id}-${sub.name}-chapters', this)">${subTitle}</button>\n`;
        html += `       <div class="toc-chapters dropdown-content hidden" id="${section.id}-${sub.name}-chapters">\n`;

        if (sub.chapters && sub.chapters.length > 0) {
          sub.chapters.forEach(ch => {
            html += `         <div><a href="${ch.href}">${ch.title}</a></div>\n`;
          });
        }
        html += `       </div>\n`;
        html += `     </div>\n`;
      });
    }

    html += `   </div>\n`;
    html += `   <hr class="main-nav-divider">\n`;
    html += ` </div>\n`;
  });

  html += `</div>\n`;
  return html;
}

// --- AUTOMATION: Write generated HTML to index-content.html when run as a script ---
if (require.main === module) {
  const outputPath = path.join(__dirname, '../../index-content.html');
  const mainContentHTML = generateMainContentHTML();
  fs.writeFileSync(outputPath, mainContentHTML);
  console.log('index-content.html generated at', outputPath);
}
