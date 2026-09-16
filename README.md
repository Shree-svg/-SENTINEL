# 🛡️ SENTINEL: Dual-Tier Cyber-Physical Architecture

### *Dynamic Cross-Sensitivity Compensation & Zero-Trust Edge Safety in Residential Gas Monitoring*

[![CI](https://github.com/Shree-svg/-SENTINEL/actions/workflows/ci.yml/badge.svg)](https://github.com/Shree-svg/-SENTINEL/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino%20Nano-00979D?style=flat-square&logo=arduino)](https://www.arduino.cc)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)

---

## 🎯 What is SENTINEL's Core Novelty?

Traditional residential gas detectors suffer from a dangerous failure mode known as **Alarm Fatigue**. Because low-cost metal-oxide semiconductor ($SnO_2$) sensors cross-react to ambient temperature fluctuations and relative humidity, benign everyday cooking steam frequently triggers false alarms. Consequently, occupants frequently disable or silence their detectors, creating severe life-safety hazards.

**SENTINEL resolves this trade-off through four key architectural innovations:**

1. **Multi-Sensor Environmental Correlation**:
   Extracts a **7-variable dynamic feature vector** across gas concentration ($R_{gas}$), ambient temperature ($T$), and relative humidity ($RH$). By treating the **Humidity Rate of Change ($\Delta RH / \Delta t$) as a mathematical steam proxy**, the system suppresses steam-induced false alarms in software without desensitizing the sensor to genuine combustible leaks.
2. **Dual-Plane Architecture (Zero-Trust Edge Fallback)**:
   * **Firmware Plane (Arduino Nano ATmega328P)**: A deterministic, non-blocking 1.0-second actuation loop controls the physical piezo buzzer (`D8`) and beacon LED (`D9`). It executes unconditionally with **zero reliance** on host PC connectivity, Wi-Fi status, or cloud uptime.
   * **Cyber Analytical Plane (Node.js + React)**: Multi-variable feature extraction, rolling trend sparklines, explainability factors, and automated caregiver SMS dispatch.
3. **Concurrent Dual-Channel Telemetry**:
   Transmits sensor frames simultaneously over **USB CDC (9600 baud)** for local high-resolution web telemetry and **HC-05 Bluetooth UART** for offline mobile triage by emergency responders.
4. **Asymmetric Role-Gated Remote Caregiver Portal**:
   Provides remote guardians with a read-only monitoring interface, one-touch **National Emergency Service (112)** dispatch, and architectural safeguards preventing accidental remote silencing of life-critical alarms.

---

## 🔬 Mathematical Model & 7-Variable Feature Vector

To reliably classify events without deep learning latency, SENTINEL computes a 7-dimensional spatio-temporal feature vector $\vec{X}_t$ over a sliding window ($W = 10\text{ s}$):

$$\vec{X}_t = \Big[ R_{gas}(t),\, \frac{\Delta R_{gas}}{\Delta t},\, \overline{R_{gas}}_{[t-W, t]},\, T(t),\, \frac{\Delta T}{\Delta t},\, RH(t),\, \frac{\Delta RH}{\Delta t} \Big]^T$$

| # | Feature Variable | Mathematical Formulation | Physical Domain Meaning |
| :-: | :--- | :--- | :--- |
| **1** | `rawGas` | $R_{gas}(t)$ | Instantaneous MQ-2 ADC sensor reading ($0 - 1023$) |
| **2** | `rate_of_change_gas` | $\Delta R_{gas} / \Delta t = \frac{R(t) - R(t-1)}{\Delta t}$ | First derivative of gas concentration (surge vs steady drift) |
| **3** | `rolling_avg_gas` | $\overline{R}_{10} = \frac{1}{N}\sum_{i=0}^{N-1} R(t-i)$ | Noise-filtered baseline to eliminate sensor jitter |
| **4** | `temperature` | $T(t)$ | Instantaneous ambient temperature in °C |
| **5** | `rate_of_change_temp` | $\Delta T / \Delta t$ | Thermal gradient (detects flash heating vs climate variation) |
| **6** | `humidity` | $RH(t)$ | Instantaneous relative humidity in % |
| **7** | `rate_of_change_hum` | $\Delta RH / \Delta t$ | **Steam proxy**: Cooking steam causes rapid $\Delta RH/\Delta t > +6.0\%/\text{s}$ |

### Dynamic Steam Rejection Heuristic
$$\text{Class} = \begin{cases} \text{Cooking Steam (Interference)}, & \text{if } \frac{\Delta RH}{\Delta t} \ge \theta_{hum} \text{ and } \frac{\Delta R_{gas}}{\Delta t} \ge \theta_{gas} \\ \text{Genuine Combustible Leak}, & \text{if } \frac{\Delta R_{gas}}{\Delta t} \ge \theta_{gas} \text{ and } \left|\frac{\Delta RH}{\Delta t}\right| < \theta_{hum} \\ \text{Normal Baseline}, & \text{otherwise} \end{cases}$$

---

## 🏗️ System Architecture

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
    │     CYBER ANALYTICAL PLANE (Node.js Engine)   │  │  OFFLINE FIELD TRIAGE  │
    │ ───────────────────────────────────────────── │  │ (Mobile Responder App) │
    │ • Auto-Reconnect Serial Watchdog (2s scan)    │  └────────────────────────┘
    │ • 7-Variable Feature Extractor                │
    │ • Dynamic Rolling Buffer (10-sample avg)      │
    │ • Multi-Channel Escalation (SMS & SMTP Email) │
    │ • Express REST / SSE Ingestion Bridge (:3001) │
    └───────────────────────┬───────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────────────────────────────────┐
    │                       DASHBOARD & TELEMETRY LAYER                         │
    │                                                                           │
    │  ┌──────────────────────────────┐        ┌─────────────────────────────┐  │
    │  │   RESIDENT / LOCAL VIEW      │        │  CAREGIVER REMOTE PORTAL    │  │
    │  │  • Real-Time Gauge Sparklines│        │ • Asymmetric Read-Only Tele │  │
    │  │  • Bidirectional Buzzer Test │        │ • SOS 112 Emergency Dialer │  │
    │  │  • Hardware Calibration UI   │        │ • Granular Access Revocation│  │
    │  └──────────────────────────────┘        └─────────────────────────────┘  │
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

## 📁 Repository Layout

```
.
├── .github/
│   ├── ISSUE_TEMPLATE/            # GitHub issue templates (Bug Report, Feature Request)
│   ├── workflows/ci.yml           # Automated CI workflow (TypeScript validation & Vite build)
│   └── pull_request_template.md   # Standardized Pull Request template
├── docs/                          # Architectural & Engineering Documentation
│   ├── ARCHITECTURE.md            # System architecture, schemas, and endpoint specs
│   ├── DESIGN.md                  # UI/UX design tokens & styling guide
│   ├── PRODUCT.md                 # Product requirements & user stories
│   ├── Memory.md                  # Technical decisions & engineering history
│   └── implementation_plan.md     # Implementation roadmap
├── firmware/                      # Embedded C++ Microcontroller Firmware
│   └── sentinel_firmware/
│       └── sentinel_firmware.ino  # Production Arduino sketch (9600 baud + Bluetooth)
├── server/                        # Backend Serial Ingestion Bridge
│   └── index.js                   # Node.js + Express serial watchdog daemon
├── src/                           # Frontend React 19 Dashboard
│   ├── api/                       # Typed REST API client
│   ├── components/                # Modular UI components (LiveStatus, Caregiver, etc.)
│   ├── hooks/                     # Custom hooks (usePolling, useReadingHistory)
│   └── types/                     # TypeScript data interfaces
├── CONTRIBUTING.md                # Contributor guidelines and workflow
├── CODE_OF_CONDUCT.md             # Contributor Covenant Code of Conduct
├── SECURITY.md                    # Zero-trust safety policy & vulnerability reporting
├── LICENSE                        # MIT License
└── package.json                   # Project metadata and dependencies
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0+
- **Arduino IDE / Arduino CLI** (for flashing microcontroller firmware)
- **Target Hardware**: Arduino Nano (ATmega328P), MQ-2, DHT11, Piezo Buzzer, LED, HC-05

### 2. Install Dependencies
```bash
git clone https://github.com/Shree-svg/-SENTINEL.git
cd -SENTINEL
npm install
```

### 3. Flash Arduino Firmware
1. Open [`firmware/sentinel_firmware/sentinel_firmware.ino`](./firmware/sentinel_firmware/sentinel_firmware.ino) in the Arduino IDE.
2. In the Library Manager (`Tools > Manage Libraries`), confirm **DHT sensor library by Adafruit** is installed.
3. Select **Board**: `Arduino Nano` (Processor: `ATmega328P` or `ATmega328P (Old Bootloader)`).
4. Select your USB port (`/dev/cu.usbserial-*` or `COM*`) and click **Upload**.

### 4. Launch Bridge Server & Dashboard
In terminal 1 (Hardware Ingestion Bridge):
```bash
npm run server
```

In terminal 2 (Vite Development Dashboard):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Continuous Integration & Verification

All commits and pull requests are validated using GitHub Actions:

```bash
# Typecheck TypeScript & compile production Vite bundle
npm run build

# Run fast static analysis linter
npm run lint
```

---

## 👥 Community & Policies

- **Contributing**: Please review [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit formats, and development setup.
- **Code of Conduct**: We follow the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md).
- **Security Policy**: Read [SECURITY.md](SECURITY.md) for details on physical safety invariants and vulnerability disclosure.
- **License**: Released under the [MIT License](LICENSE).

---

## 👤 Author

* **Lead Architect & Developer**: **Shreedhar Sharma**
* **Institution**: Vellore Institute of Technology (VIT), Chennai
* **Specialization**: B.Tech CSE (Cyber-Physical Systems — CPS)
* **Contact Email**: [shreedharsharma192@gmail.com](mailto:shreedharsharma192@gmail.com)
* **Portfolio**: [portfolio-five-delta-xr8oas2k65.vercel.app](https://portfolio-five-delta-xr8oas2k65.vercel.app/)
* **GitHub**: [@Shree-svg](https://github.com/Shree-svg)
