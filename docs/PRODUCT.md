# 🛡️ SENTINEL – Product Specification & Clinical/Academic Requirements

**Surface Type:** Cyber-Physical Gas Safety Monitoring System & Telemetry Dashboard  
**Audience:** Academic Reviewers (VIT Chennai), Field Responders, Caregivers, and Residential Occupants  
**Voice & Tone:** Calm, safety-first, data-dense, highly legible, and reassuring under high-stress emergency conditions.

---

## 1. Problem Statement & Motivation

Residential gas detectors typically rely on low-cost metal-oxide semiconductor ($SnO_2$) sensors (e.g., MQ-2, MQ-4). These sensors exhibit non-linear cross-sensitivity to ambient temperature ($T$) and relative humidity ($RH$).

In real kitchens:
- Boiling water, cooking, or high humidity causes rapid transient swings in sensor conductance.
- Simple fixed-threshold detectors sound loud, panic-inducing alarms during everyday benign activities.
- Occupants suffer from **Alarm Fatigue** and frequently unplug or silence detectors, directly causing preventable fatalities during genuine gas leaks.

**SENTINEL solves this crisis by mathematically suppressing false alarms from cooking steam while maintaining a non-negotiable physical safety floor.**

---

## 2. Core Value Propositions

### 2.1 Environmental Steam Rejection (Zero False Alarms)
Using real-time humidity and thermal cross-sensitivity compensation ($K_{RH} = 5.2, K_T = 1.5$), SENTINEL differentiates rapid moisture surges ($\Delta RH / \Delta t$) from genuine hydrocarbon gas accumulation. Everyday cooking steam is classified as `steam suppressed` without sounding sirens.

### 2.2 Predictive Early Warning (+4.0s Lead Time)
Using a 10-sample rolling least-squares slope estimator, the system tracks gas ascent trajectory and computes **Time-to-Danger (TTD)**. Occupants receive actionable predictive warnings seconds *before* gas concentrations breach critical combustion thresholds.

### 2.3 5-Stage Controlled Escalation & Caregiver Integration
Instead of jumping directly from quiet to full panic, SENTINEL steps through a predictable 5-stage state machine:
1. `NORMAL` (Safe baseline)
2. `WARNING` (10s sustained gas elevation)
3. `ALARM` (Immediate physical buzzer actuation)
4. `ESCALATED` (15s unacknowledged → Caregiver SMS dispatch)
5. `EMERGENCY` (30s unacknowledged → National Emergency 112 dispatch)

Occupants have a local **Acknowledge** button to confirm triage and prevent unnecessary external emergency dispatches when a minor situation is already under control.

### 2.4 Deterministic Fail-Safe Hardware Boundary
The software dashboard and AI analytics supplement, but never replace, certified physical safety standards. The Arduino Nano microcontroller runs an autonomous 1.0-second actuation loop on Pin `D8` that triggers the physical buzzer if gas breaches safety thresholds, even if the computer is turned off, disconnected, or frozen.

---

## 3. Interactive Demonstration & Evaluation Suite

### 3.1 Ephemeral "Demo Readings" Simulator
For live demonstrations, academic viva examinations, and user training without flammable gases:
- Header toggle switch allows streaming synthetic telemetry across 6 realistic scenarios:
  - **Normal Baseline**: Stable ambient conditions with realistic sensor noise.
  - **Boiling Kettle / Steam**: Rapid humidity spikes testing false alarm suppression.
  - **Cooking Steam & Heat**: Coupled temperature and humidity shifts.
  - **Combustible Gas Leak**: Fast-rising gas concentration demonstrating predictive escalation.
  - **ADC Saturation**: Extreme hazard scenario testing peak safety trip limits.
  - **Sensor Fault**: Disconnected or erratic sensor lines demonstrating fail-safe detection.
- **Strict Real-Data Priority**: If a physical Arduino sends telemetry while demo mode is running, simulation immediately aborts to ensure genuine physical safety is never compromised.
- **Simulation Action Sandboxing**: Emergency calls and SMS dispatches are simulated on-screen as toast notifications, preventing accidental real-world emergency dispatching during demonstrations.

### 3.2 Empirical Replay Benchmark Suite
The project includes a replay benchmark harness (`npm run evaluate`) that runs historical scenario datasets (`data/`) through both a standard naive threshold detector and the SENTINEL compensated pipeline:
- **False Alarm Rate**: Reduced from 2 false alarms down to **0** (-100% false positive reduction).
- **Missed Detection Rate**: **0%** missed leaks across all datasets.
- **Early Warning Lead Time**: Delivers up to **+4.0 seconds** of advance warning over static thresholds.

---

## 4. UI/UX Design System Guidelines

- **Palette**: Dark cybernetic slate theme (`#0f172a`, `#1e293b`) with semantic status indicators:
  - Safe: Emerald Green (`#10b981`)
  - Suppressed / Steam: Cyan / Sky Blue (`#0284c7`)
  - Warning: Amber (`#f59e0b`)
  - Critical Alarm / Emergency: Crimson Red (`#ef4444`)
- **Typography**: Clean, monospace telemetry indicators with high-contrast tabular figures for rapid comprehension during low-visibility emergencies.
- **Accessibility**: Meets WCAG 2.1 AA contrast requirements across all status cards and chart traces.
- **Persistent Safety Disclaimer**: Prominently displays: *“This system supplements, not replaces, certified gas-safety practice.”*
