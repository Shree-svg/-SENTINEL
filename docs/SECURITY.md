# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Zero-Trust Safety Architecture

SENTINEL enforces an architectural invariant regarding physical safety:

1. **Hardware Independence**: The primary safety actuation loop executes natively in microcontroller firmware (C++ on ATmega328P). If dangerous gas levels exceed threshold (`> 300` ADC units) outside the warm-up window, the physical buzzer (`D8`) and alert LED (`D9`) trigger immediately without waiting for USB, host computing, or cloud/network connectivity.
2. **Non-Overridability**: No remote command, web classification result, or API payload is capable of suppressing an active physical alarm condition while gas remains elevated.
3. **Fail-Safe Defaulting**: In the event of sensor disconnect, serial communication drop, or low ML classification confidence ($< 0.75$), the system defaults cautiously to **Genuine Leak** alert state.

---

## Prototype Scope & Network Exposure

> [!NOTE]
> **Prototype Deployment Notice**: The SENTINEL host bridge server (`server/index.js`) and web dashboard are developed as a cyber-physical prototype for single-residence edge monitoring.

- **Local Loopback Binding (`127.0.0.1`)**: By default, the bridge server binds exclusively to `127.0.0.1` (localhost) rather than `0.0.0.0`. This isolates all HTTP REST endpoints (`/api/alerts/acknowledge`, `/api/hardware/test-buzzer`, `/api/demo/*`, etc.) from external network interfaces and prevents unauthorized remote execution by devices sharing the local Wi-Fi / LAN.
- **CORS Restriction**: Cross-Origin Resource Sharing is restricted to local development origins (`http://localhost:5173`, `http://127.0.0.1:5173`).
- **Production Hardening Guidelines**:
  - **Authentication & Authorization**: In production environments, sensitive endpoints must be gated with JWT bearer tokens or session cookies with role-based access control (distinguishing resident acknowledgment from administrative calibration).
  - **Transport Security**: Deploy behind a reverse proxy (e.g. Nginx or Caddy) enforcing TLS 1.3 / HTTPS.
  - **Mutual TLS (mTLS)**: If deploying network-connected edge sensor nodes (e.g., ESP32 or Raspberry Pi gateways), utilize mTLS for cryptographically authenticated telemetry ingestion.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential safety bypass in SENTINEL:

1. Please do **not** open a public GitHub issue.
2. Report the vulnerability privately via GitHub Security Advisories or contact the maintainer directly through their profile.
3. Include detailed steps to reproduce the issue, along with affected versions, hardware configurations, and any relevant logs.
4. We strive to acknowledge reports within 48 hours and provide a remediation timeline.
