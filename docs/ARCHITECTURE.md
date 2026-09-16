# SENTINEL Project Architecture

## Overview
This document lists every file that will exist in the **SENTINEL** React + TypeScript + Tailwind dashboard, its purpose, and the backend API endpoint(s) it interacts with. The structure follows the conventions laid out in the specification and is ready to be scaffolded.

---

## Root Files
| Path | Purpose | API Calls |
|------|---------|-----------|
| `package.json` | Project manifest, scripts, dependencies | — |
| `vite.config.ts` | Vite configuration (React, TS, env handling) | — |
| `tsconfig.json` | TypeScript compiler options (strict mode) | — |
| `tailwind.config.cjs` | Tailwind CSS custom theme (color palette for Normal/Background‑Interference/Genuine‑Leak) | — |
| `postcss.config.cjs` | PostCSS pipeline for Tailwind | — |
| `.speckit/speckit.config` | speckit integration config (`{"integration":"claude"}`) | — |
| `README.md` | Project overview & setup instructions | — |

---

## Source Directory (`src/`)
| Path | Purpose | API Calls |
|------|---------|-----------|
| `src/main.tsx` | Vite entry point, renders `<App />` into `#root` | — |
| `src/App.tsx` | Top‑level component containing the **Shell** and `<Outlet />` for routing | — |
| `src/components/Shell.tsx` | Header, navigation tabs, footer with disclaimer, connection‑status indicator | — |
| `src/components/LiveStatusPanel.tsx` | Live monitor screen (Screen 1). Shows latest reading, classification badge, sparkline, confidence bar, severity chip, timestamp, low‑confidence warning, loading/error UI. | `GET /api/readings/latest` |
| `src/components/AlertHistoryList.tsx` | Alert list screen (Screen 2). Displays alerts, filter bar, acknowledge actions, row click opens contributing factors. | `GET /api/alerts`, `POST /api/alerts/:id/acknowledge` |
| `src/components/ContributingFactors.tsx` | Slide‑in side panel (Screen 3). Shows selected alert’s label, confidence, severity, ordered factor strings. | (receives alert object, no direct API) |
| `src/views/CaregiverView.tsx` | Read‑only caregiver view (Screen 4). Renders `LiveStatusPanel` + `AlertHistoryList` without write actions. | Same as screens 1 & 2 (read‑only) |
| `src/views/AdminCalibrationView.tsx` | Calibration & admin UI (Screen 5). Table of last 20 readings with label selector, submit, retrain button. | `GET /api/readings/history`, `POST /api/calibration/label`, `POST /api/calibration/retrain` |
| `src/api/index.ts` | Typed fetch wrappers (`getLatestReading`, `getAlerts`, `acknowledgeAlert`, `labelReading`, `retrainModel`, etc.) | Various endpoints listed above |
| `src/types/index.ts` | TypeScript interfaces for `Reading`, `Classification`, `Alert`, union types, generic `ApiResponse<T>` | — |
| `src/hooks/usePolling.ts` | Generic polling hook used by `LiveStatusPanel` (2 s interval) | — (calls provided fetch functions) |
| `src/hooks/useReadingHistory.ts` | Maintains rolling buffer of last 20 raw values for sparkline | — (consumes polling data) |
| `src/index.css` | Global Tailwind imports and base styles (including disclaimer/footer styling) | — |

---

## Tests (future)
| Path | Purpose |
|------|---------|
| `src/__tests__/LiveStatusPanel.test.tsx` | Unit / integration test for live panel logic |
| `src/__tests__/AlertHistoryList.test.tsx` | Tests filters, acknowledge flow |
| `src/__tests__/AdminCalibrationView.test.tsx` | Tests label submission and retrain handling |

---

*All files above are non‑existent at this stage; they will be created in subsequent loops.*
