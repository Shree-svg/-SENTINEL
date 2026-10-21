// server/recorder.js
// SENTINEL Data Recording Mode: saves labeled telemetry sessions to CSV files in /data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const RECORDINGS_DIR = path.resolve(DATA_DIR, 'recordings');

// Ensure /data and /data/recordings directories exist
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

let activeRecording = {
  isRecording: false,
  label: 'normal', // 'normal' | 'steam' | 'cooking' | 'gas'
  filename: null,
  filePath: null,
  sampleCount: 0,
  startTime: null
};

export function startRecording(label = 'normal', filename = null) {
  const validLabels = ['normal', 'steam', 'cooking', 'gas'];
  const sanitizedLabel = validLabels.includes(label.toLowerCase()) ? label.toLowerCase() : 'normal';

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetFilename = filename || `${sanitizedLabel}_${dateStr}.csv`;
  const targetFilePath = path.join(RECORDINGS_DIR, targetFilename);

  // If new file, create and write standard CSV header
  if (!fs.existsSync(targetFilePath)) {
    fs.writeFileSync(targetFilePath, 'timestamp,rawGas,temperature,humidity,label\n', 'utf-8');
  }

  activeRecording = {
    isRecording: true,
    label: sanitizedLabel,
    filename: targetFilename,
    filePath: targetFilePath,
    sampleCount: 0,
    startTime: Date.now()
  };

  console.log(`[SENTINEL Recorder] Started recording dataset: ${targetFilename} [Label: ${sanitizedLabel}]`);
  return { success: true, ...activeRecording };
}

export function stopRecording() {
  if (!activeRecording.isRecording) {
    return { success: false, message: 'No active recording session' };
  }

  const result = {
    success: true,
    filename: activeRecording.filename,
    filePath: activeRecording.filePath,
    label: activeRecording.label,
    sampleCount: activeRecording.sampleCount,
    durationSeconds: Math.round((Date.now() - activeRecording.startTime) / 1000)
  };

  console.log(`[SENTINEL Recorder] Stopped recording: ${activeRecording.filename} (${activeRecording.sampleCount} samples saved)`);

  activeRecording = {
    isRecording: false,
    label: 'normal',
    filename: null,
    filePath: null,
    sampleCount: 0,
    startTime: null
  };

  return result;
}

export function recordReading(rawGas, temp, hum, deviceTime = Date.now()) {
  if (!activeRecording.isRecording || !activeRecording.filePath) {
    return false;
  }

  const isoTime = new Date(deviceTime).toISOString();
  const row = `${isoTime},${rawGas},${temp},${hum},${activeRecording.label}\n`;

  try {
    fs.appendFileSync(activeRecording.filePath, row, 'utf-8');
    activeRecording.sampleCount += 1;
    return true;
  } catch (err) {
    console.error('[SENTINEL Recorder] Error writing sample to CSV:', err.message);
    return false;
  }
}

export function getRecordingStatus() {
  let recordedFiles = [];
  try {
    if (fs.existsSync(RECORDINGS_DIR)) {
      recordedFiles = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.csv'));
    }
  } catch {
    // ignore
  }

  return {
    ...activeRecording,
    dataDirectory: RECORDINGS_DIR,
    recordedFiles
  };
}
