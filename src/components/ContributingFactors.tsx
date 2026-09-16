// src/components/ContributingFactors.tsx
// Explains classification decisions with feature attribution (Product UI Styleguide)

import type { Alert } from "../types";
import { 
  X, 
  Flame, 
  CloudFog, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Thermometer, 
  Droplets, 
  Activity,
  CheckCircle
} from "lucide-react";

interface Props {
  alert: Alert;
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
  readOnly?: boolean;
}

export default function ContributingFactors({ alert, onClose, onAcknowledge, readOnly = false }: Props) {
  const { classification, readingSnapshot, createdAt, status, _id } = alert;

  const isLeak = classification.label === "Genuine Leak";
  const isInterference = classification.label === "Background Interference";
  const isLowConfidence = classification.confidence < 0.75;
  const confPct = Math.round(classification.confidence * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Side Drawer */}
      <div className="relative w-full max-w-md h-full bg-[#FFFFFF] shadow-2xl border-l border-[#E2E8F0] flex flex-col z-10 overflow-y-auto">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#F1F3F6] flex items-center justify-between sticky top-0 bg-[#FFFFFF]/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#0E7054]">AUDIT TRAIL</span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="font-mono text-xs text-[#64748B]">{_id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A] mt-0.5">Contributing Factors</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#0F172A] rounded-full hover:bg-[#F1F5F9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Classification Banner */}
          <div className={`p-5 rounded-3xl ${
            isLeak 
              ? "alert-pill-danger"
              : isInterference
              ? "alert-pill-warning"
              : "alert-pill-success"
          }`}>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-bold uppercase tracking-wider">Classification</span>
              <span className="font-mono">{new Date(createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              {isLeak ? (
                <Flame className="w-6 h-6 text-[#B91C1C]" />
              ) : isInterference ? (
                <CloudFog className="w-6 h-6 text-[#B45309]" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-[#0E7054]" />
              )}
              <div>
                <div className="text-base font-extrabold text-[#0F172A]">{classification.label}</div>
                <div className="text-xs font-semibold capitalize opacity-80">{classification.severity} Severity</div>
              </div>
            </div>
          </div>

          {/* Low Confidence Notice */}
          {isLowConfidence && (
            <div className="p-4 alert-pill-danger rounded-2xl text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-[#B91C1C] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Caution Policy Enforced (Rules §1.2)</p>
                <p className="mt-0.5 opacity-90">
                  Confidence score ({confPct}%) fell below safety floor (75%). Defaulted to Genuine Leak.
                </p>
              </div>
            </div>
          )}

          {/* Confidence Meter */}
          <div className="recessed-inset rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B] font-semibold flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-[#0E7054]" />
                Classifier Confidence
              </span>
              <span className="font-mono font-bold text-[#0F172A]">{confPct}%</span>
            </div>
            <div className="h-2.5 w-full bg-[#CBD5E1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full"
                style={{ width: `${confPct}%` }}
              />
            </div>
          </div>

          {/* Telemetry Snapshot at Alert Moment */}
          {readingSnapshot && (
            <div>
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Telemetry Snapshot at Trigger
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="recessed-inset p-3 rounded-2xl text-center">
                  <Activity className="w-4 h-4 text-[#EF4444] mx-auto mb-1" />
                  <div className="text-lg font-mono font-bold text-[#0F172A]">{readingSnapshot.raw}</div>
                  <div className="text-[10px] text-[#64748B] font-semibold">MQ2 (ADC)</div>
                </div>
                <div className="recessed-inset p-3 rounded-2xl text-center">
                  <Thermometer className="w-4 h-4 text-[#0369A1] mx-auto mb-1" />
                  <div className="text-lg font-mono font-bold text-[#0F172A]">{readingSnapshot.temperature}°</div>
                  <div className="text-[10px] text-[#64748B] font-semibold">Temp (°C)</div>
                </div>
                <div className="recessed-inset p-3 rounded-2xl text-center">
                  <Droplets className="w-4 h-4 text-[#1D4ED8] mx-auto mb-1" />
                  <div className="text-lg font-mono font-bold text-[#0F172A]">{readingSnapshot.humidity}%</div>
                  <div className="text-[10px] text-[#64748B] font-semibold">Humidity</div>
                </div>
              </div>
            </div>
          )}

          {/* List of Explanatory Factors */}
          <div>
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
              Decision Factors &amp; Feature Vector (REQ-ML-4)
            </h3>
            <div className="space-y-2">
              {classification.factors.map((factor, index) => (
                <div 
                  key={index}
                  className="recessed-inset rounded-2xl p-3.5 text-xs text-[#334155] flex items-start space-x-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Safety Actions if Genuine Leak */}
          {isLeak && (
            <div className="p-4 rounded-2xl alert-pill-danger text-xs space-y-2">
              <h4 className="font-bold text-[#991B1B] flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
                <span>Recommended Protocol</span>
              </h4>
              <ul className="space-y-1 text-[#7F1D1D] list-disc list-inside">
                <li>Isolate the gas cylinder shutoff valve immediately.</li>
                <li>Open windows for natural cross-ventilation.</li>
                <li>Do NOT operate light switches or spark sources.</li>
              </ul>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-[#F1F3F6] bg-[#FFFFFF] flex items-center space-x-3">
          {status === "active" && !readOnly && onAcknowledge ? (
            <button
              onClick={() => {
                onAcknowledge(_id);
                onClose();
              }}
              className="btn-primary-mint flex-1 py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Acknowledge Alert (REQ-ALT-4)</span>
            </button>
          ) : (
            <div className="flex-1 text-center text-xs text-[#64748B] font-mono py-1">
              {readOnly ? "Caregiver Read-Only Mode" : `Status: ${status.toUpperCase()}`}
            </div>
          )}

          <button
            onClick={onClose}
            className="btn-secondary-clay py-2.5 px-5 rounded-full text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
