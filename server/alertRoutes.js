import { acknowledgeAlert } from "./alertHelpers.js";

export function registerAlertRoutes(app, getAlerts, setAlerts) {
  app.post("/api/alerts/:id/acknowledge", (req, res) => {
    const { id } = req.params;
    const result = acknowledgeAlert(getAlerts(), id);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
        alertId: id,
      });
    }

    setAlerts(result.alerts);

    const acknowledged = result.alerts.find((alert) => alert._id === id);

    return res.json({
      success: true,
      alertId: id,
      status: acknowledged.status,
      acknowledgedAt: acknowledged.acknowledgedAt,
    });
  });
}
