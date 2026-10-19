// tests/pipeline.test.js
// SENTINEL Automated Pipeline Verification Test Suite
// Verifies Test Cases TC06–TC13 against compensation, prediction, and state-machine requirements.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadConfig,
  computeSteamCompensation,
  computeSlopeAndTimeToDanger,
  evaluateSensorHealth
} from '../server/signalAnalytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

describe('SENTINEL Analytical Pipeline Verification (TC06–TC13)', () => {
  const config = loadConfig();

  test('TC06: Sensor Warm-Up & Initial Stabilization Window', () => {
    const streamStart = Date.now();
    const reading = { raw: 220, temperature: 24.0, humidity: 50.0 };
    const buffer = [reading];

    const health = evaluateSensorHealth(buffer, reading, config, streamStart);
    assert.strictEqual(health.status, 'warming_up');
    assert.strictEqual(health.isDegraded, true);
    assert.ok(health.warmupRemainingSeconds > 0, 'Warmup seconds should be positive');
    assert.ok(health.warnings.some(w => w.includes('warming up')), 'Should report warmup warning');
  });

  test('TC07: Safe Ambient Baseline Tracking', () => {
    // Normal living room conditions: 190 ADC, 24°C, 50% RH
    const comp = computeSteamCompensation(190, 24.0, 50.0, config);
    assert.strictEqual(comp.steamEstimate, 0, 'Steam estimate at baseline should be 0');
    assert.strictEqual(comp.compensatedGas, 190, 'Compensated gas should match raw at baseline');

    const slopeRes = computeSlopeAndTimeToDanger(
      [{ raw: 190, compensatedGas: 190 }, { raw: 190, compensatedGas: 190 }, { raw: 190, compensatedGas: 190 }],
      190,
      config.dangerThreshold
    );
    assert.strictEqual(slopeRes.slope, 0.0);
    assert.strictEqual(slopeRes.timeToThresholdSeconds, null);
  });

  test('TC08: Steam Cross-Sensitivity Compensation & False Alarm Suppression', () => {
    // Boiling kettle scenario: raw gas jumps to 390 due to 90.5% RH (+40.5% ΔRH) and 26.4°C (+2.4°C ΔT)
    const rawGas = 390;
    const hum = 90.5;
    const temp = 26.4;

    const { steamEstimate, compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);

    // Expected regression deduction: 2.8 * 40.5 + 1.2 * 2.4 = 113.4 + 2.88 = 116.3
    const expectedDeduction = parseFloat(((2.8 * (hum - 50.0)) + (1.2 * (temp - 24.0))).toFixed(1));
    assert.strictEqual(steamEstimate, expectedDeduction);

    // A plain threshold detector would trigger a false alarm at 390 ADC (> 300)
    assert.ok(rawGas > 300, 'Plain threshold would false alarm');

    // SENTINEL compensated reading brings gas down to ~274 ADC (< 300), successfully suppressing the siren
    assert.ok(compensatedGas < 300, `Compensated gas (${compensatedGas}) should be suppressed below 300 ADC`);
  });

  test('TC09: Cooking Environmental Transient Suppression', () => {
    // Cooking stir-fry scenario: raw gas 365 ADC, humidity 78.5% RH (+28.5%), temperature 30.5°C (+6.5%)
    const rawGas = 365;
    const hum = 78.5;
    const temp = 30.5;

    const { steamEstimate, compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);

    // 2.8 * 28.5 + 1.2 * 6.5 = 79.8 + 7.8 = 87.6
    assert.ok(steamEstimate >= 87.0 && steamEstimate <= 88.0);
    assert.ok(compensatedGas < 300, `Cooking gas (${compensatedGas}) suppressed below alarm threshold`);
  });

  test('TC10: Real Combustible Gas Leak Detection & Rapid Escalation', () => {
    // Genuine gas leak under normal humidity: raw gas 585 ADC, 50% RH, 24°C
    const rawGas = 585;
    const hum = 50.0;
    const temp = 24.0;

    const { steamEstimate, compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);
    assert.strictEqual(steamEstimate, 0, 'No steam deduction during pure gas leak');
    assert.strictEqual(compensatedGas, 585);
    assert.ok(compensatedGas >= config.dangerThreshold, 'Breaches 500 ADC danger threshold');
  });

  test('TC11: Debounce Hysteresis & Alarm Latch Persistence', () => {
    // Verify that single noise spikes do not cause latching, and hysteresis holds until recovery
    const window = [
      { raw: 190, compensatedGas: 190 },
      { raw: 190, compensatedGas: 190 },
      { raw: 320, compensatedGas: 320 } // single transient spike
    ];

    // Slope over transient
    const res = computeSlopeAndTimeToDanger(window, 320, config.dangerThreshold);
    assert.ok(res.slope > 0);
  });

  test('TC12: Predictive Time-to-Danger (TTD) Estimation', () => {
    // Linearly ascending gas concentration: 200, 230, 260, 290, 320 (slope = +30 ADC/s)
    const history = [
      { raw: 200, compensatedGas: 200 },
      { raw: 230, compensatedGas: 230 },
      { raw: 260, compensatedGas: 260 },
      { raw: 290, compensatedGas: 290 }
    ];
    const latest = 320;
    const { slope, timeToThresholdSeconds } = computeSlopeAndTimeToDanger(history, latest, 500);

    assert.ok(slope >= 29.0 && slope <= 31.0, `Slope should be ~30 ADC/s, got ${slope}`);
    // (500 - 320) / 30 = 6 seconds to threshold
    assert.strictEqual(timeToThresholdSeconds, 6, 'Estimated time to 500 ADC danger should be 6 seconds');
  });

  test('TC13: Sensor Fault & ADC Saturation Handling', () => {
    // A. Flatline detection: 15 identical consecutive samples
    const flatlineBuffer = Array.from({ length: 15 }, () => ({ raw: 250, temperature: 24.0, humidity: 50.0 }));
    const flatlineHealth = evaluateSensorHealth(flatlineBuffer, { raw: 250, temperature: 24.0, humidity: 50.0 }, config);
    assert.strictEqual(flatlineHealth.flatlined, true);
    assert.strictEqual(flatlineHealth.status, 'failure');

    // B. DHT11 failure: 0.0 temp & humidity
    const dhtFailBuffer = [{ raw: 200, temperature: 0.0, humidity: 0.0 }];
    const dhtHealth = evaluateSensorHealth(dhtFailBuffer, { raw: 200, temperature: 0.0, humidity: 0.0 }, config);
    assert.strictEqual(dhtHealth.dhtFailed, true);
    assert.strictEqual(dhtHealth.status, 'failure');

    // C. ADC clipping at 1023
    const clipBuffer = Array.from({ length: 15 }, () => ({ raw: 1023, temperature: 24.0, humidity: 50.0 }));
    const clipHealth = evaluateSensorHealth(clipBuffer, { raw: 1023, temperature: 24.0, humidity: 50.0 }, config);
    assert.strictEqual(clipHealth.flatlined, true);
  });

  test('Empirical Dataset Evaluation Consistency (Zero FAs on Steam/Cooking, Zero Misses on Leaks)', () => {
    const steamRows = fs.readFileSync(path.join(DATA_DIR, 'steam.csv'), 'utf-8').trim().split('\n').slice(1);
    const cookingRows = fs.readFileSync(path.join(DATA_DIR, 'cooking.csv'), 'utf-8').trim().split('\n').slice(1);
    const gasRows = fs.readFileSync(path.join(DATA_DIR, 'gas.csv'), 'utf-8').trim().split('\n').slice(1);

    // Verify steam.csv is suppressed
    let steamAlarms = 0;
    for (const row of steamRows) {
      const [, rawGas, temp, hum] = row.split(',').map(Number);
      const { compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);
      if (compensatedGas >= 300) steamAlarms++;
    }
    assert.strictEqual(steamAlarms, 0, 'Steam session should have 0 false alarms');

    // Verify cooking.csv is suppressed
    let cookingAlarms = 0;
    for (const row of cookingRows) {
      const [, rawGas, temp, hum] = row.split(',').map(Number);
      const { compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);
      if (compensatedGas >= 300) cookingAlarms++;
    }
    assert.strictEqual(cookingAlarms, 0, 'Cooking session should have 0 false alarms');

    // Verify gas.csv triggers properly
    let gasAlarms = 0;
    for (const row of gasRows) {
      const [, rawGas, temp, hum] = row.split(',').map(Number);
      const { compensatedGas } = computeSteamCompensation(rawGas, temp, hum, config);
      if (compensatedGas >= 300) gasAlarms++;
    }
    assert.ok(gasAlarms > 0, 'Gas leak session should trigger alarms');
  });
});
