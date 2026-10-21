export function acknowledgeAlert(alerts, id, acknowledgedAt = new Date().toISOString()) {
  let found = false;

  const updatedAlerts = alerts.map((alert) => {
    if (alert._id !== id) {
      return alert;
    }

    found = true;

    return {
      ...alert,
      status: "acknowledged",
      acknowledgedAt,
    };
  });

  return {
    alerts: updatedAlerts,
    found,
  };
}
