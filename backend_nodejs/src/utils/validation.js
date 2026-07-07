const Joi = require("joi");

const TRUCK_COMMANDS = [
  "F", "B", "S", "L", "R", "C", "U", "D", "X",
  "SC",
  "FL", "FR", "BL", "BR",
  "HH", "TI", "TO", "TX", "HA",
];

const SWITCH_ACTIONS = ["LEFT", "RIGHT", "CENTER"];

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().max(100).optional(),
  password: Joi.string().min(6).max(100).required(),
}).custom((value, helpers) => {
  if (!value.username && !value.email) {
    return helpers.message("Username ou email obrigatorio");
  }
  return value;
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid("admin", "operator", "viewer").optional().default("operator"),
});

const switchCommandSchema = Joi.object({
  switchId: Joi.number().integer().min(1).max(4).required(),
  action: Joi.string().valid(...SWITCH_ACTIONS).optional(),
  angle: Joi.number().min(0).max(180).optional(),
}).custom((value, helpers) => {
  if (!value.action && value.angle === undefined) {
    return helpers.message("É necessário fornecer 'action' ou 'angle'");
  }
  return value;
});

const telemetrySchema = Joi.object({
  deltaX: Joi.number().required(),
  deltaY: Joi.number().required(),
  speed: Joi.number().min(0).required(),
  load: Joi.number().min(0).required(),
  battery: Joi.number().min(0).max(100).required(),
  heading: Joi.number().min(0).max(360).required(),
});

const truckCommandSchema = Joi.object({
  command: Joi.string().valid(...TRUCK_COMMANDS).required(),
});

const locomotivePositionSchema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  speed: Joi.number().min(0).required(),
  heading: Joi.number().min(0).max(360).required(),
  trackSegment: Joi.string().max(50).allow(null, "").optional(),
});

const reportExportSchema = Joi.object({
  reportType: Joi.string().valid("switches", "trucks", "locomotive", "port", "airport", "alerts", "all").required(),
  format: Joi.string().valid("csv", "xlsx", "pdf").required(),
  filters: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    switchId: Joi.number().integer().min(1).max(4).optional(),
    truckId: Joi.string().max(10).optional(),
    severity: Joi.string().valid("info", "warning", "critical").optional(),
    module: Joi.string().valid("ferrovia", "mina", "porto", "aeroporto").optional(),
  }).optional().default({}),
});

const alertSchema = Joi.object({
  severity: Joi.string().valid("info", "warning", "critical").required(),
  module: Joi.string().valid("ferrovia", "mina", "porto", "aeroporto").required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  details: Joi.object().optional(),
});

const alertQuerySchema = Joi.object({
  module: Joi.string().valid("ferrovia", "mina", "porto", "aeroporto").optional(),
  severity: Joi.string().valid("info", "warning", "critical").optional(),
  acknowledged: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
});

module.exports = {
  loginSchema,
  registerSchema,
  switchCommandSchema,
  telemetrySchema,
  truckCommandSchema,
  locomotivePositionSchema,
  reportExportSchema,
  alertSchema,
  alertQuerySchema,
  TRUCK_COMMANDS,
  SWITCH_ACTIONS,
};
