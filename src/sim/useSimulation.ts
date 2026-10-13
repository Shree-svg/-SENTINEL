import { useCallback, useEffect, useRef, useState } from "react";
import { parsePacket, type Reading } from "../hooks/useDeviceConnection";
import {
  SCENARIO_INFO,
  changeScenario,
  corruptPacket,
  encodePacket,
  newSimState,
  stepSim,
  type Scenario,
} from "./simulator";
import { createPipeline, type Analysis, type Counters } from "./pipeline";

export type HistoryPoint = { raw: number; comp: number; rh: number };
export type LogEntry = { t: number; msg: string };

const HISTORY_LEN = 90;

export function useSimulation() {
  const [running, setRunning] = useState(false);
  const [scenario, setScenarioState] = useState<Scenario>("normal");
  const [latest, setLatest] = useState<Reading | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ received: 0, dropped: 0, corrupt: 0 });
  const [counters, setCounters] = useState<Counters>({
    naiveFalse: 0,
    naiveTrue: 0,
    smartFalse: 0,
    smartTrue: 0,
  });
  const [lossRate, setLossRate] = useState(0);
  const [corruptRate, setCorruptRate] = useState(0);
  const [speed, setSpeed] = useState(1);

  const sim = useRef(newSimState());
  const pipe = useRef(createPipeline());
  const lastSeq = useRef<number | null>(null);
  const lossRef = useRef(0);
  const corruptRef = useRef(0);
  const scenarioRef = useRef<Scenario>("normal");
  lossRef.current = lossRate;
  corruptRef.current = corruptRate;

  const addLog = useCallback((msgs: string[]) => {
    if (!msgs.length) return;
    const now = Date.now();
    setLog((l) => [...msgs.map((msg) => ({ t: now, msg })), ...l].slice(0, 60));
  }, []);

  const tick = useCallback(() => {
    const s = stepSim(sim.current);
    if (Math.random() < lossRef.current) return; // packet lost in the air

    let pkt = encodePacket(s.seq, s.gas, s.temp, s.rh, s.alarm);
    if (Math.random() < corruptRef.current) pkt = corruptPacket(pkt);

    const r = parsePacket(pkt); // the REAL parser, with checksum validation
    if (!r) {
      setStats((c) => ({ ...c, corrupt: c.corrupt + 1 }));
      addLog(["Checksum mismatch: corrupted packet discarded"]);
      return;
    }

    let gap = 0;
    if (lastSeq.current !== null) {
      gap = (r.seq - lastSeq.current - 1 + 65536) % 65536;
      if (gap > 1000) gap = 0;
    }
    lastSeq.current = r.seq;
    if (gap > 0) addLog([`Sequence gap: ${gap} packet(s) lost, link quality degraded`]);
    setStats((c) => ({ ...c, received: c.received + 1, dropped: c.dropped + gap }));

    const truth = SCENARIO_INFO[scenarioRef.current].benign ? "benign" : "hazard";
    const a = pipe.current.process(r, truth);
    setLatest(r);
    setAnalysis(a);
    setCounters({ ...pipe.current.counters });
    setHistory((h) => [...h, { raw: r.gas, comp: a.compensated, rh: r.rh }].slice(-HISTORY_LEN));
    addLog(a.events);
  }, [addLog]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000 / speed);
    return () => clearInterval(id);
  }, [running, speed, tick]);

  const start = useCallback(() => {
    setRunning(true);
    addLog(["Simulation started (synthetic data, no hardware connected)"]);
  }, [addLog]);

  const stop = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    sim.current = newSimState();
    pipe.current = createPipeline();
    lastSeq.current = null;
    scenarioRef.current = "normal";
    setScenarioState("normal");
    setLatest(null);
    setAnalysis(null);
    setHistory([]);
    setLog([]);
    setStats({ received: 0, dropped: 0, corrupt: 0 });
    setCounters({ naiveFalse: 0, naiveTrue: 0, smartFalse: 0, smartTrue: 0 });
  }, []);

  const pickScenario = useCallback(
    (s: Scenario) => {
      changeScenario(sim.current, s);
      scenarioRef.current = s;
      setScenarioState(s);
      addLog([`Scenario injected: ${SCENARIO_INFO[s].label}`]);
    },
    [addLog]
  );

  const ack = useCallback(() => pipe.current.ack(), []);

  return {
    running, scenario, latest, analysis, history, log, stats, counters,
    lossRate, corruptRate, speed,
    setLossRate, setCorruptRate, setSpeed,
    start, stop, reset, pickScenario, ack,
  };
}
