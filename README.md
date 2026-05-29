# package-intelligence

package-intelligence is a Next.js application for exploring package metadata and surfacing package insights with a clean, developer-focused UI.

## Features

- Landing page experience with modular sections for product messaging
- Reusable UI primitives for cards, inputs, tabs, tables, and buttons
- Component-driven structure for easy feature expansion
- TypeScript-based codebase for safer refactoring and maintenance
- Tailwind CSS styling for fast, consistent UI development

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd package-intelligence
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser.

## Project Structure

```text
native-lens/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ landing/
│  │  │  ├─ feature-grid.tsx
│  │  │  ├─ future-features.tsx
│  │  │  ├─ hero.tsx
│  │  │  ├─ package-analyzer.tsx
│  │  │  ├─ section-heading.tsx
│  │  │  └─ theme-toggle.tsx
│  │  └─ ui/
│  │     ├─ badge.tsx
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     ├─ input.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     └─ textarea.tsx
│  └─ lib/
│     └─ utils.ts
├─ README.md
└─ LICENSE
```

## Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Build

```bash
npm run build
```

## Production

```bash
npm run start
```

## Contribution

1. Create a feature branch from `main`.
2. Make your changes with clear, focused commits.
3. Run checks before opening a pull request:

```bash
npm run lint
npm run build
```

4. Open a pull request with a clear description of what changed and why.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
