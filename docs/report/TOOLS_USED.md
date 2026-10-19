# Software Development Tools & Demonstration Evidence
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/TOOLS_USED.md`  
**Version**: 1.0.0 (Final Submission)  
**Submitted by**: Shreedhar Sharma (Reg. No.: 24BPS1149)  
**Programme**: B.Tech — Computer Science and Engineering  
**Institution**: Vellore Institute of Technology (VIT)  
**Faculty Supervisor**: Dr Elakiya R  

---

## 1. Summary of Software Engineering Tools

The development, verification, and deployment of SENTINEL utilized a robust suite of industry-standard software engineering tools across each phase of the Software Development Life Cycle (SDLC):

| Tool Name | Version | Category / Purpose | SDLC Phase | Actual Project Usage | Evidence / Artifact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Git & GitHub** | v2.39+ / Cloud | Version Control & CI/CD | All Phases (1–7) | Distributed source control, branching, atomic commits, automated GitHub Actions CI | `.github/workflows/ci.yml`, Commit history |
| **Node.js & npm** | v20.20.0 / v10.8.2 | Runtime & Test Engine | Implementation & Verification | Backend Express bridge, serial watchdog daemon, and native `node:test` execution | `package.json`, `tests/*.test.js` |
| **Vite & TypeScript** | Vite 8.3 / TS 5.8 | Build Tool & Static Typing | Implementation | Frontend bundling, Hot Module Replacement (HMR), compile-time type validation | `vite.config.ts`, `tsconfig.json` |
| **oxlint** | v1.75.0 | AST Static Linter | Quality Assurance | High-performance Rust-based static analysis auditing 34 source files for anti-patterns | `npm run lint` report (0 errors, 0 warnings) |
| **Google Chrome** | v134+ | Headless Verification Engine | Verification & Evidence | Headless browser execution capturing high-resolution UI screenshots of dashboard screens | `docs/screenshots/*.png` |
| **Arduino IDE / Toolchain** | v2.3+ | Embedded C++ IDE | Embedded Firmware | Writing, verifying, and flashing `sentinel_firmware.ino` to ATmega328P | `firmware/sentinel_firmware/` |
| **Mermaid.js** | v11+ | Diagram Architecture | System Design | Generating architectural, sequence, class, ER, and state machine diagrams | `docs/diagrams/5.1` to `5.6` |

---

## 2. In-Depth Tool Documentation & Evidence

### 2.1 Tool 1: Git & GitHub Actions
- **Purpose**: Distributed version control and automated continuous integration.
- **SDLC Phase**: Requirements, Design, Implementation, Verification, Maintenance.
- **Project Usage**:
  - Maintained a clean commit history tracking architectural decisions, firmware fixes, and documentation improvements.
  - Implemented `.github/workflows/ci.yml` which automatically executes on every push and pull request to `main`.
  - The workflow executes: `npm ci` → `npm run lint` → `npx tsc -b` → `npm test` → `npm run evaluate` → `npx vite build`.
- **Evidence**: Passing CI badge on `README.md` and automated workflow definition in `.github/workflows/ci.yml`.

### 2.2 Tool 2: Node.js Test Runner (`node:test`)
- **Purpose**: High-performance, zero-dependency unit and integration testing.
- **SDLC Phase**: Verification & Regression Testing.
- **Project Usage**:
  - Replaced bulky external testing libraries with the native `node:test` and `node:assert/strict` modules.
  - Formulated 14 comprehensive test cases (TC01–TC13) covering protocol checksum validation, multi-scenario simulation progression, steam cross-sensitivity deduction, OLS slope calculation, predictive TTD, and sensor flatlining.
- **Evidence**: `npm test` logs executing 14 tests across 2 suites in 50 ms.

### 2.3 Tool 3: Vite & React 19 Frontend Ecosystem
- **Purpose**: Modern frontend single-page application framework and build tool.
- **SDLC Phase**: Implementation & User Interface Design.
- **Project Usage**:
  - Leveraged Vite 8 for instant HMR and optimized production asset minification (compiling in 206 ms).
  - Implemented React 19 component hierarchy including dynamic dual-trace SVG charts, status banners, and slide-out explainability drawers.
- **Evidence**: Generated client distribution bundle in `dist/` and interactive dashboard UI.

### 2.4 Tool 4: oxlint (High-Speed Rust Linter)
- **Purpose**: Fast static analysis and security policy auditing.
- **SDLC Phase**: Quality Assurance & Code Hygiene.
- **Project Usage**:
  - Executed static analysis across all 34 JavaScript and TypeScript source files in the project.
  - Audited code for memory leaks, unused symbols, and unsafe asynchronous constructs in 27 ms.
- **Evidence**: Clean linter output: `Found 0 warnings and 0 errors. Finished in 27ms on 34 files with 96 rules`.

### 2.5 Tool 5: Headless Google Chrome Automation
- **Purpose**: Automated browser rendering and visual evidence capture.
- **SDLC Phase**: System Verification & Documentation.
- **Project Usage**:
  - Executed headless Chrome instances to programmatically render dashboard screens at 1280x900 resolution.
  - Verified routing integrity, responsive CSS layout, and visual state rendering across live simulation scenarios.
- **Evidence**: Seven authentic PNG screenshots stored under `docs/screenshots/`.

---

## 3. Catalog of Generated Screenshots

| Screenshot Filename | Screen / View | Description & Visual Evidence Captured |
| :--- | :--- | :--- |
| `dashboard_normal.png` | Resident Monitor (`/monitor`) | Live dual-trace sensor graph showing baseline steady-state air (~190 ADC, 24.0°C, 50% RH) with `NORMAL` status badge. |
| `steam_scenario.png` | Steam Rejection (`/monitor`) | Boiling kettle simulation where humidity climbs to 85%+; raw gas rises to 268 ADC while steam deduction (-106.7 ADC) suppresses nuisance alarms. |
| `gas_leak_alert.png` | Gas Leak Emergency (`/monitor`) | Combustible gas ramp exceeding 500 ADC danger floor; active slope (+30 ADC/s), TTD countdown, and `EMERGENCY` escalation stepper. |
| `caregiver_portal.png` | Caregiver View (`/caregiver`) | Asymmetric remote monitoring portal displaying dwelling status, incident duration, and one-touch national emergency (112) dialer. |
| `admin_calibration.png` | Admin Workbench (`/admin`) | Technical calibration view showing raw regression coefficients ($K_{RH}, K_T$), sensor health diagnostics, and baseline reset tools. |
| `alert_history.png` | Alert Audit Log (`/alerts`) | Chronological event table cataloging timestamped warnings, classification transitions, and underlying heuristic factors. |
| `notification_settings.png` | Notification Config (`/settings`)| User configuration panel for emergency contact numbers, caregiver SMS delays, and audio siren preferences. |
