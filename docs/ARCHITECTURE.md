# 🏛️ SENTINEL: Cyber-Physical Architecture & Technical Specification

## 1. Executive Architecture Overview

**SENTINEL** is a dual-tier cyber-physical gas safety architecture engineered for residential environments. It eliminates nuisance false alarms induced by everyday cooking steam while providing accelerated early warning for genuine combustible leaks.

The system is partitioned into two distinct operational planes with strict fail-safe boundaries:
1. **Deterministic Edge Safety Plane (Arduino Nano / ATmega328P)**:
   - Non-blocking 1.0-second hardware actuation loop.
   - Hardwired physical safety floor on Pin `D8` (piezo buzzer) and Pin `D9` (safety LED).
   - Operates unconditionally with zero host, network, or cloud dependencies.
   - Dual serial output: USB CDC (9600 baud) and HC-05 Bluetooth UART.
2. **Cyber Analytical Plane (Node.js Ingestion Bridge & React Analytical Pipeline)**:
   - Dynamic cross-sensitivity compensation ($K_{RH} = 2.8, K_T = 1.2$) with baseline calibration.
   - 10-sample least-squares regression slope estimation and Time-to-Danger (TTD) projection.
   - 5-stage escalation state machine (`NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY`).
   - Ephemeral synthetic telemetry generator (`demoSimulator.js`) with zero-interference safety guarantees.

```
                           ┌─────────────────────────────────────────┐
                           │         PHYSICAL SENSING LAYER          │
                           │   MQ-2 Gas (A0)  •  DHT11 Temp/Hum (D2) │
                           └────────────────────┬────────────────────┘
                                                │
                                                ▼
                       ┌───────────────────────────────────────────────────┐
                       │    DETERMINISTIC EDGE PLANE (Arduino ATmega328P)  │
                       │ ───────────────────────────────────────────────── │
                       │ • Standalone 1.0s non-blocking sample loop        │
                       │ • Hardcoded Emergency Safety Floor (Pin D8 Buzzer)│
                       │ • Zero network/computer dependencies (Fail-safe)  │
                       │ • Concurrent Dual-Serial: USB CDC + HC-05 BT      │
                       └──────────────┬──────────────────────┬─────────────┘
                                      │                      │
                    USB CDC (9600 Bd) │                      │ HC-05 Bluetooth (9600 Bd)
                                      ▼                      ▼
     ┌────────────────────────────────────────────────┐ ┌────────────────────────┐
     │      TELEMETRY INGESTION & DEMO BRIDGE         │ │  OFFLINE FIELD TRIAGE  │
     │ ────────────────────────────────────────────── │ │ (Mobile Responder App) │
     │ • Auto-reconnect serial watchdog (2s scan)     │ └────────────────────────┘
     │ • Telemetry frame parser with checksum check   │
     │ • Demo Simulator Engine (server/demoSimulator) │
     │ • Real-Data-Wins hardware priority preemptor   │
     │ • Express REST Ingestion API (:3001)           │
     └───────────────────────┬────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────────────────────────┐
     │               CYBER ANALYTICAL PIPELINE (src/sim/pipeline.ts)             │
     │ ───────────────────────────────────────────────────────────────────────── │
     │ • Environmental Cross-Sensitivity Compensator: R_comp = R - (K_rh*ΔRH + …)│
     │ • Dynamic Baseline Tracker (RH_0, T_0 calibration window)                 │
     │ • Least-Squares Slope Estimator (10-sample rolling regression)            │
     │ • Predictive Time-to-Danger (TTD) Estimator: t_danger = (θ - R_comp) / m  │
     │ • 5-Stage Escalation FSM: NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY│
     │ • Local Acknowledgment Dampener (pipe.ack())                              │
     └───────────────────────┬───────────────────────────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────────────────────────┐
     │                        UNIFIED DASHBOARD & UI LAYER                       │
     │ ───────────────────────────────────────────────────────────────────────── │
     │ • Resident Live Monitor (Dynamic Classification Banner, Dual-Trace SVG)   │
     │ • Compensated Residual & Predictive Time-to-Danger telemetry cards        │
     │ • Escalation Stepper with live countdowns & Local Acknowledge button      │
     │ • Ephemeral Demo Simulator Bar (Scenario selector & Ground-Truth table)   │
     │ • Remote Caregiver Portal (Asymmetric read-only with emergency dispatch)  │
     │ • Admin Calibration & Model Retraining Workbench                          │
     └───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & Component Architecture

### 2.1 Backend & Middleware (`server/`)
| Path | Component | Purpose & Endpoints |
|---|---|---|
| `server/index.js` | Ingestion Bridge | Serial port watchdog, baud 9600 stream listener, alert logging, REST server on port 3001. Bound to `127.0.0.1` with restricted CORS for prototype isolation. Interacts with `/api/readings/*`, `/api/alerts/*`. |
| `server/demoSimulator.js` | Demo Simulator Engine | Generates synthetic telemetry frames across 6 scenarios (`normal`, `steam`, `cooking`, `gas_leak`, `adc_saturation`, `sensor_fault`). Implements real-device preemption. Exposes `POST /api/demo/start`, `POST /api/demo/stop`, `POST /api/demo/scenario`, `GET /api/demo/status`. |
| `server/compensationConfig.json` | Compensation Parameters | Gain constants ($K_{RH}=2.8, K_T=1.2$), baselines ($RH_0=50.0, T_0=24.0$), and threshold limits ($300\text{ ADC}$ alarm, $500\text{ ADC}$ danger floor). |

### 2.2 Reusable Analytical Pipeline (`src/sim/` & `src/hooks/`)
| Path | Component | Purpose |
|---|---|---|
| `src/sim/pipeline.ts` | SENTINEL Pipeline | Pure functional processing engine. Calculates environmental baseline compensation, linear slope projection, classification state, and escalation transitions. |
| `src/hooks/usePipeline.ts` | Reactive Pipeline Hook | Connects incoming telemetry (live serial or demo stream) into `createPipeline()`, maintaining stateful analysis and exposing `ack()` local alarm acknowledgment. |
| `src/sim/SimulationPanel.tsx` | Simulation Controls | Scenario injection buttons, ground truth validation table, and plain threshold vs. SENTINEL comparative analysis. |

### 2.3 User Interface (`src/components/`)
| Path | Component | Key Features & Responsibilities |
|---|---|---|
| `src/components/Shell.tsx` | Application Shell | Header with connection status, navigation tabs, and **Demo Readings** toggle switch with real-hardware lock. |
| `src/components/LiveStatusPanel.tsx` | Live Monitor Dashboard | Classification banner (`SAFE`, `steam suppressed`, `leak suspected`, `GAS LEAK`, `sensor fault`), Compensated Residual & TTD cards, Escalation Stepper, and Raw vs. Compensated SVG chart. |
| `src/components/AlertHistoryList.tsx` | Alert History | Chronological alert log with filters, contributing factors side panel trigger, and simulated alert indicators. |
| `src/components/ContributingFactors.tsx` | Explainability Panel | Slide-in drawer detailing sensor weights, environmental delta, and classification reasoning. |
| `src/components/CaregiverView.tsx` | Remote Caregiver Portal | Asymmetric read-only view with national emergency (112) dialer and real-time alerts. |
| `src/components/AdminCalibrationView.tsx` | Admin Calibration View | Historical dataset labeling and model parameter adjustment workbench. |
| `src/components/NotificationSettingsView.tsx` | Notification Settings | Recipient numbers, escalation delays, and emergency caregiver contact configuration. |
| `src/components/DisclaimerBanner.tsx` | Safety Banner | Persistent footer banner emphasizing certified safety boundaries. |

### 2.4 Testing, Evaluation & Benchmarks (`tests/`, `scripts/` & `data/`)
| Path | Purpose |
|---|---|
| `tests/pipeline.test.js` | Automated verification test suite (TC06–TC13) validating warm-up stabilization, baseline tracking, steam suppression, cooking transient suppression, leak escalation, debounce hysteresis, predictive TTD, and sensor fault handling. |
| `scripts/evaluate.js` | Headless cyber-physical benchmark runner evaluating plain threshold vs. SENTINEL pipeline across empirical datasets. |
| `data/cooking.csv` | Empirical kitchen dataset recorded during high-heat stir fry cooking with ambient vapour and temperature rise. |
| `data/steam.csv` | Kitchen dataset recorded under pure boiling water steam bursts ($\Delta RH > +40\%$). |
| `data/gas.csv` | Genuine combustible gas leak session with steep rising concentration towards 500 ADC danger floor. |
| `data/normal.csv` | Baseline normal room air under steady-state environmental conditions. |
| `.clangd` | Clang tooling configuration mapping `.ino` Arduino sketch files to C++ translation units. |

---

## 3. Mathematical Specifications

### 3.1 Dynamic Environmental Cross-Sensitivity Compensation
The raw conductance of metal-oxide semiconductor gas sensors ($SnO_2$) varies significantly with ambient humidity ($RH$) and temperature ($T$). SENTINEL computes a compensated gas residual $R_{comp}(t)$:

$$R_{comp}(t) = R_{raw}(t) - \min\Big(250, \max\big(0, K_{RH} \cdot (RH(t) - RH_0) + K_T \cdot (T(t) - T_0)\big)\Big)$$

Where:
- $R_{raw}(t)$ = Instantaneous MQ-2 ADC reading ($0 - 1023$).
- $RH_0 = 50.0\%, T_0 = 24.0^\circ\text{C}$ = Standard baseline environmental conditions (or auto-calibrated during warm-up).
- $K_{RH} = 2.8\text{ ADC/\%RH}$ = Empirical humidity cross-sensitivity gain.
- $K_T = 1.2\text{ ADC/°C}$ = Empirical thermal cross-sensitivity gain.
- $\text{Max Steam Deduction} = 250\text{ ADC}$ = Safety bounding cap preventing gas leak masking under saturated humidity.

### 3.2 10-Sample Least-Squares Slope Estimation
To detect early gas accumulation before reaching dangerous concentrations, the pipeline calculates the linear rate of change over a rolling window $N = 10$:

$$m = \frac{N \sum (t_i \cdot R_i) - \big(\sum t_i\big)\big(\sum R_i\big)}{N \sum t_i^2 - \big(\sum t_i\big)^2}$$

### 3.3 Predictive Time-to-Danger (TTD)
When an ascending gas trajectory is detected ($m > 0$), the time remaining before reaching the critical hazard threshold $\theta_{danger} = 500\text{ ADC}$ is estimated:

$$t_{danger} = \begin{cases} \dfrac{\theta_{danger} - R_{comp}(t)}{m}, & \text{if } m > 0.4\text{ ADC/s} \text{ and } R_{comp}(t) < \theta_{danger} \\ 0\text{ s}, & \text{if } R_{comp}(t) \ge \theta_{danger} \\ \infty, & \text{otherwise} \end{cases}$$

### 3.4 5-Stage Escalation State Machine
```
   [ NORMAL ] ──(Residual ≥ 60 for debounce)──► [ WARNING ] ──(Residual ≥ 150 or Comp ≥ 300)──► [ ALARM ]
       ▲                                                                                              │
       │                                            ┌─────────────────────────────────────────────────┘
       │                                            │ (15s elapsed without ack)
       │                                            ▼
  (Reset if residual < 30)                     [ ESCALATED ] ──(30s elapsed)──► [ EMERGENCY ]
                                               (Caregiver SMS)                   (112 Call Prompt)
```

1. **NORMAL**: Safe ambient condition ($R_{comp} < 300\text{ ADC}$, residual $< 60\text{ ADC}$ above baseline).
2. **WARNING**: Possible gas buildup or sensor drift (residual $\ge 60\text{ ADC}$ for 10-sample window).
3. **ALARM**: Immediate hazard confirmed ($R_{comp} \ge 300\text{ ADC}$ or residual $\ge 150\text{ ADC}$). Physical buzzer activates on hardware edge.
4. **ESCALATED**: Alarm unacknowledged for $15\text{ seconds}$. Automated Caregiver SMS dispatched.
5. **EMERGENCY**: Hazard unresolved after $30\text{ seconds}$ or critical safety floor breached ($R_{raw} \ge 500\text{ ADC}$). National Emergency 112 dispatch prompt displayed.

---

## 4. REST API Specification

### 4.1 Telemetry Endpoints
- `GET /api/readings/latest`: Returns the most recent sensor reading packet.
- `GET /api/readings/history`: Returns rolling buffer of past readings.
- `GET /api/readings/stream`: Server-Sent Events (SSE) telemetry stream.

### 4.2 Alert & Safety Endpoints
- `GET /api/alerts`: Returns list of historical and active alerts.
- `POST /api/alerts/:id/acknowledge`: Acknowledges an active alert.
- `POST /api/alerts/clear`: Clears resolved alerts from active memory.

### 4.3 Demo Simulator Control Endpoints
- `POST /api/demo/start`: Starts synthetic telemetry generation (1 Hz).
- `POST /api/demo/stop`: Stops synthetic telemetry generation immediately.
- `POST /api/demo/scenario`: Sets active simulation scenario (`{"scenario": "steam"}`).
- `GET /api/demo/status`: Returns current demo simulation running state and scenario.

---

## 5. Cyber-Physical Safety Guarantees

1. **Zero-Interference Safety Floor**:
   The physical microcontroller firmware evaluates raw ADC readings directly in hardware and actuates Pin `D8` buzzer independently. Software crashes, network latency, or simulation commands can **never** silence or override the physical safety alarm.
2. **Real-Data-Wins Priority**:
   If a valid real sensor packet arrives over USB serial while demo simulation is active, the backend immediately terminates synthetic streaming, switches the UI toggle to OFF, and displays `"Real device detected: demo mode stopped"`.
3. **Simulation Action Sandboxing**:
   While simulation mode is active, all real SMS, email, and 112 telephony dispatch calls are strictly suppressed. Actions produce visual UI toasts (`"SMS to caregiver (simulated)"`) and simulation log entries.
