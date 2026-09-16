# Contributing to SENTINEL

Thank you for your interest in contributing to **SENTINEL** (Dual-Tier Cyber-Physical Gas Safety System). We welcome contributions from researchers, hardware enthusiasts, and software engineers.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand expectations for communication and collaboration.

---

## Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Arduino IDE / Arduino CLI** (for flashing microcontroller firmware)
- **Target Hardware (Optional for dashboard development, required for hardware validation)**:
  - Arduino Nano (ATmega328P)
  - MQ-2 Gas Sensor (Analog Out -> `A0`)
  - DHT11 Temperature & Humidity Sensor (Data -> `D2`)
  - Active Piezo Buzzer (Positive with 100Ω series resistor -> `D8`)
  - Status LED with 220Ω current-limiting resistor -> `D9`
  - HC-05 Bluetooth Transceiver (TX -> `D10`, RX -> `D11` via voltage divider)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Shree-svg/-SENTINEL.git
cd -SENTINEL
npm install
```

### 2. Run the Frontend Development Server
```bash
npm run dev
```
The React 19 dashboard will start at `http://localhost:5173/`.

### 3. Run the Hardware Bridge Server
```bash
npm run server
```
The Express + SerialPort service runs on port `3001`. It will auto-detect connected USB serial ports (`/dev/tty.usbserial-*`, `COM*`) at **9600 baud** and begin streaming telemetry to the web client.

---

## Branching & Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new feature or capability
- `fix:` A bug fix
- `docs:` Documentation updates
- `refactor:` Code refactoring without behavioral changes
- `ci:` Changes to CI/CD workflows or scripts
- `chore:` Dependency bumps, tooling maintenance

### Branch Naming
- `feature/<feature-name>`
- `fix/<issue-name>`
- `docs/<doc-update>`

---

## Quality & Verification Standards

Before opening a pull request, ensure all verification checks pass:

```bash
# 1. Typecheck and verify production Vite build
npm run build

# 2. Run fast linter
npm run lint
```

### Critical Safety Invariant
Under no circumstances should software pull requests attempt to bypass, silence, or throttle the firmware's autonomous physical alarm loop (`D8`/`D9`). The edge safety tier operates unconditionally at the microcontroller layer.

---

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Commit your changes with conventional commit messages.
3. Verify that `npm run build` succeeds with zero errors.
4. Push to your fork and submit a Pull Request following the PR template.
5. Provide clear steps to reproduce or verify your changes.
