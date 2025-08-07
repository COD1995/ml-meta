# ML-Meta: Interactive Machine Learning & Algorithms Textbook

A community-driven, web-based educational platform that presents complex computer science and machine learning concepts through an innovative side-by-side explanation format. This project bridges the gap between academic rigor and accessibility, making advanced topics understandable for students and self-learners.

[![GitHub contributors](https://img.shields.io/github/contributors/COD1995/ml-meta)](https://github.com/COD1995/ml-meta/graphs/contributors)
[![Join our Slack](https://img.shields.io/badge/slack-join%20community-brightgreen)](https://join.slack.com/t/mlmetacommunity/shared_invite/zt-38mj0hx5v-8GyxvZ7lanC9HbywfUOwJw)

---

## ✨ Key Features

### 📖 Innovative Learning Experience

- **Side-by-Side Explanations**: Original academic text displayed alongside plain-language explanations, making complex topics digestible
- **Enhanced Interactive Navigation**: Redesigned multi-level navigation with:
  - Collapsible sections with smooth animations
  - Auto-generated table of contents with proper hierarchy
  - Context-aware chapter highlighting
  - Improved arrow indicators and clean typography
- **Dynamic Content Organization**: Smart navigation that highlights current chapters and provides lazy-loaded TOCs for optimal performance

### 🎨 Professional Rendering

- **Mathematical Typesetting**: Beautiful LaTeX mathematical notation via [MathJax](https://www.mathjax.org/)
- **Algorithm Formatting**: Clean pseudocode blocks with line numbers using [pseudocode.js](https://github.com/SaswatPadhi/pseudocode.js)
- **Syntax Highlighting**: Code blocks with automatic language detection and line numbers via Highlight.js

### 🌐 Community & Collaboration

- **GitHub Integration**: Live contributor leaderboard and activity heatmap
- **Discussion System**: Chapter-specific comments powered by [Utterances](https://utteranc.es/) linked to GitHub issues
- **Slack Community**: Active community for discussions and collaboration
- **Dark/Light Mode**: Theme switching with persistent user preferences

### 📱 Responsive & Accessible

- **Mobile-Optimized**: Fully responsive layout that adapts to all screen sizes
- **Performance-First**: Lazy loading, caching, and modular CSS for optimal performance
- **Accessibility**: ARIA-compliant navigation with keyboard support

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3 (Grid, Flexbox, Custom Properties), Vanilla JavaScript
- **Mathematical Rendering**: [MathJax](https://www.mathjax.org/) for LaTeX expressions
- **Algorithm Display**: [pseudocode.js](https://github.com/SaswatPadhi/pseudocode.js) for formatted algorithms
- **Code Highlighting**: [Highlight.js](https://highlightjs.org/) for syntax highlighting
- **Comments**: [Utterances](https://utteranc.es/) for GitHub-based discussions
- **Build Tools**: Node.js scripts for automated content generation

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 14+** (required for build scripts and TOC generation)
- Any modern web browser
- (Optional) Python 3 for alternative dev server

### Quick Start

1. **Clone and setup:**

   ```bash
   git clone https://github.com/COD1995/ml-meta.git
   cd ml-meta
   npm install  # Install dependencies (if any)
   ```

2. **Build and serve (recommended):**

   ```bash
   npm run serve
   ```

   This command will:
   - Generate all navigation data and TOC
   - Start development server on http://localhost:8000
   - Automatically open your browser

### Manual Setup

If you prefer step-by-step control:

1. **Generate TOC and navigation:**

   ```bash
   # Build everything
   npm run build

   # Or run individually:
   npm run build:data  # Generate book chapter lists
   npm run build:nav   # Generate main navigation structure
   ```

2. **Start development server:**

   ```bash
   # Using Python (default)
   npm run dev

   # OR using Node.js
   npm run dev:node
   ```

3. **Open browser:**
   Navigate to http://localhost:8000

---

## 📂 Project Structure

```
ml-meta/
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── base.css           # Global styles, CSS variables, theme definitions
│   │   ├── layout.css         # Header, footer, container layouts
│   │   ├── books.css          # Main index page book listings
│   │   ├── chapters.css       # Two-column chapter view styles
│   │   ├── book-page.css      # Individual book landing pages
│   │   └── leaderboard.css    # GitHub contributor leaderboard
│   ├── 📁 js/
│   │   ├── main.js            # Core functionality: theme, TOC generation
│   │   ├── build-main-nav.js  # Builds main navigation from data
│   │   ├── build-side-nav.js  # Builds chapter-specific navigation
│   │   ├── main-nav-data.js   # Navigation structure data (auto-generated)
│   │   ├── chapter-page.js    # Chapter rendering: MathJax, pseudocode.js
│   │   └── mathjax-config.js  # MathJax configuration
│   ├── 📁 images/
│   │   ├── algorithms/        # Images for algorithm book chapters
│   │   └── author_profiles/   # Contributor profile pictures
│   └── 📁 templates/
│       └── chapter_page_template.html  # Template for new chapters
├── 📁 books/
│   ├── 📁 algorithms/
│   │   └── chapters/
│   │       ├── book-data.js   # Auto-generated chapter list
│   │       ├── 00-prologue.html
│   │       ├── 01-algorithms-with-numbers.html
│   │       └── ...
│   └── 📁 pattern-classification/
│       └── chapters/
│           ├── book-data.js   # Auto-generated chapter list
│           └── ...
├── 📁 math-foundations/
│   ├── index.html
│   └── in-simple-terms/       # Simplified math explanations
├── 📁 papers/
│   ├── cv/                    # Computer vision papers
│   └── training-research/     # ML training research papers
├── 📁 scripts/
│   ├── generate-book-data.js  # Generates book-data.js files
│   └── generate-main-nav-data.js  # Generates navigation structure
├── index.html                 # Main landing page
├── package.json               # Build scripts configuration
└── README.md                  # This file
```

---

## 🔧 How It Works

### Navigation System

The project uses a sophisticated multi-level navigation system:

1. **Main Navigation** (`build-main-nav.js`): Dynamically generates the site-wide navigation from `main-nav-data.js`
2. **Chapter Navigation** (`build-side-nav.js`): Creates context-aware chapter listings with current chapter highlighting
3. **Table of Contents** (`main.js`): Auto-generates TOCs from H2/H3 headings with lazy loading for remote chapters

### Content Rendering Pipeline

1. **HTML Structure**: Each chapter uses semantic HTML with `.explanation-block` containers
2. **Mathematical Content**: MathJax processes LaTeX expressions (configured in `mathjax-config.js`)
3. **Algorithm Blocks**: pseudocode.js formats algorithm notation with line numbers
4. **Syntax Highlighting**: Highlight.js provides language-specific code highlighting
5. **Comments Integration**: Utterances creates GitHub issue-based discussions per chapter

### Build Process

The project includes Node.js scripts for automated content generation:

```bash
# Generate chapter lists for all books
npm run build:data

# Generate main navigation structure
npm run build:nav
```

These scripts:
- Scan directories for HTML content files
- Extract titles and create sorted chapter lists
- Generate JavaScript data files for browser consumption
- Maintain hierarchical navigation structure

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run serve` | **Recommended**: Build everything and start server |
| `npm run build` | Generate all navigation data and TOC |
| `npm run build:data` | Generate book chapter data only |
| `npm run build:nav` | Generate main navigation structure only |
| `npm run dev` | Start Python development server |
| `npm run dev:node` | Start Node.js development server |
| `npm run clean` | Clean temporary files |
| `npm run backup` | Backup original CSS/JS files |
| `npm run restore` | Restore from backup |

---

## 📝 Adding New Content

### Adding a New Chapter

1. **Create the HTML file** in the appropriate book's `chapters/` directory:
   ```html
   <!-- Use assets/templates/chapter_page_template.html as starting point -->
   ```

2. **Follow the naming convention**: `XX-chapter-name.html` (e.g., `03-dynamic-programming.html`)

3. **Structure your content** with explanation blocks:
   ```html
   <div class="explanation-block">
     <div class="original-text-container">
       <!-- Original academic text -->
     </div>
     <div class="explanation-text">
       <!-- Plain-language explanation -->
     </div>
   </div>
   ```

4. **Regenerate navigation data**:
   ```bash
   npm run build:data
   npm run build:nav
   ```

### Adding a New Book

1. Create a new directory under `/books/your-book-name/`
2. Add a `chapters/` subdirectory
3. Place chapter HTML files in the `chapters/` directory
4. Run the build scripts to update navigation

### Adding Math Foundations or Papers

1. Place HTML files in the appropriate directory (`/math-foundations/` or `/papers/`)
2. Run `npm run build:nav` to update the main navigation

---

## 🔧 Troubleshooting

### TOC Not Showing/Updating

If the table of contents isn't appearing or showing outdated information:

```bash
# Regenerate navigation data
npm run build

# Clear browser cache and refresh
# Or try incognito/private mode
```

### Server Won't Start

- **Python not found**: Install Python 3 or use `npm run dev:node`
- **Port 8000 busy**: Kill existing processes or change port
- **Permission issues**: Check file permissions in project directory

### Navigation Not Working

- Ensure build scripts have run: `npm run build`
- Check browser console for JavaScript errors
- Verify HTML structure matches expected format

### Content Not Loading

- Check that HTML files are in correct directory structure
- Verify file naming follows `XX-chapter-name.html` pattern
- Ensure build scripts completed successfully

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing a typo, adding explanations, or contributing entire chapters, your help is appreciated.

### Ways to Contribute

- **Content Creation**: Add new chapters, books, or explanations
- **Code Improvements**: Enhance JavaScript functionality or CSS styling
- **Bug Fixes**: Report and fix issues
- **Documentation**: Improve README, add code comments, or create guides
- **Community Support**: Help others in our Slack channel

### Contribution Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run build scripts if you've added new content
5. Commit your changes with a descriptive message
6. Push to your fork
7. Open a Pull Request

### Resources

- 📄 [Contribution Guide](https://www.notion.so/Meta-ML-Contribution-Guide-July-2025-23543ced6be680b88eabd9fbfba64ff4)
- 💬 [Join our Slack Community](https://join.slack.com/t/mlmetacommunity/shared_invite/zt-38mj0hx5v-8GyxvZ7lanC9HbywfUOwJw)
- 🐛 [Report Issues](https://github.com/COD1995/ml-meta/issues)

---

## 👥 Main Contributors

- **Jue (Bob) Guo** - Lead Author, Ph.D. candidate at University at Buffalo
- **Kristopher Kodweis** - Lead Author, M.S. candidate in Mechanical Engineering

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- MathJax team for mathematical typesetting
- pseudocode.js developers for algorithm formatting
- Utterances for the commenting system
- All our contributors and community members

---

<p align="center">
  Made with ❤️ by the ML-Meta Community
</p>
