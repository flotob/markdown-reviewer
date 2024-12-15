# Legal Document Viewer

A professional markdown viewer designed specifically for legal documents. Features a beautiful, law-firm inspired design with proper typography and spacing for optimal readability.

## Features

- Professional legal document styling
- Real-time markdown rendering
- File browser for easy document navigation
- Responsive design
- Support for tables, code blocks, and other markdown extensions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a PostCSS config file:
```bash
echo "module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }" > postcss.config.js
```

3. Start the development server:
```bash
npm run dev
```

This will start both the React development server (port 3000) and the Express backend (port 3001).

## Usage

1. Place your markdown files in the `working-docs` directory
2. Open your browser to `http://localhost:3000`
3. Use the sidebar to navigate between documents
4. Documents are rendered in real-time with professional styling

## Design

The viewer uses a professional legal theme with:
- Crimson Pro for headings (a professional serif font)
- Inter for body text (a clean sans-serif font)
- Professional color scheme inspired by law firm websites
- Proper spacing and typography for legal documents
- Clean, distraction-free reading experience

## Development

- Frontend: React with TypeScript
- Styling: Tailwind CSS with Typography plugin
- Backend: Express.js
- Markdown: react-markdown with remark-gfm

## Building for Production

```bash
npm run build
```

This will create a production build in the `build` directory. 