# 🛡️ SENTINEL: Dual-Tier Cyber-Physical Architecture

### *Dynamic Cross-Sensitivity Compensation & Zero-Trust Edge Safety in Residential Gas Monitoring*

[![CI](https://github.com/Shree-svg/-SENTINEL/actions/workflows/ci.yml/badge.svg)](https://github.com/Shree-svg/-SENTINEL/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Hardware](https://img.shields.io/badge/Hardware-Arduino%20Nano-00979D?style=flat-square&logo=arduino)](https://www.arduino.cc)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)

---

## 🎯 What is SENTINEL's Core Novelty?

Traditional gas detectors have a critical flaw called **Alarm Fatigue**. Because commercial metal-oxide semiconductor ($SnO_2$) sensors cross-react to water vapor and temperature fluctuations, everyday cooking steam triggers false alarms, causing people to disconnect their detectors.

**SENTINEL solves this through four core technical innovations:**

1. **Multi-Sensor Environmental Correlation**:
   Extracts a **7-variable dynamic feature vector** across gas concentration ($R_{gas}$), temperature ($T$), and relative humidity ($RH$). By tracking the **Humidity Rate of Change ($\Delta RH / \Delta t$) as a steam proxy**, the system differentiates between benign kitchen steam and genuine combustible gas leaks in software.
2. **Dual-Plane Architecture (Zero-Trust Edge Fallback)**:
   * **Firmware Plane (Arduino Nano)**: Hardcoded deterministic safety floor (Buzzer on `D8`, LED on `D9`) operates autonomously without depending on PC, Wi-Fi, or server uptime.
   * **Cyber Analytical Plane (Node.js + React)**: Multi-factor ML classification, rolling sparklines, and SMS/Email escalation pathways.
3. **Concurrent Dual-Channel Telemetry**:
   Transmits simultaneously over **USB CDC (9600 baud)** for the local web dashboard and **HC-05 Bluetooth UART** for offline mobile triage by emergency responders.
4. **Asymmetric Role-Gated Remote Caregiver Portal (SRS §5.5)**:
   Provides remote guardians and caregivers with a secure, read-only telemetry dashboard, one-touch **National Emergency Service (112)** dispatch, and prevents accidental remote silencing of life-critical alarms.

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
                      │ • Standalone 1.0s sample loop                     │
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
| **MQ-2 Gas Sensor** | `A0` | Analog IN | Reads gas concentration (0–1023 ADC) |
| **DHT11 Sensor** | `D2` | Digital I/O | Temperature (°C) & Relative Humidity (%) |
| **Piezo Buzzer** | `D8` | Digital OUT | Active alarm sounder (series 100Ω protection) |
| **Status Alarm LED** | `D9` | Digital OUT | Visual safety beacon (330Ω resistor) |
| **HC-05 BT TXD** | `D10` | SoftwareSerial RX | Receives Bluetooth telemetry (9600 baud) |
| **HC-05 BT RXD** | `D11` | SoftwareSerial TX | Transmits Bluetooth telemetry |

---

## 📁 Repository Layout

```
.
├── README.md                      # Project overview & architecture summary
├── docs/                          # Architectural & Engineering Documentation
│   ├── ARCHITECTURE.md            # System architecture & endpoint specifications
│   ├── DESIGN.md                  # UI/UX design tokens & styling guide
│   ├── PRODUCT.md                 # Product requirements & user stories
│   ├── Memory.md                  # Technical decisions & engineering history
│   └── implementation_plan.md     # Implementation roadmap
├── firmware/                      # Embedded C++ Microcontroller Firmware
│   └── sentinel_firmware/
│       └── sentinel_firmware.ino  # Production Arduino sketch (9600 baud + Bluetooth)
├── server/                        # Backend Serial Ingestion Bridge
│   └── index.js                   # Node.js + Express serial watchdog daemon
└── src/                           # Frontend React 19 Dashboard
    ├── api/                       # Typed REST API client
    ├── components/                # Claymorphic UI components (LiveStatus, Caregiver, etc.)
    ├── hooks/                     # Custom hooks (usePolling, useReadingHistory)
    └── types/                     # TypeScript data interfaces
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Flash Arduino Firmware
1. Open [`firmware/sentinel_firmware/sentinel_firmware.ino`](./firmware/sentinel_firmware/sentinel_firmware.ino) in the Arduino IDE.
2. In the Library Manager (`Tools > Manage Libraries`), confirm **DHT sensor library by Adafruit** is installed.
3. Select **Board**: `Arduino Nano` (Processor: `ATmega328P` or `ATmega328P (Old Bootloader)`).
4. Select your USB port (`/dev/cu.usbserial-*`) and click **Upload**.

### 3. Launch Bridge Server & Dashboard
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

## 👤 Author

* **Author**: **Shreedhar Sharma**
* **Institution**: Vellore Institute of Technology (VIT), Chennai
* **Specialization**: B.Tech CSE (Cyber-Physical Systems — CPS)
* **Contact Email**: [shreedharsharma192@gmail.com](mailto:shreedharsharma192@gmail.com)
* **Portfolio**: [portfolio-five-delta-xr8oas2k65.vercel.app](https://portfolio-five-delta-xr8oas2k65.vercel.app/)
* **GitHub**: [@Shree-svg](https://github.com/Shree-svg)
