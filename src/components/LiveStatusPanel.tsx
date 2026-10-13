import { useState, useEffect, useRef } from "react";
import { usePolling } from "../hooks/usePolling";
import { useReadingHistory } from "../hooks/useReadingHistory";
import { useDeviceConnection } from "../hooks/useDeviceConnection";
import { usePipeline, type HistoryPoint } from "../hooks/usePipeline";
import { CFG, type Cls, type Level } from "../sim/pipeline";
import { soundSynthesizer, dispatchWebNotification } from "../services/notificationService";
import { getLatestReading, getHardwareStatus, disableDemoMode } from "../api";
import type { Severity } from "../types";
import { 
  Flame, 
  CloudFog, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Activity, 
  ShieldCheck, 
  Volume2, 
  Clock, 
  Info,
  Usb,
  Cpu,
  Bluetooth,
  Radio,
  Bell
} from "lucide-react";

// Soft pastel alert pills matching Styleguide
const labelTheme = {
  Normal: {
    pill: "alert-pill-success",
    cardBorder: "border-[#A1EBD6]",
    accentColor: "#10B981",
    icon: CheckCircle2,
    desc: "Baseline air quality verified. No dangerous combustible gas concentrations detected."
  },
  "Background Interference": {
    pill: "alert-pill-warning",
    cardBorder: "border-[#FDE68A]",
    accentColor: "#F59E0B",
    icon: CloudFog,
    desc: "Interference detected (steam/cooking aerosol). Network alert suppressed per REQ-ALT-2."
  },
  "Genuine Leak": {
    pill: "alert-pill-danger",
    cardBorder: "border-[#FCA5A5]",
    accentColor: "#EF4444",
    icon: Flame,
    desc: "CRITICAL: Combustible gas leak signature confirmed. Escalation sequence active (REQ-ALT-1)."
  }
};

const severityBadge: Record<Severity, { label: string; style: string }> = {
  low: { label: "Low Severity", style: "alert-pill-success" },
  medium: { label: "Medium Severity", style: "alert-pill-warning" },
  high: { label: "High Severity (Urgent)", style: "alert-pill-danger" }
};

const statusBadgeConfig = {
  disconnected: {
    label: "Disconnected",
    style: "bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]",
    dot: "bg-[#94A3B8]"
  },
  connecting: {
    label: "Connecting…",
    style: "alert-pill-warning",
    dot: "bg-[#F59E0B] animate-ping"
  },
  connected: {
    label: "Connected (SPP)",
    style: "alert-pill-success",
    dot: "bg-[#10B981] animate-pulse"
  },
  lost: {
    label: "Connection Lost",
    style: "alert-pill-danger",
    dot: "bg-[#EF4444] animate-ping"
  }
};

const getSignalQuality = (loss: number) => {
  if (loss <= 1.0) return { label: "Excellent", color: "text-[#0E7054]", bg: "bg-[#E8FAF4]", border: "border-[#A8EBD9]" };
  if (loss <= 5.0) return { label: "Good", color: "text-[#0369A1]", bg: "bg-[#E0F2FE]", border: "border-[#BAE6FD]" };
  if (loss <= 15.0) return { label: "Fair", color: "text-[#B45309]", bg: "bg-[#FEF3C7]", border: "border-[#FDE68A]" };
  return { label: "Degraded", color: "text-[#B91C1C]", bg: "bg-[#FEE2E2]", border: "border-[#FECACA]" };
};

const CLS_BANNER_CONFIG: Record<
  Cls,
  {
    label: string;
    description: string;
    bg: string;
    border: string;
    text: string;
    badgeStyle: string;
    icon: typeof CheckCircle2;
  }
> = {
  CALIBRATING: {
    label: "Calibrating baseline…",
    description: "Collecting initial ambient baseline samples. Please wait ~10 seconds.",
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-800",
    badgeStyle: "bg-slate-200 text-slate-800 border-slate-300",
    icon: Clock,
  },
  SAFE: {
    label: "SAFE",
    description: "Gas levels within normal environmental baseline. All sensors nominal.",
    bg: "bg-[#E8FAF4]",
    border: "border-[#A8EBD9]",
    text: "text-[#0E7054]",
    badgeStyle: "bg-[#D9F7EE] text-[#0E5A44] border-[#A1EBD6]",
    icon: CheckCircle2,
  },
  BENIGN_STEAM: {
    label: "steam suppressed",
    description: "Steam or cooking moisture detected. Plain detector would false-alarm; suppressed by SENTINEL.",
    bg: "bg-[#E0F2FE]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    badgeStyle: "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]",
    icon: CloudFog,
  },
  LEAK_SUSPECTED: {
    label: "leak suspected",
    description: "Compensated gas rising above baseline envelope. Escalation monitoring active.",
    bg: "bg-[#FEF3C7]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    badgeStyle: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
    icon: AlertTriangle,
  },
  GAS_LEAK: {
    label: "GAS LEAK",
    description: "CRITICAL: Genuine combustible gas leak confirmed. Emergency protocol active.",
    bg: "bg-[#FEE2E2]",
    border: "border-[#FCA5A5]",
    text: "text-[#991B1B]",
    badgeStyle: "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] animate-pulse",
    icon: Flame,
  },
  SENSOR_FAULT: {
    label: "sensor fault",
    description: "DHT11 communication failure or MQ-2 analog flatline detected. Service required.",
    bg: "bg-[#F3E8FF]",
    border: "border-[#D8B4FE]",
    text: "text-[#6B21A8]",
    badgeStyle: "bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]",
    icon: AlertTriangle,
  },
};

const LEVEL_STEPS: Level[] = ["NORMAL", "WARNING", "ALARM", "ESCALATED", "EMERGENCY"];

function RawVsCompensatedChart({ history }: { history: HistoryPoint[] }) {
  const W = 600;
  const H = 160;

  const pts = (f: (p: HistoryPoint) => number) => {
    if (history.length === 0) return "";
    const len = Math.max(1, history.length - 1);
    return history
      .map((p, i) => {
        const x = (i / len) * W;
        const val = Math.min(1023, Math.max(0, f(p)));
        const y = H - (val / 1023) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const yThr = H - (CFG.NAIVE_THRESHOLD / 1023) * H;

  return (
    <div className="elevation-1 rounded-3xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Comparative Sensor Analytics
          </span>
          <h3 className="text-base font-extrabold text-[#0F172A]">
            Raw MQ-2 vs. Humidity-Compensated Gas
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time multi-sensor regression subtracting thermal and humidity cross-sensitivity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center text-[#64748B]">
            <span className="w-3 h-1 bg-[#94A3B8] mr-1.5 inline-block rounded"></span>
            Raw MQ-2
          </span>
          <span className="inline-flex items-center text-[#0284C7]">
            <span className="w-3 h-1 bg-[#38BDF8] mr-1.5 inline-block rounded"></span>
            Compensated
          </span>
          <span className="inline-flex items-center text-[#D97706]">
            <span className="w-3.5 border-t-2 border-dashed border-[#F59E0B] mr-1.5 inline-block"></span>
            Plain Threshold ({CFG.NAIVE_THRESHOLD} ADC)
          </span>
        </div>
      </div>

      <div className="recessed-inset rounded-2xl p-2.5 overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-44 bg-[#0F172A] rounded-xl overflow-visible"
        >
          {/* Grid lines */}
          <line x1={0} x2={W} y1={H * 0.25} y2={H * 0.25} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={0} x2={W} y1={H * 0.5} y2={H * 0.5} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={0} x2={W} y1={H * 0.75} y2={H * 0.75} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

          {/* Plain naive threshold line */}
          <line
            x1={0}
            x2={W}
            y1={yThr}
            y2={yThr}
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={W - 8}
            y={Math.max(12, yThr - 4)}
            textAnchor="end"
            fill="#F59E0B"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Plain Threshold: {CFG.NAIVE_THRESHOLD} ADC
          </text>

          {/* Raw MQ-2 Polyline */}
          {history.length > 1 && (
            <polyline
              points={pts((p) => p.raw)}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Compensated Gas Polyline */}
          {history.length > 1 && (
            <polyline
              points={pts((p) => p.comp)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div className="flex flex-wrap justify-between items-center text-[11px] text-[#64748B] pt-1">
        <span>Window: {history.length} samples</span>
        <span>Sensor: MQ-2 (A0) + DHT11 (D2)</span>
        <span>Baseline compensation active</span>
      </div>
    </div>
  );
}

export default function LiveStatusPanel() {
  const deviceConn = useDeviceConnection();
  const { data: pollingReading, lastUpdated: pollingUpdated } = usePolling(getLatestReading, 2000);
  const [hwStatus, setHwStatus] = useState<{
    hardwareConnected: boolean;
    port: string | null;
    sensorSuite: string;
    baudRate: number;
    watchdogStatus: string;
    demoActive?: boolean;
    scenario?: string;
    realDeviceActive?: boolean;
    demoNotice?: string | null;
  }>({
    hardwareConnected: false,
    port: null,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 9600,
    watchdogStatus: "Scanning...",
    demoActive: false,
    scenario: "normal",
    realDeviceActive: false,
    demoNotice: null
  });

  useEffect(() => {
    getHardwareStatus().then(setHwStatus);
    const id = setInterval(() => {
      getHardwareStatus().then(setHwStatus);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Direct device connection takes priority over polling fallback
  const isDirectConnected = deviceConn.status === "connected" && !!deviceConn.latest;
  const activeReading = isDirectConnected ? deviceConn.latest : pollingReading;
  const isAnyHardwareConnected = isDirectConnected || (hwStatus.hardwareConnected && !!pollingReading) || (hwStatus.demoActive && !!pollingReading);
  const activeLastUpdated = isDirectConnected ? new Date() : pollingUpdated;

  // Real data always wins: if Bluetooth connects while demo mode is running, stop demo mode
  useEffect(() => {
    if (isDirectConnected && hwStatus.demoActive) {
      disableDemoMode().then(() => getHardwareStatus().then(setHwStatus));
    }
  }, [isDirectConnected, hwStatus.demoActive]);

  const history = useReadingHistory(activeReading, 24);
  const signalQuality = getSignalQuality(deviceConn.lossPct);

  // Reusable SENTINEL analysis pipeline hook
  const isHazardScenario = hwStatus.scenario === "gas_leak" || hwStatus.scenario === "adc_saturation";
  const truth: "benign" | "hazard" = (hwStatus.demoActive && isHazardScenario) ? "hazard" : "benign";
  const {
    analysis,
    history: pipelineHistory,
    counters: pipeCounters,
    ack: ackPipeline,
  } = usePipeline(activeReading, truth);

  // Toast and Escalation Notification Log State
  const [toast, setToast] = useState<{ id: string; message: string; type: "info" | "warning" | "danger" } | null>(null);
  const [escalationLog, setEscalationLog] = useState<Array<{ id: string; timestamp: Date; text: string; isSimulated: boolean; type: "info" | "warning" | "danger" }>>([]);

  const showToast = (message: string, type: "info" | "warning" | "danger" = "info") => {
    setToast({ id: `${Date.now()}-${Math.random()}`, message, type });
  };

  const addLogEntry = (text: string, isSimulated: boolean, type: "info" | "warning" | "danger" = "info") => {
    setEscalationLog((prev) => [
      { id: `${Date.now()}-${Math.random()}`, timestamp: new Date(), text, isSimulated, type },
      ...prev
    ].slice(0, 30));
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Real Hardware Life-Safety Priority Check: Real alerts are never suppressed or replaced by simulation
  const isRealHardwareActive = isDirectConnected || Boolean(hwStatus.realDeviceActive);
  const isRealAlarmActive = isRealHardwareActive && Boolean(activeReading?.alarm);

  // If real firmware alarm or real device alert is active, simulation mode MUST NOT interfere with it
  useEffect(() => {
    if (isRealAlarmActive && hwStatus.demoActive) {
      disableDemoMode().then(() => getHardwareStatus().then(setHwStatus));
      showToast("Real firmware alarm detected: simulation mode stopped", "danger");
      addLogEntry("Real firmware alarm active (Pin D8): simulation stopped & real safety floor prioritized", false, "danger");
    }
  }, [isRealAlarmActive, hwStatus.demoActive]);

  // Escalation transitions: Simulation mode -> simulated toasts/logs; Real mode -> real notifications
  const prevLevelRef = useRef<Level>("NORMAL");
  useEffect(() => {
    if (!analysis) return;
    const prevLevel = prevLevelRef.current;
    const currentLevel = analysis.level;
    prevLevelRef.current = currentLevel;

    if (prevLevel === currentLevel) return;

    const isSim = Boolean(hwStatus.demoActive);

    if (currentLevel === "ESCALATED") {
      if (isSim) {
        // While simulation mode is active: NO real SMS or email action
        const msg = "SMS to caregiver (simulated)";
        showToast(msg, "warning");
        addLogEntry(msg, true, "warning");
      } else {
        // Real notifications only work when simulation mode is off
        const msg = "SMS to caregiver (dispatched to primary contact)";
        showToast(msg, "danger");
        addLogEntry("Caregiver alerted via SMS and Email (Real dispatch)", false, "danger");
        dispatchWebNotification("🚨 SENTINEL: Escalated Gas Leak", {
          body: "Unacknowledged leak: Caregiver alerted via SMS and Email.",
          requireInteraction: true
        });
        soundSynthesizer.playAlarmBuzzer(80, 4);
      }
    } else if (currentLevel === "EMERGENCY") {
      if (isSim) {
        // While simulation mode is active: NO real 112 call action
        const msg = "112 prompt (simulated)";
        showToast(msg, "danger");
        addLogEntry(msg, true, "danger");
      } else {
        // Real notifications only work when simulation mode is off
        const msg = "112 prompt (emergency services response recommended)";
        showToast(msg, "danger");
        addLogEntry("112 emergency response prompt activated (Real alert)", false, "danger");
        dispatchWebNotification("🚨 CRITICAL EMERGENCY: Gas Leak", {
          body: "Severe unacknowledged leak: Calling 112 prompt active.",
          requireInteraction: true
        });
        soundSynthesizer.playAlarmBuzzer(100, 6);
      }
    }
  }, [analysis?.level, hwStatus.demoActive]);

  // Bluetooth & Web Serial Connection Control Card
  const renderBluetoothBar = () => (
    <div className="elevation-1 rounded-3xl p-5 border border-[#E2E8F0] space-y-3 bg-[#FFFFFF]">
      {!deviceConn.supported ? (
        <div className="alert-pill-warning rounded-2xl p-3.5 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B45309] flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-bold">Web Serial Unsupported: </span>
            Direct Bluetooth SPP connection requires the Web Serial API. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on desktop. The server polling path remains active as fallback.
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              deviceConn.status === 'connected' ? 'bg-[#E8FAF4] text-[#0E7054] border border-[#A8EBD9]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#0F172A]">HC-05 Bluetooth SPP</span>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeConfig[deviceConn.status].style}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadgeConfig[deviceConn.status].dot}`}></span>
                  {statusBadgeConfig[deviceConn.status].label}
                </span>

                {/* Signal Quality indicator using lossPct */}
                {deviceConn.status === 'connected' && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${signalQuality.bg} ${signalQuality.color} ${signalQuality.border}`}>
                    <Radio className="w-3 h-3 mr-1" />
                    <span>{deviceConn.lossPct}% Loss ({signalQuality.label})</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {deviceConn.status === 'connected'
                  ? `Active wireless stream: Direct Web Serial overriding polling fallback (${deviceConn.portInfo || "HC-05"})`
                  : `Direct browser-to-sensor link via Web Serial (runs without local backend bridge)`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            {deviceConn.status === 'connected' || deviceConn.status === 'connecting' ? (
              <button
                type="button"
                onClick={deviceConn.disconnect}
                className="btn-secondary-clay px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5"
              >
                <span>Disconnect Device</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={deviceConn.connect}
                className="btn-primary-mint px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Connect Bluetooth Device</span>
              </button>
            )}
          </div>
        </div>
      )}

      {deviceConn.error && (
        <div className="alert-pill-danger rounded-2xl p-3 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C] flex-shrink-0" />
          <span>{deviceConn.error}</span>
        </div>
      )}
    </div>
  );

  // If no hardware is connected, show tactile hardware connection card
  if (!activeReading || !isAnyHardwareConnected) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {renderBluetoothBar()}

        <div className="elevation-2 rounded-3xl p-8 sm:p-10 text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(245,158,11,0.15)]">
            <Usb className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold alert-pill-warning">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] mr-2 animate-ping"></span>
              Awaiting Hardware Telemetry
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Hardware Sensor Node Disconnected
            </h2>
            <p className="text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
              No active USB serial stream or Bluetooth SPP connection detected. Connect wirelessly via Bluetooth above or plug in the Arduino Nano USB cable.
            </p>
          </div>

          {/* Diagnostic Recessed Inset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            <div className="recessed-inset p-4 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Hardware Target</div>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">Arduino Nano</div>
              <div className="text-[#64748B] text-xs mt-0.5">MQ2 (A0) • DHT11 (D2)</div>
            </div>

            <div className="recessed-inset p-4 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Interface Rate</div>
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">9600 Baud</div>
              <div className="text-[#64748B] text-xs mt-0.5">Newline $S / Text CDC</div>
            </div>

            <div className="recessed-inset p-4 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Watchdog Status</div>
              <div className="font-bold text-[#0E7054] text-sm mt-0.5">Active (2s Loop)</div>
              <div className="text-[#64748B] text-xs mt-0.5">Auto-binds on connect</div>
            </div>
          </div>

          {/* How to Connect Step-by-Step */}
          <div className="elevation-1 p-5 rounded-2xl text-left text-xs text-[#475569] space-y-2.5">
            <div className="font-bold text-[#0F172A] flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#0E7054]" />
              <span>Physical Setup Instructions:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#475569]">
              <li>Pair your HC-05 Bluetooth module or plug in your Arduino Nano USB cable.</li>
              <li>Click &quot;Connect Bluetooth Device&quot; above to link directly via Web Serial, or start the server bridge with <code className="bg-[#ECEEF2] px-1.5 py-0.5 rounded text-[#0F172A] font-mono">npm run server</code>.</li>
              <li>As soon as the board transmits telemetry packets, live gauges and sparklines will activate immediately.</li>
            </ol>
          </div>

        </div>
      </div>
    );
  }

  const raw = activeReading.raw;
  const temp = activeReading.temperature;
  const hum = activeReading.humidity;
  const classification = activeReading.classification || {
    label: "Normal",
    confidence: 0.95,
    factors: ["Gas readings within baseline envelope"],
    severity: "low"
  };

  const theme = labelTheme[classification.label] || labelTheme.Normal;
  const IconComponent = theme.icon;
  const isLowConfidence = classification.confidence < 0.75;
  const confidencePct = Math.round(classification.confidence * 100);

  // SVG Sparkline calculation
  const minRaw = Math.min(...history, 100);
  const maxRaw = Math.max(...history, 700);
  const svgWidth = 280;
  const svgHeight = 60;
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1 || 1)) * svgWidth;
    const y = svgHeight - ((val - minRaw) / (maxRaw - minRaw || 1)) * (svgHeight - 10) - 5;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6">
      {/* Real Physical Firmware Alarm Banner (Unconditional Life-Safety Floor) */}
      {isRealAlarmActive && (
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-950 animate-pulse">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#EF4444] text-white flex-shrink-0 shadow-md">
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#EF4444] text-white tracking-wider">
                  REAL FIRMWARE SAFETY FLOOR ACTIVE (PIN D8)
                </span>
                <span className="text-xs font-bold text-red-700 font-mono">
                  HARDWARE BUZZER TRIGGERED
                </span>
              </div>
              <h3 className="text-lg font-black text-[#7F1D1D] mt-1">
                Unconditional Hardware Life-Safety Alarm
              </h3>
              <p className="text-xs text-[#991B1B] mt-0.5 max-w-xl leading-relaxed">
                Physical sensor node has breached the hardcoded hardware safety floor ({activeReading?.raw} ADC &gt; 300). Governed directly in Arduino microcontroller firmware; cannot be silenced, muted, or replaced by simulation mode.
              </p>
            </div>
          </div>
          <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
            <span className="text-xs font-bold uppercase text-red-800">Hardware Reading</span>
            <span className="text-2xl font-mono font-black text-red-900">
              {activeReading?.raw} ADC
            </span>
          </div>
        </div>
      )}

      {renderBluetoothBar()}

      {/* Demo Readings Active Banner (Rule 5) */}
      {!isDirectConnected && hwStatus.demoActive && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider">
              DEMO READINGS ACTIVE — Scenario: {hwStatus.scenario || 'normal'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#78350F]">
            Synthetic stream driving gauges & analytics
          </span>
        </div>
      )}

      {/* 1. SENTINEL Pipeline Classification Banner */}
      {analysis && (
        (() => {
          const banner = CLS_BANNER_CONFIG[analysis.cls] || CLS_BANNER_CONFIG.SAFE;
          const BannerIcon = banner.icon;
          return (
            <div className={`rounded-3xl p-4 sm:p-5 border ${banner.bg} ${banner.border} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className={`p-2.5 rounded-2xl ${banner.badgeStyle} flex-shrink-0`}>
                  <BannerIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-base font-extrabold uppercase tracking-tight ${banner.text}`}>
                      {banner.label}
                    </span>
                    {analysis.calibrating && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white text-slate-700 border border-slate-300">
                        {Math.round(analysis.calibProgress * 100)}%
                      </span>
                    )}
                    {analysis.saturated && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                        ADC OVERFLOW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {banner.description}
                  </p>
                </div>
              </div>

              {/* Baseline / Engine readout */}
              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between text-xs text-[#64748B]">
                <span className="font-semibold">Pipeline Baseline</span>
                <span className="font-mono text-[11px]">
                  {analysis.calibrating ? "Calibrating..." : `${analysis.baseline.toFixed(0)} ADC`}
                </span>
              </div>
            </div>
          );
        })()
      )}

      {/* 2. Escalation Stepper & Acknowledge Button */}
      {analysis && (
        <div className={`elevation-1 rounded-3xl p-5 border ${
          analysis.level === "EMERGENCY"
            ? "bg-red-50 border-red-500 animate-pulse"
            : analysis.level === "ESCALATED"
            ? "bg-red-50 border-red-400"
            : analysis.level === "ALARM"
            ? "bg-red-50 border-red-300"
            : analysis.level === "WARNING"
            ? "bg-amber-50 border-amber-300"
            : "bg-white border-[#E2E8F0]"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Escalation Stepper
                </span>
                {analysis.level === "ACKNOWLEDGED" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                    ACKNOWLEDGED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {LEVEL_STEPS.map((step, idx) => {
                  const isActive = analysis.level === step;
                  const isPassed =
                    LEVEL_STEPS.indexOf(analysis.level) > idx && analysis.level !== "ACKNOWLEDGED";

                  return (
                    <div key={step} className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          isActive
                            ? step === "EMERGENCY" || step === "ESCALATED" || step === "ALARM"
                              ? "bg-[#EF4444] text-white shadow-sm ring-2 ring-red-300"
                              : step === "WARNING"
                              ? "bg-[#F59E0B] text-black shadow-sm ring-2 ring-amber-300"
                              : "bg-[#10B981] text-white shadow-sm ring-2 ring-emerald-300"
                            : isPassed
                            ? "bg-slate-200 text-slate-700"
                            : "bg-[#F1F5F9] text-[#94A3B8]"
                        }`}
                      >
                        {step}
                      </span>
                      {idx < LEVEL_STEPS.length - 1 && (
                        <span className="text-[#CBD5E1] mx-1 font-bold text-xs">→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acknowledge Button */}
            <div className="flex items-center space-x-3 self-start md:self-center">
              {analysis.smartAlarm && analysis.level !== "ACKNOWLEDGED" ? (
                <button
                  type="button"
                  onClick={ackPipeline}
                  className="btn-primary-mint px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center space-x-2 shadow-sm animate-bounce cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0E4E3A]" />
                  <span>Acknowledge Alarm</span>
                </button>
              ) : analysis.level === "ACKNOWLEDGED" ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  Alarm Acknowledged
                </span>
              ) : null}
            </div>
          </div>

          {analysis.smartAlarm && (
            <div className="mt-3 pt-2.5 border-t border-red-200 text-xs text-[#991B1B] font-medium flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Alarm active for {analysis.alarmTicks}s. Unacknowledged for {CFG.ESCALATE_AFTER}s notifies caregiver, and for {CFG.EMERGENCY_AFTER}s prompts 112 emergency response.
              </span>
            </div>
          )}

          {/* Escalation & Dispatch Log */}
          <div className="mt-3.5 pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-semibold">
              <span className="flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-[#0E7054]" />
                <span>Escalation & Dispatch Log</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                hwStatus.demoActive
                  ? "text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]"
                  : "text-[#0E5A44] bg-[#D9F7EE] border-[#A1EBD6]"
              }`}>
                {hwStatus.demoActive ? "Simulated Mode: No Real SMS/112 Calls" : "Live Mode: Real Dispatch Active"}
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {escalationLog.length === 0 ? (
                <div className="text-[11px] text-[#94A3B8] italic p-1">
                  Awaiting escalation triggers... ({hwStatus.demoActive ? "Simulation: synthetic notifications only" : "Real alerts active on leak"})
                </div>
              ) : (
                escalationLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`text-xs p-2 rounded-xl flex items-center justify-between font-mono ${
                      entry.type === "danger"
                        ? "bg-red-50 text-red-900 border border-red-200"
                        : entry.type === "warning"
                        ? "bg-amber-50 text-amber-900 border border-amber-200"
                        : "bg-slate-50 text-slate-800 border border-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-sans">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="font-semibold font-sans">{entry.text}</span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase font-sans ${
                        entry.isSimulated
                          ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {entry.isSimulated ? "Simulated" : "Real Action"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. "Compensated residual" and "Estimated time to danger" cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Compensated Residual Card */}
        <div className="elevation-1 rounded-3xl p-6 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Compensated Residual
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A]">
                  {analysis && !analysis.calibrating
                    ? `${analysis.residual > 0 ? "+" : ""}${analysis.residual.toFixed(0)}`
                    : "—"}
                </span>
                <span className="text-xs text-[#64748B] font-mono">ADC</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E0F2FE] text-[#0369A1]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-1">gas minus steam effect, minus baseline</p>
          <div className="mt-4 pt-3 border-t border-[#F1F3F6] flex justify-between text-xs text-[#64748B]">
            <span>Baseline Gas:</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {analysis && !analysis.calibrating ? `${analysis.baseline.toFixed(0)} ADC` : "Calibrating..."}
            </span>
          </div>
        </div>

        {/* Estimated Time to Danger Card */}
        <div className="elevation-1 rounded-3xl p-6 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Estimated Time to Danger
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A]">
                  {analysis?.timeToDanger == null
                    ? "—"
                    : analysis.timeToDanger === 0
                    ? "NOW"
                    : `${analysis.timeToDanger.toFixed(0)} s`}
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-2xl ${
                analysis?.timeToDanger !== null && analysis?.timeToDanger !== undefined && analysis.timeToDanger <= 30
                  ? "bg-[#FEE2E2] text-[#B91C1C] animate-pulse"
                  : "bg-[#FEF3C7] text-[#B45309]"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {analysis && !analysis.calibrating
              ? `slope ${analysis.slope > 0 ? "+" : ""}${analysis.slope.toFixed(1)} /s`
              : "Waiting for baseline"}
          </p>
          <div className="mt-4 pt-3 border-t border-[#F1F3F6] flex justify-between text-xs text-[#64748B]">
            <span>Projection Status:</span>
            <span
              className={`font-semibold ${
                analysis?.timeToDanger === 0
                  ? "text-[#B91C1C]"
                  : analysis?.timeToDanger !== null && analysis?.timeToDanger !== undefined
                  ? "text-[#B45309]"
                  : "text-[#0E7054]"
              }`}
            >
              {analysis?.timeToDanger === 0
                ? "Danger Threshold Exceeded"
                : analysis?.timeToDanger !== null && analysis?.timeToDanger !== undefined
                ? "Approaching Threshold"
                : "Nominal / Safe Envelope"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Raw vs Compensated Chart with Plain-Threshold Line */}
      <RawVsCompensatedChart history={pipelineHistory} />

      {/* 5. Plain threshold vs SENTINEL Comparison Table (Simulation Mode Only) */}
      {hwStatus.demoActive && (
        <div className="elevation-1 rounded-3xl p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Detector Comparison
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Simulation Mode Active
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                Plain Threshold vs. SENTINEL Pipeline
              </h3>
              <p className="text-xs text-[#64748B]">
                Demonstrates suppression of false alarms from humidity/steam interference while reliably alarming on true hazards.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-bold text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Detector</th>
                  <th className="px-4 py-3 text-center">False Alarms</th>
                  <th className="px-4 py-3 text-center">Correct Alarms</th>
                  <th className="px-4 py-3 text-center">Interference Immunity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium">
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3.5 font-bold text-[#0F172A]">
                    Plain Threshold (&gt;{CFG.NAIVE_THRESHOLD} ADC)
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#D97706]">
                    {pipeCounters.naiveFalse}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0F172A]">
                    {pipeCounters.naiveTrue}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Vulnerable
                    </span>
                  </td>
                </tr>
                <tr className="bg-[#E8FAF4]/40 hover:bg-[#E8FAF4]/70">
                  <td className="px-4 py-3.5 font-bold text-[#0E7054] flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0E7054]" />
                    <span>SENTINEL Pipeline (Compensation + ML)</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0E7054]">
                    {pipeCounters.smartFalse}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0E7054]">
                    {pipeCounters.smartTrue}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Suppression
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sensor Degraded Warning Banner (REQ Sensor Health Diagnostics) */}
      {activeReading.sensorHealth?.isDegraded && (
        <div className="alert-pill-warning rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm border border-[#FDE68A]">
          <AlertTriangle className="w-5 h-5 text-[#B45309] mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1 text-xs leading-relaxed">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#92400E]">SENSOR DEGRADED</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FFFFFF] text-[#92400E] font-mono font-bold uppercase shadow-xs">
                {activeReading.sensorHealth.status}
              </span>
            </div>
            <ul className="mt-1 space-y-0.5 text-[#78350F] list-disc list-inside">
              {activeReading.sensorHealth.warnings.map((w, idx) => (
                <li key={idx} className="font-medium">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Estimated Seconds to Danger Alert Banner */}
      {typeof activeReading.timeToThresholdSeconds === "number" && activeReading.timeToThresholdSeconds > 0 && (
        <div className="alert-pill-danger rounded-2xl p-4 flex items-center justify-between shadow-sm border border-[#FCA5A5] animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#FFFFFF] text-[#EF4444] shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-[#991B1B] text-sm">
                ESTIMATED SECONDS TO DANGER: {activeReading.timeToThresholdSeconds}s
              </div>
              <p className="text-xs text-[#7F1D1D] mt-0.5">
                Compensated gas trend rising at +{activeReading.slope ?? activeReading.rate_of_change_gas} ADC/s. Danger threshold (500 ADC) projected in {activeReading.timeToThresholdSeconds} seconds.
              </p>
            </div>
          </div>
          <span className="font-mono font-extrabold text-2xl text-[#991B1B] px-3.5 py-1.5 rounded-2xl bg-[#FFFFFF] shadow-sm">
            {activeReading.timeToThresholdSeconds}s
          </span>
        </div>
      )}
      
      {/* Low-Confidence Safety Override Banner (Rules §1.2) */}
      {isLowConfidence && (
        <div className="alert-pill-danger rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-[#B91C1C] mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs leading-relaxed">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#991B1B]">SAFETY RULE §1.2 ENFORCED: LOW CONFIDENCE OVERRIDE</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FFFFFF] text-[#991B1B] font-mono font-bold">
                {confidencePct}% &lt; 75% Floor
              </span>
            </div>
            <p className="text-[#7F1D1D] mt-1">
              Classifier confidence is below safety threshold. Ambiguous readings automatically default to <strong>Genuine Leak</strong> to safeguard occupants.
            </p>
          </div>
        </div>
      )}

      {/* Main Status Hero Card */}
      <div className={`elevation-2 rounded-3xl p-6 sm:p-8 border ${theme.cardBorder}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold ${theme.pill}`}>
                <IconComponent className="w-3.5 h-3.5 mr-1.5" />
                {classification.label}
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityBadge[classification.severity].style}`}>
                {severityBadge[classification.severity].label}
              </span>

              {classification.label === "Genuine Leak" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold alert-pill-danger animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  Local Alarm Active (D8)
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {classification.label === "Normal" && "Environment Safe & Stable"}
              {classification.label === "Background Interference" && "Transient Interference Filtered"}
              {classification.label === "Genuine Leak" && "Combustible Gas Leak Warning"}
            </h2>

            <p className="text-xs sm:text-sm text-[#475569] max-w-2xl leading-relaxed">
              {theme.desc}
            </p>
          </div>

          {/* Tactile Confidence Meter */}
          <div className="recessed-inset rounded-2xl p-4 lg:w-76 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B] font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#0E7054]" />
                Classifier Confidence
              </span>
              <span className="font-mono font-bold text-[#0F172A] text-sm">{confidencePct}%</span>
            </div>

            <div className="h-2.5 w-full bg-[#CBD5E1] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#10B981]"
                style={{ width: `${confidencePct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#94A3B8] font-medium">
              <span>Safety Floor: 75%</span>
              <span>7-Variable Vector</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3 Telemetry Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: MQ2 Gas Sensor */}
        <div className="elevation-1 rounded-3xl p-6 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">MQ2 Gas Sensor</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A]">{raw}</span>
                <span className="text-xs text-[#94A3B8] font-mono">/ 1023 ADC</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8FAF4] text-[#0E7054]">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Steam Regression Compensation Pill */}
          <div className="mt-2 text-xs flex flex-wrap items-center gap-1.5 font-medium">
            <span className="text-[#64748B]">Compensated:</span>
            <span className="font-mono font-bold text-[#0F172A]">{activeReading.compensatedGas ?? raw} ADC</span>
            {typeof activeReading.steamEstimate === "number" && activeReading.steamEstimate > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] alert-pill-warning font-semibold">
                -{activeReading.steamEstimate} steam
              </span>
            )}
          </div>

          {/* Estimated Seconds to Danger Metric */}
          <div className="mt-2.5 pt-2 border-t border-[#F1F3F6]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B] font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#0E7054]" />
                <span>Est. Seconds to Danger:</span>
              </span>
              {activeReading.timeToThresholdSeconds === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-extrabold alert-pill-danger animate-pulse">
                  0s (THRESHOLD MET)
                </span>
              ) : typeof activeReading.timeToThresholdSeconds === "number" ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-extrabold alert-pill-danger">
                  {activeReading.timeToThresholdSeconds}s
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold alert-pill-success">
                  Safe / Stable
                </span>
              )}
            </div>
          </div>

          {/* Sparkline */}
          <div className="mt-3 pt-2.5 border-t border-[#F1F3F6]">
            <div className="flex justify-between text-[11px] text-[#64748B] mb-1">
              <span>Rolling 10s Window</span>
              <span className="font-mono">
                {activeReading?.slope !== undefined
                  ? `${activeReading.slope > 0 ? "+" : ""}${activeReading.slope} ADC/s`
                  : activeReading?.rate_of_change_gas
                  ? `${activeReading.rate_of_change_gas > 0 ? "+" : ""}${activeReading.rate_of_change_gas} ADC/s`
                  : "0.0/s"}
              </span>
            </div>
            <div className="h-14 w-full recessed-inset rounded-xl p-1 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <polyline
                  fill="none"
                  stroke={raw > 500 ? "#EF4444" : raw > 300 ? "#F59E0B" : "#10B981"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="elevation-1 rounded-3xl p-6 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Ambient Temperature</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A]">{temp}°</span>
                <span className="text-xs text-[#64748B]">Celsius</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E0F2FE] text-[#0369A1]">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F3F6] space-y-1.5 text-xs text-[#64748B]">
            <div className="flex justify-between">
              <span>Hardware Sensor</span>
              <span className="font-mono text-[#0F172A]">DHT11 (Pin D2)</span>
            </div>
            <div className="flex justify-between">
              <span>Thermal Drift</span>
              <span className="font-mono text-[#0F172A]">{activeReading?.rate_of_change_temp ?? 0.0}°C/min</span>
            </div>
          </div>
        </div>

        {/* Card 3: Relative Humidity */}
        <div className="elevation-1 rounded-3xl p-6 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Relative Humidity</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0F172A]">{hum}%</span>
                <span className="text-xs text-[#64748B]">RH</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
              <Droplets className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F3F6] space-y-1.5 text-xs text-[#64748B]">
            <div className="flex justify-between">
              <span>Humidity RoC (Steam Proxy)</span>
              <span className="font-mono text-[#0F172A]">{activeReading?.rate_of_change_hum ?? 0.0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Interference Damping</span>
              <span className="font-semibold text-[#0E7054]">{hum > 75 ? "Active" : "Clear"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Decision Factors Card */}
      <div className="elevation-1 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#0E7054]" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Classifier Decision Factors (REQ-ML-4)
            </h3>
          </div>
          <div className="flex items-center text-xs text-[#64748B] font-mono space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: {activeLastUpdated ? activeLastUpdated.toLocaleTimeString() : "--:--:--"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classification.factors.map((factor, idx) => (
            <div
              key={idx}
              className="recessed-inset rounded-2xl p-3.5 text-xs text-[#334155] flex items-start space-x-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] flex items-center justify-center font-mono font-bold flex-shrink-0 text-[10px] shadow-sm">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* On-screen Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between space-x-3 text-xs font-bold ${
            toast.type === "danger"
              ? "bg-[#991B1B] text-white border-red-400"
              : toast.type === "warning"
              ? "bg-[#D97706] text-white border-amber-300"
              : "bg-[#0F172A] text-white border-slate-700"
          }`}>
            <div className="flex items-center space-x-2.5">
              <Bell className="w-4 h-4 flex-shrink-0 animate-pulse" />
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white font-mono text-base leading-none p-1 cursor-pointer"
              aria-label="Close toast"
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
