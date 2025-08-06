const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

function getChapters(dirPath, relativeTo) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".html") && f !== "index.html")
    .map((f) => {
      const title = f
        .replace(/[-_]/g, " ")
        .replace(/\.html$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        href: path
          .relative(relativeTo, path.join(dirPath, f))
          .replace(/\\/g, "/"),
        title: title,
      };
    });
}

function getMainContentLinks() {
  console.log("Starting to generate main content links...");
  const contentDirs = [
    {
      id: "math-foundations",
      path: path.resolve(projectRoot, "math-foundations"),
      title: "📐 Math Foundations",
    },
    {
      id: "books",
      path: path.resolve(projectRoot, "books"),
      title: "📚 Books",
    },
    {
      id: "papers",
      path: path.resolve(projectRoot, "papers"),
      title: "📄 Papers",
    },
  ];

  return contentDirs
    .map((dir) => {
      console.log(`\nProcessing directory: ${dir.title} at ${dir.path}`);
      if (!fs.existsSync(dir.path)) {
        console.log(`Directory not found, skipping.`);
        return null;
      }

      const subdirs = fs
        .readdirSync(dir.path)
        .map((sub) => path.join(dir.path, sub))
        .filter((subPath) => {
          const isDir = fs.statSync(subPath).isDirectory();
          console.log(
            `  - Checking sub-path: ${subPath} (is directory: ${isDir})`
          );
          return isDir;
        })
        .map((subPath) => {
          const subName = path.basename(subPath);
          console.log(`    - Processing sub-directory: ${subName}`);
          const chaptersPath = path.join(subPath, "chapters");
          const hasChaptersDir =
            fs.existsSync(chaptersPath) &&
            fs.statSync(chaptersPath).isDirectory();

          const contentPath = hasChaptersDir ? chaptersPath : subPath;
          console.log(`      - Looking for chapters in: ${contentPath}`);
          const chapters = getChapters(contentPath, projectRoot);
          console.log(`      - Found ${chapters.length} chapters.`);

          return {
            name: subName
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            id: subName,
            chapters: chapters,
          };
        })
        .filter((s) => {
          const hasChapters = s.chapters.length > 0;
          console.log(
            `    - Filtering subdir ${s.name}. Has chapters: ${hasChapters}`
          );
          return hasChapters;
        });

      console.log(`Found ${subdirs.length} subdirectories with content.`);

      const directChapters = getChapters(dir.path, projectRoot);
      console.log(
        `Found ${directChapters.length} direct chapters in ${dir.title}.`
      );

      const section = {
        id: dir.id,
        title: dir.title,
        subdirs: subdirs,
        chapters: directChapters,
      };

      if (section.subdirs.length > 0 || section.chapters.length > 0) {
        console.log(`Section ${section.title} has content, keeping it.`);
        return section;
      }
      console.log(`Section ${section.title} has NO content, filtering it out.`);
      return null;
    })
    .filter(Boolean);
}

const mainNavData = getMainContentLinks();
const outputContent = `window.MAIN_NAV_DATA = ${JSON.stringify(
  mainNavData,
  null,
  2
)};`;
const outputPath = path.join(
  __dirname,
  "..",
  "assets",
  "js",
  "main-nav-data.js"
);

fs.writeFileSync(outputPath, outputContent);
console.log("\nFinal generated data:", JSON.stringify(mainNavData, null, 2));
console.log("main-nav-data.js generated at", outputPath);
