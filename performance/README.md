# Performance Testing Suite (Apache JMeter)

This directory contains the Apache JMeter test plans for validating SENTINEL API endpoints under load, stress, and operational soak conditions.

> [!NOTE]
> The official testing evaluation report is documented in [`docs/report/SENTINEL_Comprehensive_Testing_Report.pdf`](../docs/report/SENTINEL_Comprehensive_Testing_Report.pdf).

## Directory Layout
* `plans/`: JMeter test plan definitions (`.jmx` files).
* Test run results (`.jtl`), HTML dashboards, and logs are generated locally on-demand and excluded from source control.

## Test Matrix (PF-01 – PF-08)

| Test Plan | Scenario | Objective |
| :--- | :--- | :--- |
| `plans/pf01.jmx` | Endpoint Availability | Verifies all REST endpoints return HTTP 200 with standard payload schemas. |
| `plans/pf02.jmx` | Response Time SLA | Measures latency under steady concurrency (10 threads, 5 loops). |
| `plans/pf03.jmx` | Throughput Baseline | Measures requests-per-second capability of the Node.js API tier. |
| `plans/pf04.jmx` | Stress / Saturation | Concurrency ramps (100–400 threads) to identify system bottleneck limits. |
| `plans/pf05.jmx` | Soak / Endurance | Sustained traffic loop to detect memory leaks and event-loop lag over time. |
| `plans/pf06.jmx` | Security Bounds | Verifies unauthenticated/corrupted request rejection. |
| `plans/pf07.jmx` | Burst Traffic | Tests rapid traffic spike recovery. |
| `plans/pf08.jmx` | CORS & Origin Policy | Validates cross-origin access rules and header integrity. |

## Running Tests via CLI

Make sure Apache JMeter (`jmeter`) is installed and the SENTINEL server is running (`npm run server`).

### Execute a Test Plan
```bash
# Run PF-01 and output results to the results directory
jmeter -n -t performance/plans/pf01.jmx -l performance/results/pf01-results.jtl -j performance/logs/pf01.log
```

### Generate HTML Dashboard
```bash
jmeter -g performance/results/pf01-results.jtl -o performance/results/pf01-html-report
```
