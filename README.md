# 🛡️ SENTINEL: Dual-Tier Cyber-Physical Architecture

### *Dynamic Cross-Sensitivity Compensation & Zero-Trust Edge Safety in Residential Gas Monitoring*

[![CI](https://github.com/Shree-svg/-SENTINEL/actions/workflows/ci.yml/badge.svg)](https://github.com/Shree-svg/-SENTINEL/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino%20Nano-00979D?style=flat-square&logo=arduino)](https://www.arduino.cc)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)

---

## 🎯 What is SENTINEL's Core Novelty?

Traditional residential gas detectors suffer from a dangerous failure mode known as **Alarm Fatigue**. Because low-cost metal-oxide semiconductor ($SnO_2$) sensors cross-react to ambient temperature fluctuations and relative humidity, benign everyday cooking steam frequently triggers false alarms. Consequently, occupants frequently disable or silence their detectors, creating severe life-safety hazards.

**SENTINEL resolves this trade-off through five key architectural innovations:**

1. **Environmental Cross-Sensitivity Compensation**:
   Real-time mathematical compensation ($K_{RH} = 2.8, K_T = 1.2$) eliminates humidity and temperature interference. Cooking steam is classified as `steam suppressed` without triggering nuisance sirens.
2. **Predictive Time-to-Danger (TTD) Early Warning**:
   A 10-sample rolling least-squares regression slope estimator tracks gas concentration trajectory, providing up to **+4.0 seconds of advance warning** before hazardous combustion thresholds are breached.
3. **5-Stage Controlled Escalation State Machine**:
   Predictable progression (`NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY`) with 15-second caregiver SMS and 30-second national emergency (112) prompts, backed by local occupant acknowledgment (`pipe.ack()`).
4. **Dual-Tier Architecture with Zero-Trust Edge Safety Floor**:
   * **Firmware Plane (Arduino Nano ATmega328P)**: Autonomous 1.0s non-blocking loop controlling physical piezo buzzer (`D8`) and LED (`D9`) with a 30-second boot-time stabilization hold. Operates unconditionally with **zero reliance** on host PC connectivity, Wi-Fi status, or cloud uptime.
   * **Cyber Analytical Plane (Node.js + React 19)**: Multi-variable feature extraction, rolling trend sparklines, explainability factors, and automated caregiver alerts.
5. **Interactive Demo Simulation & Automated Verification Suite**:
   Built-in ephemeral demo mode with realistic synthetic scenarios (`steam`, `cooking`, `gas_leak`, `normal`, `adc_saturation`, `sensor_fault`), an automated 8-test unit verification suite (`npm test`), and an offline dataset replay evaluation benchmark (`npm run evaluate`).

---

## 🔬 Mathematical Model & Formulation

### 1. Dynamic Environmental Cross-Sensitivity Compensation
The raw conductance of metal-oxide semiconductor gas sensors ($SnO_2$) varies significantly with ambient humidity ($RH$) and temperature ($T$). SENTINEL computes a compensated gas reading $R_{comp}(t)$:

$$R_{comp}(t) = R_{raw}(t) - \min\Big(250, \max\big(0, K_{RH} \cdot (RH(t) - RH_0) + K_T \cdot (T(t) - T_0)\big)\Big)$$

Where:
- $R_{raw}(t)$ = Instantaneous MQ-2 ADC reading ($0 - 1023$).
- $RH_0 = 50.0\%, T_0 = 24.0^\circ\text{C}$ = Calibrated baseline environmental conditions.
- $K_{RH} = 2.8\text{ ADC/\%RH}$ = Empirical humidity cross-sensitivity gain.
- $K_T = 1.2\text{ ADC/°C}$ = Empirical thermal cross-sensitivity gain.
- $\text{Max Steam Deduction} = 250\text{ ADC}$ = Bounding safety floor preventing leak suppression.

### 2. 10-Sample Rolling Least-Squares Slope Estimation
To detect early gas accumulation before reaching dangerous concentrations, the pipeline calculates the linear rate of change over a rolling window $N = 10$:

$$m = \frac{N \sum (t_i \cdot R_i) - \big(\sum t_i\big)\big(\sum R_i\big)}{N \sum t_i^2 - \big(\sum t_i\big)^2}$$

### 3. Predictive Time-to-Danger (TTD)
When an ascending gas trajectory is detected ($m > 0$), the time remaining before reaching the critical hazard threshold $\theta_{danger} = 500\text{ ADC}$ is estimated:

$$t_{danger} = \begin{cases} \dfrac{\theta_{danger} - R_{comp}(t)}{m}, & \text{if } m > 0.4\text{ ADC/s} \text{ and } R_{comp}(t) < \theta_{danger} \\ 0\text{ s}, & \text{if } R_{comp}(t) \ge \theta_{danger} \\ \infty, & \text{otherwise} \end{cases}$$

---

## 📊 Empirical Benchmark Evaluation Results

Run the built-in headless evaluation harness across empirical kitchen datasets:
```bash
npm run evaluate
```

### Benchmark Summary: Plain Static Threshold vs. SENTINEL Pipeline

```
========================================================================================================================
Scenario        Ground Truth  | [PLAIN] Alarm   FA?   Miss?   Lead(s)   | [COMPENSATED] Alarm   FA?   Miss?   Lead(s)
------------------------------------------------------------------------------------------------------------------------
cooking         NON-HAZARD    | YES (8s)        🔴 YESNO      N/A       | NO                    🟢 NO 🟢 NO   N/A
gas             GAS LEAK      | YES (17s)       NO    NO      5s        | YES (21s)             🟢 NO 🟢 NO   ⚡ 9s
normal          NON-HAZARD    | NO              NO    NO      N/A       | NO                    🟢 NO 🟢 NO   N/A
steam           NON-HAZARD    | YES (11s)       🔴 YESNO      N/A       | NO                    🟢 NO 🟢 NO   N/A
========================================================================================================================
```

| Evaluation Metric | Plain Static Threshold (300 ADC) | SENTINEL Compensated Pipeline | Architectural Benefit |
| :--- | :---: | :---: | :--- |
| **False Alarms (Cooking / Steam)** | 2 false alarms (19s nuisance triggers) | **0 false alarms** | **100% false alarm suppression in test suite** (eliminates nuisance sirens) |
| **Missed Detections (Leaks)** | 0 missed | **0 missed** | **Zero safety compromise** |
| **Early Warning Lead Time to 500 ADC** | 5.0 seconds | **9.0 seconds** | **+4.0s advance warning** via 10-sample slope projection |

### 🔬 Data Collection Methodology
The benchmark evaluation suite runs against four labeled empirical datasets (`data/*.csv`) captured at 1.0 Hz (120+ total samples) using the integrated hardware session recorder (`server/recorder.js`):
- **Kitchen Steam (`data/steam.csv`, 31 samples)**: Boiling water electric kettle placed 30 cm from the MQ-2 + DHT11 sensing cluster. Characterized by a sharp relative humidity jump from 50.0% to 90.5% RH with minimal ambient temperature deviation (+2.4°C), causing an uncompensated raw gas false spike to 390 ADC.
- **Stovetop Cooking (`data/cooking.csv`, 31 samples)**: High-heat domestic cooking generating concurrent vapor, volatile aerosol emissions, and ambient heat (humidity peaking at 78.5% RH, temperature rising to 31.0°C), triggering a naive false alarm at 365 ADC.
- **Controlled Gas Release (`data/gas.csv`, 26 samples)**: Controlled unlit butane dispenser discharge held 20 cm from the MQ-2 sensor under dry room conditions (50% RH, 24°C). The gas signal rapidly ramps from 190 to 912 ADC, allowing the 10-sample slope estimator to detect the hazard 4.0 seconds ahead of the static threshold.
- **Normal Living Environment (`data/normal.csv`, 31 samples)**: Quiescent residential room air under steady-state baseline conditions (24.0°C, 50.0% RH, gas steady at ~190 ADC).

---

## 🎥 Demonstration Video & UI Walkthrough

- **Demonstration Video**: [Watch the SENTINEL End-to-End Walkthrough (YouTube)](https://youtu.be/placeholder-sentinel-demo)
- **Interactive UI Architecture**:
  - **Resident Real-Time Dashboard**: Live dual-trace sensor graphs (raw vs. compensated), dynamic status banner (`NORMAL`, `STEAM SUPPRESSED`, `WARNING`, `EMERGENCY`), and 5-stage escalation stepper.
  - **Contributing Factors Drawer**: Explainability slide-out breaking down humidity rate of change, steam deduction, and sensor health metrics.
  - **Caregiver Portal**: Asymmetric read-only emergency portal with one-touch national emergency (112) dialer and instant alert audit history.
  - **Interactive Scenario Sandbox**: Hardware-independent demo mode streaming synthetic realistic telemetry with zero chance of triggering real sirens or emergency services.

---

## 🏗️ Cyber-Physical System Topology

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
    ┌───────────────────────────────────────────────┐  ┌────────────────────────┐
    │       TELEMETRY INGESTION & DEMO BRIDGE       │  │  OFFLINE FIELD TRIAGE  │
    │ ───────────────────────────────────────────── │  │ (Mobile Responder App) │
    │ • Auto-Reconnect Serial Watchdog (2s scan)    │  └────────────────────────┘
    │ • Telemetry Frame Parser & Checksum Validator │
    │ • Ephemeral Demo Simulator (demoSimulator.js) │
    │ • Real-Data-Wins Hardware Priority Preemptor  │
    │ • Express REST Ingestion API (:3001)          │
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────────────────────────────────┐
    │              CYBER ANALYTICAL PIPELINE (src/sim/pipeline.ts)              │
    │ ───────────────────────────────────────────────────────────────────────── │
    │ • Dynamic Baseline Tracker (RH_0, T_0 calibration window)                 │
    │ • Least-Squares Slope Estimator (10-sample rolling regression)            │
    │ • Predictive Time-to-Danger (TTD) Estimator                               │
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

## 🔌 Hardware Circuit & Pinout

| Peripheral | Arduino Pin | Mode | Description |
| :--- | :--- | :--- | :--- |
| **MQ-2 Gas Sensor** | `A0` | Analog IN | Combustible gas & smoke concentration ($0–1023$ ADC) |
| **DHT11 Sensor** | `D2` | Digital I/O | Ambient temperature (°C) & relative humidity (%) |
| **Piezo Buzzer** | `D8` | Digital OUT | Active acoustic alarm sounder ($100\Omega$ series protection) |
| **Status Alarm LED** | `D9` | Digital OUT | Visual safety beacon ($330\Omega$ current-limiting resistor) |
| **HC-05 BT TXD** | `D10` | SoftwareSerial RX | Receives Bluetooth telemetry ($9600\text{ baud}$) |
| **HC-05 BT RXD** | `D11` | SoftwareSerial TX | Transmits Bluetooth telemetry to mobile triage node |

---

## 🛡️ Cyber-Physical Safety Invariants

1. **Zero-Interference Safety Floor**:
   The physical microcontroller firmware evaluates raw ADC readings directly in hardware and actuates Pin `D8` buzzer independently. Software crashes, network latency, or simulation commands can **never** silence or override the physical safety alarm.
2. **Real-Data-Wins Priority**:
   If a valid real sensor packet arrives over USB serial while demo simulation is active, the backend immediately terminates synthetic streaming, switches the UI toggle to OFF, and displays `"Real device detected: demo mode stopped"`.
3. **Simulation Action Sandboxing**:
   While simulation mode is active, all real SMS, email, and 112 telephony dispatch calls are strictly suppressed. Actions produce visual UI toasts (`"SMS to caregiver (simulated)"`) and simulation log entries.

---

## 📁 Repository Layout

```
.
├── .github/                       # GitHub issue templates & automated CI workflows
├── .clangd                        # Clang configuration mapping .ino files to C++ translation units
├── data/                          # Empirical benchmark CSV datasets
│   ├── cooking.csv                # High-heat domestic cooking with vapor/heat
│   ├── gas.csv                    # Controlled butane release ramping to danger floor
│   ├── normal.csv                 # Quiescent baseline ambient living room air
│   └── steam.csv                  # Boiling kettle steam burst (ΔRH > +40%)
├── docs/                          # Architectural & Engineering Documentation
│   ├── ARCHITECTURE.md            # In-depth architectural specification & FSM formulas
│   ├── PRODUCT.md                 # Product specifications & clinical/academic requirements
│   ├── DESIGN.md                  # UI/UX design tokens & styling guide
│   ├── SECURITY.md                # Zero-trust safety policy, localhost binding & hardening
│   ├── CONTRIBUTING.md            # Contributor guidelines
│   └── CODE_OF_CONDUCT.md         # Contributor Covenant
├── firmware/                      # Embedded C++ Microcontroller Firmware
│   └── sentinel_firmware/
│       └── sentinel_firmware.ino  # Production Arduino sketch (30s warm-up hold + checksum)
├── scripts/
│   └── evaluate.js                # Headless cyber-physical benchmark runner
├── server/                        # Backend Ingestion Bridge & Demo Simulator
│   ├── compensationConfig.json    # Regression gains (K_RH, K_T) & threshold configuration
│   ├── demoSimulator.js           # Ephemeral synthetic telemetry generator
│   ├── index.js                   # Node.js + Express serial watchdog daemon (bound to 127.0.0.1)
│   ├── recorder.js                # Real-time CSV session recorder
│   └── signalAnalytics.js         # Steam compensation, slope & sensor health diagnostics
├── src/                           # Frontend React 19 Dashboard
│   ├── api/                       # Typed REST API client
│   ├── components/                # UI components (LiveStatusPanel, AlertHistoryList, CaregiverView, etc.)
│   ├── hooks/                     # Custom hooks (usePipeline, usePolling, useReadingHistory)
│   ├── sim/                       # Analytical pipeline & simulation engine
│   │   ├── pipeline.ts            # Reusable mathematical compensation & escalation FSM
│   │   └── SimulationPanel.tsx    # Scenario injection & ground-truth comparison table
│   └── types/                     # TypeScript data interfaces
├── tests/                         # Automated pipeline test suite (TC06–TC13)
│   └── pipeline.test.js           # Unit tests verifying warm-up, steam suppression, slope & FSM
├── LICENSE                        # MIT License
└── package.json                   # Project metadata and dependencies
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0+
- **Arduino IDE / Arduino CLI** (for flashing microcontroller firmware)
- **Target Hardware (Optional for Demo Mode)**: Arduino Nano (ATmega328P), MQ-2, DHT11, Piezo Buzzer, LED, HC-05

### 2. Install Dependencies
```bash
git clone https://github.com/Shree-svg/-SENTINEL.git
cd -SENTINEL
npm install
```

### 3. Run Automated Tests & Benchmark Evaluation
```bash
# Run unit test suite (TC06–TC13)
npm test

# Run empirical dataset replay benchmark evaluation
npm run evaluate
```

### 4. Launch Backend Server & Dashboard
In terminal 1 (Hardware Ingestion Bridge & Demo Simulator):
```bash
npm run server
```

In terminal 2 (Vite Development Dashboard):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **💡 No Hardware? Try Demo Mode!**  
> If no physical Arduino is connected, toggle **"Demo readings"** in the top navigation bar. Select scenarios like **Steam**, **Cooking**, or **Combustible Gas Leak** to observe real-time dynamic compensation and predictive early warnings.

### 5. Flash Arduino Firmware (For Real Hardware)
1. Open `firmware/sentinel_firmware/sentinel_firmware.ino` in Arduino IDE.
2. Install **DHT sensor library by Adafruit** via Library Manager (`Tools > Manage Libraries`).
3. Select Board: `Arduino Nano` (Processor: `ATmega328P`).
4. Select your USB port (`/dev/cu.usbserial-*` or `COM*`) and click **Upload**.

---

## 🧪 Continuous Integration & Verification

All commits and pull requests are verified using GitHub Actions:

```bash
# 1. Run fast static analysis linter
npm run lint

# 2. Run automated pipeline verification tests (TC06–TC13)
npm test

# 3. Run cyber-physical benchmark replay
npm run evaluate

# 4. Typecheck TypeScript & compile production Vite bundle
npm run build
```

---

## 👤 Author & Academic Affiliation

* **Lead Architect & Developer**: **Shreedhar Sharma**
* **Institution**: Vellore Institute of Technology (VIT), Chennai
* **Specialization**: B.Tech CSE (Cyber-Physical Systems — CPS)
* **Contact Email**: [shreedharsharma192@gmail.com](mailto:shreedharsharma192@gmail.com)
* **Portfolio**: [portfolio-five-delta-xr8oas2k65.vercel.app](https://portfolio-five-delta-xr8oas2k65.vercel.app/)
* **GitHub**: [@Shree-svg](https://github.com/Shree-svg)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
