const reportService = require("../services/reportService");
const logger = require("../config/logger");
const path = require("path");

module.exports = (io) => ({
  async postReportExport(req, res) {
    try {
      const { reportType, format, filters } = req.body;

      const report = await reportService.createReport(
        reportType,
        format,
        filters,
        req.user.id,
      );

      reportService
        .generateReportFile(report.id, reportType, format, filters)
        .then((filePath) => {
          if (filePath) {
            io.emit("report:ready", { reportId: report.id, status: "ready" });
          } else {
            io.emit("report:ready", { reportId: report.id, status: "failed" });
          }
        })
        .catch((err) => {
          logger.error(`Erro ao gerar arquivo de relatório: ${err.message}`);
          reportService.updateReportStatus(report.id, "failed");
          io.emit("report:ready", { reportId: report.id, status: "failed" });
        });

      res.json({ success: true, report });
    } catch (e) {
      logger.error(`Erro ao exportar relatório: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async getReportDownload(req, res) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);

      if (!report) {
        return res.status(404).json({ error: "Relatório não encontrado" });
      }

      if (report.status !== "ready" || !report.file_path) {
        return res.status(400).json({ error: "Relatório ainda não está pronto" });
      }

      const filename = path.basename(report.file_path);
      const format = report.format;
      const mimeTypes = {
        csv: "text/csv",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        pdf: "application/pdf",
      };

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", mimeTypes[format] || "application/octet-stream");
      res.sendFile(report.file_path);
    } catch (e) {
      logger.error(`Erro ao baixar relatório: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
