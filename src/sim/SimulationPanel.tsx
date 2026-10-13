import { useState } from "react";
import { useSimulation, type HistoryPoint } from "./useSimulation";
import { SCENARIO_INFO, type Scenario } from "./simulator";
import { CFG, type Cls, type Level } from "./pipeline";

const CLS_STYLE: Record<Cls, { text: string; cls: string }> = {
  CALIBRATING: { text: "Calibrating baseline…", cls: "bg-slate-600 text-white" },
  SAFE: { text: "SAFE", cls: "bg-emerald-600 text-white" },
  BENIGN_STEAM: { text: "Steam / cooking: alarm suppressed", cls: "bg-sky-600 text-white" },
  LEAK_SUSPECTED: { text: "Possible leak: rising", cls: "bg-amber-500 text-black" },
  GAS_LEAK: { text: "GAS LEAK DETECTED", cls: "bg-red-600 text-white" },
  SENSOR_FAULT: { text: "Sensor fault / degraded", cls: "bg-purple-600 text-white" },
};

const LEVEL_STYLE: Record<Level, string> = {
  NORMAL: "bg-emerald-900/40 border-emerald-600",
  WARNING: "bg-amber-900/40 border-amber-500",
  ALARM: "bg-red-900/50 border-red-500 animate-pulse",
  ESCALATED: "bg-red-900/70 border-red-400 animate-pulse",
  EMERGENCY: "bg-red-800 border-white animate-pulse",
  ACKNOWLEDGED: "bg-slate-800 border-slate-500",
};

const LEVEL_STEPS: Level[] = ["NORMAL", "WARNING", "ALARM", "ESCALATED", "EMERGENCY"];

function Chart({ history }: { history: HistoryPoint[] }) {
  const W = 600, H = 160, N = 90;
  const pts = (f: (p: HistoryPoint) => number) =>
    history
      .map((p, i) => `${(i / (N - 1)) * W},${H - (Math.min(1023, Math.max(0, f(p))) / 1023) * H}`)
      .join(" ");
  const yThr = H - (CFG.NAIVE_THRESHOLD / 1023) * H;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 bg-slate-900 rounded">
        <line x1={0} x2={W} y1={yThr} y2={yThr} stroke="#f59e0b" strokeDasharray="4 4" />
        <polyline points={pts((p) => p.raw)} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points={pts((p) => p.comp)} fill="none" stroke="#38bdf8" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-xs text-slate-300 mt-1">
        <span><span className="text-slate-400">━</span> raw MQ-2</span>
        <span><span className="text-sky-400">━</span> humidity-compensated</span>
        <span><span className="text-amber-500">┅</span> plain threshold ({CFG.NAIVE_THRESHOLD})</span>
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-800 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function SimulationPanel() {
  const [guideOpen, setGuideOpen] = useState(true);
  const s = useSimulation();
  const { latest: r, analysis: a } = s;
  const lossPct =
    s.stats.received + s.stats.dropped > 0
      ? (s.stats.dropped / (s.stats.received + s.stats.dropped)) * 100
      : 0;

  return (
    <div className="p-4 space-y-4 bg-slate-950 text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">SENTINEL Simulation Console</h2>
        <span className="px-2 py-1 rounded bg-amber-500 text-black text-xs font-bold">
          SIMULATION MODE: synthetic data, no hardware connected
        </span>
        <div className="ml-auto flex gap-2">
          {!s.running ? (
            <button onClick={s.start} className="px-4 py-2 rounded bg-emerald-600 font-semibold">
              ▶ Start Simulation
            </button>
          ) : (
            <button onClick={s.stop} className="px-4 py-2 rounded bg-slate-600 font-semibold">
              ⏸ Pause
            </button>
          )}
          <button onClick={s.reset} className="px-4 py-2 rounded bg-slate-800">Reset</button>
        </div>
      </div>

      {/* Demo Guide Collapsible Section */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between p-3 text-left font-semibold hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">Demo guide</span>
            <span className="text-xs text-slate-400 font-normal">
              — 8-step interactive walkthrough
            </span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {guideOpen ? "Hide ▲" : "Show ▼"}
          </span>
        </button>

        {guideOpen && (
          <div className="p-3 pt-0 border-t border-slate-800/80">
            <ol className="grid gap-2 sm:grid-cols-2 mt-2 text-xs text-slate-300">
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">1)</span>
                <span><strong>Start Simulation</strong> and wait 10 seconds for calibration</span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">2)</span>
                <span><strong>Inject Kitchen steam</strong> and watch the plain-threshold line vs the compensated line</span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">3)</span>
                <span><strong>Inject Gas leak</strong> and let the alarm escalate</span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">4)</span>
                <span><strong>Acknowledge the alarm</strong></span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">5)</span>
                <span><strong>Inject Sensor overflow</strong></span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">6)</span>
                <span><strong>Inject Sensor fault</strong></span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">7)</span>
                <span><strong>Raise the packet loss slider</strong></span>
              </li>
              <li className="flex gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="font-bold text-sky-400 shrink-0">8)</span>
                <span><strong>Open the detector comparison table</strong></span>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Scenario injection */}
      <div>
        <div className="text-sm text-slate-400 mb-1">Inject scenario (changes the simulated sensor in real time)</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(Object.keys(SCENARIO_INFO) as Scenario[]).map((k) => (
            <button
              key={k}
              onClick={() => s.pickScenario(k)}
              className={`text-left rounded p-2 border ${
                s.scenario === k ? "border-sky-400 bg-slate-800" : "border-slate-700 bg-slate-900"
              }`}
            >
              <div className="font-semibold">{SCENARIO_INFO[k].label}</div>
              <div className="text-xs text-slate-400">{SCENARIO_INFO[k].desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Classification */}
      {a && (
        <div className={`rounded-lg p-3 text-lg font-bold ${CLS_STYLE[a.cls].cls}`}>
          {CLS_STYLE[a.cls].text}
          {a.calibrating && (
            <span className="ml-2 text-sm font-normal">
              ({Math.round(a.calibProgress * 100)}%)
            </span>
          )}
        </div>
      )}

      {/* Readouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card label="Raw gas (ADC)" value={r ? String(r.gas) : "-"} sub={a?.saturated ? "OVERFLOW: clipped at 1023" : "0-1023"} />
        <Card label="Temperature" value={r && r.temp >= 0 ? `${r.temp.toFixed(1)}°C` : "-"} />
        <Card label="Humidity" value={r && r.rh >= 0 ? `${r.rh.toFixed(1)}%` : r ? "FAIL" : "-"} />
        <Card
          label="Compensated residual"
          value={a && !a.calibrating ? a.residual.toFixed(0) : "-"}
          sub="gas minus steam effect, minus baseline"
        />
        <Card
          label="Est. time to danger"
          value={a?.timeToDanger == null ? "-" : a.timeToDanger === 0 ? "NOW" : `${a.timeToDanger.toFixed(0)} s`}
          sub={a && !a.calibrating ? `slope ${a.slope.toFixed(1)} /s` : undefined}
        />
        <Card label="Firmware safety floor" value={r?.alarm ? "TRIGGERED" : "idle"} sub="independent of software" />
        <Card label="Packets received" value={String(s.stats.received)} sub={`${s.stats.dropped} lost, ${s.stats.corrupt} corrupt`} />
        <Card label="Link loss" value={`${lossPct.toFixed(1)}%`} sub="from sequence-number gaps" />
      </div>

      {/* Chart */}
      <Chart history={s.history} />

      {/* Escalation */}
      {a && (
        <div className={`rounded-lg border p-3 ${LEVEL_STYLE[a.level]}`}>
          <div className="flex flex-wrap items-center gap-2">
            {LEVEL_STEPS.map((l) => (
              <span
                key={l}
                className={`px-2 py-1 rounded text-xs ${
                  a.level === l ? "bg-white text-black font-bold" : "bg-slate-800 text-slate-400"
                }`}
              >
                {l}
              </span>
            ))}
            {a.level === "ACKNOWLEDGED" && (
              <span className="px-2 py-1 rounded text-xs bg-white text-black font-bold">ACKNOWLEDGED</span>
            )}
            {a.smartAlarm && a.level !== "ACKNOWLEDGED" && (
              <button onClick={s.ack} className="ml-auto px-3 py-1 rounded bg-white text-black font-semibold">
                Acknowledge alarm
              </button>
            )}
          </div>
          {a.smartAlarm && (
            <div className="text-xs mt-2 text-slate-300">
              Alarm active for {a.alarmTicks}s. Unacknowledged for {CFG.ESCALATE_AFTER}s notifies the caregiver, and for {CFG.EMERGENCY_AFTER}s shows the 112 prompt.
            </div>
          )}
        </div>
      )}

      {/* Comparison */}
      <div className="rounded-lg bg-slate-800 p-3">
        <div className="font-semibold mb-1">Detector comparison (this session, simulated data)</div>
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr><th className="text-left">Detector</th><th>False alarms</th><th>Correct alarms</th></tr>
          </thead>
          <tbody className="text-center">
            <tr><td className="text-left">Plain threshold (&gt;{CFG.NAIVE_THRESHOLD})</td><td className="text-amber-400">{s.counters.naiveFalse}</td><td>{s.counters.naiveTrue}</td></tr>
            <tr><td className="text-left">SENTINEL pipeline</td><td className="text-emerald-400">{s.counters.smartFalse}</td><td>{s.counters.smartTrue}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Link stress */}
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-sm">
          Packet loss: {(s.lossRate * 100).toFixed(0)}%
          <input type="range" min={0} max={0.6} step={0.05} value={s.lossRate}
            onChange={(e) => s.setLossRate(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm">
          Bit-error rate: {(s.corruptRate * 100).toFixed(0)}%
          <input type="range" min={0} max={0.5} step={0.05} value={s.corruptRate}
            onChange={(e) => s.setCorruptRate(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm">
          Speed: {s.speed}x
          <input type="range" min={1} max={4} step={1} value={s.speed}
            onChange={(e) => s.setSpeed(Number(e.target.value))} className="w-full" />
        </label>
      </div>

      {/* Event log */}
      <div className="rounded-lg bg-slate-900 p-3 max-h-56 overflow-y-auto text-sm font-mono">
        <div className="text-slate-400 mb-1">Event log</div>
        {s.log.length === 0 && <div className="text-slate-500">Press Start Simulation…</div>}
        {s.log.map((e, i) => (
          <div key={i}>
            <span className="text-slate-500">{new Date(e.t).toLocaleTimeString()} </span>
            {e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
