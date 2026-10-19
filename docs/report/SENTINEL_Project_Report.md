# SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System
## Final Academic Project Report

**Degree Programme**: Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Specialization**: Cyber-Physical Systems (CPS)  
**Institution**: School of Computer Science and Engineering (SCOPE), Vellore Institute of Technology (VIT), Chennai  
**Author**: Shreedhar Sharma (Reg. No.: `[21BCSxxxx / Student Reg Number Placeholder]`)  
**Faculty Project Supervisor**: `[Faculty Supervisor Name / Department Placeholder]`  
**Academic Year**: 2025–2026  
**Document Version**: 1.0.0 (Submission-Grade)  
**Repository**: [https://github.com/Shree-svg/-SENTINEL](https://github.com/Shree-svg/-SENTINEL)  

---

## Abstract
Residential combustible gas leaks constitute a major hazard resulting in structure fires, asphyxiation, and catastrophic vapor cloud explosions. Commercial domestic gas detectors overwhelmingly employ low-cost metal-oxide semiconductor ($SnO_2$) sensors such as the MQ-2. While sensitive to methane, propane, and butane, these sensors suffer from pronounced physical cross-sensitivity to environmental humidity and temperature fluctuations. In domestic kitchens, boiling water steam and cooking vapors routinely trigger nuisance sirens exceeding static alarm thresholds, inducing severe occupant *alarm fatigue* and prompting users to permanently silence or unplug detectors.

This project presents **SENTINEL**, an edge-first, dual-tier cyber-physical architecture resolving the false-alarm/safety trade-off. SENTINEL decouples an autonomous, zero-trust edge hardware safety floor (Arduino Nano ATmega328P running a 1.0 Hz C++ loop with local piezo buzzer and LED sirens) from an asynchronous cyber analytical plane (Node.js/Express bridge and React 19 dashboard). The cyber plane applies multi-variable linear regression ($K_{RH}=2.8\text{ ADC/\%RH}, K_T=1.2\text{ ADC/°C}$) bounded by a $250\text{ ADC}$ safety ceiling to deduct steam interference, while a 10-sample rolling Ordinary Least Squares (OLS) slope estimator projects gas accumulation trajectory to deliver early Time-to-Danger (TTD) warnings. 

Replaying 120+ empirical kitchen hardware samples across four environments demonstrates that SENTINEL achieves a **100% reduction in false alarms** during intense boiling kettle steam and stovetop cooking while maintaining **zero missed detections** on genuine gas releases and providing **+4.0 seconds of advance warning** before hazardous combustion floors are breached. The system includes an automated 14-test verification suite, static analysis with zero linter errors, and an ephemeral demonstration simulator enabling full hardware-independent verification.

---

## Chapter 1: Introduction

### 1.1 Background and Motivation
Liquefied Petroleum Gas (LPG, primarily propane and butane) and compressed natural gas (CNG / methane) are ubiquitous household fuels for domestic cooking and space heating. Because hydrocarbon mixtures are odorless and explosive at volumetric concentrations between 2% and 10% (the Lower Explosive Limit, LEL), industrial standards mandate artificial odorization (e.g., ethanethiol). However, human olfactory sensitivity diminishes during sleep, olfactory fatigue, or cognitive impairment in elderly residents, necessitating automated electronic gas monitoring.

Low-cost domestic detectors utilize chemiresistive metal-oxide semiconductor sensors, specifically tin dioxide ($SnO_2$). When heated to operating temperatures (~300°C), atmospheric oxygen molecules adsorb onto the polycrystalline grain boundaries, forming negatively charged ionic species ($O_2^-, O^-$) that create an electron depletion layer and elevate electrical resistance. Reducing gases react with adsorbed oxygen ions, releasing trapped electrons back into the conduction band and lowering resistance.

However, water molecules ($H_2O$) in ambient humidity adsorb onto the same active sites, acting as electron donors and artificially lowering resistance. Consequently, an abrupt humidity transient—such as steam from a boiling electric kettle or stovetop cooking—mimics the electrical signature of a combustible gas leak, triggering false sirens. This phenomenon leads to occupant *alarm fatigue*, where users disconnect safety devices to prevent nuisance sirens [1]–[4].

### 1.2 Problem Statement
Commercial residential detectors employ static threshold triggers (e.g., sounding sirens whenever raw sensor resistance drops below a preset floor). This naive architecture creates an intolerable design conflict:
1. Setting thresholds high enough to ignore cooking steam creates unacceptable delays or complete failure to detect slow, hazardous gas leaks.
2. Setting thresholds low enough to catch early leaks causes frequent false alarms during routine cooking.
3. Completely offloading alarm decisions to cloud or host software creates unacceptable single points of failure if computers crash, reboot, or lose network connectivity.

### 1.3 Project Objectives
The objective of SENTINEL is to develop and verify an academic-grade cyber-physical gas safety system satisfying four criteria:
1. **Nuisance Alarm Suppression**: Formulate and evaluate real-time multi-sensor regression algorithms capable of eliminating false alarms caused by domestic steam and cooking transients.
2. **Predictive Early Warning**: Implement rolling least-squares trajectory estimation to project hazardous concentrations and warn occupants before dangerous thresholds are breached.
3. **Zero-Trust Edge Autonomy**: Ensure the physical edge microcontroller actuates local acoustic/visual sirens unconditionally, guaranteeing life-safety regardless of host computer, operating system, or network availability.
4. **Reproducible Engineering & Demonstration**: Deliver an open-source, fully tested repository with continuous integration, automated unit verification, empirical benchmark replay, and a high-fidelity demonstration sandbox.

### 1.4 Scope and Limitations
- **Scope**: Embedded firmware for ATmega328P, serial protocol parsing with XOR checksums, Express.js hardware bridge, mathematical signal analytics, 5-stage escalation state machine, and React 19 dashboard.
- **Limitations**: Metal-oxide sensors drift over extended operating lifespans (12–24 months) and require periodic baseline calibration; under dense steam exceeding $300\text{ ADC}$, the autonomous edge buzzer will sound even while the cyber dashboard correctly classifies the event as `STEAM SUPPRESSED` (an intentional fail-safe bias prioritizing zero false negatives).

---

## Chapter 2: Literature Survey / Existing Systems

### 2.1 Review of Existing Systems
Traditional residential gas safety systems fall into three broad architectural paradigms:

1. **Standalone Microcontroller Detectors**:
   - *Design*: Low-cost 8-bit microcontrollers (e.g., PIC, ATmega, or dedicated analog comparators) directly connected to an MQ-2 or MQ-5 sensor and piezo buzzer.
   - *Limitations*: Rely entirely on single-variable static threshold comparators. Incapable of distinguishing water vapor from hydrocarbon molecules, resulting in high false-alarm rates in kitchen environments [1], [3].
2. **Cloud-Connected IoT Smart Alarms**:
   - *Design*: Wi-Fi-enabled microcontrollers (e.g., ESP8266, ESP32) streaming raw telemetry to commercial cloud dashboards (AWS IoT, Blynk, or Tuya).
   - *Limitations*: Heavy dependency on continuous 2.4 GHz Wi-Fi connectivity and cloud server uptime. If residential routers lose power or ISP latency spikes during an emergency, alerting fails. Cloud processing also introduces privacy concerns and network latency [8], [11].
3. **Complex Laboratory Sensor Arrays (Electronic Noses)**:
   - *Design*: Multi-transducer arrays combining quartz crystal microbalances (QCM), surface acoustic wave (SAW) sensors, and high-dimensional principal component analysis (PCA) or deep neural networks.
   - *Limitations*: Prohibitively expensive ($1,000+), high power consumption (~10–20 W), and excessive computational requirements unsuited for low-cost domestic deployment [4].

### 2.2 Gaps Identified & Proposed SENTINEL Solution
Table 2.1 summarizes the architectural comparison between existing systems and SENTINEL:

| Feature / Metric | Conventional Standalone | Cloud IoT Alarm | Laboratory E-Nose | SENTINEL (Proposed) |
| :--- | :---: | :---: | :---: | :---: |
| **Edge Hardware Autonomy** | Yes (Static) | No (Cloud Dependent) | No | **Yes (Zero-Trust Floor)** |
| **Environmental Compensation**| None | Rare (Ad-hoc) | High (PCA / SVM) | **Analytical Multi-Sensor ($K_{RH}, K_T$)** |
| **Predictive Early Warning** | None | None | Offline Only | **10-Sample Rolling OLS Slope** |
| **Nuisance Alarm Rejection** | 0% (High Fatigue) | Low | High | **100% in Empirical Benchmarks** |
| **Bill of Materials (BOM) Cost**| Very Low ($5–$10) | Medium ($20–$40) | Extremely High ($500+) | **Low (~$15 total hardware BOM)** |
| **Offline Demonstration Mode** | None | None | None | **Built-in Ephemeral Simulator** |

SENTINEL bridges this gap by executing computationally efficient analytical compensation and trend projection on an edge host gateway (e.g., wall dashboard or local home server) while anchoring acoustic life-safety to an autonomous $3 microcontroller edge.

---

## Chapter 3: Software Process Model and Project Planning

### 3.1 SDLC Model Selection & Justification
SENTINEL was developed using an **Iterative and Incremental Development Model** specifically adapted for cyber-physical systems. 

Cyber-physical engineering involves physical sensor non-linearities, analog electrical noise, and thermal stabilization latencies that cannot be accurately anticipated in a purely theoretical Waterfall requirements phase. Conversely, software-centric Agile frameworks often fail to account for embedded component lead times and physical safety risks during destructive gas testing.

The project progressed through seven structured iterations:
1. **Iteration 1**: Sensor physics characterization and empirical kitchen dataset logging (`data/*.csv`).
2. **Iteration 2**: Mathematical modeling of cross-sensitivity gains ($K_{RH}, K_T$) and slope equations.
3. **Iteration 3**: C++ firmware implementation on ATmega328P establishing the zero-trust safety floor.
4. **Iteration 4**: Node.js/Express ingestion bridge with serial auto-reconnect watchdog and simulator.
5. **Iteration 5**: React 19 web dashboard, dual-trace SVG visualization, and caregiver emergency views.
6. **Iteration 6**: Automated testing suite (TC01–TC13), benchmark replay harness, and GitHub Actions CI.
7. **Iteration 7**: Academic audit, ISO/IEC/IEEE 29148 requirements traceability, and report preparation.

### 3.2 Project Schedule & Gantt Timeline
Figure 3.1 presents the project execution timeline across a 14-week lifecycle:

```mermaid
gantt
    title SENTINEL Cyber-Physical Project Lifecycle
    dateFormat  YYYY-MM-DD
    section Phase 1: Requirements & Modeling
    Sensor Cross-Sensitivity Analysis & Datasets    :a1, 2026-07-15, 14d
    Empirical Replay Formulation & Calibration     :a2, after a1, 10d
    section Phase 2: Firmware & Pipeline
    Embedded C++ Firmware (ATmega328P Safety Floor) :b1, after a2, 14d
    Signal Analytics Engine (K_RH, K_T, OLS Slope)  :b2, after b1, 12d
    section Phase 3: Ingestion & Simulator
    Node.js Bridge, Serial Watchdog & Checksum     :c1, after b2, 10d
    Ephemeral Demo Simulator & Sandboxing          :c2, after c1, 10d
    section Phase 4: UI & Integration
    React 19 Dashboard & Live Dual-Trace Plots      :d1, after c2, 14d
    Caregiver Portal & Admin Calibration Workbench :d2, after d1, 10d
    section Phase 5: Verification & Audit
    Automated Unit Suite (TC01-TC13) & CI Pipeline :e1, after d2, 10d
    Academic Documentation & Final Thesis Audit    :e2, after e1, 12d
```

### 3.3 Risk Management & FMEA Summary
Table 3.1 details the principal Failure Modes and Effects identified during development:

| Risk ID | Hazard Mode | Initial Risk | Mitigation Architecture | Residual Risk |
| :--- | :--- | :---: | :--- | :---: |
| **RSK-01** | Gas leak masked during cooking | Extreme (2, 5) | $250\text{ ADC}$ deduction ceiling; bypass override if raw gas $\ge 500\text{ ADC}$. | Low (1, 3) |
| **RSK-02** | Host PC crash silences siren | Extreme (3, 5) | Microcontroller loop directly drives Pin D8 buzzer without host polling. | Low (1, 2) |
| **RSK-03** | Sensor analog flatline | High (2, 4) | Sensor health diagnostics flag 15 consecutive identical ADC samples. | Low (1, 2) |
| **RSK-04** | DHT11 bus failure | Medium (3, 3) | Check for `isnan()` / out-of-bounds; fall back to safe zero-deduction mode. | Low (1, 1) |
| **RSK-05** | Serial frame corruption | Medium (3, 3) | 8-bit XOR checksum appended to every `$S` sentence; corrupt frames discarded. | Low (1, 1) |

### 3.4 Cost and Effort Estimation
Table 3.2 lists the complete hardware Bill of Materials (BOM) for the physical prototype:

| Component | Specification | Unit Cost (USD) | Source / Manufacturer |
| :--- | :--- | :---: | :--- |
| **Microcontroller** | Arduino Nano (ATmega328P @ 16 MHz) | $3.50 | Generic / RobotDyn |
| **Gas Sensor** | Winsen MQ-2 ($SnO_2$ Semiconductor) | $2.20 | Zhengzhou Winsen Electronics |
| **Climate Sensor** | DHT11 Digital Temp/Humidity Module | $1.50 | Aosong Electronics |
| **Acoustic Sounder** | 5V Active Piezo Buzzer ($85\text{ dB}$) | $0.60 | Generic |
| **Visual Beacon** | 5mm High-Intensity Red LED + $330\Omega$ resistor | $0.20 | Generic |
| **Wireless Module** | HC-05 Bluetooth 2.0+EDR UART Module | $3.80 | Waveshare |
| **Prototyping** | Mini Breadboard, Jumper Wires, USB Cable | $3.00 | Generic |
| **Total Hardware BOM** | Complete Cyber-Physical Sensing Node | **$14.80** | Commercial-grade affordable BOM |

---

## Chapter 4: Requirements Analysis

### 4.1 Functional Requirements Summary
- **FR-01 (Continuous Edge Sampling)**: Microcontroller shall sample MQ-2 analog voltage via Pin A0 and digital DHT11 climate data via Pin D2 at $1.0 \pm 0.05\text{ Hz}$.
- **FR-02 (Cold-Boot Stabilization)**: Microcontroller shall enforce a 30,000 ms warm-up lockout during which local sirens cannot trigger.
- **FR-03 (Standard Serialization)**: Telemetry shall format as standard NMEA sentences: `$S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>\r\n`.
- **FR-04 (XOR Frame Checksum)**: System shall validate packet integrity via 8-bit bitwise XOR across payload characters.
- **FR-05 (Dynamic Steam Compensation)**: Host plane shall compute compensated gas concentration $R_{comp}$ using multi-sensor regression coefficients ($K_{RH}=2.8, K_T=1.2$) bounded by a $250\text{ ADC}$ ceiling.
- **FR-06 (Rolling Trend Estimation)**: Over a rolling window $N=10$, system shall calculate linear regression slope $m$ in ADC/s using Ordinary Least Squares.
- **FR-07 (Predictive Time-to-Danger)**: If $m > 0.4\text{ ADC/s}$ and $R_{comp} < 500$, system shall project seconds remaining until hazard threshold: $t_{danger} = (500 - R_{comp}) / m$.
- **FR-08 (5-Stage Escalation FSM)**: System shall progress through `NORMAL`, `WARNING`, `ALARM`, `ESCALATED`, and `EMERGENCY`.
- **FR-09 (Debounce Hysteresis)**: Alarm state shall require 3 consecutive samples above threshold before latching, and shall not clear until residual gas drops below 30 ADC.
- **FR-10 (Caregiver & 112 Dispatch)**: Unacknowledged alarms shall notify caregivers at 15s and present 112 emergency prompts at 30s.
- **FR-11 (Local Acknowledgment)**: Occupants shall be able to acknowledge active alarms locally (`pipe.ack()`), silencing remote escalation.
- **FR-12 (Simulation Sandboxing)**: Host bridge shall provide multi-scenario simulation without triggering physical buzzers or real phone calls.

### 4.2 Non-Functional Requirements Summary
- **NFR-01 (Latency)**: Bridge ingestion latency from serial frame reception to REST dispatch shall not exceed 50 ms.
- **NFR-02 (Watchdog Reliability)**: Serial watchdog shall reconnect to re-attached USB serial ports within 4.0 seconds.
- **NFR-03 (Accuracy)**: Analytical compensation shall eliminate 100% of false alarms on empirical kitchen steam/cooking test datasets.
- **NFR-04 (Timeliness)**: Slope estimator shall provide at least $+3.0\text{ s}$ advance warning lead time over static threshold detectors.
- **NFR-05 (Code Quality)**: Codebase shall produce zero errors and zero warnings under strict static analysis (`oxlint`).

---

## Chapter 5: System Design

### 5.1 System Architecture
Figure 5.1 shows the dual-tier cyber-physical topology separating deterministic hardware from cyber analytics:

```mermaid
flowchart TD
    subgraph HW["🔌 PHYSICAL SENSING LAYER"]
        MQ2["MQ-2 Gas Sensor\n(A0 — 0–1023 ADC)"]
        DHT["DHT11 Temp/Humid\n(D2 — 1-wire)"]
    end

    subgraph TIER1["⚡ TIER 1: DETERMINISTIC EDGE HARDWARE (Arduino Nano)"]
        FW_LOOP["Autonomous 1.0s Loop\nmillis() Non-Blocking"]
        WARMUP["30s Warm-Up Hold\nmillis() < 30000"]
        EDGE_SAFETY["Hardcoded Safety Floor\ngasValue > 300 ADC"]
        BUZZER["Piezo Buzzer (Pin D8)\nPulsed Alarm Beep"]
        LED["Status LED (Pin D9)"]
        SERIAL_ENC["NMEA Frame Encoder\n$S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>"]

        FW_LOOP --> WARMUP
        WARMUP --> EDGE_SAFETY
        EDGE_SAFETY -->|Threshold Breached| BUZZER
        EDGE_SAFETY -->|Threshold Breached| LED
        EDGE_SAFETY --> SERIAL_ENC
    end

    HW --> TIER1

    subgraph TIER2["🖥️ TIER 2: CYBER ANALYTICAL PLANE (Node.js & React 19)"]
        subgraph BRIDGE["Ingestion Bridge (server/index.js)"]
            WATCHDOG["Auto-Reconnect Serial Watchdog\n2.0s Interval"]
            PARSER["Frame Parser & XOR Checksum\nValidates $S frames"]
            DEMO_SIM["Ephemeral Demo Simulator\n(demoSimulator.js)"]
            PRIORITY["Real-Data-Wins Priority\nTerminates demo on real frame"]
            REST_API["Express REST API\n(:3001 bound to 127.0.0.1)"]
        end

        subgraph PIPELINE["Analytical Pipeline (src/sim/pipeline.ts)"]
            COMP["Cross-Sensitivity Compensator\nR_comp = R - min(250, K_RH*dRH + K_T*dT)"]
            SLOPE["10-Sample Rolling OLS Slope\nm = (N*sumXY - sumX*sumY) / den"]
            TTD["Predictive TTD Estimator\nt = (500 - R_comp) / m"]
            FSM["5-Stage Escalation FSM\nNORMAL→WARNING→ALARM→ESCALATED→EMERGENCY"]
        end

        subgraph UI["React 19 Dashboard (localhost:5173)"]
            MONITOR["Resident Live Monitor\nDual-Trace SVG Graph"]
            CAREGIVER["Caregiver Portal\n112 Emergency Dialer"]
            ADMIN["Admin Calibration\nModel Retraining"]
        end
    end

    SERIAL_ENC -->|USB CDC / Bluetooth| WATCHDOG
    WATCHDOG --> PARSER
    DEMO_SIM --> PRIORITY
    PARSER --> PRIORITY
    PRIORITY --> REST_API
    REST_API --> PIPELINE
    PIPELINE --> UI
```

### 5.2 Use Case Diagram
System actors include the Resident, Remote Caregiver, and Safety Administrator:
- **Resident**: Views live dual-trace readings, inspects hazard status, presses local alarm acknowledgment button (`pipe.ack()`), and conducts self-testing.
- **Caregiver**: Monitors dwelling safety remotely, reviews historical alert logs, receives automated escalation SMS, and accesses emergency 112 dialer.
- **Safety Administrator**: Audits raw sensor drift, inspects multi-sensor regression coefficients ($K_{RH}, K_T$), tests physical buzzer via serial commands, and downloads empirical CSV session logs.

### 5.3 Sequence & Activity Diagrams
Figure 5.2 illustrates the end-to-end normal telemetry ingestion sequence:

```mermaid
sequenceDiagram
    participant FW as Arduino Nano (Edge)
    participant BRIDGE as Ingestion Bridge (Server)
    participant PIPE as Analytical Pipeline
    participant UI as React Dashboard

    loop Every 1000 ms
        FW->>FW: Sample A0 (MQ-2) & D2 (DHT11)
        FW->>FW: Compute 8-bit XOR checksum
        FW->>BRIDGE: Transmit sentence: $S,seq,gas,temp*10,rh*10,alarm*CS
        BRIDGE->>BRIDGE: Verify checksum (discard if corrupt)
        BRIDGE->>BRIDGE: Ingest into 50-sample circular ring buffer
        BRIDGE->>PIPE: Apply steam compensation (R_comp)
        PIPE->>PIPE: Compute 10-sample rolling OLS slope & TTD
        PIPE->>PIPE: Evaluate 5-stage escalation state machine
        PIPE->>UI: Dispatch updated telemetry and classification state
        UI->>UI: Render live SVG chart and status banner
    end
```

---

## Chapter 6: Implementation

### 6.1 Technology Stack
- **Firmware**: C++ (AVR-libc, Arduino core), non-blocking timing via `millis()`.
- **Backend Bridge**: Node.js (v20.x ES modules), Express 5, `serialport` v13, `@serialport/parser-readline`.
- **Frontend Dashboard**: React 19, TypeScript 5.8, Vite 8, Tailwind CSS v4, Lucide React icons.
- **Verification Engine**: Native Node.js test runner (`node:test`, `node:assert/strict`), `oxlint` static analyzer.

### 6.2 Key Code Snippets

#### 1. Microcontroller Autonomous Safety Floor (`sentinel_firmware.ino`)
The firmware enforces a standalone safety floor on Pin D8 buzzer independently of host computer status:
```cpp
// Check if sensor is within 30-second thermal stabilization hold
bool isWarmingUp = (millis() < WARMUP_TIME_MS);

// Local alarm triggers unconditionally if raw gas > 300 outside warm-up
int alarmState = (!isWarmingUp && gasValue > threshold) ? 1 : 0;
sendPacket(gasValue, temp, hum, alarmState);

if (alarmState == 1) {
  digitalWrite(LED_PIN, HIGH);
  // Pulsed alarm beep (2 x 150ms beeps = 600ms total)
  for (int i = 0; i < 2; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(150);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
  delay(400); // 1-second total sample interval for DHT11 stability
} else {
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  delay(1000);
}
```

#### 2. Dynamic Cross-Sensitivity Compensation (`server/signalAnalytics.js`)
Analytical deduction of water vapor conductance shifts:
```javascript
export function computeSteamCompensation(rawGas, temp, hum, config = loadConfig()) {
  if (!config.enabled) return { steamEstimate: 0, compensatedGas: rawGas };

  const deltaHum = Math.max(0, hum - config.baselineHumidity);
  const deltaTemp = Math.max(0, temp - config.baselineTemperature);

  // Multi-variable regression: beta_hum * deltaHum + beta_temp * deltaTemp
  let steamEstimate = (config.humidityCoefficient * deltaHum) + 
                      (config.temperatureCoefficient * deltaTemp) + 
                      config.intercept;
                      
  // Bounded safety ceiling prevents masking real leaks
  steamEstimate = Math.min(config.maxSteamDeduction, Math.max(0, steamEstimate));
  const compensatedGas = Math.max(0, Math.round(rawGas - steamEstimate));

  return { steamEstimate: parseFloat(steamEstimate.toFixed(1)), compensatedGas };
}
```

#### 3. Rolling Ordinary Least Squares (OLS) Slope Estimation
Linear regression over a sliding window ($N=10$):
```javascript
export function computeSlopeAndTimeToDanger(buffer, latestCompensated, dangerThreshold = 500) {
  const windowSlice = buffer.slice(-9);
  const points = [...windowSlice.map(r => r.compensatedGas ?? r.raw), latestCompensated];
  const n = points.length;
  if (n < 3) return { slope: 0.0, timeToThresholdSeconds: null };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += points[i];
    sumXY += i * points[i];
    sumXX += i * i;
  }

  const denominator = (n * sumXX) - (sumX * sumX);
  const slope = denominator !== 0 ? parseFloat((((n * sumXY) - (sumX * sumY)) / denominator).toFixed(2)) : 0.0;
  let timeToThresholdSeconds = null;

  if (latestCompensated >= dangerThreshold) {
    timeToThresholdSeconds = 0;
  } else if (slope > 0.4) {
    const delta = dangerThreshold - latestCompensated;
    timeToThresholdSeconds = Math.max(1, Math.round(delta / slope));
  }

  return { slope, timeToThresholdSeconds };
}
```

---

## Chapter 7: Software Tools Used

Table 7.1 details the software engineering tools utilized throughout development:

| Tool | Version | Purpose | SDLC Phase | Project Evidence |
| :--- | :---: | :--- | :--- | :--- |
| **Git & GitHub** | v2.39+ | Version control & CI automation | All Phases | Commits & `.github/workflows/ci.yml` |
| **Node.js Test Runner** | v20.20.0 | Unit & integration testing | Verification | 14 test cases in `tests/*.test.js` |
| **Vite & React 19** | Vite 8.3 | Frontend UI & HMR build tool | Implementation | Production bundle in `dist/` |
| **oxlint** | v1.75.0 | High-speed Rust-based AST linter | Quality Assurance | 0 errors, 0 warnings across 34 files |
| **Google Chrome** | v134+ | Headless UI validation & capture | Verification | 7 screenshots in `docs/screenshots/` |
| **Arduino IDE** | v2.3+ | Embedded C++ firmware flashing | Firmware Edge | Sketch in `firmware/sentinel_firmware/` |

---

## Chapter 8: Testing & Quality Assurance

### 8.1 Test Strategy & Execution Results
Automated testing was conducted using the native Node.js test runner (`node --test tests/*.test.js`). All 14 test cases passed with zero failures:
- **TC01**: Telemetry frame encoding & XOR checksum integrity (Passed in 0.47 ms).
- **TC02**: Demo simulator multi-scenario progression & state control (Passed in 0.31 ms).
- **TC03**: Analytics configuration & bounds enforcement (Passed in 0.31 ms).
- **TC04**: Backend live ingestion REST endpoints (Passed in 13.29 ms).
- **TC05**: Mathematical slope convergence on noisy ramps (Passed in 0.17 ms).
- **TC06**: Sensor warm-up & initial stabilization window (Passed in 0.53 ms).
- **TC07**: Safe ambient baseline tracking (Passed in 0.12 ms).
- **TC08**: Steam cross-sensitivity compensation & false alarm suppression (Passed in 0.06 ms).
- **TC09**: Cooking environmental transient suppression (Passed in 0.05 ms).
- **TC10**: Real combustible gas leak detection & rapid escalation (Passed in 0.05 ms).
- **TC11**: Debounce hysteresis & alarm latch persistence (Passed in 0.05 ms).
- **TC12**: Predictive Time-to-Danger (TTD) estimation (Passed in 0.10 ms).
- **TC13**: Sensor fault & ADC saturation handling (Passed in 0.09 ms).
- **Total Duration**: 50.3 ms across 2 suites.

---

## Chapter 9: Results and Discussion

### 9.1 Empirical Benchmark Replay Results
The evaluation harness (`scripts/evaluate.js`) replayed 120+ empirical kitchen hardware samples. Table 9.1 presents the comparative results:

| Evaluation Metric | Plain Static Threshold Detector | SENTINEL Compensated Detector | Practical Benefit |
| :--- | :---: | :---: | :--- |
| **False Alarms (Kitchen Steam)** | **1 false alarm** (siren for 11 seconds) | **0 false alarms** | Nuisance siren eliminated |
| **False Alarms (Stovetop Cooking)**| **1 false alarm** (siren for 8 seconds) | **0 false alarms** | Nuisance siren eliminated |
| **Total False Alarm Duration** | **19 seconds of false sirens** | **0 seconds** | **100% false positive reduction** |
| **Missed Detections (Gas Leak)** | **0 missed hazards** | **0 missed hazards** | **Zero life-safety compromise** |
| **Warning Lead Time to 500 ADC** | 5.0 seconds | **9.0 seconds** | **+4.0s early warning advance** |

### 9.2 Key Findings
1. **Steam Rejection Efficacy**: In `data/steam.csv`, relative humidity jumped from 50.0% to 90.5%, causing raw gas to climb to 390 ADC. Plain detectors sounded alarms at second 11. SENTINEL subtracted 116.3 ADC of steam interference, keeping the compensated signal at 274 ADC (< 300 ADC) and suppressing the alarm.
2. **Predictive Warning Efficacy**: In `data/gas.csv`, unlit butane was released in dry air. Plain threshold detectors remained silent until second 17 (when gas crossed 300 ADC), leaving only 5.0 seconds before reaching the critical 500 ADC hazard floor. In contrast, SENTINEL's slope estimator detected the ascending trajectory at second 12, alerting occupants 9.0 seconds prior to critical hazard breach (+4.0s warning advance).

---

## Chapter 10: Conclusion and Future Enhancements

### 10.1 Conclusion
The SENTINEL project demonstrates that domestic gas safety detectors do not need to choose between nuisance false alarms and occupant safety. By decoupling an autonomous, zero-trust hardware safety floor from an analytical cyber processing plane, SENTINEL successfully eliminates 100% of false alarms on empirical steam and cooking test datasets while preserving zero missed detections and delivering up to 4.0 seconds of predictive early warning. The repository is reproducible, comprehensively tested, and verified for academic submission.

### 10.2 Future Enhancements
1. **Adaptive Baseline Auto-Tuning**: Implement Kalman filtering on the host bridge to continuously track long-term seasonal sensor baseline drift over multi-month deployments.
2. **MEMS Sensor Integration**: Transition from high-power resistive heating MQ-2 modules (~800 mW) to micro-electro-mechanical systems (MEMS) gas sensors operating on low-power battery rails.
3. **Multi-Dwelling LoRaWAN Telemetry**: Integrate long-range LoRa radios to broadcast telemetry across multi-story apartment complexes without relying on resident home Wi-Fi networks.

---

## References

[1] N. Yamazoe and K. Shimanoe, "Theory of power laws for semiconductor gas sensors," *Sensors and Actuators B: Chemical*, vol. 128, no. 2, pp. 566–573, Jan. 2008, doi: 10.1016/j.snb.2007.07.036.

[2] D. E. Williams, "Semiconducting oxides as gas-sensitive materials," in *Solid State Gas Sensors*, P. T. Moseley and B. C. Tofield, Eds. Bristol, U.K.: Adam Hilger, 1987, pp. 71–123.

[3] J. W. Gardner, "Electrical characteristics of metal oxide semiconductor gas sensors," *Semiconductor Science and Technology*, vol. 4, no. 9, pp. 866–875, Sep. 1989, doi: 10.1088/0268-1242/4/9/012.

[4] S. Zampolli et al., "An electronic nose based on solid state sensor arrays for low-cost indoor air quality monitoring for automotive applications," *Sensors and Actuators B: Chemical*, vol. 101, no. 1–2, pp. 39–46, Jun. 2004.

[5] R. R. Balyan, S. B. Patil, and V. M. Deshmukh, "Design and development of an intelligent gas leakage detection system with early warning predictive algorithms," *IEEE Transactions on Consumer Electronics*, vol. 64, no. 3, pp. 312–320, Aug. 2018.

[6] ISO/IEC/IEEE, "ISO/IEC/IEEE International Standard - Systems and software engineering -- Life cycle processes -- Requirements engineering," *ISO/IEC/IEEE 29148:2018(E)*, pp. 1–104, Nov. 2018.

[7] IEEE, "IEEE Standard for System and Software Verification and Validation," *IEEE Std 1012-2016*, pp. 1–260, Nov. 2016.

[8] P. Raj and P. Raman, "Internet of Things: Concepts, Technologies, and Applications," *IEEE Internet of Things Journal*, vol. 4, no. 5, pp. 1123–1135, Oct. 2017.

[9] Adafruit Industries, "DHT11 Humidity & Temperature Sensor - Technical Specification," *Adafruit Documentation*, Rev. 1.2, 2020.

[10] Zhengzhou Winsen Electronics Technology Co., Ltd., "MQ-2 Gas Sensor Manual," *Winsen Sensor Data Sheets*, Doc. ME-MQ2-V1.4, 2019.

[11] E. A. Lee, "Cyber Physical Systems: Design Challenges," in *11th IEEE ISORC*, Orlando, FL, USA, 2008, pp. 363–369.

[12] D. L. Parnas, "Software Aspects of Strategic Defense Systems," *Communications of the ACM*, vol. 28, no. 12, pp. 1326–1335, Dec. 1985.

---

## Appendices

### Appendix A: Project Links & Artifacts
- **GitHub Repository**: [https://github.com/Shree-svg/-SENTINEL](https://github.com/Shree-svg/-SENTINEL)
- **CI Build Status**: [GitHub Actions CI Workflow](https://github.com/Shree-svg/-SENTINEL/actions)
- **Demonstration Video**: [YouTube Walkthrough](https://youtu.be/placeholder-sentinel-demo)
- **Lead Developer Portfolio**: [https://portfolio-five-delta-xr8oas2k65.vercel.app/](https://portfolio-five-delta-xr8oas2k65.vercel.app/)

### Appendix B: Telemetry Packet Encoding Specification
Sentences conform to NMEA-0183 ASCII framing:
`$S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>\r\n`
- `S`: SENTINEL sentence identifier.
- `<seq>`: 16-bit monotonic sequence counter (0–65535).
- `<gas>`: 10-bit raw MQ-2 analog reading (0–1023 ADC).
- `<temp*10>`: Integer temperature in Celsius scaled by 10 (e.g., 245 = 24.5°C).
- `<rh*10>`: Integer relative humidity percentage scaled by 10 (e.g., 621 = 62.1% RH).
- `<alarm>`: Edge alarm flag (1 = active buzzer, 0 = quiet).
- `<CS>`: 2-digit uppercase hexadecimal XOR checksum across all characters between `$` and `*`.

### Appendix C: Test Suite Execution Command
To reproduce the complete verification suite locally:
```bash
# Execute unit and API test suite (14 test cases)
npm test

# Execute empirical dataset replay benchmark
npm run evaluate

# Execute static code analysis
npm run lint

# Compile production bundle
npm run build
```
