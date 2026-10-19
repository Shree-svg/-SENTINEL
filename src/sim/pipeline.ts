import type { Reading } from "../hooks/useDeviceConnection";

/**
 * SENTINEL analysis pipeline.
 * 1. Auto-calibration during warm-up (baseline gas / RH / temp)
 * 2. Humidity + temperature compensation of the MQ-2 reading
 * 3. Slope estimation over a sliding window -> estimated time-to-danger
 * 4. Rule-based classification (steam vs leak vs sensor fault)
 * 5. Debounce + hysteresis, then an escalation state machine
 * Also runs a plain-threshold "naive" detector next to it for comparison.
 */

export const CFG = {
  NAIVE_THRESHOLD: 300, // plain detector: alarm if raw gas > this
  WARMUP_SAMPLES: 10, // calibration baseline window
  K_RH: 2.8, // empirical humidity cross-sensitivity gain (ADC/%RH)
  K_T: 1.2, // empirical thermal cross-sensitivity gain (ADC/°C)
  MAX_STEAM_DEDUCTION: 250, // max steam compensation deduction limit
  DANGER_THRESHOLD: 500, // critical hazard threshold (500 ADC)
  WARN_RESIDUAL: 60,
  ALARM_RESIDUAL: 150,
  DANGER_RESIDUAL: 300,
  WINDOW: 10,
  ALARM_CONFIRM: 3, // consecutive samples before alarming (debounce)
  ESCALATE_AFTER: 15, // seconds unacknowledged -> caregiver SMS
  EMERGENCY_AFTER: 30, // seconds unacknowledged -> 112 prompt
};

export type Cls =
  | "CALIBRATING"
  | "SAFE"
  | "BENIGN_STEAM"
  | "LEAK_SUSPECTED"
  | "GAS_LEAK"
  | "SENSOR_FAULT";

export type Level = "NORMAL" | "WARNING" | "ALARM" | "ESCALATED" | "EMERGENCY" | "ACKNOWLEDGED";

export type Analysis = {
  cls: Cls;
  level: Level;
  calibrating: boolean;
  calibProgress: number;
  baseline: number;
  compensated: number;
  residual: number;
  slope: number;
  rhSlope: number;
  timeToDanger: number | null;
  naiveAlarm: boolean;
  smartAlarm: boolean;
  saturated: boolean;
  alarmTicks: number;
  events: string[];
};

export type Counters = {
  naiveFalse: number;
  naiveTrue: number;
  smartFalse: number;
  smartTrue: number;
};

function slope(v: number[]): number {
  const n = v.length;
  if (n < 3) return 0;
  const mx = (n - 1) / 2;
  const my = v.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (v[i] - my);
    den += (i - mx) ** 2;
  }
  return num / den;
}

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

export function createPipeline() {
  let rawBuf: number[] = [];
  let rhBuf: number[] = [];
  let resBuf: number[] = [];
  const cal = { g: [] as number[], h: [] as number[], t: [] as number[] };
  let base: { gas: number; rh: number; temp: number } | null = null;
  let confirm = 0;
  let latched = false;
  let alarmTicks = 0;
  let acked = false;
  let level: Level = "NORMAL";
  let cls: Cls = "CALIBRATING";
  let prevNaive = false;
  let prevSmart = false;
  const counters: Counters = { naiveFalse: 0, naiveTrue: 0, smartFalse: 0, smartTrue: 0 };

  function process(r: Reading, truth: "benign" | "hazard" = "benign"): Analysis {
    const events: string[] = [];
    const fault = r.rh < 0 || r.temp < -40; // DHT11 failure codes
    const saturated = r.gas >= 1023; // ADC overflow / clipping
    const naiveAlarm = r.gas > CFG.NAIVE_THRESHOLD;

    rawBuf.push(r.gas);
    if (rawBuf.length > 30) rawBuf.shift();
    if (!fault) {
      rhBuf.push(r.rh);
      if (rhBuf.length > CFG.WINDOW) rhBuf.shift();
    }
    const last = rawBuf[rawBuf.length - 1];
    const flat = !saturated && rawBuf.length >= 8 && rawBuf.slice(-8).every((v) => v === last);
    const faultAny = fault || flat;

    const blank = (over: Partial<Analysis>): Analysis => ({
      cls: "CALIBRATING",
      level: "NORMAL",
      calibrating: true,
      calibProgress: 0,
      baseline: 0,
      compensated: r.gas,
      residual: 0,
      slope: 0,
      rhSlope: 0,
      timeToDanger: null,
      naiveAlarm,
      smartAlarm: false,
      saturated,
      alarmTicks: 0,
      events,
      ...over,
    });

    // 1. Calibration
    if (!base) {
      if (!fault) {
        cal.g.push(r.gas);
        cal.h.push(r.rh);
        cal.t.push(r.temp);
      }
      if (cal.g.length >= CFG.WARMUP_SAMPLES) {
        base = { gas: mean(cal.g), rh: mean(cal.h), temp: mean(cal.t) };
        events.push(
          `Calibration complete: baseline gas ${base.gas.toFixed(0)}, RH ${base.rh.toFixed(0)}%, ${base.temp.toFixed(1)}°C`
        );
      } else {
        return blank({ calibProgress: cal.g.length / CFG.WARMUP_SAMPLES });
      }
    }
    const b = base!;

    // 2. Compensation
    const deltaHum = Math.max(0, r.rh - b.rh);
    const deltaTemp = Math.max(0, r.temp - b.temp);
    const steamDeduction = Math.min(
      CFG.MAX_STEAM_DEDUCTION,
      Math.max(0, CFG.K_RH * deltaHum + CFG.K_T * deltaTemp)
    );
    const comp = faultAny ? r.gas : Math.max(0, Math.round(r.gas - steamDeduction));
    const residual = comp - b.gas;
    if (!faultAny) {
      resBuf.push(residual);
      if (resBuf.length > CFG.WINDOW) resBuf.shift();
    }

    // 3. Prediction
    const sl = faultAny ? 0 : slope(resBuf);
    const rhSl = faultAny ? 0 : slope(rhBuf);
    let ttd: number | null = null;
    if (!faultAny) {
      if (comp >= CFG.DANGER_THRESHOLD || residual >= CFG.DANGER_RESIDUAL) ttd = 0;
      else if (sl > 0.3) ttd = Math.min(600, Math.max(0, (CFG.DANGER_THRESHOLD - comp) / sl));
    }

    // 4. Classification
    let newCls: Cls;
    if (faultAny) newCls = "SENSOR_FAULT";
    else if (saturated || comp >= CFG.DANGER_THRESHOLD || residual >= CFG.ALARM_RESIDUAL) newCls = "GAS_LEAK";
    else if (residual >= CFG.WARN_RESIDUAL) newCls = "LEAK_SUSPECTED";
    else if (naiveAlarm || deltaHum > 5) newCls = "BENIGN_STEAM";
    else newCls = "SAFE";
    if (newCls !== cls) {
      events.push(`Classification: ${cls} → ${newCls}`);
      cls = newCls;
    }
    if (saturated) events.push("ADC OVERFLOW: reading clipped at 1023, true concentration is higher");

    // 5. Debounce + hysteresis
    confirm = newCls === "GAS_LEAK" ? confirm + 1 : 0;
    if (confirm >= CFG.ALARM_CONFIRM) latched = true;
    else if (latched && residual < CFG.WARN_RESIDUAL / 2 && !saturated && !faultAny) latched = false;
    const smartAlarm = latched;

    // 6. Escalation state machine
    let newLevel: Level;
    if (smartAlarm) {
      alarmTicks++;
      if (acked) newLevel = "ACKNOWLEDGED";
      else if (alarmTicks >= CFG.EMERGENCY_AFTER) newLevel = "EMERGENCY";
      else if (alarmTicks >= CFG.ESCALATE_AFTER) newLevel = "ESCALATED";
      else newLevel = "ALARM";
    } else {
      alarmTicks = 0;
      acked = false;
      newLevel = newCls === "LEAK_SUSPECTED" || newCls === "SENSOR_FAULT" ? "WARNING" : "NORMAL";
    }
    if (newLevel !== level) {
      const msg: Record<Level, string> = {
        NORMAL: "Back to NORMAL",
        WARNING: "WARNING: possible leak or degraded sensor",
        ALARM: "ALARM raised: buzzer + dashboard alert",
        ESCALATED: "Unacknowledged: caregiver notified by SMS/email (simulated)",
        EMERGENCY: "Still unacknowledged: 112 emergency prompt shown to caregiver",
        ACKNOWLEDGED: "Alarm acknowledged locally",
      };
      events.push(msg[newLevel]);
      level = newLevel;
    }

    // 7. Naive vs SENTINEL comparison (rising edges only)
    if (naiveAlarm && !prevNaive) {
      if (truth === "benign") counters.naiveFalse++;
      else counters.naiveTrue++;
      if (truth === "benign" && !smartAlarm)
        events.push("A plain threshold detector would have FALSE-ALARMED here; SENTINEL suppressed it");
    }
    if (smartAlarm && !prevSmart) {
      if (truth === "benign") counters.smartFalse++;
      else counters.smartTrue++;
    }
    prevNaive = naiveAlarm;
    prevSmart = smartAlarm;

    return {
      cls,
      level,
      calibrating: false,
      calibProgress: 1,
      baseline: b.gas,
      compensated: comp,
      residual,
      slope: sl,
      rhSlope: rhSl,
      timeToDanger: ttd,
      naiveAlarm,
      smartAlarm,
      saturated,
      alarmTicks,
      events,
    };
  }

  return {
    process,
    counters,
    ack() {
      acked = true;
    },
  };
}

export type Pipeline = ReturnType<typeof createPipeline>;
