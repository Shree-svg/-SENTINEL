/**
 * SENTINEL - sensor simulator (DEMO MODE).
 * Generates synthetic MQ-2 / DHT11 readings and encodes them in the SAME packet
 * format the real firmware sends, so the real parser + analysis pipeline are used.
 */

export type Scenario =
  | "normal"
  | "steam"
  | "cooking"
  | "gas_leak"
  | "adc_saturation"
  | "sensor_fault";

export const SCENARIO_INFO: Record<Scenario, { label: string; benign: boolean; desc: string }> = {
  normal: { label: "Normal air", benign: true, desc: "Clean room air, small sensor noise" },
  steam: {
    label: "Kitchen steam",
    benign: true,
    desc: "Humidity jumps; MQ-2 reading rises falsely (cross-sensitivity)",
  },
  cooking: { label: "Cooking", benign: true, desc: "Mild humidity + temperature + organic vapours" },
  gas_leak: {
    label: "Gas leak",
    benign: false,
    desc: "Gas concentration ramps up while humidity stays flat",
  },
  adc_saturation: {
    label: "Sensor overflow",
    benign: false,
    desc: "Very high concentration: ADC clips at 1023",
  },
  sensor_fault: {
    label: "Sensor fault",
    benign: true,
    desc: "DHT11 read failure and frozen gas reading",
  },
};

// Ground-truth model of the (simulated) sensor
export const SIM = { BASE_GAS: 180, BASE_TEMP: 27, BASE_RH: 55, K_RH: 5.5, K_T: 1.5 };
const FW_ON = 600; // simulated hardcoded firmware safety floor (on)
const FW_OFF = 550; // (off, hysteresis)

type Env = { gasConc: number; temp: number; rh: number };

export type SimState = {
  env: Env;
  t: number;
  seq: number;
  scenario: Scenario;
  frozenGas: number | null;
  fwAlarm: boolean;
};

export function newSimState(): SimState {
  return {
    env: { gasConc: 0, temp: SIM.BASE_TEMP, rh: SIM.BASE_RH },
    t: 0,
    seq: 0,
    scenario: "normal",
    frozenGas: null,
    fwAlarm: false,
  };
}

export function changeScenario(st: SimState, s: Scenario) {
  st.scenario = s;
  st.t = 0;
  st.frozenGas = null;
}

function noise(sd: number): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sd;
}

function targets(s: Scenario, t: number): Env {
  const ramp = (sec: number) => Math.min(t / sec, 1);
  switch (s) {
    case "steam":
      return { gasConc: 0, temp: SIM.BASE_TEMP + 4 * ramp(15), rh: SIM.BASE_RH + 30 * ramp(15) };
    case "cooking":
      return { gasConc: 30 * ramp(20), temp: SIM.BASE_TEMP + 6 * ramp(20), rh: SIM.BASE_RH + 12 * ramp(20) };
    case "gas_leak":
      return { gasConc: Math.min(900, 15 * t), temp: SIM.BASE_TEMP, rh: SIM.BASE_RH };
    case "adc_saturation":
      return { gasConc: 2000 * ramp(4), temp: SIM.BASE_TEMP, rh: SIM.BASE_RH };
    default:
      return { gasConc: 0, temp: SIM.BASE_TEMP, rh: SIM.BASE_RH };
  }
}

/** Advance the simulation by one 1-second sample. */
export function stepSim(st: SimState) {
  st.t += 1;
  const tg = targets(st.scenario, st.t);
  const a = 0.25; // first-order lag so values change smoothly
  st.env.gasConc += (tg.gasConc - st.env.gasConc) * a;
  st.env.temp += (tg.temp - st.env.temp) * a;
  st.env.rh += (tg.rh - st.env.rh) * a;

  let rh = st.env.rh + noise(0.4);
  let temp = st.env.temp + noise(0.15);
  let gas =
    SIM.BASE_GAS +
    st.env.gasConc +
    SIM.K_RH * (st.env.rh - SIM.BASE_RH) +
    SIM.K_T * (st.env.temp - SIM.BASE_TEMP) +
    noise(4);

  if (st.scenario === "sensor_fault") {
    if (st.frozenGas === null) st.frozenGas = gas;
    gas = st.frozenGas; // stuck reading
    rh = -1; // DHT11 failure code
    temp = -1;
  }

  const gasInt = Math.round(Math.max(0, Math.min(1023, gas))); // 10-bit ADC clip = "overflow"
  if (gasInt >= FW_ON) st.fwAlarm = true;
  else if (gasInt < FW_OFF) st.fwAlarm = false;

  const seq = st.seq;
  st.seq = (st.seq + 1) & 0xffff;
  return { seq, gas: gasInt, temp, rh, alarm: st.fwAlarm };
}

/** Same framing as the firmware: $S,seq,gas,temp*10,rh*10,alarm*XORCHK */
export function encodePacket(seq: number, gas: number, temp: number, rh: number, alarm: boolean) {
  const body = `S,${seq},${gas},${Math.round(temp * 10)},${Math.round(rh * 10)},${alarm ? 1 : 0}`;
  let cs = 0;
  for (let i = 0; i < body.length; i++) cs ^= body.charCodeAt(i);
  return `$${body}*${cs.toString(16).toUpperCase().padStart(2, "0")}`;
}

/** Simulate a bit error on the wireless link. */
export function corruptPacket(pkt: string) {
  const i = 2 + Math.floor(Math.random() * Math.max(1, pkt.length - 5));
  return pkt.slice(0, i) + "X" + pkt.slice(i + 1);
}
