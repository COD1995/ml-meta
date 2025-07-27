// generate-bookData.js
// Run with: node generate-bookData.js
// This script scans the books and math-foundations folders and outputs bookData.json for navigation

const fs = require('fs');
const path = require('path');

const booksRoot = path.join(__dirname, '../books');
const mathRoot = path.join(__dirname, '../math-foundations');
const outputPath = path.join(__dirname, '../assets/js/bookData.json');

function getChapters(dir) {
  const chaptersDir = path.join(dir, 'chapters');
  if (!fs.existsSync(chaptersDir)) return [];
  return fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      title: f.replace(/^(\d+[-_])?/, '').replace(/\.html$/, '').replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      href: path.relative(path.join(__dirname, '..'), path.join(chaptersDir, f)).replace(/\\/g, '/')
    }));
}

// Math Foundations
const mathChapters = getChapters(mathRoot);

// Books
const books = [];
fs.readdirSync(booksRoot).forEach(bookFolder => {
  const bookPath = path.join(booksRoot, bookFolder);
  if (fs.statSync(bookPath).isDirectory()) {
    books.push({
      id: bookFolder,
      title: bookFolder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      chapters: getChapters(bookPath)
    });
  }
});

// Papers (static for now)
const papers = [
  { title: 'Computer Vision Papers', isHeader: true },
  { title: 'EXAMPLE: SegmentAnything Meets GPT (2024)', href: 'math-foundations/index.html', isBold: true }
];

const bookData = [
  {
    id: 'math-foundations',
    title: '🖇️ Mathematical Foundations',
    chapters: mathChapters
  },
  {
    id: 'books',
    title: '📚 Books',
    books: books
  },
  {
    id: 'papers',
    title: '📄 Papers',
    chapters: papers
  }
];

fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2));
console.log('bookData.json generated at', outputPath);
