// server/signalAnalytics.js
// SENTINEL Steam Compensation, Time-to-Threshold (TTT) Estimation, & Sensor Health Diagnostics

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'compensationConfig.json');

// Default fallback configuration
const DEFAULT_CONFIG = {
  enabled: true,
  dangerThreshold: 500,
  baselineHumidity: 50.0,
  baselineTemperature: 24.0,
  humidityCoefficient: 2.8,
  temperatureCoefficient: 1.2,
  intercept: 0.0,
  maxSteamDeduction: 250,
  warmupDurationSeconds: 30,
  flatlineSampleCount: 15
};

let cachedConfig = null;
let lastConfigMtime = 0;

/**
 * Loads or hot-reloads configuration from compensationConfig.json
 */
export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const stats = fs.statSync(CONFIG_PATH);
      if (!cachedConfig || stats.mtimeMs > lastConfigMtime) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        lastConfigMtime = stats.mtimeMs;
      }
      return cachedConfig;
    }
  } catch (err) {
    console.warn('[SENTINEL Analytics] Error reading config file, using defaults:', err.message);
  }
  return DEFAULT_CONFIG;
}

/**
 * (1) Computes steam-response estimate via regression on humidity & temp,
 * and subtracts it from rawGas to yield compensatedGas.
 */
export function computeSteamCompensation(rawGas, temp, hum, config = loadConfig()) {
  if (!config.enabled) {
    return {
      steamEstimate: 0,
      compensatedGas: rawGas
    };
  }

  const deltaHum = Math.max(0, hum - config.baselineHumidity);
  const deltaTemp = Math.max(0, temp - config.baselineTemperature);

  // Linear regression model: steamEstimate = (beta_hum * deltaHum) + (beta_temp * deltaTemp) + intercept
  let steamEstimate = (config.humidityCoefficient * deltaHum) + (config.temperatureCoefficient * deltaTemp) + config.intercept;
  steamEstimate = Math.min(config.maxSteamDeduction, Math.max(0, steamEstimate));

  const compensatedGas = Math.max(0, Math.round(rawGas - steamEstimate));

  return {
    steamEstimate: parseFloat(steamEstimate.toFixed(1)),
    compensatedGas
  };
}

/**
 * (2) Computes OLS slope of compensated gas over a 10-sample sliding window
 * and projects estimated time-to-threshold (in seconds).
 */
export function computeSlopeAndTimeToDanger(buffer, latestCompensated, dangerThreshold = 500) {
  // Extract last up to 10 compensated values
  const windowSlice = buffer.slice(-9);
  const points = [...windowSlice.map(r => r.compensatedGas ?? r.raw), latestCompensated];

  const n = points.length;
  if (n < 3) {
    return {
      slope: 0.0,
      timeToThresholdSeconds: latestCompensated >= dangerThreshold ? 0 : null
    };
  }

  // Ordinary Least Squares regression: y = m*x + b where x = [0, 1, ..., n-1]
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = points[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = (n * sumXX) - (sumX * sumX);
  const slope = denominator !== 0 ? parseFloat((((n * sumXY) - (sumX * sumY)) / denominator).toFixed(2)) : 0.0;

  let timeToThresholdSeconds = null;

  if (latestCompensated >= dangerThreshold) {
    timeToThresholdSeconds = 0;
  } else if (slope > 0.4) {
    const deltaToThreshold = dangerThreshold - latestCompensated;
    timeToThresholdSeconds = Math.max(1, Math.round(deltaToThreshold / slope));
  }

  return {
    slope,
    timeToThresholdSeconds
  };
}

/**
 * (3) Sensor-health diagnostics: warm-up, flat-lined readings, and DHT11 failures.
 */
export function evaluateSensorHealth(buffer, latestReading, config = loadConfig(), streamStartTime = null) {
  const warnings = [];
  let isDegraded = false;
  let flatlined = false;
  let dhtFailed = false;
  let warmupRemainingSeconds = 0;

  const now = Date.now();

  // A. Warm-up check
  if (streamStartTime) {
    const elapsedSeconds = (now - streamStartTime) / 1000;
    if (elapsedSeconds < config.warmupDurationSeconds) {
      warmupRemainingSeconds = Math.ceil(config.warmupDurationSeconds - elapsedSeconds);
      warnings.push(`MQ-2 sensor warming up (~${warmupRemainingSeconds}s remaining)`);
      isDegraded = true;
    }
  }

  // B. Flat-line check (checks if raw gas signal is frozen/stuck)
  const flatlineLimit = config.flatlineSampleCount || 15;
  if (buffer.length >= flatlineLimit) {
    const recentSlice = buffer.slice(-flatlineLimit);
    const firstVal = recentSlice[0].raw;
    const isIdentical = recentSlice.every(r => r.raw === firstVal);

    if (isIdentical || latestReading.raw === 0 || latestReading.raw === 1023) {
      flatlined = true;
      isDegraded = true;
      warnings.push(`MQ-2 analog signal flat-lined (stuck at ${latestReading.raw} ADC for ${flatlineLimit} samples)`);
    }
  }

  // C. DHT11 failures
  const { temperature, humidity } = latestReading;
  if ((temperature === 0.0 && humidity === 0.0) || isNaN(temperature) || isNaN(humidity)) {
    dhtFailed = true;
    isDegraded = true;
    warnings.push("DHT11 sensor failure: reading 0.0°C / 0.0% RH (check digital pin D2)");
  } else if (humidity < 5.0 || humidity > 100.0 || temperature < -10.0 || temperature > 80.0) {
    dhtFailed = true;
    isDegraded = true;
    warnings.push(`DHT11 environmental reading out of physical bounds (${temperature}°C, ${humidity}% RH)`);
  }

  let status = "healthy";
  if (dhtFailed || flatlined) {
    status = "failure";
  } else if (warmupRemainingSeconds > 0) {
    status = "warming_up";
  } else if (isDegraded) {
    status = "degraded";
  }

  return {
    isDegraded,
    status,
    warnings,
    warmupRemainingSeconds,
    flatlined,
    dhtFailed
  };
}
