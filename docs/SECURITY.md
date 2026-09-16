# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Zero-Trust Safety Architecture

SENTINEL enforces an architectural invariant regarding physical safety:

1. **Hardware Independence**: The primary safety actuation loop executes natively in microcontroller firmware (C++ on ATmega328P). If dangerous gas levels exceed threshold (`> 300` ADC units), the physical buzzer (`D8`) and alert LED (`D9`) trigger immediately without waiting for USB, host computing, or cloud/network connectivity.
2. **Non-Overridability**: No remote command, web classification result, or API payload is capable of suppressing an active physical alarm condition while gas remains elevated.
3. **Fail-Safe Defaulting**: In the event of sensor disconnect, serial communication drop, or low ML classification confidence ($< 0.75$), the system defaults cautiously to **Genuine Leak** alert state.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential safety bypass in SENTINEL:

1. Please do **not** open a public GitHub issue.
2. Report the vulnerability privately via GitHub Security Advisories or contact the maintainer directly through their profile.
3. Include detailed steps to reproduce the issue, along with affected versions, hardware configurations, and any relevant logs.
4. We strive to acknowledge reports within 48 hours and provide a remediation timeline.
