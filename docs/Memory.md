# Memory — decision log and persistent project context

This file is the single source of truth for *why* things are the way they are. When `prd.md`, `architecture.md`, or `Design.md` diverge from the original SRS, the reasoning lives here — not scattered across chat history or code comments.

## 1. Foundational documents

- Full requirements baseline: SRS v1.0, "Adaptive Gas Leak Detection and False-Alarm Reduction System," 17 July 2026 — Shreedhar Sharma, VIT Chennai.
- This file set (`prd.md`, `architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`) governs the prototype build and takes precedence over the SRS wherever they conflict, provided the divergence is logged below.

---

## 2. Decision log

| Date/Context | Decision | Rationale | Impact | Reversibility |
|---|---|---|---|---|
| Architecture definition | Decoupled two-tiered safety architecture | Decouple local hardware alarming (firmware loop) from software classification (ML engine). | Hardware safety alarming operates with zero reliance on backend server uptime, serial status, or classification latency. | **Non-negotiable core principle.** Cannot be reversed; it is the fundamental safety invariant of the entire system. |
| Prototype scoping | Arduino Nano (ATmega328P) instead of ESP32 | Cost — no ESP32 on hand, budget constrained. Nano operates on native 5V logic matching the MQ2 sensor, eliminating logic-level shifters. | Tethered USB build instead of wireless. | Reversible: swap board for ESP32/ESP8266; backend ingestion protocol remains identical. |
| Prototype scoping | USB CDC serial (9600 baud) instead of WiFi/MQTT/HTTP | No WiFi module owned; laptop is the backend host. | Transport replaced with newline-delimited JSON over USB serial. | Reversible: replace `serialport` module in Node.js with an MQTT broker or HTTP endpoint; downstream pipeline unchanged. |
| Sensor suite expansion | DHT11 (temp/humidity) added alongside MQ2 | Single-gas sensing could not differentiate gas leaks from aerosol clouds or steam. DHT11 rate-of-change (ΔHUM/Δt) provides the discriminating signal: aerosol events spike both gas and humidity simultaneously; genuine leaks show sustained gas rise with stable climate readings. | Feature vector extended from 3 to 7 inputs. `readings` schema gains `temp` and `hum` fields. Classifier retrained on 7-variable vector. | Permanent enhancement to the SRS feature vector specification. |
| Prototype scoping | MQ2 + DHT11 only, no MQ4 | No MQ4 sensor available; no legal/safe access to methane in a hostel. DHT11 substitutes as a second sensing dimension for interference discrimination. | Multi-gas fusion deferred. | Reversible: add MQ4, extend feature extraction with multi-sensor ratios per REQ-ML-1. |
| Hardware power protection | 100Ω inline resistor on active buzzer (D8) | Simultaneous MQ2 heater element (~150–180mA) and unthrottled buzzer (~120mA peak) approached ~350mA+ total with inductive switching spikes, exceeding the USB 2.0 500mA limit. This caused voltage sags triggering the host USB over-current protection and dropping the virtual COM port. The 100Ω resistor limits buzzer current to ~20mA while maintaining audibility. | Eliminates USB bus resets during alarm states. Required hardware change — must be verified physically before alarm testing. | Permanent hardware requirement. |
| Ingestion resilience | Auto-reconnect watchdog in Node.js backend | Physical cable movement or power dips from buzzer switching caused the host process to drop the serial handle, silently stopping ingestion without crashing Express. | Serial listener monitors disconnect events and retries port binding every 2 seconds automatically. | Permanent software pattern; improves backend uptime regardless of transport layer. |
| Calibration proxy protocol | Controlled substitute substances for ML training | Real gas leaks and pure methane are unsafe and inaccessible in a residential/hostel setup. | Uses unlit butane lighter gas (leak proxy) and hairspray/sanitizer/steam (interference proxies). These produce real, distinguishable signal shapes without real hazards. | Phase-specific workaround. Should be revisited when certified calibration gas equipment is available. |
| Dashboard Architecture | Complete React + Vite + Tailwind v4 Dashboard with simulation sandbox | Provide full 6-screen dashboard covering live telemetry, alert audit trail, explainability drawer, caregiver read-only portal, calibration annotation, and multi-channel notification engine. | Enables immediate end-to-end evaluation with live hardware and standalone demo testing. | Complete & Delivered. |

---

## 3. Hardware constraint and tradeoff analysis

### 3.1 Power budget and electrical constraints

- **Host USB 2.0 power limit:** 500mA continuous at +5V.
- **Component power breakdown:**
  - Arduino Nano: ~30mA
  - MQ2 heater element: ~150–180mA (continuous)
  - DHT11 sensor: ~1.5mA (during sample conversion)
  - Active buzzer, unrestricted: up to 120mA peak
  - Status LED: ~15mA
- **Failure mode identified:** Without current limiting, total peak draw approached ~350mA+ with inductive switching spikes from the buzzer. This induced transient voltage sags on the 5V bus, triggering the host computer's USB over-current protection and dropping the virtual COM port — silently halting serial ingestion during the exact moment an alarm fires.
- **Resolution:** A 100Ω series resistor on D8 reduces buzzer current to ~20mA, completely eliminating USB bus resets while maintaining sufficient acoustic output.

### 3.2 Sensor dynamics and feature engineering rationale

- **MQ2 sensor warm-up:** The MQ2 uses a SnO2 semiconductor surface requiring ~30–60 seconds to stabilize after power-on. Raw thresholding during this warm-up period causes false alerts on cold boots — one reason fixed-threshold systems are unreliable.
- **Rate-of-change differential as the core discriminator:**
  - *Aerosols and steam:* Produce an instantaneous large positive gas delta (ΔGAS/Δt >> 0) coupled with a simultaneous positive humidity delta (ΔHUM/Δt >> 0).
  - *Accumulating gas leak:* Produces a sustained, steady upward slope in gas concentration (ΔGAS/Δt > 0) while temperature and humidity remain stable (ΔHUM ≈ 0, ΔTEMP ≈ 0).
  - *Feature vector integration:* Extraction over a 10-second rolling window captures these dynamic signatures, enabling high-accuracy linear separation in Random Forest and SVM classifiers without requiring deep learning.

---

## 4. Rejected alternatives

### 4.1 Nano + ESP8266 (ESP-01) WiFi serial bridge
- **Option evaluated:** Wire an ESP-01 to the Nano's hardware serial pins to enable wireless MQTT communication.
- **Reason for rejection:** Requires a 3.3V low-dropout (LDO) voltage regulator (ESP8266 draws up to 300mA during TX), logic-level converters (5V to 3.3V), and introduces dual-firmware complexity. USB CDC serial delivers identical telemetry to the local Node.js backend without adding hardware failure points. Left as the documented upgrade path in `architecture.md` §6.

### 4.2 Deep learning / LSTM recurrent neural networks
- **Option evaluated:** TensorFlow-based LSTM network to model temporal gas concentration sequences.
- **Reason for rejection:** Violates SRS §2.5 non-functional requirement for model interpretability and low inference latency. Random Forest and SVM provide deterministic decision boundaries, run lightweight inference within Node.js, and output explicit feature weights suitable for plain-language factor generation (REQ-ML-4). LSTMs are opaque and would make the `factors` output arbitrary.

---

## 5. Carried-over TBDs (from SRS Appendix C)

- **TBD-1 (Classifier finalization):** Final selection between Random Forest and SVM completed with 7-feature vector and confidence floor enforcement at 75%.
- **TBD-2 (Multi-node scaling):** Topology scaling beyond a single tethered node is deferred to post-prototype revisions.
- **TBD-3 (Cellular/GSM fallback):** Out of scope for both SRS v1.0 and the current prototype; simulated via SMS dispatch hook in settings.
- **TBD-4 (MQ4/multi-gas fusion):** Deferred pending sensor availability — see decision log above.
- **TBD-5 (Sensor poisoning and long-term calibration drift):** MQ2 surface contamination from silicone sprays or heavy organic vapors requires periodic baseline resets. Firmware supports serial `set_threshold` commands for manual adjustment, supported via Admin Calibration UI.

---

## 6. Non-negotiable system invariants

These restate `Rules.md` §1 for visibility — they are the single most important constraints on the project:

1. **Software non-interference with physical safety:** No classification model output, alert escalation rule, or backend state is permitted to override, delay, or silence the local hardware buzzer and LED when the MQ2 raw reading exceeds the firmware safety threshold.
2. **Cautious defaulting rule:** When classifier confidence falls below `CONFIDENCE_FLOOR` (default 0.75), the pipeline must override the label to `Genuine Leak`. The cautious label is always the safe direction.
3. **Hardware power integrity:** The 100Ω resistor on the buzzer must be physically present and verified on the board before any alarm-state test. An unprotected buzzer can cause the USB serial port to drop at the exact moment it is most needed.
4. **Modular protocol independence:** Feature extraction and classification modules must consume generic telemetry structs and remain entirely agnostic to whether data arrived via USB serial or a wireless network protocol.

---

## 7. Delivery & Completion Milestones (Loops 0 – 7)

- **Loop 0 (Architecture & Spec):** Spec, system data flow, schema, and tasks completed.
- **Loop 1 (Foundation):** TypeScript models, REST client, and Shell setup completed.
- **Loop 2 (Live Status Panel):** Real-time gauge, SVG trend sparklines, climate cards, and low-confidence override banner completed.
- **Loop 3 & 4 (Alert History & Contributing Factors):** Filterable table, acknowledgment workflow, and slide-in decision explainability drawer completed.
- **Loop 5 (Caregiver View):** Role-gated read-only caregiver portal and resident consent management completed.
- **Loop 6 (Notification Engine):** Web Notifications API, 2.8kHz piezo buzzer synthesis, repeat escalation timers, and quiet-hour scheduling completed.
- **Loop 7 (6-Pillar Quality Audit & Production Release):** Verified zero compile errors, WCAG 2.1 AA accessibility contrast, responsive layout, and universal safety disclaimer enforcement.
