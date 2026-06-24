const reportService = require("../services/reportService");
const logger = require("../config/logger");

module.exports = (io) => ({
  async postReportExport(req, res) {
    try {
      const { reportType, format, dateFrom, dateTo } = req.body;

      const report = await reportService.createReport(
        reportType,
        format,
        dateFrom,
        dateTo,
        req.user.id,
      );

      // Gerar relatório (assíncrono - simplificado)
      // Em produção, usar worker queue (Bull/Redis Queue)
      setTimeout(async () => {
        await reportService.updateReportStatus(report.id, "ready");
        io.emit("report:ready", { reportId: report.id, status: "ready" });
      }, 2000);

      res.json({ success: true, report });
    } catch (e) {
      logger.error(`Erro ao exportar relatório: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
