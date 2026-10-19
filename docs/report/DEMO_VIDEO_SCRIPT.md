# Demonstration Video Plan & Production Script
## SENTINEL: Dual-Tier Cyber-Physical Gas Leak Detection System

**Document**: `docs/report/DEMO_VIDEO_SCRIPT.md`  
**Target Duration**: 4 to 6 minutes (optimal academic demonstration length)  
**Submitted by**: Shreedhar Sharma (Reg. No.: 24BPS1149)  
**Programme**: B.Tech — Computer Science and Engineering  
**Institution**: Vellore Institute of Technology (VIT)  
**Faculty Supervisor**: Dr Elakiya R  
**Video URL**: `https://youtu.be/placeholder-sentinel-demo`  

---

## 1. Video Objectives & Target Audience
This demonstration script guides the recording of a professional, submission-grade video walkthrough for the SENTINEL cyber-physical project. The video demonstrates:
1. The real-world problem of nuisance alarm fatigue caused by everyday kitchen steam.
2. The dual-tier architecture isolating deterministic edge hardware from cyber analytics.
3. Live mathematical cross-sensitivity compensation ($K_{RH}=2.8, K_T=1.2$) and predictive Time-to-Danger (TTD) early warning.
4. The 5-stage controlled escalation finite state machine.
5. Reproducible automated testing and empirical benchmark evaluation.

---

## 2. Recording Environment Checklist

Before beginning the screen recording:
- [ ] **Terminal 1**: Running backend bridge daemon (`npm run server`) on `http://127.0.0.1:3001`.
- [ ] **Terminal 2**: Running frontend Vite dev server (`npm run dev`) on `http://localhost:5173`.
- [ ] **Terminal 3**: Ready to run `npm test` and `npm run evaluate`.
- [ ] **Browser**: Google Chrome opened at `http://localhost:5173/` in full-screen window (1920x1080 or 1280x800).
- [ ] **Audio**: High-clarity microphone with minimal background noise.
- [ ] **Hardware (if available)**: Arduino Nano, breadboard cluster, and USB connection framed in secondary camera or picture-in-picture.

---

## 3. Scene-by-Scene Production Script

### Scene 1: Introduction & Problem Formulation (0:00 – 0:45)
- **Visual**: Title slide showing project name, author credentials, institution (VIT Chennai), and GitHub repository. Switch to camera / screen showing `README.md`.
- **Narration**:  
  *"Hello everyone. Welcome to the demonstration of SENTINEL, a Dual-Tier Cyber-Physical Gas Leak Detection System with Dynamic Cross-Sensitivity Compensation and Zero-Trust Edge Safety.  
  Traditional residential gas detectors rely on metal-oxide sensors like the MQ-2. While sensitive to combustible gases, these sensors cross-react heavily to water vapor. In home kitchens, boiling water or cooking steam routinely causes false alarms. Consequently, occupants often unplug or silence their alarms—creating severe life-safety hazards. SENTINEL solves this trade-off using a dual-tier cyber-physical architecture."*
- **Action**: Highlight the problem statement in the documentation.

### Scene 2: Cyber-Physical Topology & Architecture (0:45 – 1:20)
- **Visual**: Display `docs/diagrams/5.1_system_architecture.md`.
- **Narration**:  
  *"SENTINEL is built on two decoupled tiers.  
  Tier 1 is our Deterministic Edge Hardware: an Arduino Nano running an autonomous 1-second C++ loop. It samples the MQ-2 gas sensor and DHT11 climate sensor, actuating a physical piezo buzzer and LED on pin D8 and D9. This tier operates with zero reliance on computers or Wi-Fi—providing a hardcoded safety floor.  
  Tier 2 is our Cyber Analytical Plane: an Express.js ingestion bridge and a React 19 dashboard. The bridge applies multi-variable regression to subtract steam interference, estimates gas accumulation trajectory via a 10-sample rolling slope estimator, and manages a 5-stage controlled escalation finite state machine."*
- **Action**: Trace arrows from hardware edge to ingestion bridge to analytical pipeline.

### Scene 3: Resident Live Dashboard in Normal State (1:20 – 1:55)
- **Visual**: Navigate to `http://localhost:5173/monitor`.
- **Narration**:  
  *"Here is the resident dashboard. In normal room air, we see steady baseline conditions: raw gas at ~190 ADC, 24°C, and 50% relative humidity.  
  The status badge clearly indicates 'NORMAL'. The dual-trace graph plots the raw analog reading in amber alongside the compensated signal in blue. Because humidity is at baseline, the steam deduction is zero, and both lines overlap perfectly."*
- **Action**: Hover over the live telemetry cards (Raw Gas, Compensated Gas, Temperature, Humidity).

### Scene 4: Kitchen Steam Simulation & False Alarm Suppression (1:55 – 2:45)
- **Visual**: In the demo simulation bar, select the `Kitchen steam` scenario.
- **Narration**:  
  *"Now let's simulate a common kitchen nuisance event: an electric kettle boiling water 30 centimeters from the detector.  
  Watch as relative humidity surges from 50% up to 85%. Notice the amber raw gas line climbing past 280 and 350 ADC. On a standard static threshold detector, this would trigger an annoying, ear-piercing false siren.  
  However, look at the blue line: SENTINEL's dynamic compensator calculates an empirical steam deduction of over 100 ADC based on our calibrated formula: $K_{RH}=2.8$ and $K_T=1.2$. The compensated residual remains safely below 300 ADC. The status updates to 'STEAM SUPPRESSED'—nuisance sirens are prevented, and occupants are not disturbed."*
- **Action**: Open the "Contributing Factors" explainability drawer to show the live steam deduction and humidity rate of change.

### Scene 5: Combustible Gas Leak & Predictive Early Warning (2:45 – 3:35)
- **Visual**: Switch scenario to `Gas leak`.
- **Narration**:  
  *"Now, let's inject a real combustible gas release in dry room air.  
  Look at the trajectory: the gas concentration begins ramping up rapidly while humidity remains flat. Because humidity is unchanged, the steam deduction remains zero—ensuring zero safety suppression.  
  More importantly, observe the Predictive Time-to-Danger card: our 10-sample Ordinary Least Squares regression calculates a positive slope of +25 ADC per second. It projects an early warning countdown: '12 seconds to danger threshold'. Occupants receive early actionable warning long before the gas reaches the critical 500 ADC emergency level!"*
- **Action**: Highlight the TTD countdown card and the steep ascending slope.

### Scene 6: 5-Stage Escalation & Local Acknowledgment (3:35 – 4:15)
- **Visual**: Observe the escalation stepper transition from `WARNING` to `ALARM` to `ESCALATED`.
- **Narration**:  
  *"As the concentration breaches the alarm floor, the 5-stage state machine engages. First, a local buzzer alarm sounds. If unacknowledged for 15 seconds, the system escalates, notifying remote caregivers.  
  If the occupant is present and addressing the issue, they can press the 'Acknowledge Alarm' button. This latches the system into 'ACKNOWLEDGED' state, silencing unnecessary remote alarms while maintaining safety vigilance until concentrations clear."*
- **Action**: Click the "Acknowledge Alarm" button and observe the state badge update.

### Scene 7: Asymmetric Caregiver Portal & Emergency Dispatch (4:15 – 4:45)
- **Visual**: Click the `Caregiver Portal` tab (`/caregiver`).
- **Narration**:  
  *"For elderly or vulnerable residents living independently, SENTINEL provides a dedicated read-only Caregiver Portal. Remote family members can view dwelling status in real time, inspect alert durations, and access a one-touch national emergency 112 dialer with confirmation protection."*
- **Action**: Scroll through the active dwelling status card and emergency contact information.

### Scene 8: Automated Test Suite & Empirical Benchmark Replay (4:45 – 5:30)
- **Visual**: Switch to terminal window.
- **Narration**:  
  *"Finally, let's verify technical correctness and reproducibility.  
  First, we execute `npm test`. All 14 automated unit tests covering frame checksums, simulator states, steam compensation, slope regression, and sensor health pass in just 50 milliseconds.  
  Next, we execute our empirical benchmark runner: `npm run evaluate`. This harness replays over 120 samples of real kitchen kettle, cooking, and butane datasets.  
  The results confirm our claims: plain detectors produced 2 false alarms totaling 19 seconds of nuisance sirens; SENTINEL produced zero false alarms—a 100% reduction—with zero missed hazards and +4.0 seconds of early warning advance."*
- **Action**: Run `npm test` and `npm run evaluate`, highlighting the summary table output.

### Scene 9: Conclusion & Academic Summary (5:30 – 6:00)
- **Visual**: Return to `docs/report/SENTINEL_Project_Report.md` and repository overview.
- **Narration**:  
  *"In conclusion, SENTINEL demonstrates how cyber-physical systems can eliminate the nuisance false-alarm trade-off in domestic safety without compromising physical reliability. The repository is fully documented, tested, and ready for academic evaluation. Thank you for watching."*

---

## 4. Post-Recording Video Submission Checklist

- [ ] Video rendered at 1080p (1920x1080) at 30 or 60 fps.
- [ ] Exported audio is balanced and clear.
- [ ] Uploaded to YouTube as **Unlisted** or Google Drive with "Anyone with the link can view".
- [ ] Video link tested in an incognito / private browser window without logging in.
- [ ] Final URL added to `README.md` and project submission portal.
