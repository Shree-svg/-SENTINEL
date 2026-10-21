# Software Test Plan & Verification Strategy
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/TEST_PLAN.md`  
**Methodological Framework**: Informed by the test documentation principles of IEEE 829 / ISO/IEC/IEEE 29119  
**Version**: 1.0.0 (Final Submission)  
**Submitted by**: Shreedhar Sharma (Reg. No.: 24BPS1149)  
**Programme**: B.Tech — Computer Science and Engineering  
**Institution**: Vellore Institute of Technology (VIT) Chennai  
**Faculty Supervisor**: Dr Elakiya R  
**Comprehensive Testing Report (PDF)**: [`SENTINEL_Comprehensive_Testing_Report.pdf`](./SENTINEL_Comprehensive_Testing_Report.pdf)  
**Comprehensive Testing Report (Markdown)**: [`TESTING_REPORT.md`](./TESTING_REPORT.md)  
**Repository**: [https://github.com/Shree-svg/-SENTINEL](https://github.com/Shree-svg/-SENTINEL)  

---

## Table of Contents
1. [Testing Objectives & Scope](#1-testing-objectives--scope)
2. [Multi-Tier Testing Methodology](#2-multi-tier-testing-methodology)
3. [Test Classification Matrices](#3-test-classification-matrices)
   - [3.1 Functional Testing Matrix](#31-functional-testing-matrix)
   - [3.2 Non-Functional Testing Matrix](#32-non-functional-testing-matrix)
4. [Selenium IDE UI Test Case Register (UI-01–UI-20)](#4-selenium-ide-ui-test-case-register-ui-01ui-20)
5. [Jira Test Management Register (ST-4–ST-20)](#5-jira-test-management-register-st-4st-20)
6. [Apache JMeter Performance Test Suite (PF-01–PF-08)](#6-apache-jmeter-performance-test-suite-pf-01pf-08)
7. [Test Environment & Tools](#7-test-environment--tools)
8. [Entry, Exit, and Suspension Criteria](#8-entry-exit-and-suspension-criteria)

---

## 1. Testing Objectives & Scope

The primary objective of the SENTINEL test plan is to establish a rigorous, multi-tiered verification framework across frontend presentation, backend ingestion, hardware fail-safes, and concurrent performance. The test plan validates:
- **Sensor Cross-Sensitivity Rejection**: Suppression of false alarms caused by boiling steam and high-heat cooking transients.
- **Predictive Time-to-Danger (TTD)**: Verification of early hazard warnings driven by rolling linear regression slopes.
- **Fail-Safe Edge Actuation**: Autonomous buzzer actuation and strict separation between synthetic demonstration modes and physical actuators.
- **API Performance & Concurrency**: SLA adherence, throughput limits, and error rates under multi-user loads.

---

## 2. Multi-Tier Testing Methodology

The verification strategy adopts a three-pillar testing architecture that bridges automated browser testing, formal project issue management, and protocol performance benchmarks:

```
+-------------------------------------------------------------------------+
|                  PILLAR 1: SELENIUM IDE UI AUTOMATION                   |
|   19 End-to-end browser tests verifying user workflows, navigation,    |
|   alarm lifecycle, accessibility (ARIA), and multi-viewport layout.     |
+------------------------------------+------------------------------------+
                                     ^
+------------------------------------+------------------------------------+
|               PILLAR 2: JIRA TEST-CASE MANAGEMENT                       |
|   16 Formal test issues (ST-4 to ST-20) tracking requirements           |
|   traceability, execution notes, defect triage, and workflow closure.   |
+------------------------------------+------------------------------------+
                                     ^
+------------------------------------+------------------------------------+
|           PILLAR 3: APACHE JMETER API PERFORMANCE SUITE                 |
|   8 Load and stress plans (PF-01 to PF-08) evaluating latency SLAs,     |
|   throughput (102 req/s), concurrency (up to 400 threads), and CORS.    |
+-------------------------------------------------------------------------+
```

---

## 3. Test Classification Matrices

To ensure structured coverage across both operational software behavior and system quality attributes (ISO/IEC 25010), the testing campaign separates verification activities into **Functional Testing** (behavioral logic, safety state machines, and data processing) and **Non-Functional Testing** (performance SLAs, load limits, security boundaries, UI responsiveness, and accessibility).

### 3.1 Functional Testing Matrix

Functional tests evaluate whether system features, safety interlocks, hazard state transitions, and diagnostic routines operate in strict accordance with functional specifications.

| Pillar / Tool | Test ID | Test Name / Focus | Target Quality Attribute (ISO 25010) | Verification Objective |
| :--- | :--- | :--- | :--- | :--- |
| Selenium IDE | `UI-01` | Steam False-Alarm Suppression | Functional Correctness & Safety | Asserts that kettle humidity spikes do not trigger acoustic sirens |
| Selenium IDE | `UI-02` | Gas Leak State Escalation | Functional Progression | Validates progression across all 5 FSM escalation stages |
| Selenium IDE | `UI-03` | Alarm Acknowledgement | Operator Control & Usability | Confirms alarm silencing and local operator state transition |
| Selenium IDE | `UI-04` | Application View Navigation | Navigation & Routing | Validates view loading across Dashboard, History, and Caregiver views |
| Selenium IDE | `UI-05` | Wildcard Route Redirection | Error Handling & Fault Tolerance | Confirms invalid URLs safely redirect back to main dashboard |
| Selenium IDE | `UI-06` | Simulated Dispatch Boundary | Safety Invariant Enforcement | Verifies demo mode sets simulated flag without real actuator triggers |
| Selenium IDE | `UI-07` | Sensor Fault Diagnostics | Fault Tolerance & Diagnostics | Confirms disconnected sensor triggers diagnostic error banners |
| Selenium IDE | `UI-08` | ADC Saturation Alert | Boundary Handling | Asserts visual saturation warning when raw ADC clips at 1023 |
| Selenium IDE | `UI-09` | Alert History Logging | Auditability & Event Logging | Validates persistent chronological logging of hazard transitions |
| Selenium IDE | `UI-10` | Contributing Factors Drawer | System Explainability | Confirms mathematical decomposition drawer renders ΔRH and ΔT |
| Selenium IDE | `UI-11` | Caregiver Portal Workflow | Functional Feature & Alerting | Tests caregiver configuration, emergency timers, and 112 dialer |
| Selenium IDE | `UI-12` | Contact Details Settings | Data Validation & Persistence | Confirms recipient phone number formatting and storage |
| Selenium IDE | `UI-13` | Demo Telemetry Template | Data Conformance | Asserts synthetic scenario generator matches telemetry schema |
| Selenium IDE | `UI-15` | Telemetry CSV Recording | Data Capture & Export | Tests start/stop session recording and CSV file generation |
| Selenium IDE | `UI-16` | Hardware Safety Lockout | Safety Invariant Enforcement | Blocks synthetic demo overrides when physical serial device is live |
| Selenium IDE | `UI-17` | End-to-End Integration | System Lifecycle Integrity | Verifies complete cycle from 30s warm-up hold to safe recovery |
| Jira (`ST-*`) | `TC-01` (`ST-4`) | End-to-End System Execution | Functional Completeness | Verifies end-to-end telemetry flow and dashboard rendering |
| Jira (`ST-*`) | `TC-02` (`ST-5`) | Backend Serial Ingestion | Hardware Interface Compatibility | Validates serial daemon communication with Arduino microcontroller |
| Jira (`ST-*`) | `TC-03` (`ST-6`) | Sensor Telemetry Stream (1 Hz) | Data Transmission Integrity | Confirms continuous 1.0s telemetry polling without packet loss |
| Jira (`ST-*`) | `TC-04` (`ST-7`) | Ambient Baseline Tracking | Accuracy & Calibration | Validates safe baseline tracking under quiescent living room air |
| Jira (`ST-*`) | `TC-05` (`ST-8`) | Steam Rejection Verification | Safety & Fault Rejection | Confirms cross-sensitivity compensation eliminates steam false alarms |
| Jira (`ST-*`) | `TC-06` (`ST-9`) | Cooking Transient Handling | Noise Rejection | Asserts high-heat cooking vapors do not escalate to siren state |
| Jira (`ST-*`) | `TC-07` (`ST-10`) | Gas Leak Detection & Escalation | Early Warning & Hazard Detection | Verifies rolling regression slope detects ascending gas concentrations |
| Jira (`ST-*`) | `TC-08` (`ST-11`) | Sensor Disconnection Recovery | Fault Tolerance | Validates graceful recovery and diagnostic display upon sensor disconnect |
| Jira (`ST-*`) | `TC-09` (`ST-12`) | ADC Saturated Clipping | Fault Tolerance | Tests system resilience when sensor input hits physical 1023 max |
| Jira (`ST-*`) | `TC-10` (`ST-13`) | Alert Generation & Notification | Notification Delivery | Confirms critical threshold breaches dispatch immediate UI alerts |
| Jira (`ST-*`) | `TC-11` (`ST-14`) | Serial Port Watchdog Recovery | Resilience & Auto-Recovery | Validates 2.0s auto-reconnect watchdog reconnects dropped COM ports |
| Jira (`ST-*`) | `TC-12` (`ST-17`) | Dashboard Hydration After Refresh | State Persistence | Verifies active alarm states rehydrate immediately upon page reload |
| Jira (`ST-*`) | `TC-13` (`ST-15`) | Invalid API Input Validation | Input Security & Bounds Checking | Verifies malformed JSON / bounds breaches return HTTP 400 |
| Jira (`ST-*`) | `TC-14` (`ST-18`) | Telemetry REST API Schema | API Contract Verification | Validates GET endpoints return expected keys and data types |
| Jira (`ST-*`) | `TC-15` (`ST-19`) | Active Alert State Consistency | FSM Debounce & Latching | Confirms alarm remains latched until gas drops below clear threshold |
| Jira (`ST-*`) | `TC-16` (`ST-20`) | Alert Acknowledgement Route | Operator Control | Verifies `POST /api/alerts/:id/acknowledge` updates alert status |
| Apache JMeter | `PF-01` | REST Endpoint Availability | API Contract & Availability | Verifies HTTP 200 responses across all core telemetry endpoints |

### 3.2 Non-Functional Testing Matrix

Non-functional tests evaluate system operational qualities, latency guarantees, concurrency scaling, security boundaries, viewport responsiveness, and accessibility standards.

| Pillar / Tool | Test ID | Test Name / Focus | Target Quality Attribute (ISO 25010) | Verification Objective |
| :--- | :--- | :--- | :--- | :--- |
| Selenium IDE | `UI-18` | Responsive Multi-Viewport Layout | Multi-Device Usability | Validates UI layout across desktop (1920px), tablet (768px), and mobile (375px) |
| Selenium IDE | `UI-19` | Dashboard Update Latency | Temporal Performance | Confirms 1 Hz continuous telemetry renders without UI frame drops |
| Selenium IDE | `UI-20` | Accessibility Standards | Accessibility (WCAG 2.1 / ARIA) | Audits contrast ratios, screen reader labels, and keyboard tab focus |
| Apache JMeter | `Sweep` | Initial API Sweep Latency | Performance & Latency SLA | Benchmarks baseline latency under 2 users across 8 endpoints (avg 1.01 ms) |
| Apache JMeter | `PF-02` | Response Time Under Concurrency | Latency SLA Compliance | Validates response times under 10 concurrent users remain < 5 ms |
| Apache JMeter | `PF-03` | Throughput & Load Ceiling | Capacity & Scalability | Evaluates 50 users / 3,000 requests to measure throughput (102.02 req/s) |
| Apache JMeter | `PF-04` | Concurrency Saturation & Stress | Robustness Under Peak Stress | Tests breaking point across 100, 200, and 400 concurrent thread ramps |
| Apache JMeter | `PF-05` | Operational Soak & Endurance | Reliability & Memory Stability | 30-minute continuous polling loop testing for memory leaks or event lag |
| Apache JMeter | `PF-06` | Unauthenticated Request Bounds | Security & Access Control | Verifies endpoint behavior when requests lack authentication credentials |
| Apache JMeter | `PF-07` | Burst Traffic Spike Recovery | Elasticity & Spike Recovery | Tests recovery latency following instantaneous high-frequency traffic bursts |
| Apache JMeter | `PF-08` | CORS Header & Origin Enforcement | Network Security Policy | Asserts ACAO header restrictions and rejects unauthorized cross-origins |

---

## 4. Selenium IDE UI Test Case Register (UI-01–UI-20)

The browser test suite (`sentinel_merged_fixed.side`) defines **19 automated test cases** executed in Selenium IDE:

| Test ID | Test Scenario | Steps | Scope / Target Assertion | Verification Objective |
| :--- | :--- | :---: | :--- | :--- |
| **UI-01** | Steam is suppressed | 18 | `POST /api/demo/scenario` (steam) | Verifies ambient humidity elevation does not trigger critical alarm sirens |
| **UI-02** | Gas leak escalates | 16 | `POST /api/demo/scenario` (gas) | Asserts progressive transition through all 5 escalation stages |
| **UI-03** | Acknowledge alarm | 16 | Click Acknowledge Alarm | Verifies user acknowledgement silences local buzzer and transitions FSM |
| **UI-04** | All pages load | 13 | Navigate top navigation bar | Validates HTTP 200 and rendering on Dashboard, History, and Caregiver views |
| **UI-05** | Unknown URL redirects | 4 | Navigate to `/non-existent-route` | Confirms router wildcard fallback redirects back to the main dashboard |
| **UI-06** | Demo uses simulated dispatch | 15 | Trigger synthetic scenario | Validates simulated emergency dispatch flag without actuating real sirens |
| **UI-07** | Sensor fault shown | 13 | Inject disconnected sensor state | Verifies diagnostic error banner and yellow telemetry warning pill |
| **UI-08** | ADC overflow shown | 14 | Inject raw ADC = 1023 | Validates hardware saturation clipping alert and warning drawer |
| **UI-09** | Alert history logging | 17 | Inspect Alert History table | Verifies table updates with timestamped event records and severity pills |
| **UI-10** | Contributing factors drawer | 16 | Click "Why is this alerting?" | Confirms explainability breakdown renders ΔRH, ΔT, and compensation math |
| **UI-11** | Caregiver view | 32 | Open Caregiver Portal view | Validates SMS notification recipient fields, escalation timer, and 112 link |
| **UI-12** | Notification settings | 11 | Update emergency contacts | Confirms phone number input validation and in-memory persistence |
| **UI-13** | Demo scenario output | 14 | Run template scenario check | Validates schema conformance of generated synthetic telemetry packets |
| **UI-15** | CSV recording and export | 9 | Toggle Recording button | Tests start/stop recording action and verifies target CSV generation |
| **UI-16** | Demo blocked with real device | 5 | Physical serial port connected | Safety invariant: demo controls disabled when real microcontroller is live |
| **UI-17** | End-to-end integration | 19 | Cold boot to alarm recovery | Validates entire lifecycle from 30s warm-up hold to safe baseline return |
| **UI-18** | Responsive layout | 26 | Viewport resizing (375–1920px) | Verifies layout integrity across mobile, tablet, and widescreen desktop |
| **UI-19** | Dashboard update latency | 18 | Observe 1 Hz telemetry tick | Confirms live dual-trace graphs refresh without frame stutter or memory leaks |
| **UI-20** | Accessibility | 18 | Screen reader & keyboard audit | Checks ARIA roles, color contrast compliance, and keyboard focus outlines |

---

## 5. Jira Test Management Register (ST-4–ST-20)

16 formal test cases are tracked under the **SENTINEL Testing** project in Jira to ensure end-to-end requirements traceability:

| Issue Key | Test Case ID | Test Item Name | Priority | Target Requirement | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **ST-4** | **TC-01** | Execute SENTINEL End-to-End Testing | Highest | FR-01, FR-02, FR-03 | Done |
| **ST-5** | **TC-02** | Verify Backend Connectivity & Serial Ingestion | High | FR-04, NFR-01 | Done |
| **ST-6** | **TC-03** | Verify Sensor Telemetry Updates (1 Hz polling) | High | FR-03, NFR-02 | Done |
| **ST-7** | **TC-04** | Verify Normal Operating Conditions (Baseline) | High | FR-01, SAF-02 | Done |
| **ST-8** | **TC-05** | Verify Steam Scenario and False-Alarm Suppression | Medium | FR-05, NFR-03 | Done |
| **ST-9** | **TC-06** | Verify Cooking Scenario and Nuisance Alarm Handling | Medium | FR-05, NFR-03 | Done |
| **ST-10** | **TC-07** | Verify Gas Leak Detection and Hazard Escalation | Highest | FR-06, SAF-01 | Done |
| **ST-11** | **TC-08** | Verify Sensor Fault Handling (DHT11/MQ-2 fail) | High | ERR-01, ERR-02 | Done |
| **ST-12** | **TC-09** | Verify ADC Saturation Handling (1023 raw clip) | High | ERR-01, SAF-01 | Done |
| **ST-13** | **TC-10** | Verify Alert Generation and Notification System | Highest | FR-08, FR-09 | Done |
| **ST-14** | **TC-11** | Verify Backend Disconnection and Auto-Recovery | High | NFR-01, NFR-04 | Done |
| **ST-17** | **TC-12** | Verify Dashboard Recovery After Refresh | Medium | NFR-02, NFR-04 | Done |
| **ST-15** | **TC-13** | Verify Invalid API Input Handling & Bounds Checks | High | SEC-01, SEC-02 | Done |
| **ST-18** | **TC-14** | Verify API Connectivity and Telemetry Endpoints | Medium | FR-04, FR-10 | Done |
| **ST-19** | **TC-15** | Investigate Active Alert State Consistency | Medium | FR-09, SAF-02 | Done |
| **ST-20** | **TC-16** | Verify Alert Acknowledgement Workflow | Medium | FR-09, FR-11 | Done |

---

## 6. Apache JMeter Performance Test Suite (PF-01–PF-08)

The performance testing suite validates backend resilience, concurrency limits, and latency SLAs under simulated multi-client workloads:

| Test Plan | Scenario Name | Concurrency Profile | Target Endpoint(s) | SLA / Success Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Sweep** | Initial API Sweep | 2 users, 5 loops | 8 read-only GET endpoints | Average latency < 5 ms; 0.00% error rate |
| **PF-01** | Endpoint Availability | 1 user, 1 loop | `/api/readings/latest`, `/api/hardware/status`, `/api/analytics/config` | HTTP 200 OK; latency < 15 ms |
| **PF-02** | Response Time SLA | 10 users, 5 loops | `GET /api/readings/latest` | Average latency < 5 ms; 0.00% errors |
| **PF-03** | Throughput Baseline | 50 users, 20 loops (3,000 samples) | Core read-only endpoints | Sustained throughput > 100 req/s; 0.00% errors |
| **PF-04** | Stress & Saturation | 100 / 200 / 400 user ramps | Full API telemetry surface | Identify saturation elbow; graceful degradation |
| **PF-05** | Operational Soak | 5 users, 30 min duration | Continuous polling loop | Zero event-loop lag; zero memory leak accumulation |
| **PF-06** | Unauthenticated Security | 1 user, continuous | Protected endpoints | Correct status enforcement without credentials |
| **PF-07** | Burst Traffic Recovery | Stepped traffic bursts | `POST /api/demo/scenario` | Immediate recovery within 1.0s of burst cessation |
| **PF-08** | CORS & Header Policy | 1 user with malicious origin | `GET /api/readings/latest` | ACAO header restriction; reject unauthorized origins |

---

## 7. Test Environment & Tools

| Component | Specification | Deployment / Configuration |
| :--- | :--- | :--- |
| **Operating System** | macOS Darwin (arm64 / x86_64) | Local development workstation |
| **Frontend Runtime** | React 19.2 + Vite 8.3 | Localhost port `5173` |
| **Backend Runtime** | Node.js v20.x + Express 5.2 | Localhost port `3001` (bound to `127.0.0.1`) |
| **Hardware Node** | Arduino Nano (ATmega328P) | 16 MHz, 5V logic, serial baud 9600 |
| **UI Automation** | Selenium IDE (browser extension) | Suite: `sentinel_merged_fixed.side` |
| **Load Testing Engine** | Apache JMeter 5.6.3 | CLI non-GUI execution (`-n -t plans/..`) |
| **Issue Tracker** | Atlassian Jira Cloud | Project: `SENTINEL Testing` (`ST-*`) |

---

## 8. Entry, Exit, and Suspension Criteria

### Entry Criteria
1. Backend ingestion server running cleanly on `http://127.0.0.1:3001`.
2. Frontend Vite dashboard compiled and accessible at `http://localhost:5173`.
3. Apache JMeter 5.6.3 and Selenium IDE configured with latest plan definitions.

### Suspension Criteria
- Any unhandled exception or process termination in the Node.js serial ingestion daemon.
- Any critical regression where a real gas leak is incorrectly classified as steam suppression.
- JMeter error rate exceeding 1.00% on standard read-only SLA benchmarks.

### Exit Criteria
- **Selenium IDE**: 100% of 19 UI test cases executed and verified.
- **Jira**: All 16 tracked issues (`ST-4` to `ST-20`) closed with `Status = Done`.
- **Apache JMeter**: 0.00% error rate across recorded initial sweep, PF-01, PF-02, and PF-03 (3,000 samples).
- **Code Quality**: Zero errors under `oxlint` static linter and clean TypeScript compilation (`tsc -b`).
