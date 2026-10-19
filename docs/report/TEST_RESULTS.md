# Test Execution Results & Verification Report
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/TEST_RESULTS.md`  
**Version**: 1.0.0 (Submission-Grade)  
**Execution Date**: October 19, 2026  
**Environment**: Darwin 25.1.0 (macOS Sequoia), Apple M-Series (ARM64), Node.js v20.20.0, npm v10.8.2  
**Test Suite Status**: 100% PASSED (Zero Failures, Zero Skips)  

---

## 1. Test Execution Summary

| Suite Category | Total Tests | Passed | Failed | Skipped | Total Duration | Execution Command |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Protocol, Ingestion & API (TC01–TC05)** | 5 | 5 | 0 | 0 | 15.1 ms | `node --test tests/api.test.js` |
| **Pipeline & Compensation (TC06–TC13)** | 9 | 9 | 0 | 0 | 2.5 ms | `node --test tests/pipeline.test.js` |
| **Total Automated Unit Verification** | **14** | **14** | **0** | **0** | **50.3 ms** | `npm test` |
| **Empirical Dataset Replay Benchmark** | 4 Scenarios | 4 | 0 | 0 | 68.0 ms | `npm run evaluate` |
| **Static Code Quality Analysis** | 34 Files | 34 | 0 | 0 | 27.0 ms | `npm run lint` (`oxlint`) |
| **Production Vite Bundle Compilation** | 1890 Modules | 1890 | 0 | 0 | 206.0 ms | `npm run build` |

---

## 2. Actual Unit & Integration Test Case Execution Log

```
> sentinel-cps@1.0.0 test
> node --test tests/*.test.js

▶ SENTINEL Protocol, Ingestion & API Verification (TC01–TC05)
  ✔ TC01: Telemetry Frame Encoding & XOR Checksum Integrity (0.471666ms)
  ✔ TC02: Demo Simulator Multi-Scenario Progression & State Control (0.3095ms)
  ✔ TC03: Analytics Configuration & Bounds Enforcement (0.307042ms)
  ✔ TC04: Backend Live Ingestion REST Endpoints (13.29025ms)
  ✔ TC05: Mathematical Slope Convergence on Noisy Ramps (0.170667ms)
✔ SENTINEL Protocol, Ingestion & API Verification (TC01–TC05) (15.124917ms)

▶ SENTINEL Analytical Pipeline Verification (TC06–TC13)
  ✔ TC06: Sensor Warm-Up & Initial Stabilization Window (0.53075ms)
  ✔ TC07: Safe Ambient Baseline Tracking (0.121833ms)
  ✔ TC08: Steam Cross-Sensitivity Compensation & False Alarm Suppression (0.061083ms)
  ✔ TC09: Cooking Environmental Transient Suppression (0.048459ms)
  ✔ TC10: Real Combustible Gas Leak Detection & Rapid Escalation (0.050833ms)
  ✔ TC11: Debounce Hysteresis & Alarm Latch Persistence (0.045667ms)
  ✔ TC12: Predictive Time-to-Danger (TTD) Estimation (0.099167ms)
  ✔ TC13: Sensor Fault & ADC Saturation Handling (0.088625ms)
  ✔ Empirical Dataset Evaluation Consistency (Zero FAs on Steam/Cooking, Zero Misses on Leaks) (0.767958ms)
✔ SENTINEL Analytical Pipeline Verification (TC06–TC13) (2.484959ms)

ℹ tests 14
ℹ suites 2
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50.349
```

---

## 3. Empirical Benchmark Replay Evaluation Results

Execution of `npm run evaluate` replaying 120+ empirical hardware samples from `data/*.csv`:

```
========================================================================================================================
🛡️  SENTINEL CYBER-PHYSICAL BENCHMARK: PLAIN THRESHOLD vs. COMPENSATED / PREDICTIVE DETECTOR
========================================================================================================================

Active Analytics Config: baselineRH=50%, baselineT=24°C, humCoeff=2.8, dangerThreshold=500

----------------------------------------------------------------------------------------------------------------------------------
Scenario      Ground Truth  | [PLAIN] (Trig @, Dur)  FA?     Miss?   Lead(s)*  | [COMPENSATED] (Trig @, Dur)  FA?     Miss?   Lead(s)*
--------------------------------------------------------------------------------------------------------------------------------------
cooking       NON-HAZARD    | YES (@7s, dur:8s)      🔴 YES  NO      N/A       | NO                           🟢 NO   🟢 NO   N/A
gas           GAS LEAK      | YES (@8s, dur:17s)     NO      NO      5s        | YES (@4s, dur:21s)           🟢 NO   🟢 NO   ⚡ 9s
normal        NON-HAZARD    | NO                     NO      NO      N/A       | NO                           🟢 NO   🟢 NO   N/A
steam         NON-HAZARD    | YES (@7s, dur:11s)     🔴 YES  NO      N/A       | NO                           🟢 NO   🟢 NO   N/A
--------------------------------------------------------------------------------------------------------------------------------------
* Lead Time Definition: Seconds of warning advance provided BEFORE gas breaches the 500 ADC danger floor (reached @13s in gas.csv).
  - Plain Detector triggers when rawGas > 300 ADC (at t=8s) -> Lead Time = 13s - 8s = 5s (alarm active for 17s total).
  - Compensated/Predictive Detector triggers via positive slope (at t=4s) -> Lead Time = 13s - 4s = 9s (alarm active for 21s total).
  - Net Early Warning Advance = 9s - 5s = +4.0s earlier alert to occupants.

📊 EVALUATION SUMMARY & SAFETY GAINS:
  • False Alarms (Non-Hazards)  : Plain = 2 | Compensated/Predictive = 0  (-100% False Positive Reduction)
  • Missed Detections (Leaks)   : Plain = 0 | Compensated/Predictive = 0  (Zero Missed Hazards)
  • Warning Lead Time to 500 ADC: Plain = 5.0s | Compensated/Predictive = 9.0s  (+4.0s Early Warning Advance)

🔬 KEY ARCHITECTURAL TAKEAWAYS:
  1. Steam & Cooking Rejection : Regression on (T, RH) eliminates false alarms caused by everyday kitchen steam.
  2. Early Predictive Warning : 10-sample slope calculation warns occupants BEFORE gas breaches the 500 ADC hazard threshold.
  3. Zero Life-Safety Compromise: Combustible gas leaks in dry conditions pass directly through compensation without suppression.
========================================================================================================================
```

### Benchmark Metrics Comparison Table

| Metric | Plain Static Threshold (300 ADC) | SENTINEL Compensated Detector | Performance Gain / Impact |
| :--- | :---: | :---: | :--- |
| **False Alarms (Steam / Cooking)** | 2 false alarms (19 seconds nuisance noise) | **0 false alarms** | **100% false alarm suppression in test suite** |
| **Missed Detections (Gas Leak)** | 0 missed | **0 missed** | **Zero safety compromise** |
| **Lead Time to 500 ADC Danger** | 5.0 seconds | **9.0 seconds** | **+4.0 seconds earlier warning** via 10-sample slope projection |
| **Nuisance Alarm Siren Duration** | 19 seconds of active buzzer triggering | **0 seconds** | Complete elimination of alarm fatigue |

---

## 4. Defect Log & Corrective Actions Applied

| Defect ID | Severity | Module | Description | Root Cause | Fix Applied | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **DEF-01** | Low | `tests/api.test.js` | Linter reported 2 warnings: unused import `SCENARIO_INFO` and unused catch variable `e`. | Imported symbol from demo simulator not required in TC01–TC05; error parameter unused in JSON parse fallback. | Removed unused import and updated catch block to parameterless `catch {}`. | **Resolved & Verified** |
| **DEF-02** | Medium | Root directory | Missing `.env.example` template for configuration overrides. | Project relied on default fallbacks in code without documentation of environment variables. | Authored comprehensive, safe `.env.example` documenting PORT, HOST, ALLOWED_ORIGINS, and SERIAL_PORT. | **Resolved & Verified** |
| **DEF-03** | Medium | `server/index.js` | Server previously could listen on `0.0.0.0` if PORT/HOST unassigned, risking exposure on campus networks. | Missing default host binding constraint in bridge setup. | Hardcoded default binding to `127.0.0.1` and added explicit CORS whitelist verification. | **Resolved & Verified** |
| **DEF-04** | Low | `tests/` | Lack of test coverage for frame checksum encoding and simulator scenario transitions. | Earlier test suite only covered mathematical functions in `signalAnalytics.js`. | Created `tests/api.test.js` adding TC01–TC05 covering frame encoding, XOR checksums, simulator, and REST API. | **Resolved & Verified** |

---

## 5. Static Analysis & Build Verification

### Static Analysis Report (`oxlint`)
```
> sentinel-cps@1.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 27ms on 34 files with 96 rules using 8 threads.
```

### Production Build Report (`tsc -b && vite build`)
```
> sentinel-cps@1.0.0 build
> tsc -b && vite build

vite v8.3.0 building client environment for production...
transforming (1372) node_modules/lucide-react/dist/esm/icons/popcorn.mjs
✓ 1890 modules transformed.
rendering chunks (1)...
computing gzip size...
dist/index.html                   0.86 kB │ gzip:   0.51 kB
dist/assets/index-DyUqCd50.css   49.08 kB │ gzip:   9.30 kB
dist/assets/index-CBO79QXz.js   390.75 kB │ gzip: 113.55 kB
✓ built in 206ms
```
