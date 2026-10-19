# 🎨 SENTINEL – Design System & UI Specification

The **SENTINEL** web application is an edge-first, safety-critical cyber-physical telemetry dashboard. The design system prioritizes high-contrast legibility, cognitive calm under emergency distress, explainable visual feedback, and strict distinction between simulated demo runs and real hardware states.

---

## 1. Typography & Hierarchy

- **Primary Font**: [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts (loaded in `index.html`).
- **Telemetry & Numbers**: Monospaced tabular numerals (`font-mono`) to prevent visual jitter during live 1.0 Hz data streaming.
- **Hierarchy**:
  - `text-2xl` / `text-3xl` (`font-bold`): High-level system classification state (`SAFE`, `STEAM SUPPRESSED`, `GAS LEAK DETECTED`).
  - `text-xl` / `font-semibold`: Key numeric telemetry readouts (Compensated Gas Residual, TTD, Humidity, Temperature).
  - `text-sm` / `text-xs`: Secondary metadata, timestamp badges, and engineering units (ADC, %RH, °C).

---

## 2. Semantic Color Palette

The interface utilizes a sleek dark-slate aesthetic (`#0f172a` / `#1e293b`) tailored for low-light residential kitchens, with high-visibility semantic status accents:

| Semantic State | Tailwind Token | Hex Code | Visual Meaning & Role |
| :--- | :--- | :--- | :--- |
| **Normal / Safe** | `text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/30` | `#10b981` | Quiescent ambient air; gas residual below baseline trigger level. |
| **Steam Suppressed** | `text-sky-400`, `bg-sky-500/10`, `border-sky-500/30` | `#0284c7` | High moisture/vapor detected; mathematical cross-sensitivity actively suppressing false alarm. |
| **Warning / Elevated** | `text-amber-400`, `bg-amber-500/10`, `border-amber-500/30` | `#f59e0b` | Sustained gas rise or impending threshold breach; proactive monitoring active. |
| **Critical Alarm / Emergency**| `text-red-400`, `bg-red-500/10`, `border-red-500/30` | `#ef4444` | Gas leak confirmed or physical safety floor breached; sirens active, caregiver/112 alerted. |
| **Sensor Fault** | `text-purple-400`, `bg-purple-500/10`, `border-purple-500/30` | `#a855f7` | Disconnected sensor, invalid ADC read, or out-of-range sensor condition. |
| **Neutral Surface** | `bg-slate-900`, `bg-slate-800`, `border-slate-700` | `#0f172a` – `#334155` | Base background and high-contrast card elevation. |

---

## 3. Core UI Components & Views

All frontend components are located in `src/components/`:

### 3.1 Application Shell (`Shell.tsx`)
- Persistent navigation header with connection status beacon (Live Hardware vs. Disconnected).
- Navigation tabs for switching between **Resident Dashboard**, **Alert History**, **Caregiver Portal**, **Calibration Workbench**, and **Notification Settings**.
- **Demo Readings Toggle**: Standalone switch allowing simulated telemetry injection, automatically disabled with a hardware lock if a real Arduino connects.

### 3.2 Live Status Panel (`LiveStatusPanel.tsx`)
- **Classification Hero Banner**: Dynamic status display with pulse animations for critical hazard states.
- **Dual-Trace SVG Chart**: Real-time rendering of Raw ADC vs. Compensated Residual over time with threshold lines (300 ADC alarm, 500 ADC danger floor).
- **5-Stage Escalation Stepper**: Visual progression indicator (`NORMAL → WARNING → ALARM → ESCALATED → EMERGENCY`) with live countdown timers.
- **Local Acknowledgment Action**: Instant triage button (`pipe.ack()`) enabling the resident to silence software escalation if the condition is already resolved.

### 3.3 Explainable AI: Contributing Factors (`ContributingFactors.tsx`)
- Slide-out drawer breaking down real-time mathematical decisions:
  - Instantaneous ambient humidity ($\Delta RH$) and temperature ($\Delta T$) deltas.
  - Calculated steam deduction and remaining gas residual.
  - 10-sample rolling slope ($m$) and projected Time-to-Danger (TTD).

### 3.4 Alert History & Triage (`AlertHistoryList.tsx`)
- Chronological event log of all system warnings and alarms.
- Filterable by severity (`Warning`, `Alarm`, `Critical`) and simulation status.
- Expandable items with forensic breakdown of environmental conditions at time of trigger.

### 3.5 Remote Caregiver Portal (`CaregiverView.tsx`)
- Asymmetric read-only emergency portal designed for remote family members or caregivers.
- Direct status summary, recent alert feed, and instant **National Emergency (112) Dialer** shortcut.

### 3.6 Admin Calibration & Retraining (`AdminCalibrationView.tsx`)
- Engineering view for adjusting empirical regression gains ($K_{RH}, K_T$) and threshold parameters.
- Built-in dataset inspection for historical sensor sessions.

### 3.7 Notification Settings View (`NotificationSettingsView.tsx`)
- Configures SMS and automated alert dispatch phone numbers, escalation delay intervals, and caregiver contact information.

### 3.8 Safety Disclaimer Banner (`DisclaimerBanner.tsx`)
- Persistent footer banner explicitly communicating: *“This system supplements, not replaces, certified gas-safety practice.”*

---

## 4. Accessibility & Safety Standards

- **WCAG 2.1 AA Compliance**: Contrast ratios of all text elements against dark card backgrounds exceed $4.5:1$ (and $> 3.0:1$ for large headings).
- **Aria Attributes**: All interactive buttons, modals, and drawers have explicit `aria-label` tags.
- **Simulated vs. Real Visual Sandboxing**: Simulated events are tagged with prominent `[SIMULATION]` badges and amber toast notices to prevent accidental confusion with real emergency events.
- **Zero-Flicker Layout**: Fixed layout dimensions prevent layout shift during high-frequency live streaming.
