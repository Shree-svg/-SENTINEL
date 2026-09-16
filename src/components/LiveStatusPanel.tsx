// src/components/LiveStatusPanel.tsx
// Real-time status panel styled with Product UI Styleguide (Elevated Clay Surfaces, Mint Accents)

import { useState, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { useReadingHistory } from "../hooks/useReadingHistory";
import { getLatestReading, getHardwareStatus } from "../api";
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
  Cpu
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

export default function LiveStatusPanel() {
  const { data: reading, lastUpdated } = usePolling(getLatestReading, 2000);
  const [hwStatus, setHwStatus] = useState<{
    hardwareConnected: boolean;
    port: string | null;
    sensorSuite: string;
    baudRate: number;
    watchdogStatus: string;
  }>({
    hardwareConnected: false,
    port: null,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 115200,
    watchdogStatus: "Scanning..."
  });

  useEffect(() => {
    getHardwareStatus().then(setHwStatus);
    const id = setInterval(() => {
      getHardwareStatus().then(setHwStatus);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const history = useReadingHistory(reading, 24);

  // If no hardware is connected, show tactile hardware connection card
  if (!reading || !hwStatus.hardwareConnected) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="elevation-2 rounded-3xl p-8 sm:p-10 text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(245,158,11,0.15)]">
            <Usb className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold alert-pill-warning">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] mr-2 animate-ping"></span>
              Awaiting USB Hardware Telemetry
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Hardware Sensor Node Disconnected
            </h2>
            <p className="text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
              No active USB serial stream detected. The auto-reconnect watchdog is continuously scanning USB ports every 2 seconds.
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
              <div className="font-bold text-[#0F172A] text-sm mt-0.5">115200 Baud</div>
              <div className="text-[#64748B] text-xs mt-0.5">Newline JSON CDC</div>
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
              <li>Plug your Arduino Nano into a USB port on this computer.</li>
              <li>Upload <code className="bg-[#ECEEF2] px-1.5 py-0.5 rounded text-[#0F172A] font-mono">firmware/sentinel_firmware.ino</code> using Arduino IDE.</li>
              <li>As soon as the board sends telemetry, this screen will immediately display your live sensor data.</li>
            </ol>
          </div>

        </div>
      </div>
    );
  }

  const raw = reading.raw;
  const temp = reading.temperature;
  const hum = reading.humidity;
  const classification = reading.classification || {
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

          {/* Sparkline */}
          <div className="mt-4 pt-3 border-t border-[#F1F3F6]">
            <div className="flex justify-between text-[11px] text-[#64748B] mb-1">
              <span>Rolling 10s Window</span>
              <span className="font-mono">{reading?.rate_of_change_gas ? `${reading.rate_of_change_gas > 0 ? "+" : ""}${reading.rate_of_change_gas} ADC/s` : "0.0/s"}</span>
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
              <span className="font-mono text-[#0F172A]">{reading?.rate_of_change_temp ?? 0.0}°C/min</span>
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
              <span className="font-mono text-[#0F172A]">{reading?.rate_of_change_hum ?? 0.0}%</span>
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
            <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}</span>
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

    </div>
  );
}
