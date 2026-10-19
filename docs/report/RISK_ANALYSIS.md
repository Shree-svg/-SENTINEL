# Cyber-Physical Risk Analysis & Safety Management
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/RISK_ANALYSIS.md`  
**Version**: 1.0.0 (Submission-Grade)  
**Author**: Shreedhar Sharma (B.Tech CSE CPS, VIT Chennai)  
**Classification**: Cyber-Physical Systems (CPS) Safety Analysis  

---

## 1. Safety Philosophy & Zero-Trust Architecture

Residential gas leak detectors are safety-critical cyber-physical systems. A software failure in a typical consumer application results in inconvenience; a failure in a gas safety system can result in asphyxiation, catastrophic structure fires, or vapor cloud explosions.

SENTINEL operates under a **Zero-Trust Safety Architecture**:
1. **Never Trust the Host Software**: The physical edge microcontroller (Arduino Nano ATmega328P) maintains an autonomous, hardcoded safety loop. If gas concentrations exceed 300 ADC outside the boot warm-up hold, local sirens (Piezo Buzzer Pin D8, Status LED Pin D9) sound unconditionally. A crash in the Node.js bridge, operating system panic, or network disruption can **never** silence the physical hardware alarm.
2. **Never Mask a Hazardous Hazard**: Multi-sensor steam compensation is strictly bounded by a hard mathematical ceiling ($250\text{ ADC}$ maximum deduction). In genuine high-concentration releases ($\ge 500\text{ ADC}$), the hazard floor overrides all compensation, ensuring sirens cannot be suppressed.
3. **Never Confuse Simulation with Physical Reality**: Synthetic demonstration mode streams isolated data frames, clearly watermarked in the user interface, with telephony dispatch actions sandboxed into UI toasts. Live sensor packets immediately preempt and terminate demo mode.

---

## 2. Risk Evaluation Matrix

Risks are categorized across Likelihood (1: Rare to 5: Frequent) and Severity/Impact (1: Negligible to 5: Catastrophic).

| Likelihood \ Impact | 1 - Negligible | 2 - Minor | 3 - Moderate | 4 - Critical | 5 - Catastrophic |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **5 - Frequent** | Medium | High | High | Extreme | Extreme |
| **4 - Probable** | Low | Medium | High | Extreme | Extreme |
| **3 - Occasional** | Low | Low | Medium | High | Extreme |
| **2 - Remote** | Low | Low | Low | Medium | High |
| **1 - Improbable**| Low | Low | Low | Low | Medium |

---

## 3. Comprehensive Risk Register & FMEA

| Risk ID | Hazard / Failure Mode | Root Cause | Initial Risk | Mitigation Strategy | Verification Method | Residual Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **RSK-01** | Gas leak masked during cooking | Aggressive steam compensation over-subtracting raw gas | **Extreme** (2, 5) | Bounded steam deduction ceiling ($\max 250\text{ ADC}$); uncompensated bypass if $R_{raw} \ge 500\text{ ADC}$; 10-sample slope detection triggers warning regardless of humidity. | TC10, `data/gas.csv` benchmark evaluation | **Low** (1, 3) |
| **RSK-02** | Host PC crash silences siren | Operating system freeze, USB disconnection, power outage | **Extreme** (3, 5) | Microcontroller runs autonomous C++ loop directly actuating Pin D8 buzzer without waiting for host handshake. | Hardware disconnection test; code review of `sentinel_firmware.ino` | **Low** (1, 2) |
| **RSK-03** | Sensor analog flatline / freeze | Sensor pin detachment, cold solder joint, or ADC latch-up | **High** (2, 4) | Sensor health diagnostics inspect sliding window; 15 consecutive identical readings or 0/1023 ADC trigger `SENSOR_FAULT` alert. | TC13 (Flatline & Saturation Unit Test) | **Low** (1, 2) |
| **RSK-04** | DHT11 digital bus failure | Loose jumper on Pin D2, timing desynchronization | **Medium** (3, 3) | Check for `isnan()` or 0.0°C / 0.0% RH; fall back to safe zero-deduction mode ($R_{comp} = R_{raw}$); surface health warning. | TC13 (DHT11 Failure Test) | **Low** (1, 1) |
| **RSK-05** | Serial transmission corruption | Electrical noise, ground loop, baud rate jitter | **Medium** (3, 3) | 8-bit XOR checksum appended to every `$S` sentence; mismatch results in immediate frame discard. | TC01 (Checksum & Packet Corruption Test) | **Low** (1, 1) |
| **RSK-06** | Simulation mistaken for live emergency | Caregiver receives simulated alert thinking dwelling is on fire | **High** (2, 4) | Distinct UI banner ("DEMO MODE ACTIVE"); all real SMS and 112 phone triggers suppressed; visual toast only. | UI inspection & unit test TC02 | **Low** (1, 1) |
| **RSK-07** | Inadvertent 112 emergency call | User clicks 112 dialer during demonstration | **High** (2, 4) | Caregiver emergency button requires multi-step modal confirmation; simulated mode replaces dialer with educational alert. | Code audit of `CaregiverView.tsx` | **Low** (1, 1) |
| **RSK-08** | Unauthorized network tampering | Bridge exposed to shared campus/hostel Wi-Fi | **Medium** (3, 3) | Express server binds exclusively to `127.0.0.1` by default; CORS restricted to localhost dashboard origins. | Socket audit (`netstat`) & CORS test | **Low** (1, 1) |
| **RSK-09** | Sensor thermal warm-up false siren | Tin-dioxide sensor power-up transient | **Medium** (4, 2) | Microcontroller enforces 30,000 ms warm-up hold where buzzer actuation is locked out. | TC06 (Warm-Up Stabilization Test) | **Low** (1, 1) |
| **RSK-10** | Empirical benchmark non-reproducibility | Labeled dataset formatting discrepancies | **Medium** (2, 3) | Benchmark runner committed to repository (`scripts/evaluate.js`); replayed automatically in CI workflow. | `npm run evaluate` & GitHub Actions log | **None** (1, 1) |

---

## 4. In-Depth Failure Mode Analysis

### 4.1 Hazard RSK-01: Risk of Gas Leak Masking During High Humidity
- **Scenario**: An occupant is boiling water in a kettle (RH = 85%) when a propane leak occurs concurrently.
- **Vulnerability**: If the algorithm unconditionally subtracted conductance proportional to humidity without bounding, a real gas leak ramping from 200 to 450 ADC might be reduced below the 300 ADC threshold.
- **Fail-Safe Mechanism**:
  1. *Ceiling Constraint*: The maximum allowable steam deduction is clamped at $250\text{ ADC}$. Even with 100% relative humidity, the algorithm can never subtract more than 250 units.
  2. *Critical Floor Override*: If raw gas reaches the dangerous concentration of $500\text{ ADC}$, the system bypasses compensation and initiates immediate emergency escalation.
  3. *Slope Rate Discrimination*: Steam bursts exhibit rapid transient surges followed by humidity plateauing, whereas genuine leaks exhibit continuous positive gas rate of change with flat humidity slope.

### 4.2 Hazard RSK-02: Loss of Host Communication
- **Scenario**: The USB cable is unplugged, or the Node.js server process runs out of memory.
- **Vulnerability**: If the acoustic buzzer relied on an HTTP command or serial trigger from the computer, occupants would be left completely unprotected.
- **Fail-Safe Mechanism**:
  - The buzzer actuation logic in `sentinel_firmware.ino` resides directly in the microcontroller's `loop()` routine:
    ```cpp
    int alarmState = (!isWarmingUp && gasValue > threshold) ? 1 : 0;
    if (alarmState == 1) {
      digitalWrite(LED_PIN, HIGH);
      // Pulsed acoustic buzzer alarm (2 x 150ms beeps)
      for (int i = 0; i < 2; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(150);
        digitalWrite(BUZZER_PIN, LOW);
        delay(150);
      }
    }
    ```
  - This execution is 100% autonomous and requires zero external clock or network connectivity.

---

## 5. Residual Risk Assessment & Field Limitations
While SENTINEL significantly enhances domestic gas safety over standard commercial detectors, the following limitations remain documented:
1. **Physical Sensor Drift**: Metal-oxide sensors drift over months of operation due to surface contamination and sulfur poisoning. SENTINEL provides an Administrative Calibration workbench, but periodic sensor recalibration or replacement is physically required every 12–24 months.
2. **Local Siren in Heavy Steam**: Under dense steam exceeding $300\text{ ADC}$, the autonomous edge hardware may sound the local buzzer while the cyber dashboard correctly classifies the event as `STEAM SUPPRESSED`. This asymmetry is an intentional fail-safe design decision prioritizing zero false negatives over zero nuisance sirens at the physical edge.
