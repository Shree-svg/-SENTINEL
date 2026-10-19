# Software Requirements Specification (SRS)
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Standard**: Conforming to ISO/IEC/IEEE 29148:2018 (Systems and software engineering — Life cycle processes — Requirements engineering)  
**Project Identifier**: SENTINEL-CPS  
**Version**: 1.0.0 (Submission-Grade)  
**Date**: October 19, 2026  
**Author**: Shreedhar Sharma (B.Tech CSE Cyber-Physical Systems, VIT Chennai)  
**Repository**: [https://github.com/Shree-svg/-SENTINEL](https://github.com/Shree-svg/-SENTINEL)

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Purpose](#2-purpose)
3. [Scope](#3-scope)
4. [Definitions, Acronyms, and Abbreviations](#4-definitions-acronyms-and-abbreviations)
5. [Product Perspective](#5-product-perspective)
6. [Product Functions](#6-product-functions)
7. [User Classes and Characteristics](#7-user-classes-and-characteristics)
8. [Operating Environment](#8-operating-environment)
9. [Design and Implementation Constraints](#9-design-and-implementation-constraints)
10. [Assumptions and Dependencies](#10-assumptions-and-dependencies)
11. [Functional Requirements](#11-functional-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [External Interface Requirements](#13-external-interface-requirements)
14. [Hardware Requirements](#14-hardware-requirements)
15. [Software Requirements](#15-software-requirements)
16. [Data Requirements](#16-data-requirements)
17. [Error-Handling Requirements](#17-error-handling-requirements)
18. [Security Requirements](#18-security-requirements)
19. [Safety-Related Constraints](#19-safety-related-constraints)
20. [Acceptance Criteria](#20-acceptance-criteria)
21. [Traceability Matrix](#21-traceability-matrix)

---

## 1. Introduction
Traditional domestic gas safety detectors utilize low-cost tin dioxide ($SnO_2$) metal-oxide semiconductor (MOS) sensors. While sensitive to methane, propane, and butane, MOS sensors exhibit pronounced physical cross-sensitivity to water vapor (humidity) and ambient temperature transients. In residential kitchens, boiling kettles and stovetop cooking routinely trigger nuisance false alarms exceeding static threshold levels. Occupants frequently disable or unplug these sirens, creating catastrophic life-safety hazards. SENTINEL resolves this systemic trade-off through a dual-tier cyber-physical architecture coupling a zero-trust edge hardware safety floor with a multi-sensor analytical compensation pipeline and predictive early warning.

## 2. Purpose
The purpose of this Software Requirements Specification (SRS) is to establish a rigorous, verifiable technical baseline for the engineering, verification, and academic assessment of the SENTINEL system. It specifies functional capabilities, performance criteria, safety invariants, and data models for both the microcontroller edge plane and host cyber analytical services.

## 3. Scope
The SENTINEL system encompasses:
- Microcontroller firmware for the ATmega328P (Arduino Nano) managing raw MQ-2 and DHT11 sampling, local acoustic/visual alarm actuation, and frame serialization with XOR checksums.
- Node.js/Express ingestion bridge with serial auto-reconnect watchdog, protocol parser, and an ephemeral multi-scenario simulation engine.
- Mathematical signal processing algorithms including multi-variable linear regression compensation ($K_{RH}=2.8, K_T=1.2$), 10-sample rolling Ordinary Least Squares (OLS) slope projection, and Time-to-Danger (TTD) estimation.
- 5-stage controlled escalation finite state machine (`NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY`).
- Single-page React 19 web dashboard serving resident monitoring, caregiver emergency dispatch, administrative calibration, and live scenario simulation.

---

## 4. Definitions, Acronyms, and Abbreviations
- **ADC**: Analog-to-Digital Converter (10-bit resolution on ATmega328P, range 0–1023).
- **CPS**: Cyber-Physical System.
- **DHT11**: Resistive humidity and NTC thermistor digital sensor module.
- **FSM**: Finite State Machine.
- **LEL**: Lower Explosive Limit (e.g., 5% vol for Methane, ~2.1% vol for LPG/Propane).
- **MOS**: Metal-Oxide Semiconductor (sensor sensing layer material, typically $SnO_2$).
- **MQ-2**: Broad-spectrum tin-dioxide gas sensor sensitive to LPG, propane, methane, hydrogen, and smoke.
- **OLS**: Ordinary Least Squares regression.
- **RH**: Relative Humidity (expressed as percentage, %).
- **RoC**: Rate of Change (first derivative of telemetry signal per second).
- **TTD**: Predictive Time-to-Danger (estimated seconds remaining until combustible concentration breaches critical hazard floor).
- **UART**: Universal Asynchronous Receiver-Transmitter (serial communication protocol).

---

## 5. Product Perspective
SENTINEL is an autonomous, dual-tier cyber-physical system. It interfaces with physical living spaces via analog/digital transducers and communicates over serial USB CDC and HC-05 Bluetooth links to a local host runtime and remote network observers.

```
+-------------------------------------------------------------------------+
|                         PHYSICAL SENSING LAYER                          |
|         MQ-2 Gas (Pin A0)       |       DHT11 Temp/Humid (Pin D2)       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  TIER 1: DETERMINISTIC EDGE HARDWARE                    |
|    - Microcontroller: Arduino Nano (ATmega328P @ 16 MHz)                |
|    - Local Output: Piezo Buzzer (Pin D8), Visual LED (Pin D9)           |
|    - Hardcoded Edge Safety Floor (300 ADC static threshold)             |
|    - Non-blocking 1.0s loop, 30s boot stabilization hold                |
+------------------------------------+------------------------------------+
                                     | USB CDC / HC-05 UART ($S packets)
                                     v
+-------------------------------------------------------------------------+
|                 TIER 2: HOST CYBER ANALYTICAL PLANE                     |
|    - Ingestion Bridge & Serial Watchdog (Node.js/Express :3001)         |
|    - Environmental Cross-Sensitivity Compensator (R_comp)               |
|    - 10-Sample Rolling OLS Slope Estimator & TTD Predictor              |
|    - 5-Stage Escalation FSM with Debounce & Local Acknowledge           |
|    - Ephemeral Multi-Scenario Simulator (Zero real hardware needed)     |
|    - React 19 Single Page Dashboard (Vite 8, Tailwind CSS v4)          |
+-------------------------------------------------------------------------+
```

---

## 6. Product Functions
1. **Telemetry Acquisition**: Continuous 1.0 Hz edge acquisition of raw gas concentration, ambient temperature, and relative humidity.
2. **Deterministic Edge Sirens**: Autonomous hardware triggering of acoustic buzzer and visual LED whenever raw gas exceeds 300 ADC outside the 30-second boot-up hold.
3. **Cross-Sensitivity Compensation**: Analytical deduction of steam-induced conductance shifts using calibrated humidity and temperature regression gains.
4. **Early Hazard Trajectory Warning**: Computation of instantaneous concentration velocity (+ADC/s) and extrapolation of seconds remaining before reaching critical 500 ADC danger floor.
5. **Controlled Alarm Escalation**: Progressive state transitions with local resident acknowledgment window (15 seconds before caregiver dispatch, 30 seconds before 112 emergency escalation).
6. **Hardware-Independent Demonstration**: Interactive scenario simulation injecting synthetic steam, cooking, gas leaks, and sensor fault frames without risking live sirens or emergency calls.

---

## 7. User Classes and Characteristics
- **Resident / Occupant**: Interacts with the local alarm sirens and wall-mounted dashboard; requires clear, immediate hazard classification banners, audible warnings, and a one-touch local acknowledgment button.
- **Remote Caregiver**: Accesses an asymmetric read-only portal showing dwelling safety status, hazard duration, and one-touch national emergency (112) dialer.
- **Safety Administrator / Maintenance Engineer**: Uses calibration workbench to audit raw sensor drift, inspect multi-sensor regression coefficients, and adjust baseline thresholds.
- **Academic Evaluator / Reviewer**: Validates code reproducibility, runs automated test suites, replays empirical benchmark datasets, and verifies system invariants.

---

## 8. Operating Environment
- **Embedded Hardware**: ATmega328P 8-bit AVR microcontroller running at 16 MHz, 5.0 V regulated rail, operating temperature 0°C to 50°C.
- **Host Runtime**: Node.js v18.0.0+ (tested on Node.js v20.20.0, macOS/Linux/Windows).
- **Web Browser**: Modern ECMAScript 2022+ compliant browser (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge).
- **Communication Link**: USB CDC Virtual COM port or HC-05 Bluetooth SPP operating at 9600 baud, 8-N-1 framing.

---

## 9. Design and Implementation Constraints
- **Zero-Trust Edge Autonomy (CON-01)**: The physical edge safety buzzer must function unconditionally even if the host computer is disconnected, crashed, or halted.
- **No Persistent Database (CON-02)**: In accordance with lightweight edge gateway architecture, runtime state resides in ephemeral ring buffers in server memory.
- **Localhost Network Hardening (CON-03)**: The backend ingestion bridge must bind to `127.0.0.1` by default to prevent unauthorized network exposure on public subnets.
- **Strict Real-Data Priority (CON-04)**: If physical hardware telemetry arrives during simulation, the simulator must terminate instantly and relinquish control to live hardware.

---

## 10. Assumptions and Dependencies
- The MQ-2 sensor requires a minimum 30-second thermal pre-heat window before analog readings stabilize.
- The DHT11 sensor requires a minimum 1.0-second delay between consecutive physical sampling reads.
- Ambient environmental baseline defaults to $RH_0 = 50.0\%$ and $T_0 = 24.0^\circ\text{C}$ in standard indoor residential spaces.

---

## 11. Functional Requirements

### 11.1 Telemetry & Edge Acquisition
- **FR-01 (Sensor Acquisition)**: The microcontroller shall sample MQ-2 analog voltage via Pin A0 and digital environmental data via Pin D2 at a sample interval of $1.0 \pm 0.05\text{ s}$.
- **FR-02 (Warm-Up Hold)**: The microcontroller shall enforce a 30,000 ms initial stabilization period upon cold boot, during which local siren actuation is inhibited.
- **FR-03 (Frame Serialization)**: Telemetry shall be formatted as standard NMEA-style sentences: `$S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>\r\n`.
- **FR-04 (XOR Checksum)**: The microcontroller and host shall compute an 8-bit bitwise XOR across all payload characters between `$` and `*` and validate packet integrity.

### 11.2 Analytical Pipeline & Compensation
- **FR-05 (Dynamic Steam Compensation)**: The cyber plane shall calculate compensated gas concentration:
  $$R_{comp} = R_{raw} - \min(250, \max(0, K_{RH} \cdot (RH - RH_0) + K_T \cdot (T - T_0)))$$
  where $K_{RH} = 2.8\text{ ADC/\%RH}$ and $K_T = 1.2\text{ ADC/°C}$.
- **FR-06 (Rolling Trend Estimation)**: Over a rolling window of $N=10$ samples, the system shall compute the linear regression slope $m$ in units of ADC/s using Ordinary Least Squares.
- **FR-07 (Predictive TTD Calculation)**: When $m > 0.4\text{ ADC/s}$ and $R_{comp} < 500$, the system shall compute Time-to-Danger:
  $$t_{danger} = \text{round}\left(\frac{500 - R_{comp}}{m}\right)\text{ seconds}$$
  If $R_{comp} \ge 500$, $t_{danger} = 0$. In steady or decreasing conditions ($m \le 0.4$), $t_{danger} = \text{null}$.

### 11.3 Alert Handling & Escalation FSM
- **FR-08 (5-Stage Escalation)**: The system shall transition through `NORMAL`, `WARNING`, `ALARM`, `ESCALATED`, and `EMERGENCY`.
- **FR-09 (Debounce Hysteresis)**: An alarm state shall require 3 consecutive samples above threshold before latching, and shall not clear until residual gas drops below 30 ADC.
- **FR-10 (Caregiver & 112 Dispatch)**: If an active alarm remains unacknowledged for 15 seconds, caregiver notification shall trigger. If unacknowledged for 30 seconds, the 112 national emergency prompt shall engage.
- **FR-11 (Local Acknowledgment)**: Occupants shall be able to acknowledge an active alarm locally via the dashboard (`pipe.ack()`), transitioning state to `ACKNOWLEDGED` and halting remote escalation.

### 11.4 Ephemeral Simulation & Sandboxing
- **FR-12 (Scenario Sandbox)**: The host bridge shall provide multi-scenario simulation (`normal`, `steam`, `cooking`, `gas_leak`, `adc_saturation`, `sensor_fault`) without triggering real sirens or external phone calls.

---

## 12. Non-Functional Requirements

| ID | Category | Requirement Statement | Verification Metric |
| :--- | :--- | :--- | :--- |
| **NFR-01** | Performance | Ingestion bridge latency from serial frame receipt to REST dispatch shall not exceed 50 ms. | Benchmark timer $\le 50\text{ ms}$ |
| **NFR-02** | Reliability | The serial watchdog shall auto-reconnect to severed USB serial ports within 4.0 seconds of reattachment. | Test observation ($< 2.5\text{ s}$) |
| **NFR-03** | Accuracy | Cross-sensitivity compensation shall eliminate 100% of false alarms on empirical steam and cooking test datasets. | `npm run evaluate` ($0\text{ FAs}$) |
| **NFR-04** | Timeliness | Predictive slope algorithm shall provide at least $+3.0\text{ s}$ advance warning lead time over static threshold detection. | Benchmark lead time $= 9.0\text{ s vs } 5.0\text{ s}$ ($+4.0\text{ s}$) |
| **NFR-05** | Usability | Web dashboard UI shall adapt responsively to screen viewports from 375 px (mobile) to 1920 px (desktop). | Responsive Chrome viewport test |
| **NFR-06** | Portability | Backend and frontend codebases shall execute across macOS, Ubuntu Linux, and Windows 11 without platform-specific modifications. | Cross-platform Node.js engine |
| **NFR-07** | Maintainability | Source code shall produce zero errors and zero warnings under strict static analysis (`oxlint`). | `npm run lint` (0 errors, 0 warnings) |
| **NFR-08** | Security | Server shall bind exclusively to localhost (`127.0.0.1`) and enforce CORS origin whitelist matching local development origins. | Network socket audit |

---

## 13. External Interface Requirements
- **Hardware Bus**: Analog input pin A0 (MQ-2 analog voltage), Digital I/O pin D2 (DHT11 single-wire bus).
- **Actuator Outputs**: Digital output pin D8 (piezo buzzer PWM/digital pulse), Digital output pin D9 (high-intensity red LED indicator).
- **Host Communications**: USB CDC serial port (`/dev/tty.usbserial-*`, `/dev/ttyUSB*`, `COM*`), baud rate 9600, 8 data bits, no parity, 1 stop bit.
- **REST Endpoints**: HTTP JSON API exposed on `http://127.0.0.1:3001` including `/api/readings/latest`, `/api/readings/history`, `/api/alerts`, `/api/hardware/status`, and `/api/demo/scenario`.

---

## 14. Hardware Requirements
1. Microcontroller Development Board: Arduino Nano (ATmega328P, 16 MHz, 32 KB Flash, 2 KB SRAM).
2. Gas Sensor: MQ-2 Combustible Gas and Smoke Detector module ($SnO_2$ sensing substrate).
3. Climate Sensor: DHT11 Temperature & Relative Humidity module.
4. Acoustic Actuator: 5V Active Piezo Buzzer ($85\text{ dB}$ at 10 cm, $100\,\Omega$ series protection).
5. Visual Actuator: 5mm High-Intensity Red LED ($330\,\Omega$ current-limiting resistor).
6. Wireless Interface: HC-05 Bluetooth 2.0+EDR serial module ($9600\text{ baud}$).
7. Host Workstation: x86_64 or Apple Silicon ARM64 computer with USB 2.0+ port.

---

## 15. Software Requirements
1. Edge Toolchain: Arduino IDE v2.x or Arduino CLI with AVR-GCC toolchain and Adafruit DHT Sensor Library.
2. Server Runtime: Node.js (v18.0.0 LTS or higher).
3. Dependency Management: npm (v9.0.0 or higher).
4. Frontend Build System: Vite v8.x with TypeScript v5.8+ and React v19.x.
5. Static Analysis: oxlint (v1.75+).
6. Testing Framework: Node.js native test runner (`node:test`, `node:assert/strict`).

---

## 16. Data Requirements
- Telemetry records maintain: `seq` (uint16), `raw` (uint16), `gas` (uint16), `temperature` (float), `humidity` (float), `alarm` (bool), `compensatedGas` (uint16), `steamEstimate` (float), `slope` (float), and `timeToThresholdSeconds` (uint16 or null).
- In-memory ring buffer depth: 50 telemetry samples in backend server; 30 samples in frontend client pipeline.
- Session logs exportable to standard RFC 4180 CSV via `server/recorder.js`.

---

## 17. Error-Handling Requirements
- **ERR-01 (Sensor Flatline)**: If MQ-2 analog reading remains identical for 15 consecutive samples or saturates at 0/1023, report `status: failure` and generate diagnostic alert.
- **ERR-02 (DHT11 Disconnection)**: If DHT11 reports 0.0°C / 0.0% RH or out-of-bounds metrics, fall back to safe zero-deduction mode ($R_{comp} = R_{raw}$) and notify user.
- **ERR-03 (Corrupted Serial Frames)**: Discard any serial packet failing 8-bit XOR checksum verification without updating system state.
- **ERR-04 (Serial Port Loss)**: On hardware disconnection, the backend watchdog shall smoothly transition to search state without crashing or dropping web clients.

---

## 18. Security Requirements
- **SEC-01 (Zero External Ingress)**: The ingestion bridge binds to `127.0.0.1` by default; remote network binding requires explicit environment configuration.
- **SEC-02 (CORS Whitelisting)**: Cross-Origin Resource Sharing is strictly constrained to authorized local development dashboard origins (`localhost:5173`, `localhost:3000`).
- **SEC-03 (Credential Isolation)**: No hardcoded credentials or API keys exist in source code; `.env.example` provides safe parameter templates.

---

## 19. Safety-Related Constraints
- **SAF-01 (Zero-Trust Edge Priority)**: Software compensation on the cyber host shall NEVER inhibit, delay, or override the physical microcontroller buzzer on Pin D8.
- **SAF-02 (Deduction Ceiling)**: Multi-sensor steam deduction is mathematically bounded to a ceiling of $250\text{ ADC}$ to prevent masking genuine high-concentration leaks.
- **SAF-03 (Simulation Sandboxing)**: Synthetic simulation shall NEVER initiate physical phone calls to emergency dispatch (112) or trigger real hardware buzzers.

---

## 20. Acceptance Criteria
1. `npm test` executes cleanly with 100% pass rate across all unit and API test cases (TC01–TC13).
2. `npm run evaluate` confirms 0 false alarms on `steam.csv` and `cooking.csv`, 0 missed detections on `gas.csv`, and $\ge 4.0\text{ s}$ warning advance.
3. `npm run lint` finishes with 0 errors and 0 warnings.
4. `npm run build` compiles production assets in under 1.0 second.
5. All interactive UI views render with zero console errors.

---

## 21. Traceability Matrix

| Requirement ID | Module / Component | Verification Test Case | Implementation Status |
| :--- | :--- | :--- | :---: |
| **FR-01** | `sentinel_firmware.ino` | Physical pin sampling / static analysis | Implemented & Verified |
| **FR-02** | `sentinel_firmware.ino` | TC06 (Warm-Up Hold Test) | Implemented & Verified |
| **FR-03** | `sentinel_firmware.ino`, `demoSimulator.js` | TC01 (Frame Format Test) | Implemented & Verified |
| **FR-04** | `server/index.js`, `demoSimulator.js` | TC01 (XOR Checksum Test) | Implemented & Verified |
| **FR-05** | `server/signalAnalytics.js`, `pipeline.ts` | TC08, TC09 (Steam Compensation Test) | Implemented & Verified |
| **FR-06** | `server/signalAnalytics.js`, `pipeline.ts` | TC05, TC12 (OLS Slope Test) | Implemented & Verified |
| **FR-07** | `server/signalAnalytics.js`, `pipeline.ts` | TC12 (TTD Predictor Test) | Implemented & Verified |
| **FR-08** | `src/sim/pipeline.ts` | TC10, TC11 (FSM Escalation Test) | Implemented & Verified |
| **FR-09** | `src/sim/pipeline.ts` | TC11 (Debounce Hysteresis Test) | Implemented & Verified |
| **FR-10** | `src/sim/pipeline.ts`, `CaregiverView.tsx` | Escalation stepper verification | Implemented & Verified |
| **FR-11** | `src/sim/pipeline.ts`, `LiveStatusPanel.tsx`| Client `pipe.ack()` test | Implemented & Verified |
| **FR-12** | `server/demoSimulator.js`, `SimulationPanel.tsx`| TC02 (Simulator Scenario Test) | Implemented & Verified |
| **NFR-03** | `scripts/evaluate.js` | Empirical Benchmark Replay | Implemented & Verified |
| **NFR-04** | `scripts/evaluate.js` | Benchmark Lead Time Analysis | Implemented & Verified |
| **NFR-07** | Entire repository | `npm run lint` (oxlint) | Implemented & Verified |
| **NFR-08** | `server/index.js` | Socket audit & localhost binding | Implemented & Verified |
