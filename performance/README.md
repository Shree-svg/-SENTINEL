# SENTINEL Comprehensive Testing & Performance Suite

This directory contains the testing framework definitions and execution guides for **SENTINEL**. The project's quality assurance methodology is built upon a **three-pillar testing triad**: **Selenium IDE** for UI automation, **Apache JMeter** for API performance and load benchmarking, and **Jira** for test management and requirements traceability.

> [!NOTE]
> The complete unified evaluation results and visual evidence are documented in:
> * 📑 **[Comprehensive Testing Report (Markdown)](../docs/report/TESTING_REPORT.md)**
> * 📕 **[Official Comprehensive Testing Report (PDF)](../docs/report/SENTINEL_Comprehensive_Testing_Report.pdf)**

---

## 🏛️ Triad Testing Framework Overview

| Testing Pillar | Tool / Framework | Scope & Focus | Test Coverage | Key Evidence / Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **1. UI Automation** | **Selenium IDE** | End-to-end user workflows, alarm handling, responsive design, and accessibility | 19 Test Cases (`UI-01`–`UI-13`, `UI-15`–`UI-20`) | `sentinel_merged_fixed.side` |
| **2. API Performance** | **Apache JMeter 5.6.3** | REST API latency SLA, throughput ceilings, stress limits, and CORS policies | 8 Test Plans (`PF-01`–`PF-08`) | [`plans/*.jmx`](plans/) |
| **3. Test Management** | **Jira** | Test case formulation, execution logging, defect tracking, and workflow closure | 16 Tracked Issues (`ST-4`–`ST-20`) | Project `SENTINEL Testing` export |

---

## 1. 🌐 Selenium IDE (UI Workflow Automation)

Selenium IDE automates browser-level user scenarios to verify that the cyber-physical dashboard behaves safely across various domestic hazard events:

* **Hazard Scenarios**: Validates steam nuisance suppression (`UI-01`), progressive gas leak escalation (`UI-02`), sensor fault warnings (`UI-07`), and ADC saturation clipping (`UI-08`).
* **Operator Interaction**: Tests alarm acknowledgement (`UI-03`), contributing factors drawer inspection (`UI-10`), and caregiver notification configuration (`UI-11`, `UI-12`).
* **Safety Invariants**: Enforces that simulated demo scenarios are strictly blocked when a physical hardware device is connected (`UI-16`).
* **Quality & Accessibility**: Verifies multi-viewport responsiveness (`UI-18`), 1 Hz dashboard update latency (`UI-19`), and keyboard accessibility / contrast standards (`UI-20`).

---

## 2. 📋 Jira (Test-Case Management & Traceability)

Jira serves as the central verification ledger for requirements mapping and test execution status under the **SENTINEL Testing** project:

* **Status**: 16 of 16 formal test issues (`ST-4` through `ST-20`) closed with **Status = Done** and **Resolution = Done**.
* **Traceability Matrix**:
  * `ST-4` to `ST-7`: End-to-end execution, backend connectivity, telemetry polling, and safe baseline stability.
  * `ST-8` to `ST-10`: Steam transient suppression, cooking aerosol handling, and combustible gas leak escalation.
  * `ST-11` to `ST-14`: Hardware diagnostics (sensor fault, saturation), alert notifications, and link disconnect recovery.
  * `ST-15` to `ST-20`: API validation, active alert consistency, and operator acknowledgment verification.

---

## 3. ⚡ Apache JMeter (API Performance & Load Benchmarks)

Apache JMeter evaluates the Node.js/Express ingestion tier (`http://127.0.0.1:3001`) under varying concurrency and load profiles.

### Test Matrix (PF-01 – PF-08)

| Test Plan | Scenario | Objective | Concurrency |
| :--- | :--- | :--- | :--- |
| [`plans/pf01.jmx`](plans/pf01.jmx) | Endpoint Availability | Verifies all REST endpoints return HTTP 200 with standard JSON schemas | 1 thread, 1 loop |
| [`plans/pf02.jmx`](plans/pf02.jmx) | Response Time SLA | Measures latency under steady concurrent reads (`GET /api/readings/latest`) | 10 threads, 5 loops |
| [`plans/pf03.jmx`](plans/pf03.jmx) | Throughput Baseline | High-volume read test measuring sustained requests/second capability | 50 threads, 20 loops (3,000 reqs) |
| [`plans/pf04.jmx`](plans/pf04.jmx) | Stress / Saturation | Concurrency ramps to identify system bottleneck limits | 100–400 threads |
| [`plans/pf05.jmx`](plans/pf05.jmx) | Soak / Endurance | Sustained traffic loop to detect memory leaks and event-loop lag | 5 threads, 30 mins |
| [`plans/pf06.jmx`](plans/pf06.jmx) | Security Bounds | Verifies unauthenticated/corrupted request rejection | 1 thread |
| [`plans/pf07.jmx`](plans/pf07.jmx) | Burst Traffic | Tests rapid traffic spike recovery | Burst ramps |
| [`plans/pf08.jmx`](plans/pf08.jmx) | CORS & Origin Policy | Validates cross-origin access rules and header integrity | 1 thread |

### Running JMeter Tests via CLI

Make sure Apache JMeter (`jmeter`) is installed and the backend server is running (`npm run server`).

```bash
# Execute PF-01 in non-GUI mode
jmeter -n -t performance/plans/pf01.jmx -l performance/results/pf01-results.jtl -j performance/logs/pf01.log

# Generate HTML Dashboard Report from results
jmeter -g performance/results/pf01-results.jtl -o performance/results/pf01-html-report
```

> **Note on Directory Layout**: Raw run logs (`.log`), result dumps (`.jtl`), and HTML reports are generated locally on-demand and excluded from git version control via `.gitignore`.
