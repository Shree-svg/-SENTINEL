import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgeAlert } from '../server/alertHelpers.js';

test('TC-16: matching alert becomes acknowledged', () => {
  const alerts = [
    { _id: 'alert-1', status: 'active' },
    { _id: 'alert-2', status: 'active' }
  ];
  const result = acknowledgeAlert(alerts, 'alert-1');
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.alerts[0].status, 'acknowledged');
  assert.ok(result.alerts[0].acknowledgedAt);
  assert.strictEqual(result.alerts[1].status, 'active');
});

test('TC-16: unknown alert ID does not modify existing alerts', () => {
  const alerts = [
    { _id: 'alert-1', status: 'active' }
  ];
  const result = acknowledgeAlert(alerts, 'unknown-id');
  assert.strictEqual(result.found, false);
  assert.strictEqual(result.alerts[0].status, 'active');
});
