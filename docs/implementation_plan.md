# SENTINEL Dashboard Implementation Plan

## Goal Description
Build a polished, professional web dashboard for the SENTINEL adaptive gas‑leak detection prototype using React (Vite), TypeScript, Tailwind CSS, and Recharts. The UI must meet the visual, accessibility, and functional requirements listed in the user's command, including role‑based views, real‑time polling, color‑coded status badges, and full‑screen disclaimer.

## User Review Required
> [!IMPORTANT]
> The plan creates a new Vite project inside the existing workspace at `/Users/tronix/Downloads/projects/SENTINEL`. This will add many new files (package.json, vite.config.ts, Tailwind config, source files, etc.). Please confirm that this is acceptable and that no existing code in the repository will be overwritten.
>
> Additionally, the plan assumes you want the backend API base URL injected via the `VITE_API_BASE_URL` environment variable. Confirm that you will provide this variable at build/run time.
>
> The plan includes the creation of `PRODUCT.md` and `DESIGN.md` as requested. If you need different content or additional documentation, let us know.

## Open Questions
- **Authentication / Role Management:** Should the role (`resident`, `caregiver`, `admin`) be obtained from an authentication API, or passed as a prop/environment variable for this prototype?
- **Deployment Target:** Will the app be served statically (e.g., GitHub Pages) or run via a Node.js dev server? This affects the `base` path in Vite config.
- **Data Volume for Trend Sparkline:** The live status panel needs the last 20 readings. Should we keep them in component state, or request a separate endpoint? The spec only provides `/api/readings/latest`. We'll accumulate readings client‑side.
- **Styling Preference:** The visual density is set to 7, motion intensity 3, design variance 5. Do you have any color palette preferences beyond the mandatory green/amber/red? We will use a complementary neutral palette.
- **Testing Framework:** Do you want Jest/React Testing Library setup now, or can we defer testing?

## Proposed Changes
---
### Project Scaffold
#### [NEW] `package.json`
- Vite, React, TypeScript, Tailwind, Recharts, Axios, classnames, @heroicons/react (for icons), eslint, prettier.

#### [NEW] `vite.config.ts`
- Configure React Refresh, define `base` based on env.

#### [NEW] `tailwind.config.cjs`
- Enable JIT, set content paths, extend colors with custom `green`, `amber`, `red`.

#### [NEW] `postcss.config.cjs`
- Tailwind + autoprefixer.

#### [NEW] `src/main.tsx`
- Render `<App />` into `#root`.

#### [NEW] `src/App.tsx`
- Layout with header, footer disclaimer, and `<Router>` navigation.

#### [NEW] `src/routes/` (React Router v6)
- `LiveStatus.tsx`, `AlertHistory.tsx`, `CaregiverView.tsx`, `AdminCalibration.tsx` – each imports the corresponding component.

### Core UI Components (`src/components/`)
#### LiveStatusPanel.tsx
- Fetch latest reading every 2 s using `fetch`.
- Maintain an array of last 20 readings for sparkline.
- Display:
  - Large badge with label (color‑coded).
  - MQ2 raw value numeric.
  - Recharts `LineChart` sparkline.
  - Temperature & humidity readouts.
  - Confidence progress bar (`div` with animated width).
  - Severity chip (`span` with color).
  - Last‑updated timestamp.
- Accessibility: `aria-live` region for status changes, proper contrast, focus order.
- Animation: badge color transition (200 ms, ease-out) on label change.

#### AlertHistoryList.tsx
- Fetch `/api/alerts` on mount and on filter change.
- Filter controls (dropdowns for severity and status).
- Table/List rows with:
  - Timestamp, label chip (color), severity chip, status text, Acknowledge button (visible only for active alerts).
- `POST /api/alerts/:id/acknowledge` on click, optimistic UI update.
- Row entrance animation (staggered, 150 ms, ease-out).
- Accessibility: buttons have `aria-label`, table headers.

#### ContributingFactors.tsx
- Props: `selectedAlert` object.
- Display label, confidence, severity, ordered list of factor strings.
- Visual connector: a thin left border matching badge color.
- No animation on data that updates every 2 s; only slide‑in when a new alert is selected.

#### CaregiverView.tsx
- Wrapper component that renders `LiveStatusPanel` and `AlertHistoryList` in read‑only mode.
- Prop `role='caregiver'` hides acknowledge buttons and calibration UI.
- Top banner: "Read‑only caregiver view".

#### AdminCalibrationView.tsx
- Table of last 20 readings (same data as LiveStatus but read‑only columns plus selector).
- Each row: dropdown selector for label, Submit button per row (or batch submit).
- `POST /api/calibration/label` payload includes timestamp and chosen label.
- "Trigger Retrain" button at top calling `POST /api/calibration/retrain` (assumed endpoint; if not present, can be a placeholder).
- Accessibility: proper label associations for dropdowns.

### Shared Utilities (`src/utils/`)
- `api.ts` – wrapper around `fetch`/Axios handling base URL and JSON.
- `types.ts` – TypeScript interfaces for Reading, Alert, Role, etc.
- `hooks/usePolling.ts` – generic polling hook (interval, abort on unmount).

### Styling (`src/index.css`)
- Import Tailwind base, components, utilities.
- Define custom color tokens: `brand-green`, `brand-amber`, `brand-red`.
- Global focus outline style for WCAG AA.

### Disclaimer Banner (`src/components/DisclaimerBanner.tsx`)
- Fixed bottom bar with required disclaimer text, always visible.

### Navigation / App Shell (`src/components/NavBar.tsx`)
- Four nav items with icons, active state highlighting, smooth slide‑in/out transition (React Router `useLocation` + `CSSTransition`).
- Header with "SENTINEL" and subtitle.
- Responsive layout (mobile hamburger menu).

### Animation Helpers (`src/anim/`)
- CSS keyframes for badge color fade, progress bar fill, row slide.
- Use `framer-motion`? Not allowed (heavy). We'll implement with CSS transitions & Tailwind `transition-*` utilities.

### Documentation Files
- `PRODUCT.md` – high‑level description, audience, voice, anti‑reference guidelines.
- `DESIGN.md` – design system (color palette, typography – Google Font "Inter"), spacing, component specs, accessibility notes.

### Build / Run Scripts (`package.json`)
- `dev`: `vite`, `build`, `preview`.
- `lint`, `format` scripts.

### Testing (optional for now)
- Jest + React Testing Library config scaffolding.

## Verification Plan
- **Automated:** Run `npm run lint` and `npm run build` to ensure compile success.
- **Manual:** Start dev server, check each view renders, verify polling updates, confirm color coding, verify accessible contrast, test acknowledge flow, test role gating.
- **Visual:** Capture screenshots of each component (using generated_image tool if needed) for the final report.

---
**Next Steps**
1. Await user confirmation on the above plan and answers to open questions.
2. Once approved, we will scaffold the Vite project, add Tailwind, create the component files, and iterate with `/impeccable` audit/polish commands as requested.
