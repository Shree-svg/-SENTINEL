// src/components/AdminCalibrationView.tsx
// Sensor calibration, data labelling, and ML retrain trigger UI (Product UI Styleguide)

import { useState, useEffect } from "react";
import { getReadingsHistory, labelReading, retrainModel } from "../api";
import type { Reading, ClassificationLabel, Severity } from "../types";
import { 
  Cpu, 
  Tag, 
  Play, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  Database
} from "lucide-react";

const labelColors: Record<ClassificationLabel, string> = {
  Normal: "alert-pill-success",
  "Background Interference": "alert-pill-warning",
  "Genuine Leak": "alert-pill-danger"
};

const severityColors: Record<Severity, string> = {
  low: "alert-pill-success",
  medium: "alert-pill-warning",
  high: "alert-pill-danger"
};

export default function AdminCalibrationView() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainResult, setRetrainResult] = useState<{ accuracy: number; falsePositiveDrop: number } | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getReadingsHistory(15);
      setReadings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLabelChange = async (readingId: string, label: ClassificationLabel) => {
    try {
      await labelReading(readingId, label);
      setReadings((prev) =>
        prev.map((r) =>
          r._id === readingId
            ? {
                ...r,
                classification: {
                  label,
                  confidence: 0.98,
                  severity: label === "Genuine Leak" ? "high" : "low",
                  factors: [`Manually labelled as ${label} by administrator`]
                }
              }
            : r
        )
      );
      setSaveNotice(`Saved ground-truth label for reading ${readingId.substring(0, 10)}`);
      setTimeout(() => setSaveNotice(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const res = await retrainModel();
      setRetrainResult({
        accuracy: res.accuracy,
        falsePositiveDrop: res.falsePositiveDrop
      });
    } catch (e) {
      console.error(e);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {saveNotice && (
        <div className="fixed top-20 right-6 z-50 alert-pill-success font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 border border-[#A1EBD6]">
          <CheckCircle2 className="w-4 h-4 text-[#0E7054]" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Header with Retrain Action */}
      <div className="elevation-2 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7054]">
              Machine Learning Pipeline
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] alert-pill-success font-bold">
              PHASE 3 &amp; 4
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mt-1">
            Sensor Calibration &amp; Label Annotation
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Label incoming MQ2 + DHT11 telemetry sessions to retrain the Random Forest / SVM classifier and reduce false alarms.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="btn-primary-mint self-start md:self-auto px-5 py-3 rounded-full text-xs font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${retraining ? "animate-spin" : ""}`} />
          <span>{retraining ? "Training 7-Feature Model…" : "Trigger Model Retrain (REQ-ML-5)"}</span>
        </button>
      </div>

      {/* Model Retraining Metrics Card */}
      {retrainResult && (
        <div className="elevation-1 p-6 rounded-3xl space-y-4 border-2 border-[#A8EBD9]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0E7054] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#0E7054]" />
            <span>Retraining Complete — Model Performance Metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="recessed-inset p-4 rounded-2xl">
              <span className="text-[10px] text-[#64748B] uppercase font-bold">Cross-Validation Accuracy</span>
              <div className="text-2xl font-mono font-extrabold text-[#0E7054] mt-0.5">
                {(retrainResult.accuracy * 100).toFixed(1)}%
              </div>
            </div>

            <div className="recessed-inset p-4 rounded-2xl">
              <span className="text-[10px] text-[#64748B] uppercase font-bold">False Alarm Reduction</span>
              <div className="text-2xl font-mono font-extrabold text-[#0369A1] mt-0.5">
                -{(retrainResult.falsePositiveDrop * 100).toFixed(1)}%
              </div>
            </div>

            <div className="recessed-inset p-4 rounded-2xl">
              <span className="text-[10px] text-[#64748B] uppercase font-bold">Active Confidence Floor</span>
              <div className="text-2xl font-mono font-extrabold text-[#854D0E] mt-0.5">
                75.0% (Rules §1.2)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Feature Vector Architecture Spec */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="elevation-1 p-5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0F172A] uppercase">
            <Layers className="w-4 h-4 text-[#0E7054]" />
            <span>7-Variable Vector (Design §3)</span>
          </div>
          <p className="text-[11px] text-[#64748B] font-mono leading-relaxed">
            [raw, rate_of_change_gas, rolling_avg_gas, temp, hum, rate_of_change_hum, rate_of_change_temp]
          </p>
        </div>

        <div className="elevation-1 p-5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0F172A] uppercase">
            <Cpu className="w-4 h-4 text-[#0E7054]" />
            <span>Safety Isolation (Rules §2.1)</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Isolated `classifyReading(features)` wrapper. Onboard buzzer threshold remains fully independent in firmware.
          </p>
        </div>

        <div className="elevation-1 p-5 rounded-2xl space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0F172A] uppercase">
            <Database className="w-4 h-4 text-[#0E7054]" />
            <span>Calibration Floor (REQ-ML-2)</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            If under-calibrated (&lt; 50 samples), system reverts safely to fixed ADC threshold fallback.
          </p>
        </div>
      </div>

      {/* Label Annotation Table */}
      <div className="elevation-1 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#F1F3F6] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-[#0E7054]" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Telemetry Sample Labelling Queue
            </h3>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {readings.length} Samples in Buffer
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left">
            <thead className="bg-[#FAFBFD] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">MQ2 Raw (ADC)</th>
                <th className="py-3.5 px-5">DHT11 Temp</th>
                <th className="py-3.5 px-5">DHT11 Humidity</th>
                <th className="py-3.5 px-5">Supervised Ground-Truth Label</th>
                <th className="py-3.5 px-5">Severity Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F6] text-xs text-[#334155]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#64748B]">
                    Loading telemetry history buffer…
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#64748B]">
                    No hardware samples recorded in queue yet. Connect the Arduino Nano to begin capturing telemetry.
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const currentLabel = r.classification?.label ?? "Normal";
                  const currentSeverity = r.classification?.severity ?? "low";

                  return (
                    <tr key={r._id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3.5 px-5 font-mono text-[#64748B] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{new Date(r.deviceTime).toLocaleTimeString()}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-[#0F172A]">
                        {r.raw} <span className="text-[10px] text-[#94A3B8] font-normal">/ 1023</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-[#0369A1]">
                        {r.temperature}°C
                      </td>

                      <td className="py-3.5 px-5 font-mono text-[#1D4ED8]">
                        {r.humidity}%
                      </td>

                      {/* Interactive Label Selector */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <select
                            value={currentLabel}
                            onChange={(e) =>
                              handleLabelChange(r._id!, e.target.value as ClassificationLabel)
                            }
                            className="bg-[#FFFFFF] border border-[#CBD5E1] text-[#1E293B] text-xs rounded-full px-3 py-1 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3E7D8]"
                          >
                            <option value="Normal">Normal Air</option>
                            <option value="Background Interference">Background Interference</option>
                            <option value="Genuine Leak">Genuine Leak</option>
                          </select>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${labelColors[currentLabel]}`}>
                            {currentLabel}
                          </span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${severityColors[currentSeverity]}`}>
                          {currentSeverity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
