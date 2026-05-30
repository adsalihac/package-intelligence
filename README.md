# Package Intelligence

**Package Intelligence** is a modern web app for analyzing React Native and Expo dependencies from a `package.json` file, surfacing actionable upgrade intelligence, and providing deep insights into your project's health, risk, and migration opportunities.

# [![Package Intelligence - React Native & Expo Dependency Insights | Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1159438&theme=light)](https://www.producthunt.com/products/package-intelligence?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-package-intelligence)

---

## ✨ Features

- **Expo/React Native Project Detection**
	- Detects if your project uses Expo, React Native CLI, or is unknown.
- **Dependency Analysis**
	- Parses all dependencies and devDependencies from your `package.json`.
	- Shows resolved versions from `package-lock.json` (npm v7+).
- **Health & Risk Scoring**
	- Grades each package for health, maintenance, and risk (archived, deprecated, outdated, needs review).
- **Expo Migration Mapping**
	- Maps common React Native packages to Expo-native alternatives and highlights migration opportunities.
- **Upgrade Manager**
	- Checks your Expo SDK version against the latest release (live from npm).
	- Provides step-by-step upgrade guidance for Expo and React Native projects.
- **Bundle Impact Estimation**
	- Estimates APK/IPA impact and highlights heavy packages.
	- Visual heatmap of npm install sizes (live data).
- **Platform Compatibility Matrix**
	- Shows which packages support iOS, Android, Web, tvOS, visionOS, Windows, and Expo Go.
- **Download & Popularity Rankings**
	- Ranks packages by npm downloads and GitHub stars (live data).
- **Duplicate Detection**
	- Flags duplicate/overlapping packages by functionality group.
- **Risk Detection**
	- Surfaces all risky, deprecated, or archived dependencies.
- **Side-by-Side Comparison**
	- Compare up to 2 packages in detail (health, size, downloads, status, etc.).
- **Export & Share**
	- Export a full Markdown report or share a link to your analysis.
- **Modern UI/UX**
	- Responsive, glassy, theme-aware UI with sticky header/footer and keyboard accessibility.
	- Light/dark mode with theme-aware logo.

---

## 🚀 Getting Started

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
Open [http://localhost:3000](http://localhost:3000).

---

## 🗂️ Project Structure

```
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

---

## 🧩 UI/UX Highlights
- Sticky glass header and footer
- Theme toggle (light/dark, with logo swap)
- Modular, card-based layout
- Keyboard and screen reader accessible
- Responsive for desktop and mobile

---

## 🛠️ Scripts
```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # run built app
npm run lint   # run ESLint
```

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch from `main`
3. Make focused changes with clear commits
4. Run checks:
	 ```bash
	 npm run lint
	 npm run build
	 ```
5. Open a pull request with a clear summary

---

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE).
