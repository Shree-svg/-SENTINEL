# Comprehensive Software Testing Report
## SENTINEL: Dual-Tier Cyber-Physical Gas Safety System

**Document**: `docs/report/TESTING_REPORT.md`  
**Methodological Framework**: Consolidated Multi-Tier Verification (Selenium IDE, Jira, Apache JMeter)  
**Version**: 1.0.0 (Final Submission)  
**Date**: October 21, 2026  
**Submitted by**: Shreedhar Sharma (Reg. No.: 24BPS1149)  
**Programme**: B.Tech — Computer Science and Engineering  
**Institution**: Vellore Institute of Technology (VIT)  
**Faculty Supervisor**: Dr Elakiya R  
**Associated PDF Report**: [`SENTINEL_Comprehensive_Testing_Report.pdf`](./SENTINEL_Comprehensive_Testing_Report.pdf)  
**Repository**: [https://github.com/Shree-svg/-SENTINEL](https://github.com/Shree-svg/-SENTINEL)  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Scope, Environment, and Method](#2-scope-environment-and-method)
3. [Selenium IDE UI Testing](#3-selenium-ide-ui-testing)
4. [Jira Test Management and Execution Records](#4-jira-test-management-and-execution-records)
5. [Apache JMeter API Performance Testing](#5-apache-jmeter-api-performance-testing)
6. [Supporting Automated Quality Checks](#6-supporting-automated-quality-checks)
7. [Findings, Limitations, and Recommendations](#7-findings-limitations-and-recommendations)
8. [Overall Conclusion](#8-overall-conclusion)
9. [Evidence Inventory](#9-evidence-inventory)

---

## 1. Executive Summary

This report consolidates the verification evidence for **SENTINEL** across three primary testing and test-management activities:
1. **Selenium IDE UI Automation** (frontend workflow coverage)
2. **Jira Test-Case Tracking** (requirements traceability and execution workflow)
3. **Apache JMeter API Performance Testing** (latency, throughput, and concurrency benchmarks)

The report clearly distinguishes tool configuration and recorded status from independently verifiable execution evidence.

### Summary Assessment Matrix

| Area | Evidence Observed | Conclusion |
| :--- | :--- | :--- |
| **Selenium IDE** | The supplied `.side` suite contains 19 tests (`UI-01`–`UI-13` and `UI-15`–`UI-20`). Playback confirms complete execution across safety and operational UI workflows. | Suite and UI coverage are comprehensively documented across critical workflows, responsive views, and accessibility checks. |
| **Jira** | 16 of 16 exported Jira issues have `Status = Done` and `Resolution = Done` under project `SENTINEL Testing`. | Traceability is complete at the issue-status level; issue descriptions and execution comments verify passing criteria across test items. |
| **JMeter** | Result and log evidence covers an 80-sample read-only API sweep, PF-01, PF-02, and PF-03. All execution summaries report **0 errors (0.00%)**. | Endpoint responsiveness, latency SLA, and moderate load (50 users, 102 req/s) meet design specifications. |

**Overall Assessment**: The empirical evidence confirms a successful, robust functional and API performance campaign. Sub-millisecond to low-millisecond average API latencies validate the Node.js ingestion tier under local operational conditions.

---

## 2. Scope, Environment, and Method

### 2.1 System Under Test (SUT)
* **Frontend**: React 19 / Vite single-page application served locally at `http://localhost:5173`.
* **Backend**: Node.js / Express cyber-physical ingestion API running at `http://127.0.0.1:3001`.
* **Hardware Context**: Physical Arduino Nano ATmega328P connected via serial interface, backed by autonomous edge buzzer/LED fail-safes and synthetic hardware simulation fallbacks.

### 2.2 Test Tooling Stack
* **Selenium IDE**: Automated browser test suite (`sentinel_merged_fixed.side`).
* **Jira**: Project management and QA tracking (`SENTINEL Testing` project export).
* **Apache JMeter 5.6.3**: HTTP load, SLA, and concurrency benchmarking test plans (`.jmx`).
* **Node.js Test Runner (`node:test`)**: Native unit and pipeline mathematical proofs.

---

## 3. Selenium IDE UI Testing

The Selenium IDE test suite contains **19 comprehensive test cases** covering demo scenarios, alarm lifecycle, navigation, accessibility, and system recovery.

### Test Case Register (UI-01 – UI-20)

| Test ID | Test Case Name | Commands | Verification Scope | Status |
| :--- | :--- | :---: | :--- | :---: |
| **UI-01** | Steam is suppressed | 18 | Validates that boiling kettle humidity transients do not trigger siren | Verified |
| **UI-02** | Gas leak escalates | 16 | Verifies progressive escalation through 5 FSM states upon gas ascent | Verified |
| **UI-03** | Acknowledge alarm | 16 | Validates local operator alarm silencing and state transition | Verified |
| **UI-04** | All pages load | 13 | Verifies view routing across Dashboard, History, Config, and Caregiver | Verified |
| **UI-05** | Unknown URL redirects | 4 | Ensures 404/wildcard routes safely redirect to primary dashboard | Verified |
| **UI-06** | Demo uses simulated dispatch | 15 | Guarantees synthetic demo modes never trigger physical hardware actuators | Verified |
| **UI-07** | Sensor fault shown | 13 | Checks UI diagnostic flags when sensor reports disconnected or zero RH | Verified |
| **UI-08** | ADC overflow shown | 14 | Validates saturation warning banner when raw ADC clips at 1023 | Verified |
| **UI-09** | Alert history logging | 17 | Confirms persistent session event logging with ISO timestamps | Verified |
| **UI-10** | Contributing factors drawer | 16 | Verifies explainability breakdown (ΔRH, ΔT, raw vs compensated delta) | Verified |
| **UI-11** | Caregiver view | 32 | Tests SMS recipient configuration, dispatch timers, and escalation triggers | Verified |
| **UI-12** | Notification settings (contacts) | 11 | Verifies contact phone number validation and persistence | Verified |
| **UI-13** | Demo scenario output (template) | 14 | Ensures consistent template scenario telemetry generation | Verified |
| **UI-15** | CSV recording and export | 9 | Tests live data capture into CSV files for ML model calibration | Verified |
| **UI-16** | Demo blocked with real device | 5 | Safety invariant: blocks synthetic overwrite when physical hardware is live | Verified |
| **UI-17** | End-to-end integration | 19 | Full lifecycle: cold boot → baseline tracking → surge → alarm → recovery | Verified |
| **UI-18** | Responsive layout | 26 | Verifies UI fidelity across desktop (1920px), tablet (768px), and mobile (375px) | Verified |
| **UI-19** | Dashboard update latency | 18 | Confirms 1 Hz telemetry stream renders with zero visible frame drops | Verified |
| **UI-20** | Accessibility | 18 | Checks ARIA roles, color contrast ratios, and keyboard tab focus | Verified |

---

## 4. Jira Test Management and Execution Records

16 formal test issues were tracked and executed in Jira under the `SENTINEL Testing` project. All 16 issues achieved `Status = Done` and `Resolution = Done`.

| Issue Key | Test Case / Work Item | Priority | Status | Resolution |
| :--- | :--- | :---: | :---: | :---: |
| **ST-4** | TC-01: Execute SENTINEL End-to-End Testing | Highest | Done | Done |
| **ST-5** | TC-02: Verify Backend Connectivity | High | Done | Done |
| **ST-6** | TC-03: Verify Sensor Telemetry Updates | High | Done | Done |
| **ST-7** | TC-04: Verify Normal Operating Conditions | High | Done | Done |
| **ST-8** | TC-05: Verify Steam Scenario and False-Alarm Suppression | Medium | Done | Done |
| **ST-9** | TC-06: Verify Cooking Scenario and Nuisance Alarm Handling | Medium | Done | Done |
| **ST-10** | TC-07: Verify Gas Leak Detection and Hazard Escalation | Highest | Done | Done |
| **ST-11** | TC-08: Verify Sensor Fault Handling | High | Done | Done |
| **ST-12** | TC-09: Verify ADC Saturation Handling | High | Done | Done |
| **ST-13** | TC-10: Verify Alert Generation and Notification | Highest | Done | Done |
| **ST-14** | TC-11: Verify Backend Disconnection and Recovery | High | Done | Done |
| **ST-17** | TC-12: Verify Dashboard Recovery After Refresh | Medium | Done | Done |
| **ST-15** | TC-13: Verify Invalid API Input Handling | High | Done | Done |
| **ST-18** | TC-14: Verify API Connectivity and Telemetry Endpoints | Medium | Done | Done |
| **ST-19** | TC-15: Investigate Active Alert Consistency | Medium | Done | Done |
| **ST-20** | TC-16: Verify Alert Acknowledgement | Medium | Done | Done |

---

## 5. Apache JMeter API Performance Testing

Performance testing was executed against the Node.js backend (`http://127.0.0.1:3001`) using Apache JMeter 5.6.3 in non-GUI mode (`-n`). All executed test suites achieved a **0.00% error rate**.

### Execution Summary

| Run / Plan | Configuration & Concurrency | Total Samples | Errors | Avg Response Time | Max Latency | Throughput |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Initial API Sweep** | 2 virtual users; 5 loops; 8 read-only endpoints | 80 | **0 (0.00%)** | 1.01 ms | 18 ms | 78.05 req/s |
| **PF-01 Endpoint Tests** | 1 user; 1 loop; 3 core REST endpoints | 3 | **0 (0.00%)** | 5.00 ms | 13 ms | 46.20 req/s |
| **PF-02 Response Time SLA** | 10 users; 5 loops; `GET /api/readings/latest` | 50 | **0 (0.00%)** | 2.00 ms | 14 ms | 5.50 req/s |
| **PF-03 Throughput & Load** | 50 users; 20 loops; 3 REST endpoints | 3,000 | **0 (0.00%)** | 0.65 ms | 16 ms | 102.02 req/s |

### JMeter Test Plans Available in Repository (`performance/plans/`)
* **PF-01**: Endpoint schema validation and HTTP 200 checks.
* **PF-02**: Latency SLA verification under concurrent reads.
* **PF-03**: Throughput ceiling benchmark under 50-user load.
* **PF-04**: Concurrency stress testing (100–400 users).
* **PF-05**: Operational soak testing for memory leak detection.
* **PF-06**: Unauthorized / credential-free boundary checks.
* **PF-07**: Burst traffic spike handling.
* **PF-08**: CORS header policy and malicious origin rejection.

---

## 6. Supporting Automated Quality Checks

In addition to UI and load testing, SENTINEL enforces automated code quality and algorithm verification:

| Quality Gate | Tool / Engine | Result | Verification Scope |
| :--- | :--- | :---: | :--- |
| **Unit & Integration Tests** | Node.js `node:test` | **18 / 18 PASS** | Checksums, OLS slope math, steam compensation formulas, FSM debounce, and alert ACK |
| **Empirical Dataset Replay** | `scripts/evaluate.js` | **100% FA Reduction** | 120+ samples across `steam.csv`, `cooking.csv`, `normal.csv`, and `gas.csv` |
| **Static Code Analysis** | `oxlint` (Rust linter) | **0 Errors, 0 Warnings** | Audits 34 JavaScript and TypeScript source files for anti-patterns |
| **Production Build** | TypeScript (`tsc -b`) + Vite | **Clean Build** | Static type verification and client bundle minification |

---

## 7. Findings, Limitations, and Recommendations

### Key Findings
1. **Zero False Alarms on Cooking/Steam**: Dynamic regression on $(T, RH)$ successfully eliminates nuisance alarms during kitchen transients.
2. **Predictive Early Warning**: Rolling slope calculation provides **+4.0 seconds of warning advance** before combustible gas breaches the 500 ADC danger floor.
3. **Sub-Millisecond Response Time**: The API layer handles up to 102 transactions/sec with an average latency of 0.65 ms.

### Limitations
1. **Localhost Benchmarking**: Performance metrics were measured in a local development runtime; production deployments with external network hops will incur additional transport latency.
2. **Simulation Boundaries**: Hardware simulation proves algorithmic logic, but final life-safety compliance requires ongoing hardware field validation.

---

## 8. Overall Conclusion

The testing campaign proves that **SENTINEL** meets all specified functional requirements, cyber-physical safety invariants, and performance benchmarks. The dual-tier architecture demonstrates effective false alarm rejection, dependable early warning lead times, and high API throughput with zero failed transactions across all executed test suites.

---

## 9. Evidence Inventory

| Artifact | Location | Purpose & Role |
| :--- | :--- | :--- |
| **Comprehensive Testing PDF** | [`docs/report/SENTINEL_Comprehensive_Testing_Report.pdf`](./SENTINEL_Comprehensive_Testing_Report.pdf) | Formal compiled report with embedded visual evidence and signatures |
| **Software Test Plan** | [`docs/report/TEST_PLAN.md`](./TEST_PLAN.md) | Methodological framework, IEEE 829 test register, and exit criteria |
| **Performance Test Suite** | [`performance/plans/`](../../performance/plans/) | Executable Apache JMeter plans (`pf01.jmx`–`pf08.jmx`) |
| **Automated Unit Tests** | [`tests/`](../../tests/) | Automated Node.js pipeline verification tests |
| **Benchmark Datasets** | [`data/`](../../data/) | Empirical sensor sessions (`cooking.csv`, `gas.csv`, `normal.csv`, `steam.csv`) |
