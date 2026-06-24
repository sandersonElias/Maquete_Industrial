const pool = require("../config/db");

async function createReport(reportType, format, dateFrom, dateTo, userId) {
  const reportResult = await pool.query(
    `INSERT INTO reports (report_type, format, filters, generated_by, status)
     VALUES ($1, $2, $3, $4, 'generating') RETURNING *`,
    [reportType, format, JSON.stringify({ dateFrom, dateTo }), userId],
  );
  return reportResult.rows[0];
}

async function updateReportStatus(reportId, status) {
  await pool.query(
    "UPDATE reports SET status = $1, completed_at = NOW() WHERE id = $2",
    [status, reportId],
  );
}

module.exports = {
  createReport,
  updateReportStatus,
};
