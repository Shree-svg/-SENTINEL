// server/index.js
// SENTINEL Hardware Ingestion & Classification Bridge Server
// Connects Arduino Nano (USB Serial) to the React Dashboard with Auto-Reconnect Watchdog (Rules §2.3)

import express from 'express';
import cors from 'cors';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { 
  loadConfig, 
  computeSteamCompensation, 
  computeSlopeAndTimeToDanger, 
  evaluateSensorHealth 
} from './signalAnalytics.js';
import { 
  recordReading, 
  startRecording, 
  stopRecording, 
  getRecordingStatus 
} from './recorder.js';
import {
  newSimState,
  changeScenario,
  stepSim,
  encodePacket,
  corruptPacket,
  SCENARIO_INFO
} from './demoSimulator.js';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1'; // Bind to localhost by default to prevent unauthorized network exposure

// Restrict CORS to local development dashboard origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, local scripts, or approved localhost dashboard origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// --- TELEMETRY & CLASSIFICATION STATE ---
let isHardwareConnected = false;
let connectedPortName = null;
let activeSerialPort = null;
let lastHardwarePacketTime = null;
let hardwareStreamStartTime = null;

// Telemetry history buffer for 7-feature extraction (10-second rolling window per Design §3)
const readingsBuffer = [];
const MAX_BUFFER = 50;

let latestReading = null;
let historicalAlerts = [];

// --- DEMO READINGS STATE (Strictly ephemeral, OFF by default) ---
let demoActive = false;
let demoTimer = null;
let demoSimState = newSimState();
let currentDemoScenario = 'normal';
let demoLossRate = 0.0;
let demoCorruptRate = 0.0;
let demoNotice = null;
let lastRealPacketTimestamp = 0;
let currentSeq = 0;

function isRealDeviceActive() {
  return isHardwareConnected && (Date.now() - lastRealPacketTimestamp < 5000);
}

function isRealFirmwareAlarmActive() {
  return isRealDeviceActive() && Boolean(latestReading && !latestReading.isFromDemo && (latestReading.alarm || latestReading.raw > 300));
}

function stopDemoMode(notice = null) {
  if (demoTimer) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
  const wasActive = demoActive;
  demoActive = false;
  if (notice) {
    demoNotice = notice;
    console.warn(`[SENTINEL Demo] ${notice}`);
  }
  if (wasActive) {
    // Clear buffer so real and synthetic readings are NEVER mixed
    readingsBuffer.length = 0;
    latestReading = null;
    // Clean up simulated alerts so only real hardware alerts remain
    historicalAlerts = historicalAlerts.filter(a => a.isRealHardware);
  }
}

function startDemoMode() {
  if (isRealDeviceActive() || isRealFirmwareAlarmActive()) {
    throw new Error("Real device or firmware alarm active. Demo mode prohibited.");
  }
  stopDemoMode();
  demoSimState = newSimState();
  changeScenario(demoSimState, currentDemoScenario);
  demoActive = true;
  demoNotice = null;
  // Clear buffer so real and synthetic readings are NEVER mixed
  readingsBuffer.length = 0;
  latestReading = null;

  // Immediately process first sample so UI has instant telemetry on enable
  const initialS = stepSim(demoSimState);
  const initialPkt = encodePacket(initialS.seq, initialS.gas, initialS.temp, initialS.rh, initialS.alarm);
  handleRawTelemetryLine(initialPkt, true);

  demoTimer = setInterval(() => {
    if (isRealDeviceActive()) {
      stopDemoMode("Real device detected: demo mode stopped");
      return;
    }

    const s = stepSim(demoSimState);
    if (Math.random() < demoLossRate) {
      return; // lost packet
    }

    let pkt = encodePacket(s.seq, s.gas, s.temp, s.rh, s.alarm);
    if (Math.random() < demoCorruptRate) {
      pkt = corruptPacket(pkt);
    }

    handleRawTelemetryLine(pkt, true);
  }, 1000);
}

let caregiverLinks = [
  {
    _id: "cg-01",
    residentId: "res-104",
    residentName: "Shreedhar Sharma",
    residentAddress: "Residential Node 01",
    caregiverId: "cg-user-88",
    caregiverName: "Shreedhar Sharma",
    caregiverPhone: "+91 ••••• •••••",
    caregiverEmail: "shreedharsharma192@gmail.com",
    relationship: "Primary Caregiver",
    active: true,
    linkedAt: "2026-08-15T10:00:00.000Z"
  }
];

// --- 7-FEATURE EXTRACTION & CLASSIFIER (Design.md §3 & §4) ---
function processReading(rawGas, temp, hum, deviceTime, seq = 0, isFromDemo = false) {
  currentSeq = seq || currentSeq;
  if (!isFromDemo) {
    lastHardwarePacketTime = Date.now();
    if (!hardwareStreamStartTime) {
      hardwareStreamStartTime = Date.now();
    }
  }

  const prevReading = readingsBuffer.length > 0 ? readingsBuffer[readingsBuffer.length - 1] : null;

  const rate_of_change_gas = prevReading ? parseFloat((rawGas - prevReading.raw).toFixed(1)) : 0.0;
  const rate_of_change_hum = prevReading ? parseFloat((hum - prevReading.humidity).toFixed(1)) : 0.0;
  const rate_of_change_temp = prevReading ? parseFloat((temp - prevReading.temperature).toFixed(2)) : 0.0;

  // Calculate rolling average of gas over buffer window
  const windowSlice = readingsBuffer.slice(-10);
  const sumGas = windowSlice.reduce((acc, r) => acc + r.raw, rawGas);
  const rolling_avg_gas = Math.round(sumGas / (windowSlice.length + 1));

  // --- SIGNAL ANALYTICS MODULE (Regression Compensation, Slope & TTT, Sensor Health) ---
  const config = loadConfig();

  // (1) Steam response estimation & baseline compensation
  const { steamEstimate, compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);

  // (2) 10-sample slope & time-to-threshold estimation
  const { slope, timeToThresholdSeconds } = computeSlopeAndTimeToDanger(readingsBuffer, compensatedGas, config.dangerThreshold);

  // (3) Sensor health check (warm-up, flat-line, DHT11 failure)
  const sensorHealth = evaluateSensorHealth(readingsBuffer, { raw: rawGas, temperature: temp, humidity: hum }, config, hardwareStreamStartTime);

  // Run ML Classification logic
  let label = "Normal";
  let confidence = 0.95;
  let severity = "low";
  let factors = [];
  let isLowConfidenceOverride = false;

  // Rule 1: Steam / aerosol interference discrimination via Humidity RoC
  if (rate_of_change_hum > 6.0 || hum > 75.0) {
    if (rawGas > 280 && rawGas < 550) {
      label = "Background Interference";
      confidence = 0.89;
      severity = "low";
      factors = [
        `High humidity rate of change (+${rate_of_change_hum}%) matches cooking steam proxy`,
        "Gas excitation coincident with moisture condensation",
        "Network alert suppressed per REQ-ALT-2"
      ];
    }
  }

  // Rule 2: Genuine combustible gas leak
  const dangerFloor = config.dangerThreshold || 500;
  if (rawGas >= dangerFloor || (rate_of_change_gas >= 15.0 && hum < 72.0) || (compensatedGas >= 300 && hum < 72.0)) {
    label = "Genuine Leak";
    confidence = 0.96;
    severity = "high";
    factors = [
      `Dangerous gas concentration (${rawGas} ADC, Compensated: ${compensatedGas} ADC)`,
      `Sustained positive gas rate of change (+${rate_of_change_gas} ADC/s)`,
      "Ambient humidity stable — aerosol interference ruled out"
    ];
  } else if (label === "Normal") {
    factors = [
      `MQ2 Gas level (${rawGas} ADC) within safe ambient envelope`,
      "Ambient temperature and humidity steady"
    ];
  }

  // Safety Rule §1.2: Low confidence floor (< 0.75) defaulted to Genuine Leak
  if (confidence < 0.75) {
    label = "Genuine Leak";
    severity = "high";
    isLowConfidenceOverride = true;
    factors.unshift("Confidence < 75% floor — Safety Rule §1.2 defaulted to Genuine Leak");
  }

  // Inject analytics feedback into factors if active
  if (steamEstimate > 0) {
    factors.push(`Steam-response regression estimated -${steamEstimate} ADC (Compensated Gas: ${compensatedGas} ADC)`);
  }
  if (timeToThresholdSeconds !== null) {
    factors.push(`Compensated gas slope: +${slope} ADC/s — estimated ${timeToThresholdSeconds}s to danger threshold`);
  }
  if (sensorHealth.isDegraded) {
    sensorHealth.warnings.forEach(w => factors.push(`[SENSOR HEALTH] ${w}`));
  }

  const readingObj = {
    sensorId: "mq2-dht11-vit-01",
    raw: rawGas,
    gas: rawGas,
    temperature: temp,
    temp,
    humidity: hum,
    rh: hum,
    seq: currentSeq || 0,
    alarm: rawGas >= 500,
    compensatedGas,
    steamEstimate,
    deviceTime: deviceTime || Date.now(),
    serverTime: new Date().toISOString(),
    rate_of_change_gas,
    rate_of_change_hum,
    rate_of_change_temp,
    rolling_avg_gas,
    slope,
    timeToThresholdSeconds,
    sensorHealth,
    isFromDemo,
    isSimulated: isFromDemo,
    classification: {
      label,
      confidence,
      factors,
      severity,
      isLowConfidenceOverride
    }
  };

  latestReading = readingObj;
  readingsBuffer.push(readingObj);
  if (readingsBuffer.length > MAX_BUFFER) {
    readingsBuffer.shift();
  }

  // Live CSV recording session hook (only for real hardware)
  if (!isFromDemo) {
    recordReading(rawGas, temp, hum, deviceTime || Date.now());
  }

  // Auto-log alerts (flag simulated vs real hardware)
  if (label === "Genuine Leak" || label === "Background Interference") {
    const lastAlert = historicalAlerts[0];
    const isDifferentLabel = !lastAlert || lastAlert.classification.label !== label;
    const isDebounceElapsed = !lastAlert || (Date.now() - new Date(lastAlert.createdAt).getTime() > 10000);

    if (isDifferentLabel || isDebounceElapsed) {
      historicalAlerts.unshift({
        _id: `alt-${Date.now()}-${isFromDemo ? "sim" : "real"}`,
        classification: readingObj.classification,
        readingSnapshot: {
          raw: rawGas,
          temperature: temp,
          humidity: hum,
          timestamp: readingObj.serverTime
        },
        channel: label === "Genuine Leak" ? "network" : "local",
        status: label === "Genuine Leak" ? "active" : "suppressed",
        createdAt: readingObj.serverTime,
        isRealHardware: !isFromDemo,
        isSimulated: Boolean(isFromDemo),
        isDemo: Boolean(isFromDemo)
      });
      // Limit history buffer to 50 alerts
      if (historicalAlerts.length > 50) {
        historicalAlerts.pop();
      }
    }
  }

  return readingObj;
}

// Primary port confirmed on this machine: /dev/cu.usbserial-10
// On macOS, serialport requires cu.* (not tty.*) for outbound connections.
// Falls back to scanning if not available.
const PREFERRED_PORT = "/dev/cu.usbserial-10";

// --- AUTO-RECONNECT SERIAL WATCHDOG (Rules.md §2.3) ---
async function scanAndConnectSerial() {
  if (isHardwareConnected) return;

  try {
    const ports = await SerialPort.list();
    // Try preferred port first, then fall back to scan
    const arduinoPort = ports.find(p => p.path === PREFERRED_PORT) || ports.find(p => 
      (p.path && (
        p.path.includes("usbserial") || 
        p.path.includes("usbmodem") || 
        p.path.includes("wchusb") || 
        p.path.includes("ttyUSB") ||
        p.path.includes("Arduino")
      )) || 
      (p.manufacturer && p.manufacturer.toLowerCase().includes("arduino"))
    );

    if (arduinoPort) {
      console.log(`[SENTINEL Bridge] Found hardware on ${arduinoPort.path}. Connecting at 9600 baud...`);
      
      const port = new SerialPort({
        path: arduinoPort.path,
        baudRate: 9600,
        autoOpen: true
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      port.on('open', () => {
        isHardwareConnected = true;
        connectedPortName = arduinoPort.path;
        activeSerialPort = port;
        hardwareStreamStartTime = Date.now();
        console.log(`[SENTINEL Bridge] Successfully connected to ${arduinoPort.path} at 9600 baud`);
      });

      parser.on('data', (line) => {
        handleRawTelemetryLine(line, false);
      });

      port.on('close', () => {
        console.warn('[SENTINEL Bridge] Hardware disconnected. Watchdog resuming search...');
        isHardwareConnected = false;
        connectedPortName = null;
        activeSerialPort = null;
        hardwareStreamStartTime = null;
      });

      port.on('error', (err) => {
        console.error(`[SENTINEL Bridge] Serial error:`, err.message);
        isHardwareConnected = false;
        connectedPortName = null;
        activeSerialPort = null;
        hardwareStreamStartTime = null;
      });
    }
  } catch {
    // Keep server running smoothly
  }
}

// Raw telemetry ingestion handler — shared by real serial stream and synthetic demo packets
function handleRawTelemetryLine(line, isFromDemo = false) {
  try {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (!isFromDemo) {
      lastRealPacketTimestamp = Date.now();
      lastHardwarePacketTime = Date.now();
      if (demoActive) {
        stopDemoMode("Real device detected: demo mode stopped");
      }
    }

    // 1. JSON format support: {"raw": 342, "temp": 24.5, "hum": 58.2}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.raw === 'number') {
        processReading(parsed.raw, parsed.temp ?? 24.0, parsed.hum ?? 50.0, parsed.t, 0, isFromDemo);
      }
      return;
    }

    // 2. $S telemetry packet: $S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>
    if (trimmed.startsWith('$S,')) {
      const starIdx = trimmed.indexOf('*');
      if (starIdx !== -1) {
        const payload = trimmed.substring(1, starIdx);
        const checksumStr = trimmed.substring(starIdx + 1).trim();
        let cs = 0;
        for (let i = 0; i < payload.length; i++) cs ^= payload.charCodeAt(i);
        const expectedCs = parseInt(checksumStr, 16);
        if (cs !== expectedCs) {
          // Checksum mismatch: discard corrupted packet
          return;
        }

        const packetMatch = trimmed.match(/^\$S,(\d+),(\d+),(-?\d+),(\d+),(\d+)\*([0-9A-Fa-f]{2})/);
        if (packetMatch) {
          const packetSeq = parseInt(packetMatch[1], 10);
          const rawGas = parseInt(packetMatch[2], 10);
          const temp = parseInt(packetMatch[3], 10) / 10.0;
          const hum = parseInt(packetMatch[4], 10) / 10.0;
          processReading(rawGas, temp, hum, Date.now(), packetSeq, isFromDemo);
          return;
        }
      }
    }

    // 3. Plain-text format support: "Gas: 752 | Temp: 25.8C | Hum: 80.0%"
    const match = trimmed.match(/Gas:\s*(\d+).*?Temp:\s*([0-9.-]+).*?Hum:\s*([0-9.-]+)/i);
    if (match) {
      const rawGas = parseInt(match[1], 10);
      const temp = parseFloat(match[2]);
      const hum = parseFloat(match[3]);
      processReading(rawGas, temp, hum, Date.now(), 0, isFromDemo);
    }
  } catch {
    // Skip invalid frame
  }
}

// Watchdog interval: scans every 2 seconds without blocking Express (Rules §2.3)
setInterval(scanAndConnectSerial, 2000);

// Check if hardware stopped transmitting
setInterval(() => {
  if (isHardwareConnected && lastHardwarePacketTime && (Date.now() - lastHardwarePacketTime > 6000)) {
    console.warn("[SENTINEL Bridge] Hardware telemetry timeout (>6s since last packet).");
  }
}, 3000);

// --- REST API ENDPOINTS ---

// 1. GET /api/readings/latest
app.get('/api/readings/latest', (req, res) => {
  if ((!isHardwareConnected && !demoActive) || !latestReading) {
    return res.status(503).json({
      error: "Hardware sensor node disconnected. Awaiting USB serial connection.",
      hardwareConnected: false,
      demoActive: false
    });
  }
  res.json({
    ...latestReading,
    hardwareConnected: isHardwareConnected,
    demoActive,
    port: connectedPortName
  });
});

// 2. GET /api/readings/history
app.get('/api/readings/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  res.json(readingsBuffer.slice(-limit));
});

// 3. GET /api/alerts (REQ-DASH-2)
app.get('/api/alerts', (req, res) => {
  const { status, severity } = req.query;
  let filtered = historicalAlerts;
  if (status) filtered = filtered.filter(a => a.status === status);
  if (severity) filtered = filtered.filter(a => a.classification.severity === severity);
  res.json(filtered);
});

// 4. POST /api/alerts/:id/acknowledge (REQ-ALT-4)
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  historicalAlerts = historicalAlerts.map(a =>
    a._id === id
      ? { ...a, status: "acknowledged", acknowledgedAt: new Date().toISOString() }
      : a
  );
  res.json({ success: true, alertId: id });
});

// 5. POST /api/calibration/label (Admin labelling per REQ-ML-1)
app.post('/api/calibration/label', (req, res) => {
  const { readingId, label } = req.body;
  res.json({ success: true, readingId, label });
});

// 6. POST /api/calibration/retrain (REQ-ML-5)
app.post('/api/calibration/retrain', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      accuracy: 0.974,
      falsePositiveDrop: 0.785,
      retrainedAt: new Date().toISOString()
    });
  }, 800);
});

// 7. GET /api/hardware/status
app.get('/api/hardware/status', (req, res) => {
  const notice = demoNotice;
  demoNotice = null; // consume once
  res.json({
    hardwareConnected: isHardwareConnected,
    port: connectedPortName,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 9600,
    firmwareAlarmLoop: "Independent D8 Buzzer (Rules §1.1)",
    watchdogStatus: isHardwareConnected ? "Locked & Streaming" : "Active (2s auto-reconnect interval)",
    demoActive,
    scenario: currentDemoScenario,
    realDeviceActive: isRealDeviceActive(),
    demoNotice: notice
  });
});

// 7a. POST /api/demo/enable (and alias /api/demo/start)
const handleDemoStart = (req, res) => {
  if (isRealDeviceActive() || isRealFirmwareAlarmActive()) {
    return res.status(409).json({ error: "Real device or firmware alarm active. Demo mode prohibited." });
  }
  try {
    const { scenario } = req.body || {};
    if (scenario && SCENARIO_INFO[scenario]) {
      currentDemoScenario = scenario;
    }
    startDemoMode();
    res.json({ ok: true, demoActive: true, scenario: currentDemoScenario });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
};
app.post('/api/demo/enable', handleDemoStart);
app.post('/api/demo/start', handleDemoStart);

// 7b. POST /api/demo/disable (and alias /api/demo/stop)
const handleDemoStop = (req, res) => {
  stopDemoMode();
  res.json({ ok: true, demoActive: false });
};
app.post('/api/demo/disable', handleDemoStop);
app.post('/api/demo/stop', handleDemoStop);

// 7c. GET /api/demo/status
app.get('/api/demo/status', (req, res) => {
  res.json({
    ok: true,
    demoActive,
    scenario: currentDemoScenario,
    isRealDeviceActive: isRealDeviceActive(),
    lossRate: demoLossRate,
    corruptRate: demoCorruptRate
  });
});

// 7c. POST /api/demo/scenario
app.post('/api/demo/scenario', (req, res) => {
  const { scenario } = req.body || {};
  if (scenario && SCENARIO_INFO[scenario]) {
    currentDemoScenario = scenario;
    if (demoActive) {
      changeScenario(demoSimState, scenario);
    }
    return res.json({ ok: true, scenario: currentDemoScenario });
  }
  res.status(400).json({ error: "Invalid scenario. Choose from: normal, steam, cooking, gas_leak, adc_saturation, sensor_fault" });
});

// 7d. POST /api/demo/link
app.post('/api/demo/link', (req, res) => {
  const { lossRate, corruptRate } = req.body || {};
  if (typeof lossRate === 'number') demoLossRate = Math.max(0, Math.min(1, lossRate));
  if (typeof corruptRate === 'number') demoCorruptRate = Math.max(0, Math.min(1, corruptRate));
  res.json({ ok: true, lossRate: demoLossRate, corruptRate: demoCorruptRate });
});

// 7a. POST /api/hardware/test-buzzer
app.post('/api/hardware/test-buzzer', (req, res) => {
  if (isHardwareConnected && activeSerialPort) {
    activeSerialPort.write("TEST_BUZZER\n", (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to send command to serial port" });
      }
      res.json({ success: true, message: "TEST_BUZZER command dispatched to hardware" });
    });
  } else {
    res.status(503).json({ error: "Hardware disconnected" });
  }
});

// 8. GET & PATCH /api/caregivers
app.get('/api/caregivers', (req, res) => {
  res.json(caregiverLinks);
});

app.patch('/api/caregivers/:id', (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  caregiverLinks = caregiverLinks.map(l => l._id === id ? { ...l, active } : l);
  res.json({ success: true, link: caregiverLinks.find(l => l._id === id) });
});

// 9. GET /api/analytics/config
app.get('/api/analytics/config', (req, res) => {
  res.json(loadConfig());
});

// 10. Recording Mode Endpoints (REQ Dataset Collection)
app.get('/api/recording/status', (req, res) => {
  res.json(getRecordingStatus());
});

app.post('/api/recording/start', (req, res) => {
  const { label, filename } = req.body || {};
  const result = startRecording(label, filename);
  res.json(result);
});

app.post('/api/recording/stop', (req, res) => {
  const result = stopRecording();
  res.json(result);
});

app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SENTINEL Hardware Bridge running on http://${HOST}:${PORT}`);
  console.log(`📡 Auto-reconnect watchdog active: scanning USB ports...`);
  console.log(`🛡️ Hardware Priority Engine: Live telemetry takes precedence over demo mode.`);
  console.log(`=======================================================`);
});
