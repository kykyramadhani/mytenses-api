const notificationModel = require("../models/notificationModel");

const notificationController = {
  async triggerNotification(req, res) {
    try {
      const result = await notificationModel.triggerNotification();
      res.status(200).json({
        message: "Broadcast notifications processed",
        successCount: result.successCount,
        failedCount: result.failedCount,
        total: result.total,
        logs: result.logs,
      });
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ error: "Failed to process broadcast", details: error.message });
    }
  },
};

module.exports = notificationController;