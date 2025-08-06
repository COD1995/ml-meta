# Annotated Algorithms & Machine Learning Textbook

This project is a web-based, interactive textbook that presents core concepts from computer science and machine learning. It features a unique side-by-side layout that displays original textbook passages alongside detailed, easy-to-understand explanations and annotations.

The platform is designed for a clean reading experience, with beautiful rendering of mathematical formulas and pseudocode, making it an ideal resource for students and self-learners.

---

## ✨ Key Features

- **Side-by-Side Explanations**: Presents original text in a distinct block next to a corresponding plain-language explanation, making complex topics easier to digest.
- **Dynamic Table of Contents**: Each chapter page automatically generates a table of contents in the sidebar based on its sections, allowing for quick navigation.
- **Professional Math & Code Rendering**: Utilizes **MathJax** for beautiful LaTeX mathematical notation and **pseudocode.js** for cleanly formatted algorithm blocks.
- **Interactive Navigation**: The main page features collapsible sections for different books, and the chapter view provides persistent navigation.
- **Integrated Comments**: Each chapter includes a comment section powered by **Utterances**, allowing readers to ask questions and discuss the material using their GitHub accounts.
- **Responsive Design**: The layout is fully responsive and optimized for reading on desktops, tablets, and mobile devices.

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3 (CSS Grid, Flexbox), Vanilla JavaScript
- **Mathematical Typesetting**: [MathJax](https://www.mathjax.org/)
- **Code Formatting**: [pseudocode.js](https://github.com/SaswatPadhi/pseudocode.js)
- **Comments Engine**: [Utterances](https://utteranc.es/)

---

## 🚀 Getting Started

To run a local copy of this project, you can use any simple local web server. No complex build steps are required.

1.  **Clone the repository:**

    ```sh
    git clone [https://github.com/COD1995/ml-meta.git](https://github.com/COD1995/ml-meta.git)
    ```

2.  **Navigate to the project directory:**

    ```sh
    cd ml-meta
    ```

3.  **Start a local web server.**
    If you have Python 3 installed, you can use its built-in server:

    ```sh
    python -m http.server
    ```

    Alternatively, you can use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code.

4.  **Open the project in your browser:**
    Navigate to `http://localhost:8000` (or the address provided by your server) to view the `index.html` home page.

---

## 📂 Project Structure

The project is organized with a straightforward file structure:

```
├── assets/
│   ├── css/
│   │   ├── base.css         # Global styles and resets
│   │   ├── books.css        # Styles for the main index page
│   │   ├── chapters.css     # Styles for the two-column chapter view
│   │   └── layout.css       # Styles for header, footer, and container
│   ├── js/
│   │   └── main.js          # Script for auto-generating the TOC
│   └── images/
│       └── ...              # Images used in chapters
├── books/
│   └── [book_name]/
│       ├── index.html       # Landing page for a specific book
│       └── chapters/
│           └── ...          # HTML files for each chapter
└── index.html               # The main landing page of the site

```

---

## How It Works

The project's interactivity is powered by a small set of client-side JavaScript files.

- `assets/js/main.js`: This script runs on every chapter page. It scans the main content for `<h2>` and `<h3>` tags, automatically generates anchor IDs for them, and populates the Table of Contents (`#toc-list`) in the sidebar with corresponding links.
- **Inline Scripts**: The HTML files contain small scripts to initialize and render **MathJax** and **pseudocode.js**, ensuring that mathematical formulas and algorithms are displayed correctly after the page content is loaded.

## Adding New Content Pages

To increase collaborative efforts, we have provided a index-page.js script that will automatically update just the home page's main navigation. This will be built out to update sitewide navigation information.

Once you place your completed HTML file into its correct folder, go to the main project folder and run this in your CLI's node.js environment: `node assets/js/index-page.js`

This will update your local index-content.html to now include your entry updated and styled correctly.
