# Software Test Plan & Verification Strategy
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/TEST_PLAN.md`  
**Methodological Framework**: Informed by the test documentation principles of IEEE 829 / ISO/IEC/IEEE 29119  
**Version**: 1.0.0 (Final Submission)  
**Submitted by**: Shreedhar Sharma (Reg. No.: 24BPS1149)  
**Programme**: B.Tech — Computer Science and Engineering  
**Institution**: Vellore Institute of Technology (VIT)  
**Faculty Supervisor**: Dr Elakiya R  
**Comprehensive Testing Report**: [`SENTINEL_Comprehensive_Testing_Report.pdf`](./SENTINEL_Comprehensive_Testing_Report.pdf)

---

## 1. Testing Objectives & Scope
The primary objective of the SENTINEL verification plan is to validate all cyber-physical functional requirements, safety invariants, mathematical models, and communication interfaces. The test suite ensures:
- Robustness against sensor cross-sensitivities (steam and cooking transients).
- High-fidelity early warning through rolling linear regression.
- Fault tolerance against physical sensor failure, flatlining, and frame corruption.
- Complete separation between simulated demonstration states and real physical sirens.

---

## 2. Test Levels & Methodology

```
+-------------------------------------------------------------------------+
|                  EMPIRICAL BENCHMARK REPLAY (System Level)              |
|   Replays real kitchen datasets: steam.csv, cooking.csv, gas.csv,      |
|   normal.csv. Validates false positive & early lead time gains.         |
+------------------------------------+------------------------------------+
                                     ^
+------------------------------------+------------------------------------+
|               INTEGRATION & REST API TESTING (Tier 2 Level)             |
|   Validates HTTP API endpoints, watchdog auto-reconnect, simulator      |
|   link corruptions, and in-memory session recording.                    |
+------------------------------------+------------------------------------+
                                     ^
+------------------------------------+------------------------------------+
|                ALGORITHMIC UNIT TESTING (Subsystem Level)               |
|   Node.js test runner (node:test) executing deterministic mathematical  |
|   proofs for steam compensation, OLS slope, TTD, and FSM debounce.      |
+------------------------------------+------------------------------------+
                                     ^
+------------------------------------+------------------------------------+
|              DETERMINISTIC EDGE TESTS (Hardware Level)                  |
|   Verification of autonomous C++ firmware loop, 30s warm-up hold,       |
|   and Pin D8 buzzer actuation under raw threshold excitation.           |
+-------------------------------------------------------------------------+
```

---

## 3. Formal Test Case Register (TC01–TC13)

| Test ID | Requirement | Preconditions | Inputs / Test Vector | Expected Output | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | FR-03, FR-04 | Valid frame format | Payload: `$S,42,280,245,621,0*2F` | XOR checksum matches 0x2F; bit corruption triggers discard | `tests/api.test.js` |
| **TC02** | FR-12 | Simulator initialized | Scenario transitions: `normal` → `steam` → `gas_leak` → `sensor_fault` | Telemetry targets adjust; fault scenario yields `-1` for DHT11 | `tests/api.test.js` |
| **TC03** | FR-05, SAF-02 | Config loaded | $R_{raw} = 200, T = 20.0^\circ\text{C}, RH = 40.0\%$ (below baseline) | Zero steam deduction; $R_{comp} = 200$ (no negative deduction) | `tests/api.test.js` |
| **TC04** | REST Ingestion | Backend online | GET `/api/hardware/status`, `/api/readings/latest`, `/api/analytics/config` | HTTP 200 OK; valid JSON schema with expected sensor keys | `tests/api.test.js` |
| **TC05** | FR-06 | Noisy ramp buffer | 10 samples climbing from 100 to 280 (+20 ADC/s) | Linear slope converges to $20.0 \pm 0.5\text{ ADC/s}$; TTD $= 11\text{ s}$ | `tests/api.test.js` |
| **TC06** | FR-02 | System cold boot | Uptime $< 30,000\text{ ms}$; $R_{raw} = 220$ | Status reports `warming_up`; remaining seconds reported; alarm disabled | `tests/pipeline.test.js` |
| **TC07** | FR-01, FR-05 | Steady baseline | $R_{raw} = 190, T = 24.0^\circ\text{C}, RH = 50.0\%$ | Steam deduction $= 0$; $R_{comp} = 190$; slope $= 0.0$; TTD $=$ null | `tests/pipeline.test.js` |
| **TC08** | FR-05, NFR-03 | Kitchen steam surge | $R_{raw} = 390, T = 26.4^\circ\text{C}, RH = 90.5\%$ | Steam deduction $\approx 116.3\text{ ADC}$; $R_{comp} < 300\text{ ADC}$; siren suppressed | `tests/pipeline.test.js` |
| **TC09** | FR-05, NFR-03 | Stovetop cooking | $R_{raw} = 365, T = 30.5^\circ\text{C}, RH = 78.5\%$ | Steam deduction $\approx 87.6\text{ ADC}$; $R_{comp} < 300\text{ ADC}$; siren suppressed | `tests/pipeline.test.js` |
| **TC10** | FR-01, SAF-01 | Real gas release | $R_{raw} = 585, T = 24.0^\circ\text{C}, RH = 50.0\%$ | Steam deduction $= 0$; $R_{comp} = 585 \ge 500$; triggers critical alert | `tests/pipeline.test.js` |
| **TC11** | FR-09 | Transient spike | Single transient spike to 320 ADC followed by normal air | Debounce prevents latching; sustained leak latches until $< 30\text{ ADC}$ | `tests/pipeline.test.js` |
| **TC12** | FR-06, FR-07 | Linear ascent | History: 200, 230, 260, 290; latest: 320 (+30 ADC/s) | Slope $= 30.0\text{ ADC/s}$; TTD to 500 ADC $= (500-320)/30 = 6\text{ seconds}$ | `tests/pipeline.test.js` |
| **TC13** | ERR-01, ERR-02 | Sensor malfunction | A: 15 identical readings; B: 0.0°C / 0.0% RH; C: 1023 ADC | A: `flatlined: true`; B: `dhtFailed: true`; C: `saturated: true` | `tests/pipeline.test.js` |

---

## 4. Empirical Benchmark Replay Specification

The benchmark execution harness (`scripts/evaluate.js`) replays 120+ empirical samples captured across four distinct environments:

1. **Kitchen Steam (`data/steam.csv`, 31 samples)**: Electric kettle boiling water placed 30 cm from sensor. Relative humidity jumps rapidly from 50.0% to 90.5% RH with slight temperature elevation (+2.4°C), causing uncompensated MQ-2 reading to falsely spike to 390 ADC.
2. **Stovetop Cooking (`data/cooking.csv`, 31 samples)**: Stir-frying emitting steam, aerosols, and heat (RH up to 78.5%, temp up to 31.0°C), spiking raw gas to 365 ADC.
3. **Controlled Combustible Gas Release (`data/gas.csv`, 26 samples)**: Unlit butane discharge in ambient room air (50% RH, 24°C). Gas climbs from 190 to 912 ADC.
4. **Normal Baseline Living Area (`data/normal.csv`, 31 samples)**: Quiescent ambient air under steady baseline conditions.

### Evaluation Metrics
- **False Alarm Count**: Total false positive alarm triggers across non-hazard scenarios (`steam.csv`, `cooking.csv`, `normal.csv`).
- **Missed Hazard Count**: Total missed positive alarm failures on genuine gas release (`gas.csv`).
- **Warning Lead Time**: Time elapsed from initial warning signal until gas breaches the 500 ADC danger floor.

---

## 5. Entry, Exit, and Suspension Criteria

- **Entry Criteria**: All source files compiled cleanly via `oxlint` and TypeScript; dependencies installed via `npm ci`.
- **Suspension Criteria**: Any failure in the mathematical compensation formula that suppresses a true gas leak ($R_{comp} < 300$ during pure gas exposure) immediately halts testing.
- **Exit Criteria**: 100% passing tests in `npm test` (TC01–TC13); 0 false alarms and 0 missed detections in `npm run evaluate`; clean build in `npm run build`.
