# package-intelligence

package-intelligence is a modern web app for analyzing React Native and Expo dependencies from a `package.json` file and surfacing actionable upgrade intelligence.

## What It Does

- Detects project type (`Expo`, `React Native`, or `Unknown`)
- Parses and analyzes dependencies and devDependencies
- Generates package health and risk insights
- Highlights migration opportunities and dependency recommendations
- Estimates bundle impact for APK and IPA
- Includes an Expo SDK upgrade check against the latest npm `expo` release
- Supports light/dark themes with a custom product UI system

## Key Behavior

- Results are shown only after you upload or paste a valid `package.json`
- No demo report is rendered by default
- Expo SDK latest version is fetched from npm; fallback baseline is SDK 56

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Base UI + CVA

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/adsalihac/package-intelligence.git
cd package-intelligence
npm install
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # run built app
npm run lint   # run ESLint
```

## Project Structure

```text
package-intelligence/
├─ public/
│  ├─ favicon.svg
│  ├─ package-intelligence-logo.svg
│  └─ package-intelligence-logo-dark.svg
├─ src/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ landing/
│  │  │  ├─ hero.tsx
│  │  │  ├─ feature-grid.tsx
│  │  │  ├─ package-analyzer.tsx
│  │  │  ├─ future-features.tsx
│  │  │  ├─ section-heading.tsx
│  │  │  └─ theme-toggle.tsx
│  │  └─ ui/
│  └─ lib/
├─ README.md
└─ LICENSE
```

## Contributing

1. Fork the repository
2. Create a feature branch from `main`
3. Make focused changes with clear commits
4. Run checks:

```bash
npm run lint
npm run build
```

5. Open a pull request with a clear summary

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
