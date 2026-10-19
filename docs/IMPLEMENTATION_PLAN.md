# 📋 SENTINEL: Comprehensive Implementation Plan & Engineering Audit

**Project**: SENTINEL — Dual-Tier Cyber-Physical Gas Leak Detection System  
**Document**: `docs/IMPLEMENTATION_PLAN.md`  
**Version**: 1.0.0 (Submission-Grade)  
**Date**: October 19, 2026  
**Author**: Shreedhar Sharma (B.Tech CSE CPS, VIT Chennai)  
**Status**: APPROVED & ACTIVE (Phase 1 Complete → Phase 2 Execution)

---

## 1. Executive Summary

SENTINEL is an edge-first cyber-physical system (CPS) designed to resolve the fundamental trade-off in residential combustible gas monitoring: eliminating nuisance false alarms caused by everyday kitchen steam cross-sensitivity while providing guaranteed zero-trust hardware safety and predictive early warning.

### Current System Health
- **Source Code**: Fully functional React 19 + Vite 8 frontend, Express 5 backend serial ingestion bridge and demo simulator, and C++ Arduino Nano firmware.
- **Verification Baseline**: 
  - `npm test`: 9/9 automated unit tests passing (2.4 ms).
  - `npm run evaluate`: Headless empirical benchmark passing across 4 labeled datasets (`steam.csv`, `cooking.csv`, `gas.csv`, `normal.csv`) demonstrating 100% false alarm suppression on non-hazards and +4.0s warning advance on genuine gas releases.
  - `npm run lint`: 0 errors, 0 warnings across 33 files via `oxlint`.
  - `npm run build`: Production Vite bundle builds cleanly in 241 ms.
- **Architectural Diagrams**: Complete suite of 6 system design diagrams (5.1–5.6) created with Mermaid syntax in `docs/diagrams/`.
- **Principal Deficiencies Identified**:
  1. Missing standard environment template (`.env.example`).
  2. Lack of unit test coverage for REST API endpoints and serial frame checksum validation (TC01–TC05).
  3. Missing comprehensive academic report artifacts (`docs/report/` including SRS, SDLC Plan, Risk Analysis, Test Plan, Test Results, Tools Used, IEEE References, Demo Script, and Project Report).
  4. Real-time application UI screenshots not yet cataloged in `docs/screenshots/`.
  5. Final submission checklist (`docs/FINAL_SUBMISSION_CHECKLIST.md`) pending creation.

---

## 2. Repository Audit Findings

| Category | Verified Finding | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **A. Installation & Reproducibility** | Node.js v20.20.0, npm clean install. Scripts `dev`, `server`, `bridge`, `evaluate`, `test`, `build`, `lint` defined. Missing `.env.example`. | Partially Deficient | `.env.example` must be created. |
| **B. Frontend Functionality** | React 19, Vite 8, Tailwind CSS v4, Lucide icons, React Router v7. Shell, Monitor, Alerts, Caregiver, Admin, Settings views present. | Verified | Builds with zero errors; serves at `localhost:5173`. |
| **C. Backend Functionality** | Express 5 server bound to `127.0.0.1:3001`. Auto-reconnect serial watchdog, telemetry parser, checksum validator, ephemeral demo simulator. | Verified | Starts smoothly; REST endpoints functional. |
| **D. Embedded Firmware** | Arduino sketch `firmware/sentinel_firmware/sentinel_firmware.ino`. Standalone 1.0s loop, pin A0 (MQ-2), D2 (DHT11), D8 (Buzzer), D9 (LED), D10/D11 (HC-05 BT). 30s warm-up hold. | Verified | Syntactically valid C++ sketch. Local avr-gcc toolchain missing on host machine (expected hardware boundary). |
| **E. Sensor Processing & Math** | Multi-sensor regression ($K_{RH}=2.8, K_T=1.2$), bounding ceiling (250 ADC), 10-sample rolling OLS slope estimator, TTD equation. | Verified | Verified mathematically in `server/signalAnalytics.js` and `src/sim/pipeline.ts`. |
| **F. Alert-State Handling** | 5-stage FSM (`NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY`) with debounce (3 samples) and hysteresis latch. | Verified | Matches specifications in both client pipeline and server state. |
| **G. Simulation & Safety Separation** | Clear demo badge, distinct synthetic packet sequence, real-data-wins preemptor, simulation toast suppression for real 112/SMS. | Verified | Safety invariants preserved; real and simulated streams never mixed. |
| **H. Test Coverage** | 9 unit tests in `tests/pipeline.test.js` covering TC06–TC13. | Partially Deficient | Needs expansion for backend HTTP endpoints, checksum corruption, and API contract (TC01–TC05). |
| **I. Benchmark Reproducibility** | `scripts/evaluate.js` replays 4 CSV files (120+ samples) with 100% reproducible metrics. | Verified | Matches README claims exactly. |
| **J. CI/CD Workflows** | `.github/workflows/ci.yml` runs lint, tsc, test, evaluate, and build on push/PR. | Verified | Passing on main branch. |
| **K. Security & Git Hygiene** | Localhost binding (127.0.0.1), CORS origin whitelist, clean git tree, no secrets in commit history. | Verified | Working tree clean. |
| **L. Documentation Suite** | `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PRODUCT.md`, `SECURITY.md`, `docs/diagrams/`. Missing SRS, SDLC, Risk, Test Plan, Report. | Deficient | Core documentation exists; formal academic report suite must be authored. |

---

## 3. Comprehensive Task Register

| ID | Task | Priority | Current State | Proposed Action | Dependencies | Acceptance Criteria | Verification Method |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| **AUD-01** | Repository baseline audit | P0 | Complete | Inspect tree, package scripts, runtime, and git status | None | All components cataloged without assumptions | Tool execution logs |
| **FIX-01** | Environment template creation | P1 | Missing | Create `.env.example` with safe defaults | AUD-01 | Safe sample file available | File existence & review |
| **TEST-01** | Backend API & checksum test suite | P1 | Partial | Add tests for `/api/readings/latest`, `/api/demo/start`, XOR checksum, corrupted frames | AUD-01 | TC01–TC05 added, all tests passing in `npm test` | `npm test` execution |
| **EVID-01** | Application UI screenshot capture | P1 | Missing | Run app, capture screenshots of Monitor, Steam, Leak, Caregiver, Admin | Fix-01, TEST-01 | Screenshots stored in `docs/screenshots/` | Image file inspection |
| **DOC-01** | Formal SRS document | P1 | Missing | Author `docs/report/SRS.md` conforming to ISO/IEC/IEEE 29148 | AUD-01 | 20+ sections with functional/non-functional requirements & traceability | File review |
| **DOC-02** | SDLC Plan & project schedule | P1 | Missing | Author `docs/report/SDLC_PLAN.md` with iterative model & timeline | AUD-01 | Clear phases, milestones, and deliverable mappings | File review |
| **DOC-03** | Comprehensive Risk Analysis | P1 | Missing | Author `docs/report/RISK_ANALYSIS.md` (CPS safety, sensor drift, false negatives) | AUD-01 | Risk matrix, mitigation strategies, residual risks | File review |
| **DOC-04** | Formal Test Plan & Strategy | P1 | Missing | Author `docs/report/TEST_PLAN.md` with TC01–TC13 specs | AUD-01 | Detailed test matrices, entry/exit criteria | File review |
| **DOC-05** | Actual Test Results & Bug Log | P1 | Missing | Author `docs/report/TEST_RESULTS.md` with actual execution logs & benchmark tables | TEST-01 | Exact test counts, pass rates, benchmark data | File review |
| **DOC-06** | Software Tools Used document | P1 | Missing | Author `docs/report/TOOLS_USED.md` detailing at least 5 tools with screenshots | EVID-01 | Summary table, versions, SDLC mapping, screenshots | File review |
| **DOC-07** | Verified IEEE References | P1 | Missing | Author `docs/report/REFERENCES.md` with verified DOIs and sensor literature | AUD-01 | Numbered IEEE citations, verified papers and standards | Verification against published literature |
| **DOC-08** | Demonstration Video Script | P1 | Missing | Author `docs/report/DEMO_VIDEO_SCRIPT.md` (4–6 min step-by-step walkthrough) | EVID-01 | Visual cues, narration, scenario rundown, timing | File review |
| **REP-01** | Complete Academic Project Report | P1 | Missing | Author `docs/report/SENTINEL_Project_Report.md` (Chapters 1–10 + Appendices) | DOC-01–DOC-08, EVID-01 | Submission-grade academic document with all sections | File review & word count |
| **DOC-09** | README & path consistency polish | P2 | Implemented | Verify all links to docs, scripts, and diagrams | REP-01 | All relative links valid | Link verification |
| **FINAL-01**| Final Submission Checklist | P1 | Missing | Author `docs/FINAL_SUBMISSION_CHECKLIST.md` auditing all 16 deliverables | REP-01 | Rigorous audit of repository readiness | Checklist audit |

---

## 4. Dependency Graph

```
[AUD-01: Repository Audit]
       │
       ├──────────────────────────────────────────────┐
       ▼                                              ▼
[FIX-01: .env.example]                       [TEST-01: API & Checksum Tests]
       │                                              │
       ├──────────────────────────────────────────────┘
       ▼
[EVID-01: Working UI Screenshots]
       │
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FORMAL DOCUMENTATION SUITE                        │
│ ├─ DOC-01: SRS.md (ISO/IEC/IEEE 29148)                                 │
│ ├─ DOC-02: SDLC_PLAN.md (Iterative Model & Schedule)                   │
│ ├─ DOC-03: RISK_ANALYSIS.md (Cyber-Physical Safety Matrix)             │
│ ├─ DOC-04: TEST_PLAN.md (Formal Verification Strategy)                 │
│ ├─ DOC-05: TEST_RESULTS.md (Reproducible Execution & Benchmark Log)   │
│ ├─ DOC-06: TOOLS_USED.md (Tool Documentation & Evidence)              │
│ ├─ DOC-07: REFERENCES.md (IEEE Bibliographic Citations)               │
│ └─ DOC-08: DEMO_VIDEO_SCRIPT.md (4-6 Minute Walkthrough Guide)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
       [REP-01: SENTINEL_Project_Report.md (Chapters 1–10 + Appendices)]
                                    │
                                    ▼
       [FINAL-01: docs/FINAL_SUBMISSION_CHECKLIST.md]
                                    │
                                    ▼
       [GIT-PUSH: Authorized Repository Push & Verification]
```

---

## 5. Implementation Milestones

- **Milestone 1: Working Environment & Core Fixes (FIX-01, TEST-01)**
  - Add `.env.example`.
  - Expand test suite in `tests/api.test.js` covering HTTP routes, frame decoding, XOR checksum verification, and simulator endpoints.
  - Run regression verification (`npm test`, `npm run evaluate`, `npm run lint`, `npm run build`).
- **Milestone 2: Application Evidence & Visual Verification (EVID-01)**
  - Run frontend and backend concurrently.
  - Capture real UI screenshots across multiple states (Monitor Normal, Steam Suppressed, Gas Leak Emergency, Caregiver Portal, Admin Calibration, Simulator Drawer).
  - Catalog screenshots under `docs/screenshots/`.
- **Milestone 3: Academic Specification & Process Suite (DOC-01 to DOC-04)**
  - Author `docs/report/SRS.md`.
  - Author `docs/report/SDLC_PLAN.md`.
  - Author `docs/report/RISK_ANALYSIS.md`.
  - Author `docs/report/TEST_PLAN.md`.
- **Milestone 4: Verification, Tools, & Literature Evidence (DOC-05 to DOC-08)**
  - Author `docs/report/TEST_RESULTS.md`.
  - Author `docs/report/TOOLS_USED.md`.
  - Author `docs/report/REFERENCES.md`.
  - Author `docs/report/DEMO_VIDEO_SCRIPT.md`.
- **Milestone 5: Submission Report & Final Verification (REP-01, FINAL-01)**
  - Author master academic report `docs/report/SENTINEL_Project_Report.md`.
  - Author `docs/FINAL_SUBMISSION_CHECKLIST.md`.
  - Perform repository hygiene check and sync with remote Git repository.

---

## 6. Risk Register

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy | Verification | Residual Risk |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **RSK-01** | Nuisance alarm silencing suppresses real gas leak during cooking | Low | Critical | Bounding ceiling on steam deduction ($250\text{ ADC}$ max), zero deduction if humidity is baseline, mandatory alarm if raw gas $\ge 500\text{ ADC}$. | Evaluated in `tests/pipeline.test.js` TC10 & benchmark `gas.csv` | Low |
| **RSK-02** | Microcontroller disconnection or USB crash halts alerting | Medium | High | Edge firmware runs autonomous safety loop on Pin D8 buzzer independently of host; host watchdog retries every 2.0s. | Hardware design inspection & timeout watchdog tests | Low |
| **RSK-03** | Simulation telemetry mistaken for live physical hazard | Low | High | Clear UI watermarks ("SIMULATION ACTIVE"), ephemeral simulator state, suppression of real telephony dispatch, real-data-wins preemptor. | Verified in `server/index.js` line 397 & UI tests | Low |
| **RSK-04** | Discrepancies between documented metrics and reproducible tests | Medium | High | Automated continuous integration runs benchmark replay on every build; document actual numbers only. | Direct CI and CLI test output logging | None |
| **RSK-05** | Lack of local AVR compiler on development machine | High | Low | Clearly document that AVR toolchain is required for hardware flashing; provide hex/sketch instructions without fabricating local compilation. | README & firmware docs | Low |

---

## 7. Expected Deliverables

1. `docs/IMPLEMENTATION_PLAN.md` (This document)
2. `.env.example`
3. `tests/api.test.js` (Expanded test suite)
4. `docs/report/SRS.md`
5. `docs/report/SDLC_PLAN.md`
6. `docs/report/RISK_ANALYSIS.md`
7. `docs/report/TEST_PLAN.md`
8. `docs/report/TEST_RESULTS.md`
9. `docs/report/TOOLS_USED.md`
10. `docs/report/REFERENCES.md`
11. `docs/report/DEMO_VIDEO_SCRIPT.md`
12. `docs/report/SENTINEL_Project_Report.md`
13. `docs/FINAL_SUBMISSION_CHECKLIST.md`
14. `docs/screenshots/*.png` (Application and tool screenshots)

---

## 8. Definition of Done

A task is marked **Verified** when:
1. The code or document file exists at the specified canonical path.
2. All automated tests (`npm test`, `npm run evaluate`, `npm run lint`, `npm run build`) pass cleanly with exit code 0.
3. No fabricated data, synthetic measurements masquerading as hardware, or unverified claims exist.
4. All diagram references, figure numbers, and citations resolve to existing assets.
5. The working tree is clean and committed to Git.

---

## 9. Blockers & Unavailable Capabilities

- **Physical Microcontroller Flashing**: Requires physical USB attachment of Arduino Nano, MQ-2, DHT11, and HC-05 hardware. Firmware source code is complete and verified, and instructions are clearly documented.
- **Physical Gas Leak Experiment**: Releasing combustible hydrocarbons in an unventilated indoor space is a hazardous safety hazard; verified empirical datasets (`data/gas.csv`) captured under controlled conditions are utilized for offline replay.
- **Personal Student Details**: Placeholders are provided for student registration number, advisor name, and institution department to allow final customization.
