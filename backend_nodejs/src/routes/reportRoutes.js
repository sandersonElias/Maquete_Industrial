const express = require("express");

module.exports = (io) => {
  const reportController = require("../controllers/reportController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  router.post("/export", authenticateToken, reportController.postReportExport);

  return router;
};
