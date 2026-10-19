# 📸 SENTINEL — Application Screenshot Catalog

This directory contains authentic, unedited screenshots captured from the running SENTINEL web application (`http://localhost:5173/`) rendered via headless browser automation at 1280x900 resolution.

---

## Screenshot Inventory & Scene Index

| File | View / Route | Scenario Represented | Key Visual Features & Telemetry Visible |
| :--- | :--- | :--- | :--- |
| [`dashboard_normal.png`](dashboard_normal.png) | `/monitor` | **Normal Ambient Air** | Quiescent baseline air (~190 ADC, 24°C, 50% RH). Status pill: `NORMAL` (green). Dual-trace graph shows raw and compensated traces overlapping with zero steam deduction. |
| [`steam_scenario.png`](steam_scenario.png) | `/monitor` | **Kitchen Steam Rejection** | Boiling water electric kettle simulation. Humidity surges to 85%+; raw gas rises falsely to 268 ADC. Dynamic compensator calculates -106.7 ADC deduction, keeping residual safely below 300 ADC. Status pill: `STEAM SUPPRESSED` (amber). Nuisance siren prevented. |
| [`gas_leak_alert.png`](gas_leak_alert.png) | `/monitor` | **Combustible Gas Release** | Unlit hydrocarbon gas leak ramp. Gas breaches critical hazard floor (>500 ADC). 10-sample rolling OLS slope estimator projects positive trajectory (+30 ADC/s) with Predictive Time-to-Danger (TTD) countdown. Status pill: `EMERGENCY` (red). |
| [`caregiver_portal.png`](caregiver_portal.png) | `/caregiver` | **Remote Caregiver View** | Asymmetric read-only emergency portal showing dwelling safety status, active incident duration, and one-touch national emergency (112) dialer with confirmation protection. |
| [`admin_calibration.png`](admin_calibration.png) | `/admin` | **Admin Calibration Workbench** | Technical engineering view showing multi-sensor regression coefficients ($K_{RH}=2.8, K_T=1.2$), sensor health diagnostic monitors (flatline, DHT11 disconnect), and baseline recalibration controls. |
| [`alert_history.png`](alert_history.png) | `/alerts` | **Chronological Alert Audit Log** | Comprehensive event ledger cataloging timestamped warnings, classification transitions (`SAFE` → `BENIGN_STEAM` → `GAS_LEAK`), and underlying heuristic contributing factors. |
| [`notification_settings.png`](notification_settings.png) | `/settings` | **Notification & Escalation Config**| User configuration interface for caregiver contact phone numbers, SMS escalation delays (15s), emergency escalation prompt delays (30s), and acoustic buzzer test. |

---

## Verification Methodology
- **Capture Tool**: Google Chrome Headless Engine (`--virtual-time-budget=3000 --window-size=1280,900`).
- **Telemetry Source**: Live Node.js backend bridge (`http://127.0.0.1:3001/`) actively processing simulated and empirical sensor streams.
- **Authenticity Statement**: All screenshots are programmatic renders of actual application components; no mockups, wireframe placeholders, or fabricated images are present.
