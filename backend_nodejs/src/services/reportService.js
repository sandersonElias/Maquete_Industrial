const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

const REPORTS_DIR = path.join(__dirname, "../../reports");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function fetchData(reportType, filters = {}) {
  const { startDate, endDate, switchId, truckId, severity, module } = filters;
  let query = "";
  const params = [];
  let paramIndex = 1;

  switch (reportType) {
    case "switches":
      query = `
        SELECT c.id, c.switch_id, c.command_type, c.action, c.angle,
               c.issued_at, c.executed_at, c.status, c.latency_ms,
               u.username as issued_by_name
        FROM commands c
        LEFT JOIN users u ON c.issued_by = u.id
        WHERE 1=1`;
      if (switchId) {
        query += ` AND c.switch_id = $${paramIndex++}`;
        params.push(switchId);
      }
      if (startDate) {
        query += ` AND c.issued_at >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND c.issued_at <= $${paramIndex++}`;
        params.push(endDate);
      }
      query += " ORDER BY c.issued_at DESC";
      break;

    case "trucks":
      query = `
        SELECT t.id as truck_id, t.current_x, t.current_y, t.current_load,
               t.battery_level, t.last_telemetry_at,
               tt.delta_x, tt.delta_y, tt.speed, tt.heading, tt.timestamp as telemetry_time
        FROM trucks t
        LEFT JOIN truck_telemetry tt ON t.id = tt.truck_id
        WHERE 1=1`;
      if (truckId) {
        query += ` AND t.id = $${paramIndex++}`;
        params.push(truckId);
      }
      if (startDate) {
        query += ` AND tt.timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND tt.timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }
      query += " ORDER BY tt.timestamp DESC";
      break;

    case "locomotive":
      query = `SELECT * FROM locomotive_position WHERE 1=1`;
      if (startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }
      query += " ORDER BY timestamp DESC";
      break;

    case "port":
      query = `SELECT * FROM ships ORDER BY eta`;
      break;

    case "alerts":
      query = `SELECT * FROM alerts WHERE 1=1`;
      if (severity) {
        query += ` AND severity = $${paramIndex++}`;
        params.push(severity);
      }
      if (module) {
        query += ` AND module = $${paramIndex++}`;
        params.push(module);
      }
      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(endDate);
      }
      query += " ORDER BY created_at DESC";
      break;

    case "all":
      const allQuery = `
        SELECT 'switch' as module, c.id, c.switch_id as identifier, c.action, c.status, c.issued_at as created_at
        FROM commands c
        UNION ALL
        SELECT 'truck' as module, tt.id, tt.truck_id as identifier, tt.speed::text as action, 'telemetry' as status, tt.timestamp as created_at
        FROM truck_telemetry tt
        UNION ALL
        SELECT 'locomotive' as module, lp.id, lp.track_segment as identifier, lp.speed::text as action, 'position' as status, lp.timestamp as created_at
        FROM locomotive_position lp
        UNION ALL
        SELECT 'alert' as module, a.id, a.module as identifier, a.severity as action, a.message as status, a.created_at
        FROM alerts a`;
      const dateConditions = [];
      if (startDate) {
        dateConditions.push(`created_at >= $${paramIndex++}`);
        params.push(startDate);
      }
      if (endDate) {
        dateConditions.push(`created_at <= $${paramIndex++}`);
        params.push(endDate);
      }
      query = dateConditions.length > 0
        ? `WITH all_data AS (${allQuery}) SELECT * FROM all_data WHERE ${dateConditions.join(" AND ")} ORDER BY created_at DESC`
        : `WITH all_data AS (${allQuery}) SELECT * FROM all_data ORDER BY created_at DESC`;
      break;
  }

  const result = await pool.query(query, params);
  return result.rows;
}

function generateCSV(data, filename) {
  if (!data || data.length === 0) return null;
  const parser = new Parser();
  const csv = parser.parse(data);
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, csv, "utf-8");
  return filePath;
}

function generateXLSX(data, filename) {
  if (!data || data.length === 0) return null;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  const filePath = path.join(REPORTS_DIR, filename);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

function generatePDF(data, filename, reportType) {
  return new Promise((resolve, reject) => {
    if (!data || data.length === 0) return resolve(null);

    const filePath = path.join(REPORTS_DIR, filename);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text(`Relatório: ${reportType.toUpperCase()}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    doc.moveDown();

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidth = Math.floor(500 / headers.length);

      doc.fontSize(8).font("Helvetica-Bold");
      headers.forEach((h, i) => {
        doc.text(h, 40 + i * colWidth, doc.y, { width: colWidth, continued: false });
      });
      doc.moveDown();
      doc.font("Helvetica");

      const maxRows = Math.min(data.length, 50);
      for (let r = 0; r < maxRows; r++) {
        if (doc.y > 750) {
          doc.addPage();
        }
        headers.forEach((h, i) => {
          const val = data[r][h] !== null && data[r][h] !== undefined ? String(data[r][h]) : "";
          doc.text(val.substring(0, 30), 40 + i * colWidth, doc.y, { width: colWidth, continued: false });
        });
        doc.moveDown(0.3);
      }

      if (data.length > maxRows) {
        doc.moveDown();
        doc.text(`... e mais ${data.length - maxRows} registros`);
      }
    }

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

async function createReport(reportType, format, filters, userId) {
  const reportResult = await pool.query(
    `INSERT INTO reports (report_type, format, filters, generated_by, status)
     VALUES ($1, $2, $3, $4, 'generating') RETURNING *`,
    [reportType, format, JSON.stringify(filters), userId],
  );
  return reportResult.rows[0];
}

async function generateReportFile(reportId, reportType, format, filters) {
  const data = await fetchData(reportType, filters);
  if (!data || data.length === 0) {
    await pool.query(
      "UPDATE reports SET status = 'failed', completed_at = NOW() WHERE id = $1",
      [reportId],
    );
    return null;
  }

  const timestamp = Date.now();
  let filePath = null;
  let filename = "";

  switch (format) {
    case "csv":
      filename = `${reportType}_${timestamp}.csv`;
      filePath = generateCSV(data, filename);
      break;
    case "xlsx":
      filename = `${reportType}_${timestamp}.xlsx`;
      filePath = generateXLSX(data, filename);
      break;
    case "pdf":
      filename = `${reportType}_${timestamp}.pdf`;
      filePath = await generatePDF(data, filename, reportType);
      break;
  }

  if (filePath) {
    await pool.query(
      "UPDATE reports SET status = 'ready', file_path = $1, completed_at = NOW() WHERE id = $2",
      [filePath, reportId],
    );
    return filePath;
  }

  await pool.query(
    "UPDATE reports SET status = 'failed', completed_at = NOW() WHERE id = $1",
    [reportId],
  );
  return null;
}

async function getReportById(id) {
  const result = await pool.query("SELECT * FROM reports WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function listReports(limit = 50) {
  const result = await pool.query(
    `SELECT id, report_type, format, status, created_at, completed_at
     FROM reports
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function updateReportStatus(reportId, status) {
  await pool.query(
    "UPDATE reports SET status = $1, completed_at = NOW() WHERE id = $2",
    [status, reportId],
  );
}

module.exports = {
  createReport,
  generateReportFile,
  getReportById,
  listReports,
  updateReportStatus,
};
