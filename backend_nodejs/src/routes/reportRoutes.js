const express = require("express");

module.exports = (io) => {
  const reportController = require("../controllers/reportController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");
  const validate = require("../middlewares/validate");
  const { reportExportSchema } = require("../utils/validation");

  const router = express.Router();

  router.post("/export", authenticateToken, validate(reportExportSchema), reportController.postReportExport);
  router.get("/:id/download", authenticateToken, reportController.getReportDownload);

  return router;
};
