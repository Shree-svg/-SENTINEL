import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { registerAlertRoutes } from '../server/alertRoutes.js';

test('TC-16 API: existing synthetic alert is acknowledged', async () => {
  const app = express();
  app.use(express.json());
  let alerts = [{ _id: 'alert-test-1', status: 'active' }];
  registerAlertRoutes(app, () => alerts, (newAlerts) => { alerts = newAlerts; });

  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/alerts/alert-test-1/acknowledge`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'acknowledged');
    assert.strictEqual(alerts[0].status, 'acknowledged');
  } finally {
    server.close();
  }
});

test('TC-16 API: unknown alert ID returns HTTP 404', async () => {
  const app = express();
  app.use(express.json());
  let alerts = [{ _id: 'alert-test-1', status: 'active' }];
  registerAlertRoutes(app, () => alerts, (newAlerts) => { alerts = newAlerts; });

  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/alerts/nonexistent/acknowledge`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  } finally {
    server.close();
  }
});
